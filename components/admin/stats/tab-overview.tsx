'use client'

import {
  Activity,
  Award,
  BookOpen,
  Download,
  FileText,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  BarList,
  ColumnChart,
  EmptyState,
  Funnel,
  Heatmap,
  SERIES_COLORS,
  StatCard,
  TimeChart,
  formatNumber,
  formatPct,
  formatRelative,
  formatScore,
} from './viz'
import type { OverviewPayload } from './types'

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  tri: 'TRI',
  discursive: 'Discursiva',
}

const ACCOUNT_LABELS: Record<string, string> = {
  gratuito: 'Gratuito',
  trial: 'Trial ativo',
  plus: 'Plus+',
  banidos: 'Banidos',
}

/**
 * Aba "Visão geral": os números do período, o funil da prova e as
 * distribuições. O funil é a leitura principal — é o que separa "pouca gente
 * usou" de "muita gente tentou e desistiu".
 */
export function TabOverview({
  data,
  onOpenExam,
  onOpenUser,
}: {
  data: OverviewPayload | null
  onOpenExam: (examId: string) => void
  onOpenUser: (userId: string) => void
}) {
  if (!data) return <EmptyState message="Carregando visão geral..." />

  const { kpis, funil, distribuicoes } = data
  const totalContas =
    distribuicoes.contas.gratuito + distribuicoes.contas.trial + distribuicoes.contas.plus

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Usuários"
          value={formatNumber(kpis.usuarios.total)}
          hint={`+${formatNumber(kpis.usuarios.novos)} no período`}
          delta={kpis.usuarios.delta}
          icon={<Users className="h-4 w-4" />}
          accent="var(--viz-1)"
        />
        <StatCard
          label="Provas entregues"
          value={formatNumber(kpis.submissoes.periodo)}
          hint={`${formatNumber(kpis.submissoes.total)} no total`}
          delta={kpis.submissoes.delta}
          icon={<FileText className="h-4 w-4" />}
          accent="var(--viz-2)"
        />
        <StatCard
          label="Nota média"
          value={formatScore(kpis.nota.media)}
          hint={`${formatNumber(kpis.nota.avaliadas)} avaliadas`}
          delta={kpis.nota.delta}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="var(--viz-3)"
        />
        <StatCard
          label="Conteúdos abertos"
          value={formatNumber(kpis.aberturas.total)}
          hint="materiais, patologias e provas"
          delta={kpis.aberturas.delta}
          icon={<BookOpen className="h-4 w-4" />}
          accent="var(--viz-4)"
        />
        <StatCard
          label="Downloads"
          value={formatNumber(kpis.downloads.total)}
          hint="PDFs gerados"
          delta={kpis.downloads.delta}
          icon={<Download className="h-4 w-4" />}
          accent="var(--viz-5)"
        />
        <StatCard
          label="Taxa de abandono"
          value={formatPct(funil.taxaAbandono)}
          hint={`largam em ~${funil.progressoMedioAoAbandonar}% da prova`}
          invertDelta
          icon={<Percent className="h-4 w-4" />}
          accent="var(--viz-critical)"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Atividade no período</h3>
            <p className="text-xs text-muted-foreground">
              {data.range.label} · agrupado por {data.range.granularity === 'hour' ? 'hora' : data.range.granularity === 'month' ? 'mês' : 'dia'}
            </p>
          </header>
          <TimeChart
            data={data.series}
            series={[
              { key: 'submissoes', label: 'Provas entregues' },
              { key: 'tentativas', label: 'Provas abertas' },
              { key: 'aberturas', label: 'Conteúdos abertos' },
              { key: 'novosUsuarios', label: 'Novos usuários' },
            ]}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Do clique à entrega</h3>
            <p className="text-xs text-muted-foreground">
              Onde a turma some entre abrir a prova e enviá-la
            </p>
          </header>
          <Funnel
            steps={[
              { label: 'Abriram a prova', value: funil.aberturas },
              {
                label: 'Começaram a responder',
                value: funil.iniciadas,
                hint:
                  funil.desistiuAntesDeComecar > 0
                    ? `${formatNumber(funil.desistiuAntesDeComecar)} desistiram na tela inicial`
                    : undefined,
              },
              {
                label: 'Entregaram',
                value: funil.entregues,
                hint:
                  funil.abandonadas > 0
                    ? `${formatNumber(funil.abandonadas)} saíram no meio (média de ${funil.progressoMedioAoAbandonar}% respondido)`
                    : undefined,
              },
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Provas mais procuradas</h3>
            <p className="text-xs text-muted-foreground">Por aberturas no período · clique para o raio-X</p>
          </header>
          <BarList
            items={data.topProvas.map(p => ({
              label: p.titulo,
              value: p.aberturas,
              hint: `${p.entregues} entregues · ${formatPct(p.taxaConclusao)} conclusão`,
              color: SERIES_COLORS[0],
              onClick: () => onOpenExam(p.examId),
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Alunos mais ativos</h3>
            <p className="text-xs text-muted-foreground">Por provas entregues no período</p>
          </header>
          <BarList
            items={data.topUsuarios.map(u => ({
              label: u.nome,
              value: u.provas,
              hint: `média ${formatScore(u.media)} · melhor ${formatScore(u.melhor)}`,
              color: SERIES_COLORS[1],
              onClick: () => onOpenUser(u.userId),
            }))}
            unit=" provas"
          />
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3">
          <h3 className="text-sm font-semibold">Conteúdos mais abertos</h3>
          <p className="text-xs text-muted-foreground">
            Aberturas de provas, materiais, patologias e seções do Manual Clínico
          </p>
        </header>
        <BarList
          items={data.topConteudo.map(c => ({
            label: c.titulo,
            value: c.aberturas,
            hint: `${c.area} · ${formatNumber(c.usuarios)} pessoas · ${formatRelative(c.ultima)}`,
            color: SERIES_COLORS[2],
          }))}
        />
      </section>

      {/* Contas e métodos são as únicas listas que rodam a paleta categórica:
          a ordem das chaves é fixa na API, então cada categoria mantém sempre a
          mesma cor. Nos rankings a ordem muda com os dados — lá a cor seria do
          lugar no pódio, não da entidade, e por isso usam um matiz só. */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Tipos de conta</h3>
            <p className="text-xs text-muted-foreground">{formatNumber(totalContas)} contas de aluno</p>
          </header>
          <BarList
            items={Object.entries(distribuicoes.contas).map(([key, value], i) => ({
              label: ACCOUNT_LABELS[key] || key,
              value,
              hint: totalContas > 0 ? formatPct((value / totalContas) * 100, 0) : undefined,
              color: SERIES_COLORS[i % SERIES_COLORS.length],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Métodos de avaliação</h3>
            <p className="text-xs text-muted-foreground">{formatNumber(kpis.provas.total)} provas cadastradas</p>
          </header>
          <BarList
            items={Object.entries(distribuicoes.metodos).map(([key, value], i) => ({
              label: METHOD_LABELS[key] || key,
              value,
              color: SERIES_COLORS[i % SERIES_COLORS.length],
            }))}
          />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Aparelhos</h3>
            <p className="text-xs text-muted-foreground">De onde a plataforma é acessada</p>
          </header>
          <BarList
            items={distribuicoes.dispositivos.map(d => ({
              label: d.label,
              value: d.count,
              color: SERIES_COLORS[2],
            }))}
          />
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Distribuição das notas</h3>
            <p className="text-xs text-muted-foreground">Provas entregues no período, por faixa</p>
          </header>
          <ColumnChart data={distribuicoes.notas} color={SERIES_COLORS[0]} />
        </section>

        <section className="rounded-xl border bg-card p-4">
          <header className="mb-3">
            <h3 className="text-sm font-semibold">Quando estudam</h3>
            <p className="text-xs text-muted-foreground">Entregas por dia da semana e hora (UTC)</p>
          </header>
          <Heatmap matrix={data.heatmap} />
        </section>
      </div>

      <section className="rounded-xl border bg-card p-4">
        <header className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-semibold">Uso por área da plataforma</h3>
            <p className="text-xs text-muted-foreground">Aberturas e alcance de cada frente</p>
          </div>
        </header>
        <BarList
          items={distribuicoes.areas.map(a => ({
            label: a.label,
            value: a.count,
            hint: `${formatNumber(a.usuarios)} pessoas`,
            color: SERIES_COLORS[0],
          }))}
        />
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Award className="h-3.5 w-3.5" />
        As métricas de abertura, início e abandono valem a partir da ativação do rastreamento —
        provas entregues antes disso continuam contando em &quot;provas entregues&quot;, mas não no funil.
      </p>
    </div>
  )
}
