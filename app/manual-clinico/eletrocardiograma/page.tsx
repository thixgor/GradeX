'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
  CartaoDoPacote,
} from '@/components/manual-clinico/pacote'
import { CabecaDoModulo, HeroiDoModulo } from '@/components/manual-clinico/casco/heroi-do-modulo'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import { Activity, Loader2, Gauge, Ruler, GraduationCap, Zap } from 'lucide-react'

// Carregado sob demanda apenas quando o acesso é confirmado — o simulador
// (motor de ECG + banco de traçados) não é enviado a quem não é assinante.
const EcgSimulator = dynamic(() => import('@/components/ecg/ecg-simulator').then((m) => m.EcgSimulator), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

interface ProductPlan {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

interface CatalogSummary {
  total: number
  emergencies: number
  categories: { name: string; count: number }[]
}

interface AccessResp {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    label: string
    ctaText: string
    isActive: boolean
    currentPrice: number
    hasActivePromotion: boolean
    price: number
    pricingEventId?: string | null
    plans?: ProductPlan[]
  }
  catalog?: CatalogSummary
}

const PREVIEW_IMAGE = '/img/eletro/simulador-ecg-preview.webp'

export default function EletrocardiogramaPage() {
  return (
    // guestNotice desligado: o aviso flutuante do shell é `position: fixed` no
    // canto inferior direito e cobria o preview do simulador no desktop e a
    // barra de compra no celular. Aqui ele também é redundante e fora de
    // contexto — fala de catálogo, download e viewer de PDF, enquanto o paywall
    // desta página já explica, no lugar certo, o que está trancado e como abrir.
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <EcgManualContent />
    </AppShell>
  )
}

function EcgManualContent() {
  const router = useRouter()
  const { user, loading: shellLoading } = useAppShell()
  const [data, setData] = useState<AccessResp | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/manual-clinico/eletrocardiograma')
      .then((r) => r.json())
      .then((d) => { if (alive) { setData(d); setLoaded(true) } })
      .catch(() => { if (alive) setLoaded(true) })
    return () => { alive = false }
  }, [])

  const ready = loaded && !shellLoading
  const hasAccess = data?.access?.hasFullAccess === true
  const isAuthenticated = !!user

  // Destino único: o middleware é quem manda quem não tem sessão para /comprar
  // (venda por Serial Key, sem conta). Duplicar essa decisão aqui só criava mais
  // um lugar para desencontrar da regra do servidor.
  function goToCheckout() {
    router.push('/manual-clinico/checkout')
  }

  // Plano mais barato entre os habilitados — é o "a partir de" que a landing
  // também anuncia. Guarda o plano inteiro (e não só o preço) porque o lote
  // que desconta o valor está amarrado ao plano, não ao produto.
  const enabledPlans = (data?.product?.plans || []).filter((p) => p.enabled && p.price > 0)
  const cheapestPlan = enabledPlans.reduce<ProductPlan | null>(
    (min, p) => (min == null || p.price < min.price ? p : min),
    null
  )
  const basePrice = cheapestPlan?.price ?? data?.product?.currentPrice ?? 0
  const eventId = cheapestPlan?.pricingEventId || data?.product?.pricingEventId || null

  return (
    <div className="surface-page min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 pb-6">
        {!ready ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasAccess ? (
          <>
            <CabecaDoModulo
              porta="eletrocardiograma"
              texto="Trilha do nó sinusal ao laudo, construindo o traçado onda por onda, e o simulador de 12 derivações com medidas automáticas e banco de traçados."
              className="mb-5"
            />
            <EcgSimulator />
          </>
        ) : (
          <Paywall
            onCheckout={goToCheckout}
            isAuthenticated={isAuthenticated}
            basePrice={basePrice}
            eventId={eventId}
            planLabel={cheapestPlan?.label || null}
            planMonths={cheapestPlan?.durationMonths ?? null}
            isActive={data?.product?.isActive !== false}
            catalog={data?.catalog}
          />
        )}
      </div>
    </div>
  )
}

const FEATURES = [
  { icon: GraduationCap, t: 'Trilha de ensino do zero ao laudo', d: '11 módulos e 27 lições que constroem o traçado onda por onda, com laboratórios interativos, XP e progresso.' },
  { icon: Activity, t: '12 derivações em tempo real', d: 'Traçados vetoriais gerados por parâmetros eletrofisiológicos — nunca imagens prontas.' },
  { icon: Gauge, t: 'Papel milimetrado real', d: 'Velocidades 25/50/100 mm/s e ganhos 5/10/20 mm/mV, calibração 10 mm = 1 mV.' },
  { icon: Ruler, t: 'Medidas automáticas e régua', d: 'FC, PR, QRS, QT, QTc, eixo e amplitudes; paquímetro para medir intervalos.' },
]

/**
 * Tela que o visitante e o usuário sem assinatura veem no lugar do simulador.
 * Duas colunas no desktop (argumento à esquerda, prova visual + preço à direita,
 * este último grudado enquanto se rola) e uma pilha no celular, onde o preço e o
 * botão também ficam numa barra fixa — sem ela o CTA some depois do primeiro
 * scroll e a pessoa fica sem saber quanto custa.
 */
function Paywall({
  onCheckout, isAuthenticated, basePrice, eventId, planLabel, planMonths, isActive, catalog,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
  basePrice: number
  eventId: string | null
  planLabel: string | null
  planMonths: number | null
  isActive: boolean
  catalog?: CatalogSummary
}) {
  const { state: pricingEvent } = usePricingEventState(eventId)

  const tierPct = pricingEvent?.activeTier?.discountPercent || 0
  const hasTier = !!pricingEvent?.activeTier && pricingEvent?.isActive !== false && tierPct > 0 && basePrice > 0
  const finalPrice = hasTier
    ? Math.max(0, Math.round(basePrice * (1 - tierPct / 100) * 100) / 100)
    : basePrice
  const showPrice = isActive && basePrice > 0

  const totalTracings = catalog?.total ?? 90

  return (
    <>
      {/* O herói é o mesmo de todas as portas do Manual (HeroiDoModulo). */}
      <HeroiDoModulo
        porta="eletrocardiograma"
        titulo={<>Leia o ECG vendo a fisiologia virar onda.</>}
        promessa={
          <>
            Mexa no potássio e veja a T apiculada nascer. Uma trilha do nó sinusal ao laudo e um simulador de 12
            derivações gerado em tempo real — nunca imagem pronta.
          </>
        }
        numeros={[
          { v: totalTracings, r: 'traçados comentados' },
          { v: 27, r: 'lições do zero ao laudo' },
          { v: 12, r: 'derivações em tempo real' },
        ]}
        acoes={
          <>
            <button onClick={onCheckout} className="ck-cta">
              Quero os {TOTAL_DE_MODULOS} manuais
            </button>
            <a href="#previa" className="ck-botao">Ver o simulador</a>
          </>
        }
      >
        <FaixaDoPacote atual="eletrocardiograma" className="mt-2" />
      </HeroiDoModulo>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        {/* ── Coluna do argumento ── */}
        <div className="ck-escopo space-y-6">
          <AvisoJaTenho />

          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.t} className="ck-vidro p-4">
                <f.icon className="mb-2 h-5 w-5" style={{ color: 'var(--ck-verde)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--ck-texto)' }}>{f.t}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>{f.d}</p>
              </div>
            ))}
          </div>

          {catalog && catalog.categories.length > 0 && (
            <div className="ck-vidro p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-heading text-base font-semibold tracking-tight" style={{ color: 'var(--ck-texto)' }}>
                  {catalog.total} traçados comentados
                </h3>
                {catalog.emergencies > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <Zap className="h-3.5 w-3.5" /> {catalog.emergencies} de emergência
                  </span>
                )}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
                Cada padrão vem com critérios diagnósticos segundo AHA, ACC, ESC e SBC.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {catalog.categories.map((c) => (
                  <li key={c.name} className="ck-chip" data-tom="neutro">
                    <span>{c.name}</span>
                    <span className="tabular-nums" style={{ color: 'var(--ck-texto-3)' }}>{c.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Coluna da prova visual + preço ── */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <SimulatorPreview />

          <CartaoDoPacote
            atual="eletrocardiograma"
            titulo={<>O Eletrocardiograma é 1 dos {TOTAL_DE_MODULOS} manuais</>}
            onCheckout={onCheckout}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>

      {/* ── O valor inteiro, e só então o preço ── */}
      <GradeDoPacote atual="eletrocardiograma" className="mt-14" />

      <OfertaDoPacote
        className="mt-10"
        onCheckout={onCheckout}
        isAuthenticated={isAuthenticated}
        precoBase={basePrice}
        precoFinal={finalPrice}
        temLote={hasTier}
        pctLote={tierPct}
        rotuloLote={pricingEvent?.activeTier?.label ?? null}
        rotuloPlano={planLabel}
        mesesDoPlano={planMonths}
        mostrarPreco={showPrice}
      />

      <PerguntasDoPacote className="mt-14" />

      <FechamentoDoPacote
        className="mt-10 mb-28 lg:mb-0"
        onCheckout={onCheckout}
        precoFinal={finalPrice}
        mostrarPreco={showPrice}
      />

      {/* Barra fixa do celular: mantém preço e CTA sempre à mão. */}
      <BarraDoPacote
        onCheckout={onCheckout}
        precoBase={basePrice}
        precoFinal={finalPrice}
        temLote={hasTier}
        pctLote={tierPct}
        mesesDoPlano={planMonths}
        mostrarPreco={showPrice}
      />
    </>
  )
}

/** Print real do simulador em moldura de aparelho — mostra o que se compra. */
function SimulatorPreview({ className = '' }: { className?: string }) {
  return (
    <figure id="previa" className={`m-0 scroll-mt-24 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(52,211,153,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.6) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
          aria-hidden
        />
        <img
          src={PREVIEW_IMAGE}
          alt="Simulador de ECG do Manual Clínico: 12 derivações em papel milimetrado, com medidas de FC, PR e QRS calculadas automaticamente."
          width={760}
          height={1647}
          loading="lazy"
          decoding="async"
          className="relative mx-auto block h-auto w-full max-w-[260px] rounded-xl border border-white/10 shadow-2xl"
        />
      </div>
      <figcaption className="mt-2 text-center text-[12px]" style={{ color: 'var(--ck-texto-3)' }}>
        Tela real do simulador — medidas calculadas a partir do traçado gerado.
      </figcaption>
    </figure>
  )
}
