import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  filterActiveUserIds,
  presenceWindowMs,
  readLiveExamUserIds,
  readOnlineDevices,
} from '@/lib/presence/server'

export const dynamic = 'force-dynamic'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Quantas pessoas estão no site AGORA
 * ───────────────────────────────────────────────────────────────
 *  A conta antiga saía de `users.lastLoginAt` e errava dos dois
 *  lados: quem logou às 8h e passou a manhã fazendo prova não
 *  aparecia, e quem logou e fechou a aba ficava "online" por dez
 *  minutos. Login não é presença.
 *
 *  Agora sai de `sessions.lastActiveAt`, carimbado por qualquer
 *  requisição autenticada (navegar, responder prova, abrir material)
 *  e pela batida de ponto de quem está lendo parado.
 *
 *  Custo: duas leituras minúsculas (as sessões da janela, pelo índice
 *  de `lastActiveAt`; e os ids correspondentes em `users`, por `_id`)
 *  mais um `distinct` nas provas em andamento. Nada varre coleção.
 * ═══════════════════════════════════════════════════════════════
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const now = Date.now()
    const windowMs = presenceWindowMs()

    const [snapshot, examUserIds] = await Promise.all([
      readOnlineDevices(db, { windowMs, now }),
      readLiveExamUserIds(db, now),
    ])

    // Banido e conta apagada não entram: o cookie continua válido até a
    // próxima navegação, mas ninguém quer ver um banido no "online agora".
    const activeIds = await filterActiveUserIds(db, snapshot.userIds)
    const activeSet = new Set(activeIds)

    return NextResponse.json({
      count: activeIds.length,
      /** Aparelhos vivos — uma pessoa com celular e notebook conta 2 aqui. */
      devices: snapshot.userIds.reduce(
        (total, id) => (activeSet.has(id) ? total + (snapshot.byUser.get(id)?.devices ?? 0) : total),
        0,
      ),
      /** Quantos dos online estão com uma prova aberta neste instante. */
      inExam: examUserIds.filter((id) => activeSet.has(id)).length,
      /** Ids online — a lista usa para marcar as linhas sem outra requisição. */
      ids: activeIds,
      windowMinutes: Math.round(windowMs / 60000),
      generatedAt: new Date(now).toISOString(),
    })
  } catch (error) {
    console.error('Get online users count error:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários online' }, { status: 500 })
  }
}
