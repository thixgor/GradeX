'use client'

import { useMemo } from 'react'
import { AlertTriangle, Download, Search, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarList,
  ColumnChart,
  EmptyState,
  ProgressBar,
  SERIES_COLORS,
  StatCard,
  formatDate,
  formatDuration,
  formatNumber,
  formatPct,
  formatRelative,
  formatScore,
} from './viz'
import { downloadCsv } from './csv'
import { ATTEMPT_STATUS_META, type ExamDetailPayload, type ExamsPayload } from './types'

const METHOD_LABELS: Record<string, string> = {
  normal: 'Normal',
  tri: 'TRI',
  discursive: 'Discursiva',
}

export interface ExamFilters {
  search: string
  method: string
  status: string
  sort: string
  page: number
}

/**
 * Aba "Provas": uma linha por prova com o ciclo completo (abriu → começou →
 * entregou → abandonou). Clicar abre o raio-X da prova.
 */
export function TabExams({
  data,
  filters,
  onFilters,
  onOpenExam,
  loading,
}: {
  data: ExamsPayload | null
  filters: ExamFilters
  onFilters: (next: Partial<ExamFilters>) => void
  onOpenExam: (examId: string) => void
  loading: boolean
}) {
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-4">
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Provas abertas" value={formatNumber(data.totais.aberturas)} hint="no período" accent="var(--viz-1)" />
          <StatCard label="Começaram" value={formatNumber(data.totais.iniciadas)} hint="responderam ao menos uma" accent="var(--viz-3)" />
          <StatCard label="Entregues" value={formatNumber(data.totais.entregues)} accent="var(--viz-good)" />
          <StatCard label="Saíram no meio" value={formatNumber(data.totais.abandonadas)} accent="var(--viz-critical)" />
          <StatCard
            label="Aguardando correção"
            value={formatNumber(data.totais.aguardandoCorrecao)}
            hint="discursivas e redações"
            accent="var(--viz-warning)"
          />
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar prova pelo título..."
            value={filters.search}
            onChange={e => onFilters({ search: e.target.value, page: 0 })}
            className="pl-9"
          />
        </div>
        <Select value={filters.method} onValueChange={v => onFilters({ method: v, page: 0 })}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Método" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os métodos</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="tri">TRI</SelectItem>
            <SelectItem value="discursive">Discursiva</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={v => onFilters({ status: v, page: 0 })}>
          <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="ativas">Com gente fazendo agora</SelectItem>
            <SelectItem value="correcao">Aguardando correção</SelectItem>
            <SelectItem value="treino">Provas de treino</SelectItem>
            <SelectItem value="ocultas">Ocultas</SelectItem>
            <SelectItem value="sem-atividade">Sem nenhuma atividade</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={v => onFilters({ sort: v, page: 0 })}>
          <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aberturas">Mais abertas</SelectItem>
            <SelectItem value="entregues">Mais entregues</SelectItem>
            <SelectItem value="abandono">Maior abandono</SelectItem>
            <SelectItem value="conclusao">Maior conclusão</SelectItem>
            <SelectItem value="media">Maior média</SelectItem>
            <SelectItem value="recentes">Mais recentes</SelectItem>
            <SelectItem value="titulo">Título A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={!data || data.provas.length === 0}
          onClick={() => data && downloadCsv(`provas-${data.range.key}`, data.provas as any)}
        >
          <Download className="mr-1.5 h-4 w-4" />
          CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Prova</th>
                <th className="px-2 py-2.5 text-center font-medium">Abriram</th>
                <th className="px-2 py-2.5 text-center font-medium">Começaram</th>
                <th className="px-2 py-2.5 text-center font-medium">Entregaram</th>
                <th className="px-2 py-2.5 text-center font-medium">Saíram no meio</th>
                <th className="px-2 py-2.5 text-center font-medium">Conclusão</th>
                <th className="px-2 py-2.5 text-center font-medium">Média</th>
                <th className="px-2 py-2.5 text-center font-medium">Último acesso</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!loading && data?.provas.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhuma prova encontrada</td></tr>
              )}
              {!loading &&
                data?.provas.map(exam => (
                  <tr
                    key={exam.examId}
                    onClick={() => onOpenExam(exam.examId)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="max-w-[320px] px-4 py-2.5">
                      <p className="truncate font-medium">{exam.titulo}</p>
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{METHOD_LABELS[exam.metodo] || exam.metodo}</span>
                        <span>· {exam.questoes} questões</span>
                        {exam.acontecendoAgora > 0 && (
                          <span className="font-medium" style={{ color: 'var(--viz-good)' }}>
                            · {exam.acontecendoAgora} fazendo agora
                          </span>
                        )}
                        {exam.aguardandoCorrecao > 0 && (
                          <span style={{ color: 'var(--viz-warning)' }}>· {exam.aguardandoCorrecao} p/ corrigir</span>
                        )}
                        {exam.oculta && <span className="rounded bg-muted px-1">oculta</span>}
                        {exam.treino && <span className="rounded bg-muted px-1">treino</span>}
                        {exam.proctoring && <span className="rounded bg-muted px-1">monitorada</span>}
                      </p>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{formatNumber(exam.aberturas)}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{formatNumber(exam.iniciadas)}</td>
                    <td className="px-2 py-2.5 text-center font-medium tabular-nums">
                      {formatNumber(exam.entregues || exam.submissoes)}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums" style={{ color: exam.abandonadas > 0 ? 'var(--viz-critical)' : undefined }}>
                      {formatNumber(exam.abandonadas)}
                      {exam.paradaMediaPct != null && exam.abandonadas > 0 && (
                        <span className="block text-[10px] text-muted-foreground">~{exam.paradaMediaPct}% feito</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {exam.taxaConclusao == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <div className="mx-auto w-20">
                          <span className="text-xs tabular-nums">{formatPct(exam.taxaConclusao, 0)}</span>
                          <ProgressBar
                            value={exam.taxaConclusao}
                            color={exam.taxaConclusao >= 70 ? 'var(--viz-good)' : exam.taxaConclusao >= 40 ? 'var(--viz-warning)' : 'var(--viz-critical)'}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{formatScore(exam.media)}</td>
                    <td className="px-2 py-2.5 text-center text-xs text-muted-foreground">
                      {formatRelative(exam.ultimoAcesso)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {data && data.total > data.limit && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground">
            <span>
              {data.page * data.limit + 1}–{Math.min((data.page + 1) * data.limit, data.total)} de {formatNumber(data.total)}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={filters.page === 0} onClick={() => onFilters({ page: filters.page - 1 })}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={filters.page >= totalPages - 1} onClick={() => onFilters({ page: filters.page + 1 })}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Raio-X de uma prova. Responde às três perguntas do painel: quem abriu, quem
 * acertou mais e quem saiu no meio — e mais uma que ninguém tinha como
 * responder antes: em qual questão a turma trava.
 */
export function ExamDetail({
  data,
  onOpenUser,
}: {
  data: ExamDetailPayload | null
  onOpenUser: (userId: string) => void
}) {
  const dificeis = useMemo(() => {
    if (!data) return []
    return data.porQuestao
      .filter(q => q.tipo === 'multiple-choice' && q.taxaAcerto != null)
      .slice()
      .sort((a, b) => (a.taxaAcerto ?? 100) - (b.taxaAcerto ?? 100))
      .slice(0, 10)
  }, [data])

  if (!data) return <EmptyState message="Carregando prova..." />

  const { prova, resumo, ranking, tentativas } = data
  const naoEntregaram = tentativas.filter(t => t.status !== 'submitted')

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Abriram" value={formatNumber(resumo.aberturas)} hint={`${resumo.soAbriram} não começaram`} accent="var(--viz-1)" />
        <StatCard label="Entregaram" value={formatNumber(resumo.entregues || resumo.submissoes)} hint={formatPct(resumo.taxaConclusao)} accent="var(--viz-good)" />
        <StatCard label="Saíram no meio" value={formatNumber(resumo.abandonadas)} hint={formatPct(resumo.taxaAbandono)} accent="var(--viz-critical)" />
        <StatCard
          label="Aproveitamento médio"
          value={resumo.aproveitamentoMedio != null ? formatPct(resumo.aproveitamentoMedio, 0) : '—'}
          hint={`nota média ${formatScore(resumo.media)}`}
          accent="var(--viz-3)"
        />
      </div>

      {prova.truncado && (
        <p className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--viz-warning)' }} />
          Esta prova tem mais registros do que o painel carrega de uma vez — as listas abaixo mostram os mais recentes.
        </p>
      )}

      <section>
        <header className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Quem acertou mais</h3>
            <p className="text-xs text-muted-foreground">
              Acertos recontados a partir do gabarito, sobre {prova.objetivas} questões objetivas
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => downloadCsv(`ranking-${prova.examId}`, ranking as any)}>
            <Download className="mr-1.5 h-4 w-4" />CSV
          </Button>
        </header>
        {ranking.length === 0 ? (
          <EmptyState message="Ninguém entregou esta prova ainda" />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Aluno</th>
                  <th className="px-3 py-2 text-center font-medium">Acertos</th>
                  <th className="px-3 py-2 text-center font-medium">Aproveitamento</th>
                  <th className="px-3 py-2 text-center font-medium">Nota</th>
                  <th className="px-3 py-2 text-center font-medium">Tempo</th>
                  <th className="px-3 py-2 text-center font-medium">Entregue</th>
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 100).map(r => (
                  <tr key={r.submissionId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{r.posicao}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => onOpenUser(r.userId)} className="font-medium hover:underline">
                        {r.nome}
                      </button>
                      {r.correcaoPendente && (
                        <span className="ml-1.5 text-[10px]" style={{ color: 'var(--viz-warning)' }}>
                          correção pendente
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold tabular-nums">
                      {r.acertos}
                      <span className="text-muted-foreground">/{r.totalObjetivas}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="mx-auto w-24">
                        <span className="text-xs tabular-nums">{formatPct(r.aproveitamento, 0)}</span>
                        <ProgressBar value={r.aproveitamento ?? 0} color={SERIES_COLORS[0]} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums">{formatScore(r.nota)}</td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatDuration(r.duracaoMs)}</td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatDate(r.enviadaEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <header className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Quem abriu e não entregou</h3>
            <p className="text-xs text-muted-foreground">Inclui quem só espiou a tela inicial e quem parou no meio</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={naoEntregaram.length === 0}
            onClick={() => downloadCsv(`abandonos-${prova.examId}`, naoEntregaram as any)}
          >
            <Download className="mr-1.5 h-4 w-4" />CSV
          </Button>
        </header>
        {naoEntregaram.length === 0 ? (
          <EmptyState
            message="Todo mundo que abriu, entregou"
            hint="Aberturas sem entrega passam a aparecer aqui conforme os alunos usam a plataforma."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Aluno</th>
                  <th className="px-3 py-2 text-center font-medium">Situação</th>
                  <th className="px-3 py-2 text-center font-medium">Parou na questão</th>
                  <th className="px-3 py-2 text-center font-medium">Progresso</th>
                  <th className="px-3 py-2 text-center font-medium">Tempo</th>
                  <th className="px-3 py-2 text-center font-medium">Último sinal</th>
                </tr>
              </thead>
              <tbody>
                {naoEntregaram.map(t => {
                  const meta = ATTEMPT_STATUS_META[t.status]
                  return (
                    <tr key={t.attemptId} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <button onClick={() => onOpenUser(t.userId)} className="font-medium hover:underline">
                          {t.nome}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {t.email} · {t.dispositivo}
                          {t.saiuDaAba > 0 && ` · saiu da aba ${t.saiuDaAba}×`}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                          title={meta.descricao}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center tabular-nums">
                        {t.comecouEm ? `${t.parouNaQuestao}${t.totalQuestoes ? `/${t.totalQuestoes}` : ''}` : '—'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="mx-auto w-24">
                          <span className="text-xs tabular-nums">{t.respondidas} respondidas</span>
                          <ProgressBar value={t.progresso} color={meta.color} />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatDuration(t.duracaoMs)}</td>
                      <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatRelative(t.ultimoSinal)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4">
        <section>
          <h3 className="text-sm font-semibold">Questões que mais derrubam</h3>
          <p className="mb-2 text-xs text-muted-foreground">Percentual de acerto entre quem respondeu</p>
          {dificeis.length === 0 ? (
            <EmptyState message="Sem respostas objetivas suficientes" />
          ) : (
            <BarList
              items={dificeis.map(q => ({
                label: `Q${q.numero} · ${q.enunciado || 'sem enunciado'}`,
                value: Math.round(q.taxaAcerto ?? 0),
                hint: `${q.acertos} acertos · ${q.erros} erros`,
                color: (q.taxaAcerto ?? 100) < 40 ? 'var(--viz-critical)' : 'var(--viz-warning)',
              }))}
              max={100}
              unit="%"
            />
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Onde a turma desiste</h3>
          <p className="mb-2 text-xs text-muted-foreground">Última questão alcançada por quem saiu no meio</p>
          {data.abandonoPorQuestao.every(q => q.abandonos === 0) ? (
            <EmptyState message="Nenhum abandono registrado nesta prova" />
          ) : (
            <ColumnChart
              data={data.abandonoPorQuestao.map(q => ({ label: `Q${q.questao}`, count: q.abandonos }))}
              color="var(--viz-critical)"
            />
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Distribuição das notas</h3>
        <ColumnChart data={data.distribuicaoNotas} color={SERIES_COLORS[0]} />
      </section>

      {resumo.downloads.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" />
            Downloads desta prova
          </h3>
          <BarList
            items={resumo.downloads.map(d => ({
              label: d.tipo,
              value: d.count,
              color: SERIES_COLORS[3],
            }))}
          />
        </section>
      )}
    </div>
  )
}
