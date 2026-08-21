'use client'

import { Radio, Users, Timer, Eye, MonitorSmartphone, PauseCircle } from 'lucide-react'
import {
  BarList,
  EmptyState,
  ProgressBar,
  StatCard,
  formatDuration,
  formatNumber,
  formatRelative,
} from './viz'
import { ATTEMPT_STATUS_META, type LivePayload } from './types'

/**
 * Aba "Ao vivo": quem está na plataforma agora e, principalmente, quem está
 * no meio de uma prova — com progresso, questão atual e há quanto tempo está
 * em silêncio.
 */
export function TabLive({
  data,
  onOpenUser,
  onOpenExam,
}: {
  data: LivePayload | null
  onOpenUser: (userId: string) => void
  onOpenExam: (examId: string) => void
}) {
  if (!data) return <EmptyState message="Carregando tempo real..." />

  const { resumo, provasAgora, online, feed } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Online agora"
          value={formatNumber(resumo.online)}
          hint={`${formatNumber(resumo.dispositivosOnline)} aparelhos`}
          icon={<Users className="h-4 w-4" />}
          accent="var(--viz-1)"
        />
        <StatCard
          label="Fazendo prova"
          value={formatNumber(resumo.fazendoProva)}
          hint={`${formatNumber(resumo.paradosNaProva)} parados`}
          icon={<Timer className="h-4 w-4" />}
          accent="var(--viz-good)"
        />
        <StatCard
          label="Abriram e não começaram"
          value={formatNumber(resumo.apenasAbriram)}
          hint="tentativas sem início"
          icon={<PauseCircle className="h-4 w-4" />}
          accent="var(--viz-serious)"
        />
        <StatCard
          label="Aberturas na última hora"
          value={formatNumber(resumo.aberturasUltimaHora)}
          hint="conteúdos abertos"
          icon={<Eye className="h-4 w-4" />}
          accent="var(--viz-2)"
        />
      </div>

      <section className="rounded-xl border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: 'var(--viz-good)' }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--viz-good)' }} />
            </span>
            <h3 className="text-sm font-semibold">Provas acontecendo agora</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Sinal a cada {data.heartbeatSegundos}s · atualizado {formatRelative(data.geradoEm)}
          </p>
        </header>

        {provasAgora.length === 0 ? (
          <div className="p-4">
            <EmptyState
              message="Ninguém está com uma prova aberta agora"
              hint="Assim que alguém abrir uma prova, ela aparece aqui com o progresso em tempo real."
            />
          </div>
        ) : (
          <div className="divide-y">
            {provasAgora.map(p => {
              const meta = ATTEMPT_STATUS_META[p.status]
              return (
                <div key={p.attemptId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onOpenUser(p.userId)}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {p.nome}
                      </button>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: `color-mix(in srgb, ${meta.color} 16%, transparent)`, color: meta.color }}
                        title={meta.descricao}
                      >
                        <Radio className="h-2.5 w-2.5" />
                        {meta.label}
                      </span>
                      {p.saiuDaAba > 0 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          saiu da aba {p.saiuDaAba}×
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onOpenExam(p.examId)}
                      className="truncate text-xs text-muted-foreground hover:underline"
                    >
                      {p.prova}
                    </button>
                  </div>

                  <div className="w-full sm:w-64">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        questão {p.questaoAtual}
                        {p.totalQuestoes > 0 && `/${p.totalQuestoes}`}
                      </span>
                      <span className="font-medium tabular-nums">
                        {p.respondidas} respondidas · {p.progresso}%
                      </span>
                    </div>
                    <ProgressBar value={p.progresso} color={meta.color} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDuration(p.duracaoMs)} de prova ·{' '}
                      {p.silencioSegundos != null && p.silencioSegundos > 60
                        ? `sem sinal há ${Math.round(p.silencioSegundos / 60)} min`
                        : 'ativo agora'}
                      {' · '}
                      {p.dispositivo}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Online nos últimos 10 minutos</h3>
          </header>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {online.length === 0 ? (
              <EmptyState message="Ninguém online no momento" />
            ) : (
              <BarList
                items={online.slice(0, 40).map(u => ({
                  label: u.nome + (u.admin ? ' (admin)' : ''),
                  value: u.aparelhos,
                  hint: `${u.dispositivo} · ${formatRelative(u.ultimaAtividade)}`,
                  color: u.admin ? 'var(--viz-5)' : 'var(--viz-1)',
                  onClick: () => onOpenUser(u.userId),
                }))}
                unit=" aparelho(s)"
              />
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <header className="flex items-center gap-2 border-b px-4 py-3">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Quem abriu o quê (última hora)</h3>
          </header>
          <div className="max-h-[420px] overflow-y-auto">
            {feed.length === 0 ? (
              <div className="p-4">
                <EmptyState message="Nenhuma abertura na última hora" />
              </div>
            ) : (
              <ul className="divide-y">
                {feed.map((e, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                    <span className="w-16 shrink-0 text-xs text-muted-foreground">{formatRelative(e.em)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{e.nome}</span>
                      <span className="text-muted-foreground"> · {e.rotulo} </span>
                      <span className="truncate">{e.titulo}</span>
                    </span>
                    <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:inline">
                      {e.area}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
