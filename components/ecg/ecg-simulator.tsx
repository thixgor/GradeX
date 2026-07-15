'use client'

import React, { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Search, Activity, Ruler, GraduationCap, ZoomIn, ZoomOut, Play, Pause,
  Sun, Moon, GitCompare, Grid3x3, Monitor, Rows3, LineChart, Heart, Box, Loader2,
  X, ListFilter, Gauge, Star, StickyNote, ChevronRight,
} from 'lucide-react'
import { ECG_CATALOG, CATEGORIES, searchCatalog, type EcgEntry, type EcgCategory, type Urgency } from '@/lib/ecg/catalog'
import { computeMeasurements, LEADS, type LeadName } from '@/lib/ecg/engine'
import { useEcg12 } from './use-ecg-signal'
import { useEcgFavorites } from './use-ecg-favorites'
import { EcgLeadCanvas } from './ecg-lead-canvas'
import { Ecg12Lead } from './ecg-12-lead'
import { ConductionSystem, type WallKey } from './conduction-system'
import { EcgClinicalPanel } from './ecg-clinical-panel'
import { EcgQuiz } from './ecg-quiz'

// Coração 3D (WebGL/three.js) carregado sob demanda — three.js só entra no
// bundle quando o modo 3D é ativado.
const Heart3D = dynamic(() => import('./heart-3d').then((m) => m.Heart3D), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
})

type ViewMode = '12' | 'individual' | '3' | 'monitor' | 'rhythm'
const SPEEDS = [25, 50, 100]
const GAINS = [5, 10, 20]

const URGENCY_STYLE: Record<Urgency, string> = {
  emergencia: 'bg-red-500/15 text-red-500 border-red-500/30',
  urgencia: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  benigno: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  variavel: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
}
const URGENCY_LABEL: Record<Urgency, string> = {
  emergencia: 'Emergência', urgencia: 'Urgência', benigno: 'Benigno', variavel: 'Variável',
}

const WALL_MAP: Record<string, WallKey> = {
  anterior: 'anterior', septal: 'septal', inferior: 'inferior', lateral: 'lateral', posterior: 'posterior', rightVentricle: 'rv',
}

function ectopicFor(entry: EcgEntry): { x: number; y: number; label: string } | null {
  const id = entry.id
  if (id.startsWith('pvc') || id === 'vt-monomorphic' || id === 'torsades' || id === 'aivr') return { x: 0.35, y: 0.75, label: 'Foco ventricular' }
  if (id === 'vfib') return { x: 0.5, y: 0.7, label: 'Reentrada ventricular caótica' }
  if (id.includes('afib')) return { x: 0.85, y: 0.35, label: 'Veias pulmonares / átrios' }
  if (id.includes('aflutter')) return { x: 0.75, y: 0.55, label: 'Istmo cavotricuspídeo (AD)' }
  if (id === 'avnrt') return { x: 0.5, y: 0.52, label: 'Reentrada nodal (nó AV)' }
  if (id === 'junctional-escape') return { x: 0.5, y: 0.52, label: 'Escape juncional (nó AV)' }
  if (id === 'mat' || id === 'pac-isolated') return { x: 0.8, y: 0.4, label: 'Focos atriais ectópicos' }
  if (id.startsWith('wpw') || id.startsWith('avrt')) return { x: 0.72, y: 0.48, label: 'Via acessória (feixe de Kent)' }
  return null
}

export function EcgSimulator() {
  const [tab, setTab] = useState<'sim' | 'quiz'>('sim')
  const [selectedId, setSelectedId] = useState<string>('sinus-normal')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<EcgCategory | null>(null)
  const [view, setView] = useState<ViewMode>('12')
  const [speed, setSpeed] = useState(25)
  const [gain, setGain] = useState(10)
  const [zoom, setZoom] = useState(1)
  const [live, setLive] = useState(false)
  const [dark, setDark] = useState(true)
  const [calipers, setCalipers] = useState(false)
  const [teaching, setTeaching] = useState(false)
  const [compare, setCompare] = useState(false)
  const [indLead, setIndLead] = useState<LeadName>('II')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [heartMode, setHeartMode] = useState<'3d' | '2d'>('3d')
  const { isFavorite, toggleFavorite, notes, setNote } = useEcgFavorites()

  const entry = useMemo(() => ECG_CATALOG.find((e) => e.id === selectedId) || ECG_CATALOG[0], [selectedId])
  const results = useMemo(() => {
    const base = searchCatalog(query, cat)
    return onlyFavorites ? base.filter((e) => isFavorite(e.id)) : base
  }, [query, cat, onlyFavorites, isFavorite])
  const { map: signals, fs } = useEcg12(entry.pattern, 12000, 250)
  const normalEntry = ECG_CATALOG[0]
  const { map: normalSignals } = useEcg12(normalEntry.pattern, 12000, 250)
  const measures = useMemo(() => computeMeasurements(entry.pattern), [entry])

  const isLive = live || view === 'monitor'
  const compareSignals = compare && entry.id !== 'sinus-normal' ? normalSignals : null

  const walls = (entry.clinical.paredeAfetada || []).map((w) => WALL_MAP[w]).filter(Boolean) as WallKey[]
  const ectopic = ectopicFor(entry)

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => setTab('sim')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'sim' ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
          <Activity className="h-4 w-4" /> Simulador
        </button>
        <button onClick={() => setTab('quiz')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition ${tab === 'quiz' ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
          <GraduationCap className="h-4 w-4" /> Exercícios
        </button>
      </div>

      {tab === 'quiz' ? (
        <EcgQuiz dark={dark} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          {/* ═══════ SIDEBAR / BANCO DE ECG ═══════ */}
          <div className={`${sidebarOpen ? 'fixed inset-0 z-50 bg-background/95 p-4 backdrop-blur-xl overflow-y-auto lg:static lg:z-auto lg:bg-transparent lg:p-0 lg:backdrop-blur-none' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between lg:hidden">
              <h3 className="text-sm font-bold">Banco de ECG</h3>
              <button onClick={() => setSidebarOpen(false)} className="rounded-lg bg-white/[0.06] p-1.5"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative mt-3 lg:mt-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder='Buscar: "supra em V2", "Brugada", "QT longo", "FA"...'
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/40" />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button onClick={() => { setCat(null); setOnlyFavorites(false) }}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${!cat && !onlyFavorites ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
                Todas
              </button>
              <button onClick={() => setOnlyFavorites((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition ${onlyFavorites ? 'bg-amber-500 text-white' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
                <Star className={`h-3 w-3 ${onlyFavorites ? 'fill-current' : ''}`} /> Favoritos
              </button>
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCat(c === cat ? null : c)}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${cat === c ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-3 max-h-[70vh] space-y-1.5 overflow-y-auto pr-1">
              {results.map((e) => (
                <button key={e.id} onClick={() => { setSelectedId(e.id); setSidebarOpen(false) }}
                  className={`w-full rounded-xl border p-2.5 text-left transition ${e.id === selectedId ? 'border-primary/50 bg-primary/10' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-[13px] font-bold leading-tight">
                      {isFavorite(e.id) && <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />}
                      {e.nome}
                    </span>
                    <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${URGENCY_STYLE[e.urgencia]}`}>
                      {URGENCY_LABEL[e.urgencia]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{e.categoria}</p>
                </button>
              ))}
              {results.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Nenhum padrão encontrado.</p>}
            </div>
          </div>

          {/* ═══════ MAIN ═══════ */}
          <div className="min-w-0 space-y-4">
            {/* Cabeçalho do padrão */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setSidebarOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-bold text-primary lg:hidden">
                  <ListFilter className="h-4 w-4" /> Banco de ECG
                  <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-black leading-none">{ECG_CATALOG.length}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <div>
                  <h2 className="text-xl font-black leading-tight">{entry.nome}</h2>
                  <span className={`mt-1 inline-block rounded border px-2 py-0.5 text-[10px] font-black uppercase ${URGENCY_STYLE[entry.urgencia]}`}>
                    {URGENCY_LABEL[entry.urgencia]} · {entry.categoria}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFavorite(entry.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${isFavorite(entry.id) ? 'bg-amber-500 text-white' : 'bg-white/[0.06] text-muted-foreground hover:text-foreground'}`}
                  title="Salvar nos favoritos">
                  <Star className={`h-4 w-4 ${isFavorite(entry.id) ? 'fill-current' : ''}`} /> {isFavorite(entry.id) ? 'Salvo' : 'Favoritar'}
                </button>
                <button onClick={() => setShowNotes((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${showNotes || notes[entry.id] ? 'bg-violet-500 text-white' : 'bg-white/[0.06] text-muted-foreground hover:text-foreground'}`}
                  title="Anotações pessoais">
                  <StickyNote className="h-4 w-4" /> Notas{notes[entry.id] ? ' •' : ''}
                </button>
              </div>
            </div>

            {showNotes && (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.04] p-3">
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-violet-500"><StickyNote className="h-3.5 w-3.5" /> Suas anotações — {entry.nome}</label>
                <textarea
                  value={notes[entry.id] || ''}
                  onChange={(e) => setNote(entry.id, e.target.value)}
                  placeholder="Registre mnemônicos, pegadinhas de prova, casos que você viu... (salvo automaticamente neste dispositivo)"
                  className="min-h-[80px] w-full resize-y rounded-lg border border-white/[0.12] bg-white/[0.03] p-2.5 text-sm outline-none focus:border-violet-500/40"
                />
              </div>
            )}

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-2">
              {/* view modes */}
              <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
                <ToolBtn active={view === '12'} onClick={() => setView('12')} icon={Grid3x3} title="12 derivações" />
                <ToolBtn active={view === 'monitor'} onClick={() => setView('monitor')} icon={Monitor} title="Modo monitor" />
                <ToolBtn active={view === '3'} onClick={() => setView('3')} icon={Rows3} title="3 derivações" />
                <ToolBtn active={view === 'individual'} onClick={() => setView('individual')} icon={LineChart} title="Individual" />
                <ToolBtn active={view === 'rhythm'} onClick={() => setView('rhythm')} icon={Activity} title="Ritmo longo (DII)" />
              </div>

              {/* speed */}
              <Segmented label="mm/s" value={speed} options={SPEEDS} onChange={setSpeed} icon={Gauge} />
              {/* gain */}
              <Segmented label="mm/mV" value={gain} options={GAINS} onChange={setGain} />

              {/* zoom */}
              <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
                <button onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} className="rounded p-1.5 hover:bg-white/10"><ZoomOut className="h-4 w-4" /></button>
                <span className="w-10 text-center text-[11px] font-bold tabular-nums">{zoom.toFixed(1)}×</span>
                <button onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(1)))} className="rounded p-1.5 hover:bg-white/10"><ZoomIn className="h-4 w-4" /></button>
              </div>

              {/* toggles */}
              {view !== 'monitor' && (
                <button onClick={() => setLive((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${isLive ? 'bg-emerald-500 text-white' : 'bg-black/20 text-muted-foreground hover:text-foreground'}`}>
                  {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {isLive ? 'Live' : 'Live'}
                </button>
              )}
              <button onClick={() => setCalipers((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${calipers ? 'bg-cyan-500 text-white' : 'bg-black/20 text-muted-foreground hover:text-foreground'}`} title="Régua/paquímetro">
                <Ruler className="h-3.5 w-3.5" /> Régua
              </button>
              <button onClick={() => setTeaching((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${teaching ? 'bg-violet-500 text-white' : 'bg-black/20 text-muted-foreground hover:text-foreground'}`} title="Anatomia do ECG">
                <GraduationCap className="h-3.5 w-3.5" /> Anatomia
              </button>
              <button onClick={() => setCompare((v) => !v)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${compare ? 'bg-blue-500 text-white' : 'bg-black/20 text-muted-foreground hover:text-foreground'}`} title="Comparar com ECG normal">
                <GitCompare className="h-3.5 w-3.5" /> Comparar
              </button>
              <button onClick={() => setDark((v) => !v)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-black/20 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground" title="Tema hospitalar / claro">
                {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {dark ? 'Claro' : 'Hospitalar'}
              </button>
            </div>

            {compare && entry.id !== 'sinus-normal' && (
              <p className="rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-300">
                Sobreposição ativa: traçado <strong>azul</strong> = ECG normal; traçado principal = {entry.nome}. Compare morfologia, ST-T e intervalos.
              </p>
            )}

            {/* individual lead selector */}
            {view === 'individual' && (
              <div className="flex flex-wrap gap-1">
                {LEADS.map((l) => (
                  <button key={l} onClick={() => setIndLead(l)} className={`rounded-md px-2.5 py-1 text-xs font-bold transition ${indLead === l ? 'bg-primary text-primary-foreground' : 'bg-white/[0.05] text-muted-foreground hover:text-foreground'}`}>{l}</button>
                ))}
              </div>
            )}

            {/* ── DISPLAY ── */}
            <div className="rounded-xl border border-white/[0.1] p-1 shadow-inner">
              {view === '12' && (
                <Ecg12Lead signals={signals} fs={fs} speedMmS={speed} gainMmMv={gain} zoom={zoom} dark={dark} live={isLive} compareSignals={compareSignals} />
              )}
              {view === 'monitor' && (
                <div className="space-y-1">
                  {(['II', 'V1', 'V5'] as LeadName[]).map((l) => (
                    <EcgLeadCanvas key={l} signal={signals[l]} fs={fs} lead={l} label={l} speedMmS={speed} gainMmMv={gain} zoom={zoom} dark={dark} live height={110} showCalibration teaching={teaching && l === 'II'} calipers={calipers} />
                  ))}
                </div>
              )}
              {view === '3' && (
                <div className="space-y-1">
                  {(['I', 'II', 'III'] as LeadName[]).map((l) => (
                    <EcgLeadCanvas key={l} signal={signals[l]} fs={fs} lead={l} label={l} speedMmS={speed} gainMmMv={gain} zoom={zoom} dark={dark} live={isLive} height={130} showCalibration teaching={teaching && l === 'II'} calipers={calipers} />
                  ))}
                </div>
              )}
              {view === 'individual' && (
                <EcgLeadCanvas signal={signals[indLead]} fs={fs} lead={indLead} label={indLead} speedMmS={speed} gainMmMv={gain} zoom={zoom} dark={dark} live={isLive} height={230} showCalibration teaching={teaching} calipers={calipers} />
              )}
              {view === 'rhythm' && (
                <EcgLeadCanvas signal={signals['II']} fs={fs} lead="II" label="DII — ritmo" speedMmS={speed} gainMmMv={gain} zoom={zoom} dark={dark} live={isLive} height={200} showCalibration teaching={teaching} calipers={calipers} />
              )}
            </div>

            {/* ── MEDIDAS AUTOMÁTICAS ── */}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              <Measure label="FC" value={`${measures.hr}`} unit="bpm" />
              <Measure label="PR" value={measures.pr != null ? `${measures.pr}` : '—'} unit="ms" />
              <Measure label="QRS" value={`${measures.qrs}`} unit="ms" />
              <Measure label="QT" value={`${measures.qt}`} unit="ms" />
              <Measure label="QTc" value={`${measures.qtc}`} unit="ms" warn={measures.qtc > 460 || measures.qtc < 350} />
              <Measure label="Eixo" value={`${measures.axis}°`} />
              <Measure label="RR" value={`${measures.rr}`} unit="ms" />
              <Measure label="R" value={`${measures.rAmp}`} unit="mV" />
            </div>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
              <span className="font-bold text-muted-foreground">Interpretação automática: </span>
              <span className="font-semibold">{measures.axisLabel}</span>
              {measures.interpretation.length > 0 && <span> · {measures.interpretation.join(' · ')}</span>}
            </div>

            {/* ── ANATOMIA / LOCALIZAÇÃO + CONDUÇÃO ── */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-bold"><Heart className="h-4 w-4 text-red-500" /> Propagação elétrica e localização</h3>
                  <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
                    <button onClick={() => setHeartMode('3d')} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold transition ${heartMode === '3d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      <Box className="h-3.5 w-3.5" /> 3D
                    </button>
                    <button onClick={() => setHeartMode('2d')} className={`rounded px-2 py-1 text-[11px] font-bold transition ${heartMode === '2d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                      2D
                    </button>
                  </div>
                </div>
                {heartMode === '3d' ? (
                  <div>
                    <Heart3D rate={entry.pattern.rate || 60} dark={dark} highlightWalls={walls} arteryLabel={entry.clinical.arteriaCulpada} ectopicOrigin={ectopic}
                      axisDeg={entry.pattern.qrs.axis} axisLabel={measures.axisLabel}
                      abnormalConduction={['complete_block', 'vt', 'vfib', 'torsades', 'paced'].includes(entry.pattern.rhythm)} />
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-600 dark:text-sky-300">
                        <span className="inline-block h-2 w-2 rounded-full bg-sky-400" /> Vetor elétrico: {measures.axis}° · {measures.axisLabel}
                      </div>
                      {entry.clinical.arteriaCulpada && (
                        <div className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-500 dark:text-red-300">
                          Artéria culpada provável: {entry.clinical.arteriaCulpada}
                          {entry.clinical.paredeAfetada ? ` · parede ${entry.clinical.paredeAfetada.join(', ')}` : ''}
                        </div>
                      )}
                      {ectopic && (
                        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                          Origem: {ectopic.label}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <ConductionSystem rate={entry.pattern.rate || 60} dark={dark} highlightWalls={walls} arteryLabel={entry.clinical.arteriaCulpada} ectopicOrigin={ectopic}
                    axisDeg={entry.pattern.qrs.axis} axisLabel={measures.axisLabel}
                    abnormalConduction={['complete_block', 'vt', 'vfib', 'torsades', 'paced'].includes(entry.pattern.rhythm)} />
                )}
              </div>
              <EcgClinicalPanel entry={entry} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolBtn({ active, onClick, icon: Icon, title }: { active: boolean; onClick: () => void; icon: any; title: string }) {
  return (
    <button onClick={onClick} title={title} className={`rounded p-1.5 transition ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'}`}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

function Segmented({ label, value, options, onChange, icon: Icon }: { label: string; value: number; options: number[]; onChange: (v: number) => void; icon?: any }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-black/20 p-1">
      {Icon && <Icon className="ml-1 h-3.5 w-3.5 text-muted-foreground" />}
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded px-2 py-1 text-[11px] font-bold tabular-nums transition ${value === o ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-white/10'}`}>{o}</button>
      ))}
      <span className="px-1 text-[10px] font-semibold text-muted-foreground">{label}</span>
    </div>
  )
}

function Measure({ label, value, unit, warn }: { label: string; value: string; unit?: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg border p-2 text-center ${warn ? 'border-red-500/40 bg-red-500/10' : 'border-white/[0.08] bg-white/[0.02]'}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-base font-black tabular-nums ${warn ? 'text-red-500' : ''}`}>{value}<span className="ml-0.5 text-[9px] font-medium text-muted-foreground">{unit}</span></p>
    </div>
  )
}
