import { readFileSync } from 'fs'
import { join } from 'path'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  serializeManualClinicoProduct,
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

function planDurationText(plan: ManualClinicoPublicPlan): string {
  if (plan.key === 'vitalicio' || plan.durationMonths == null) return 'Para sempre — nunca expira'
  const m = plan.durationMonths
  return `${m} ${m === 1 ? 'mês' : 'meses'} de acesso`
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
  const fromVal = hasDiscount
    ? `${formatBRL(cheapestFinal)} <small style="opacity:.55;text-decoration:line-through;font-size:.7em;margin-left:4px;">${formatBRL(cheapestOriginal)}</small>`
    : formatBRL(cheapestFinal)
  return `
        <span class="from">
          <span class="from-lbl">A partir de</span>
          <span class="from-val">${fromVal}</span>
        </span>
        <span class="to">
          <span class="to-lbl">3 planos disponíveis</span>
          <span class="to-val"><span class="curr">Sem · An · Vit</span></span>
        </span>
      `
}

function renderHeroPrice(cheapestFinal: number, cheapestOriginal: number, hasDiscount: boolean): string {
  const cents = Math.round(cheapestFinal * 100) % 100
  const inteiro = Math.floor(cheapestFinal)
  const valor = cents === 0 ? String(inteiro) : `${inteiro},${String(cents).padStart(2, '0')}`
  const old = hasDiscount
    ? `<span class="cta-old">De ${formatBRL(cheapestOriginal)} por</span>`
    : `<span class="cta-old">3 planos a partir de</span>`
  return `
            ${old}
            <span class="cta-new"><span class="cta-curr">R$</span>${valor}</span>
            <span class="cta-tag">Semestral · Anual · Vitalício</span>
          `
}

function renderFinalPrice(cheapestFinal: number, cheapestOriginal: number, hasDiscount: boolean): string {
  const cents = Math.round(cheapestFinal * 100) % 100
  const inteiro = Math.floor(cheapestFinal)
  const valor = cents === 0 ? String(inteiro) : `${inteiro},${String(cents).padStart(2, '0')}`
  const oldLine = hasDiscount
    ? `<span class="fp-old">De <s>${formatBRL(cheapestOriginal)}</s> por</span>`
    : `<span class="fp-old">A partir de</span>`
  return `
      ${oldLine}
      <span class="fp-new"><span class="fp-curr">R$</span>${valor}</span>
      <span class="fp-tag">3 planos disponíveis</span>
    `
}

function renderGuaranteePrice(cheapestFinal: number, hasDiscount: boolean, discountPct: number): string {
  const sub = hasDiscount
    ? `${discountPct}% OFF aplicado · Pix, cartão ou boleto`
    : 'Pix, cartão ou boleto · à vista'
  return `
        <div class="gtitle">A partir de ${formatBRL(cheapestFinal)}</div>
        <div class="gsub">${sub}</div>
      `
}

function renderPlanCard(plan: ManualClinicoPublicPlan, eventMap: Map<string, PricingEventState>): string {
  const { final, original, discountPct, eventLabel } = planFinalPrice(plan, eventMap)
  const isLifetime = plan.key === 'vitalicio'
  const url = `https://domineaqui.com.br/manual-clinico?plan=${plan.key}`
  const cardStyle = isLifetime
    ? 'text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:8px;padding:20px;border-radius:18px;border:2px solid rgba(243,217,153,.6);background:linear-gradient(135deg,rgba(243,217,153,.14),rgba(48,224,147,.06));position:relative;'
    : 'text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:8px;padding:20px;border-radius:18px;border:1px solid rgba(48,224,147,.30);background:rgba(48,224,147,.06);position:relative;'
  const recommendedBadge = isLifetime
    ? '<span style="position:absolute;top:-12px;right:14px;background:#f3d999;color:#1a3326;font-size:10px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;padding:3px 10px;border-radius:999px;">Recomendado</span>'
    : ''
  const tierBadge = discountPct > 0
    ? `<span style="position:absolute;top:-12px;left:14px;background:#30e093;color:#04150c;font-size:10px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;padding:3px 10px;border-radius:999px;">Lote ${escapeHtml(eventLabel || 'ativo')} · ${discountPct}% OFF</span>`
    : ''
  const oldPriceLine = discountPct > 0
    ? `<span style="font-size:13px;opacity:.55;text-decoration:line-through;">De ${formatBRL(original)}</span>`
    : ''
  const priceColor = isLifetime ? '#f3d999' : '#f3d999'
  const ctaColor = isLifetime ? '#f3d999' : '#30e093'
  return `      <a href="${url}" target="_blank" rel="noopener" style="${cardStyle}">
        ${recommendedBadge}${tierBadge}
        <span style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;opacity:.85;">${escapeHtml(plan.label)}</span>
        <span style="font-size:13px;opacity:.7;">${escapeHtml(planDurationText(plan))}</span>
        ${oldPriceLine}
        <span style="font-size:32px;font-weight:900;color:${priceColor};">${formatBRL(final)}</span>
        <span style="margin-top:auto;font-size:13px;font-weight:700;color:${ctaColor};">Assinar ${escapeHtml(plan.label)} →</span>
      </a>`
}

function renderPlanGrid(plans: ManualClinicoPublicPlan[], eventMap: Map<string, PricingEventState>): string {
  return '\n' + plans.map(p => renderPlanCard(p, eventMap)).join('\n') + '\n    '
}

function fallbackResponse() {
  const html = loadTemplate()
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
    const cheapest = planPrices.reduce((min, p) => (p.final < min.final ? p : min), planPrices[0])
    const hasDiscount = cheapest.discountPct > 0 && cheapest.original > cheapest.final

    html = replaceBetweenMarkers(html, '<!--LDPG_PROMO_PRICE_START-->', '<!--LDPG_PROMO_PRICE_END-->',
      renderPromoPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_HERO_PRICE_START-->', '<!--LDPG_HERO_PRICE_END-->',
      renderHeroPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_PLAN_GRID_START-->', '<!--LDPG_PLAN_GRID_END-->',
      renderPlanGrid(enabledPlans, eventMap))
    html = replaceBetweenMarkers(html, '<!--LDPG_FINAL_PRICE_START-->', '<!--LDPG_FINAL_PRICE_END-->',
      renderFinalPrice(cheapest.final, cheapest.original, hasDiscount))
    html = replaceBetweenMarkers(html, '<!--LDPG_GUARANTEE_PRICE_START-->', '<!--LDPG_GUARANTEE_PRICE_END-->',
      renderGuaranteePrice(cheapest.final, hasDiscount, cheapest.discountPct))
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
