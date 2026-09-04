import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { MAX_PERIODO, MIN_PERIODO, getUserCurrentPeriodo } from '@/lib/user-periodo'

export const dynamic = 'force-dynamic'

/**
 * Quantos alunos há em cada período, agora.
 *
 * O formulário da prova precisa disto para que "aplicar ao 3º período" não seja
 * um salto no escuro: o admin marca o período e vê, ao lado, quantas pessoas
 * aquilo alcança. Um "3º período (0 alunos)" é o aviso de que a prova vai abrir
 * para ninguém — e é melhor descobrir isso antes de agendar.
 *
 * A contagem é derivada, não armazenada: o período de cada pessoa avança
 * sozinho a cada semestre (`lib/user-periodo.ts`), então uma coluna no banco
 * envelheceria em silêncio na virada. São só dois campos por usuário.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const usuarios = await db
      .collection('users')
      .find(
        { banned: { $ne: true } },
        { projection: { periodoBase: 1, periodoBaseRef: 1 } },
      )
      .toArray()

    const contagem: Record<number, number> = {}
    for (let p = MIN_PERIODO; p <= MAX_PERIODO; p++) contagem[p] = 0

    let semPeriodo = 0
    for (const usuario of usuarios) {
      const periodo = getUserCurrentPeriodo(usuario as any)
      if (periodo === null) semPeriodo += 1
      else contagem[periodo] = (contagem[periodo] || 0) + 1
    }

    return NextResponse.json({
      periodos: Object.entries(contagem).map(([periodo, alunos]) => ({
        periodo: Number(periodo),
        alunos,
      })),
      semPeriodo,
      total: usuarios.length,
    })
  } catch (error) {
    console.error('Contagem por período error:', error)
    return NextResponse.json({ error: 'Erro ao contar alunos por período' }, { status: 500 })
  }
}
