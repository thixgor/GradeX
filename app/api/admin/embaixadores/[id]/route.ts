import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getDb } from '@/lib/mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { isPlusAccount } from '@/lib/account-tier'
import { exigirAdmin } from '@/lib/embaixadores/admin'
import { COLECAO_EMBAIXADORES, esquecerCodigoEmCache, montarPainel, type Embaixador } from '@/lib/embaixadores/servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Contexto = { params: Promise<{ id: string }> }

/** O painel completo de um embaixador, como o admin vê, e o plano da conta dele. */
export async function GET(request: NextRequest, { params }: Contexto) {
  const { recusa } = await exigirAdmin()
  if (recusa) return recusa
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })

  try {
    const db = await getDb()
    const embaixador = await db.collection<Embaixador>(COLECAO_EMBAIXADORES).findOne({ _id: new ObjectId(id) })
    if (!embaixador) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })
    const [painel, conta] = await Promise.all([
      montarPainel(db, embaixador, 'admin'),
      ObjectId.isValid(embaixador.userId)
        ? db.collection('users').findOne(
            { _id: new ObjectId(embaixador.userId) },
            { projection: { accountType: 1, premiumExpiresAt: 1, premiumPlanType: 1 } },
          )
        : null,
    ])
    return jsonComprimido(
      request,
      {
        painel,
        conta: {
          accountType: conta?.accountType || 'gratuito',
          temPlus: isPlusAccount(conta?.accountType),
          plusExpiraEm: conta?.premiumExpiresAt ? new Date(conta.premiumExpiresAt).toISOString() : null,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[admin/embaixadores/id] GET', erro)
    return NextResponse.json({ error: 'Erro ao carregar o embaixador' }, { status: 500 })
  }
}

const Edicao = z.object({
  tipo: z.enum(['remunerado', 'nao_remunerado']).optional(),
  comissaoPercent: z.number().min(0).max(100).optional(),
  descontoCupom: z.number().min(1).max(100).optional(),
  status: z.enum(['ativo', 'pausado', 'encerrado']).optional(),
  faculdade: z.string().max(120).optional(),
  periodo: z.string().max(30).optional(),
  instagram: z.string().max(60).optional(),
  telefone: z.string().max(30).optional(),
  observacoes: z.string().max(2000).optional(),
})

/**
 * Edita o embaixador. Mudar a comissão (ou o tipo) vale para as vendas daqui
 * em diante — as já registradas guardam a porcentagem do dia em que
 * aconteceram. Pausar ou encerrar desliga o cupom; reativar liga de novo.
 */
export async function PATCH(request: NextRequest, { params }: Contexto) {
  const { recusa } = await exigirAdmin()
  if (recusa) return recusa
  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })

  let dados: z.infer<typeof Edicao>
  try {
    dados = Edicao.parse(await request.json())
  } catch (erro: any) {
    return NextResponse.json({ error: erro?.issues?.[0]?.message || 'Dados inválidos' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const embaixadores = db.collection<Embaixador>(COLECAO_EMBAIXADORES)
    const atual = await embaixadores.findOne({ _id: new ObjectId(id) })
    if (!atual) return NextResponse.json({ error: 'Embaixador não encontrado' }, { status: 404 })

    const agora = new Date()
    const set: Partial<Embaixador> = { atualizadoEm: agora }
    const unset: Record<string, ''> = {}
    for (const campo of ['faculdade', 'periodo', 'telefone', 'observacoes'] as const) {
      if (dados[campo] !== undefined) set[campo] = dados[campo]!.trim()
    }
    if (dados.instagram !== undefined) set.instagram = dados.instagram.trim().replace(/^@+/, '')
    const tipo = dados.tipo ?? atual.tipo
    if (dados.tipo !== undefined) set.tipo = dados.tipo
    if (dados.comissaoPercent !== undefined || dados.tipo !== undefined) {
      set.comissaoPercent = tipo === 'remunerado' ? (dados.comissaoPercent ?? atual.comissaoPercent ?? 0) : 0
    }
    if (dados.descontoCupom !== undefined) set.descontoCupom = dados.descontoCupom
    if (dados.status !== undefined && dados.status !== atual.status) {
      set.status = dados.status
      if (dados.status === 'encerrado') set.encerradoEm = agora
      else unset.encerradoEm = ''
    }

    await embaixadores.updateOne(
      { _id: atual._id },
      { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    )

    // O cupom acompanha: desconto novo e liga/desliga com o status.
    if (atual.couponId && ObjectId.isValid(atual.couponId)) {
      const cupomSet: Record<string, unknown> = { updatedAt: agora }
      if (dados.descontoCupom !== undefined) cupomSet.discountValue = dados.descontoCupom
      if (set.status) cupomSet.isActive = set.status === 'ativo'
      if (Object.keys(cupomSet).length > 1) {
        await db.collection('coupons').updateOne({ _id: new ObjectId(atual.couponId) }, { $set: cupomSet })
      }
    }
    esquecerCodigoEmCache(atual.codigo)
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[admin/embaixadores/id] PATCH', erro)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
