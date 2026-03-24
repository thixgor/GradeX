'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Search,
  Heart,
  Wind,
  Brain,
  Stethoscope,
  Pill,
  Droplets,
  Bone,
  Shield,
  Activity,
  Layers,
  Baby,
  SmilePlus,
  Smile,
  Bug,
  Target,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
  Sparkles,
  ArrowRight,
  FileDown,
  Highlighter,
  Loader2,
  RotateCcw
} from 'lucide-react'
import { AREAS_SAUDE, SISTEMAS_FISIOLOGICOS, type AreaSaude, type SistemaFisiologico } from '@/lib/types/manual-clinico'
import { clearAllManualHighlights, hasAnyManualHighlights } from '@/lib/manual-clinico-highlights'

const SISTEMA_ICONS: Record<string, any> = {
  'Sistema Cardiovascular': Heart,
  'Sistema Respiratório': Wind,
  'Sistema Nervoso Central e Periférico': Brain,
  'Sistema Digestivo e Hepatobiliar': Stethoscope,
  'Sistema Endócrino e Metabólico': Pill,
  'Sistema Renal e Urinário': Droplets,
  'Sistema Musculoesquelético': Bone,
  'Sistema Imunológico e Reumatológico': Shield,
  'Sistema Hematológico': Activity,
  'Sistema Dermatológico': Layers,
  'Sistema Reprodutor e Ginecológico': Baby,
  'Saúde Mental e Transtornos Psiquiátricos': SmilePlus,
  'Sistema Estomatognático e Saúde Bucal': Smile,
  'Doenças Infecciosas e Parasitárias': Bug,
  'Oncologia Geral': Target,
}

const SISTEMA_COLORS: string[] = [
  'from-red-500/20 to-red-600/5',
  'from-sky-500/20 to-sky-600/5',
  'from-violet-500/20 to-violet-600/5',
  'from-amber-500/20 to-amber-600/5',
  'from-teal-500/20 to-teal-600/5',
  'from-blue-500/20 to-blue-600/5',
  'from-orange-500/20 to-orange-600/5',
  'from-indigo-500/20 to-indigo-600/5',
  'from-rose-500/20 to-rose-600/5',
  'from-emerald-500/20 to-emerald-600/5',
  'from-pink-500/20 to-pink-600/5',
  'from-purple-500/20 to-purple-600/5',
  'from-cyan-500/20 to-cyan-600/5',
  'from-lime-500/20 to-lime-600/5',
  'from-fuchsia-500/20 to-fuchsia-600/5',
]

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20',
  'Psicologia': 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20',
  'Odontologia': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
  'Biomedicina': 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/20',
}

const AREA_COLORS_ACTIVE: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500 text-white border-blue-600 shadow-blue-500/25 shadow-lg',
  'Psicologia': 'bg-purple-500 text-white border-purple-600 shadow-purple-500/25 shadow-lg',
  'Odontologia': 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/25 shadow-lg',
  'Biomedicina': 'bg-orange-500 text-white border-orange-600 shadow-orange-500/25 shadow-lg',
}

interface PatologiaResumo {
  _id: string
  nome: string
  sinonimos: string[]
  areas: AreaSaude[]
  sistema: SistemaFisiologico
  cid10: string
  slug: string
  gravidade: string
}

export default function ManualClinicoPage() {
  return (
    <AppShell showHeader={false}>
      <ManualClinicoContent />
    </AppShell>
  )
}

function ManualClinicoContent() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [areasAtivas, setAreasAtivas] = useState<AreaSaude[]>([])
  const [sistemaAtivo, setSistemaAtivo] = useState<SistemaFisiologico | ''>('')
  const [patologias, setPatologias] = useState<PatologiaResumo[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [hasHighlights, setHasHighlights] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)

  useEffect(() => {
    setHasHighlights(hasAnyManualHighlights())
  }, [])

  async function handleGeneratePDF() {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/manual-clinico?export=true')
      const data = await res.json()
      const { generateManualCompletoPDF } = await import('@/lib/patologia-pdf-generator')
      const blob = await generateManualCompletoPDF(data.patologias || [])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manual-clinico-completo-${new Date().toISOString().slice(0, 10)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  function handleResetHighlights() {
    if (!resetConfirm) {
      setResetConfirm(true)
      setTimeout(() => setResetConfirm(false), 3000)
      return
    }
    clearAllManualHighlights()
    setHasHighlights(false)
    setResetConfirm(false)
  }

  const fetchPatologias = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (busca.trim()) params.set('busca', busca.trim())
      if (areasAtivas.length > 0) params.set('area', areasAtivas.join(','))
      if (sistemaAtivo) params.set('sistema', sistemaAtivo)
      params.set('page', page.toString())
      params.set('limit', '20')

      const res = await fetch(`/api/manual-clinico?${params}`)
      const data = await res.json()

      setPatologias(data.patologias || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 0)
      setSearched(true)
    } catch (error) {
      console.error('Erro ao buscar patologias:', error)
    } finally {
      setLoading(false)
    }
  }, [busca, areasAtivas, sistemaAtivo, page])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchPatologias()
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, areasAtivas, sistemaAtivo])

  useEffect(() => {
    fetchPatologias()
  }, [page])

  function toggleArea(area: AreaSaude) {
    setAreasAtivas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    )
  }

  function selectSistema(sistema: SistemaFisiologico) {
    setSistemaAtivo(prev => prev === sistema ? '' : sistema)
  }

  function clearFilters() {
    setBusca('')
    setAreasAtivas([])
    setSistemaAtivo('')
    setPage(1)
  }

  const hasFilters = busca || areasAtivas.length > 0 || sistemaAtivo

  return (
    <div className="min-h-screen bg-background">
      {/* ══════════ HERO ══════════ */}
      <div className="relative overflow-hidden">
        {/* Background image — visible */}
        <div className="absolute inset-0">
          <img
            src="https://i.imgur.com/0JXm4Au.png"
            alt=""
            className="w-full h-full object-cover opacity-30"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/50 to-background" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-10 pb-12 max-w-6xl">
          <div className="text-center mb-7">
            <div className="inline-flex flex-col items-center">
              <div className="inline-flex items-center gap-3 mb-3 px-5 py-2 rounded-full bg-white/[0.08] dark:bg-white/[0.06] backdrop-blur-xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">Repositório Acadêmico</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold font-heading bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Manual Clínico
              </h1>
              <p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg leading-relaxed">
                Explore patologias estruturadas para estudo de alta fixação cognitiva.
              </p>
              {total > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    {total} patologias disponíveis
                  </span>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGeneratePDF}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                    bg-primary text-primary-foreground shadow-lg shadow-primary/25
                    hover:bg-primary/90 active:scale-[0.97] transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pdfLoading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <FileDown className="h-4 w-4" />}
                  {pdfLoading ? 'Gerando PDF...' : 'Baixar Manual Completo (PDF)'}
                </button>

                {hasHighlights && (
                  <button
                    onClick={handleResetHighlights}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 active:scale-[0.97]
                      ${resetConfirm
                        ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                        : 'bg-white/[0.05] text-muted-foreground border-white/[0.12] hover:bg-white/[0.1] hover:text-foreground'
                      }`}
                  >
                    {resetConfirm
                      ? <><RotateCcw className="h-4 w-4" /> Confirmar reset de marcações</>
                      : <><Highlighter className="h-4 w-4" /> Resetar Marcações</>
                    }
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ GLASS SEARCH BAR ══════════ */}
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              {/* Glow effect behind search */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity duration-500" />
              <div className="relative flex items-center bg-white/[0.07] dark:bg-white/[0.05] backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden transition-all duration-300 group-focus-within:border-primary/30 group-focus-within:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
                <Input
                  placeholder="Pesquisar por nome, sinônimo, CID-10..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-12 pr-12 h-14 text-base bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  aria-label="Pesquisar patologias"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══════════ AREA FILTER PILLS ══════════ */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <div className="flex items-center gap-1.5 mr-1 text-muted-foreground/50">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wide">Filtros</span>
            </div>
            {AREAS_SAUDE.map(area => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border backdrop-blur-xl transition-all duration-300 ${
                  areasAtivas.includes(area)
                    ? AREA_COLORS_ACTIVE[area]
                    : `${AREA_COLORS[area]} bg-white/[0.05] dark:bg-white/[0.03] border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.08]`
                }`}
                aria-label={`Filtrar por ${area}`}
                aria-pressed={areasAtivas.includes(area)}
              >
                {area}
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground/60 hover:text-foreground ml-1 underline underline-offset-2 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ══════════ SISTEMAS GRID ══════════ */}
        {!busca && areasAtivas.length === 0 && !sistemaAtivo && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Sistemas Fisiológicos</h2>
                <p className="text-xs text-muted-foreground">Selecione um sistema para filtrar as patologias</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {SISTEMAS_FISIOLOGICOS.map((sistema, idx) => {
                const Icon = SISTEMA_ICONS[sistema] || Stethoscope
                return (
                  <button
                    key={sistema}
                    onClick={() => selectSistema(sistema)}
                    className={`group relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 overflow-hidden
                      bg-white/[0.03] dark:bg-white/[0.02] border-white/[0.08]
                      hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                      hover:scale-[1.02] active:scale-[0.98]`}
                    aria-label={`Ver patologias do ${sistema}`}
                  >
                    {/* Subtle gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${SISTEMA_COLORS[idx % SISTEMA_COLORS.length]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Glass icon container */}
                    <div className="relative z-10 p-2.5 rounded-xl bg-white/[0.06] dark:bg-white/[0.04] border border-white/[0.08] group-hover:border-white/[0.15] group-hover:bg-white/[0.1] backdrop-blur-sm transition-all duration-300">
                      <Icon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    <span className="relative z-10 text-[11px] font-medium leading-tight text-center text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
                      {sistema}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Sistema ativo badge */}
        {sistemaAtivo && (
          <div className="flex items-center gap-2 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-sm">
              {(() => { const Icon = SISTEMA_ICONS[sistemaAtivo] || Stethoscope; return <Icon className="h-4 w-4 text-primary" /> })()}
              <span className="text-sm font-medium">{sistemaAtivo}</span>
              <button
                onClick={() => setSistemaAtivo('')}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                aria-label="Remover filtro de sistema"
              >
                <X className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ RESULTS ══════════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
            </div>
            <span className="text-sm text-muted-foreground">Buscando patologias...</span>
          </div>
        ) : searched && patologias.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted/50 mb-4">
              <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma patologia encontrada</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {hasFilters ? 'Tente ajustar seus filtros ou termos de pesquisa.' : 'O manual clínico ainda não possui patologias cadastradas.'}
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : patologias.length > 0 ? (
          <>
            <div className="grid gap-2.5">
              {patologias.map((patologia, idx) => (
                <div
                  key={patologia._id}
                  onClick={() => router.push(`/manual-clinico/${patologia.slug}`)}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] dark:bg-white/[0.015]
                    hover:bg-white/[0.05] hover:border-white/[0.12] hover:shadow-[0_4px_24px_rgba(0,0,0,0.1)]
                    backdrop-blur-sm transition-all duration-300 cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Hover gradient accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-l-2xl" />

                  <div className="p-4 sm:p-5 pl-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors duration-300">
                            {patologia.nome}
                          </h3>
                          {patologia.cid10 && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-white/[0.06] border border-white/[0.1] text-muted-foreground">
                              {patologia.cid10}
                            </span>
                          )}
                        </div>
                        {patologia.sinonimos.length > 0 && (
                          <p className="text-sm text-muted-foreground/60 mt-1 truncate">
                            {patologia.sinonimos.join(' · ')}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {patologia.areas.map(area => (
                            <span
                              key={area}
                              className={`text-[11px] px-2.5 py-0.5 rounded-lg border font-medium ${AREA_COLORS[area]}`}
                            >
                              {area}
                            </span>
                          ))}
                          <span className="text-[11px] text-muted-foreground/50 font-medium">
                            {patologia.sistema}
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-2 p-1.5 rounded-lg bg-white/[0.04] group-hover:bg-primary/10 transition-colors duration-300">
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ══════════ PAGINATION ══════════ */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl backdrop-blur-sm bg-white/[0.03] border-white/[0.1]"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="px-4 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{page}</span> de <span className="font-medium text-foreground">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl backdrop-blur-sm bg-white/[0.03] border-white/[0.1]"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
