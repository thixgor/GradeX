import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkRateLimitSync } from '@/lib/api-security'
import {
  expandPreviewPages,
  getClientIp,
  validateMaterialPdfAccess,
} from '@/lib/material-pdf-viewer'
import { checkPlusDownloadAllowance, recordPlusDownload } from '@/lib/plus-guard'
import { emailFingerprint } from '@/lib/watermark-fingerprint'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Abrir o viewer é barato (sem render de PDF), mas agora aceita visitante
// (sem login) para a prévia — então precisa de um piso de rate limit por IP
// para não virar vetor de flood/DoS sem a fricção de uma conta.
const ACCESS_RATE_LIMIT_IP = { limit: 60, windowMs: 60_000 }
// Visitante (sem sessão) é o público novo e sem fricção nenhuma: limite mais
// apertado, só nesse caso.
const ACCESS_RATE_LIMIT_GUEST = { limit: 20, windowMs: 60_000 }

function rateLimitedResponse(retryAfterMs: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000))
  return NextResponse.json(
    { error: 'Muitas tentativas. Tente novamente em instantes.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ip = getClientIp(request)
    const generalLimit = checkRateLimitSync(ip, 'pdf-viewer-access', ACCESS_RATE_LIMIT_IP)
    if (!generalLimit.success) {
      return rateLimitedResponse(generalLimit.retryAfterMs || 60_000)
    }

    const session = await getSession()

    if (!session) {
      const guestLimit = checkRateLimitSync(ip, 'pdf-viewer-access-guest', ACCESS_RATE_LIMIT_GUEST)
      if (!guestLimit.success) {
        return rateLimitedResponse(guestLimit.retryAfterMs || 60_000)
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

    // Plus+ Guard: abrir o leitor em modo pleno (não-prévia) é o equivalente,
    // para efeito de cota, a baixar o material — o conteúdo inteiro é servido
    // por aqui mesmo sem um botão de "download". Sem esta checagem, alguém
    // podia abrir centenas de materiais no leitor sem nunca bater na cota
    // aplicada em /api/materiais/download.
    if (access.accessLevel === 'full' && session) {
      const allowance = await checkPlusDownloadAllowance({
        userId: session.userId,
        user: access.user,
        isAdmin: access.isAdmin,
        db: access.db,
      })
      if (!allowance.allowed) {
        return NextResponse.json(
          { error: allowance.message || 'Limite de leitura atingido.', reason: allowance.reason, retryAt: allowance.retryAt },
          { status: 429 },
        )
      }
    }

    const cachedPageCount = Number(access.material.pdfFile?.pageCount || 0)
    const totalPages = cachedPageCount > 0 ? cachedPageCount : 1

    // Configuração de capa / sumário / navegação definida pelo admin. Recorta as
    // páginas ao intervalo conhecido para nunca apontar para fora do documento.
    const viewerConfig = access.material.pdfViewerConfig || {}
    const clampPage = (page: any) => {
      const n = Math.floor(Number(page))
      if (!Number.isFinite(n) || n < 1) return null
      return totalPages > 1 ? Math.min(n, totalPages) : n
    }
    const summary = Array.isArray(viewerConfig.summary)
      ? viewerConfig.summary
          .map((item: any) => {
            const page = clampPage(item?.page)
            const title = String(item?.title || '').trim()
            if (!page || !title) return null
            return {
              id: String(item?.id || `${title}-${page}`),
              title,
              page,
              level: Math.min(2, Math.max(0, Math.floor(Number(item?.level) || 0))),
            }
          })
          .filter(Boolean)
      : []
    const navigation = Array.isArray(viewerConfig.navigation)
      ? viewerConfig.navigation
          .map((item: any) => {
            const page = clampPage(item?.page)
            const label = String(item?.label || '').trim()
            if (!page || !label) return null
            return { id: String(item?.id || `${label}-${page}`), label, page }
          })
          .filter(Boolean)
      : []
    let coverPage = clampPage(viewerConfig.coverPage) || undefined

    // Modo prévia: usuário sem acesso pleno vê apenas as páginas liberadas.
    // Recortamos os intervalos ao total real e enviamos a lista achatada para o
    // cliente restringir navegação/miniaturas. O bloqueio de verdade continua no
    // route /page (servidor); isto aqui é só para a UX não oferecer o proibido.
    const isPreview = access.accessLevel === 'preview'
    // Usa a contagem real (cachedPageCount); quando ainda desconhecida (0), não
    // recorta — o cliente ajusta ao descobrir o total ao renderizar as páginas.
    const previewPages = isPreview ? expandPreviewPages(access.previewRanges, cachedPageCount) : []
    const previewRanges = isPreview
      ? access.previewRanges
          .map((range) => ({
            start: cachedPageCount > 0 ? Math.min(range.start, cachedPageCount) : range.start,
            end: cachedPageCount > 0 ? Math.min(range.end, cachedPageCount) : range.end,
          }))
          .filter((range) => range.start <= range.end)
      : []

    // Na prévia, a capa/sumário/navegação só podem apontar para páginas liberadas.
    if (isPreview) {
      if (coverPage && !previewPages.includes(coverPage)) {
        coverPage = previewPages[0]
      }
    }
    const previewSummary = isPreview
      ? summary.filter((item: any) => previewPages.includes(item.page))
      : summary
    const previewNavigation = isPreview
      ? navigation.filter((item: any) => previewPages.includes(item.page))
      : navigation

    const now = new Date()
    const auditToken = crypto.randomUUID()

    access.db.collection('material_pdf_viewer_logs').insertOne({
      userId: session?.userId || null,
      userName: session?.name || 'Visitante (sem login)',
      userEmail: session?.email || null,
      isGuest: !session,
      materialId: access.materialId,
      materialTitle: access.material.title,
      action: 'viewer_open',
      auditToken,
      ip,
      userAgent: request.headers.get('user-agent') || 'unknown',
      createdAt: now,
    }).catch((error) => console.error('[pdf-viewer/access] Falha ao logar abertura:', error))

    if (access.accessLevel === 'full' && session) {
      recordPlusDownload({
        userId: session.userId,
        userEmail: session.email,
        userName: session.name,
        accountType: access.user?.accountType,
        kind: 'material',
        resourceId: access.materialId,
        resourceTitle: access.material.title,
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
        watermarkFingerprint: emailFingerprint(session.email),
        db: access.db,
      }).catch(() => {})
    }

    return NextResponse.json(
      {
        material: {
          id: access.materialId,
          title: access.material.title,
          pageCount: totalPages,
          viewerEnabled: access.material.pdfViewerEnabled === true,
          // Prévia nunca permite download do arquivo completo.
          downloadEnabled: isPreview ? false : access.material.pdfDownloadEnabled !== false,
        },
        audit: {
          openedAt: now.toISOString(),
        },
        viewer: {
          // Rolagem contínua é o padrão: é o gesto que o leitor já conhece de
          // qualquer app. O modo 'single' (uma página por vez) exigia clicar
          // para avançar e era a reclamação nº 1 dos usuários — pior ainda
          // porque o seletor de modo estava escondido no celular. Quem já tem
          // um modo salvo no localStorage continua com o dele (o cliente
          // resolve `saved.mode || defaultMode`).
          defaultMode: 'continuous',
          minZoom: 0.35,
          maxZoom: 2.8,
          coverPage,
          summary: previewSummary,
          navigation: previewNavigation,
        },
        // Presente apenas quando o usuário está em modo prévia (não comprou).
        preview: isPreview
          ? {
              active: true,
              pages: previewPages,
              ranges: previewRanges,
              totalPages,
            }
          : null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  } catch (error) {
    console.error('[pdf-viewer/access] Erro:', error)
    return NextResponse.json(
      { error: 'Nao foi possivel abrir o visualizador. Tente novamente.' },
      { status: 500 }
    )
  }
}
