import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { audit } from '@/lib/payments/audit'
import { definirProuniIaAtiva, prouniIaAtiva } from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Liga/desliga da análise automática dos comprovantes.
 *
 * Desligada, o envio volta a ser exatamente o de antes: fila manual e e-mail
 * de "recebemos". Serve de freio de mão — se a IA começar a aprovar o que não
 * devia, um clique e nada mais é aprovado sozinho.
 */

const Schema = z.object({ aiEnabled: z.boolean() })

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const db = await getDb()
  return NextResponse.json({ aiEnabled: await prouniIaAtiva(db) })
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  try {
    const db = await getDb()
    await definirProuniIaAtiva(db, parsed.data.aiEnabled, session.userId)
    await audit({
      action: 'prouni_ai_config_updated',
      actorUserId: session.userId,
      resourceType: 'prouni_config',
      metadata: { aiEnabled: parsed.data.aiEnabled },
    })
    return NextResponse.json({ success: true, aiEnabled: parsed.data.aiEnabled })
  } catch (error) {
    console.error('[admin/prouni/config] PUT erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
