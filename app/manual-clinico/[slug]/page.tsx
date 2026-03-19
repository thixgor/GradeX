'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  BookOpen,
  Dna,
  Stethoscope,
  Scale,
  Pill,
  GitBranch,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Download,
  Activity,
  Layers,
  ClipboardList
} from 'lucide-react'
import { type Patologia, type AreaSaude } from '@/lib/types/manual-clinico'

const AREA_COLORS: Record<AreaSaude, string> = {
  'Medicina': 'bg-blue-500 text-white',
  'Psicologia': 'bg-purple-500 text-white',
  'Odontologia': 'bg-emerald-500 text-white',
  'Biomedicina': 'bg-orange-500 text-white',
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string
  icon: any
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-accent/50 transition-colors text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">{title}</h2>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {open && (
        <CardContent className="pt-0 px-4 sm:px-5 pb-5">
          <div className="border-t pt-4">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function FluxogramaRenderer({ text }: { text: string }) {
  // Parse flowchart text into visual nodes
  // Supports lines like "Step text", "→ Next step", "↓", arrows, conditionals with "Se/If ... → ..."
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {lines.map((line, i) => {
        const isArrow = /^[→↓⬇|▼►➜➔⇒]+$/.test(line) || line === '|' || line === 'v' || line === 'V'
        const isConditional = /^(Se |If |Sim:|Não:|Sim →|Não →|Yes:|No:)/i.test(line)
        const isSplit = line.includes(' → ') && isConditional

        if (isArrow) {
          return (
            <div key={i} className="flex flex-col items-center text-primary/60">
              <div className="w-0.5 h-4 bg-primary/30" />
              <ChevronDown className="h-4 w-4 -mt-1" />
            </div>
          )
        }

        if (isSplit) {
          const parts = line.split(' → ').map(s => s.trim())
          return (
            <div key={i} className="w-full">
              <div className="flex flex-col items-center text-primary/60 mb-1">
                <div className="w-0.5 h-3 bg-primary/30" />
              </div>
              <div className="relative border-2 border-amber-500/40 bg-amber-500/5 rounded-xl p-3 text-center max-w-md mx-auto" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 px-6">{parts[0]}</p>
              </div>
              {parts.length > 1 && (
                <>
                  <div className="flex flex-col items-center text-primary/60 my-1">
                    <div className="w-0.5 h-3 bg-primary/30" />
                    <ChevronDown className="h-3 w-3 -mt-0.5" />
                  </div>
                  <div className="border border-primary/20 bg-primary/5 rounded-lg p-3 text-center max-w-sm mx-auto">
                    <p className="text-sm text-foreground">{parts.slice(1).join(' → ')}</p>
                  </div>
                </>
              )}
            </div>
          )
        }

        if (isConditional) {
          return (
            <div key={i} className="w-full">
              <div className="flex flex-col items-center text-primary/60 mb-1">
                <div className="w-0.5 h-3 bg-primary/30" />
              </div>
              <div className="relative border-2 border-amber-500/40 bg-amber-500/5 rounded-xl p-3 text-center max-w-md mx-auto" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 px-6">{line}</p>
              </div>
            </div>
          )
        }

        // Regular step node
        const isFirst = i === 0
        const isLast = i === lines.length - 1
        const stepNumber = lines.slice(0, i + 1).filter((l, j) => {
          return !/^[→↓⬇|▼►➜➔⇒]+$/.test(l) && l !== '|' && l !== 'v' && l !== 'V'
        }).length

        return (
          <div key={i} className="w-full">
            {i > 0 && !(/^[→↓⬇|▼►➜➔⇒]+$/.test(lines[i - 1]) || lines[i - 1] === '|' || lines[i - 1] === 'v' || lines[i - 1] === 'V') && (
              <div className="flex flex-col items-center text-primary/60">
                <div className="w-0.5 h-4 bg-primary/30" />
                <ChevronDown className="h-4 w-4 -mt-1" />
              </div>
            )}
            <div className={`border rounded-lg p-3 max-w-md mx-auto text-center ${
              isFirst ? 'bg-primary/10 border-primary/30 shadow-sm' :
              isLast ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm' :
              'bg-card border-border hover:border-primary/20'
            } transition-colors`}>
              <p className={`text-sm ${isFirst || isLast ? 'font-semibold' : ''} ${
                isFirst ? 'text-primary' : isLast ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'
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

function FarmacoCard({ farmaco }: { farmaco: any }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <h4 className="font-semibold text-base">{farmaco.medicamento}</h4>
      {farmaco.classe && (
        <p className="text-sm text-muted-foreground mt-0.5">{farmaco.classe}</p>
      )}
      <div className="mt-3 space-y-2 text-sm">
        {farmaco.mecanismo_acao && (
          <div>
            <span className="font-medium text-primary">Mecanismo de Ação:</span>
            <p className="mt-0.5 text-muted-foreground">{farmaco.mecanismo_acao}</p>
          </div>
        )}
        {farmaco.dose_usual && (
          <div>
            <span className="font-medium text-primary">Dose Usual:</span>
            <span className="ml-2 text-muted-foreground">{farmaco.dose_usual}</span>
          </div>
        )}
        {farmaco.efeitos_colaterais?.length > 0 && (
          <div>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">Efeitos Colaterais:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {farmaco.efeitos_colaterais.map((e: string, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}
        {farmaco.contraindicacoes?.length > 0 && (
          <div>
            <span className="font-medium text-red-600 dark:text-red-400">Contraindicações:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {farmaco.contraindicacoes.map((c: string, i: number) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20">
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

export default function PatologiaPage() {
  return (
    <AppShell showHeader={false}>
      <PatologiaContent />
    </AppShell>
  )
}

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
        if (!res.ok) {
          router.push('/manual-clinico')
          return
        }
        const data = await res.json()
        setPatologia(data)

        // SEO - atualizar título
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Voltar + PDF */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/manual-clinico')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Manual
          </Button>
          <Button
            variant="outline"
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
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>

        {/* Cabeçalho */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-2">{patologia.nome}</h1>
          {patologia.sinonimos.length > 0 && (
            <p className="text-muted-foreground mb-3">
              {patologia.sinonimos.join(' • ')}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {patologia.cid10 && (
              <Badge variant="outline" className="font-mono text-sm">{patologia.cid10}</Badge>
            )}
            {patologia.areas.map(area => (
              <Badge key={area} className={AREA_COLORS[area]}>{area}</Badge>
            ))}
            <Badge variant="secondary">{patologia.sistema}</Badge>
          </div>
        </div>

        {/* Seções */}
        <div className="space-y-4">
          {/* Classificação */}
          {patologia.classificacao && (
            <Section title="Classificação" icon={Layers}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.classificacao}
              </div>
            </Section>
          )}

          {/* Fisiopatologia */}
          {patologia.fisiopatologia && (
            <Section title="Fisiopatologia" icon={Dna}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.fisiopatologia}
              </div>
              {/* Imagens de mecanismo */}
              {patologia.imagens_mecanismo && patologia.imagens_mecanismo.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patologia.imagens_mecanismo.map((img, i) => (
                    <div key={i} className="border rounded-lg overflow-hidden">
                      <img
                        src={img}
                        alt={patologia.legenda_imagens?.[i] || `Mecanismo de ação ${i + 1}`}
                        className="w-full h-auto"
                        loading="lazy"
                      />
                      {patologia.legenda_imagens?.[i] && (
                        <p className="text-xs text-muted-foreground p-2 bg-muted/50">
                          {patologia.legenda_imagens[i]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Diagnóstico Semiológico */}
          {patologia.diagnostico_semiologico && (
            <Section title="Diagnóstico Semiológico" icon={Stethoscope}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.diagnostico_semiologico}
              </div>
            </Section>
          )}

          {/* Diagnósticos Diferenciais */}
          {patologia.diagnosticos_diferenciais && (
            <Section title="Diagnósticos Diferenciais" icon={ClipboardList}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.diagnosticos_diferenciais}
              </div>
            </Section>
          )}

          {/* Gravidade */}
          {patologia.gravidade && (
            <Section title="Gravidade" icon={Activity}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.gravidade}
              </div>
            </Section>
          )}

          {/* Tratamento */}
          {patologia.tratamento && (
            <Section title="Tratamento" icon={Pill}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {patologia.tratamento}
              </div>
            </Section>
          )}

          {/* Farmacologia */}
          {farma && (farma.primeira_linha?.length > 0 || farma.segunda_linha?.length > 0) && (
            <Section title="Farmacologia" icon={Pill}>
              {/* Tabs */}
              <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
                {farma.primeira_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('primeira')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${farmaTab === 'primeira' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    1ª Linha
                  </button>
                )}
                {farma.segunda_linha?.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('segunda')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${farmaTab === 'segunda' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    2ª Linha
                  </button>
                )}
                {farma.terceira_linha && farma.terceira_linha.length > 0 && (
                  <button
                    onClick={() => setFarmaTab('terceira')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${farmaTab === 'terceira' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    3ª Linha
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {farmaTabData?.map((farmaco, i) => (
                  <FarmacoCard key={i} farmaco={farmaco} />
                ))}
                {(!farmaTabData || farmaTabData.length === 0) && (
                  <p className="text-sm text-muted-foreground">Nenhum fármaco cadastrado para esta linha.</p>
                )}
              </div>
            </Section>
          )}

          {/* Fluxograma de Tratamento */}
          {patologia.fluxograma_tratamento && (
            <Section title="Fluxograma de Tratamento" icon={GitBranch}>
              <div className="bg-muted/20 rounded-xl p-4 sm:p-6 border">
                <FluxogramaRenderer text={patologia.fluxograma_tratamento} />
              </div>
            </Section>
          )}

          {/* Observações Clínicas */}
          {patologia.observacoes_clinicas && (
            <Section title="Observações Clínicas" icon={AlertTriangle}>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {patologia.observacoes_clinicas}
                </div>
              </div>
            </Section>
          )}

          {/* Referências */}
          {patologia.referencias && (
            <Section title="Referências" icon={FileText} defaultOpen={false}>
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                {patologia.referencias}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}
