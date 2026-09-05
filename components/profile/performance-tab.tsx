'use client'

/**
 * Aba "Desempenho" — o painel de estudo do usuário.
 *
 * Todo número aqui vem de `/api/user/performance`, ou seja, do histórico real
 * de resoluções do banco e de provas submetidas. Nada é estimado no cliente.
 */

import { useEffect, useState } from 'react'
import { Flame, FileText, GraduationCap, Target } from 'lucide-react'
import {
  AccuracyBars,
  AccuracyMeter,
  ActivityColumns,
  ChartCard,
  ConsistencyHeatmap,
  Legend,
  ScaleLegend,
  ScoreTrend,
  StatTile,
  WeekdayColumns,
  fullDate,
} from '@/components/charts/chart-kit'
import { FocusSessionsProfile } from '@/components/focus-sessions-profile'
import { SubmissionsList, type UserSubmission } from '@/components/profile/submissions-list'

export interface PerformanceData {
  totals: {
    questionsAnswered: number
    questionsAnsweredExams: number
    examsCompleted: number
    bankAnswered: number
    bankCorrect: number
    bankWrong: number
    bankAccuracy: number
    streakDays: number
    longestStreak: number
    studiedToday: boolean
    activeDays: number
    windowDays: number
  }
  daily: Array<{ date: string; banco: number; provas: number }>
  heatmap: Array<{ date: string; total: number }>
  byWeekday: Array<{ weekday: number; total: number }>
  byDificuldade: Array<{ nivel: string; total: number; acertos: number; accuracy: number }>
  porPeriodo: Array<{ nome: string; total: number; acertos: number; accuracy: number }>
  examScores: Array<{ date: string; tri: number; examId: string }>
}

const DIFICULDADE_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function PerformanceTab({
  submissions,
  submissionsLoading,
  userName,
  accountType,
  isAdmin,
  onError,
}: {
  submissions: UserSubmission[]
  submissionsLoading: boolean
  userName: string
  /** Repassado à lista: é o cargo que decide se os PDFs saem. */
  accountType?: string | null
  isAdmin?: boolean
  onError: (message: string) => void
}) {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    ;(async () => {
      try {
        const res = await fetch('/api/user/performance')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch (error) {
        console.error('Erro ao carregar desempenho:', error)
        // Sem isso a aba ficaria em esqueleto para sempre quando a API cai.
        if (!cancelled) setFailed(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadToken])

  if (failed && !data) {
    return (
      <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
        <p className="mb-1 text-sm font-medium">Não deu pra carregar seu desempenho agora</p>
        <p className="mb-4 text-xs text-muted-foreground">Pode ser instabilidade momentânea.</p>
        <button
          type="button"
          onClick={() => setReloadToken((v) => v + 1)}
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
        >
          Tentar de novo
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
        <div className="h-[260px] animate-pulse rounded-xl border border-border bg-muted/40" />
        <div className="h-[260px] animate-pulse rounded-xl border border-border bg-muted/40" />
      </div>
    )
  }

  const t = data.totals
  const hasBank = t.bankAnswered > 0
  const hasActivity = data.daily.some((d) => d.banco + d.provas > 0)
  const spark = data.daily.slice(-12).map((d) => d.banco + d.provas)

  return (
    <div className="space-y-8">
      {/* ── Resumo ─────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="editorial-mark mb-3">Resumo</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile
            label="Questões"
            value={t.questionsAnswered.toLocaleString('pt-BR')}
            hint={`${t.bankAnswered} no banco · ${t.questionsAnsweredExams} em provas`}
            icon={<GraduationCap className="h-4 w-4" />}
            spark={spark.some((v) => v > 0) ? spark : undefined}
          />
          <StatTile
            label="Provas"
            value={t.examsCompleted}
            hint={t.examsCompleted === 0 ? 'Nenhuma prova ainda' : 'Provas entregues'}
            icon={<FileText className="h-4 w-4" />}
          />
          <StatTile
            label="Aproveitamento"
            value={hasBank ? `${t.bankAccuracy}%` : '—'}
            hint={hasBank ? `${t.bankCorrect} acertos de ${t.bankAnswered}` : 'Responda o banco pra ver'}
            icon={<Target className="h-4 w-4" />}
          />
          <StatTile
            label="Sequência"
            value={`${t.streakDays}d`}
            hint={
              t.studiedToday
                ? `Recorde: ${t.longestStreak} dias · estudou hoje`
                : `Recorde: ${t.longestStreak} dias`
            }
            icon={<Flame className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* ── Aproveitamento + constância ────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Aproveitamento no banco"
          caption="Fatia das questões objetivas que você acertou."
          table={{
            head: ['Resultado', 'Questões', 'Fatia'],
            rows: [
              ['Acertos', t.bankCorrect, `${t.bankAccuracy}%`],
              ['Erros', t.bankWrong, `${hasBank ? 100 - t.bankAccuracy : 0}%`],
              ['Total', t.bankAnswered, '100%'],
            ],
          }}
          empty={hasBank ? undefined : 'Responda questões no banco pra liberar esse indicador.'}
        >
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
            <AccuracyMeter percent={t.bankAccuracy} label="de acerto" />
            <dl className="grid w-full max-w-[200px] grid-cols-2 gap-3 sm:w-auto sm:grid-cols-1">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--viz-good)' }} />
                  Acertos
                </dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">{t.bankCorrect}</dd>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--viz-bad)' }} />
                  Erros
                </dt>
                <dd className="font-heading text-xl font-semibold tabular-nums">{t.bankWrong}</dd>
              </div>
            </dl>
          </div>
        </ChartCard>

        <ChartCard
          title="Constância"
          caption={`Você estudou em ${t.activeDays} dos últimos ${t.windowDays} dias.`}
          legend={
            <ScaleLegend
              from="Menos"
              to="Mais"
              steps={[
                'var(--viz-seq-0)',
                'var(--viz-seq-1)',
                'var(--viz-seq-2)',
                'var(--viz-seq-3)',
                'var(--viz-seq-4)',
                'var(--viz-seq-5)',
              ]}
            />
          }
          table={{
            head: ['Dia', 'Questões'],
            rows: data.heatmap
              .filter((d) => d.total > 0)
              .slice()
              .reverse()
              .map((d) => [fullDate(d.date), d.total]),
          }}
          empty={t.activeDays === 0 ? 'Sem atividade registrada nos últimos meses.' : undefined}
        >
          <ConsistencyHeatmap data={data.heatmap} />
        </ChartCard>
      </section>

      {/* ── Atividade diária ───────────────────────────────────────────────── */}
      <section>
        <ChartCard
          title="Atividade dos últimos 30 dias"
          caption="Questões respondidas por dia, separadas por origem."
          legend={
            <Legend
              items={[
                { label: 'Banco de questões', color: 'var(--viz-series-1)' },
                { label: 'Em provas', color: 'var(--viz-series-2)' },
              ]}
            />
          }
          table={{
            head: ['Dia', 'Banco', 'Em provas', 'Total'],
            rows: data.daily
              .filter((d) => d.banco + d.provas > 0)
              .slice()
              .reverse()
              .map((d) => [fullDate(d.date), d.banco, d.provas, d.banco + d.provas]),
          }}
          empty={hasActivity ? undefined : 'Nenhuma atividade nos últimos 30 dias. Bora recomeçar?'}
        >
          <ActivityColumns data={data.daily} />
        </ChartCard>
      </section>

      {/* ── Notas + rotina ─────────────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Evolução das notas"
          caption="Nota TRI de cada prova entregue, na ordem em que você fez."
          table={{
            head: ['Prova', 'Nota TRI'],
            rows: data.examScores
              .slice()
              .reverse()
              .map((s) => [new Date(s.date).toLocaleDateString('pt-BR'), s.tri]),
          }}
          empty={data.examScores.length === 0 ? 'Faça uma prova corrigida pra ver sua curva de notas.' : undefined}
        >
          {data.examScores.length > 0 && <ScoreTrend data={data.examScores} />}
        </ChartCard>

        <ChartCard
          title="Sua rotina de estudo"
          caption="Em que dias da semana você mais resolve questões."
          table={{
            head: ['Dia da semana', 'Questões'],
            rows: data.byWeekday.map((d) => [WEEKDAY_LABELS[d.weekday], d.total]),
          }}
          empty={data.byWeekday.every((d) => d.total === 0) ? 'Ainda não dá pra ver um padrão semanal.' : undefined}
        >
          <WeekdayColumns data={data.byWeekday} />
        </ChartCard>
      </section>

      {/* ── Recortes do banco ──────────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Aproveitamento por período"
          caption="Onde você vai bem e onde vale voltar a estudar."
          table={{
            head: ['Período', 'Acertos', 'Total', 'Aproveitamento'],
            rows: data.porPeriodo.map((p) => [p.nome, p.acertos, p.total, `${p.accuracy}%`]),
          }}
          empty={data.porPeriodo.length === 0 ? 'Responda questões objetivas no banco pra ver esse recorte.' : undefined}
        >
          <AccuracyBars
            data={data.porPeriodo.map((p) => ({
              label: p.nome,
              value: p.accuracy,
              total: p.total,
              acertos: p.acertos,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Aproveitamento por dificuldade"
          caption="A escala vai do fácil ao difícil — o tom escurece junto."
          table={{
            head: ['Dificuldade', 'Acertos', 'Total', 'Aproveitamento'],
            rows: data.byDificuldade.map((d) => [
              DIFICULDADE_LABELS[d.nivel] || d.nivel,
              d.acertos,
              d.total,
              `${d.accuracy}%`,
            ]),
          }}
          empty={
            data.byDificuldade.every((d) => d.total === 0)
              ? 'Sem questões objetivas respondidas ainda.'
              : undefined
          }
        >
          <AccuracyBars
            data={data.byDificuldade.map((d, i) => ({
              label: DIFICULDADE_LABELS[d.nivel] || d.nivel,
              value: d.accuracy,
              total: d.total,
              acertos: d.acertos,
              color: `var(--viz-ord-${i + 1})`,
            }))}
          />
        </ChartCard>
      </section>

      {/* ── Sessões de foco ────────────────────────────────────────────────── */}
      <section>
        <h2 className="editorial-mark mb-3">Sessões de foco</h2>
        <FocusSessionsProfile />
      </section>

      {/* ── Histórico de provas ────────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="editorial-mark mb-0">Minhas provas</h2>
          {submissions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {submissions.length} {submissions.length === 1 ? 'prova' : 'provas'}
            </span>
          )}
        </div>
        <SubmissionsList
          submissions={submissions}
          loading={submissionsLoading}
          userName={userName}
          accountType={accountType}
          isAdmin={isAdmin}
          onError={onError}
        />
      </section>
    </div>
  )
}
