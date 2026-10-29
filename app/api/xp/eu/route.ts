import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { invalidarPrefixo } from '@/lib/cache-de-servidor'
import { COLECAO_XP, campoDoPeriodo, obterPerfilDeXp, porAreaCompleto, xpNoPeriodo } from '@/lib/xp/perfis'
import { calcularXp, medalhasDe, nivelDe, type ExtratoDeXp } from '@/lib/xp/regras'

export const dynamic = 'force-dynamic'

/**
 * O XP de quem está logado: total, nível, liga, semana, mês, hoje, áreas,
 * medalhas, sequência e a posição nos rankings.
 *
 * `?fresco=1` é o pedido que o site faz logo depois de uma ação que dá XP
 * (resolver questão, revisar carta…): só aceita um retrato de até 1,5 s — o
 * que acabou de ser gravado precisa entrar na conta para o "+XP" aparecer. O
 * cliente junta ações seguidas num pedido só (espera 1,2 s). Sem ele, o
 * retrato vale 90 s.
 */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const db = await getDb()
  const fresco = request.nextUrl.searchParams.get('fresco') === '1'
  const perfil = await obterPerfilDeXp(db, session.userId, { maxIdadeMs: fresco ? 1_500 : 90_000 })
  if (!perfil) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

  const agora = new Date()
  const col = db.collection(COLECAO_XP)
  const posicaoEm = async (periodo: 'semana' | 'geral') => {
    if (!perfil.elegivel) return null
    const meu = xpNoPeriodo(perfil, periodo, agora)
    if (meu <= 0) return null
    const { campo, filtro } = campoDoPeriodo(periodo, agora)
    return (await col.countDocuments({ elegivel: true, ...filtro, [campo]: { $gt: meu } })) + 1
  }
  const [posicaoSemana, posicaoGeral] = await Promise.all([posicaoEm('semana'), posicaoEm('geral')])

  // As medalhas leem as quantidades e a maior sequência guardadas no retrato.
  const base = calcularXp([], agora)
  const extratoDasMedalhas: ExtratoDeXp = {
    ...base,
    quantidades: { ...base.quantidades, ...perfil.quantidades },
    maiorSequencia: perfil.maiorSequencia,
  }

  return NextResponse.json(
    {
      total: perfil.total,
      nivel: nivelDe(perfil.total),
      semana: xpNoPeriodo(perfil, 'semana', agora),
      mes: xpNoPeriodo(perfil, 'mes', agora),
      hoje: perfil.hoje?.xp || 0,
      porArea: porAreaCompleto(perfil.porArea),
      porDia: perfil.porDia,
      medalhas: medalhasDe(extratoDasMedalhas),
      sequenciaAtual: perfil.sequenciaAtual,
      maiorSequencia: perfil.maiorSequencia,
      diasAtivos: perfil.diasAtivos,
      posicaoSemana,
      posicaoGeral,
      oculto: perfil.oculto,
      elegivel: perfil.elegivel,
      faculdade: perfil.faculdade,
      atualizadoEm: perfil.atualizadoEm,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

/** Aparecer ou não pelo nome no ranking (`{ oculto: boolean }`). */
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session?.userId || !ObjectId.isValid(session.userId)) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }
  const corpo = await request.json().catch(() => null)
  if (!corpo || typeof corpo.oculto !== 'boolean') {
    return NextResponse.json({ error: 'Formato inválido.' }, { status: 400 })
  }
  const db = await getDb()
  await Promise.all([
    db.collection('users').updateOne({ _id: new ObjectId(session.userId) }, { $set: { xpRankingOculto: corpo.oculto } }),
    db.collection(COLECAO_XP).updateOne({ userId: session.userId }, { $set: { oculto: corpo.oculto } }),
  ])
  invalidarPrefixo('xp:ranking:')
  return NextResponse.json({ ok: true, oculto: corpo.oculto })
}
