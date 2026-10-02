import 'server-only'

import { NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getManualClinicoAccess, getManualClinicoConfig } from '@/lib/manual-clinico-product'

import type { EstudoGuardado } from './estudos'

/**
 * Veredito de acesso guardado por instância.
 *
 * O painel de conexões é pedido a cada ficha aberta, e o veredito completo
 * custa três ou quatro idas ao banco (configuração do produto, conta, plano,
 * compra). Quem está estudando abre dezenas de fichas seguidas com a mesma
 * resposta. O "sim" vale cinco minutos; o "não" vale trinta segundos, para
 * que quem acabou de comprar não espere para ver o Estudo liberado.
 */
const VALIDADE_SIM_MS = 5 * 60 * 1000
const VALIDADE_NAO_MS = 30 * 1000
const MAX_VEREDITOS = 5000
const vereditos = new Map<string, { ate: number; ok: boolean }>()

type Sessao = NonNullable<Awaited<ReturnType<typeof getSession>>>

async function temAcesso(db: Db, session: Sessao): Promise<boolean> {
  const chave = `${session.userId}|${session.role ?? ''}`
  const agora = Date.now()
  const guardado = vereditos.get(chave)
  if (guardado && guardado.ate > agora) return guardado.ok

  const config = await getManualClinicoConfig(db)
  const ok = (await getManualClinicoAccess(db, session, config)).hasFullAccess
  if (vereditos.size >= MAX_VEREDITOS) vereditos.clear()
  vereditos.set(chave, { ate: agora + (ok ? VALIDADE_SIM_MS : VALIDADE_NAO_MS), ok })
  return ok
}

/**
 * Portão das rotas do Estudo Integrado. O Estudo atravessa todos os manuais,
 * então a regra é a do Manual Clínico inteiro (sem módulo específico): quem
 * tem o Manual tem o Estudo. Devolve o banco e o usuário, ou a resposta de
 * erro pronta — o mesmo arranjo do caderno da Radiologia.
 */
export async function autorizarEstudo(): Promise<
  { db: Db; userId: ObjectId } | { erro: NextResponse }
> {
  const session = await getSession()
  if (!session?.userId || !ObjectId.isValid(session.userId)) {
    return { erro: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }
  const db = await getDb()
  if (!(await temAcesso(db, session))) {
    return { erro: NextResponse.json({ error: 'Acesso não liberado' }, { status: 403 }) }
  }
  return { db, userId: new ObjectId(session.userId) }
}

export const COLECAO_ESTUDOS = 'estudos_integrados'

/** O documento como está no banco. */
export type EstudoNoBanco = Omit<EstudoGuardado, '_id'> & { _id: ObjectId; userId: ObjectId }

let indices: Promise<unknown> | null = null

/** Índice da coleção garantido uma vez por instância, não a cada requisição. */
export function garantirIndicesDosEstudos(db: Db): Promise<unknown> {
  if (!indices) {
    indices = db
      .collection(COLECAO_ESTUDOS)
      .createIndex({ userId: 1, atualizadoEm: -1 })
      .catch(() => {
        // Falhou: a próxima requisição tenta de novo.
        indices = null
      })
  }
  return indices
}
