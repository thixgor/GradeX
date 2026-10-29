'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import {
  Pill,
  ArrowRight,
  Lock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react'
import { CLASSES_MEDICAMENTOS, CLASSES_MEDICAMENTOS_NAMES } from '@/lib/types/farmacologia'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import { estiloDoChip } from '@/components/sidebar-cores'
import { CabecaDoModulo, HeroiDoModulo } from '@/components/manual-clinico/casco/heroi-do-modulo'
import { BuscaDoManual } from '@/components/manual-clinico/casco/busca-do-manual'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
} from '@/components/manual-clinico/pacote'

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

interface ProductPlan {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
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
  plans?: ProductPlan[]
  pricingEventId?: string | null
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

  // Mesma regra das outras vitrines: o "a partir de" é o plano habilitado mais
  // barato, e o lote que desconta está amarrado ao plano — não ao produto.
  const planosAtivos = (product?.plans || []).filter((p) => p.enabled && p.price > 0)
  const planoMaisBarato = planosAtivos.reduce<ProductPlan | null>(
    (menor, p) => (menor == null || p.price < menor.price ? p : menor),
    null,
  )
  const precoBase = planoMaisBarato?.price ?? product?.currentPrice ?? 0
  const { state: evento } = usePricingEventState(
    planoMaisBarato?.pricingEventId || product?.pricingEventId || null,
  )
  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = Boolean(evento?.activeTier) && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote
    ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100)
    : precoBase
  const mostrarPreco = product?.isActive !== false && precoBase > 0

  return (
    <div className="surface-page min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 pb-8">
        {/* ══════════ ABERTURA ══════════
            Quem não tem o Manual vê o herói comum das portas; quem tem vê a
            cabeça curta e vai direto à busca. O catálogo é o mesmo nos dois —
            é ele a prévia: os nomes abertos, a ficha atrás do cadeado. */}
        {!hasFullAccess && product?.isActive ? (
          <HeroiDoModulo
            porta="farmacologia"
            titulo={<>A dose certa, com o mecanismo à vista.</>}
            promessa={
              <>
                Cada fármaco com mecanismo, metabolismo, excreção, efeitos, contraindicações e posologia — e a
                calculadora de dose na mesma ficha.
              </>
            }
            numeros={[
              { v: total || '—', r: 'fármacos com ficha' },
              { v: CLASSES_MEDICAMENTOS.length, r: 'classes terapêuticas' },
            ]}
            acoes={
              <>
                <button onClick={goToCheckout} className="ck-cta">
                  Quero os {TOTAL_DE_MODULOS} manuais
                </button>
                <a href="#catalogo" className="ck-botao">Ver o bulário</a>
              </>
            }
          >
            <FaixaDoPacote atual="farmacologia" className="mt-2" />
          </HeroiDoModulo>
        ) : (
          <CabecaDoModulo
            porta="farmacologia"
            texto={
              total > 0
                ? `${total} fármacos por classe e subclasse — mecanismo, posologia e calculadora de dose.`
                : 'Fármacos por classe e subclasse — mecanismo, posologia e calculadora de dose.'
            }
          />
        )}

        {/* ══════════ BUSCA ══════════ */}
        <div id="catalogo" className="ck-escopo mt-8 scroll-mt-24 space-y-4">
          {!hasFullAccess && product?.isActive && <AvisoJaTenho className="mx-auto max-w-2xl" />}
          <BuscaDoManual
            valor={busca}
            aoMudar={setBusca}
            placeholder="Fármaco, sinônimo ou classe"
            rotulo="Pesquisar fármacos"
          />
          <div className="mc-filtros" role="group" aria-label="Filtrar por classe">
            {CLASSES_MEDICAMENTOS.map(({ classe }) => (
              <button
                key={classe}
                onClick={() => setClasseAtiva((prev) => (prev === classe ? '' : classe))}
                className="mc-filtro"
                data-ativo={classeAtiva === classe ? '' : undefined}
                aria-pressed={classeAtiva === classe}
              >
                {classe}
              </button>
            ))}
            {hasFilters && (
              <button onClick={() => { setBusca(''); setClasseAtiva('') }} className="ck-link-discreto px-2">
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="ck-escopo mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Buscando fármacos...</span>
          </div>
        ) : searched && medicamentos.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="mb-1 text-lg font-semibold" style={{ color: 'var(--ck-texto)' }}>Nenhum fármaco encontrado</h3>
            <p className="mx-auto max-w-md text-sm" style={{ color: 'var(--ck-texto-2)' }}>
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
                    aria-expanded={!isCollapsed}
                    className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="sidebar-mini-chip h-9 w-9 rounded-[11px]" style={estiloDoChip('farmacologia')} aria-hidden>
                        <Pill />
                      </span>
                      <div>
                        <h2 className="mc-secao-titulo !text-[1.25rem]" style={{ color: 'var(--ck-texto)' }}>{classe}</h2>
                        <p className="text-[12.5px]" style={{ color: 'var(--ck-texto-3)' }}>{countClasse} fármaco{countClasse !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    {isCollapsed ? <ChevronDown className="h-5 w-5" style={{ color: 'var(--ck-texto-3)' }} /> : <ChevronUp className="h-5 w-5" style={{ color: 'var(--ck-texto-3)' }} />}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-5">
                      {Object.keys(subgrupos).sort().map(sub => (
                        <div key={sub}>
                          <h3 className="mb-2 pl-1 text-[13px] font-semibold" style={{ color: 'var(--ck-texto-2)' }}>{sub}</h3>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {subgrupos[sub].map(m => (
                              <button key={m._id} type="button" onClick={() => openFarmaco(m.slug)} className="mc-item">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="mc-item-nome">{m.nome}</span>
                                    {m.tipo_farmaco && <span className="ck-chip" data-tom="neutro">{m.tipo_farmaco}</span>}
                                    {m.isPremiumLocked && (
                                      <span className="ck-chip" data-tom="ambar">
                                        <Lock className="h-3 w-3" /> Plus+
                                      </span>
                                    )}
                                  </div>
                                  {m.sinonimos?.length > 0 && <p className="mc-item-sub">{m.sinonimos.join(' · ')}</p>}
                                </div>
                                {m.isPremiumLocked ? (
                                  <Lock className="mc-item-seta h-4 w-4" style={{ color: 'var(--ck-ambar)' }} />
                                ) : (
                                  <ArrowRight className="mc-item-seta h-4 w-4" />
                                )}
                              </button>
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

        {/* ── A oferta: o valor inteiro primeiro, o preço depois ── */}
        {!hasFullAccess && product?.isActive && (
          <div className="pb-28 lg:pb-0">
            <GradeDoPacote atual="farmacologia" className="mt-14" />

            <OfertaDoPacote
              className="mt-10"
              onCheckout={goToCheckout}
              isAuthenticated={isAuthenticated}
              precoBase={precoBase}
              precoFinal={precoFinal}
              temLote={temLote}
              pctLote={pctLote}
              rotuloLote={evento?.activeTier?.label ?? null}
              rotuloPlano={planoMaisBarato?.label ?? null}
              mesesDoPlano={planoMaisBarato?.durationMonths ?? null}
              mostrarPreco={mostrarPreco}
            />

            <PerguntasDoPacote className="mt-14" />

            <FechamentoDoPacote
              className="mt-10"
              onCheckout={goToCheckout}
              precoFinal={precoFinal}
              mostrarPreco={mostrarPreco}
            />
          </div>
        )}
      </div>

      {!hasFullAccess && product?.isActive && (
        <BarraDoPacote
          onCheckout={goToCheckout}
          precoBase={precoBase}
          precoFinal={precoFinal}
          temLote={temLote}
          pctLote={pctLote}
          mesesDoPlano={planoMaisBarato?.durationMonths ?? null}
          mostrarPreco={mostrarPreco}
        />
      )}
    </div>
  )
}
