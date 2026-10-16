import 'server-only'

/**
 * As chaves da sala (Admin → Monitorias → Sala de vídeo) e o consumo do mês.
 *
 * Lidas só em operações raras (entrar, renovar, abrir a reserva), e ainda assim
 * com cache de 60 s por instância: uma mudança do admin chega a todas as
 * instâncias em até um minuto, que é o mesmo prazo do cache de sessão.
 */

import { getDb } from '@/lib/mongodb'
import { diaEmBrasilia } from '@/lib/fuso-brasilia'
import { colecoes } from '../db'
import type { ConfigSala, UsoDaSala } from '../tipos'
import { normalizarConfigSala } from './regras'

const TTL_MS = 60_000

let configCache: { valor: ConfigSala; ate: number } | null = null
let usoCache: { mes: string; bytes: number; ate: number } | null = null

export async function configDaSala(): Promise<ConfigSala> {
  const agora = Date.now()
  if (configCache && configCache.ate > agora) return configCache.valor
  const db = await getDb()
  const doc = await db.collection('admin_settings').findOne({}, { projection: { monitoriasSala: 1 } })
  const valor = normalizarConfigSala(doc?.monitoriasSala)
  configCache = { valor, ate: agora + TTL_MS }
  return valor
}

export async function salvarConfigSala(nova: ConfigSala): Promise<ConfigSala> {
  const valor = normalizarConfigSala(nova)
  const db = await getDb()
  await db.collection('admin_settings').updateOne({}, { $set: { monitoriasSala: valor, updatedAt: new Date() } }, { upsert: true })
  configCache = { valor, ate: Date.now() + TTL_MS }
  return valor
}

/** "AAAA-MM" no horário de Brasília: o documento de consumo do mês. */
export function mesDoUso(agora = new Date()): string {
  return diaEmBrasilia(agora).slice(0, 7)
}

/** Bytes de relé estimados no mês (cache de 60 s; é só para o teto do TURN). */
export async function bytesDeRelayNoMes(agora = new Date()): Promise<number> {
  const mes = mesDoUso(agora)
  if (usoCache && usoCache.mes === mes && usoCache.ate > agora.getTime()) return usoCache.bytes
  const c = colecoes(await getDb())
  const doc = await c.usoDaSala.findOne({ _id: mes }, { projection: { bytesRelay: 1 } })
  const bytes = doc?.bytesRelay || 0
  usoCache = { mes, bytes, ate: agora.getTime() + TTL_MS }
  return bytes
}

export async function usoDoMes(agora = new Date()): Promise<UsoDaSala | null> {
  const c = colecoes(await getDb())
  return c.usoDaSala.findOne({ _id: mesDoUso(agora) })
}
