'use client'

/**
 * Aba "Visão geral" — a resposta rápida a "como eu estou?".
 *
 * Só o essencial: quatro números, os limites do plano, um atalho para cada
 * lugar que a pessoa costuma procurar e as últimas provas. O aprofundamento
 * (gráficos, histórico completo) mora na aba Desempenho.
 */

import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  ShoppingBag,
  Target,
} from 'lucide-react'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { SubscriptionCard, type RecurringSubscription } from '@/components/profile/subscription-card'
import { AccountType } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { UserSubmission } from '@/components/profile/submissions-list'

export interface OverviewStats {
  questionsAnswered: number
  examsCompleted: number
  questionsAnsweredBank: number
  bankAccuracyRate: number
  streakDays: number
  longestStreak: number
}

const SHORTCUTS = [
  { href: '/banco-questoes', label: 'Banco de questões', icon: BookOpen },
  { href: '/cronogramas', label: 'Cronogramas', icon: CalendarDays },
  { href: '/flashcards', label: 'Flashcards', icon: Layers },
  { href: '/materiais', label: 'Materiais', icon: ShoppingBag },
]

export function OverviewTab({
  stats,
  accountType,
  isAdmin,
  userTotals,
  submissions,
  submissionsLoading,
  onGoToPerformance,
  recurring,
  onCancelSubscription,
  cancellingSubscription,
}: {
  stats: OverviewStats
  accountType: AccountType
  isAdmin: boolean
  userTotals: {
    totalCronogramasCreated: number
    totalFlashcardsCreated: number
    totalPersonalExamsCreated: number
  }
  submissions: UserSubmission[]
  submissionsLoading: boolean
  onGoToPerformance: () => void
  /** Cobrança recorrente ativa, quando existe. Ver subscription-card.tsx. */
  recurring: RecurringSubscription | null
  onCancelSubscription: () => void
  cancellingSubscription: boolean
}) {
  const router = useRouter()
  const recent = submissions.slice(0, 3)

  const tiles = [
    {
      icon: GraduationCap,
      label: 'Questões',
      value: stats.questionsAnswered.toLocaleString('pt-BR'),
      hint: `${stats.questionsAnsweredBank} no banco`,
    },
    {
      icon: FileText,
      label: 'Provas',
      value: stats.examsCompleted,
      hint: stats.examsCompleted === 1 ? 'prova entregue' : 'provas entregues',
    },
    {
      icon: Target,
      label: 'Aproveitamento',
      value: stats.questionsAnsweredBank > 0 ? `${stats.bankAccuracyRate}%` : '—',
      hint: stats.questionsAnsweredBank > 0 ? 'no banco de questões' : 'sem dados ainda',
    },
    {
      icon: Flame,
      label: 'Sequência',
      value: `${stats.streakDays}d`,
      hint: `recorde de ${stats.longestStreak} dias`,
    },
  ]

  return (
    <div className="space-y-8">
      {/*
        ── Sua assinatura ──────────────────────────────────────────────────
        Primeiro bloco da página, e não um item perdido em "Configurações":
        é a única cobrança da plataforma que se repete sozinha, então valor,
        ciclo, próxima cobrança e o botão de cancelar ficam onde a pessoa
        naturalmente procura quando quer conferir o que está pagando.
      */}
      {recurring && (
        <section>
          <h2 className="editorial-mark mb-3">Sua assinatura</h2>
          <SubscriptionCard
            recurring={recurring}
            onCancelar={onCancelSubscription}
            cancelando={cancellingSubscription}
          />
        </section>
      )}

      {/* ── Números do momento ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="editorial-mark mb-0">Seu momento</h2>
          <button
            type="button"
            onClick={onGoToPerformance}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Ver gráficos
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              <p className="font-heading text-2xl font-semibold leading-none text-foreground">{value}</p>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Atalhos ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="editorial-mark mb-3">Continuar estudando</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHORTCUTS.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              type="button"
              onClick={() => router.push(href)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/40 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Limites do plano ───────────────────────────────────────────────── */}
      <section>
        <h2 className="editorial-mark mb-3">Limites do plano</h2>
        <PlanLimitsCard
          accountType={accountType}
          isAdmin={isAdmin}
          cronogramasCreated={userTotals.totalCronogramasCreated}
          flashcardsCreated={userTotals.totalFlashcardsCreated}
          personalExamsCreated={userTotals.totalPersonalExamsCreated}
          showUpgradeButton
        />
      </section>

      {/* ── Últimas provas ─────────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="editorial-mark mb-0">Últimas provas</h2>
          {submissions.length > 3 && (
            <button
              type="button"
              onClick={onGoToPerformance}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {submissionsLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : recent.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-10 text-center shadow-sm">
            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma prova realizada ainda</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {recent.map((submission, i) => {
              const corrected =
                submission.correctionStatus === 'corrected' ||
                !submission.hasDiscursiveQuestions ||
                !!submission.isPracticeExam
              return (
                <div
                  key={submission._id}
                  className={cn('flex items-center gap-3 px-4 py-3', i !== recent.length - 1 && 'border-b border-border/50')}
                >
                  <div className={cn('h-2 w-2 shrink-0 rounded-full', corrected ? 'bg-green-500' : 'bg-yellow-500')} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{submission.examTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {corrected && submission.triScore != null && (
                    <span className="shrink-0 text-sm font-bold tabular-nums">{submission.triScore.toFixed(0)}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
