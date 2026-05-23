'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import {
  Search,
  Pill,
  ArrowRight,
  ArrowLeft,
  X,
  Filter,
  Sparkles,
  Lock,
  Crown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Stethoscope,
} from 'lucide-react'
import { CLASSES_MEDICAMENTOS, CLASSES_MEDICAMENTOS_NAMES } from '@/lib/types/farmacologia'

interface MedicamentoResumo {
  _id: string
  nome: string
  sinonimos: string[]
  classe_principal: string
  subclasse: string
  slug: string
  tipo_farmaco?: string
  isPremiumLocked?: boolean
  accessStatus?: string
}

interface ManualProduct {
  label: string
  benefitText: string
  shortDescription: string
  ctaText: string
  isActive: boolean
  currentPrice: number
  price: number
  hasActivePromotion: boolean
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
}

export default function FarmacologiaPage() {
  return (
    <AppShell allowGuest showHeader={false}>
      <FarmacologiaContent />
    </AppShell>
  )
}

function FarmacologiaContent() {
  const router = useRouter()
  const { user } = useAppShell()
  const isAuthenticated = !!user
  const [busca, setBusca] = useState('')
  const [classeAtiva, setClasseAtiva] = useState('')
  const [medicamentos, setMedicamentos] = useState<MedicamentoResumo[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [product, setProduct] = useState<ManualProduct | null>(null)
  const [hasFullAccess, setHasFullAccess] = useState(false)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const fetchMedicamentos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca.trim()) params.set('busca', busca.trim())
      if (classeAtiva) params.set('classe', classeAtiva)
      const res = await fetch(`/api/farmacologia?${params}`)
      const data = await res.json()
      setMedicamentos(data.medicamentos || [])
      setTotal(data.total || 0)
      if (data.product) setProduct(data.product)
      if (data.access) setHasFullAccess(!!data.access.hasFullAccess)
      setSearched(true)
    } catch (error) {
      console.error('Erro ao buscar fármacos:', error)
    } finally {
      setLoading(false)
    }
  }, [busca, classeAtiva])

  useEffect(() => {
    const timer = setTimeout(() => fetchMedicamentos(), 300)
    return () => clearTimeout(timer)
  }, [fetchMedicamentos])

  function goToCheckout() {
    const target = '/manual-clinico/checkout'
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`)
      return
    }
    router.push(target)
  }

  function openFarmaco(slug: string) {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/manual-clinico/farmacologia/${slug}`)}`)
      return
    }
    router.push(`/manual-clinico/farmacologia/${slug}`)
  }

  // Agrupa por classe e subclasse
  const grupos = medicamentos.reduce((acc: Record<string, Record<string, MedicamentoResumo[]>>, m) => {
    const classe = m.classe_principal || 'Outros'
    const sub = m.subclasse || 'Geral'
    if (!acc[classe]) acc[classe] = {}
    if (!acc[classe][sub]) acc[classe][sub] = []
    acc[classe][sub].push(m)
    return acc
  }, {})

  const classesOrdenadas = Object.keys(grupos).sort((a, b) => {
    const ia = CLASSES_MEDICAMENTOS_NAMES.indexOf(a)
    const ib = CLASSES_MEDICAMENTOS_NAMES.indexOf(b)
    if (ia === -1 && ib === -1) return a.localeCompare(b)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })

  const hasFilters = busca || classeAtiva

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background/60 to-background" />
        </div>
        <div className="relative z-10 container mx-auto px-4 pt-8 pb-10 max-w-6xl">
          <button
            onClick={() => router.push('/manual-clinico')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>

          <div className="text-center mb-7">
            <div className="inline-flex flex-col items-center">
              <div className="inline-flex items-center gap-3 mb-3 px-5 py-2 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12]">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Farmacologia por classes</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-heading bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Farmacologia
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg leading-relaxed">
                Fármacos organizados por classe e subclasse — mecanismo de ação, metabolismo, excreção, efeitos, contraindicações, posologia e calculadora de dose.
              </p>
              {total > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">{total} fármacos disponíveis</span>
                </div>
              )}
            </div>
          </div>

          {/* SEARCH */}
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white/[0.07] backdrop-blur-2xl rounded-2xl border border-white/[0.12] overflow-hidden">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                placeholder="Pesquisar fármaco por nome, sinônimo ou classe..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-12 pr-12 h-14 text-base bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Pesquisar fármacos"
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-muted-foreground"
                  aria-label="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* CLASS FILTER */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/50">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Classes</span>
            </div>
            {CLASSES_MEDICAMENTOS.map(({ classe }) => (
              <button
                key={classe}
                onClick={() => setClasseAtiva(prev => prev === classe ? '' : classe)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-xl transition-all ${
                  classeAtiva === classe
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                    : 'bg-white/[0.05] border-white/[0.1] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground'
                }`}
              >
                {classe}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={() => { setBusca(''); setClasseAtiva('') }}
                className="text-xs text-muted-foreground/60 hover:text-foreground ml-1 underline underline-offset-2"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ MAIN ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Premium banner */}
        {!hasFullAccess && product?.isActive && (
          <div className="mb-7 overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-r from-amber-400/15 via-white/[0.04] to-emerald-400/15 p-4 backdrop-blur-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-300/15 p-2 text-amber-300">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-snug">Farmacologia faz parte do Manual Clínico Premium.</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Desbloqueie todas as fichas de fármacos — mecanismo, posologia, calculadora de dose e mais — por {formatBRL(product.currentPrice)}.
                  </p>
                </div>
              </div>
              <button
                onClick={goToCheckout}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-300 to-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-lg shadow-amber-500/25 transition hover:brightness-105 active:scale-[0.97]"
              >
                Desbloquear agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Buscando fármacos...</span>
          </div>
        ) : searched && medicamentos.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 mb-4">
              <Pill className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhum fármaco encontrado</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {hasFilters ? 'Tente ajustar os filtros ou a pesquisa.' : 'A farmacologia ainda não possui fármacos cadastrados.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {classesOrdenadas.map(classe => {
              const isCollapsed = collapsed[classe]
              const subgrupos = grupos[classe]
              const countClasse = Object.values(subgrupos).reduce((n, arr) => n + arr.length, 0)
              return (
                <div key={classe}>
                  <button
                    onClick={() => setCollapsed(c => ({ ...c, [classe]: !c[classe] }))}
                    className="w-full flex items-center justify-between gap-3 mb-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/10">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-lg font-bold">{classe}</h2>
                        <p className="text-xs text-muted-foreground">{countClasse} fármaco{countClasse !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isCollapsed ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronUp className="h-5 w-5 text-muted-foreground" />}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-5">
                      {Object.keys(subgrupos).sort().map(sub => (
                        <div key={sub}>
                          <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground/70 mb-2 pl-1">{sub}</h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {subgrupos[sub].map(m => (
                              <div
                                key={m._id}
                                onClick={() => openFarmaco(m.slug)}
                                className={`group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all cursor-pointer overflow-hidden ${
                                  m.isPremiumLocked ? 'border-amber-300/15 bg-amber-400/[0.025]' : ''
                                }`}
                              >
                                <div className="p-4 flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold group-hover:text-primary transition-colors">{m.nome}</h4>
                                      {m.tipo_farmaco && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] border border-white/[0.1] text-muted-foreground">
                                          {m.tipo_farmaco}
                                        </span>
                                      )}
                                      {m.isPremiumLocked && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 dark:text-amber-200">
                                          <Lock className="h-3 w-3" /> Premium
                                        </span>
                                      )}
                                    </div>
                                    {m.sinonimos?.length > 0 && (
                                      <p className="text-xs text-muted-foreground/60 mt-1 truncate">{m.sinonimos.join(' · ')}</p>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-primary/10 transition-colors">
                                    {m.isPremiumLocked
                                      ? <Lock className="h-4 w-4 text-amber-500/70 group-hover:text-amber-400" />
                                      : <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
