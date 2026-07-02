import { readFileSync } from 'fs'
import { join } from 'path'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  serializeManualClinicoProduct,
  DEFAULT_MANUAL_CLINICO_PLANS,
  type ManualClinicoPublicPlan,
} from '@/lib/manual-clinico-product'
import {
  applyPricingEventToPrice,
  getPricingEventStatesByIds,
  type PricingEventState,
} from '@/lib/pricing-events'

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

function formatBRL(value: number): string {
  return `R$ ${(Math.round(value * 100) / 100).toFixed(2).replace('.', ',')}`
}

function planFinalPrice(plan: ManualClinicoPublicPlan, eventMap: Map<string, PricingEventState>) {
  const event = plan.pricingEventId ? eventMap.get(plan.pricingEventId) : null
  if (!event?.activeTier) {
    return { final: plan.price, original: plan.price, discountPct: 0, eventLabel: '' }
  }
  const applied = applyPricingEventToPrice(event, plan.price)
  return {
    final: applied.priceAfterTier,
    original: applied.originalPrice,
    discountPct: applied.discountPercentApplied,
    eventLabel: event.activeTier.label || '',
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function replaceBetweenMarkers(html: string, startMarker: string, endMarker: string, replacement: string): string {
  const startIdx = html.indexOf(startMarker)
  const endIdx = html.indexOf(endMarker)
  if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) return html
  return html.slice(0, startIdx + startMarker.length) + replacement + html.slice(endIdx)
}

function renderPromoPrice(cheapestFinal: number, cheapestOriginal: number, hasDiscount: boolean): string {
  const oldPart = hasDiscount
    ? `<span class="from-old">${formatBRL(cheapestOriginal)}</span>`
    : ''
  return `
        <span class="from">
          <span class="from-lbl">Por apenas</span>
          <span class="from-row">${oldPart}<span class="from-val">${formatBRL(cheapestFinal)}</span></span>
        </span>
      `
}

function renderHeroPrice(cheapestFinal: number, cheapestOriginal: number, hasDiscount: boolean): string {
  const cents = Math.round(cheapestFinal * 100) % 100
  const inteiro = Math.floor(cheapestFinal)
  const valor = cents === 0 ? String(inteiro) : `${inteiro},${String(cents).padStart(2, '0')}`
  const old = hasDiscount
    ? `<span class="cta-old">De ${formatBRL(cheapestOriginal)} por</span>`
    : `<span class="cta-old">Por apenas</span>`
  return `
            ${old}
            <span class="cta-new"><span class="cta-curr">R$</span>${valor}</span>
            <span class="cta-tag">Acesso completo e imediato</span>
          `
}

function renderFinalPrice(cheapestFinal: number, cheapestOriginal: number, hasDiscount: boolean): string {
  const cents = Math.round(cheapestFinal * 100) % 100
  const inteiro = Math.floor(cheapestFinal)
  const valor = cents === 0 ? String(inteiro) : `${inteiro},${String(cents).padStart(2, '0')}`
  const oldLine = hasDiscount
    ? `<span class="fp-old">De <s>${formatBRL(cheapestOriginal)}</s> por</span>`
    : `<span class="fp-old">Por apenas</span>`
  return `
      ${oldLine}
      <span class="fp-new"><span class="fp-curr">R$</span>${valor}</span>
      <span class="fp-tag">Acesso completo e imediato</span>
    `
}

function renderGuaranteePrice(cheapestFinal: number, hasDiscount: boolean, discountPct: number): string {
  const sub = hasDiscount
    ? `${Math.round(discountPct)}% OFF aplicado · Pix, cartão ou boleto`
    : 'Pix, cartão ou boleto · à vista'
  return `
        <div class="gtitle">Por apenas ${formatBRL(cheapestFinal)}</div>
        <div class="gsub">${sub}</div>
      `
}

function renderPlanGrid(plan: ManualClinicoPublicPlan, eventMap: Map<string, PricingEventState>): string {
  const { final, original, discountPct, eventLabel } = planFinalPrice(plan, eventMap)
  const tierBadge = discountPct > 0
    ? `<span style="position:absolute;top:-12px;left:14px;background:#30e093;color:#04150c;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:999px;">Lote ${escapeHtml(eventLabel || 'ativo')} · ${Math.round(discountPct)}% OFF</span>`
    : ''
  const oldPriceLine = discountPct > 0
    ? `<span style="font-size:13px;opacity:.55;text-decoration:line-through;">De ${formatBRL(original)}</span>`
    : ''
  return `
      <a href="https://domineaqui.com.br/manual-clinico" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:8px;padding:20px;border-radius:18px;border:1px solid rgba(48,224,147,.30);background:rgba(48,224,147,.06);position:relative;">
        ${tierBadge}
        <span style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.85;">Manual Clínico</span>
        <span style="font-size:13px;opacity:.7;">Acesso completo — 220+ patologias</span>
        ${oldPriceLine}
        <span style="font-size:32px;font-weight:900;color:#f3d999;">${formatBRL(final)}</span>
        <span style="margin-top:auto;font-size:13px;font-weight:700;color:#30e093;">Desbloquear agora →</span>
      </a>
    `
}

// Substitui o preço da meta-description (SEO/preview). Fica fora dos markers de
// HTML porque é um atributo, então usa um token dedicado. Nunca pode vazar o
// token literal para o Google, por isso é aplicado em todos os caminhos.
function setMetaPrice(html: string, price: number): string {
  return html.split('{{LDPG_META_PRICE}}').join(formatBRL(price))
}

function cheapestDefaultPrice(): number {
  const enabled = DEFAULT_MANUAL_CLINICO_PLANS.filter(p => p.enabled)
  const prices = (enabled.length ? enabled : DEFAULT_MANUAL_CLINICO_PLANS).map(p => p.price)
  return Math.min(...prices)
}

function fallbackResponse() {
  const html = setMetaPrice(loadTemplate(), cheapestDefaultPrice())
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=86400',
    },
  })
}

export async function GET() {
  let html = loadTemplate()
  try {
    const db = await getDb()
    const config = await getManualClinicoConfig(db)
    const product = serializeManualClinicoProduct(config)

    const enabledPlans = product.plans
      .filter(p => p.enabled)
      .sort((a, b) => PLAN_ORDER.indexOf(a.key) - PLAN_ORDER.indexOf(b.key))

    if (enabledPlans.length === 0) return fallbackResponse()

    const eventIds = Array.from(new Set(enabledPlans.map(p => p.pricingEventId).filter((id): id is string => !!id)))
    const eventMap = eventIds.length > 0 ? await getPricingEventStatesByIds(db, eventIds) : new Map<string, PricingEventState>()

    const planPrices = enabledPlans.map(p => planFinalPrice(p, eventMap))
    let cheapestIdx = 0
    for (let i = 1; i < planPrices.length; i++) {
      if (planPrices[i].final < planPrices[cheapestIdx].final) cheapestIdx = i
    }
    const cheapest = planPrices[cheapestIdx]
    const cheapestPlan = enabledPlans[cheapestIdx]
    const hasDiscount = cheapest.discountPct > 0 && cheapest.original > cheapest.final

    html = replaceBetweenMarkers(html, '<!--LDPG_PROMO_PRICE_START-->', '<!--LDPG_PROMO_PRICE_END-->',
      renderPromoPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_HERO_PRICE_START-->', '<!--LDPG_HERO_PRICE_END-->',
      renderHeroPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_PLAN_GRID_START-->', '<!--LDPG_PLAN_GRID_END-->',
      renderPlanGrid(cheapestPlan, eventMap))
    html = replaceBetweenMarkers(html, '<!--LDPG_FINAL_PRICE_START-->', '<!--LDPG_FINAL_PRICE_END-->',
      renderFinalPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_GUARANTEE_PRICE_START-->', '<!--LDPG_GUARANTEE_PRICE_END-->',
      renderGuaranteePrice(cheapest.final, hasDiscount, cheapest.discountPct))
    html = replaceBetweenMarkers(html, '<!--LDPG_PROMO_OFF_START-->', '<!--LDPG_PROMO_OFF_END-->',
      hasDiscount ? `−${Math.round(cheapest.discountPct)}%` : '')
    html = setMetaPrice(html, cheapest.final)
  } catch (error) {
    console.error('[ldpg-mnclinico] render error:', error)
    return fallbackResponse()
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}
