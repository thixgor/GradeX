import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'

export const dynamic = 'force-dynamic'

/**
 * GET ?q=texto | ?id=<materialId> — materiais OFICIAIS que o monitor pode
 * indicar no anúncio: só os pagos, com preço e visíveis na loja. Devolve o
 * preço oficial em centavos (a tela mostra a conta dos 10% com ele; quem
 * decide de verdade é o servidor, no checkout).
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'READ' }, async () => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const q = (url.searchParams.get('q') || '').trim().slice(0, 60)
    const filtro: Record<string, unknown> = { pricing: 'paid', isHidden: { $ne: true }, price: { $gt: 0 } }
    if (id) {
      if (!ObjectId.isValid(id)) return ok({ itens: [] })
      filtro._id = new ObjectId(id)
    } else if (q) {
      filtro.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
    }
    const db = await getDb()
    const itens = await db
      .collection('materials')
      .find(filtro, { projection: { title: 1, price: 1, coverImage: 1 } })
      .sort({ isFeatured: -1, order: 1, title: 1 })
      .limit(20)
      .toArray()
    return ok({
      itens: itens.map((m) => ({
        id: String(m._id),
        titulo: String(m.title || 'Material'),
        capa: typeof m.coverImage === 'string' && m.coverImage ? m.coverImage : null,
        precoCentavos: Math.round(Number(m.price) * 100),
      })),
    })
  })
}
