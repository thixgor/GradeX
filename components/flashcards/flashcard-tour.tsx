'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Brain,
  CalendarClock,
  Maximize2,
  Mic,
  Hand,
  Keyboard,
  EyeOff,
  MessageSquare,
  ZoomIn,
  ListOrdered,
  Download,
  Bookmark,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  Lightbulb,
} from 'lucide-react'
import { FlashcardCardView } from '@/components/flashcards/flashcard-card'
import { cn } from '@/lib/utils'
import type { FlashcardManualCard } from '@/lib/types'

/**
 * Tutorial do estudo — demonstração interativa com um card de exemplo REAL
 * (o mesmo `FlashcardCardView` do estudo pago) mais a lista completa do que o
 * deck faz. Fica visível também para quem ainda não comprou: é a única forma
 * de a pessoa entender o que está levando antes de pagar.
 *
 * Sem chamada de API e sem dependência do deck: os cards de exemplo vivem aqui.
 */

type DemoKind = 'standard' | 'hidden'

const NOW = new Date(0)

const DEMO_CARDS: Record<DemoKind, FlashcardManualCard> = {
  standard: {
    deckId: 'demo',
    index: 0,
    kind: 'standard',
    front: {
      text: 'Qual é o principal neurotransmissor da junção neuromuscular esquelética?',
    },
    back: {
      text: '**Acetilcolina (ACh)**, liberada pelo terminal axonal e captada por receptores nicotínicos da placa motora.',
    },
    comment:
      'A ACh é degradada pela acetilcolinesterase na fenda sináptica — por isso os inibidores dessa enzima (neostigmina, piridostigmina) potencializam a contração e são usados na miastenia gravis. Já o curare bloqueia o receptor nicotínico e causa paralisia flácida.',
    createdAt: NOW,
    updatedAt: NOW,
  },
  hidden: {
    deckId: 'demo',
    index: 1,
    kind: 'hidden_word',
    front: { text: '' },
    back: { text: '' },
    hiddenWord: {
      phrase:
        'O hormônio antidiurético (ADH) age nos ductos coletores inserindo aquaporina-2 e aumentando a reabsorção de água.',
      word: 'aquaporina-2',
      hint: 'É o canal de água inserido na membrana apical sob ação do ADH.',
    },
    comment:
      'Sem ADH, o ducto coletor fica impermeável à água e o resultado é urina diluída em grande volume — o quadro do diabetes insipidus.',
    createdAt: NOW,
    updatedAt: NOW,
  },
}

const RATING_DEMO = [
  {
    value: 'FACIL' as const,
    label: 'Fácil',
    color: 'from-emerald-500 to-emerald-600',
    speech: '"fácil" ou "suave"',
    explain: 'Você lembrou sem esforço. O card sai da frente e só volta depois de bastante tempo.',
  },
  {
    value: 'MEDIO' as const,
    label: 'Médio',
    color: 'from-amber-500 to-amber-600',
    speech: '"médio" ou "no ponto"',
    explain: 'Você lembrou, mas suou um pouco. O card volta em alguns dias para firmar.',
  },
  {
    value: 'DIFICIL' as const,
    label: 'Difícil',
    color: 'from-rose-500 to-orange-600',
    speech: '"difícil" ou "porrete"',
    explain: 'Travou ou errou. O card volta em minutos, ainda nesta sessão.',
  },
]

const FEATURES: { icon: React.ReactNode; title: string; text: string; highlight?: boolean }[] = [
  {
    icon: <MousePointerClick className="h-4 w-4" />,
    title: 'Vire o card',
    text: 'Toque no card (ou tecla espaço) para revelar a resposta.',
  },
  {
    icon: <Sparkles className="h-4 w-4" />,
    title: 'Avalie em 1 toque',
    text: 'Fácil, Médio ou Difícil — é isso que ensina o sistema quando te cobrar de novo. Cada botão já mostra quando o card volta.',
  },
  {
    icon: <Mic className="h-4 w-4" />,
    title: 'Modo voz',
    text: 'O microfone liga sozinho na resposta: fale “fácil”, “médio” ou “difícil” e o card já é marcado.',
    highlight: true,
  },
  {
    icon: <Brain className="h-4 w-4" />,
    title: 'Repetição espaçada',
    text: 'O deck calcula quanto a sua memória de cada card aguenta e cobra no dia certo: o que você erra volta em minutos, o que domina só daqui a semanas.',
  },
  {
    icon: <CalendarClock className="h-4 w-4" />,
    title: 'Agenda automática',
    text: 'Cada card ganha uma data de retorno. Você abre e já sabe o que revisar hoje.',
  },
  {
    icon: <BarChart3 className="h-4 w-4" />,
    title: 'Painel de desempenho',
    text: 'Vencidos hoje, novos, dominados e difíceis — card por card.',
  },
  {
    icon: <Bookmark className="h-4 w-4" />,
    title: 'Continue de onde parou',
    text: 'Fechou no meio? A sessão fica salva com a posição e as avaliações.',
  },
  {
    icon: <Maximize2 className="h-4 w-4" />,
    title: 'Tela cheia',
    text: 'O card ocupa a tela inteira e o resto da página some. Dá para já abrir assim.',
  },
  {
    icon: <EyeOff className="h-4 w-4" />,
    title: 'Palavra oculta',
    text: 'Cards que escondem o termo-chave dentro da frase, com dica opcional.',
  },
  {
    icon: <MessageSquare className="h-4 w-4" />,
    title: 'Resposta comentada',
    text: 'Além da resposta, a explicação de professor — por que é isso e não aquilo.',
  },
  {
    icon: <ZoomIn className="h-4 w-4" />,
    title: 'Imagens com zoom',
    text: 'Lâminas, ECGs e esquemas ampliam com pinça, scroll e duplo clique.',
  },
  {
    icon: <Hand className="h-4 w-4" />,
    title: 'Deslize no celular',
    text: 'Arraste ← → para trocar de card. Feito para estudar em pé, no ônibus.',
  },
  {
    icon: <ListOrdered className="h-4 w-4" />,
    title: 'Salte para qualquer card',
    text: 'O paginador mostra onde você está e marca os que já foram avaliados.',
  },
  {
    icon: <Keyboard className="h-4 w-4" />,
    title: 'Atalhos no PC',
    text: 'Espaço vira · ← → navegam · 1/2/3 avaliam · F entra em tela cheia.',
  },
  {
    icon: <Download className="h-4 w-4" />,
    title: 'PDF do deck',
    text: 'Quando o autor libera, dá para baixar o baralho em PDF com marca d’água.',
  },
]

export function FlashcardTour({
  variant = 'unlocked',
  onBuyClick,
}: {
  variant?: 'locked' | 'unlocked'
  onBuyClick?: () => void
}) {
  const locked = variant === 'locked'
  const [open, setOpen] = useState(locked)
  const [kind, setKind] = useState<DemoKind>('standard')
  const [flipped, setFlipped] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [pickedRating, setPickedRating] = useState<string | null>(null)

  const card = useMemo(() => DEMO_CARDS[kind], [kind])

  function switchKind(next: DemoKind) {
    if (next === kind) return
    setKind(next)
    setFlipped(false)
    setShowComment(false)
    setShowHint(false)
    setPickedRating(null)
  }

  return (
    <section
      className={cn(
        'mb-4 overflow-hidden rounded-3xl border shadow-[0_18px_70px_-35px_rgba(4,120,87,0.45)] backdrop-blur-2xl',
        'border-emerald-200/50 bg-white/70 dark:border-emerald-300/15 dark:bg-slate-950/55',
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-emerald-500/5 sm:px-5"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-lime-500 to-amber-400 text-white shadow-lg shadow-emerald-700/25">
          <Lightbulb className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-900 dark:text-foreground sm:text-base">
            {locked ? 'Veja como funciona antes de comprar' : 'Como funciona o estudo'}
          </span>
          <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
            Card de demonstração de verdade — vire, revele e teste todos os recursos.
          </span>
        </span>
        <span className="shrink-0 text-slate-400">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="tour-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-emerald-200/40 px-4 pb-5 pt-4 dark:border-emerald-300/10 sm:px-5">
              {/* Alternador entre os dois tipos de card que existem no produto */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <DemoTab active={kind === 'standard'} onClick={() => switchKind('standard')} icon={<Sparkles className="h-3.5 w-3.5" />}>
                  Card comum
                </DemoTab>
                <DemoTab active={kind === 'hidden'} onClick={() => switchKind('hidden')} icon={<EyeOff className="h-3.5 w-3.5" />}>
                  Palavra oculta
                </DemoTab>
                <span className="ml-auto hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:block">
                  Exemplo de demonstração
                </span>
              </div>

              {/* Instrução que acompanha o estado do card */}
              <p className="mb-3 flex items-center gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-3.5 py-2.5 text-xs font-medium leading-snug text-amber-900 dark:text-amber-100">
                <MousePointerClick className="h-4 w-4 shrink-0" />
                {!flipped
                  ? kind === 'hidden'
                    ? 'Toque em “Revelar palavra” para descobrir o termo escondido, ou vire o card para ver a resposta completa.'
                    : 'Toque no card (ou no botão “Ver resposta”) para virar.'
                  : 'Esta é a resposta. Abra a “Resposta comentada” para ver a explicação do professor — e avalie abaixo.'}
              </p>

              <FlashcardCardView
                key={kind}
                card={card}
                flipped={flipped}
                onFlip={() => setFlipped(f => !f)}
                showComment={showComment}
                onToggleComment={() => setShowComment(s => !s)}
                showHint={showHint}
                onToggleHint={() => setShowHint(s => !s)}
              />

              {/* Réplica fiel da barra de avaliação — aqui ela explica em vez de agendar */}
              <div className="mt-5">
                <p className="mb-1.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                  Como foi lembrar dessa resposta?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {RATING_DEMO.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setPickedRating(p => (p === r.value ? null : r.value))}
                      className={cn(
                        'flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-r px-2 py-2.5 text-sm font-bold leading-tight text-white shadow-md transition active:scale-95',
                        r.color,
                        pickedRating === r.value && 'ring-2 ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-950',
                      )}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] font-medium opacity-80">{r.speech}</span>
                    </button>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  {pickedRating && (
                    <motion.p
                      key={pickedRating}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="mt-2 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs leading-relaxed text-emerald-900 dark:text-emerald-100"
                    >
                      {RATING_DEMO.find(r => r.value === pickedRating)?.explain}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500 dark:text-slate-400">
                  <Mic className="h-3.5 w-3.5" />
                  No modo voz, basta falar a palavra — sem tirar a mão do caderno.
                </p>
              </div>

              {/* Tudo que o estudo faz */}
              <h3 className="mb-2 mt-6 text-sm font-bold text-slate-900 dark:text-foreground">
                Tudo que você tem no estudo
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map(f => (
                  <li
                    key={f.title}
                    className={cn(
                      'flex gap-2.5 rounded-2xl border px-3 py-2.5',
                      f.highlight
                        ? 'border-emerald-300/50 bg-emerald-500/10 dark:border-emerald-300/25'
                        : 'border-white/55 bg-white/50 dark:border-border dark:bg-card',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl',
                        f.highlight
                          ? 'bg-gradient-to-br from-emerald-600 to-lime-500 text-white'
                          : 'bg-slate-900/85 text-white dark:bg-white/10',
                      )}
                    >
                      {f.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-foreground">
                        {f.title}
                        {f.highlight && (
                          <span className="ml-1.5 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white">
                            novo
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {f.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {locked && onBuyClick && (
                <button
                  type="button"
                  onClick={onBuyClick}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition active:scale-[0.98]"
                >
                  <Sparkles className="h-4 w-4" />
                  Liberar este deck e estudar de verdade
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function DemoTab({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-100'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
