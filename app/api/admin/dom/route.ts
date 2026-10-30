import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { LIMITES_DO_DOM } from '@/lib/dom/config'
import { COLECAO_GLOBAL, COLECAO_INCIDENTES, COLECAO_USO, garantirIndicesDoDom } from '@/lib/dom/limites'
import { hojeEmSaoPaulo } from '@/lib/xp/regras'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Painel do Dom para o admin: uso do dia e dos últimos 14 dias (por motor),
 * quem mais conversou hoje, contas suspensas e os incidentes de segurança
 * (tentativas de exploit pegas pela guarda ou vazamentos barrados na saída).
 *
 * `POST { acao: 'liberar', userId }` tira a suspensão;
 * `POST { acao: 'resolver', id }` marca um incidente como visto.
 */

async function exigirAdmin(request: NextRequest) {
  const s = await secureApiEndpoint(request, { rateLimit: 'ADMIN', auth: { requireAuth: true, allowedRoles: ['admin'] } })
  return s.success && !s.errorResponse ? null : s.errorResponse || NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
}

export async function GET(request: NextRequest) {
  const negado = await exigirAdmin(request)
  if (negado) return negado
  const db = await getDb()
  void garantirIndicesDoDom(db)
  const hoje = hojeEmSaoPaulo()
  const desde = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10)

  const [dias, topo, incidentes, suspensos] = await Promise.all([
    db.collection(COLECAO_GLOBAL).find({ _id: { $gte: desde } as any }).sort({ _id: -1 }).limit(15).toArray(),
    db
      .collection(COLECAO_USO)
      .find({ dia: hoje })
      .sort({ mensagens: -1 })
      .limit(10)
      .project({ userId: 1, mensagens: 1, buscas: 1, tokensEntrada: 1, tokensSaida: 1 })
      .toArray(),
    db.collection(COLECAO_INCIDENTES).find({}).sort({ createdAt: -1 }).limit(60).toArray(),
    db
      .collection('users')
      .find({ domSuspensoAte: { $gt: new Date() } })
      .project({ name: 1, email: 1, domSuspensoAte: 1 })
      .limit(30)
      .toArray(),
  ])

  const ids = topo.map((t) => t.userId).filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id))
  const nomes = ids.length
    ? await db.collection('users').find({ _id: { $in: ids } }).project({ name: 1, email: 1 }).toArray()
    : []
  const nomePorId = new Map(nomes.map((n) => [String(n._id), n]))

  return NextResponse.json(
    {
      limites: LIMITES_DO_DOM,
      dias: dias.map((d) => ({
        dia: d._id,
        mensagens: d.mensagens || 0,
        gemini: d.gemini || 0,
        gateway: d.gateway || 0,
        buscas: d.buscas || 0,
        incidentes: d.incidentes || 0,
        tokensEntrada: d.tokensEntrada || 0,
        tokensSaida: d.tokensSaida || 0,
      })),
      topo: topo.map((t) => ({
        userId: t.userId,
        nome: nomePorId.get(t.userId)?.name || '',
        email: nomePorId.get(t.userId)?.email || '',
        mensagens: t.mensagens || 0,
        buscas: t.buscas || 0,
        tokens: (t.tokensEntrada || 0) + (t.tokensSaida || 0),
      })),
      incidentes: incidentes.map((i) => ({
        id: String(i._id),
        userId: i.userId,
        nome: i.nome,
        email: i.email,
        tipo: i.tipo,
        gravidade: i.gravidade,
        trecho: i.trecho,
        mensagem: i.mensagem,
        modo: i.modo,
        rota: i.rota || '',
        ip: i.ip || '',
        resolvido: !!i.resolvido,
        createdAt: i.createdAt,
      })),
      suspensos: suspensos.map((s) => ({ userId: String(s._id), nome: s.name, email: s.email, ate: s.domSuspensoAte })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}

export async function POST(request: NextRequest) {
  const negado = await exigirAdmin(request)
  if (negado) return negado
  const corpo = await request.json().catch(() => null)
  const db = await getDb()
  if (corpo?.acao === 'liberar' && ObjectId.isValid(corpo.userId)) {
    await db.collection('users').updateOne({ _id: new ObjectId(corpo.userId) }, { $unset: { domSuspensoAte: '' } })
    return NextResponse.json({ ok: true })
  }
  if (corpo?.acao === 'resolver' && ObjectId.isValid(corpo.id)) {
    await db.collection(COLECAO_INCIDENTES).updateOne({ _id: new ObjectId(corpo.id) }, { $set: { resolvido: true } })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}
