import 'server-only'

/**
 * Config do Resumo por IA (`admin_settings.monitoriasResumo`), com cache de
 * 60 s por instância — o mesmo regime da config da sala.
 */

import { getDb } from '@/lib/mongodb'
import { normalizarConfigResumo } from './regras'
import type { ConfigResumo } from './tipos'

const TTL_MS = 60_000
let cache: { valor: ConfigResumo; ate: number } | null = null

export async function configDoResumo(): Promise<ConfigResumo> {
  const agora = Date.now()
  if (cache && cache.ate > agora) return cache.valor
  const db = await getDb()
  const doc = await db.collection('admin_settings').findOne({}, { projection: { monitoriasResumo: 1 } })
  const valor = normalizarConfigResumo(doc?.monitoriasResumo)
  cache = { valor, ate: agora + TTL_MS }
  return valor
}

export async function salvarConfigDoResumo(nova: unknown): Promise<ConfigResumo> {
  const valor = normalizarConfigResumo(nova)
  const db = await getDb()
  await db.collection('admin_settings').updateOne({}, { $set: { monitoriasResumo: valor, updatedAt: new Date() } }, { upsert: true })
  cache = { valor, ate: Date.now() + TTL_MS }
  return valor
}
