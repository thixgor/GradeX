import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import type { TokenPayload } from './auth'
import {
  diaEmBrasilia,
  inicioDoDiaEmBrasilia,
  inicioDoDiaSeguinteEmBrasilia,
} from './fuso-brasilia'
import { buscarPaginaEnxuta, fonteDoPdf, gravarDerivadasDaBruta } from './material-pdf-pages'
import { corpoComprimido } from './resposta-comprimida'
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
 * A miniatura passou, depois, a ter versão própria e mais leve (ver "Leitura e
 * miniatura não são mais a mesma página", abaixo).
 *
 * ## Janela de uma semana
 *
 * O token de auditoria já foi por janela de 5 minutos, depois por dia. Quem
 * estuda volta ao mesmo material vários dias seguidos, e a cada dia baixava de
 * novo as mesmas páginas, marcadas com o mesmo nome: essa rota respondia por
 * ~69% do Fast Origin Transfer do projeto. Agora a janela é a semana de
 * Brasília (segunda 00:00 até a segunda seguinte): a mesma pessoa, na mesma
 * página, na mesma versão do PDF, recebe a mesma página marcada a semana toda,
 * e o navegador a guarda até lá. `PDF_VIEWER_JANELA=dia` volta à janela diária.
 *
 * A marca d'água não perde nada com isso: continua com nome, e-mail, UID e o
 * horário real em que aquela cópia foi gerada. O log registra cada página que o
 * servidor gera. Quem tem acesso por tempo limitado nunca recebe permissão de
 * guardar a página além do fim do próprio acesso.
 *
 * ## Leitura e miniatura não são mais a mesma página
 *
 * A miniatura do painel lateral é desenhada com 150 px de largura, mas recebia
 * a página inteira, com as imagens em resolução de leitura. Agora ela vem da
 * derivada `miniatura` (ver `lib/material-pdf-pages.ts`): mesma marca, mesmo
 * log, imagens do tamanho do painel — dezenas de KB em vez de centenas. O
 * leitor ainda usa uma página de leitura que já tenha em mãos para desenhar a
 * miniatura, mas nunca o contrário.
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
 * Token de auditoria da página: pessoa, material, página, janela e versão.
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
  /** Identificador da janela de leitura (ver `janelaDeLeitura`). */
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

const MS_POR_DIA = 24 * 60 * 60 * 1000

export interface JanelaDeLeitura {
  /** Entra no token de auditoria: muda quando a janela vira. */
  id: string
  /** Instante em que a janela termina (exclusivo). */
  fim: Date
}

/**
 * A janela em que a mesma página marcada vale para a mesma pessoa.
 *
 * Semana de Brasília, de segunda 00:00 até a segunda seguinte. Com
 * `PDF_VIEWER_JANELA=dia`, o dia de Brasília (o comportamento anterior).
 */
export function janelaDeLeitura(agora: Date): JanelaDeLeitura {
  const dia = diaEmBrasilia(agora)
  if ((process.env.PDF_VIEWER_JANELA || '').toLowerCase() === 'dia') {
    return { id: dia, fim: inicioDoDiaSeguinteEmBrasilia(agora) }
  }
  // Meio-dia UTC do dia de Brasília: longe da meia-noite, o dia da semana
  // calculado em UTC é o mesmo de Brasília.
  const meioDia = new Date(`${dia}T12:00:00Z`)
  const desdeSegunda = (meioDia.getUTCDay() + 6) % 7
  const segunda = new Date(meioDia.getTime() - desdeSegunda * MS_POR_DIA)
  const proximaSegunda = new Date(segunda.getTime() + 7 * MS_POR_DIA)
  return {
    id: `sem${segunda.toISOString().slice(0, 10)}`,
    fim: inicioDoDiaEmBrasilia(proximaSegunda),
  }
}

/**
 * Por quanto tempo o navegador pode guardar a página: até o fim da janela,
 * quando o token muda — ou até o fim do acesso por tempo, se vier antes. Nunca
 * menos de 1 minuto nem mais de 7 dias.
 */
export function segundosAteFimDaJanela(agora: Date, acessoAte?: Date | null): number {
  let fim = janelaDeLeitura(agora).fim.getTime()
  if (acessoAte && Number.isFinite(acessoAte.getTime())) fim = Math.min(fim, acessoAte.getTime())
  const segundos = Math.floor((fim - agora.getTime()) / 1000)
  return Math.min(7 * 86_400, Math.max(60, segundos))
}

export function cacheControlDaPagina(
  cacheavel: boolean,
  agora: Date,
  acessoAte?: Date | null
): string {
  return cacheavel ? `private, max-age=${segundosAteFimDaJanela(agora, acessoAte)}` : 'private, no-store'
}

/** Fim do acesso por tempo, quando o acesso veio de uma versão com prazo. */
function fimDoAcessoPorTempo(access: AcessoLiberado): Date | null {
  const prazo = access.timedAccess
  if (!prazo?.isTimed || !prazo.expiresAt) return null
  const fim = new Date(prazo.expiresAt)
  return Number.isFinite(fim.getTime()) ? fim : null
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
    dia: janelaDeLeitura(agora).id,
    versao,
  })
  // A versão leve da miniatura só vai para quem a pede com `m=1`, o leitor
  // atual. O leitor de antes desta mudança (uma aba que continuou aberta
  // durante o deploy) guarda miniatura e leitura sob a mesma chave na memória
  // e mostraria a miniatura como página de leitura, borrada. Para ele, a
  // miniatura continua sendo a página de leitura, como sempre foi.
  const variante =
    origem === 'miniatura' && request.nextUrl.searchParams.get('m') === '1' ? 'miniatura' : 'leitura'
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
      loadSlice: fonte ? () => buscarPaginaEnxuta(fonte, pagina, variante) : undefined,
      loadFull: () => fetchMaterialPdfBytes(access.material.pdfFile.blobUrl),
      onSliceReady: fonte
        ? (numero, bytes) => gravarDerivadasDaBruta(fonte, numero, bytes, variante)
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
      renderCacheKey: `${auditToken}|${variante}`,
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

  // Página de texto cai pela metade com gzip; escaneada quase não muda e sai
  // como está (ver `lib/resposta-comprimida.ts`).
  const { corpo, cabecalhos } = corpoComprimido(request.headers, pagePdf.bytes)

  return new NextResponse(Buffer.from(corpo), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="domineaqui-page-${pagina}.pdf"`,
      ...cabecalhos,
      'Cache-Control': cacheControlDaPagina(cacheavel, agora, fimDoAcessoPorTempo(access)),
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-DomineAqui-Page-Count': String(pagePdf.totalPages),
      'X-DomineAqui-Variante': variante,
    },
  })
}
