import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { put } from '@vercel/blob'
import { audit } from '@/lib/payments/audit'
import { erro, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { anexarComprovante } from '@/lib/monitorias/payout'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const MAX_BYTES = 4 * 1024 * 1024

/** Assinatura real do arquivo — o Content-Type do navegador não prova nada. */
function tipoReal(b: Uint8Array): string | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf'
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  return null
}

/** POST multipart (arquivo) — anexa o comprovante do PIX ao pagamento em aberto (Blob PRIVADO). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'UPLOAD' }, async ({ sessao, ip }) => {
    if (!ObjectId.isValid(params.id)) return naoEncontrado()
    const c = await obterColecoes()
    const payout = await c.payouts.findOne({ _id: new ObjectId(params.id) } as any)
    if (!payout || payout.status !== 'aberto') return erro(409, 'Pagamento não está em aberto.')
    const form = await request.formData().catch(() => null)
    const arquivo = form?.get('arquivo')
    if (!arquivo || typeof arquivo === 'string') return erro(400, 'Envie o arquivo do comprovante.')
    if (arquivo.size > MAX_BYTES) return erro(400, 'Arquivo maior que 4 MB.')
    const bytes = new Uint8Array(await arquivo.arrayBuffer())
    const tipo = tipoReal(bytes)
    if (!tipo) return erro(400, 'Use PDF, JPG ou PNG.')
    const extensao = tipo === 'application/pdf' ? 'pdf' : tipo === 'image/png' ? 'png' : 'jpg'
    const caminho = `monitorias/repasses/${params.id}/comprovante-${Date.now()}.${extensao}`
    await put(caminho, Buffer.from(bytes), { access: 'private', addRandomSuffix: true, contentType: tipo })
      .then((r) => anexarComprovante({ payoutId: params.id, path: r.pathname, tipo }))
    await audit({ action: 'monitoria_payout_comprovante', actorUserId: sessao.userId, resourceType: 'monitoria_payout', resourceId: params.id, metadata: { tipo, bytes: bytes.length }, ip })
    return ok({ anexado: true })
  })
}
