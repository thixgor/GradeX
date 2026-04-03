'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Scroll,
  LayoutGrid,
  MessageCircle,
  CheckCircle2,
  Shuffle,
  Timer,
  TimerOff,
  Zap,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Exam } from '@/lib/types'

interface PracticeExamConfigProps {
  exam: Exam
  onStart: (config: PracticeExamSettings) => void
  onBack: () => void
}

export interface PracticeExamSettings {
  navigationMode: 'paginated' | 'scroll'
  feedbackMode: 'immediate' | 'end'
  shuffleQuestions: boolean
  timeLimitMinutes: number | null
}

const TIME_OPTIONS = [
  { value: null, label: 'Sem limite', sublabel: 'Relaxado', icon: TimerOff },
  { value: 10, label: '10 min', sublabel: 'Rápido', icon: Zap },
  { value: 20, label: '20 min', sublabel: 'Curto', icon: Timer },
  { value: 30, label: '30 min', sublabel: 'Breve', icon: Timer },
  { value: 90, label: '1h30', sublabel: 'Médio', icon: Clock },
  { value: 120, label: '2 horas', sublabel: 'Padrão', icon: Clock },
  { value: 240, label: '4 horas', sublabel: 'Longo', icon: Clock },
]

export function PracticeExamConfig({ exam, onStart, onBack }: PracticeExamConfigProps) {
  const [navigationMode, setNavigationMode] = useState<'paginated' | 'scroll'>(
    exam.navigationMode || 'paginated'
  )
  const [feedbackMode, setFeedbackMode] = useState<'immediate' | 'end'>('immediate')
  const [shuffleQuestions, setShuffleQuestions] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)

  const handleStart = () => {
    onStart({
      navigationMode,
      feedbackMode,
      shuffleQuestions,
      timeLimitMinutes,
    })
  }

  const questionCount = exam.questions?.length || 0
  const hasDiscursive = exam.questions?.some(q => q.type === 'discursive')
  const hasMultipleChoice = exam.questions?.some(q => q.type === 'multiple-choice')

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background com efeito */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#468152]/5 via-background to-[#E2A43E]/5" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#468152]/10 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#E2A43E]/10 via-transparent to-transparent" />

      <div className="relative z-10 w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header da prova */}
        <div className="text-center space-y-3">
          <Badge className="bg-gradient-to-r from-[#468152] to-[#E2A43E] text-white border-0 px-4 py-1.5 text-sm">
            Prova Prática
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
          {exam.description && (
            <p className="text-muted-foreground max-w-lg mx-auto">{exam.description}</p>
          )}
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span>{questionCount} {questionCount === 1 ? 'questão' : 'questões'}</span>
            {hasMultipleChoice && <Badge variant="outline" className="text-xs">Objetivas</Badge>}
            {hasDiscursive && <Badge variant="outline" className="text-xs">Discursivas</Badge>}
          </div>
        </div>

        {/* Card principal - glassmorphism */}
        <Card className="backdrop-blur-xl bg-background/60 border-white/20 dark:border-white/10 shadow-2xl shadow-black/5">
          <CardContent className="p-6 space-y-6">
            {/* Modo de navegação */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                Navegação
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setNavigationMode('paginated')}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                    navigationMode === 'paginated'
                      ? "border-[#468152] bg-[#468152]/5 shadow-lg shadow-[#468152]/10"
                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      navigationMode === 'paginated' ? "bg-[#468152]/10 text-[#468152]" : "bg-muted text-muted-foreground"
                    )}>
                      <LayoutGrid className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Paginada</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Uma questão por vez</div>
                    </div>
                  </div>
                  {navigationMode === 'paginated' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-[#468152]" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setNavigationMode('scroll')}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left group",
                    navigationMode === 'scroll'
                      ? "border-[#468152] bg-[#468152]/5 shadow-lg shadow-[#468152]/10"
                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      navigationMode === 'scroll' ? "bg-[#468152]/10 text-[#468152]" : "bg-muted text-muted-foreground"
                    )}>
                      <Scroll className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Scroll</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Todas em sequência</div>
                    </div>
                  </div>
                  {navigationMode === 'scroll' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-[#468152]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Modo de feedback */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                Feedback
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFeedbackMode('immediate')}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    feedbackMode === 'immediate'
                      ? "border-[#E2A43E] bg-[#E2A43E]/5 shadow-lg shadow-[#E2A43E]/10"
                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackMode === 'immediate' ? "bg-[#E2A43E]/10 text-[#E2A43E]" : "bg-muted text-muted-foreground"
                    )}>
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Imediato</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Após cada questão</div>
                    </div>
                  </div>
                  {feedbackMode === 'immediate' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-[#E2A43E]" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setFeedbackMode('end')}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    feedbackMode === 'end'
                      ? "border-[#E2A43E] bg-[#E2A43E]/5 shadow-lg shadow-[#E2A43E]/10"
                      : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      feedbackMode === 'end' ? "bg-[#E2A43E]/10 text-[#E2A43E]" : "bg-muted text-muted-foreground"
                    )}>
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">No Final</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Gabarito ao terminar</div>
                    </div>
                  </div>
                  {feedbackMode === 'end' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-[#E2A43E]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Embaralhar questões */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                Ordem das Questões
              </label>
              <button
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                className={cn(
                  "w-full relative p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3",
                  shuffleQuestions
                    ? "border-violet-500 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                    : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  shuffleQuestions ? "bg-violet-500/10 text-violet-500" : "bg-muted text-muted-foreground"
                )}>
                  <Shuffle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">Embaralhar Questões</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {shuffleQuestions ? 'Questões em ordem aleatória' : 'Questões na ordem original'}
                  </div>
                </div>
                <div className={cn(
                  "w-12 h-7 rounded-full transition-all duration-300 flex items-center px-1",
                  shuffleQuestions ? "bg-violet-500" : "bg-muted"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300",
                    shuffleQuestions ? "translate-x-5" : "translate-x-0"
                  )} />
                </div>
              </button>
            </div>

            {/* Limite de tempo */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                Limite de Tempo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TIME_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = timeLimitMinutes === opt.value
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setTimeLimitMinutes(opt.value)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all duration-200 text-center",
                        isSelected
                          ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                          : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4 mx-auto mb-1",
                        isSelected ? "text-blue-500" : "text-muted-foreground"
                      )} />
                      <div className={cn(
                        "font-semibold text-xs",
                        isSelected && "text-blue-500"
                      )}>
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{opt.sublabel}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 shadow-lg shadow-[#468152]/20 transition-all duration-200 hover:shadow-xl hover:shadow-[#468152]/30 hover:scale-[1.01]"
          >
            <Play className="h-5 w-5 mr-2" />
            Iniciar Prova
          </Button>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground"
          >
            Voltar
          </Button>
        </div>
      </div>
    </div>
  )
}
