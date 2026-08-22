/**
 * Autorização e contabilização de um consumo gerado no navegador.
 *
 * Quase toda cota é cobrada onde o servidor entrega o recurso. O PDF de prova
 * é a exceção: ele é montado no cliente, a partir de dados que a pessoa já
 * tem na tela, e nenhuma rota de servidor participa do download. Sem este
 * ponto, "15 downloads de prova por dia" não teria onde ser contado.
 *
 * Por isso a lista de áreas aceitas é curta e fechada: só entra o que
 * realmente não tem outro lugar para ser medido. Deixá-la aberta permitiria
 * ao cliente queimar a cota de qualquer área com uma requisição solta.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  avaliarUsoDoPlano,
  corpoDeRecusa,
  registrarUsoDoPlano,
  resolverPermissoesPorUsuario,
} from '@/lib/plan-entitlements-server'
import type { PlanFeatureKey } from '@/lib/plan-entitlements'

export const dynamic = 'force-dynamic'

/** Áreas cujo consumo só pode ser observado a partir do cliente. */
const AREAS_ACEITAS: PlanFeatureKey[] = ['provasPdf']

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Um clique de download por vez. Sem isto, um script poderia disparar a
    // checagem em rajada e passar entre duas leituras da mesma cota.
    const rl = await checkRateLimit(session.userId, 'plan_consume', 30, 60_000)
    if (!rl.success) {
      return NextResponse.json({ error: 'Muitas requisições. Aguarde um instante.' }, { status: 429 })
    }

    let body: { feature?: unknown; recurso?: unknown }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const feature = String(body.feature || '') as PlanFeatureKey
    if (!AREAS_ACEITAS.includes(feature)) {
      return NextResponse.json({ error: 'Área não suportada' }, { status: 400 })
    }
    const recurso = body.recurso ? String(body.recurso).slice(0, 120) : undefined

    const db = await getDb()
    const contexto = await resolverPermissoesPorUsuario(db, session.userId)
    const veredicto = await avaliarUsoDoPlano(db, contexto, feature, { recurso })

    if (!veredicto.permitido) {
      return NextResponse.json(corpoDeRecusa(veredicto), { status: 403 })
    }

    await registrarUsoDoPlano(db, contexto, feature, { recurso })

    return NextResponse.json(
      {
        permitido: true,
        limite: veredicto.limite,
        usado: veredicto.usado,
        restante: veredicto.restante,
        periodo: veredicto.periodo,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Erro ao consumir cota do plano:', error)
    return NextResponse.json({ error: 'Erro ao validar o limite do plano' }, { status: 500 })
  }
}
