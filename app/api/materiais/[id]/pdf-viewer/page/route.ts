import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import {
  getClientIp,
  isPreviewPageAllowed,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import { responderPaginaMarcada } from '@/lib/material-pdf-leitura'

export const dynamic = 'force-dynamic'
// Materiais grandes (escaneados, dezenas/centenas de MB — acima do teto de
// contar páginas no upload, ver MATERIAL_PAGECOUNT_MAX_MB) baixam o PDF
// inteiro e o parseiam do zero numa instância fria: isso sozinho já passava
// de 60s, e o cliente (PAGE_FETCH_TIMEOUT_MS) dava timeout ANTES da função
// terminar — toda tentativa era abortada cedo demais para ter chance de
// terminar, então a página nunca abria, sempre para o mesmo material grande.
// 120s dá fôlego real para esse parse frio; memória subiu para 2048MB pelo
// mesmo motivo (pdf-lib carrega o documento inteiro em memória).
export const maxDuration = 120

// Esta rota é a mais cara em CPU do app (parse + copyPages + watermark por
// página). Agora aceita visitante (sem login) para a prévia, então o limite
// por IP é a única barreira contra flood — sem ele, um script anônimo
// derrubaria a instância só de request. O teto geral fica folgado o
// suficiente para não travar leitores legítimos em modo contínuo (várias
// páginas carregam de uma vez); o teto de visitante é bem mais apertado.
const PAGE_RATE_LIMIT_IP = { limit: 90, windowMs: 60_000 }
const PAGE_RATE_LIMIT_GUEST = { limit: 24, windowMs: 60_000 }

function rateLimitedPdfResponse(retryAfterMs: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return NextResponse.json(
    { error: 'Muitas paginas carregadas em pouco tempo. Aguarde um instante.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Declarado fora do try para o catch poder decidir se expõe o erro real
  // (só pra admin — ver comentário no catch abaixo).
  let isAdminCaller = false
  try {
    const ip = getClientIp(request)
    const generalLimit = checkRateLimitSync(ip, 'pdf-viewer-page', PAGE_RATE_LIMIT_IP)
    if (!generalLimit.success) {
      return rateLimitedPdfResponse(generalLimit.retryAfterMs || 60_000)
    }

    const session = await getSession()
    isAdminCaller = session?.role === 'admin'

    if (!session) {
      const guestLimit = checkRateLimitSync(ip, 'pdf-viewer-page-guest', PAGE_RATE_LIMIT_GUEST)
      if (!guestLimit.success) {
        return rateLimitedPdfResponse(guestLimit.retryAfterMs || 60_000)
      }
    }

    const access = await validateMaterialPdfAccess(params.id, session, {
      requireViewerEnabled: true,
      requirePdf: true,
      allowPreview: true,
    })

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const pageParam = request.nextUrl.searchParams.get('page') || '1'
    const requestedPage = Number.parseInt(pageParam, 10)
    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      return NextResponse.json({ error: 'Pagina invalida' }, { status: 400 })
    }

    // SEGURANÇA: quem está no modo prévia (não comprou) só pode buscar os bytes
    // das páginas liberadas pelo admin. Qualquer outra página é bloqueada AQUI,
    // no servidor — não há como burlar pelo cliente/viewer, pois o PDF nunca é
    // enviado por inteiro; cada página é uma requisição separada.
    if (access.accessLevel === 'preview' && !isPreviewPageAllowed(requestedPage, access.previewRanges)) {
      return NextResponse.json(
        { error: 'Esta pagina nao esta disponivel na previa. Adquira o material para acessar o conteudo completo.' },
        { status: 403 }
      )
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    if (cachedPageCount > 0 && requestedPage > cachedPageCount) {
      return NextResponse.json({ error: 'Pagina fora do intervalo' }, { status: 400 })
    }

    // Token, marca d'água, log e cache: ver lib/material-pdf-leitura.ts. A
    // miniatura (`../thumb`) passa pelo mesmo caminho e recebe a mesma página.
    return await responderPaginaMarcada({
      request,
      session,
      access,
      ip,
      pagina: requestedPage,
      origem: 'leitura',
    })
  } catch (error) {
    console.error('[pdf-viewer/page] Erro:', error)
    return NextResponse.json(
      {
        error: 'Nao foi possivel carregar esta pagina do PDF.',
        // Motivo real só pra admin: a mensagem genérica acima é o que o
        // usuário final vê, mas sem isso, diagnosticar uma falha de render
        // específica de um material dependia de olhar os logs do servidor.
        ...(isAdminCaller
          ? { adminDetail: error instanceof Error ? error.message : String(error) }
          : {}),
      },
      { status: 500 }
    )
  }
}
