import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { PROJECAO_DO_USUARIO, atualizarPerfilDeXp, garantirIndicesDoXp, type UsuarioParaXp } from '@/lib/xp/perfis'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** Para antes do teto da função, com folga para gravar o cursor. */
const ORCAMENTO_MS = 45_000
const LOTE = 200
const SIMULTANEOS = 4

/**
 * Varredura do XP: refaz o retrato de XP de todas as contas, em rodízio.
 *
 * É ela que torna o ranking retroativo desde o primeiro dia: quem estudou no
 * ano passado e não voltou ao site entra no ranking com o XP do histórico, sem
 * precisar abrir nada. Roda de hora em hora, anda pelo `_id` dos usuários a
 * partir de onde parou (cursor em `xp_varredura`) e para em 45 s — o próximo
 * disparo continua dali. Ao chegar ao fim da lista, recomeça.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const inicio = Date.now()
  const db = await getDb()
  await garantirIndicesDoXp(db)

  const estado = db.collection<{ _id: string; ultimoId?: ObjectId | null; voltas?: number }>('xp_varredura')
  const cursor = await estado.findOne({ _id: 'cursor' })
  let ultimoId = cursor?.ultimoId ?? null
  let processados = 0
  let falhas = 0
  let terminouVolta = false

  while (Date.now() - inicio < ORCAMENTO_MS) {
    const usuarios = await db
      .collection<UsuarioParaXp>('users')
      .find(ultimoId ? { _id: { $gt: ultimoId } } : {}, { projection: PROJECAO_DO_USUARIO })
      .sort({ _id: 1 })
      .limit(LOTE)
      .toArray()

    if (usuarios.length === 0) {
      ultimoId = null
      terminouVolta = true
      break
    }

    for (let i = 0; i < usuarios.length && Date.now() - inicio < ORCAMENTO_MS; i += SIMULTANEOS) {
      const fatia = usuarios.slice(i, i + SIMULTANEOS)
      const resultados = await Promise.allSettled(
        fatia.map((u) => atualizarPerfilDeXp(db, String(u._id), { usuario: u })),
      )
      falhas += resultados.filter((r) => r.status === 'rejected').length
      processados += fatia.length
      ultimoId = fatia[fatia.length - 1]._id
    }
  }

  await estado.updateOne(
    { _id: 'cursor' },
    { $set: { ultimoId, atualizadoEm: new Date() }, ...(terminouVolta ? { $inc: { voltas: 1 } } : {}) },
    { upsert: true },
  )

  return NextResponse.json({ ok: true, processados, falhas, terminouVolta, ms: Date.now() - inicio })
}
