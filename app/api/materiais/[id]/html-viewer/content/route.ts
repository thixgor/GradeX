/**
 * Serve o conteúdo HTML de um material COM watermark indexada.
 *
 * Este é o único caminho pelo qual o HTML chega ao cliente — o blobUrl real
 * nunca é exposto. Valida acesso (compra/grupo/admin), injeta a marca d'água
 * rastreável e responde com uma CSP segura que ainda permite CSS/JS inline e
 * assets de CDN https (fidelidade total da experiência).
 *
 * A resposta é embutida num <iframe sandbox> (origem opaca) pelo leitor, então
 * o script da experiência nunca acessa a sessão/cookies do usuário.
 *
 * GET /api/materiais/[id]/html-viewer/content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import {
  validateMaterialHtmlAccess,
  fetchMaterialHtml,
  buildWatermarkedHtml,
  logHtmlViewerAccess,
} from '@/lib/material-html-viewer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// CSP permissiva-porém-segura: o conteúdo é autorado pelo próprio vendedor
// (admin) e a real isolação vem do `sandbox` do iframe (origem opaca, sem
// acesso à sessão do pai). Aqui liberamos amplamente estilos/scripts inline,
// workers e sub-recursos (https/data/blob) para garantir que experiências
// ricas — inclusive as renderizadas 100% por JS — não fiquem em branco.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:",
  "img-src 'self' https: http: data: blob:",
  "style-src 'self' 'unsafe-inline' https: data:",
  "font-src 'self' https: data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob: data:",
  "media-src 'self' https: http: data: blob:",
  "connect-src 'self' https: data: blob:",
  "worker-src 'self' blob: data:",
  "child-src 'self' https: blob:",
  "frame-src 'self' https: blob:",
  "base-uri 'self'",
].join('; ')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const access = await validateMaterialHtmlAccess(params.id, session)

    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { db, material, user, materialId } = access

    const rawHtml = await fetchMaterialHtml(material.htmlFile.blobUrl)

    const html = buildWatermarkedHtml(rawHtml, {
      userName: user?.name || session?.name || 'Usuário',
      userId: session?.userId || '',
      userEmail: user?.email || session?.email || '',
      materialId,
      materialTitle: material.title,
      viewedAt: new Date(),
    })

    // Log de acesso (fire-and-forget) para rastreabilidade.
    logHtmlViewerAccess(db, {
      userId: session?.userId || '',
      userName: user?.name || session?.name || '',
      userEmail: user?.email || session?.email || '',
      materialId,
      materialTitle: material.title,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
      userAgent: request.headers.get('user-agent') || '',
    })

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': CONTENT_SECURITY_POLICY,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
      },
    })
  } catch (error) {
    console.error('[html-viewer/content] Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar o conteúdo' }, { status: 500 })
  }
}
