/**
 * Serve o conteúdo (PDF ou HTML) de um ITEM COMPLEMENTAR avulso, com marca
 * d'água indexada — mesma proteção usada nos materiais normais.
 *
 * O blobUrl real nunca é exposto ao cliente. Acesso = mesmo do material pai.
 *
 * GET /api/materiais/[id]/complementary/[itemId]/content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { validateComplementaryContentAccess, fetchMaterialHtml, buildWatermarkedHtml } from '@/lib/material-complementary-viewer'
import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import { applyWatermark } from '@/lib/pdf-watermark'
import { pdfBytesToStream } from '@/lib/pdf-response'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const HTML_CONTENT_SECURITY_POLICY = [
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
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getSession()
    const fileKindParam = request.nextUrl.searchParams.get('kind')
    const fileKind = fileKindParam === 'pdf' ? 'pdf' : 'html'

    const access = await validateComplementaryContentAccess(params.id, params.itemId, fileKind, session)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { material, item, user } = access
    const userName = user?.name || session?.name || 'Usuário'
    const userEmail = user?.email || session?.email || ''
    const userId = session?.userId || ''

    // Sem cota do Plus+ Guard: o item complementar acompanha o material pai,
    // que só é acessível a quem já comprou ou resgatou.
    if (fileKind === 'html') {
      const rawHtml = await fetchMaterialHtml(item.htmlFile.blobUrl)
      const html = buildWatermarkedHtml(rawHtml, {
        userName,
        userId,
        userEmail,
        materialId: params.id,
        materialTitle: item.title || material.title,
        viewedAt: new Date(),
      })
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': HTML_CONTENT_SECURITY_POLICY,
          'X-Content-Type-Options': 'nosniff',
          // Sobrescreve o X-Frame-Options: DENY global (next.config.js) —
          // esta rota é servida DENTRO de um <iframe> pelo leitor.
          'X-Frame-Options': 'SAMEORIGIN',
          'Cache-Control': 'private, no-store, max-age=0',
          'Referrer-Policy': 'no-referrer',
        },
      })
    }

    // PDF: reaproveita o mesmo watermark (pdf-lib) usado no download protegido
    // dos materiais normais — entrega o PDF completo com marca d'água,
    // renderizado nativamente pelo navegador dentro de um iframe sandbox.
    const bytes = await fetchMaterialPdfBytes(item.pdfFile.blobUrl)
    const watermarked = await applyWatermark(bytes, {
      userName,
      userEmail,
      userId,
      orderId: `${params.id}:${params.itemId}`,
      downloadedAt: new Date(),
    })

    // Em pedaços, e não como um buffer só: a borda da Vercel corta o corpo de
    // uma resposta entregue de uma vez acima de ~4,5 MB, depois de os
    // cabeçalhos já terem saído — o iframe ficaria em branco sem erro nenhum.
    // Ver `lib/pdf-response.ts`.
    return new NextResponse(pdfBytesToStream(watermarked), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${(item.title || 'documento').replace(/[^\w\- ]/g, '').slice(0, 60)}.pdf"`,
        'Content-Length': String(watermarked.byteLength),
        'X-Content-Type-Options': 'nosniff',
        // Sobrescreve o X-Frame-Options: DENY global (next.config.js) —
        // esta rota é servida DENTRO de um <iframe> pelo leitor.
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'private, no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
      },
    })
  } catch (error) {
    console.error('[complementary/content] Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar o conteúdo' }, { status: 500 })
  }
}
