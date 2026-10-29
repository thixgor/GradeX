import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { COLECAO_XP, campoDoPeriodo, obterPerfilDeXp, xpNoPeriodo, type Periodo, type PerfilDeXp } from '@/lib/xp/perfis'
import { nivelDe } from '@/lib/xp/regras'

export const dynamic = 'force-dynamic'

const TAMANHO_DO_TOPO = 50
const PERIODOS: Periodo[] = ['semana', 'mes', 'geral']

export interface LinhaDoRanking {
  posicao: number
  userId: string
  nome: string
  avatar: string | null
  xp: number
  nivel: number
  liga: string
  sequencia: number
  faculdade: string | null
  periodo: number | null
}

/**
 * O ranking de XP: os 50 primeiros da semana, do mês ou de sempre — de todo
 * mundo ou só da faculdade de quem pede — e a posição da própria pessoa.
 *
 * O topo é igual para todos e muda devagar: fica 60 s em memória por chave
 * (período + escopo + faculdade). A posição de quem pede é contada na hora.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const p = request.nextUrl.searchParams.get('periodo') as Periodo
  const periodo: Periodo = PERIODOS.includes(p) ? p : 'semana'
  const escopo = request.nextUrl.searchParams.get('escopo') === 'faculdade' ? 'faculdade' : 'todos'

  const db = await getDb()
  const eu = await obterPerfilDeXp(db, session.userId)
  const faculdade = escopo === 'faculdade' ? eu?.faculdade || null : null
  if (escopo === 'faculdade' && !faculdade) {
    return NextResponse.json({ error: 'Complete o perfil com a sua faculdade para ver o ranking dela.', semFaculdade: true }, { status: 409 })
  }

  const agora = new Date()
  const { campo, filtro } = campoDoPeriodo(periodo, agora)
  const base = { elegivel: true, ...filtro, ...(faculdade ? { faculdade } : {}), [campo]: { $gt: 0 } }
  const col = db.collection<PerfilDeXp>(COLECAO_XP)

  const chave = `xp:ranking:${periodo}:${faculdade || '*'}:${Object.values(filtro).join('|')}`
  const { topo, participantes } = await memoizarPorTempo(chave, 60_000, async () => {
    const [docs, participantes] = await Promise.all([
      col
        .find(base, {
          projection: { userId: 1, nome: 1, avatar: 1, total: 1, semana: 1, mes: 1, sequenciaAtual: 1, oculto: 1, faculdade: 1, periodo: 1 },
        })
        .sort({ [campo]: -1, userId: 1 })
        .limit(TAMANHO_DO_TOPO)
        .toArray(),
      col.countDocuments(base),
    ])
    const topo: LinhaDoRanking[] = docs.map((d, i) => {
      const xp = xpNoPeriodo(d, periodo, agora)
      const nivel = nivelDe(d.total)
      return {
        posicao: i + 1,
        userId: d.userId,
        nome: d.oculto ? 'Estudante anônimo' : d.nome,
        avatar: d.oculto ? null : d.avatar,
        xp,
        nivel: nivel.nivel,
        liga: nivel.liga.id,
        sequencia: d.sequenciaAtual || 0,
        faculdade: d.oculto ? null : d.faculdade,
        periodo: d.oculto ? null : d.periodo,
      }
    })
    return { topo, participantes }
  })

  let minha: LinhaDoRanking | null = null
  if (eu?.elegivel) {
    const xp = xpNoPeriodo(eu, periodo, agora)
    if (xp > 0) {
      const acima = await col.countDocuments({ ...base, [campo]: { $gt: xp } })
      const nivel = nivelDe(eu.total)
      minha = {
        posicao: acima + 1,
        userId: eu.userId,
        nome: eu.nome,
        avatar: eu.avatar,
        xp,
        nivel: nivel.nivel,
        liga: nivel.liga.id,
        sequencia: eu.sequenciaAtual || 0,
        faculdade: eu.faculdade,
        periodo: eu.periodo,
      }
    }
  }

  return jsonComprimido(
    request,
    { periodo, escopo, faculdade, topo, participantes, eu: minha, euElegivel: !!eu?.elegivel, euId: session.userId },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
