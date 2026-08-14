import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  buildCouponPromoPayload,
  isCouponItemEligible,
  isCouponPromoVisible,
  type Coupon,
  type CouponCheckoutItem,
  type CouponProductType,
} from '@/lib/coupons'
import type { ManualClinicoPlanKey, User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Chamativos de cupom para uma tela de checkout.
 *
 * Responde "existe alguma promoção que este item alcança, e o que posso dizer
 * dela?". É só leitura e só de campanha: o desconto continua sendo calculado e
 * cobrado por /api/coupons/validate e pelos checkouts autoritativos — nada aqui
 * altera preço.
 *
 * Público de propósito: as telas de compra sem login (/comprar, checkout de
 * material por Serial Key) precisam anunciar a promoção para quem ainda não tem
 * conta. Por isso o que sai daqui é o payload público montado em
 * `buildCouponPromoPayload` — nunca o documento do cupom.
 *
 * Formato: `?item=<itemType>:<itemId>[:<materialType>]`, repetível para
 * carrinho. `planKey` só é lido no Manual Clínico.
 */

const TIPOS_VALIDOS: CouponProductType[] = ['material', 'package', 'manual_clinico', 'plus']
const MAX_ITENS = 30
const MAX_PROMOS = 3

function parseItens(params: URLSearchParams): CouponCheckoutItem[] {
  const itens: CouponCheckoutItem[] = []
  for (const bruto of params.getAll('item').slice(0, MAX_ITENS)) {
    const [itemType, itemId, materialType] = String(bruto).split(':')
    if (!TIPOS_VALIDOS.includes(itemType as CouponProductType)) continue
    if (!itemId) continue
    itens.push({
      itemType: itemType as CouponProductType,
      itemId,
      itemTitle: '',
      materialType: materialType || undefined,
      // Só a elegibilidade por escopo importa aqui; o preço real é resolvido
      // pelo servidor no momento de validar o cupom, não nesta vitrine.
      price: 0,
    })
  }
  return itens
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const itens = parseItens(params)
  if (itens.length === 0) return NextResponse.json({ promos: [] })

  const planKey = params.get('planKey') as ManualClinicoPlanKey | null

  // O try cobre TUDO que fala com o banco, rate limit incluído: `checkRateLimit`
  // também abre conexão, e deixá-lo de fora fazia uma indisponibilidade do Mongo
  // virar 500 numa tela de pagamento — exatamente o que esta rota promete nunca
  // causar.
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await checkRateLimit(ip, 'coupon_promo', 60, 60_000)
    if (!rl.success) return NextResponse.json({ promos: [] })

    const db = await getDb()
    const agora = new Date()

    // O filtro fino (escopo, unidade, plano) roda em memória: a coleção de
    // cupons é pequena e as regras já vivem em lib/coupons.ts — duplicá-las
    // como query do Mongo criaria uma segunda fonte de verdade.
    const candidatos = await db.collection<Coupon>('coupons')
      .find({ 'promo.enabled': true, isActive: true })
      .limit(200)
      .toArray()

    const visiveis = candidatos.filter((cupom) => isCouponPromoVisible(cupom, agora))
    if (visiveis.length === 0) return NextResponse.json({ promos: [] })

    // Unidade da faculdade só é consultada se algum candidato restringir por
    // ela — não vale um SELECT no usuário a cada abertura de checkout.
    let unidadeDoUsuario: string | null = null
    let precisaDeUnidade = visiveis.some((cupom) => cupom.allowedAfyaUnits?.length)
    if (precisaDeUnidade) {
      const session = await getSession()
      if (session?.userId && ObjectId.isValid(session.userId)) {
        const user = await db.collection<User>('users').findOne(
          { _id: new ObjectId(session.userId) as any },
          { projection: { isAfyaMedicineStudent: 1, afyaUnit: 1 } }
        )
        if (user?.isAfyaMedicineStudent && user.afyaUnit) unidadeDoUsuario = user.afyaUnit
      }
    }

    const promos = visiveis
      .filter((cupom) => {
        // Campanha fechada por unidade não vira vitrine aberta: quem não é da
        // unidade (visitante incluído) nem fica sabendo que o código existe.
        if (cupom.allowedAfyaUnits?.length) {
          if (!unidadeDoUsuario) return false
          if (!cupom.allowedAfyaUnits.includes(unidadeDoUsuario)) return false
        }
        // Cupom preso a planos do Manual Clínico só se anuncia no plano certo.
        if (cupom.allowedManualPlans?.length && planKey && !cupom.allowedManualPlans.includes(planKey)) {
          return false
        }
        return itens.some((item) => isCouponItemEligible(cupom, item))
      })
      // Maior desconto primeiro — se há duas campanhas vivas para o mesmo item,
      // anunciar a menor seria trabalhar contra a própria conversão.
      .sort((a, b) => {
        if (a.discountType === b.discountType) return Number(b.discountValue) - Number(a.discountValue)
        return a.discountType === 'percentage' ? -1 : 1
      })
      .slice(0, MAX_PROMOS)
      .map(buildCouponPromoPayload)

    return NextResponse.json({ promos })
  } catch (error) {
    // Vitrine não derruba checkout: sem promo, a tela segue igual ao que era
    // antes desta rota existir.
    console.error('[coupons/promo] erro:', error)
    return NextResponse.json({ promos: [] })
  }
}
