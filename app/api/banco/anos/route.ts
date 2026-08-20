import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import { ordenarPeriodosLetivos } from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'

/** Muda quando uma prova nova é importada — raro, e sem urgência de aparecer. */
const TTL_DO_EIXO_MS = 60_000

interface EixoTemporal {
  anos: number[]
  periodos: Array<{ periodo: string; total: number }>
}

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
 *
 * ## Uma varredura, não duas
 *
 * Períodos e anos saíam de duas consultas independentes — um `$group` e um
 * `distinct` — cada uma percorrendo `banco_questoes` do começo ao fim. São duas
 * leituras do mesmo acervo para responder à mesma pergunta ("quando"). O
 * `$facet` abaixo faz as duas na mesma passada.
 */
async function lerEixoTemporal(): Promise<EixoTemporal> {
  const db = await getDb()

  const [facetas] = await db
    .collection('banco_questoes')
    .aggregate([
      {
        $facet: {
          periodos: [
            { $match: { periodoLetivo: { $type: 'string', $ne: '' } } },
            { $group: { _id: '$periodoLetivo', total: { $sum: 1 } } },
          ],
          anos: [{ $match: { ano: { $ne: null } } }, { $group: { _id: '$ano' } }],
        },
      },
    ])
    .toArray()

  const totalPorPeriodo = new Map<string, number>(
    ((facetas?.periodos as any[]) || []).map((p: any) => [String(p._id), p.total as number]),
  )

  const periodos = ordenarPeriodosLetivos(Array.from(totalPorPeriodo.keys())).map((rotulo) => ({
    periodo: rotulo,
    total: totalPorPeriodo.get(rotulo) || 0,
  }))

  const anos = ((facetas?.anos as any[]) || [])
    .map((a: any) => Number(a._id))
    .filter((a) => Number.isFinite(a))
    .sort((a, b) => b - a)

  return { anos, periodos }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const eixo = await memoizarPorTempo('banco:eixo-temporal', TTL_DO_EIXO_MS, lerEixoTemporal)

    return NextResponse.json(eixo, {
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    })
  } catch (error) {
    console.error('Erro ao buscar anos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anos' }, { status: 500 })
  }
}
