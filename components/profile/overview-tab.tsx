'use client'

/**
 * Aba "Visão geral" — a resposta rápida a "como eu estou?".
 *
 * Uma frente de estudo por cartão (banco, provas, flashcards, materiais,
 * anatomia e foco), cada uma com o número que importa nela e o caminho de
 * volta. Antes eram quatro números que só sabiam de provas e banco — e o do
 * banco estava errado. O aprofundamento (gráficos, histórico) mora em
 * Desempenho.
 */

import Link from 'next/link'
import { ArrowRight, BarChart3, ChevronRight, FileText, Timer } from 'lucide-react'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { SubscriptionCard, type RecurringSubscription } from '@/components/profile/subscription-card'
import { FRENTES, plural } from '@/components/profile/frentes-de-estudo'
import { formatarMinutos } from '@/lib/foco/ritmo-de-foco'
import type { ResumoDeEstudo } from '@/lib/estudo/resumo-de-estudo'
import { AccountType } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { UserSubmission } from '@/components/profile/submissions-list'

export type ResumoDoPerfil = Omit<ResumoDeEstudo, 'porDia' | 'notasDasProvas'>

/** O número principal e a linha de baixo de cada frente. */
export function numerosDaFrente(id: (typeof FRENTES)[number]['id'], r: ResumoDoPerfil): { valor: string; nota: string } {
  switch (id) {
    case 'banco':
      return {
        valor: plural(r.banco.questoes, 'questão', 'questões'),
        nota:
          r.banco.acuracia !== null
            ? `${r.banco.acuracia}% de acerto · ${plural(r.banco.resolucoes, 'resolução', 'resoluções')}`
            : r.banco.resolucoes > 0
              ? `${plural(r.banco.discursivas, 'discursiva', 'discursivas')}`
              : 'Nenhuma resolvida ainda',
      }
    case 'provas':
      return {
        valor: plural(r.provas.entregues, 'prova', 'provas'),
        nota:
          r.provas.entregues === 0
            ? 'Nenhuma entregue ainda'
            : `${plural(r.provas.respondidas, 'questão respondida', 'questões respondidas')}${
                r.provas.acuracia !== null ? ` · ${r.provas.acuracia}% de acerto` : ''
              }`,
      }
    case 'flashcards':
      return {
        valor: plural(r.flashcards.revisoes, 'revisão', 'revisões'),
        nota:
          r.flashcards.revisoes === 0
            ? 'Nenhuma carta revisada ainda'
            : `${r.flashcards.acuracia}% lembradas · ${plural(r.flashcards.dominadas, 'dominada', 'dominadas')}`,
      }
    case 'materiais':
      return {
        valor: plural(r.materiais.estudados, 'material', 'materiais'),
        nota: r.materiais.estudados === 0 ? 'Nenhum aberto ainda' : `${plural(r.materiais.aberturas, 'abertura', 'aberturas')}`,
      }
    case 'anatomia':
      return {
        valor: plural(r.anatomia.pranchas, 'prancha', 'pranchas'),
        nota:
          r.anatomia.quizzes > 0
            ? `${plural(r.anatomia.quizzes, 'quiz', 'quizzes')}${r.anatomia.acuracia !== null ? ` · ${r.anatomia.acuracia}% de acerto` : ''}`
            : r.anatomia.pranchas > 0
              ? 'Faça um quiz para medir o acerto'
              : 'Nada estudado ainda',
      }
  }
}

export function OverviewTab({
  resumo,
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
  resumo: ResumoDoPerfil | null
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
  const recent = submissions.slice(0, 3)

  return (
    <div className="space-y-9">
      {/*
        Sua assinatura: primeiro bloco quando existe. É a única cobrança que se
        repete sozinha — valor, ciclo e o botão de cancelar ficam onde a pessoa
        procura quando quer conferir o que paga.
      */}
      {recurring && (
        <section>
          <h2 className="ios-titulo-secao mb-3">Sua assinatura</h2>
          <SubscriptionCard recurring={recurring} onCancelar={onCancelSubscription} cancelando={cancellingSubscription} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="ios-titulo-secao">Seu estudo</h2>
          <button type="button" onClick={onGoToPerformance} className="ios-botao-suave ios-botao-p">
            <BarChart3 className="h-4 w-4" />
            Ver gráficos
          </button>
        </div>
        <div className="viz grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FRENTES.map(frente => {
            const numeros = resumo ? numerosDaFrente(frente.id, resumo) : null
            const Icone = frente.icone
            return (
              <Link key={frente.id} href={frente.href} className="perfil-frente ios-cartao ios-toque group">
                <span className="perfil-frente-icone" style={{ ['--cor' as string]: frente.cor }} aria-hidden="true">
                  <Icone className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium ios-rotulo-2">{frente.nome}</span>
                  {numeros ? (
                    <>
                      <span className="mt-0.5 block text-[19px] font-bold leading-tight tracking-tight tabular-nums">{numeros.valor}</span>
                      <span className="mt-0.5 block truncate text-[12.5px] ios-rotulo-3">{numeros.nota}</span>
                    </>
                  ) : (
                    <span className="ios-esqueleto mt-1.5 block h-5 w-28 rounded-md" />
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 ios-rotulo-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
          <button type="button" onClick={onGoToPerformance} className="perfil-frente ios-cartao ios-toque group text-left">
            <span className="perfil-frente-icone" style={{ ['--cor' as string]: 'var(--viz-foco)' }} aria-hidden="true">
              <Timer className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium ios-rotulo-2">Sessões de foco</span>
              {resumo ? (
                <>
                  <span className="mt-0.5 block text-[19px] font-bold leading-tight tracking-tight tabular-nums">
                    {formatarMinutos(resumo.foco.minutos)}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] ios-rotulo-3">
                    {resumo.foco.sessoes > 0
                      ? `${formatarMinutos(resumo.foco.minutosNaSemana)} nesta semana · ${plural(resumo.foco.sessoes, 'sessão', 'sessões')}`
                      : 'Use o botão Foco no topo para cronometrar'}
                  </span>
                </>
              ) : (
                <span className="ios-esqueleto mt-1.5 block h-5 w-28 rounded-md" />
              )}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 ios-rotulo-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="ios-titulo-secao">Últimas provas</h2>
          {submissions.length > 3 && (
            <button type="button" onClick={onGoToPerformance} className="inline-flex items-center gap-1 text-[14px] font-semibold ios-tinta">
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {submissionsLoading ? (
          <div className="ios-lista">
            {[0, 1].map(i => (
              <div key={i} className="ios-linha">
                <span className="ios-esqueleto h-4 w-48 rounded-md" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="ios-cartao flex flex-col items-center rounded-[22px] px-6 py-10 text-center">
            <FileText className="mb-3 h-9 w-9 ios-rotulo-3" />
            <p className="text-[15px] font-semibold">Nenhuma prova entregue ainda</p>
            <p className="mt-1 text-[13px] ios-rotulo-2">As provas que você fizer aparecem aqui, com a nota.</p>
            <Link href="/provas" className="ios-botao-suave ios-botao-p mt-4">
              Ver provas
            </Link>
          </div>
        ) : (
          <ul className="ios-lista">
            {recent.map(submission => {
              const corrected =
                submission.correctionStatus === 'corrected' || !submission.hasDiscursiveQuestions || !!submission.isPracticeExam
              return (
                <li key={submission._id}>
                  <div className="ios-linha" style={{ ['--ios-recuo' as string]: '36px' }}>
                    <span
                      className={cn('h-2 w-2 shrink-0 rounded-full', corrected ? 'bg-[var(--ios-tinta)]' : 'bg-amber-500')}
                      aria-label={corrected ? 'Corrigida' : 'Aguardando correção'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{submission.examTitle}</p>
                      <p className="text-[12.5px] ios-rotulo-2">
                        {new Date(submission.submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {!corrected && ' · aguardando correção'}
                      </p>
                    </div>
                    {/* A pontuação é a nota de quase toda prova; a TRI, quando existe, vem antes. */}
                    {corrected && (submission.triScore ?? submission.score) != null && (
                      <span className="shrink-0 text-right">
                        <span className="block text-[15px] font-bold tabular-nums">
                          {submission.triScore != null
                            ? submission.triScore.toFixed(0)
                            : (submission.score as number).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                        </span>
                        <span className="block text-[11px] ios-rotulo-3">{submission.triScore != null ? 'TRI' : 'pontos'}</span>
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="ios-titulo-secao mb-3">Limites do plano</h2>
        <PlanLimitsCard
          accountType={accountType}
          isAdmin={isAdmin}
          cronogramasCreated={userTotals.totalCronogramasCreated}
          flashcardsCreated={userTotals.totalFlashcardsCreated}
          personalExamsCreated={userTotals.totalPersonalExamsCreated}
          showUpgradeButton
        />
      </section>
    </div>
  )
}
