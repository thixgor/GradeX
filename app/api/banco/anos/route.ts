import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ordenarPeriodosLetivos } from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'

/**
 * O eixo temporal do catálogo: períodos letivos e anos.
 *
 * A rota devolvia só `anos`, e o filtro da tela era "2026" — que na prática
 * junta duas provas diferentes, a do primeiro e a do segundo semestre. O nome
 * da prova na faculdade é "N1 SOI I - 2026.2", e é assim que quem estuda
 * procura. Agora a lista de PERÍODOS vem junto, com a contagem de cada um, para
 * a tela mostrar "2026.2 · 148 questões" em vez de um `<select>` mudo.
 *
 * Os anos continuam saindo daqui porque nem toda questão tem período: as que
 * vieram de prova sem semestre no título têm só o ano (ver
 * lib/banco/periodo-letivo.ts).
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    const [periodosBrutos, anos] = await Promise.all([
      db
        .collection('banco_questoes')
        .aggregate([
          { $match: { periodoLetivo: { $type: 'string', $ne: '' } } },
          { $group: { _id: '$periodoLetivo', total: { $sum: 1 } } },
        ])
        .toArray(),
      db.collection('banco_questoes').distinct('ano', { ano: { $ne: null } }),
    ])

    const totalPorPeriodo = new Map<string, number>(
      periodosBrutos.map((p: any) => [String(p._id), p.total as number]),
    )

    const periodos = ordenarPeriodosLetivos(Array.from(totalPorPeriodo.keys())).map((rotulo) => ({
      periodo: rotulo,
      total: totalPorPeriodo.get(rotulo) || 0,
    }))

    return NextResponse.json({
      anos: (anos as number[]).filter((a) => Number.isFinite(a)).sort((a, b) => b - a),
      periodos,
    })
  } catch (error) {
    console.error('Erro ao buscar anos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anos' }, { status: 500 })
  }
}
