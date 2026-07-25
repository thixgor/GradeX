import { readFileSync } from 'fs'
import { join } from 'path'
import type { Db } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { absoluteUrl } from '@/lib/seo'
import {
  getManualClinicoConfig,
  serializeManualClinicoProduct,
  buildManualClinicoCouponItem,
  DEFAULT_MANUAL_CLINICO_PLANS,
  type ManualClinicoPublicPlan,
} from '@/lib/manual-clinico-product'
import {
  applyPricingEventToPrice,
  combineTierAndCouponDiscount,
  getPricingEventStatesByIds,
  type PricingEventState,
} from '@/lib/pricing-events'
import {
  validateCouponForCheckout,
  CouponError,
  type CouponValidationResult,
} from '@/lib/coupons'
import type { ManualClinicoProductConfig } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

let cachedTemplate: string | null = null
function loadTemplate(): string {
  if (!cachedTemplate) {
    cachedTemplate = readFileSync(join(process.cwd(), 'public', 'ldpg-mnclinico.html'), 'utf8')
  }
  return cachedTemplate
}

const PLAN_ORDER: ManualClinicoPublicPlan['key'][] = ['semestral', 'anual', 'vitalicio']

// Destino único de compra. Quem está logado cai no checkout do Manual; quem não
// está é redirecionado pelo middleware para /comprar (venda por Serial Key, sem
// conta). Mandar direto para /comprar jogaria o usuário logado no fluxo sem
// conta, e a compra dele não ficaria vinculada à conta.
const CHECKOUT_PATH = '/manual-clinico/checkout'

/** Preço já resolvido de um plano, com a origem do desconto para exibir na página. */
interface PlanPriceView {
  planKey: ManualClinicoPublicPlan['key']
  planLabel: string
  /** Preço de tabela, antes de lote e cupom. */
  original: number
  /** Preço que o usuário paga hoje. */
  final: number
  /** Desconto total efetivo, em % sobre o preço de tabela. */
  discountPct: number
  /** "Lote 2ª semana", "Cupom BEMVINDO" ou "Lote 2ª semana + cupom BEMVINDO". */
  discountLabel: string
}

function formatBRL(value: number): string {
  return `R$ ${(Math.round(value * 100) / 100).toFixed(2).replace('.', ',')}`
}

function roundMoney(value: number): number {
  return Math.max(0, Math.round(Number(value || 0) * 100) / 100)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Resolve o preço final de um plano exatamente como o checkout faz
 * (app/api/manual-clinico/checkout/route.ts): lote do evento de preços, cupom
 * padrão do plano, e a regra de empilhar (`stackWithTier`) ou pegar o maior
 * dos dois. Se as duas pontas divergirem, a landing anuncia um preço que a
 * pessoa não encontra no carrinho — por isso a lógica é espelhada, não recriada.
 */
async function resolvePlanPrice(
  db: Db,
  config: ManualClinicoProductConfig,
  plan: ManualClinicoPublicPlan,
  eventMap: Map<string, PricingEventState>
): Promise<PlanPriceView> {
  const base = roundMoney(plan.price)
  const view: PlanPriceView = {
    planKey: plan.key,
    planLabel: plan.label,
    original: base,
    final: base,
    discountPct: 0,
    discountLabel: '',
  }
  if (base <= 0) return view

  // ── Lote (pricing event) ──
  const eventId = plan.pricingEventId || (config.pricingEventId ? String(config.pricingEventId) : null)
  const event = eventId ? eventMap.get(eventId) : null
  const tier = event?.activeTier || null
  const tierDiscountAmount = tier ? applyPricingEventToPrice(event!, base).tierDiscountAmount : 0
  const tierLabel = tier ? (tier.label || 'lote ativo') : ''

  // ── Cupom padrão do plano ──
  // Só entra o cupom que o checkout aplicaria sozinho, sem o usuário digitar
  // nada. Validamos sem sessão: cupons que dependem de quem está comprando
  // (primeira compra, unidade Afya, limite por usuário) falham aqui e são
  // ignorados de propósito — anunciar um preço que parte do público não
  // consegue no carrinho é pior do que anunciar o preço cheio.
  let coupon: CouponValidationResult | null = null
  if (config.allowCoupons !== false && plan.defaultCouponCode) {
    try {
      coupon = await validateCouponForCheckout(db, {
        code: plan.defaultCouponCode,
        amountBeforeCoupon: base,
        manualPlanKey: plan.key,
        tierDiscountAmount,
        items: [buildManualClinicoCouponItem(config, base)],
      })
    } catch (error) {
      if (!(error instanceof CouponError)) throw error
      coupon = null
    }
  }

  // ── Combinação (mesma regra do checkout) ──
  const stack = coupon?.coupon.stackWithTier === true
  let final: number
  let usedTier: boolean
  let usedCoupon: boolean

  if (stack && tierDiscountAmount > 0 && coupon) {
    final = roundMoney(Math.max(0, base - tierDiscountAmount - coupon.discountAmount))
    usedTier = true
    usedCoupon = true
  } else {
    const combined = combineTierAndCouponDiscount({
      basePrice: base,
      tierDiscountAmount,
      couponDiscountAmount: coupon?.discountAmount || 0,
    })
    final = combined.finalPrice
    usedTier = combined.appliedSource === 'tier'
    usedCoupon = combined.appliedSource === 'coupon'
  }

  const parts: string[] = []
  if (usedTier && tierLabel) parts.push(`Lote ${tierLabel}`)
  if (usedCoupon && coupon) parts.push(`Cupom ${coupon.code}`)

  view.final = final
  view.discountPct = base > 0 ? Math.round(((base - final) / base) * 100) : 0
  view.discountLabel = parts.join(' + ')
  return view
}

// ── Blocos renderados ────────────────────────────────────────────────────────
// Os estilos são inline e usam as mesmas custom properties da landing
// (--fmono, --fdisplay, --ink-3, --accent, --ecg) para o preço injetado sair
// igual ao resto da página, seja no fundo claro (hero) ou escuro (CTA final).

function renderHeroPrice(v: PlanPriceView): string {
  const hasDiscount = v.discountPct > 0 && v.original > v.final
  const old = hasDiscount
    ? `<span style="font-size:1rem; color:var(--ink-3); text-decoration:line-through;">${formatBRL(v.original)}</span>`
    : ''
  const off = hasDiscount
    ? `<span style="font-family:var(--fmono); font-size:0.72rem; font-weight:700; letter-spacing:0.04em; color:#fff; background:var(--accent); padding:4px 10px; border-radius:100px;">−${v.discountPct}% OFF</span>`
    : ''
  const source = hasDiscount && v.discountLabel
    ? `<span style="font-family:var(--fmono); font-size:0.72rem; color:var(--ink-3); letter-spacing:0.03em;">${escapeHtml(v.discountLabel)}</span>`
    : ''
  return `
      <div style="display:flex; flex-wrap:wrap; align-items:baseline; gap:8px 12px; margin-top:26px;">
        <span style="font-family:var(--fmono); font-size:0.72rem; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3);">A partir de</span>
        ${old}
        <span style="font-family:var(--fdisplay); font-weight:700; font-size:1.85rem; line-height:1; letter-spacing:-0.03em; color:var(--ink);">${formatBRL(v.final)}</span>
        ${off}
        ${source}
      </div>`
}

function renderPromoOff(v: PlanPriceView): string {
  if (!(v.discountPct > 0 && v.original > v.final)) return ''
  return `<span style="margin-left:3px; padding:3px 9px; border-radius:100px; background:var(--accent); color:#fff; font-family:var(--fmono); font-size:0.66rem; font-weight:700; letter-spacing:0.06em;">−${v.discountPct}% OFF</span>`
}

function renderFinalPrice(v: PlanPriceView): string {
  const hasDiscount = v.discountPct > 0 && v.original > v.final
  const old = hasDiscount
    ? `<span style="font-family:var(--fmono); font-size:0.9rem; color:#79838a; text-decoration:line-through;">${formatBRL(v.original)}</span>`
    : ''
  const off = hasDiscount
    ? `<span style="font-family:var(--fmono); font-size:0.68rem; font-weight:700; letter-spacing:0.06em; color:#04150c; background:var(--ecg); padding:4px 10px; border-radius:100px;">−${v.discountPct}% OFF</span>`
    : ''
  const source = hasDiscount && v.discountLabel
    ? `<span style="font-family:var(--fmono); font-size:0.7rem; color:#79838a;">${escapeHtml(v.discountLabel)}</span>`
    : `<span style="font-family:var(--fmono); font-size:0.7rem; color:#79838a;">acesso imediato</span>`
  return `
          <span style="font-family:var(--fmono); font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.12em; color:var(--ecg);">${escapeHtml(v.planLabel)}</span>
          <span style="width:1px; height:22px; background:oklch(100% 0 0 / 0.15);"></span>
          ${old}
          <span style="font-family:var(--fdisplay); font-weight:700; font-size:1.65rem; letter-spacing:-0.02em;">${formatBRL(v.final)}</span>
          ${off}
          ${source}
        `
}

/**
 * Dados estruturados de produto. É o que faz o preço aparecer no resultado de
 * busca — o HTML visível o Google lê, mas o rich result de preço vem daqui.
 */
function renderJsonLd(views: PlanPriceView[], cheapest: PlanPriceView): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Manual Clínico',
    description:
      'Mais de 300 patologias aprofundadas com CID-10, fisiopatologia, diagnósticos diferenciais, farmacologia e fluxogramas de tratamento, com o Manual do Eletrocardiograma incluso.',
    brand: { '@type': 'Brand', name: 'DomineAqui' },
    image: [absoluteUrl('/logo.png')],
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: cheapest.final.toFixed(2),
      highPrice: Math.max(...views.map((v) => v.final)).toFixed(2),
      offerCount: views.length,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(CHECKOUT_PATH),
      offers: views.map((v) => ({
        '@type': 'Offer',
        name: v.planLabel,
        priceCurrency: 'BRL',
        price: v.final.toFixed(2),
        availability: 'https://schema.org/InStock',
        url: absoluteUrl(CHECKOUT_PATH),
      })),
    },
  }
  // `</script>` dentro do JSON fecharia a tag mais cedo; nenhum campo aqui é
  // livre hoje, mas o escape mantém isso verdadeiro se algum vier do banco.
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

// ─────────────────────────────────────────────────────────────────────────────

function replaceBetweenMarkers(html: string, startMarker: string, endMarker: string, replacement: string): string {
  const startIdx = html.indexOf(startMarker)
  const endIdx = html.indexOf(endMarker)
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return html
  return html.slice(0, startIdx + startMarker.length) + replacement + html.slice(endIdx)
}

// Substitui o preço da meta-description (SEO/preview). Fica fora dos markers de
// HTML porque é um atributo, então usa um token dedicado. Nunca pode vazar o
// token literal para o Google, por isso é aplicado em todos os caminhos.
function setMetaPrice(html: string, price: number): string {
  return html.split('{{LDPG_META_PRICE}}').join(formatBRL(price))
}

/** Aplica todos os blocos de preço. Usado tanto no caminho normal quanto no fallback. */
function renderPrices(html: string, views: PlanPriceView[], cheapest: PlanPriceView): string {
  html = replaceBetweenMarkers(html, '<!--LDPG_HERO_PRICE_START-->', '<!--LDPG_HERO_PRICE_END-->', renderHeroPrice(cheapest))
  html = replaceBetweenMarkers(html, '<!--LDPG_PROMO_OFF_START-->', '<!--LDPG_PROMO_OFF_END-->', renderPromoOff(cheapest))
  html = replaceBetweenMarkers(html, '<!--LDPG_FINAL_PRICE_START-->', '<!--LDPG_FINAL_PRICE_END-->', renderFinalPrice(cheapest))
  html = replaceBetweenMarkers(html, '<!--LDPG_JSONLD_START-->', '<!--LDPG_JSONLD_END-->', renderJsonLd(views, cheapest))
  return setMetaPrice(html, cheapest.final)
}

// Injeta o Meta Pixel no <head> da landing estática. Esta página é servida
// como HTML puro, fora da árvore React, então o <MetaPixel> do layout raiz não
// a cobre — o Pixel precisa ser inserido aqui para registrar a chegada do
// tráfego do anúncio (PageView) e a visualização do produto (ViewContent).
// Fica desligado enquanto NEXT_PUBLIC_META_PIXEL_ID não estiver definido.
function injectMetaPixel(html: string, price?: number): string {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
  if (!pixelId) return html
  const id = JSON.stringify(pixelId)
  const content = JSON.stringify({
    content_name: 'Manual Clínico',
    content_type: 'product',
    ...(typeof price === 'number' ? { value: price, currency: 'BRL' } : {}),
  })
  const snippet = `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${id});fbq('track','PageView');fbq('track','ViewContent',${content});</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1" alt=""/></noscript>
</head>`
  return html.replace('</head>', snippet)
}

/** Preços de tabela do código, sem lote nem cupom — só quando o banco não responde. */
function defaultPriceViews(): PlanPriceView[] {
  const enabled = DEFAULT_MANUAL_CLINICO_PLANS.filter((p) => p.enabled)
  const plans = enabled.length ? enabled : DEFAULT_MANUAL_CLINICO_PLANS
  return plans.map((p) => ({
    planKey: p.key,
    planLabel: p.label,
    original: roundMoney(p.price),
    final: roundMoney(p.price),
    discountPct: 0,
    discountLabel: '',
  }))
}

function cheapestOf(views: PlanPriceView[]): PlanPriceView {
  return views.reduce((min, v) => (v.final < min.final ? v : min), views[0])
}

function respond(html: string, sMaxAge: number) {
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=86400`,
    },
  })
}

function fallbackResponse() {
  const views = defaultPriceViews()
  const cheapest = cheapestOf(views)
  const html = injectMetaPixel(renderPrices(loadTemplate(), views, cheapest), cheapest.final)
  return respond(html, 60)
}

export async function GET() {
  let html: string
  let cheapestFinal: number
  try {
    const db = await getDb()
    const config = await getManualClinicoConfig(db)
    const product = serializeManualClinicoProduct(config)

    const enabledPlans = product.plans
      .filter((p) => p.enabled)
      .sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key))

    if (enabledPlans.length === 0) return fallbackResponse()

    const eventIds = enabledPlans
      .map((p) => p.pricingEventId || (config.pricingEventId ? String(config.pricingEventId) : null))
      .filter((id): id is string => !!id)
    const eventMap = eventIds.length > 0
      ? await getPricingEventStatesByIds(db, Array.from(new Set(eventIds)))
      : new Map<string, PricingEventState>()

    const views = await Promise.all(
      enabledPlans.map((plan) => resolvePlanPrice(db, config, plan, eventMap))
    )
    const cheapest = cheapestOf(views)
    cheapestFinal = cheapest.final
    html = renderPrices(loadTemplate(), views, cheapest)
  } catch (error) {
    console.error('[ldpg-mnclinico] render error:', error)
    return fallbackResponse()
  }

  return respond(injectMetaPixel(html, cheapestFinal), 300)
}
