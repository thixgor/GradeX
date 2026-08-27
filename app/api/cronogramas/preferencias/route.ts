import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'
import { getPreferencias, salvarPreferencias } from '@/lib/cronogramas/avaliacoes-servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Preferências do aluno na área de cronogramas: a seção que ele acompanha, o
 * período e o opt-in dos lembretes.
 *
 * Esse opt-in é a única chave que libera qualquer envio (ver
 * `/api/cron/avaliacoes-lembretes`) — por isso ele só é escrito aqui, com a
 * sessão do próprio dono, e nunca por rota de admin.
 */

/** Padrões da primeira visita, tirados do que o aluno já contou no cadastro. */
async function padroesDoUsuario(userId: string) {
  try {
    const db = await getDb()
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { periodoBase: 1, periodoBaseRef: 1 } },
    )
    return { periodoSugerido: getUserCurrentPeriodo(user as any) ?? 1 }
  } catch {
    return { periodoSugerido: 1 }
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const padroes = await padroesDoUsuario(session.userId)
  const preferencias = await getPreferencias(session.userId, padroes)

  return NextResponse.json({ preferencias })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const preferencias = await salvarPreferencias(session.userId, {
    lembretesAtivos: corpo?.lembretesAtivos,
    secao: corpo?.secao,
    periodo: corpo?.periodo,
  })

  return NextResponse.json({ preferencias })
}
