import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getPaymentProvider, deriveIdempotencyKey } from '@/lib/payments'
import { applyPaymentResult } from '@/lib/payments/effects'
import { audit } from '@/lib/payments/audit'
import { chargeMetadata, computeCheckoutCharge, getFeePolicy } from '@/lib/payments/fees'
import { resolveCheckoutCpf } from '@/lib/payments/checkout-identity'
import { minutosDesde, pagamentoEmCartaoJaAberto } from '@/lib/payments/duplicate-guard'
import { getRequestAnalyticsMeta, recordCheckoutEvent, recordOrderCheckoutEvent } from '@/lib/analytics'
import { computeEffectivePackagePrice } from '@/lib/material-package-pricing'
import { DEFAULT_PAYMENT_METHODS, paymentMethodDisabledError } from '@/lib/payment-methods'
import {
  applyCouponDiscountsToItems,
  couponAnalyticsMetadata,
  CouponError,
  reserveCouponRedemption,
  releaseCouponRedemption,
  validateCouponForCheckout,
  type CouponValidationResult,
} from '@/lib/coupons'
import {
  MAX_MATERIAL_CART_ITEMS,
  grantMaterialCartItems,
  resolveMaterialCart,
  resolveTimedGrantFields,
  serializeMaterialCartItem,
} from '@/lib/material-cart'
import {
  computeCartTierDiscounts,
  getPricingEventStateById,
  serializePricingEventState,
} from '@/lib/pricing-events'
import {
  combineDiscountsWithProuni,
  prouniAnalyticsMetadata,
  releaseProuniGrant,
  reserveProuniGrant,
  resolveProuniForCart,
  resolveProuniForCheckout,
  spendProuniGrantNow,
  type ProuniProgram,
} from '@/lib/prouni-fies'
import type { PaymentOrder, MaterialPurchase } from '@/lib/types'
import { buildPhysicalShopOrder } from '@/lib/shop-order'
import { isPlusAccount } from '@/lib/account-tier'
import {
  findTimedAccessVersion,
  lifetimeOwnershipFilter,
  versionDuration,
  versionDurationMinutes,
} from '@/lib/material-timed-access'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cria pagamento para material/pacote via Mercado Pago.
 * Para itens gratuitos, libera diretamente.
 */
const PayerAddressSchema = z.object({
  zipCode: z.string().max(20),
  streetName: z.string().max(160),
  streetNumber: z.string().max(20),
  neighborhood: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  federalUnit: z.string().max(4).optional(),
})

const paymentFields = {
  paymentMethodId: z.string().min(1),
  cardToken: z.string().optional(),
  installments: z.number().int().min(1).max(12).optional(),
  issuer: z.string().optional(),
  payerDocumentType: z.enum(['CPF', 'CNPJ']).optional(),
  payerDocumentNumber: z.string().optional(),
  payerAddress: PayerAddressSchema.optional(),
  couponCode: z.string().max(80).optional(),
}

const Schema = z.object({
  itemType: z.enum(['material', 'package']),
  itemId: z.string().min(1),
  /** Versão de acesso por tempo escolhida. Revalidada aqui contra o item. */
  accessVersionId: z.string().max(40).optional(),
  ...paymentFields,
})

const CartSchema = z.object({
  items: z.array(z.object({
    itemType: z.enum(['material', 'package']),
    itemId: z.string().min(1),
    accessVersionId: z.string().max(40).optional(),
  })).min(1).max(MAX_MATERIAL_CART_ITEMS),
  ...paymentFields,
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'materiais_checkout', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: any
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const parsedCart = CartSchema.safeParse(body)
  if (parsedCart.success) {
    // physical é passado à parte (zod remove chaves desconhecidas do schema).
    return handleCartCheckout(request, ip, session, { ...parsedCart.data, physical: body?.physical } as any)
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const data = parsed.data

  const db = await getDb()
  if (!ObjectId.isValid(data.itemId)) {
    return NextResponse.json({ error: 'itemId inválido' }, { status: 400 })
  }
  const collection = data.itemType === 'package' ? 'material_packages' : 'materials'
  const item = await db.collection(collection).findOne({ _id: new ObjectId(data.itemId) })
  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })

  // Versão de acesso por tempo escolhida (opcional). Validada na fonte: um id
  // inválido/desligado cai silenciosamente na versão vitalícia.
  const timedVersion = findTimedAccessVersion(item, data.accessVersionId)
  const timedDurationMinutes = timedVersion ? versionDurationMinutes(timedVersion) : 0

  const userPurchaseOr: any[] = [{ userId: session.userId }]
  if (session.email) {
    userPurchaseOr.push({
      userEmail: {
        $regex: new RegExp(`^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
      },
    })
  }

  const alreadyOwnedRedirect = item.type === 'flashcard_deck' && item.linkedDeckSlug
    ? `/flashcards/d/${item.linkedDeckSlug}`
    : data.itemType === 'package'
      ? `/pacotes/${data.itemId}`
      : `/materiais/${data.itemId}`

  if (timedVersion && item.pricing === 'free') {
    return NextResponse.json({ error: 'Este item é gratuito e não tem versão por tempo.' }, { status: 400 })
  }

  if (session.role === 'admin') {
    return NextResponse.json({
      error: data.itemType === 'package'
        ? 'Você já possui acesso a este pacote.'
        : 'Você já possui acesso a este material.',
      alreadyOwned: true,
      redirectTo: alreadyOwnedRedirect,
    }, { status: 409 })
  }

  // Plus+ já libera todo o acervo — cobrar de novo por um item incluso na
  // assinatura seria dupla cobrança pelo mesmo conteúdo.
  if (ObjectId.isValid(session.userId)) {
    const sessionUser = await db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { accountType: 1 } },
    )
    if (isPlusAccount(sessionUser?.accountType)) {
      return NextResponse.json({
        error: `Este ${data.itemType === 'package' ? 'pacote' : 'material'} já está incluso na sua assinatura Plus+.`,
        alreadyOwned: true,
        redirectTo: alreadyOwnedRedirect,
      }, { status: 409 })
    }
  }

  // Bloqueia recompra
  // Só a posse VITALÍCIA bloqueia. Quem só tem a versão por tempo pode comprar
  // de novo — para renovar o prazo ou trocar pelo acesso definitivo.
  const existing = await db.collection<MaterialPurchase>('material_purchases').findOne({
    itemType: data.itemType,
    itemId: data.itemId,
    status: 'completed',
    ...lifetimeOwnershipFilter(),
    $or: userPurchaseOr,
  })
  if (existing) {
    return NextResponse.json({
      error: 'Você já adquiriu este item',
      alreadyOwned: true,
      redirectTo: alreadyOwnedRedirect,
    }, { status: 409 })
  }

  // Material individual também é considerado adquirido quando o usuário
  // comprou algum pacote que contém esse material. Isso fecha URL direta
  // de checkout e mantém a regra no servidor.
  if (data.itemType === 'material') {
    const packages = await db.collection('material_packages')
      .find({ materialIds: data.itemId, isHidden: { $ne: true } })
      .project({ _id: 1 })
      .toArray()
    const packageIds = packages.map((pkg: any) => String(pkg._id))

    if (packageIds.length > 0) {
      const packagePurchase = await db.collection<MaterialPurchase>('material_purchases').findOne({
        itemType: 'package',
        itemId: { $in: packageIds },
        status: 'completed',
        ...lifetimeOwnershipFilter(),
        $or: userPurchaseOr,
      } as any)

      if (packagePurchase) {
        return NextResponse.json({
          error: 'Você já possui este material por meio de um pacote',
          alreadyOwned: true,
          redirectTo: alreadyOwnedRedirect,
        }, { status: 409 })
      }
    }
  }

  // ─── Anti-burla: desconto proporcional em pacotes ─────────────
  // Se o usuário já comprou algum material que faz parte do pacote,
  // descontamos proporcionalmente. Calculamos no servidor — nunca confiamos
  // em valores enviados pelo cliente.
  let effectivePrice = timedVersion ? Number(timedVersion.price || 0) : Number(item.price || 0)
  let pricingMeta: ReturnType<typeof computeEffectivePackagePrice> | null = null

  // O passe temporário é um valor fechado: não entra no desconto proporcional
  // do pacote (que existe para não cobrar duas vezes pelo acesso definitivo).
  if (!timedVersion && data.itemType === 'package' && Array.isArray(item.materialIds) && item.materialIds.length > 0) {
    const materialObjectIds = (item.materialIds as string[])
      .map((mid) => { try { return new ObjectId(mid) } catch { return null } })
      .filter(Boolean) as ObjectId[]

    const pkgMaterials = materialObjectIds.length > 0
      ? await db.collection('materials')
          .find({ _id: { $in: materialObjectIds } })
          .project({ pricing: 1, price: 1 })
          .toArray()
      : []

    const materialIdsStr = pkgMaterials.map((m: any) => String(m._id))
    const materialIdsSet = new Set(materialIdsStr)
    const ownedSet = new Set<string>()
    if (materialIdsStr.length > 0) {
      // 1) Materiais do pacote comprados individualmente.
      const baseFilter = {
        itemType: 'material',
        status: 'completed',
        itemId: { $in: materialIdsStr },
      }
      const byUserId = await db.collection('material_purchases')
        .find({ ...baseFilter, userId: session.userId })
        .project({ itemId: 1 })
        .toArray()
      let byEmail: any[] = []
      if (session.email) {
        const emailRegex = new RegExp(
          `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        byEmail = await db.collection('material_purchases')
          .find({ ...baseFilter, userEmail: { $regex: emailRegex } })
          .project({ itemId: 1 })
          .toArray()
      }
      for (const p of [...byUserId, ...byEmail]) ownedSet.add(String(p.itemId))

      // 2) Materiais do pacote que o usuário já possui por meio de OUTROS pacotes.
      const ownedPackages = await db.collection('material_purchases')
        .find({ itemType: 'package', status: 'completed', $or: userPurchaseOr } as any)
        .project({ itemId: 1 })
        .toArray()
      const ownedPkgObjectIds = ownedPackages
        .map((p: any) => String(p.itemId))
        .filter((id: string) => id !== data.itemId && ObjectId.isValid(id))
        .map((id: string) => new ObjectId(id))
      if (ownedPkgObjectIds.length > 0) {
        const otherPkgs = await db.collection('material_packages')
          .find({ _id: { $in: ownedPkgObjectIds } })
          .project({ materialIds: 1 })
          .toArray()
        for (const pkg of otherPkgs as any[]) {
          for (const mid of pkg.materialIds || []) {
            const midStr = String(mid)
            if (materialIdsSet.has(midStr)) ownedSet.add(midStr)
          }
        }
      }
    }
    const purchasedMaterialIds = Array.from(ownedSet)

    pricingMeta = computeEffectivePackagePrice({
      pkgPrice: Number(item.price || 0),
      materials: pkgMaterials.map((m: any) => ({
        _id: String(m._id),
        pricing: m.pricing,
        price: m.price,
      })),
      ownedMaterialIds: purchasedMaterialIds,
    })
    effectivePrice = pricingMeta.effectivePrice

    // Já possui TODOS os materiais pagos do pacote → bloqueia (mesma regra do carrinho).
    // Evita "comprar"/adquirir um pacote cujo conteúdo o usuário já tem por inteiro.
    if (
      item.pricing !== 'free' &&
      pricingMeta.totalPaidIndividualValue > 0 &&
      pricingMeta.ownedValue >= pricingMeta.totalPaidIndividualValue
    ) {
      return NextResponse.json({
        error: 'Você já possui todos os materiais deste pacote.',
        alreadyOwned: true,
        redirectTo: '/materiais?tab=mine',
      }, { status: 409 })
    }
  }

  let amount = Number(effectivePrice)
  let couponValidation: CouponValidationResult | null = null

  // Lote dinâmico por evento — aplica desconto progressivo se houver evento ativo.
  const pricingEventState = item.pricingEventId && !timedVersion
    ? await getPricingEventStateById(db, String(item.pricingEventId))
    : null
  let tierDiscountAmount = 0
  if (pricingEventState?.activeTier && amount > 0) {
    tierDiscountAmount = Math.max(
      0,
      Math.round(amount * (pricingEventState.activeTier.discountPercent / 100) * 100) / 100
    )
  }

  let couponDiscountAmount = 0
  if (data.couponCode && amount > 0) {
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: [{
          itemType: data.itemType,
          itemId: data.itemId,
          itemTitle: item.title || 'Item',
          materialType: item.type,
          price: amount,
        }],
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (error: any) {
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  // Benefício PROUNI/FIES desta pessoa neste item. Fica de fora quando a compra
  // é de uma versão por tempo: o passe temporário é um valor fechado, pela
  // mesma razão que o lote não incide sobre ele.
  const prouni = timedVersion
    ? null
    : await resolveProuniForCheckout(db, {
        userId: session.userId,
        itemType: data.itemType,
        itemId: data.itemId,
      })

  // Maior desconto entre lote, cupom e PROUNI — ou lote + PROUNI empilhados,
  // quando o benefício foi configurado para sobrepor o lote.
  const combined = combineDiscountsWithProuni({
    basePrice: amount,
    tierDiscountAmount,
    couponDiscountAmount,
    prouni,
  })
  amount = combined.finalPrice

  // Se o lote/PROUNI venceu, não reserva o cupom (mantém disponível para o usuário).
  if (combined.appliedSource !== 'coupon') {
    couponValidation = null
  }

  const prouniApplied = prouni && combined.prouniDiscountApplied > 0
    ? {
        requestId: prouni.requestId,
        program: prouni.program as ProuniProgram,
        discountAmount: combined.prouniDiscountApplied,
      }
    : null

  // ── Parte física (add-ons/produtos impressos pagos junto ao digital) ──
  let physicalShopOrderId: string | undefined
  let physicalTotal = 0
  const rawPhysical = body?.physical
  if (rawPhysical && Array.isArray(rawPhysical.items) && rawPhysical.items.length > 0) {
    // Materiais/pacotes elegíveis desta compra (para validar add-ons "só junto").
    const eligibleMaterialIds = new Set<string>()
    const eligiblePackageIds = new Set<string>()
    if (data.itemType === 'material') {
      eligibleMaterialIds.add(data.itemId)
    } else if (data.itemType === 'package') {
      eligiblePackageIds.add(data.itemId)
      if (Array.isArray(item.materialIds)) {
        for (const mid of item.materialIds) eligibleMaterialIds.add(String(mid))
      }
    }
    const built = await buildPhysicalShopOrder(
      db,
      { userId: session.userId, name: session.name, email: session.email },
      {
        items: rawPhysical.items.map((i: any) => ({
          productId: String(i.productId),
          quantity: Math.max(1, Math.min(20, Math.floor(Number(i.quantity) || 1))),
          versionId: i.versionId ? String(i.versionId) : undefined,
        })),
        deliveryType: rawPhysical.deliveryType === 'shipping' ? 'shipping' : 'pickup',
        pickupPointId: rawPhysical.pickupPointId,
        shippingAddress: rawPhysical.shippingAddress,
        deliveryMethodId: rawPhysical.deliveryMethodId,
      },
      { eligibleMaterialIds, eligiblePackageIds }
    )
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    if (!built.empty) {
      physicalShopOrderId = built.shopOrderId
      physicalTotal = built.total
    }
  }

  // Free path — só quando digital gratuito E sem parte física a pagar.
  const digitalFree =
    (!timedVersion && item.pricing === 'free') ||
    !item.price ||
    item.price <= 0 ||
    effectivePrice <= 0 ||
    amount <= 0
  const isFreePath = digitalFree && physicalTotal <= 0

  if (isFreePath) {
    // O benefício zerou (ou ajudou a zerar) o preço: não há pagamento para
    // confirmar depois, então ele é gasto agora.
    if (prouniApplied) {
      await spendProuniGrantNow(db, {
        requestId: prouniApplied.requestId,
        userId: session.userId,
        reference: `material:${data.itemId}`,
      })
    }
    if (couponValidation) {
      try {
        await reserveCouponRedemption(db, {
          validation: couponValidation,
          userId: session.userId,
          userName: session.name,
          userEmail: session.email,
          status: 'approved',
        })
      } catch (error: any) {
        if (error instanceof CouponError) {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }
        throw error
      }
    }

    // Versão por tempo com preço zero é um "experimente por N dias": entra
    // aqui, mas continua sendo acesso com prazo — nunca vira vitalício.
    const freePurchaseFilter = {
      userId: session.userId,
      itemType: data.itemType,
      itemId: data.itemId,
      ...(timedVersion
        ? { accessVersionId: timedVersion.id }
        : { accessVersionId: { $exists: false } }),
      status: 'completed',
    }
    const freeTimedFields = timedVersion
      ? await resolveTimedGrantFields(
          db,
          {
            userId: session.userId,
            itemType: data.itemType,
            itemId: data.itemId,
            purchaseFilter: freePurchaseFilter,
            versionId: timedVersion.id,
            versionLabel: timedVersion.label,
            duration: versionDuration(timedVersion),
            durationMinutes: timedDurationMinutes,
          },
          new Date()
        )
      : {}

    await db.collection<MaterialPurchase>('material_purchases').insertOne({
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      itemType: data.itemType,
      itemId: data.itemId,
      itemTitle: item.title,
      price: 0,
      provider: 'mercado_pago',
      status: 'completed',
      purchasedAt: new Date(),
      ...freeTimedFields,
    } as any)
    await db.collection(collection).updateOne(
      { _id: new ObjectId(data.itemId) },
      { $inc: { downloadCount: 1 } }
    )
    await audit({
      action: 'material_unlocked',
      targetUserId: session.userId,
      resourceType: data.itemType,
      resourceId: data.itemId,
      metadata: {
        free: true,
        ...couponAnalyticsMetadata(couponValidation),
        ...prouniAnalyticsMetadata(prouniApplied),
        ...(pricingMeta && pricingMeta.discountApplied > 0
          ? {
              packageDiscountApplied: pricingMeta.discountApplied,
              packageOriginalPrice: pricingMeta.originalPackagePrice,
              ownedMaterialIds: pricingMeta.ownedMaterialIds,
            }
          : {}),
      },
    })
    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: data.itemId,
      productTitle: item.title,
      productType: item.type === 'flashcard_deck' ? 'flashcard' : data.itemType,
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: data.itemType === 'package' ? 'Pacote' : 'Compra direta',
      metadata: {
        free: true,
        itemType: data.itemType,
        materialType: item.type,
        ...couponAnalyticsMetadata(couponValidation),
        ...prouniAnalyticsMetadata(prouniApplied),
        ...(pricingMeta && pricingMeta.discountApplied > 0
          ? {
              packageDiscountApplied: pricingMeta.discountApplied,
              packageOriginalPrice: pricingMeta.originalPackagePrice,
            }
          : {}),
      },
      ...getRequestAnalyticsMeta(request),
    })
    return NextResponse.json({
      free: true,
      success: true,
      redirectTo: item.type === 'flashcard_deck' && item.linkedDeckSlug
        ? `/flashcards/d/${item.linkedDeckSlug}`
        : null,
    })
  }

  // Bloqueia métodos desabilitados pelo admin (Pix/cartão/boleto).
  const adminSettings = await db.collection('admin_settings').findOne({})
  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(adminSettings?.paymentMethods || {}) }
  const methodDisabled = paymentMethodDisabledError(data.paymentMethodId, enabledMethods, {
    hasCardToken: Boolean(data.cardToken),
  })
  if (methodDisabled) {
    return NextResponse.json({ error: methodDisabled }, { status: 400 })
  }

  const description = timedVersion ? `${item.title} — ${timedVersion.label}` : item.title
  // CPF obrigatório (nota fiscal), vinculado ao perfil quando faltar.
  const cpfResult = await resolveCheckoutCpf(db, {
    cpf: data.payerDocumentNumber,
    documentType: data.payerDocumentType,
    userId: session.userId,
    paymentMethodId: data.paymentMethodId,
    hasCardToken: !!data.cardToken,
    enabledMethods,
  })
  if (!cpfResult.ok) {
    return NextResponse.json({ error: cpfResult.error }, { status: cpfResult.status })
  }

  const paidAmount = Math.round((amount + physicalTotal) * 100) / 100

  // Taxa operacional / juros do parcelamento somados ao valor cobrado.
  // `paidAmount` (digital + impressos) segue sendo o valor da COMPRA;
  // `chargedAmount` é o que sai do bolso do comprador.
  const charge = computeCheckoutCharge({
    baseAmount: paidAmount,
    paymentMethodId: data.paymentMethodId,
    installments: data.installments,
    hasCardToken: !!data.cardToken,
    policy: getFeePolicy(),
  })
  const chargedAmount = charge.totalAmount

  // Comissão do sócio (split marketplace): se este material/pacote está marcado
  // como "sem comissão", a parte digital fica de fora da comissão. Add-ons
  // físicos continuam comissionáveis. Ver docs/mercado-pago-split.md.
  const commissionableAmount = item.excludeFromCommission === true
    ? Math.max(0, Math.round(physicalTotal * 100) / 100)
    : paidAmount

  // Trava contra cobrança dupla: outra tentativa em cartão do mesmo usuário
  // ainda em análise/aguardando não pode virar um segundo pagamento aberto.
  if (data.cardToken) {
    const aberto = await pagamentoEmCartaoJaAberto(db, session.userId)
    if (aberto) {
      return NextResponse.json(
        {
          error: `Você já tem um pagamento em cartão em análise, iniciado há ${minutosDesde(aberto.createdAt)} min. Aguarde o resultado antes de tentar com outro cartão — evita cobrança em dobro se os dois forem aprovados.`,
          duplicatePayment: true,
          existingOrderId: aberto.orderId,
        },
        { status: 409 },
      )
    }
  }

  // Cria order interna
  const now = new Date()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'material',
    refId: data.itemId,
    refSlug: item.linkedDeckSlug || undefined,
    amount: chargedAmount,
    baseAmount: paidAmount,
    feeAmount: charge.feeAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemType: data.itemType,
      itemTitle: item.title,
      ...(timedVersion
        ? {
            accessMode: 'timed',
            accessVersionId: timedVersion.id,
            accessVersionLabel: timedVersion.label,
            accessDuration: versionDuration(timedVersion),
            accessDurationMinutes: timedDurationMinutes,
          }
        : {}),
      ...(physicalShopOrderId ? { shopOrderId: physicalShopOrderId } : {}),
      ...(pricingMeta && pricingMeta.discountApplied > 0
        ? {
            packageOriginalPrice: pricingMeta.originalPackagePrice,
            packageDiscountApplied: pricingMeta.discountApplied,
            ownedMaterialIds: pricingMeta.ownedMaterialIds,
          }
        : {}),
      ...(combined.tierDiscountApplied > 0 && pricingEventState?.activeTier
        ? {
            pricingEventId: pricingEventState.eventId,
            pricingEventName: pricingEventState.name,
            pricingEventTierIndex: pricingEventState.activeTier.index,
            pricingEventTierDiscountPercent: pricingEventState.activeTier.discountPercent,
            pricingEventTierDiscountAmount: combined.tierDiscountApplied,
          }
        : {}),
      ...couponAnalyticsMetadata(couponValidation),
      ...prouniAnalyticsMetadata(prouniApplied),
    },
    createdAt: now,
    updatedAt: now,
  }
  const inserted = await db.collection<PaymentOrder>('payment_orders').insertOne(orderDoc as any)
  const orderId = inserted.insertedId.toString()
  const idempotencyKey = deriveIdempotencyKey(orderId)
  await db.collection<PaymentOrder>('payment_orders').updateOne(
    { _id: inserted.insertedId },
    { $set: { idempotencyKey } }
  )
  if (physicalShopOrderId) {
    await db.collection('shop_orders').updateOne(
      { _id: new ObjectId(physicalShopOrderId) },
      { $set: { providerOrderId: orderId, updatedAt: new Date() } }
    )
  }
  // Prende o benefício a este pedido. Se a corrida foi perdida (outro checkout
  // da mesma conta reservou antes), o pedido é derrubado em vez de cobrar o
  // preço com desconto sem ter o desconto — o preço já saiu daqui reduzido.
  if (prouniApplied) {
    const reservado = await reserveProuniGrant(db, {
      requestId: prouniApplied.requestId,
      userId: session.userId,
      orderId,
    })
    if (!reservado) {
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'prouni_unavailable', updatedAt: new Date() } }
      )
      return NextResponse.json(
        { error: 'Seu desconto PROUNI/FIES acabou de ser usado em outra compra.' },
        { status: 409 }
      )
    }
  }
  if (couponValidation) {
    try {
      await reserveCouponRedemption(db, {
        validation: couponValidation,
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        orderId,
      })
    } catch (error: any) {
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'coupon_unavailable', updatedAt: new Date() } }
      )
      if (prouniApplied) await releaseProuniGrant(db, orderId, 'coupon_unavailable')
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }
  await recordOrderCheckoutEvent('order_created', { ...orderDoc, _id: inserted.insertedId, idempotencyKey } as PaymentOrder, {
    productTitle: item.title,
    productType: item.type === 'flashcard_deck' ? 'flashcard' : data.itemType,
    paymentMethod: data.paymentMethodId,
    metadata: { itemType: data.itemType, itemTitle: item.title, materialType: item.type },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: chargedAmount,
      // A comissão do sócio incide sobre a compra — a taxa do Mercado Pago
      // não é receita nossa para ser dividida.
      commissionableAmount,
      currency: 'BRL',
      description,
      payerEmail: session.email,
      payerName: session.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: cpfResult.cpf ? 'CPF' : undefined,
      payerDocumentNumber: cpfResult.cpf || undefined,
      payerAddress: data.payerAddress,
      metadata: {
        orderId,
        type: 'material',
        itemType: data.itemType,
        itemId: data.itemId,
        ...(couponValidation ? { couponCode: couponValidation.code } : {}),
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: data.itemType,
      resourceId: data.itemId,
      metadata: { amount, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId, ...couponAnalyticsMetadata(couponValidation), ...prouniAnalyticsMetadata(prouniApplied), ...chargeMetadata(charge) },
      ip,
    })

    return NextResponse.json({
      orderId,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount: chargedAmount,
      baseAmount: paidAmount,
      feeAmount: charge.feeAmount,
      feeLabel: charge.label,
      successRedirect: physicalShopOrderId
        ? '/profile?tab=pedidos'
        : item.type === 'flashcard_deck' && item.linkedDeckSlug
          ? `/flashcards/d/${item.linkedDeckSlug}`
          : '/materiais',
    })
  } catch (err: any) {
    console.error('[materiais/checkout] erro:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    if (prouniApplied) {
      await releaseProuniGrant(db, orderId, 'provider_error')
    }
    if (physicalShopOrderId) {
      await db.collection('shop_orders').updateOne(
        { _id: new ObjectId(physicalShopOrderId) },
        { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
      )
    }
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json(
      { error: err?.message || 'Falha ao criar pagamento' },
      { status: 502 }
    )
  }
}

async function handleCartCheckout(
  request: NextRequest,
  ip: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  data: z.infer<typeof CartSchema>
) {
  const db = await getDb()
  const resolution = await resolveMaterialCart(db, session, data.items)
  const serializedItems = resolution.items.map(serializeMaterialCartItem)
  const serializedFreeItems = resolution.freeItems.map(serializeMaterialCartItem)
  const serializedPayableItems = resolution.payableItems.map(serializeMaterialCartItem)

  if (resolution.items.length === 0) {
    const allAlreadyOwned = resolution.skippedItems.length > 0 &&
      resolution.skippedItems.every(item => item.reason === 'already_owned')
    return NextResponse.json({
      error: allAlreadyOwned
        ? 'Você já possui todos os itens deste carrinho.'
        : 'Nenhum item disponível para compra no carrinho',
      alreadyOwned: allAlreadyOwned || resolution.skippedItems.some(item => item.reason === 'already_owned'),
      redirectTo: '/materiais?tab=mine',
      skippedItems: resolution.skippedItems,
    }, { status: 409 })
  }

  const alreadyOwnedItems = resolution.skippedItems.filter(item => item.reason === 'already_owned')
  if (alreadyOwnedItems.length > 0) {
    return NextResponse.json({
      error: 'Você já possui alguns itens deste carrinho. Remova-os antes de finalizar a compra.',
      alreadyOwned: true,
      skippedItems: resolution.skippedItems,
    }, { status: 409 })
  }

  let amount = Number(resolution.amount)
  let couponValidation: CouponValidationResult | null = null
  let payableItemsForOrder = resolution.payableItems
  let serializedPayableItemsForOrder = serializedPayableItems

  // Lote dinâmico — soma de descontos por item (cada item pode ter evento diferente).
  const tierCalc = await computeCartTierDiscounts(
    db,
    resolution.payableItems.map((item) => ({
      itemType: item.itemType,
      itemId: item.itemId,
      price: item.price,
      pricingEventId: item.pricingEventId,
    }))
  )
  let couponDiscountAmount = 0
  if (data.couponCode && amount > 0) {
    try {
      couponValidation = await validateCouponForCheckout(db, {
        code: data.couponCode,
        amountBeforeCoupon: amount,
        userId: session.userId,
        userEmail: session.email,
        items: resolution.payableItems.map((item) => ({
          itemType: item.itemType,
          itemId: item.itemId,
          itemTitle: item.itemTitle,
          materialType: item.materialType,
          price: item.price,
        })),
      })
      couponDiscountAmount = couponValidation.discountAmount
    } catch (error: any) {
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  // ── Lote + PROUNI, item a item ──
  // O cupom é do carrinho inteiro; lote e PROUNI são de cada item (cada um tem
  // seu evento, e o benefício foi aprovado para um produto específico). Por
  // isso o desconto "sem cupom" é somado item a item primeiro, e só o TOTAL
  // disputa com o cupom — que continua sendo, como sempre foi, o maior dos dois.
  const tierDiscountById = new Map(
    tierCalc.perItem.map((entry) => [`${entry.itemType}:${entry.itemId}`, entry.tierDiscountAmount])
  )
  const prouniByItem = await resolveProuniForCart(db, {
    userId: session.userId,
    items: resolution.payableItems.map((item) => ({ itemType: item.itemType, itemId: item.itemId })),
  })

  const semCupomPorItem = resolution.payableItems.map((item) => {
    const chave = `${item.itemType}:${item.itemId}`
    const resultado = combineDiscountsWithProuni({
      basePrice: item.price,
      tierDiscountAmount: tierDiscountById.get(chave) || 0,
      couponDiscountAmount: 0,
      prouni: prouniByItem.get(chave) || null,
    })
    return { chave, item, resultado, prouni: prouniByItem.get(chave) || null }
  })
  const totalSemCupom = Math.round(
    semCupomPorItem.reduce((soma, entrada) => soma + entrada.resultado.appliedDiscountAmount, 0) * 100
  ) / 100

  let prouniAppliedItems: Array<{ requestId: string; program: ProuniProgram; itemId: string; discountAmount: number }> = []
  let tierDiscountTotalApplied = 0

  if (couponDiscountAmount > totalSemCupom && couponValidation) {
    amount = couponValidation.amountAfterCoupon
    payableItemsForOrder = applyCouponDiscountsToItems(resolution.payableItems, couponValidation.items)
    serializedPayableItemsForOrder = payableItemsForOrder.map(serializeMaterialCartItem)
  } else if (totalSemCupom > 0) {
    couponValidation = null
    amount = Math.max(0, Math.round((amount - totalSemCupom) * 100) / 100)
    payableItemsForOrder = semCupomPorItem.map(({ item, resultado }) => ({
      ...item,
      price: Math.max(0, Math.round((item.price - resultado.appliedDiscountAmount) * 100) / 100),
      discountApplied: Math.round((item.discountApplied + resultado.appliedDiscountAmount) * 100) / 100,
    }))
    serializedPayableItemsForOrder = payableItemsForOrder.map(serializeMaterialCartItem)
    tierDiscountTotalApplied = Math.round(
      semCupomPorItem.reduce((soma, entrada) => soma + entrada.resultado.tierDiscountApplied, 0) * 100
    ) / 100
    prouniAppliedItems = semCupomPorItem
      .filter((entrada) => entrada.prouni && entrada.resultado.prouniDiscountApplied > 0)
      .map((entrada) => ({
        requestId: entrada.prouni!.requestId,
        program: entrada.prouni!.program as ProuniProgram,
        itemId: entrada.item.itemId,
        discountAmount: entrada.resultado.prouniDiscountApplied,
      }))
  } else {
    couponValidation = null
  }

  // ── Parte física do carrinho (add-ons/produtos impressos pagos junto) ──
  let physicalShopOrderId: string | undefined
  let physicalTotal = 0
  const rawPhysical = (data as any).physical
  if (rawPhysical && Array.isArray(rawPhysical.items) && rawPhysical.items.length > 0) {
    const eligibleMaterialIds = new Set<string>()
    const eligiblePackageIds = new Set<string>()
    for (const it of resolution.items) {
      if (it.itemType === 'material') eligibleMaterialIds.add(String(it.itemId))
      if (it.itemType === 'package') eligiblePackageIds.add(String(it.itemId))
      const matIds = (it as any).materialIds
      if (Array.isArray(matIds)) for (const m of matIds) eligibleMaterialIds.add(String(m))
    }
    const built = await buildPhysicalShopOrder(
      db,
      { userId: session.userId, name: session.name, email: session.email },
      {
        items: rawPhysical.items.map((i: any) => ({
          productId: String(i.productId),
          quantity: Math.max(1, Math.min(20, Math.floor(Number(i.quantity) || 1))),
          versionId: i.versionId ? String(i.versionId) : undefined,
        })),
        deliveryType: rawPhysical.deliveryType === 'shipping' ? 'shipping' : 'pickup',
        pickupPointId: rawPhysical.pickupPointId,
        shippingAddress: rawPhysical.shippingAddress,
        deliveryMethodId: rawPhysical.deliveryMethodId,
      },
      { eligibleMaterialIds, eligiblePackageIds }
    )
    if (!built.ok) {
      return NextResponse.json({ error: built.error }, { status: built.status })
    }
    if (!built.empty) {
      physicalShopOrderId = built.shopOrderId
      physicalTotal = built.total
    }
  }

  if (resolution.freeItems.length > 0) {
    await grantMaterialCartItems(db, session, resolution.freeItems, {
      auditMetadata: { free: true, source: 'cart' },
    })
  }

  if (amount <= 0 && physicalTotal <= 0) {
    // Carrinho zerado: os benefícios que participaram são gastos aqui, porque
    // não haverá pagamento nem webhook para confirmá-los depois.
    for (const aplicado of prouniAppliedItems) {
      await spendProuniGrantNow(db, {
        requestId: aplicado.requestId,
        userId: session.userId,
        reference: `cart:${aplicado.itemId}`,
      })
    }
    if (couponValidation) {
      try {
        await reserveCouponRedemption(db, {
          validation: couponValidation,
          userId: session.userId,
          userName: session.name,
          userEmail: session.email,
          status: 'approved',
        })
      } catch (error: any) {
        if (error instanceof CouponError) {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }
        throw error
      }
    }

    if (payableItemsForOrder.length > 0) {
      await grantMaterialCartItems(db, session, payableItemsForOrder, {
        auditMetadata: { free: true, source: 'cart', ...couponAnalyticsMetadata(couponValidation) },
      })
    }

    const unlockedItems = [...resolution.freeItems, ...payableItemsForOrder]
    await recordCheckoutEvent({
      event: 'payment_approved',
      userId: session.userId,
      userName: session.name,
      userEmail: session.email,
      productId: 'cart',
      productTitle: `Carrinho (${resolution.items.length} itens)`,
      productType: 'material',
      amount: 0,
      paymentMethod: 'free',
      status: 'approved',
      source: 'Carrinho',
      metadata: {
        free: true,
        itemType: 'cart',
        items: unlockedItems.map(serializeMaterialCartItem),
        skippedItems: resolution.skippedItems,
        ...couponAnalyticsMetadata(couponValidation),
      },
      ...getRequestAnalyticsMeta(request),
    })

    return NextResponse.json({
      free: true,
      success: true,
      amount: 0,
      unlockedItems: unlockedItems.map(serializeMaterialCartItem),
      skippedItems: resolution.skippedItems,
      redirectTo: '/materiais?tab=mine&purchase=success',
    })
  }

  if (data.paymentMethodId === 'free') {
    return NextResponse.json({ error: 'Carrinho pago requer uma forma de pagamento válida.' }, { status: 400 })
  }

  // Bloqueia métodos desabilitados pelo admin (Pix/cartão/boleto).
  const adminSettings = await db.collection('admin_settings').findOne({})
  const enabledMethods = { ...DEFAULT_PAYMENT_METHODS, ...(adminSettings?.paymentMethods || {}) }
  const methodDisabled = paymentMethodDisabledError(data.paymentMethodId, enabledMethods, {
    hasCardToken: Boolean(data.cardToken),
  })
  if (methodDisabled) {
    return NextResponse.json({ error: methodDisabled }, { status: 400 })
  }

  const itemCount = payableItemsForOrder.length
  const description = `Carrinho DomineAqui - ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`
  // CPF obrigatório (nota fiscal), vinculado ao perfil quando faltar.
  const cpfResult = await resolveCheckoutCpf(db, {
    cpf: data.payerDocumentNumber,
    documentType: data.payerDocumentType,
    userId: session.userId,
    paymentMethodId: data.paymentMethodId,
    hasCardToken: !!data.cardToken,
    enabledMethods,
  })
  if (!cpfResult.ok) {
    return NextResponse.json({ error: cpfResult.error }, { status: cpfResult.status })
  }

  const paidAmount = Math.round((amount + physicalTotal) * 100) / 100

  // Taxa operacional / juros do parcelamento somados ao valor cobrado.
  // `paidAmount` (digital + impressos) segue sendo o valor da COMPRA;
  // `chargedAmount` é o que sai do bolso do comprador.
  const charge = computeCheckoutCharge({
    baseAmount: paidAmount,
    paymentMethodId: data.paymentMethodId,
    installments: data.installments,
    hasCardToken: !!data.cardToken,
    policy: getFeePolicy(),
  })
  const chargedAmount = charge.totalAmount

  // Comissão do sócio: exclui do split o valor (já com desconto) dos itens do
  // carrinho marcados como "sem comissão". Add-ons físicos seguem comissionáveis.
  const excludedFromCommission = Math.round(
    payableItemsForOrder
      .filter((it) => it.excludeFromCommission === true)
      .reduce((sum, it) => sum + Number(it.price || 0), 0) * 100
  ) / 100
  const commissionableAmount = Math.max(0, Math.round((paidAmount - excludedFromCommission) * 100) / 100)

  // Trava contra cobrança dupla: outra tentativa em cartão do mesmo usuário
  // ainda em análise/aguardando não pode virar um segundo pagamento aberto.
  if (data.cardToken) {
    const aberto = await pagamentoEmCartaoJaAberto(db, session.userId)
    if (aberto) {
      return NextResponse.json(
        {
          error: `Você já tem um pagamento em cartão em análise, iniciado há ${minutosDesde(aberto.createdAt)} min. Aguarde o resultado antes de tentar com outro cartão — evita cobrança em dobro se os dois forem aprovados.`,
          duplicatePayment: true,
          existingOrderId: aberto.orderId,
        },
        { status: 409 },
      )
    }
  }

  const now = new Date()
  const orderDoc: Omit<PaymentOrder, '_id'> = {
    userId: session.userId,
    payerEmail: session.email,
    payerName: session.name,
    provider: 'mercado_pago',
    type: 'material',
    refId: payableItemsForOrder[0]?.itemId,
    amount: chargedAmount,
    baseAmount: paidAmount,
    feeAmount: charge.feeAmount,
    currency: 'BRL',
    status: 'pending',
    idempotencyKey: '',
    metadata: {
      itemType: 'cart',
      itemTitle: description,
      ...(physicalShopOrderId ? { shopOrderId: physicalShopOrderId } : {}),
      cartItems: serializedPayableItemsForOrder,
      freeItems: serializedFreeItems,
      skippedItems: resolution.skippedItems,
      ...(tierDiscountTotalApplied > 0
        ? {
            pricingEventDiscountAmount: tierDiscountTotalApplied,
            pricingEventPerItem: tierCalc.perItem
              .filter((entry) => entry.tierDiscountAmount > 0 && entry.state)
              .map((entry) => ({
                itemType: entry.itemType,
                itemId: entry.itemId,
                eventId: entry.state?.eventId,
                eventName: entry.state?.name,
                tierIndex: entry.state?.activeTier?.index,
                discountPercent: entry.state?.activeTier?.discountPercent,
                discountAmount: entry.tierDiscountAmount,
              })),
          }
        : {}),
      ...(prouniAppliedItems.length > 0
        ? {
            prouniDiscountAmount: Math.round(
              prouniAppliedItems.reduce((soma, entrada) => soma + entrada.discountAmount, 0) * 100
            ) / 100,
            prouniPerItem: prouniAppliedItems,
          }
        : {}),
      ...couponAnalyticsMetadata(couponValidation),
    },
    createdAt: now,
    updatedAt: now,
  }

  const inserted = await db.collection<PaymentOrder>('payment_orders').insertOne(orderDoc as any)
  const orderId = inserted.insertedId.toString()
  const idempotencyKey = deriveIdempotencyKey(orderId)
  await db.collection<PaymentOrder>('payment_orders').updateOne(
    { _id: inserted.insertedId },
    { $set: { idempotencyKey } }
  )
  if (physicalShopOrderId) {
    await db.collection('shop_orders').updateOne(
      { _id: new ObjectId(physicalShopOrderId) },
      { $set: { providerOrderId: orderId, updatedAt: new Date() } }
    )
  }

  for (const aplicado of prouniAppliedItems) {
    const reservado = await reserveProuniGrant(db, {
      requestId: aplicado.requestId,
      userId: session.userId,
      orderId,
    })
    if (!reservado) {
      // Um benefício do carrinho já tinha sido usado em outra aba. Devolve os
      // que este pedido chegou a reservar e derruba o pedido — cobrar o total
      // com desconto sem ter todos os descontos seria prejuízo silencioso.
      await releaseProuniGrant(db, orderId, 'prouni_unavailable')
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'prouni_unavailable', updatedAt: new Date() } }
      )
      return NextResponse.json(
        { error: 'Um dos descontos PROUNI/FIES do carrinho acabou de ser usado em outra compra.' },
        { status: 409 }
      )
    }
  }

  if (couponValidation) {
    try {
      await reserveCouponRedemption(db, {
        validation: couponValidation,
        userId: session.userId,
        userName: session.name,
        userEmail: session.email,
        orderId,
      })
    } catch (error: any) {
      await db.collection<PaymentOrder>('payment_orders').updateOne(
        { _id: inserted.insertedId },
        { $set: { status: 'rejected', statusDetail: 'coupon_unavailable', updatedAt: new Date() } }
      )
      await releaseProuniGrant(db, orderId, 'coupon_unavailable')
      if (error instanceof CouponError) {
        return NextResponse.json({ error: error.message }, { status: error.status })
      }
      throw error
    }
  }

  await recordOrderCheckoutEvent('order_created', { ...orderDoc, _id: inserted.insertedId, idempotencyKey } as PaymentOrder, {
    productId: 'cart',
    productTitle: description,
    productType: 'material',
    paymentMethod: data.paymentMethodId,
    source: 'Carrinho',
    metadata: {
      itemType: 'cart',
      cartSize: resolution.items.length,
      payableSize: resolution.payableItems.length,
      freeSize: resolution.freeItems.length,
      skippedItems: resolution.skippedItems,
    },
    ...getRequestAnalyticsMeta(request),
  })

  try {
    const provider = getPaymentProvider()
    const result = await provider.createPayment({
      externalReference: orderId,
      amount: chargedAmount,
      // A comissão do sócio incide sobre a compra — a taxa do Mercado Pago
      // não é receita nossa para ser dividida.
      commissionableAmount,
      currency: 'BRL',
      description,
      payerEmail: session.email,
      payerName: session.name,
      idempotencyKey,
      paymentMethodId: data.paymentMethodId,
      cardToken: data.cardToken,
      installments: data.installments,
      issuer: data.issuer,
      payerDocumentType: cpfResult.cpf ? 'CPF' : undefined,
      payerDocumentNumber: cpfResult.cpf || undefined,
      payerAddress: data.payerAddress,
      metadata: {
        orderId,
        type: 'material',
        itemType: 'cart',
        cartSize: String(payableItemsForOrder.length),
        ...(couponValidation ? { couponCode: couponValidation.code } : {}),
      },
    })

    await applyPaymentResult(orderId, result)
    await audit({
      action: 'order_created',
      actorUserId: session.userId,
      targetUserId: session.userId,
      resourceType: 'material_cart',
      resourceId: orderId,
      metadata: { amount, paymentMethod: data.paymentMethodId, providerPaymentId: result.providerOrderId, ...couponAnalyticsMetadata(couponValidation), ...chargeMetadata(charge) },
      ip,
    })

    return NextResponse.json({
      orderId,
      providerPaymentId: result.providerOrderId,
      status: result.status,
      paymentMethod: result.paymentMethod,
      pix: result.pix || null,
      boleto: result.boleto || null,
      statusDetail: result.statusDetail,
      amount: chargedAmount,
      baseAmount: paidAmount,
      feeAmount: charge.feeAmount,
      feeLabel: charge.label,
      freeItems: serializedFreeItems,
      skippedItems: resolution.skippedItems,
      successRedirect: physicalShopOrderId ? '/profile?tab=pedidos' : '/materiais?tab=mine&purchase=success',
    })
  } catch (err: any) {
    console.error('[materiais/checkout/cart] erro:', err)
    if (couponValidation) {
      await releaseCouponRedemption(db, orderId, 'provider_error')
    }
    if (prouniAppliedItems.length > 0) {
      await releaseProuniGrant(db, orderId, 'provider_error')
    }
    if (physicalShopOrderId) {
      await db.collection('shop_orders').updateOne(
        { _id: new ObjectId(physicalShopOrderId) },
        { $set: { paymentStatus: 'rejected', updatedAt: new Date() } }
      )
    }
    await db.collection<PaymentOrder>('payment_orders').updateOne(
      { _id: inserted.insertedId },
      { $set: { status: 'rejected', statusDetail: 'provider_error', updatedAt: new Date() } }
    )
    return NextResponse.json(
      { error: err?.message || 'Falha ao criar pagamento' },
      { status: 502 }
    )
  }
}
