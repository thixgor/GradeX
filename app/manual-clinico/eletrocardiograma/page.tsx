'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Activity, ArrowLeft, Crown, Lock, ArrowRight, HeartPulse, Loader2, Gauge, Ruler, GraduationCap } from 'lucide-react'

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

interface AccessResp {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: 'premium' | 'essential' | null }
  product: {
    label: string
    ctaText: string
    isActive: boolean
    currentPrice: number
    hasActivePromotion: boolean
    price: number
    plans?: { key: string; price: number; enabled: boolean }[]
  }
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0))
}

export default function EletrocardiogramaPage() {
  return (
    <AppShell allowGuest showHeader={false}>
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

  function goToCheckout() {
    if (!isAuthenticated) {
      router.push('/comprar?productType=manual_clinico')
      return
    }
    router.push('/manual-clinico/checkout')
  }

  const cheapest = (data?.product?.plans || []).filter((p) => p.enabled).reduce<number | null>((min, p) => (min == null ? p.price : Math.min(min, p.price)), null)
  const price = cheapest ?? data?.product?.currentPrice ?? 0

  return (
    <div className="surface-page min-h-screen">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 pb-6 pt-6">
          <button onClick={() => router.push('/manual-clinico')} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-500/10 p-3 text-red-500">
                <HeartPulse className="h-7 w-7" />
              </div>
              <div>
                <p className="editorial-mark">Seção premium · Manual Clínico</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Manual do Eletrocardiograma</h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Simulador interativo de ECG: 12 derivações geradas matematicamente em tempo real, medidas automáticas, régua, modo monitor e banco de traçados com critérios diagnósticos internacionais.
                </p>
              </div>
            </div>
            {ready && hasAccess && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                <Crown className="h-4 w-4" /> Acesso liberado
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        {!ready ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasAccess ? (
          <EcgSimulator />
        ) : (
          <PaywallCard onCheckout={goToCheckout} isAuthenticated={isAuthenticated} price={price} product={data?.product} />
        )}
      </div>
    </div>
  )
}

function PaywallCard({ onCheckout, isAuthenticated, price, product }: { onCheckout: () => void; isAuthenticated: boolean; price: number; product?: AccessResp['product'] }) {
  const features = [
    { icon: Activity, t: '12 derivações em tempo real', d: 'Traçados vetoriais gerados por parâmetros eletrofisiológicos — nunca imagens prontas.' },
    { icon: Gauge, t: 'Papel milimetrado real', d: 'Velocidades 25/50/100 mm/s e ganhos 5/10/20 mm/mV, calibração 10 mm = 1 mV.' },
    { icon: Ruler, t: 'Medidas automáticas e régua', d: 'FC, PR, QRS, QT, QTc, eixo e amplitudes; paquímetro para medir intervalos.' },
    { icon: GraduationCap, t: 'Banco de traçados + exercícios', d: 'Arritmias, IAM, bloqueios, distúrbios eletrolíticos e canalopatias com critérios diagnósticos e modo prova.' },
  ]
  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-400/10 via-card/70 to-emerald-400/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-amber-300/15 p-3 text-amber-400"><Lock className="h-6 w-6" /></div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-500">Conteúdo privativo</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Manual do Eletrocardiograma</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Uma seção exclusiva para <strong>assinantes do Manual Clínico e Premium</strong>. Um simulador de ECG de nível hospitalar, com traçados dinâmicos, medidas automáticas e um banco completo de padrões comentados segundo AHA, ACC, ESC e SBC.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.t} className="rounded-2xl border border-white/10 bg-background/40 p-4">
              <f.icon className="mb-2 h-5 w-5 text-primary" />
              <p className="text-sm font-bold">{f.t}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {product?.isActive && price > 0 && (
              <p className="text-sm text-muted-foreground">
                Incluso no Manual Clínico · a partir de <span className="text-lg font-black text-primary">{formatBRL(price)}</span>
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">Acesso imediato · atualizações inclusas.</p>
          </div>
          <button onClick={onCheckout}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-black text-primary-foreground transition hover:bg-primary/90 active:scale-[0.98]">
            <Crown className="h-4 w-4" />
            {isAuthenticated ? 'Desbloquear o Manual Clínico' : 'Entrar e desbloquear'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
