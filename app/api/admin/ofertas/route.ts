/**
 * Ofertas exclusivas (admin). Regras e motivos em lib/ofertas-exclusivas.ts.
 *
 * GET  /api/admin/ofertas            → as 50 mais recentes, com situação
 * POST /api/admin/ofertas            → monta, cria o cupom (se pedido) e envia
 */

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  CouponError,
  addCouponDuration,
  isCouponAllowedForUser,
  normalizeCouponCode,
  type Coupon,
} from '@/lib/coupons'
import { resolveMaterialCart } from '@/lib/material-cart'
import {
  MAX_ITENS_DA_OFERTA,
  OFERTAS_COLLECTION,
  OFERTA_MENSAGEM_MAX,
  OFERTA_TITULO_MAX,
  OFERTA_TITULO_PADRAO,
  criarCupomDaOferta,
  estadoDoCupom,
  itensPossuidosPorPessoa,
  situacaoDaOferta,
  usosRestantes,
  type ItemDaOferta,
  type OfertaExclusiva,
} from '@/lib/ofertas-exclusivas'
import { enviarOferta } from '@/lib/ofertas-exclusivas-envio'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CupomSchema = z.discriminatedUnion('modo', [
  z.object({ modo: z.literal('nenhum') }),
  z.object({ modo: z.literal('existente'), codigo: z.string().min(2).max(40) }),
  z.object({
    modo: z.literal('novo'),
    codigo: z.string().max(40).optional(),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.number().positive(),
    usageLimit: z.number().int().positive().nullable().optional(),
    validade: z.enum(['nenhuma', 'duracao', 'data']).default('duracao'),
    duracaoValor: z.number().int().positive().optional(),
    duracaoUnidade: z.enum(['hours', 'days', 'weeks', 'months']).optional(),
    data: z.string().optional(),
    stackWithTier: z.boolean().default(false),
  }),
])

const Schema = z.object({
  userId: z.string().refine(ObjectId.isValid, 'Escolha a pessoa.'),
  itens: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().refine(ObjectId.isValid, 'Item inválido'),
  })).min(1, 'Adicione pelo menos um produto.').max(MAX_ITENS_DA_OFERTA),
  titulo: z.string().max(OFERTA_TITULO_MAX).optional(),
  mensagem: z.string().max(OFERTA_MENSAGEM_MAX).optional(),
  cupom: CupomSchema,
  enviarEmail: z.boolean().default(true),
}).superRefine((data, ctx) => {
  const c = data.cupom
  if (c.modo !== 'novo') return
  if (c.discountType === 'percentage' && c.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['cupom'], message: 'Percentual máximo é 100%.' })
  }
  if (c.validade === 'duracao' && (!c.duracaoValor || !c.duracaoUnidade)) {
    ctx.addIssue({ code: 'custom', path: ['cupom'], message: 'Informe por quanto tempo o cupom vale.' })
  }
  if (c.validade === 'data' && !c.data) {
    ctx.addIssue({ code: 'custom', path: ['cupom'], message: 'Informe até quando o cupom vale.' })
  }
})

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const db = await getDb()
  const ofertas = await db
    .collection<OfertaExclusiva>(OFERTAS_COLLECTION)
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  const couponIds = ofertas
    .map((o) => o.couponId)
    .filter((id): id is string => !!id && ObjectId.isValid(id))
    .map((id) => new ObjectId(id))
  const [possuidos, cupons] = await Promise.all([
    itensPossuidosPorPessoa(db, ofertas),
    couponIds.length
      ? db.collection<Coupon>('coupons').find({ _id: { $in: couponIds as any[] } }).toArray()
      : Promise.resolve([] as Coupon[]),
  ])
  const cupomPorId = new Map(cupons.map((c) => [String(c._id), c]))

  return NextResponse.json({
    ofertas: ofertas.map((o) => {
      const cupom = o.couponId ? cupomPorId.get(o.couponId) : null
      return {
        id: String(o._id),
        userId: o.userId,
        userName: o.userName,
        userEmail: o.userEmail,
        titulo: o.titulo,
        mensagem: o.mensagem || '',
        itens: o.itens,
        situacao: situacaoDaOferta(o, possuidos.get(o.userId) || new Set()),
        cupom: cupom
          ? {
              codigo: cupom.codeNormalized,
              estado: estadoDoCupom(cupom),
              usosRestantes: usosRestantes(cupom),
              usageCount: Number(cupom.usageCount || 0),
              expiresAt: cupom.expiresAt || null,
            }
          : o.couponCode
            ? { codigo: o.couponCode, estado: 'inativo', usosRestantes: null, usageCount: 0, expiresAt: null }
            : null,
        abertaEm: o.abertaEm || null,
        emailEnviadoEm: o.emailEnviadoEm || null,
        emailErro: o.emailErro || null,
        createdByName: o.createdByName,
        createdAt: o.createdAt,
      }
    }),
  })
}

function validadeDoCupom(c: Extract<z.infer<typeof CupomSchema>, { modo: 'novo' }>, agora: Date): Date | null {
  if (c.validade === 'duracao') return addCouponDuration(agora, c.duracaoValor!, c.duracaoUnidade!)
  if (c.validade === 'data') {
    const data = new Date(c.data!)
    if (Number.isNaN(data.getTime())) throw new CouponError('Data de término inválida.')
    if (data <= agora) throw new CouponError('A data de término do cupom já passou.')
    return data
  }
  return null
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
  }
  const data = parsed.data

  try {
    const db = await getDb()
    const pessoa = await db.collection('users').findOne(
      { _id: new ObjectId(data.userId) },
      { projection: { name: 1, email: 1 } }
    )
    if (!pessoa) return NextResponse.json({ error: 'Pessoa não encontrada.' }, { status: 404 })
    const userName = String(pessoa.name || '')
    const userEmail = String(pessoa.email || '').trim().toLowerCase()

    // O carrinho desta pessoa, com as regras do checkout: o que ela já tem (ou
    // leva de graça pelo Plus+) não pode ser vendido de novo numa oferta.
    const resolucao = await resolveMaterialCart(
      db,
      { userId: data.userId, email: userEmail, role: 'user' },
      data.itens
    )
    const barrados = resolucao.skippedItems.filter((i) => i.reason !== 'duplicate')
    if (barrados.length > 0) {
      const motivo: Record<string, string> = {
        already_owned: 'já tem',
        plus_claimable: 'incluso no Plus+ da pessoa',
        included_in_cart_package: 'já está num pacote da oferta',
        not_found: 'não encontrado',
        invalid: 'inválido',
      }
      const lista = barrados.map((i) => `${i.itemTitle || i.itemId} (${motivo[i.reason] || i.reason})`).join('; ')
      return NextResponse.json({ error: `Tire da oferta: ${lista}.` }, { status: 409 })
    }
    if (resolucao.payableItems.length === 0) {
      return NextResponse.json({ error: 'A oferta precisa de pelo menos um produto pago.' }, { status: 400 })
    }

    const itens: ItemDaOferta[] = resolucao.items.map((i) => ({
      itemType: i.itemType,
      itemId: i.itemId,
      titulo: i.itemTitle,
    }))
    const agora = new Date()
    const ofertaId = new ObjectId()
    const admin = { userId: session.userId, name: session.name }

    let couponId: string | null = null
    let couponCode: string | null = null
    let cupomCriadoPelaOferta = false
    const c = data.cupom
    if (c.modo === 'existente') {
      const existente = await db.collection<Coupon>('coupons').findOne({ codeNormalized: normalizeCouponCode(c.codigo) })
      if (!existente) return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 })
      if (!isCouponAllowedForUser(existente, { userId: data.userId, userEmail })) {
        return NextResponse.json({ error: 'Este cupom é exclusivo de outra pessoa.' }, { status: 409 })
      }
      if (estadoDoCupom(existente, agora) !== 'ativo') {
        return NextResponse.json({ error: 'Este cupom está inativo, vencido ou esgotado.' }, { status: 409 })
      }
      couponId = String(existente._id)
      couponCode = existente.codeNormalized
    } else if (c.modo === 'novo') {
      const cupom = await criarCupomDaOferta(db, {
        novo: {
          codigo: c.codigo,
          discountType: c.discountType,
          discountValue: c.discountValue,
          usageLimit: c.usageLimit ?? null,
          expiresAt: validadeDoCupom(c, agora),
          stackWithTier: c.stackWithTier,
        },
        itens,
        userId: data.userId,
        userEmail,
        userName,
        ofertaId: String(ofertaId),
        admin,
        agora,
      })
      couponId = String(cupom._id)
      couponCode = cupom.codeNormalized
      cupomCriadoPelaOferta = true
    }

    const mensagem = data.mensagem?.trim() || ''
    const oferta: OfertaExclusiva = {
      _id: ofertaId,
      userId: data.userId,
      userName,
      userEmail,
      titulo: data.titulo?.trim() || OFERTA_TITULO_PADRAO,
      ...(mensagem ? { mensagem } : {}),
      itens,
      couponId,
      couponCode,
      cupomCriadoPelaOferta,
      status: 'ativa',
      abertaEm: null,
      emailEnviadoEm: null,
      emailErro: null,
      createdBy: admin.userId,
      createdByName: admin.name,
      createdAt: agora,
      updatedAt: agora,
    }
    await db.collection<OfertaExclusiva>(OFERTAS_COLLECTION).insertOne(oferta)

    const envio = await enviarOferta(db, oferta, { email: data.enviarEmail, notificacao: true })

    db.collection('audit_logs').insertOne({
      action: 'oferta_exclusiva_criada',
      adminId: admin.userId,
      adminName: admin.name,
      ofertaId: String(ofertaId),
      userId: data.userId,
      userEmail,
      itens,
      couponCode,
      createdAt: agora,
    }).catch((e) => console.error('[admin/ofertas] auditoria falhou:', e))

    return NextResponse.json({
      success: true,
      id: String(ofertaId),
      link: envio.link,
      couponCode,
      emailEnviado: envio.emailEnviado,
      emailErro: envio.emailErro,
      vitrine: envio.vitrine,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[admin/ofertas] erro:', error)
    return NextResponse.json({ error: 'Erro ao criar a oferta.' }, { status: 500 })
  }
}
