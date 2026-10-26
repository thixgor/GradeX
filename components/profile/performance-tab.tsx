'use client'

/**
 * Aba "Desempenho" — o painel de estudo da pessoa.
 *
 * Todo número vem de `/api/user/performance`, que lê o histórico real de
 * todas as frentes (ver `lib/estudo/resumo-de-estudo.ts`): questões do banco,
 * questões de provas (com acerto, quando a nota já pode ser mostrada), cartas
 * revisadas, materiais abertos, pranchas e quizzes de anatomia e minutos de
 * foco. Nada é estimado no cliente.
 */

import { useEffect, useState } from 'react'
import {
  AccuracyBars,
  ChartCard,
  ConsistencyHeatmap,
  Legend,
  MultiStackedDayColumns,
  ScaleLegend,
  ScoreTrend,
  WeekdayColumns,
  fullDate,
} from '@/components/charts/chart-kit'
import { FocoNoPerfil } from '@/components/profile/foco-no-perfil'
import { FRENTES } from '@/components/profile/frentes-de-estudo'
import { SubmissionsList, type UserSubmission } from '@/components/profile/submissions-list'
import type { ResumoDoPerfil } from '@/components/profile/overview-tab'
import type { DiaDeEstudo } from '@/lib/estudo/resumo-de-estudo'
import { formatarMinutos } from '@/lib/foco/ritmo-de-foco'

export interface PerformanceData {
  resumo: ResumoDoPerfil
  windowDays: number
  activeDaysInWindow: number
  daily: Array<{ date: string } & DiaDeEstudo>
  heatmap: Array<{ date: string; total: number }>
  byWeekday: Array<{ weekday: number; total: number }>
  byDificuldade: Array<{ nivel: string; total: number; acertos: number; accuracy: number }>
  porPeriodo: Array<{ nome: string; total: number; acertos: number; accuracy: number }>
  examScores: Array<{ date: string; acerto: number; acertos: number; objetivas: number; tri: number | null; examId: string }>
}

const DIFICULDADE_LABELS: Record<string, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' }
const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const SEQ = ['var(--viz-seq-0)', 'var(--viz-seq-1)', 'var(--viz-seq-2)', 'var(--viz-seq-3)', 'var(--viz-seq-4)', 'var(--viz-seq-5)']

const somaDoDia = (d: DiaDeEstudo) => FRENTES.reduce((soma, f) => soma + (d[f.id] || 0), 0)

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
      <div className="ios-cartao flex flex-col items-center rounded-[22px] px-6 py-12 text-center">
        <p className="text-[15px] font-semibold">Não deu para carregar seu desempenho agora</p>
        <p className="mt-1 text-[13px] ios-rotulo-2">Pode ser instabilidade momentânea.</p>
        <button type="button" onClick={() => setReloadToken(v => v + 1)} className="ios-botao-suave ios-botao-p mt-4">
          Tentar de novo
        </button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="ios-esqueleto h-[92px] rounded-[22px]" />
        <div className="ios-esqueleto h-[300px] rounded-[22px]" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ios-esqueleto h-[240px] rounded-[22px]" />
          <div className="ios-esqueleto h-[240px] rounded-[22px]" />
        </div>
      </div>
    )
  }

  const r = data.resumo
  const acoes30 = data.daily.reduce((soma, d) => soma + somaDoDia(d), 0)
  const ativos30 = data.daily.filter(d => somaDoDia(d) > 0 || d.focoMin > 0).length
  const foco30 = data.daily.reduce((soma, d) => soma + d.focoMin, 0)
  const temAtividade = acoes30 > 0
  const temFoco = foco30 > 0

  // "Onde você acerta": uma barra por frente que tem acerto medido. Materiais
  // não têm "certo", então não entram; a cor segue a frente.
  const acertoPorFrente = [
    { id: 'banco', acertos: r.banco.acertos, total: r.banco.objetivas, sufixo: 'objetivas no banco' },
    { id: 'provas', acertos: r.provas.acertos, total: r.provas.objetivasRespondidas, sufixo: 'objetivas em provas' },
    { id: 'flashcards', acertos: r.flashcards.lembrei, total: r.flashcards.revisoes, sufixo: 'cartas lembradas' },
    { id: 'anatomia', acertos: r.anatomia.quizAcertos, total: r.anatomia.quizQuestoes, sufixo: 'questões de quiz' },
  ]
    .filter(linha => linha.total > 0)
    .map(linha => {
      const frente = FRENTES.find(f => f.id === linha.id)!
      return {
        label: frente.id === 'banco' ? 'Banco' : frente.nome,
        value: Math.round((linha.acertos / linha.total) * 100),
        total: linha.total,
        acertos: linha.acertos,
        color: frente.cor,
        sufixo: linha.sufixo,
      }
    })

  return (
    <div className="space-y-9">
      {/* ── Últimos 30 dias, de relance ───────────────────────────────────── */}
      <section>
        <h2 className="ios-titulo-secao mb-3">Últimos 30 dias</h2>
        <div className="ios-cartao ios-faixa perfil-placar rounded-[22px] py-3.5">
          <div>
            <span className="ios-faixa-rotulo">Ações</span>
            <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{acoes30.toLocaleString('pt-BR')}</span>
            <span className="ios-faixa-nota">de estudo</span>
          </div>
          <div>
            <span className="ios-faixa-rotulo">Dias ativos</span>
            <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{ativos30}</span>
            <span className="ios-faixa-nota">de 30</span>
          </div>
          <div>
            <span className="ios-faixa-rotulo">Acerto</span>
            <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{r.geral.acuracia !== null ? `${r.geral.acuracia}%` : '—'}</span>
            <span className="ios-faixa-nota">nas questões</span>
          </div>
          <div>
            <span className="ios-faixa-rotulo">Foco</span>
            <span className="ios-faixa-valor !text-[var(--ios-rotulo)]">{formatarMinutos(foco30)}</span>
            <span className="ios-faixa-nota">cronometrado</span>
          </div>
        </div>
      </section>

      {/* ── Atividade diária, todas as frentes ────────────────────────────── */}
      <ChartCard
        tom="ios"
        title="O que você estudou, dia a dia"
        caption="Cada questão, carta revisada, material aberto ou prancha de anatomia conta como uma ação."
        legend={<Legend items={FRENTES.map(f => ({ label: f.nome, color: f.cor }))} />}
        table={{
          head: ['Dia', ...FRENTES.map(f => (f.id === 'banco' ? 'Banco' : f.nome)), 'Total'],
          rows: data.daily
            .filter(d => somaDoDia(d) > 0)
            .slice()
            .reverse()
            .map(d => [fullDate(d.date), ...FRENTES.map(f => d[f.id]), somaDoDia(d)]),
        }}
        empty={temAtividade ? undefined : 'Nenhuma atividade nos últimos 30 dias. Bora recomeçar?'}
      >
        <MultiStackedDayColumns
          data={data.daily.map(d => ({ date: d.date, values: FRENTES.map(f => d[f.id]) }))}
          series={FRENTES.map(f => ({ label: f.serie, color: f.cor }))}
          unidade={['ação', 'ações']}
          ariaLabel="Ações de estudo por dia nos últimos 30 dias, por frente"
        />
      </ChartCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          tom="ios"
          title="Onde você acerta"
          caption="Acerto em cada frente que tem certo e errado, desde o começo."
          table={{
            head: ['Frente', 'Acertos', 'Total', 'Acerto'],
            rows: acertoPorFrente.map(l => [l.label, l.acertos, l.total, `${l.value}%`]),
          }}
          empty={acertoPorFrente.length === 0 ? 'Responda questões ou revise cartas para ver seu acerto.' : undefined}
        >
          <AccuracyBars data={acertoPorFrente} />
          <ul className="mt-3 space-y-0.5 text-[12px] ios-rotulo-3">
            {acertoPorFrente.map(l => (
              <li key={l.label}>
                {l.label}: {l.acertos.toLocaleString('pt-BR')} de {l.total.toLocaleString('pt-BR')} {l.sufixo}
              </li>
            ))}
            {r.provas.aguardandoTermino > 0 && (
              <li>
                {r.provas.aguardandoTermino === 1 ? '1 prova ainda em andamento' : `${r.provas.aguardandoTermino} provas ainda em andamento`}:
                o acerto entra quando ela terminar.
              </li>
            )}
          </ul>
        </ChartCard>

        <ChartCard
          tom="ios"
          title="Constância"
          caption={`Você estudou em ${data.activeDaysInWindow} dos últimos ${data.windowDays} dias.`}
          legend={<ScaleLegend from="Menos" to="Mais" steps={SEQ} />}
          table={{
            head: ['Dia', 'Ações'],
            rows: data.heatmap
              .filter(d => d.total > 0)
              .slice()
              .reverse()
              .map(d => [fullDate(d.date), d.total]),
          }}
          empty={data.activeDaysInWindow === 0 ? 'Sem atividade registrada nos últimos meses.' : undefined}
        >
          <ConsistencyHeatmap data={data.heatmap} unidade={['ação', 'ações']} />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          tom="ios"
          title="Minutos de foco"
          caption="Tempo cronometrado nas sessões de foco, por dia."
          table={{
            head: ['Dia', 'Minutos'],
            rows: data.daily
              .filter(d => d.focoMin > 0)
              .slice()
              .reverse()
              .map(d => [fullDate(d.date), d.focoMin]),
          }}
          empty={temFoco ? undefined : 'Nenhuma sessão de foco nos últimos 30 dias. Toque em "Foco" no topo da tela para começar.'}
        >
          <MultiStackedDayColumns
            data={data.daily.map(d => ({ date: d.date, values: [d.focoMin] }))}
            series={[{ label: 'min de foco', color: 'var(--viz-foco)' }]}
            ariaLabel="Minutos de foco por dia nos últimos 30 dias"
          />
        </ChartCard>

        <ChartCard
          tom="ios"
          title="Sua rotina"
          caption="Em que dias da semana você mais estuda."
          table={{
            head: ['Dia da semana', 'Ações'],
            rows: data.byWeekday.map(d => [WEEKDAY_LABELS[d.weekday], d.total]),
          }}
          empty={data.byWeekday.every(d => d.total === 0) ? 'Ainda não dá para ver um padrão semanal.' : undefined}
        >
          <WeekdayColumns data={data.byWeekday} unidade="ações" />
        </ChartCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          tom="ios"
          title="Evolução nas provas"
          caption="Acerto nas objetivas de cada prova, na ordem em que você fez."
          table={{
            head: ['Prova', 'Acertos', 'Acerto', ...(data.examScores.some(s => s.tri !== null) ? ['Nota TRI'] : [])],
            rows: data.examScores
              .slice()
              .reverse()
              .map(s => [
                new Date(s.date).toLocaleDateString('pt-BR'),
                `${s.acertos} de ${s.objetivas}`,
                `${s.acerto}%`,
                ...(data.examScores.some(n => n.tri !== null) ? [s.tri ?? '—'] : []),
              ]),
          }}
          empty={
            data.examScores.length === 0
              ? r.provas.aguardandoTermino > 0
                ? 'Sua curva aparece quando a prova que você entregou terminar para a turma.'
                : 'Entregue uma prova com questões objetivas para ver sua curva.'
              : undefined
          }
        >
          {data.examScores.length > 0 && (
            <ScoreTrend
              data={data.examScores.map(s => ({ date: s.date, valor: s.acerto }))}
              rotulo="de acerto"
              sufixo="%"
              teto={100}
              ariaLabel="Acerto nas provas ao longo do tempo"
            />
          )}
        </ChartCard>

        <ChartCard
          tom="ios"
          title="Banco por dificuldade"
          caption="A escala vai do fácil ao difícil — o tom escurece junto."
          table={{
            head: ['Dificuldade', 'Acertos', 'Total', 'Acerto'],
            rows: data.byDificuldade.map(d => [DIFICULDADE_LABELS[d.nivel] || d.nivel, d.acertos, d.total, `${d.accuracy}%`]),
          }}
          empty={data.byDificuldade.every(d => d.total === 0) ? 'Sem questões objetivas do banco ainda.' : undefined}
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

      {data.porPeriodo.length > 0 && (
        <ChartCard
          tom="ios"
          title="Banco por período"
          caption="Onde você vai bem e onde vale voltar a estudar."
          table={{
            head: ['Período', 'Acertos', 'Total', 'Acerto'],
            rows: data.porPeriodo.map(p => [p.nome, p.acertos, p.total, `${p.accuracy}%`]),
          }}
        >
          <AccuracyBars data={data.porPeriodo.map(p => ({ label: p.nome, value: p.accuracy, total: p.total, acertos: p.acertos }))} />
        </ChartCard>
      )}

      <section id="foco">
        <h2 className="ios-titulo-secao mb-3">Sessões de foco</h2>
        <FocoNoPerfil />
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="ios-titulo-secao">Minhas provas</h2>
          {submissions.length > 0 && (
            <span className="text-[13px] ios-rotulo-2">
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
