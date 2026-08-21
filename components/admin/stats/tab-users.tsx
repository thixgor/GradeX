'use client'

import { Download, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarList,
  EmptyState,
  ProgressBar,
  SERIES_COLORS,
  StatCard,
  formatDate,
  formatDuration,
  formatNumber,
  formatRelative,
  formatScore,
} from './viz'
import { downloadCsv } from './csv'
import { ATTEMPT_STATUS_META, type UserDetailPayload, type UsersPayload } from './types'

export interface UserFilters {
  search: string
  filter: string
  sort: string
  page: number
}

const PLAN_STYLES: Record<string, string> = {
  gratuito: 'bg-muted text-muted-foreground',
  trial: 'bg-purple-500/15 text-purple-600 dark:text-purple-300',
  plus: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  premium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  essential: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
}

/** Aba "Usuários": engajamento por aluno, com desistências e consumo de conteúdo. */
export function TabUsers({
  data,
  filters,
  onFilters,
  onOpenUser,
  loading,
}: {
  data: UsersPayload | null
  filters: UserFilters
  onFilters: (next: Partial<UserFilters>) => void
  onOpenUser: (userId: string) => void
  loading: boolean
}) {
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-4">
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Encontrados" value={formatNumber(data.total)} hint="com o filtro atual" accent="var(--viz-1)" />
          <StatCard label="Ativos no período" value={formatNumber(data.resumo.ativos)} hint="fizeram prova ou abriram conteúdo" accent="var(--viz-good)" />
          <StatCard label="Nunca fizeram prova" value={formatNumber(data.resumo.nuncaFizeram)} accent="var(--viz-serious)" />
          <StatCard label="Já desistiram de uma prova" value={formatNumber(data.resumo.comAbandono)} accent="var(--viz-critical)" />
          <StatCard label="Fazendo prova agora" value={formatNumber(data.resumo.fazendoAgora)} accent="var(--viz-2)" />
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={filters.search}
            onChange={e => onFilters({ search: e.target.value, page: 0 })}
            className="pl-9"
          />
        </div>
        <Select value={filters.filter} onValueChange={v => onFilters({ filter: v, page: 0 })}>
          <SelectTrigger className="w-full sm:w-[190px]"><SelectValue placeholder="Filtrar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativos">Ativos no período</SelectItem>
            <SelectItem value="inativos">Sumidos há 30+ dias</SelectItem>
            <SelectItem value="nunca-fez">Nunca fizeram prova</SelectItem>
            <SelectItem value="desistentes">Saíram no meio de prova</SelectItem>
            <SelectItem value="fazendo-agora">Fazendo prova agora</SelectItem>
            <SelectItem value="plus">Plus+</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="gratuito">Gratuito</SelectItem>
            <SelectItem value="novos">Cadastrados no período</SelectItem>
            <SelectItem value="banidos">Banidos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={v => onFilters({ sort: v, page: 0 })}>
          <SelectTrigger className="w-full sm:w-[170px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="provas">Mais provas</SelectItem>
            <SelectItem value="media">Maior média</SelectItem>
            <SelectItem value="abandono">Mais desistências</SelectItem>
            <SelectItem value="conteudo">Mais conteúdo aberto</SelectItem>
            <SelectItem value="downloads">Mais downloads</SelectItem>
            <SelectItem value="recentes">Vistos recentemente</SelectItem>
            <SelectItem value="cadastro">Cadastro mais novo</SelectItem>
            <SelectItem value="nome">Nome A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={!data || data.usuarios.length === 0}
          onClick={() => data && downloadCsv(`usuarios-${data.range.key}`, data.usuarios as any)}
        >
          <Download className="mr-1.5 h-4 w-4" />
          CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">Aluno</th>
                <th className="px-2 py-2.5 text-center font-medium">Provas</th>
                <th className="px-2 py-2.5 text-center font-medium">Média</th>
                <th className="px-2 py-2.5 text-center font-medium">Abriu</th>
                <th className="px-2 py-2.5 text-center font-medium">Desistiu</th>
                <th className="px-2 py-2.5 text-center font-medium">Conteúdo</th>
                <th className="px-2 py-2.5 text-center font-medium">Downloads</th>
                <th className="px-2 py-2.5 text-center font-medium">Visto</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!loading && data?.usuarios.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
              {!loading &&
                data?.usuarios.map(u => (
                  <tr
                    key={u.userId}
                    onClick={() => onOpenUser(u.userId)}
                    className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="max-w-[280px] px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{u.nome}</p>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${PLAN_STYLES[u.plano] || PLAN_STYLES.gratuito}`}>
                          {u.plano}
                        </span>
                        {u.banido && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'color-mix(in srgb, var(--viz-critical) 16%, transparent)', color: 'var(--viz-critical)' }}>
                            banido
                          </span>
                        )}
                        {u.fazendoAgora && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'color-mix(in srgb, var(--viz-good) 16%, transparent)', color: 'var(--viz-good)' }}>
                            em prova
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center font-medium tabular-nums">{u.provas}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{formatScore(u.media)}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-muted-foreground">{u.aberturasProva}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums" style={{ color: u.provasAbandonadas > 0 ? 'var(--viz-critical)' : undefined }}>
                      {u.provasAbandonadas}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{u.conteudosAbertos}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{u.downloads}</td>
                    <td className="px-2 py-2.5 text-center text-xs text-muted-foreground">{formatRelative(u.ultimaAtividade)}</td>
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

/** Ficha do aluno: histórico, tentativas, conteúdos abertos e aparelhos. */
export function UserDetail({
  data,
  onOpenExam,
}: {
  data: UserDetailPayload | null
  onOpenExam: (examId: string) => void
}) {
  if (!data) return <EmptyState message="Carregando aluno..." />

  const { usuario, resumo, historicoProvas, tentativas, conteudos } = data
  const abandonadas = tentativas.filter(t => t.status !== 'submitted')

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p>
          {usuario.email}
          {usuario.faculdade && ` · ${usuario.faculdade}`}
          {usuario.periodo && ` · ${usuario.periodo}º período`}
        </p>
        <p>
          Cadastro em {formatDate(usuario.cadastro)} · último login {formatRelative(usuario.ultimoLogin)} ·{' '}
          plano {usuario.plano}
          {usuario.banido && ' · conta banida'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Provas entregues" value={formatNumber(resumo.provasEntregues)} hint={`média ${formatScore(resumo.media)}`} accent="var(--viz-1)" />
        <StatCard label="Provas abertas" value={formatNumber(resumo.provasAbertas)} hint={`${resumo.provasAbandonadas} sem entregar`} accent="var(--viz-2)" />
        <StatCard label="Conteúdos abertos" value={formatNumber(resumo.conteudosAbertos)} hint={`${resumo.downloads} downloads`} accent="var(--viz-3)" />
        <StatCard label="Aparelhos ativos" value={formatNumber(resumo.dispositivosAtivos)} hint={resumo.fazendoAgora > 0 ? 'fazendo prova agora' : undefined} accent="var(--viz-4)" />
      </div>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Provas entregues</h3>
        {historicoProvas.length === 0 ? (
          <EmptyState message="Este aluno nunca entregou uma prova" />
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[540px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Prova</th>
                  <th className="px-3 py-2 text-center font-medium">Nota</th>
                  <th className="px-3 py-2 text-center font-medium">Respondidas</th>
                  <th className="px-3 py-2 text-center font-medium">Tempo</th>
                  <th className="px-3 py-2 text-center font-medium">Entregue</th>
                </tr>
              </thead>
              <tbody>
                {historicoProvas.map(p => (
                  <tr key={p.submissionId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <button onClick={() => onOpenExam(p.examId)} className="text-left font-medium hover:underline">
                        {p.titulo}
                      </button>
                      {p.correcaoPendente && (
                        <span className="ml-1.5 text-[10px]" style={{ color: 'var(--viz-warning)' }}>
                          aguardando correção
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-medium tabular-nums">{formatScore(p.nota)}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">
                      {p.questoesRespondidas}/{p.totalQuestoes}
                    </td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatDuration(p.duracaoMs)}</td>
                    <td className="px-3 py-2 text-center text-xs text-muted-foreground">{formatDate(p.enviadaEm)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Provas que abriu e não entregou</h3>
        {abandonadas.length === 0 ? (
          <EmptyState message="Nenhuma tentativa em aberto" />
        ) : (
          <div className="space-y-2">
            {abandonadas.map(t => {
              const meta = ATTEMPT_STATUS_META[t.status]
              return (
                <div key={t.attemptId} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button onClick={() => onOpenExam(t.examId)} className="text-sm font-medium hover:underline">
                      {t.titulo}
                    </button>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>
                        parou na questão {t.parouNaQuestao}
                        {t.totalQuestoes ? `/${t.totalQuestoes}` : ''} · {formatDuration(t.duracaoMs)}
                        {t.saiuDaAba > 0 && ` · saiu da aba ${t.saiuDaAba}×`}
                      </span>
                      <span className="tabular-nums">{t.progresso}%</span>
                    </div>
                    <ProgressBar value={t.progresso} color={meta.color} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Conteúdos que mais abre</h3>
        <BarList
          items={data.topConteudos.map(c => ({
            label: c.titulo,
            value: c.aberturas,
            hint: c.area,
            color: SERIES_COLORS[0],
          }))}
        />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Linha do tempo</h3>
        {conteudos.length === 0 ? (
          <EmptyState message="Sem aberturas registradas" />
        ) : (
          <ul className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
            {conteudos.map((c, i) => (
              <li key={i} className="flex items-center gap-2 px-2 py-1">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">{formatRelative(c.em)}</span>
                <span className="text-muted-foreground">{c.rotulo}</span>
                <span className="min-w-0 flex-1 truncate">{c.titulo}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Aparelhos</h3>
        {data.dispositivos.length === 0 ? (
          <EmptyState message="Nenhuma sessão registrada" />
        ) : (
          <ul className="space-y-1 text-sm">
            {data.dispositivos.map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className={d.revogado ? 'text-muted-foreground line-through' : ''}>{d.aparelho}</span>
                <span className="text-xs text-muted-foreground">
                  {d.ip} · {formatRelative(d.ultimaAtividade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
