'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Dna,
  Stethoscope,
  Pill,
  GitBranch,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Activity,
  Layers,
  ClipboardList,
  CircleDot,
  Zap,
  Heart,
  Syringe,
  BookMarked,
  ShieldAlert,
  FlaskConical
} from 'lucide-react'
import { type Patologia, type AreaSaude } from '@/lib/types/manual-clinico'
import { RichTextRenderer } from '@/components/manual-clinico/rich-text-renderer'

const AREA_BADGE: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
  'Psicologia': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
  'Odontologia': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
  'Biomedicina': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
}

/* ═══════════════════════════════════════════
   COLLAPSIBLE SECTION
   ═══════════════════════════════════════════ */
function Section({ title, icon: Icon, children, defaultOpen = true, variant = 'default' }: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
  variant?: 'default' | 'warning'
}) {
  const [open, setOpen] = useState(defaultOpen)

  const borderColor = variant === 'warning' ? 'border-amber-500/20' : 'border-border/60'
  const hoverBorder = variant === 'warning' ? 'hover:border-amber-500/30' : 'hover:border-border'

  return (
    <div className={`rounded-2xl border ${borderColor} bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${hoverBorder}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 p-5 hover:bg-accent/30 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`shrink-0 p-2.5 rounded-xl ${variant === 'warning' ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${variant === 'warning' ? 'text-amber-500' : 'text-primary'}`} />
          </div>
          <h2 className="font-bold text-[17px] text-foreground truncate">{title}</h2>
        </div>
        <div className={`shrink-0 p-1.5 rounded-full transition-colors ${open ? 'bg-primary/10' : 'bg-accent/50'}`}>
          {open
            ? <ChevronUp className="h-4 w-4 text-primary" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          }
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <div className="border-t border-border/40 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════
   CONTENT BLOCK — rich text with white color
   ═══════════════════════════════════════════ */
function ContentBlock({ children }: { children: string }) {
  return (
    <RichTextRenderer
      text={children}
      className="text-[15px] leading-[1.8] text-foreground/90 selection:bg-primary/20"
    />
  )
}

/* ═══════════════════════════════════════════
   FLUXOGRAMA RENDERER
   ═══════════════════════════════════════════ */
function FluxogramaRenderer({ text }: { text: string }) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {lines.map((line, i) => {
        const isArrow = /^[→↓⬇|▼►➜➔⇒]+$/.test(line) || line === '|' || line === 'v' || line === 'V'
        const isConditional = /^(Se |If |Sim:|Não:|Sim →|Não →|Yes:|No:)/i.test(line)
        const isSplit = line.includes(' → ') && isConditional

        if (isArrow) {
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div className="w-0.5 h-5 bg-primary/30 rounded-full" />
              <ChevronDown className="h-4 w-4 text-primary/50 -mt-1" />
            </div>
          )
        }

        const prevIsArrow = i > 0 && (/^[→↓⬇|▼►➜➔⇒]+$/.test(lines[i - 1]) || lines[i - 1] === '|' || lines[i - 1] === 'v' || lines[i - 1] === 'V')

        if (isSplit) {
          const parts = line.split(' → ').map(s => s.trim())
          return (
            <div key={i} className="w-full max-w-md">
              {!prevIsArrow && <FlowConnector />}
              <div className="relative border-2 border-amber-500/30 bg-amber-950/30 rounded-xl p-3.5 text-center mx-auto">
                <Zap className="h-3.5 w-3.5 text-amber-400 mx-auto mb-1.5" />
                <p className="text-sm font-semibold text-amber-200">{parts[0]}</p>
              </div>
              {parts.length > 1 && (
                <>
                  <FlowConnector />
                  <div className="border border-border/60 bg-card/80 rounded-xl p-3 text-center mx-auto max-w-sm">
                    <p className="text-sm text-foreground/80">{parts.slice(1).join(' → ')}</p>
                  </div>
                </>
              )}
            </div>
          )
        }

        if (isConditional) {
          return (
            <div key={i} className="w-full max-w-md">
              {!prevIsArrow && <FlowConnector />}
              <div className="relative border-2 border-amber-500/30 bg-amber-950/30 rounded-xl p-3.5 text-center mx-auto">
                <p className="text-sm font-semibold text-amber-200">{line}</p>
              </div>
            </div>
          )
        }

        const isFirst = i === 0
        const isLast = i === lines.length - 1

        return (
          <div key={i} className="w-full max-w-md">
            {i > 0 && !prevIsArrow && <FlowConnector />}
            <div className={`relative border rounded-xl p-3.5 text-center mx-auto transition-colors ${
              isFirst
                ? 'border-primary/40 bg-primary/10'
                : isLast
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-border/60 bg-card/60 hover:bg-card/80'
            }`}>
              {isFirst && <CircleDot className="h-3.5 w-3.5 text-primary mx-auto mb-1" />}
              <p className={`text-sm font-medium ${
                isFirst ? 'text-primary' :
                isLast ? 'text-emerald-400' :
                'text-foreground/90'
              }`}>
                {line}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function FlowConnector() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-0.5 h-4 bg-border/50 rounded-full" />
      <ChevronDown className="h-3 w-3 text-border -mt-0.5" />
    </div>
  )
}

/* ═══════════════════════════════════════════
   FARMACO CARD
   ═══════════════════════════════════════════ */
function FarmacoCard({ farmaco }: { farmaco: any }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-5 hover:bg-card/80 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
          <Syringe className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-base text-foreground">{farmaco.medicamento}</h4>
          {farmaco.classe && (
            <p className="text-sm text-muted-foreground mt-0.5">{farmaco.classe}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {farmaco.mecanismo_acao && (
          <div className="rounded-lg bg-primary/[0.05] border border-primary/10 p-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-primary mb-1.5">Mecanismo de Ação</p>
            <p className="text-[13px] leading-relaxed text-foreground/85">{farmaco.mecanismo_acao}</p>
          </div>
        )}

        {farmaco.dose_usual && (
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-primary shrink-0">Dose:</span>
            <span className="text-[13px] text-foreground/85">{farmaco.dose_usual}</span>
          </div>
        )}

        {farmaco.efeitos_colaterais?.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 mb-2">Efeitos Colaterais</p>
            <div className="flex flex-wrap gap-1.5">
              {farmaco.efeitos_colaterais.map((e: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {farmaco.contraindicacoes?.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-red-400 mb-2">Contraindicações</p>
            <div className="flex flex-wrap gap-1.5">
              {farmaco.contraindicacoes.map((c: string, i: number) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE WRAPPER
   ═══════════════════════════════════════════ */
export default function PatologiaPage() {
  return (
    <AppShell showHeader={false}>
      <PatologiaContent />
    </AppShell>
  )
}

/* ═══════════════════════════════════════════
   MAIN CONTENT
   ═══════════════════════════════════════════ */
function PatologiaContent() {
  const params = useParams()
  const router = useRouter()
  const [patologia, setPatologia] = useState<Patologia | null>(null)
  const [loading, setLoading] = useState(true)
  const [farmaTab, setFarmaTab] = useState<'primeira' | 'segunda' | 'terceira'>('primeira')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/manual-clinico/${params.slug}`)
        if (!res.ok) { router.push('/manual-clinico'); return }
        const data = await res.json()
        setPatologia(data)
        document.title = `${data.nome} — Manual Clínico | DomineAqui`
      } catch {
        router.push('/manual-clinico')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    )
  }

  if (!patologia) return null

  const farma = patologia.farmacologia
  const farmaTabData = farmaTab === 'primeira' ? farma?.primeira_linha
    : farmaTab === 'segunda' ? farma?.segunda_linha
    : farma?.terceira_linha

  return (
    <div className="min-h-screen bg-background">

      {/* ══════════════════════════════════════
           HERO HEADER
         ══════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-primary/[0.04] rounded-full blur-[100px]" />

        <div className="relative container mx-auto px-4 sm:px-6 pt-5 pb-8 max-w-4xl">
          {/* Nav row */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/manual-clinico')}
              className="rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Manual Clínico
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                const { generatePatologiaPDF } = await import('@/lib/patologia-pdf-generator')
                const blob = generatePatologiaPDF(patologia)
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${patologia.slug || 'patologia'}.pdf`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>

          {/* Disease name */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-foreground leading-tight tracking-tight">
            {patologia.nome}
          </h1>

          {/* Sinônimos */}
          {patologia.sinonimos.length > 0 && (
            <p className="text-muted-foreground mt-2.5 text-[15px]">
              {patologia.sinonimos.join(' · ')}
            </p>
          )}

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            {patologia.cid10 && (
              <span className="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono bg-foreground/10 border border-foreground/20 text-foreground">
                CID-10: {patologia.cid10}
              </span>
            )}
            {patologia.areas.map(area => (
              <span key={area} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border ${AREA_BADGE[area]}`}>
                {area}
              </span>
            ))}
          </div>

          {/* Sistema pill */}
          {patologia.sistema && (
            <div className="mt-3">
              <span className="text-sm text-muted-foreground">{patologia.sistema}</span>
            </div>
          )}
        </div>

        {/* Bottom border */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ══════════════════════════════════════
           SECTIONS
         ══════════════════════════════════════ */}
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-4xl">
        <div className="flex flex-col gap-3">

          {patologia.classificacao && (
            <Section title="Classificação" icon={Layers}>
              <ContentBlock>{patologia.classificacao}</ContentBlock>
            </Section>
          )}

          {patologia.fisiopatologia && (
            <Section title="Fisiopatologia" icon={Dna}>
              <ContentBlock>{patologia.fisiopatologia}</ContentBlock>
              {patologia.imagens_mecanismo && patologia.imagens_mecanismo.length > 0 && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {patologia.imagens_mecanismo.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border/60 bg-card/50">
                      <img
                        src={img}
                        alt={patologia.legenda_imagens?.[i] || `Mecanismo ${i + 1}`}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                      {patologia.legenda_imagens?.[i] && (
                        <div className="p-3 border-t border-border/40">
                          <RichTextRenderer
                            text={patologia.legenda_imagens[i]}
                            className="text-xs text-muted-foreground"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {patologia.diagnostico_semiologico && (
            <Section title="Diagnóstico Semiológico" icon={Stethoscope}>
              <ContentBlock>{patologia.diagnostico_semiologico}</ContentBlock>
            </Section>
          )}

          {patologia.diagnosticos_diferenciais && (
            <Section title="Diagnósticos Diferenciais" icon={ClipboardList}>
              <ContentBlock>{patologia.diagnosticos_diferenciais}</ContentBlock>
            </Section>
          )}

          {patologia.gravidade && (
            <Section title="Gravidade e Classificação" icon={ShieldAlert}>
              <ContentBlock>{patologia.gravidade}</ContentBlock>
            </Section>
          )}

          {patologia.tratamento && (
            <Section title="Tratamento" icon={Heart}>
              <ContentBlock>{patologia.tratamento}</ContentBlock>
            </Section>
          )}

          {/* ══════ FARMACOLOGIA ══════ */}
          {farma && (farma.primeira_linha?.length > 0 || farma.segunda_linha?.length > 0) && (
            <Section title="Farmacologia" icon={FlaskConical}>
              {/* Tab bar */}
              <div className="flex gap-1 p-1 mb-5 rounded-xl bg-muted/50 border border-border/40">
                {farma.primeira_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('primeira')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'primeira'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    1ª Linha
                  </button>
                )}
                {farma.segunda_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('segunda')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'segunda'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    2ª Linha
                  </button>
                )}
                {farma.terceira_linha && farma.terceira_linha.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('terceira')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                      farmaTab === 'terceira'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    3ª Linha
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {farmaTabData?.map((farmaco, i) => (
                  <FarmacoCard key={i} farmaco={farmaco} />
                ))}
                {(!farmaTabData || farmaTabData.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum fármaco cadastrado para esta linha.</p>
                )}
              </div>
            </Section>
          )}

          {/* ══════ FLUXOGRAMA ══════ */}
          {patologia.fluxograma_tratamento && (
            <Section title="Fluxograma de Tratamento" icon={GitBranch}>
              <div className="rounded-xl bg-muted/30 border border-border/40 p-5 sm:p-8">
                <FluxogramaRenderer text={patologia.fluxograma_tratamento} />
              </div>
            </Section>
          )}

          {/* ══════ OBSERVAÇÕES ══════ */}
          {patologia.observacoes_clinicas && (
            <Section title="Observações Clínicas" icon={AlertTriangle} variant="warning">
              <div className="relative rounded-xl bg-amber-500/[0.06] border border-amber-500/20 p-5 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/[0.05] rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Atenção</span>
                  </div>
                  <RichTextRenderer
                    text={patologia.observacoes_clinicas}
                    className="text-[15px] leading-[1.8] text-foreground/90"
                  />
                </div>
              </div>
            </Section>
          )}

          {/* ══════ REFERÊNCIAS ══════ */}
          {patologia.referencias && (
            <Section title="Referências" icon={BookMarked} defaultOpen={false}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {patologia.referencias}
              </div>
            </Section>
          )}
        </div>

        <div className="h-12" />
      </div>
    </div>
  )
}
