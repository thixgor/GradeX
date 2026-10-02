import 'server-only'

import { NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getManualClinicoAccess, getManualClinicoConfig } from '@/lib/manual-clinico-product'

import type { EstudoGuardado } from './estudos'

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
  const config = await getManualClinicoConfig(db)
  const acesso = await getManualClinicoAccess(db, session, config)
  if (!acesso.hasFullAccess) {
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
