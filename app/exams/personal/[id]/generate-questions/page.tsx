'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  BookOpen,
  Zap,
  Shuffle,
  Gauge,
  Hash,
  MessageSquareText,
  Layers,
  GraduationCap,
  ChevronDown,
  Check,
  Dices,
  Calendar,
  X,
  Minus,
  Database,
  Combine,
  Globe,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomContext } from '@/lib/types'
import { PageLoading } from '@/components/page-loading'
import { TEMPLATES, TopicItem, MedicinaPeriodo, PsicologiaPeriodo, BiomedicinaPeriodo, OdontologiaPeriodo } from '@/lib/cronograma-types'
import { getMedicinaTopicos } from '@/lib/medicina-periodos-helper'
import { getPsicologiaTopicos } from '@/lib/psicologia-periodos-helper'
import { getBiomedicinaTopicos } from '@/lib/biomedicina-periodos-helper'
import { getOdontologiaTopicos } from '@/lib/odontologia-periodos-helper'

// ─── Iridescent Glass Panel ─────────────────────────────────
// Reusable glassmorphism container with animated chromatic border
function GlassPanel({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-panel relative ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── Option Chip (radio-like selector) ─────────────────────
function OptionChip({
  label,
  description,
  selected,
  onClick,
  disabled,
  icon,
}: {
  label: string
  description?: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
  icon?: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      className={`
        glass-chip relative w-full text-left px-4 py-3 rounded-xl
        transition-all duration-200 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${selected
          ? 'glass-chip-active'
          : 'hover:bg-white/5 dark:hover:bg-white/5'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Selection indicator */}
        <div className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${selected
            ? 'border-emerald-400 bg-emerald-400/20'
            : 'border-muted-foreground/30'
          }
        `}>
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="w-3 h-3 text-emerald-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {icon && <span className="flex-shrink-0 text-muted-foreground">{icon}</span>}

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${selected ? 'text-foreground' : 'text-muted-foreground'}`}>
            {label}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </motion.button>
  )
}

// ─── Section Header ─────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="glass-icon-badge flex items-center justify-center w-9 h-9 rounded-xl">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Custom Slider ──────────────────────────────────────────
function GlassSlider({
  value,
  onChange,
  min,
  max,
  step,
  disabled,
  leftLabel,
  rightLabel,
  centerLabel,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  disabled?: boolean
  leftLabel?: string
  rightLabel?: string
  centerLabel?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="glass-slider-track h-2 rounded-full overflow-hidden">
          <div
            className="glass-slider-fill h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="glass-slider-input absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div
          className="glass-slider-thumb absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
          style={{ left: `${pct}%` }}
        />
      </div>
      {(leftLabel || rightLabel || centerLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{leftLabel}</span>
          <span className="font-semibold text-foreground">{centerLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main types ──────────────────────────────────────────────
interface Question {
  id: string
  number: number
  type?: 'multiple-choice' | 'discursive' | 'essay'
  statement: string
  statementSource?: string
  command: string
  imageUrl?: string
  imageSource?: string
  alternatives: Array<{
    id: string
    letter: string
    text: string
    isCorrect: boolean
  }>
  alternativeImages?: Record<string, string>
  explanation: string
  commentedFeedback?: {
    correctAlternative: string
    explanations: Record<string, string>
  }
  origin?: 'banco' | 'ia'
  sourceInfo?: string
  ano?: number
  dificuldade?: string
  keyPoints?: Array<{ id: string; description: string; weight: number }>
  maxScore?: number
}

interface Exam {
  _id: string
  title: string
  numberOfQuestions: number
  numberOfAlternatives: number
  questions: Question[]
}

// ─── Multi-Select Dropdown for hierarchy filters ────────────
function MultiSelectDropdown({
  label,
  items,
  selectedIds,
  onToggle,
  disabled,
  placeholder = 'Todos',
}: {
  label: string
  items: { id: string; nome: string; count?: number }[]
  selectedIds: string[]
  onToggle: (id: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const displayText = selectedIds.length === 0
    ? placeholder
    : selectedIds.length === 1
      ? items.find(i => i.id === selectedIds[0])?.nome || '1 selecionado'
      : `${selectedIds.length} selecionados`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`glass-select w-full text-left flex items-center justify-between gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`truncate text-sm ${selectedIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
            {displayText}
          </span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-auto">
        {items.length === 0 ? (
          <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground">Nenhum disponível</span>
          </DropdownMenuItem>
        ) : (
          items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={(e) => {
                e.preventDefault()
                onToggle(item.id)
              }}
            >
              <Checkbox
                checked={selectedIds.includes(item.id)}
                className="mr-2"
              />
              <span className="flex-1 truncate text-sm">{item.nome}</span>
              {item.count !== undefined && (
                <span className="text-xs text-muted-foreground ml-1">({item.count})</span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Bank Filters Panel ─────────────────────────────────────
function BankFiltersPanel({
  bankFilters, setBankFilters, periodos, modulos, topicos, subtopicos, anosDisponiveis,
  questionCount, setQuestionCount, maxCount, disabled, label,
}: {
  bankFilters: any
  setBankFilters: (fn: any) => void
  periodos: any[]
  modulos: any[]
  topicos: any[]
  subtopicos: any[]
  anosDisponiveis: number[]
  questionCount: number
  setQuestionCount: (n: number) => void
  maxCount: number
  disabled: boolean
  label: string
}) {
  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Database className="w-4.5 h-4.5 text-emerald-400" />}
        title={label}
        subtitle="Filtros do banco de questoes — selecione múltiplos"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Período(s)</Label>
          <MultiSelectDropdown
            label="Período"
            items={periodos.map((p: any) => ({ id: String(p._id), nome: p.nome, count: p.totalQuestoes }))}
            selectedIds={bankFilters.periodoIds}
            onToggle={(id) => setBankFilters((prev: any) => {
              const cur = prev.periodoIds || []
              const updated = cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id]
              return { ...prev, periodoIds: updated, moduloIds: [], topicoIds: [], subtopicoIds: [] }
            })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Módulo(s)</Label>
          <MultiSelectDropdown
            label="Módulo"
            items={modulos.map((m: any) => ({ id: String(m._id), nome: m.nome, count: m.totalQuestoes }))}
            selectedIds={bankFilters.moduloIds}
            onToggle={(id) => setBankFilters((prev: any) => {
              const cur = prev.moduloIds || []
              const updated = cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id]
              return { ...prev, moduloIds: updated, topicoIds: [], subtopicoIds: [] }
            })}
            disabled={disabled || bankFilters.periodoIds.length === 0}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tópico(s)</Label>
          <MultiSelectDropdown
            label="Tópico"
            items={topicos.map((t: any) => ({ id: String(t._id), nome: t.nome, count: t.totalQuestoes }))}
            selectedIds={bankFilters.topicoIds}
            onToggle={(id) => setBankFilters((prev: any) => {
              const cur = prev.topicoIds || []
              const updated = cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id]
              return { ...prev, topicoIds: updated, subtopicoIds: [] }
            })}
            disabled={disabled || bankFilters.moduloIds.length === 0}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Subtópico(s)</Label>
          <MultiSelectDropdown
            label="Subtópico"
            items={subtopicos.map((s: any) => ({ id: String(s._id), nome: s.nome, count: s.totalQuestoes }))}
            selectedIds={bankFilters.subtopicoIds}
            onToggle={(id) => setBankFilters((prev: any) => {
              const cur = prev.subtopicoIds || []
              const updated = cur.includes(id) ? cur.filter((x: string) => x !== id) : [...cur, id]
              return { ...prev, subtopicoIds: updated }
            })}
            disabled={disabled || bankFilters.topicoIds.length === 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <select
            value={bankFilters.tipo}
            onChange={(e) => setBankFilters((prev: any) => ({ ...prev, tipo: e.target.value }))}
            disabled={disabled}
            className="glass-select w-full"
          >
            <option value="">Todos</option>
            <option value="objetiva">Objetiva</option>
            <option value="discursiva">Discursiva</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dificuldade</Label>
          <select
            value={bankFilters.dificuldade}
            onChange={(e) => setBankFilters((prev: any) => ({ ...prev, dificuldade: e.target.value }))}
            disabled={disabled}
            className="glass-select w-full"
          >
            <option value="">Todas</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      {anosDisponiveis.length > 0 && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ano</Label>
          <div className="flex flex-wrap gap-1.5">
            {anosDisponiveis.map((ano) => {
              const isSelected = bankFilters.anos.includes(ano)
              return (
                <button
                  key={ano}
                  type="button"
                  onClick={() => {
                    setBankFilters((prev: any) => ({
                      ...prev,
                      anos: isSelected ? prev.anos.filter((a: number) => a !== ano) : [...prev.anos, ano]
                    }))
                  }}
                  disabled={disabled}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                      : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                  }`}
                >
                  {ano}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <SectionHeader
            icon={<Hash className="w-4.5 h-4.5 text-emerald-400" />}
            title="Quantidade de Questoes"
          />
        </div>
        <GlassSlider
          value={questionCount}
          onChange={(v) => setQuestionCount(Math.round(v))}
          min={1}
          max={maxCount}
          step={1}
          disabled={disabled}
          leftLabel="1"
          rightLabel={String(maxCount)}
          centerLabel={String(questionCount)}
        />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
export default function GenerateQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [examData, setExamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([])
  const [themes, setThemes] = useState('')
  const [difficulty, setDifficulty] = useState(0.5)
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'review'>('config')
  const [numberOfQuestions, setNumberOfQuestions] = useState(5)
  const [questionsLimit, setQuestionsLimit] = useState(5)
  const [userAccountType, setUserAccountType] = useState<'gratuito' | 'trial' | 'premium' | 'admin'>('gratuito')

  const [style, setStyle] = useState<'contextualizada' | 'rapida'>('contextualizada')
  const [mixedStyles, setMixedStyles] = useState(false)
  const [alternativeType, setAlternativeType] = useState<'standard' | 'multiple-affirmative' | 'comparison' | 'assertion-reason'>('standard')
  const [mixedAlternativeTypes, setMixedAlternativeTypes] = useState(false)
  const [alternativeTypeDistribution, setAlternativeTypeDistribution] = useState({
    'standard': 50,
    'multiple-affirmative': 25,
    'comparison': 15,
    'assertion-reason': 10,
  })
  const [randomDifficulty, setRandomDifficulty] = useState(false)
  const [questionContext, setQuestionContext] = useState<'medicina' | 'psicologia' | 'biomedicina' | 'odontologia' | 'enem' | 'uerj' | 'outros'>('medicina')

  const [savedContexts, setSavedContexts] = useState<CustomContext[]>([])
  const [selectedSavedContext, setSelectedSavedContext] = useState<string>('')
  const [customContext, setCustomContext] = useState('')

  // Cronograma modal
  const [showCronogramaModal, setShowCronogramaModal] = useState(false)
  const [cronogramas, setCronogramas] = useState<any[]>([])
  const [loadingCronogramas, setLoadingCronogramas] = useState(false)
  const [cronogramaThemeTags, setCronogramaThemeTags] = useState<{ tag: string; source: 'cronograma' | 'modelo' }[]>([])
  const [selectedCronogramaId, setSelectedCronogramaId] = useState<string>('')
  const [cronogramaSelections, setCronogramaSelections] = useState<Set<string>>(new Set())
  const [cronogramaModalTab, setCronogramaModalTab] = useState<'meus' | 'modelos'>('modelos')
  const [modeloTemplateId, setModeloTemplateId] = useState<string>('medicina')
  const [medicinaPeriodo, setMedicinaPeriodo] = useState<MedicinaPeriodo>(1)
  const [psiPeriodo, setPsiPeriodo] = useState<PsicologiaPeriodo>(1)
  const [bioPeriodo, setBioPeriodo] = useState<BiomedicinaPeriodo>(1)
  const [odoPeriodo, setOdoPeriodo] = useState<OdontologiaPeriodo>(1)

  // Exam mode state
  const [examMode, setExamMode] = useState<'ai' | 'banco' | 'misto'>('ai')

  // Bank questions state — arrays para multi-select
  const [bankFilters, setBankFilters] = useState({
    periodoIds: [] as string[],
    moduloIds: [] as string[],
    topicoIds: [] as string[],
    subtopicoIds: [] as string[],
    tipo: '' as string,
    dificuldade: '' as string,
    anos: [] as number[],
  })
  const [bankQuestionCount, setBankQuestionCount] = useState(5)
  const [aiQuestionCount, setAiQuestionCount] = useState(5)

  // Hierarchy data for banco filters
  const [periodos, setPeriodos] = useState<any[]>([])
  const [bankModulos, setBankModulos] = useState<any[]>([])
  const [bankTopicos, setBankTopicos] = useState<any[]>([])
  const [bankSubtopicos, setBankSubtopicos] = useState<any[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])

  // Expandable sections
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    checkPersonalExamsEnabled()
    loadExamData()
    fetchSavedContexts()
    loadUserLimits()
  }, [examId])

  async function loadUserLimits() {
    try {
      const res = await fetch('/api/user/tier-limits')
      if (res.ok) {
        const data = await res.json()
        setQuestionsLimit(data.limits.questionsPerExam)
        setUserAccountType(data.accountType)
        setNumberOfQuestions(Math.min(5, data.limits.questionsPerExam))
      }
    } catch (error) {
      console.error('Erro ao carregar limites:', error)
    }
  }

  async function checkPersonalExamsEnabled() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const settings = await res.json()
        if (settings.personalExamsEnabled === false) {
          router.push('/')
          return
        }
      }
    } catch (error) {
      console.error('Erro ao verificar configurações:', error)
    }
  }

  async function loadExamData() {
    try {
      if (examId.startsWith('temp-')) {
        const data = sessionStorage.getItem('pendingExamData')
        if (data) {
          const parsed = JSON.parse(data)
          setExamData(parsed)
          setExamMode(parsed.examMode || 'ai')
          const tempExam: Exam = {
            _id: examId,
            title: JSON.parse(data).title,
            numberOfQuestions: 5,
            numberOfAlternatives: JSON.parse(data).numberOfAlternatives,
            questions: [],
          }
          setExam(tempExam)
        } else {
          alert('Dados da prova não encontrados')
          router.back()
        }
      } else {
        const res = await fetch(`/api/exams/${examId}`)
        if (res.ok) {
          const data = await res.json()
          setExam(data.exam)
          setExamData(data.exam)
        } else {
          alert('Prova não encontrada')
          router.back()
        }
      }
    } catch (error) {
      console.error('Erro ao carregar prova:', error)
      alert('Erro ao carregar prova')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  async function fetchSavedContexts() {
    try {
      const res = await fetch('/api/contexts')
      const data = await res.json()
      if (data.success) {
        setSavedContexts(data.contexts)
      }
    } catch (error) {
      console.error('Erro ao carregar contextos salvos:', error)
    }
  }

  async function loadCronogramas() {
    setLoadingCronogramas(true)
    try {
      const res = await fetch('/api/cronogramas')
      if (res.ok) {
        const data = await res.json()
        setCronogramas(data.cronogramas || [])
      }
    } catch (error) {
      console.error('Erro ao carregar cronogramas:', error)
    } finally {
      setLoadingCronogramas(false)
    }
  }

  // ─── Bank hierarchy loading ───
  async function loadBankHierarchy() {
    try {
      const [periodosRes, anosRes] = await Promise.all([
        fetch('/api/banco/periodos'),
        fetch('/api/banco/anos'),
      ])
      if (periodosRes.ok) {
        const data = await periodosRes.json()
        setPeriodos(data.periodos || [])
      }
      if (anosRes.ok) {
        const data = await anosRes.json()
        setAnosDisponiveis(data.anos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error)
    }
  }

  async function loadBankModulos(periodoIds: string[]) {
    try {
      const res = await fetch(`/api/banco/modulos?periodoId=${periodoIds.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setBankModulos(data.modulos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar modulos:', error)
    }
  }

  async function loadBankTopicos(moduloIds: string[]) {
    try {
      const res = await fetch(`/api/banco/topicos?moduloId=${moduloIds.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setBankTopicos(data.topicos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar topicos:', error)
    }
  }

  async function loadBankSubtopicos(topicoIds: string[]) {
    try {
      const res = await fetch(`/api/banco/subtopicos?topicoId=${topicoIds.join(',')}`)
      if (res.ok) {
        const data = await res.json()
        setBankSubtopicos(data.subtopicos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar subtopicos:', error)
    }
  }

  useEffect(() => {
    if (examMode === 'banco' || examMode === 'misto') {
      loadBankHierarchy()
    }
  }, [examMode])

  useEffect(() => {
    if (bankFilters.periodoIds.length > 0) {
      loadBankModulos(bankFilters.periodoIds)
    } else {
      setBankModulos([])
      setBankTopicos([])
      setBankSubtopicos([])
    }
  }, [bankFilters.periodoIds.join(',')])

  useEffect(() => {
    if (bankFilters.moduloIds.length > 0) {
      loadBankTopicos(bankFilters.moduloIds)
    } else {
      setBankTopicos([])
      setBankSubtopicos([])
    }
  }, [bankFilters.moduloIds.join(',')])

  useEffect(() => {
    if (bankFilters.topicoIds.length > 0) {
      loadBankSubtopicos(bankFilters.topicoIds)
    } else {
      setBankSubtopicos([])
    }
  }, [bankFilters.topicoIds.join(',')])

  // ─── Bank question fetching ───
  async function fetchBankQuestions(count: number): Promise<Question[]> {
    const params = new URLSearchParams()
    params.set('limit', String(count))
    params.set('random', 'true')
    if (bankFilters.periodoIds.length > 0) params.set('periodoId', bankFilters.periodoIds.join(','))
    if (bankFilters.moduloIds.length > 0) params.set('moduloId', bankFilters.moduloIds.join(','))
    if (bankFilters.topicoIds.length > 0) params.set('topicoId', bankFilters.topicoIds.join(','))
    if (bankFilters.subtopicoIds.length > 0) params.set('subtopicoId', bankFilters.subtopicoIds.join(','))
    if (bankFilters.tipo) params.set('tipo', bankFilters.tipo)
    if (bankFilters.dificuldade) params.set('dificuldade', bankFilters.dificuldade)
    if (bankFilters.anos.length > 0) params.set('anos', bankFilters.anos.join(','))

    const res = await fetch(`/api/banco/questoes/random?${params.toString()}`)
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erro ao buscar questoes do banco')
    }
    const data = await res.json()
    return data.questions
  }

  async function handleGenerateBankOnly() {
    if (bankQuestionCount < 1) {
      alert('Selecione pelo menos 1 questao')
      return
    }
    setGenerating(true)
    setCurrentStep('generating')
    try {
      const questions = await fetchBankQuestions(bankQuestionCount)
      if (questions.length === 0) {
        alert('Nenhuma questao encontrada com os filtros selecionados')
        setCurrentStep('config')
        setGenerating(false)
        return
      }
      setGeneratedQuestions(questions)
      await saveExamWithQuestions(questions)
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao buscar questoes')
      setCurrentStep('config')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateMixed() {
    if (bankQuestionCount < 1 && aiQuestionCount < 1) {
      alert('Configure pelo menos 1 questao')
      return
    }
    if (aiQuestionCount > 0 && !themes.trim() && cronogramaThemeTags.length === 0) {
      alert('Digite os temas para as questoes de IA')
      return
    }
    setGenerating(true)
    setCurrentStep('generating')
    try {
      let allQuestions: Question[] = []

      // 1. Fetch bank questions
      if (bankQuestionCount > 0) {
        const bankQuestions = await fetchBankQuestions(bankQuestionCount)
        allQuestions.push(...bankQuestions.map(q => ({ ...q, origin: 'banco' as const } as any)))
      }

      // 2. Generate AI questions
      if (aiQuestionCount > 0) {
        let context = ''
        if (questionContext === 'medicina') {
          context = 'Ciências Médicas - Contextualização clínica e raciocínio aplicado'
        } else if (questionContext === 'psicologia') {
          context = 'Ciências Psicossociais - Contextualização clínica e raciocínio psicológico aplicado'
        } else if (questionContext === 'biomedicina') {
          context = 'Ciências Biomédicas - Contextualização laboratorial e raciocínio biomédico aplicado'
        } else if (questionContext === 'odontologia') {
          context = 'Ciências Odontológicas - Contextualização clínica e raciocínio odontológico aplicado'
        } else if (questionContext === 'enem') {
          context = 'ENEM - Exame Nacional do Ensino Medio'
        } else if (questionContext === 'uerj') {
          context = 'UERJ - Universidade do Estado do Rio de Janeiro'
        } else {
          const savedContext = savedContexts.find(c => c.id === selectedSavedContext)
          context = savedContext ? savedContext.name : customContext.trim()
        }

        const res = await fetch(`/api/exams/${examId}/generate-questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            themes: [
              ...themes.split(';').map(t => t.trim()).filter(t => t),
              ...cronogramaThemeTags.map(t => t.tag),
            ],
            difficulty,
            numberOfQuestions: aiQuestionCount,
            numberOfAlternatives: exam?.numberOfAlternatives || 4,
            style,
            mixedStyles,
            alternativeType,
            mixedAlternativeTypes,
            alternativeTypeDistribution,
            randomDifficulty,
            questionContext,
            context,
          }),
        })

        if (!res.ok) {
          const error = await res.json()
          if (error.requiresUpgrade) {
            router.push('/buy')
            return
          }
          throw new Error(error.error || 'Erro ao gerar questoes de IA')
        }

        const data = await res.json()
        allQuestions.push(...data.questions.map((q: Question) => ({ ...q, origin: 'ia' as const } as any)))
      }

      // 3. Renumber all questions
      allQuestions = allQuestions.map((q, i) => ({ ...q, number: i + 1 }))

      setGeneratedQuestions(allQuestions)
      await saveExamWithQuestions(allQuestions)
    } catch (error: any) {
      console.error('Erro:', error)
      alert(error.message || 'Erro ao gerar prova')
      setCurrentStep('config')
    } finally {
      setGenerating(false)
    }
  }

  function buildCronogramaTree(cronograma: any) {
    const tree: Record<string, Record<string, Set<string>>> = {}
    for (const item of cronograma.cronograma || []) {
      for (const atividade of item.atividades || []) {
        const { topico, subtopico, modulo } = atividade
        if (!tree[topico]) tree[topico] = {}
        if (!tree[topico][subtopico]) tree[topico][subtopico] = new Set()
        tree[topico][subtopico].add(modulo)
      }
    }
    return tree
  }

  function buildTemplateTree(topicos: TopicItem[]): Record<string, Record<string, Set<string>>> {
    const tree: Record<string, Record<string, Set<string>>> = {}
    for (const topico of topicos) {
      if (!tree[topico.nome]) tree[topico.nome] = {}
      for (const subtopico of topico.subtopicos) {
        if (!tree[topico.nome][subtopico.nome]) tree[topico.nome][subtopico.nome] = new Set()
        for (const modulo of subtopico.modulos) {
          tree[topico.nome][subtopico.nome].add(modulo.nome)
        }
      }
    }
    return tree
  }

  // Get available global model templates (exclude 'personalizado'; include medicina/psicologia/biomedicina/odontologia even though topicos is empty since they load dynamically)
  const globalModels = Object.values(TEMPLATES).filter(
    t => t.modelo !== 'personalizado' && (t.topicos.length > 0 || t.modelo === 'medicina' || t.modelo === 'psicologia' || t.modelo === 'biomedicina' || t.modelo === 'odontologia')
  )

  function renderTreeView(tree: Record<string, Record<string, Set<string>>>) {
    const topicos = Object.keys(tree).sort()
    return (
      <div className="space-y-1">
        {topicos.map((topico) => {
          const subtopicos = Object.keys(tree[topico]).sort()
          const allModulosInTopic: string[] = []
          subtopicos.forEach(sub => tree[topico][sub].forEach(mod => allModulosInTopic.push(`${topico} > ${sub} > ${mod}`)))
          const topicSelected = allModulosInTopic.every(m => cronogramaSelections.has(m))
          const topicPartial = !topicSelected && allModulosInTopic.some(m => cronogramaSelections.has(m))

          return (
            <div key={topico} className="glass-inset rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 p-3 hover:bg-white/5 transition-colors text-left"
                onClick={() => {
                  setCronogramaSelections(prev => {
                    const next = new Set(prev)
                    if (topicSelected) {
                      allModulosInTopic.forEach(m => next.delete(m))
                    } else {
                      allModulosInTopic.forEach(m => next.add(m))
                    }
                    return next
                  })
                }}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                  topicSelected ? 'bg-emerald-500 border-emerald-500 text-white' :
                  topicPartial ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'
                }`}>
                  {topicSelected ? <Check className="w-3 h-3" /> : topicPartial ? <Minus className="w-3 h-3 text-emerald-400" /> : null}
                </div>
                <span className="text-sm font-medium flex-1">{topico}</span>
                <span className="text-xs text-muted-foreground">{allModulosInTopic.length} módulos</span>
              </button>

              <div className="pl-6 pb-1">
                {subtopicos.map((subtopico) => {
                  const modulos = Array.from(tree[topico][subtopico]).sort()
                  const subModPaths = modulos.map(m => `${topico} > ${subtopico} > ${m}`)
                  const subSelected = subModPaths.every(m => cronogramaSelections.has(m))
                  const subPartial = !subSelected && subModPaths.some(m => cronogramaSelections.has(m))

                  return (
                    <div key={subtopico}>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                        onClick={() => {
                          setCronogramaSelections(prev => {
                            const next = new Set(prev)
                            if (subSelected) {
                              subModPaths.forEach(m => next.delete(m))
                            } else {
                              subModPaths.forEach(m => next.add(m))
                            }
                            return next
                          })
                        }}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          subSelected ? 'bg-emerald-500 border-emerald-500 text-white' :
                          subPartial ? 'border-emerald-500 bg-emerald-500/20' : 'border-muted-foreground/30'
                        }`}>
                          {subSelected ? <Check className="w-2.5 h-2.5" /> : subPartial ? <Minus className="w-2.5 h-2.5 text-emerald-400" /> : null}
                        </div>
                        <span className="text-xs text-muted-foreground flex-1">{subtopico}</span>
                      </button>

                      <div className="pl-6">
                        {modulos.map((modulo) => {
                          const path = `${topico} > ${subtopico} > ${modulo}`
                          const isSelected = cronogramaSelections.has(path)
                          return (
                            <button
                              key={modulo}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors text-left"
                              onClick={() => {
                                setCronogramaSelections(prev => {
                                  const next = new Set(prev)
                                  if (isSelected) next.delete(path)
                                  else next.add(path)
                                  return next
                                })
                              }}
                            >
                              <div className={`w-3 h-3 rounded-sm border flex items-center justify-center ${
                                isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30'
                              }`}>
                                {isSelected && <Check className="w-2 h-2" />}
                              </div>
                              <span className="text-xs text-muted-foreground">{modulo}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  async function handleGenerateQuestions() {
    if (!themes.trim() && cronogramaThemeTags.length === 0) {
      alert('Digite os temas para as questões ou selecione do cronograma')
      return
    }

    if (questionContext === 'outros' && !selectedSavedContext && !customContext.trim()) {
      alert('Por favor, selecione ou especifique o contexto personalizado da questão')
      return
    }

    setGenerating(true)
    setCurrentStep('generating')

    try {
      let context = ''
      if (questionContext === 'medicina') {
        context = 'Medicina - Contextualização clínica e raciocínio aplicado'
      } else if (questionContext === 'psicologia') {
        context = 'Psicologia - Contextualização clínica e raciocínio psicológico aplicado'
      } else if (questionContext === 'biomedicina') {
        context = 'Biomedicina - Contextualização laboratorial e raciocínio biomédico aplicado'
      } else if (questionContext === 'odontologia') {
        context = 'Odontologia - Contextualização clínica e raciocínio odontológico aplicado'
      } else if (questionContext === 'enem') {
        context = 'ENEM - Exame Nacional do Ensino Médio'
      } else if (questionContext === 'uerj') {
        context = 'UERJ - Universidade do Estado do Rio de Janeiro'
      } else {
        if (selectedSavedContext) {
          const savedContext = savedContexts.find(c => c.id === selectedSavedContext)
          context = savedContext ? savedContext.name : customContext.trim()
        } else {
          context = customContext.trim()
        }
      }

      const res = await fetch(`/api/exams/${examId}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themes: [
            ...themes.split(';').map(t => t.trim()).filter(t => t),
            ...cronogramaThemeTags.map(t => t.tag)
          ],
          difficulty,
          numberOfQuestions,
          numberOfAlternatives: exam?.numberOfAlternatives || 4,
          style,
          mixedStyles,
          alternativeType,
          mixedAlternativeTypes,
          alternativeTypeDistribution,
          randomDifficulty,
          questionContext,
          context,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedQuestions(data.questions)
        await saveExamWithQuestions(data.questions)
      } else {
        let errorMessage = 'Erro ao gerar questões'
        try {
          const error = await res.json()
          if (error.requiresUpgrade) {
            router.push('/buy')
            return
          }
          errorMessage = error.error || errorMessage
        } catch (e) {
          errorMessage = `Erro ${res.status}: ${res.statusText || 'Falha na comunicação com o servidor'}`
        }
        alert(`Erro: ${errorMessage}`)
        setCurrentStep('config')
      }
    } catch (error) {
      console.error('Erro ao gerar questões:', error)
      alert('Erro ao gerar questões')
      setCurrentStep('config')
    } finally {
      setGenerating(false)
    }
  }

  async function saveExamWithQuestions(questions: Question[]) {
    setSaving(true)
    try {
      if (examId.startsWith('temp-')) {
        const res = await fetch('/api/exams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...examData,
            numberOfQuestions: questions.length,
            questions,
          }),
        })

        if (res.ok) {
          const data = await res.json()
          sessionStorage.removeItem('pendingExamData')
          router.push(`/exam/${data.examId}`)
        } else {
          let errorMessage = 'Erro ao salvar prova'
          try {
            const error = await res.json()
            if (error.requiresUpgrade) {
              router.push('/buy')
              return
            }
            errorMessage = error.error || errorMessage
          } catch (e) {
            errorMessage = `Erro ${res.status}: ${res.statusText || 'Falha ao salvar prova'}`
          }
          alert(`Erro: ${errorMessage}`)
          setCurrentStep('config')
        }
      } else {
        const res = await fetch(`/api/exams/${examId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions }),
        })

        if (res.ok) {
          router.push(`/exam/${examId}`)
        } else {
          let errorMessage = 'Erro ao atualizar prova'
          try {
            const error = await res.json()
            errorMessage = error.error || errorMessage
          } catch (e) {
            errorMessage = `Erro ${res.status}: ${res.statusText || 'Falha ao atualizar prova'}`
          }
          alert(`Erro: ${errorMessage}`)
          setCurrentStep('config')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar prova:', error)
      alert('Erro ao salvar prova')
      setCurrentStep('config')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoading variant="fullscreen" />
  }

  const totalDistribution = Object.values(alternativeTypeDistribution).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-2xl">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentStep === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              {/* Title Panel */}
              <GlassPanel delay={0}>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="glass-icon-badge flex items-center justify-center w-12 h-12 rounded-2xl">
                      <Sparkles className="w-6 h-6 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-lg font-bold text-foreground">
                        {examMode === 'ai' ? 'Gerar Questões por IA' : examMode === 'banco' ? 'Selecionar do Banco' : 'Prova Mista (IA + Banco)'}
                      </h1>
                      <p className="text-sm text-muted-foreground truncate">
                        {exam?.title}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassPanel>

              {/* === MODE: BANCO ONLY === */}
              {examMode === 'banco' && (
                <GlassPanel delay={0.05}>
                  <div className="p-6">
                    <BankFiltersPanel
                      bankFilters={bankFilters}
                      setBankFilters={setBankFilters}
                      periodos={periodos}
                      modulos={bankModulos}
                      topicos={bankTopicos}
                      subtopicos={bankSubtopicos}
                      anosDisponiveis={anosDisponiveis}
                      questionCount={bankQuestionCount}
                      setQuestionCount={setBankQuestionCount}
                      maxCount={500}
                      disabled={generating}
                      label="Questoes do Banco"
                    />
                  </div>
                </GlassPanel>
              )}

              {/* === MODE: MISTO === */}
              {examMode === 'misto' && (
                <>
                  {/* Total summary */}
                  <GlassPanel delay={0.05}>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <SectionHeader
                          icon={<Combine className="w-4.5 h-4.5 text-amber-400" />}
                          title="Distribuicao de Questoes"
                          subtitle="Configure a quantidade de cada tipo"
                        />
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">{bankQuestionCount + aiQuestionCount}</p>
                          <p className="text-xs text-muted-foreground">total</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="glass-inset rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-emerald-400" />
                            <Label className="text-xs font-medium">Banco de Questoes</Label>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={500}
                            value={bankQuestionCount}
                            onChange={(e) => setBankQuestionCount(Math.max(0, parseInt(e.target.value) || 0))}
                            disabled={generating}
                            className="glass-number-input w-full text-center text-lg font-bold"
                          />
                        </div>
                        <div className="glass-inset rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-violet-400" />
                            <Label className="text-xs font-medium">Geradas por IA</Label>
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={questionsLimit}
                            value={aiQuestionCount}
                            onChange={(e) => setAiQuestionCount(Math.max(0, Math.min(questionsLimit, parseInt(e.target.value) || 0)))}
                            disabled={generating}
                            className="glass-number-input w-full text-center text-lg font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </GlassPanel>

                  {/* Bank filters for mixed mode */}
                  {bankQuestionCount > 0 && (
                    <GlassPanel delay={0.1}>
                      <div className="p-6">
                        <BankFiltersPanel
                          bankFilters={bankFilters}
                          setBankFilters={setBankFilters}
                          periodos={periodos}
                          modulos={bankModulos}
                          topicos={bankTopicos}
                          subtopicos={bankSubtopicos}
                          anosDisponiveis={anosDisponiveis}
                          questionCount={bankQuestionCount}
                          setQuestionCount={setBankQuestionCount}
                          maxCount={500}
                          disabled={generating}
                          label="Filtros do Banco"
                        />
                      </div>
                    </GlassPanel>
                  )}
                </>
              )}

              {/* === AI CONFIG (shown for 'ai' and 'misto' when aiQuestionCount > 0) === */}
              {(examMode === 'ai' || (examMode === 'misto' && aiQuestionCount > 0)) && (<>

              {/* Themes */}
              <GlassPanel delay={0.05}>
                <div className="p-6 space-y-4">
                  <SectionHeader
                    icon={<BookOpen className="w-4.5 h-4.5 text-blue-400" />}
                    title="Temas das Questões"
                    subtitle="Obrigatório - separe os temas com ponto-e-vírgula"
                  />
                  <Textarea
                    placeholder="Ex: Revolução Francesa; Equações de segundo grau; Fotossíntese"
                    value={themes}
                    onChange={(e) => setThemes(e.target.value)}
                    disabled={generating}
                    rows={3}
                    className="glass-input resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadCronogramas()
                        setShowCronogramaModal(true)
                      }}
                      disabled={generating}
                      className="glass-chip text-xs gap-1.5"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Selecionar Temas (por curso, ENEM, UERJ...)
                    </Button>
                  </div>
                  {themes.trim() && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-1.5"
                    >
                      {themes.split(';').map((t, i) => t.trim()).filter(Boolean).map((theme, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        >
                          {theme}
                        </span>
                      ))}
                    </motion.div>
                  )}
                  {cronogramaThemeTags.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-wrap gap-1.5"
                    >
                      {cronogramaThemeTags.map((item, i) => (
                        <span
                          key={`crono-${i}`}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                            item.source === 'modelo'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.source === 'modelo' ? <Globe className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                          {item.tag}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = cronogramaThemeTags.filter((_, idx) => idx !== i)
                              setCronogramaThemeTags(newTags)
                            }}
                            className="ml-0.5 hover:text-red-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </motion.div>
                  )}
                </div>
              </GlassPanel>

              {/* Difficulty & Question Count */}
              <GlassPanel delay={0.1}>
                <div className="p-6 space-y-6">
                  {/* Difficulty */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SectionHeader
                        icon={<Gauge className="w-4.5 h-4.5 text-amber-400" />}
                        title="Dificuldade"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setRandomDifficulty(!randomDifficulty)}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                          transition-all duration-200
                          ${randomDifficulty
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                          }
                        `}
                      >
                        <Dices className="w-3.5 h-3.5" />
                        Aleatória
                      </motion.button>
                    </div>
                    <GlassSlider
                      value={difficulty}
                      onChange={setDifficulty}
                      min={0}
                      max={1}
                      step={0.1}
                      disabled={generating || randomDifficulty}
                      leftLabel="Fácil"
                      rightLabel="Difícil"
                      centerLabel={randomDifficulty ? 'Aleatória' : `${Math.round(difficulty * 100)}%`}
                    />
                  </div>

                  {examMode !== 'misto' && (
                  <>
                  <div className="border-t border-border/50" />

                  {/* Number of Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <SectionHeader
                        icon={<Hash className="w-4.5 h-4.5 text-emerald-400" />}
                        title="Número de Questões"
                      />
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                        máx. {questionsLimit}
                      </span>
                    </div>
                    <GlassSlider
                      value={numberOfQuestions}
                      onChange={(v) => setNumberOfQuestions(Math.round(v))}
                      min={1}
                      max={questionsLimit}
                      step={1}
                      disabled={generating}
                      leftLabel="1"
                      rightLabel={String(questionsLimit)}
                      centerLabel={String(numberOfQuestions)}
                    />
                  </div>
                  </>
                  )}
                </div>
              </GlassPanel>

              {/* Question Style */}
              <GlassPanel delay={0.15}>
                <div className="p-6 space-y-4">
                  <SectionHeader
                    icon={<MessageSquareText className="w-4.5 h-4.5 text-cyan-400" />}
                    title="Estilo da Questão"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <OptionChip
                      label="Contextualizada"
                      description="Com enunciado detalhado"
                      selected={style === 'contextualizada' && !mixedStyles}
                      onClick={() => { setStyle('contextualizada'); setMixedStyles(false) }}
                      disabled={generating}
                      icon={<BookOpen className="w-4 h-4" />}
                    />
                    <OptionChip
                      label="Rápida"
                      description="Direta ao ponto"
                      selected={style === 'rapida' && !mixedStyles}
                      onClick={() => { setStyle('rapida'); setMixedStyles(false) }}
                      disabled={generating}
                      icon={<Zap className="w-4 h-4" />}
                    />
                    <OptionChip
                      label="Mista"
                      description="Alternando ambos"
                      selected={mixedStyles}
                      onClick={() => setMixedStyles(true)}
                      disabled={generating}
                      icon={<Shuffle className="w-4 h-4" />}
                    />
                  </div>
                </div>
              </GlassPanel>

              {/* Question Context */}
              <GlassPanel delay={0.2}>
                <div className="p-6 space-y-4">
                  <SectionHeader
                    icon={<GraduationCap className="w-4.5 h-4.5 text-rose-400" />}
                    title="Contexto da Questão"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {([
                      { value: 'medicina' as const, label: 'Ciências Médicas' },
                      { value: 'psicologia' as const, label: 'Ciências Psicossociais' },
                      { value: 'biomedicina' as const, label: 'Ciências Biomédicas' },
                      { value: 'odontologia' as const, label: 'Ciências Odontológicas' },
                      { value: 'enem' as const, label: 'ENEM' },
                      { value: 'uerj' as const, label: 'UERJ' },
                      { value: 'outros' as const, label: 'Outros' },
                    ] as const).map((ctx) => (
                      <OptionChip
                        key={ctx.value}
                        label={ctx.label}
                        selected={questionContext === ctx.value}
                        onClick={() => setQuestionContext(ctx.value)}
                        disabled={generating}
                      />
                    ))}
                  </div>

                  {/* Custom context */}
                  <AnimatePresence>
                    {questionContext === 'outros' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {savedContexts.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Contextos Salvos</Label>
                            <select
                              value={selectedSavedContext}
                              onChange={(e) => setSelectedSavedContext(e.target.value)}
                              disabled={generating}
                              className="glass-select w-full"
                            >
                              <option value="">Selecione um contexto salvo...</option>
                              {savedContexts.map((context) => (
                                <option key={context.id} value={context.id}>
                                  {context.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            {savedContexts.length > 0 ? 'Ou descreva um contexto personalizado' : 'Descreva o contexto personalizado'}
                          </Label>
                          <Textarea
                            placeholder="Ex: Prova de Medicina, Concurso Público, etc."
                            value={customContext}
                            onChange={(e) => setCustomContext(e.target.value)}
                            disabled={generating}
                            rows={2}
                            className="glass-input resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassPanel>

              {/* Advanced Options (Collapsible) */}
              <GlassPanel delay={0.25}>
                <div className="p-6 space-y-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between group"
                  >
                    <SectionHeader
                      icon={<SlidersHorizontal className="w-4.5 h-4.5 text-purple-400" />}
                      title="Tipo de Alternativa"
                      subtitle="Configuração avançada"
                    />
                    <motion.div
                      animate={{ rotate: showAdvanced ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="space-y-2">
                          <OptionChip
                            label="Padrão (A, B, C...)"
                            selected={alternativeType === 'standard' && !mixedAlternativeTypes}
                            onClick={() => { setAlternativeType('standard'); setMixedAlternativeTypes(false) }}
                            disabled={generating}
                          />
                          <OptionChip
                            label="Afirmativas I-IV"
                            description="Assinale a que contém as afirmativas corretas"
                            selected={alternativeType === 'multiple-affirmative' && !mixedAlternativeTypes}
                            onClick={() => { setAlternativeType('multiple-affirmative'); setMixedAlternativeTypes(false) }}
                            disabled={generating}
                          />
                          <OptionChip
                            label="Comparação"
                            description="Relações quantitativas entre itens"
                            selected={alternativeType === 'comparison' && !mixedAlternativeTypes}
                            onClick={() => { setAlternativeType('comparison'); setMixedAlternativeTypes(false) }}
                            disabled={generating}
                          />
                          <OptionChip
                            label="Asserção/Razão"
                            description="Asserção PORQUE Razão"
                            selected={alternativeType === 'assertion-reason' && !mixedAlternativeTypes}
                            onClick={() => { setAlternativeType('assertion-reason'); setMixedAlternativeTypes(false) }}
                            disabled={generating}
                          />
                          <OptionChip
                            label="Mista (distribuição de tipos)"
                            description="Distribui diferentes tipos proporcionalmente"
                            selected={mixedAlternativeTypes}
                            onClick={() => setMixedAlternativeTypes(true)}
                            disabled={generating}
                            icon={<Layers className="w-4 h-4" />}
                          />
                        </div>

                        {/* Distribution percentages */}
                        <AnimatePresence>
                          {mixedAlternativeTypes && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="glass-inset rounded-xl p-4 space-y-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Distribuição de Tipos
                                </p>
                                {[
                                  { key: 'standard', label: 'Padrão (A, B, C...)' },
                                  { key: 'multiple-affirmative', label: 'Afirmativas I-IV' },
                                  { key: 'comparison', label: 'Comparação' },
                                  { key: 'assertion-reason', label: 'Asserção/Razão' },
                                ].map((item) => (
                                  <div key={item.key} className="flex items-center justify-between">
                                    <Label className="font-normal text-sm text-muted-foreground">{item.label}</Label>
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={alternativeTypeDistribution[item.key as keyof typeof alternativeTypeDistribution]}
                                        onChange={(e) => setAlternativeTypeDistribution({
                                          ...alternativeTypeDistribution,
                                          [item.key]: parseInt(e.target.value) || 0
                                        })}
                                        disabled={generating}
                                        className="glass-number-input w-14 text-center"
                                      />
                                      <span className="text-xs text-muted-foreground">%</span>
                                    </div>
                                  </div>
                                ))}
                                <div className={`text-xs font-medium pt-1 border-t border-border/50 ${
                                  totalDistribution === 100 ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  Total: {totalDistribution}%
                                  {totalDistribution !== 100 && ' (deve ser 100%)'}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassPanel>

              {/* Close AI config conditional */}
              </>)}

              {/* Action Buttons */}
              <GlassPanel delay={0.3}>
                <div className="p-6">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={generating}
                      className="flex-1 glass-button-outline"
                    >
                      Cancelar
                    </Button>
                    <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => {
                          if (examMode === 'banco') handleGenerateBankOnly()
                          else if (examMode === 'misto') handleGenerateMixed()
                          else handleGenerateQuestions()
                        }}
                        disabled={generating || (
                          examMode === 'ai' ? (!themes.trim() && cronogramaThemeTags.length === 0) :
                          examMode === 'banco' ? bankQuestionCount < 1 :
                          (bankQuestionCount + aiQuestionCount < 1) || (aiQuestionCount > 0 && !themes.trim() && cronogramaThemeTags.length === 0)
                        )}
                        className="w-full glass-button-primary gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {examMode === 'banco' ? 'Buscando...' : 'Gerando...'}
                          </>
                        ) : (
                          <>
                            {examMode === 'banco' ? <Database className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                            {examMode === 'banco' ? 'Montar Prova' : examMode === 'misto' ? 'Gerar Prova Mista' : 'Gerar Questões'}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          )}

          {currentStep === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassPanel>
                <div className="p-12 flex flex-col items-center justify-center">
                  <PageLoading
                    variant="default"
                    background="transparent"
                    message="Gerando questões... Isso pode levar alguns minutos"
                  />
                </div>
              </GlassPanel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cronograma Selection Modal */}
      <AnimatePresence>
        {showCronogramaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCronogramaModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass-panel w-full max-w-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="glass-icon-badge flex items-center justify-center w-9 h-9 rounded-xl">
                      <Calendar className="w-4.5 h-4.5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Selecionar Temas</h3>
                      <p className="text-xs text-muted-foreground">Escolha temas de cronogramas ou modelos globais</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCronogramaModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 mt-4 p-1.5 rounded-xl glass-inset">
                  <button
                    type="button"
                    onClick={() => { setCronogramaModalTab('modelos'); setCronogramaSelections(new Set()) }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      cronogramaModalTab === 'modelos'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    Modelos
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCronogramaModalTab('meus'); setCronogramaSelections(new Set()) }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      cronogramaModalTab === 'meus'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Meus Cronogramas
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                {cronogramaModalTab === 'meus' ? (
                  /* ─── TAB: Meus Cronogramas ─── */
                  loadingCronogramas ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : cronogramas.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Nenhum cronograma encontrado</p>
                      <p className="text-xs text-muted-foreground mt-1">Crie um cronograma primeiro em /cronogramas</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Cronograma</Label>
                        <select
                          value={selectedCronogramaId}
                          onChange={(e) => {
                            setSelectedCronogramaId(e.target.value)
                            setCronogramaSelections(new Set())
                          }}
                          className="glass-select w-full"
                        >
                          <option value="">Selecione um cronograma...</option>
                          {cronogramas.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.titulo} ({c.modelo})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedCronogramaId && (() => {
                        const selected = cronogramas.find(c => c._id === selectedCronogramaId)
                        if (!selected) return null
                        const tree = buildCronogramaTree(selected)
                        return renderTreeView(tree)
                      })()}
                    </>
                  )
                ) : (
                  /* ─── TAB: Modelos Globais ─── */
                  globalModels.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Nenhum modelo global disponível</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Modelo</Label>
                        <select
                          value={modeloTemplateId}
                          onChange={(e) => {
                            setModeloTemplateId(e.target.value)
                            setCronogramaSelections(new Set())
                          }}
                          className="glass-select w-full"
                        >
                          <option value="">Selecione um modelo...</option>
                          {globalModels.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.nome} — {t.descricao}
                            </option>
                          ))}
                        </select>
                      </div>

                      {modeloTemplateId && (() => {
                        const template = TEMPLATES[modeloTemplateId as keyof typeof TEMPLATES]
                        if (!template) return null

                        // Medicina: period selection + dynamic topics
                        if (template.modelo === 'medicina') {
                          const medTopicos = getMedicinaTopicos(medicinaPeriodo)
                          const tree = buildTemplateTree(medTopicos as TopicItem[])
                          return (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Período</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {([1, 2, 3, 4, 5] as MedicinaPeriodo[]).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        setMedicinaPeriodo(p)
                                        setCronogramaSelections(new Set())
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        medicinaPeriodo === p
                                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                          : 'glass-inset text-muted-foreground hover:text-foreground hover:bg-white/5'
                                      }`}
                                    >
                                      {p}º Período
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {renderTreeView(tree)}
                            </div>
                          )
                        }

                        // Psicologia: period selection (1-10) + dynamic topics
                        if (template.modelo === 'psicologia') {
                          const psiTopicos = getPsicologiaTopicos(psiPeriodo)
                          const tree = buildTemplateTree(psiTopicos as TopicItem[])
                          return (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Período</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as PsicologiaPeriodo[]).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        setPsiPeriodo(p)
                                        setCronogramaSelections(new Set())
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        psiPeriodo === p
                                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                          : 'glass-inset text-muted-foreground hover:text-foreground hover:bg-white/5'
                                      }`}
                                    >
                                      {p}º Período
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {renderTreeView(tree)}
                            </div>
                          )
                        }

                        // Biomedicina: period selection (1-7) + dynamic topics
                        if (template.modelo === 'biomedicina') {
                          const bioTopicos = getBiomedicinaTopicos(bioPeriodo)
                          const tree = buildTemplateTree(bioTopicos as TopicItem[])
                          return (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Período</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {([1, 2, 3, 4, 5, 6, 7] as BiomedicinaPeriodo[]).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        setBioPeriodo(p)
                                        setCronogramaSelections(new Set())
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        bioPeriodo === p
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'glass-inset text-muted-foreground hover:text-foreground hover:bg-white/5'
                                      }`}
                                    >
                                      {p}º Período
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {renderTreeView(tree)}
                            </div>
                          )
                        }

                        // Odontologia: period selection (1-10) + dynamic topics
                        if (template.modelo === 'odontologia') {
                          const odoTopicos = getOdontologiaTopicos(odoPeriodo)
                          const tree = buildTemplateTree(odoTopicos as TopicItem[])
                          return (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Período</Label>
                                <div className="grid grid-cols-5 gap-2">
                                  {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as OdontologiaPeriodo[]).map((p) => (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => {
                                        setOdoPeriodo(p)
                                        setCronogramaSelections(new Set())
                                      }}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                                        odoPeriodo === p
                                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                          : 'glass-inset text-muted-foreground hover:text-foreground hover:bg-white/5'
                                      }`}
                                    >
                                      {p}º Período
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {renderTreeView(tree)}
                            </div>
                          )
                        }

                        // Other models with static topics
                        if (template.topicos.length === 0) return (
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">Este modelo não possui tópicos predefinidos</p>
                          </div>
                        )
                        const tree = buildTemplateTree(template.topicos)
                        return renderTreeView(tree)
                      })()}
                    </>
                  )
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {cronogramaSelections.size} item(ns) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCronogramaModal(false)}
                    className="glass-button-outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    disabled={cronogramaSelections.size === 0}
                    onClick={() => {
                      const source = cronogramaModalTab === 'modelos' ? 'modelo' as const : 'cronograma' as const
                      const newTags = Array.from(cronogramaSelections)
                      setCronogramaThemeTags(prev => [
                        ...prev,
                        ...newTags
                          .filter(t => !prev.some(p => p.tag === t))
                          .map(t => ({ tag: t, source }))
                      ])
                      setShowCronogramaModal(false)
                      setCronogramaSelections(new Set())
                      setSelectedCronogramaId('')
                      setModeloTemplateId('medicina')
                    }}
                    className="glass-button-primary"
                  >
                    Adicionar Temas
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Glass Panel + Component Styles */}
      <style jsx global>{`
        /* ─── Glass Panel ─── */
        .glass-panel {
          border-radius: 20px;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.02) 100%
          );
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          overflow: hidden;
          position: relative;
        }

        /* Iridescent border on glass panels — thin & blurry */
        .glass-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 21px;
          z-index: -1;
          background: conic-gradient(
            from var(--iridescent-angle, 0deg),
            rgba(255, 120, 200, 0.25),
            rgba(120, 160, 255, 0.3),
            rgba(100, 255, 220, 0.25),
            rgba(255, 220, 100, 0.2),
            rgba(255, 130, 120, 0.25),
            rgba(200, 120, 255, 0.3),
            rgba(120, 220, 255, 0.25),
            rgba(255, 120, 200, 0.25)
          );
          animation: iridescent-rotate 4s linear infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 1px;
          filter: blur(1.5px);
          opacity: 0.4;
          transition: opacity 0.3s ease;
        }
        .glass-panel:hover::before {
          opacity: 0.75;
        }

        .dark .glass-panel {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.05) 0%,
            rgba(255, 255, 255, 0.015) 100%
          );
          border-color: rgba(255, 255, 255, 0.06);
          box-shadow:
            0 4px 24px rgba(0, 0, 0, 0.25),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .dark .glass-panel::before {
          background: conic-gradient(
            from var(--iridescent-angle, 0deg),
            rgba(255, 100, 180, 0.35),
            rgba(100, 140, 255, 0.4),
            rgba(80, 255, 200, 0.35),
            rgba(255, 200, 80, 0.3),
            rgba(255, 110, 100, 0.35),
            rgba(180, 100, 255, 0.4),
            rgba(100, 200, 255, 0.35),
            rgba(255, 100, 180, 0.35)
          );
          opacity: 0.5;
        }
        .dark .glass-panel:hover::before {
          opacity: 0.85;
        }

        /* ─── Glass Icon Badge ─── */
        .glass-icon-badge {
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .dark .glass-icon-badge {
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          border-color: rgba(255,255,255,0.06);
        }

        /* ─── Glass Chip (option selector) ─── */
        .glass-chip {
          border: 1px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.5);
          transition: all 0.2s ease;
          color: inherit;
        }
        .glass-chip-active {
          background: rgba(52, 211, 153, 0.1);
          border-color: rgba(52, 211, 153, 0.3);
        }
        .dark .glass-chip {
          border-color: rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
        }
        .dark .glass-chip-active {
          background: rgba(52, 211, 153, 0.12);
          border-color: rgba(52, 211, 153, 0.3);
        }

        /* ─── Glass Inset Area ─── */
        .glass-inset {
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .dark .glass-inset {
          background: rgba(0, 0, 0, 0.25);
          border-color: rgba(255,255,255,0.06);
        }

        /* ─── Glass Input ─── */
        .glass-input {
          background: rgba(255,255,255,0.8) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          border-radius: 12px !important;
          color: hsl(var(--foreground)) !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .glass-input:focus {
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1) !important;
        }
        .dark .glass-input {
          background: rgba(30, 30, 40, 0.8) !important;
          border-color: rgba(255,255,255,0.08) !important;
        }

        /* ─── Glass Select ─── */
        .glass-select {
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(0,0,0,0.12);
          color: hsl(var(--foreground));
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .glass-select:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .dark .glass-select {
          background: rgba(30, 30, 40, 0.9);
          border-color: rgba(255,255,255,0.1);
          color: hsl(var(--foreground));
          color-scheme: dark;
        }
        .glass-select option {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        /* ─── Glass Number Input ─── */
        .glass-number-input {
          padding: 4px 6px;
          border-radius: 8px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(0,0,0,0.1);
          color: hsl(var(--foreground));
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .glass-number-input:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .dark .glass-number-input {
          background: rgba(30, 30, 40, 0.8);
          border-color: rgba(255,255,255,0.1);
        }

        /* ─── Glass Slider ─── */
        .glass-slider-track {
          background: rgba(255,255,255,0.06);
        }
        .dark .glass-slider-track {
          background: rgba(255,255,255,0.04);
        }
        .glass-slider-fill {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.6), rgba(139, 92, 246, 0.8));
        }
        .glass-slider-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(139, 92, 246, 0.3);
          margin-left: -9px;
        }
        .dark .glass-slider-thumb {
          background: rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(139, 92, 246, 0.4);
        }

        /* ─── Glass Buttons ─── */
        .glass-button-primary {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(124, 58, 237, 0.85) 100%) !important;
          border: 1px solid rgba(139, 92, 246, 0.3) !important;
          color: white !important;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
          transition: all 0.2s ease !important;
        }
        .glass-button-primary:hover:not(:disabled) {
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.35) !important;
        }
        .glass-button-primary:disabled {
          opacity: 0.5 !important;
        }

        .glass-button-outline {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          transition: all 0.2s ease !important;
        }
        .glass-button-outline:hover:not(:disabled) {
          background: rgba(255,255,255,0.06) !important;
        }
        .dark .glass-button-outline {
          background: rgba(255,255,255,0.02) !important;
          border-color: rgba(255,255,255,0.06) !important;
        }

        /* Hide native number input spin buttons */
        .glass-number-input::-webkit-outer-spin-button,
        .glass-number-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .glass-number-input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
