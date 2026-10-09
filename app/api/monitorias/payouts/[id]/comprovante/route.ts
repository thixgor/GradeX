import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { get } from '@vercel/blob'
import { naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * GET — o comprovante do PIX que o admin anexou ao repasse. Fica no Blob
 * PRIVADO: só sai por aqui, para o monitor dono e para admin.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 30, windowMs: 60_000 } }, async ({ sessao }) => {
    if (!ObjectId.isValid(params.id)) return naoEncontrado()
    const c = await obterColecoes()
    const payout = await c.payouts.findOne({ _id: new ObjectId(params.id) } as any)
    if (!payout?.comprovantePath) return naoEncontrado()
    if (sessao.role !== 'admin' && payout.tutorUserId !== sessao.userId) return naoEncontrado()
    const arquivo = await get(payout.comprovantePath, { access: 'private' })
    if (!arquivo || arquivo.statusCode !== 200 || !arquivo.stream) return naoEncontrado()
    const tipo = payout.comprovanteTipo || 'application/octet-stream'
    const extensao = tipo === 'application/pdf' ? 'pdf' : tipo === 'image/png' ? 'png' : 'jpg'
    return new NextResponse(arquivo.stream as any, {
      headers: {
        'Content-Type': tipo,
        'Content-Disposition': `attachment; filename="comprovante-pix-${params.id}.${extensao}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  })
}
