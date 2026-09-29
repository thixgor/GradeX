import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import type { TokenPayload } from './auth'
import { diaEmBrasilia, inicioDoDiaSeguinteEmBrasilia } from './fuso-brasilia'
import { buscarPaginaDerivada, fonteDoPdf, gravarPaginaDerivada } from './material-pdf-pages'
import {
  createWatermarkedSinglePagePdf,
  fetchMaterialPdfBytes,
  guestFingerprint,
  type MaterialPdfAccessResult,
} from './material-pdf-viewer'

/**
 * A página marcada do leitor de materiais: o que as rotas `/pdf-viewer/page` e
 * `/pdf-viewer/thumb` entregam.
 *
 * ## Uma página só, nos dois lugares
 *
 * A miniatura já teve rota própria que devolvia a página NUA: o PDF inteiro da
 * página, em resolução total, sem marca d'água e sem registro de auditoria.
 * Quem tinha acesso ao material podia pedir `/thumb?page=1…N` e baixar o livro
 * limpo, o que anulava a marca d'água da leitura. Agora as duas rotas entregam
 * a mesma coisa: a página marcada com os dados de quem pediu, e com log.
 *
 * Isso também deixou a conta mais barata: sendo iguais, os bytes da leitura
 * servem à miniatura e os da miniatura servem à leitura. Antes, uma página que
 * aparecia no leitor e no painel era baixada duas vezes.
 *
 * ## Janela de um dia
 *
 * O token de auditoria era por janela de 5 minutos, e o navegador guardava a
 * página por 5 minutos. Quem voltava a um material mais tarde no mesmo dia
 * (o normal de quem estuda) baixava tudo de novo, e essa rota respondia por
 * ~67% do Fast Origin Transfer do projeto. Agora a janela é o dia de Brasília:
 * a mesma pessoa, na mesma página, na mesma versão do PDF, recebe a mesma
 * página marcada até a meia-noite, e o navegador a guarda até lá.
 *
 * A marca d'água não perde nada com isso: continua com nome, e-mail, UID e o
 * horário real em que aquela cópia foi gerada. O log registra cada página que o
 * servidor gera.
 *
 * ## Por que a URL leva uma chave (`c`)
 *
 * O cache do navegador é do aparelho, não da pessoa. Num computador
 * compartilhado, a aluna B receberia do cache a página marcada com o nome da
 * aluna A, e um vazamento feito por B apontaria para A. A chave depende de
 * quem está lendo, do material e da versão do PDF: pessoa diferente ou PDF
 * reenviado pelo admin é URL diferente. O servidor confere a chave. Se ela não
 * bater com a sessão (aba antiga depois de trocar de conta, cliente antigo sem
 * `c`), a página é entregue do mesmo jeito, só que sem permissão de cache.
 */

export type OrigemDaPagina = 'leitura' | 'miniatura'

type AcessoLiberado = Extract<MaterialPdfAccessResult, { ok: true }>

/** Quem está lendo: o usuário, ou a impressão de IP + navegador do visitante. */
export function identidadeDoLeitor(
  session: TokenPayload | null,
  ip: string,
  userAgent: string
): string {
  return session ? session.userId : guestFingerprint(ip, userAgent)
}

/** Versão do PDF do material. Muda quando o admin reenvia o arquivo. */
export function versaoDoPdf(pdfFile: any): string {
  const fonte = fonteDoPdf(pdfFile)
  if (fonte) return fonte.versao
  return createHash('sha256').update(String(pdfFile?.blobUrl || '')).digest('hex').slice(0, 16)
}

/** A chave `c` da URL: pessoa + material + versão, opaca. */
export function chaveDeLeitura(identidade: string, materialId: string, versao: string): string {
  return createHash('sha256')
    .update(`leitura|${identidade}|${materialId}|${versao}`)
    .digest('hex')
    .slice(0, 20)
}

/**
 * Token de auditoria da página: pessoa, material, página, dia e versão.
 *
 * Leva o id COMPLETO de quem lê. Ele é também a chave do cache de páginas
 * renderizadas em memória (`createWatermarkedSinglePagePdf`); com só os
 * últimos 8 caracteres do id, dois usuários com o mesmo final poderiam receber
 * um a página marcada do outro.
 */
export function tokenDeAuditoria(input: {
  identidade: string
  materialId: string
  pagina: number
  dia: string
  versao: string
}): string {
  return [
    input.identidade,
    input.materialId.slice(-8),
    input.pagina,
    input.dia,
    input.versao.slice(0, 8),
  ].join('-')
}

/**
 * Por quanto tempo o navegador pode guardar a página: até a meia-noite de
 * Brasília, quando o token muda. Nunca menos de 1 minuto nem mais de 1 dia.
 */
export function segundosAteVirarODia(agora: Date): number {
  const fim = inicioDoDiaSeguinteEmBrasilia(agora).getTime()
  const segundos = Math.floor((fim - agora.getTime()) / 1000)
  return Math.min(86_400, Math.max(60, segundos))
}

export function cacheControlDaPagina(cacheavel: boolean, agora: Date): string {
  return cacheavel ? `private, max-age=${segundosAteVirarODia(agora)}` : 'private, no-store'
}

/**
 * Gera (ou reaproveita) a página marcada e monta a resposta. Quem chama já
 * validou o acesso, a faixa da prévia e o número da página.
 */
export async function responderPaginaMarcada(params: {
  request: NextRequest
  session: TokenPayload | null
  access: AcessoLiberado
  ip: string
  pagina: number
  origem: OrigemDaPagina
}): Promise<NextResponse> {
  const { request, session, access, ip, pagina, origem } = params
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const agora = new Date()

  const identidade = identidadeDoLeitor(session, ip, userAgent)
  const versao = versaoDoPdf(access.material.pdfFile)
  const auditToken = tokenDeAuditoria({
    identidade,
    materialId: access.materialId,
    pagina,
    dia: diaEmBrasilia(agora),
    versao,
  })
  const cacheavel =
    request.nextUrl.searchParams.get('c') === chaveDeLeitura(identidade, access.materialId, versao)

  const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
  // Identidade do PDF-fonte. Serve de chave tanto para as derivadas de
  // página no Blob quanto para os caches em memória do render — e, por
  // incluir tamanho e data do upload, um reenvio com o mesmo nome de arquivo
  // (que produz a MESMA blobUrl) invalida os dois de uma vez.
  const fonte = fonteDoPdf(access.material.pdfFile)

  // Quando a página já tem derivada gravada, `loadFull` nunca é chamado: a
  // requisição lê algumas centenas de KB em vez do material inteiro.
  const pagePdf = await createWatermarkedSinglePagePdf(
    {
      knownTotalPages: cachedPageCount,
      loadSlice: fonte ? () => buscarPaginaDerivada(fonte, pagina) : undefined,
      loadFull: () => fetchMaterialPdfBytes(access.material.pdfFile.blobUrl),
      onSliceReady: fonte
        ? (numero, bytes) => gravarPaginaDerivada(fonte, numero, bytes)
        : undefined,
    },
    {
      pageNumber: pagina,
      userName: session
        ? access.user?.name || session.name || 'Usuario DomineAqui'
        : 'Visitante (previa gratuita)',
      userEmail: session
        ? access.user?.email || session.email || 'email nao informado'
        : `previa-${identidade}`,
      userId: identidade,
      materialId: access.materialId,
      materialTitle: access.material.title || 'Material DomineAqui',
      viewedAt: agora,
      auditToken,
      sourceCacheKey: fonte?.chave || access.material.pdfFile.blobUrl,
    }
  )

  if (pagina > pagePdf.totalPages) {
    return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
  }

  if (!cachedPageCount && pagePdf.totalPages > 0) {
    access.db
      .collection('materials')
      .updateOne(
        { _id: new ObjectId(access.materialId) },
        { $set: { 'pdfFile.pageCount': pagePdf.totalPages, updatedAt: new Date() } }
      )
      .catch((error) => console.error('[pdf-viewer] Falha ao salvar pageCount:', error))
  }

  // Toda página marcada que sai daqui tem registro, venha da leitura ou da
  // miniatura: é o que liga o token impresso na página a quem a recebeu.
  access.db
    .collection('material_pdf_viewer_logs')
    .insertOne({
      userId: session?.userId || null,
      userName: session?.name || 'Visitante (sem login)',
      userEmail: session?.email || null,
      isGuest: !session,
      materialId: access.materialId,
      materialTitle: access.material.title,
      action: 'page_render',
      origem,
      pageNumber: pagina,
      auditToken,
      ip,
      userAgent,
      createdAt: agora,
    })
    .catch((error) => console.error('[pdf-viewer] Falha ao logar pagina:', error))

  return new NextResponse(Buffer.from(pagePdf.bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="domineaqui-page-${pagina}.pdf"`,
      'Content-Length': String(pagePdf.bytes.byteLength),
      'Cache-Control': cacheControlDaPagina(cacheavel, agora),
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-DomineAqui-Page-Count': String(pagePdf.totalPages),
    },
  })
}
