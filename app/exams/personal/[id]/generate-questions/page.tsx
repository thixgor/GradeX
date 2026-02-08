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
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CustomContext } from '@/lib/types'
import { PageLoading } from '@/components/page-loading'

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
  statement: string
  command: string
  alternatives: Array<{
    id: string
    letter: string
    text: string
    isCorrect: boolean
  }>
  explanation: string
}

interface Exam {
  _id: string
  title: string
  numberOfQuestions: number
  numberOfAlternatives: number
  questions: Question[]
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
  const [questionContext, setQuestionContext] = useState<'medicina-afya' | 'enem' | 'uerj' | 'outros'>('medicina-afya')

  const [savedContexts, setSavedContexts] = useState<CustomContext[]>([])
  const [selectedSavedContext, setSelectedSavedContext] = useState<string>('')
  const [customContext, setCustomContext] = useState('')

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
          setExamData(JSON.parse(data))
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

  async function handleGenerateQuestions() {
    if (!themes.trim()) {
      alert('Digite os temas para as questões (separados por ;)')
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
      if (questionContext === 'medicina-afya') {
        context = 'Medicina AFYA - Contextualização clínica e raciocínio aplicado'
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
          themes: themes.split(';').map(t => t.trim()).filter(t => t),
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
                      <h1 className="text-lg font-bold text-foreground">Gerar Questões por IA</h1>
                      <p className="text-sm text-muted-foreground truncate">
                        {exam?.title}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassPanel>

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
                      { value: 'medicina-afya' as const, label: 'Medicina AFYA' },
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
                        onClick={handleGenerateQuestions}
                        disabled={generating || !themes.trim()}
                        className="w-full glass-button-primary gap-2"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Gerar Questões
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
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          transition: all 0.2s ease;
        }
        .glass-chip-active {
          background: rgba(52, 211, 153, 0.08);
          border-color: rgba(52, 211, 153, 0.2);
        }
        .dark .glass-chip {
          border-color: rgba(255,255,255,0.04);
          background: rgba(255,255,255,0.015);
        }
        .dark .glass-chip-active {
          background: rgba(52, 211, 153, 0.1);
          border-color: rgba(52, 211, 153, 0.25);
        }

        /* ─── Glass Inset Area ─── */
        .glass-inset {
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255,255,255,0.04);
        }
        .dark .glass-inset {
          background: rgba(0, 0, 0, 0.2);
          border-color: rgba(255,255,255,0.04);
        }

        /* ─── Glass Input ─── */
        .glass-input {
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          border-radius: 12px !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        .glass-input:focus {
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1) !important;
        }
        .dark .glass-input {
          background: rgba(255,255,255,0.02) !important;
          border-color: rgba(255,255,255,0.06) !important;
        }

        /* ─── Glass Select ─── */
        .glass-select {
          padding: 8px 12px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .glass-select:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .dark .glass-select {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.06);
        }

        /* ─── Glass Number Input ─── */
        .glass-number-input {
          padding: 4px 6px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: inherit;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .glass-number-input:focus {
          border-color: rgba(139, 92, 246, 0.4);
        }
        .dark .glass-number-input {
          background: rgba(255,255,255,0.03);
          border-color: rgba(255,255,255,0.06);
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
