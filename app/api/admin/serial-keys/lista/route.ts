import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SERIAL_KEYS_COLLECTION } from '@/lib/serial-keys'
import { MAX_KEYS_POR_EMISSAO, serializarKeyParaAdmin } from '@/lib/serial-key-emissao'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import type { SerialKey } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const POR_PAGINA = 50

const ESTADOS: Record<string, object> = {
  unactivated: { status: { $nin: ['activated', 'cancelled'] }, used: { $ne: true } },
  activated: { $or: [{ status: 'activated' }, { used: true }] },
  cancelled: { status: 'cancelled' },
}

const TIPOS: Record<string, object> = {
  material: { productType: 'material' },
  flashcard: { productType: 'flashcard' },
  package: { productType: 'package' },
  manual_clinico: { productType: 'manual_clinico' },
  plus: { productType: { $in: ['plus', 'premium', 'essential'] } },
  // Keys antigas de /admin/keys, sem `grant`.
  legado: { grant: { $exists: false } },
}

/**
 * Lista de /admin/keys: keys emitidas pelo admin (padrão), de compras ou
 * todas, com filtros e os contadores por estado do recorte escolhido.
 *
 * GET ?origem=emitidas|compras|todas &estado= &tipo= &q= &itemId= &lote= &pagina=
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const sp = new URL(request.url).searchParams
  const origem = sp.get('origem') || 'emitidas'
  const estado = sp.get('estado') || ''
  const tipo = sp.get('tipo') || ''
  const q = (sp.get('q') || '').trim().slice(0, 120)
  const itemId = sp.get('itemId') || ''
  const lote = sp.get('lote') || ''
  const pagina = Math.max(0, Math.floor(Number(sp.get('pagina')) || 0))
  // Um lote cabe inteiro numa página (ver MAX_KEYS_POR_EMISSAO): o painel
  // copia todos os links dele de uma vez.
  const porPagina = lote ? MAX_KEYS_POR_EMISSAO : POR_PAGINA

  // Tudo entra num `$and`: os filtros de estado e de busca usam `$or` cada um.
  const recorte: object[] = []
  if (origem === 'emitidas') recorte.push({ origin: { $ne: 'purchase' } })
  else if (origem === 'compras') recorte.push({ origin: 'purchase' })
  if (TIPOS[tipo]) recorte.push(TIPOS[tipo])
  if (itemId) recorte.push({ 'grant.itemId': itemId })
  if (lote) recorte.push({ batchId: lote })
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    recorte.push({
      $or: [
        { key: rx }, { buyerEmail: rx }, { buyerName: rx }, { productTitle: rx },
        { adminNote: rx }, { batchId: q }, { activatedByEmail: rx }, { usedByName: rx },
      ],
    })
  }

  const filtroDo = (extra?: object) => {
    const partes = extra ? [...recorte, extra] : recorte
    return partes.length ? { $and: partes } : {}
  }
  const filtro = filtroDo(ESTADOS[estado])

  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
  const [keys, total, pendentes, ativadas, canceladas] = await Promise.all([
    col.find(filtro as any, { projection: { userAgent: 0, ip: 0 } })
      .sort({ generatedAt: -1, _id: -1 })
      .skip(pagina * porPagina)
      .limit(porPagina + 1)
      .toArray(),
    col.countDocuments(filtroDo() as any),
    col.countDocuments(filtroDo(ESTADOS.unactivated) as any),
    col.countDocuments(filtroDo(ESTADOS.activated) as any),
    col.countDocuments(filtroDo(ESTADOS.cancelled) as any),
  ])

  return jsonComprimido(request, {
    keys: keys.slice(0, porPagina).map(serializarKeyParaAdmin),
    temMais: keys.length > porPagina,
    pagina,
    contagem: { total, pendentes, ativadas, canceladas },
  })
}
