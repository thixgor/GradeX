'use client'

import { useMemo, useState } from 'react'
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  MapPin,
  Plus,
} from 'lucide-react'

import { ToggleSwitch } from '@/components/ui/toggle-switch'
import {
  DIAS_SEMANA_CURTO,
  MESES_NOME,
  diaDaSemana,
  diasEntre,
  faixaProximidade,
  formatarDiaLongo,
  somarDias,
  textoProximidade,
  type FaixaProximidade,
} from '@/lib/cronogramas/brasilia'
import { getTipoAvaliacao, type Avaliacao } from '@/lib/cronogramas/tipos'

/** Carga de estudo de um dia, vinda dos cronogramas ativos do aluno. */
export interface CargaDoDia {
  horas: number
  itens: number
  concluidos: number
}

interface CalendarioProps {
  avaliacoes: Avaliacao[]
  /** "AAAA-MM-DD" → carga de estudo daquele dia. */
  cargaPorDia?: Record<string, CargaDoDia>
  hoje: string
  /**
   * O opt-in do aluno. Ausente = calendário sem o interruptor, que é o caso do
   * painel: lá o admin está olhando a agenda da turma, e um botão de "quero
   * receber lembretes" no meio dela só confundiria de quem é a preferência.
   */
  lembretes?: {
    ativos: boolean
    onChange: (ativo: boolean) => void
    salvando?: boolean
  }
  /** Só o admin vê o atalho de criar avaliação direto do calendário. */
  onNovaAvaliacao?: (dia: string) => void
  onAvaliacaoClick?: (avaliacao: Avaliacao) => void
}

/**
 * Estilo de cada faixa de proximidade.
 *
 * A cor é uma leitura do calendário, não decoração: laranja da marca para o
 * que é hoje ou está em cima, âmbar para a janela de estudo produtiva, verde
 * para o que ainda está longe, cinza para o que já passou. O aluno aprende as
 * quatro em uma olhada e nunca mais precisa ler o rótulo.
 */
const ESTILO_FAIXA: Record<FaixaProximidade, { barra: string; chip: string; texto: string; anel: string }> = {
  hoje: {
    barra: 'bg-[#CE5929]',
    chip: 'bg-[#CE5929]/15 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/30',
    texto: 'text-[#CE5929] dark:text-[#F3A588]',
    anel: 'ring-[#CE5929]/40',
  },
  critica: {
    barra: 'bg-[#CE5929]',
    chip: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/25',
    texto: 'text-[#CE5929] dark:text-[#F3A588]',
    anel: 'ring-[#CE5929]/30',
  },
  proxima: {
    barra: 'bg-[#E2A43E]',
    chip: 'bg-[#E2A43E]/14 text-[#9A6D12] dark:text-[#E2A43E] border-[#E2A43E]/30',
    texto: 'text-[#9A6D12] dark:text-[#E2A43E]',
    anel: 'ring-[#E2A43E]/30',
  },
  distante: {
    barra: 'bg-[#468152]',
    chip: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25',
    texto: 'text-[#468152] dark:text-[#7DCEA0]',
    anel: 'ring-[#468152]/25',
  },
  passada: {
    barra: 'bg-muted-foreground/40',
    chip: 'bg-muted text-muted-foreground border-border',
    texto: 'text-muted-foreground',
    anel: 'ring-border',
  },
}

/** Os 42 dias (6 semanas) que a grade de um mês precisa, começando no domingo. */
function gradeDoMes(ano: number, mes: number): string[] {
  const primeiro = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const inicio = somarDias(primeiro, -diaDaSemana(primeiro))
  return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
}

export function Calendario({
  avaliacoes,
  cargaPorDia = {},
  hoje,
  lembretes,
  onNovaAvaliacao,
  onAvaliacaoClick,
}: CalendarioProps) {
  const [visao, setVisao] = useState<'mes' | 'agenda'>('mes')
  const [referencia, setReferencia] = useState(() => hoje.slice(0, 7))
  const [diaAberto, setDiaAberto] = useState<string | null>(null)

  const [ano, mes] = referencia.split('-').map(Number)

  const porDia = useMemo(() => {
    const mapa = new Map<string, Avaliacao[]>()
    for (const avaliacao of avaliacoes) {
      mapa.set(avaliacao.data, (mapa.get(avaliacao.data) ?? []).concat(avaliacao))
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99'))
    }
    return mapa
  }, [avaliacoes])

  const grade = useMemo(() => gradeDoMes(ano, mes - 1), [ano, mes])

  const futuras = useMemo(
    () => avaliacoes.filter(a => a.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)),
    [avaliacoes, hoje],
  )

  const proxima = futuras[0]
  const diaSelecionado = diaAberto ?? (porDia.has(hoje) ? hoje : null)

  function mover(passo: number) {
    // `Date.UTC` normaliza a virada de ano sozinho (mês -1 e mês 12).
    setReferencia(new Date(Date.UTC(ano, mes - 1 + passo, 1)).toISOString().slice(0, 7))
  }

  return (
    <section className="glass-page-card overflow-hidden rounded-2xl">
      {/* ── Cabeçalho: o que importa antes de qualquer grade ── */}
      <header className="border-b border-border/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <CalendarDays className="h-5 w-5 text-[#468152]" aria-hidden />
              Minhas avaliações
            </h2>
            {proxima ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Próxima:{' '}
                <strong className={ESTILO_FAIXA[faixaProximidade(diasEntre(hoje, proxima.data))].texto}>
                  {proxima.titulo}
                </strong>{' '}
                — {textoProximidade(diasEntre(hoje, proxima.data))}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Nenhuma avaliação marcada por aqui.</p>
            )}
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            {(['mes', 'agenda'] as const).map(modo => (
              <button
                key={modo}
                onClick={() => setVisao(modo)}
                aria-pressed={visao === modo}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  visao === modo ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {modo === 'mes' ? <CalendarDays className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                {modo === 'mes' ? 'Mês' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>

        {/* ── O opt-in mora no calendário, ao lado do que ele afeta ── */}
        {lembretes && (
          <div
            className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
              lembretes.ativos ? 'border-[#468152]/30 bg-[#468152]/8' : 'border-border/60 bg-muted/30'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  lembretes.ativos ? 'bg-[#468152]/15 text-[#468152] dark:text-[#7DCEA0]' : 'bg-muted text-muted-foreground'
                }`}
              >
                {lembretes.ativos ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Quero receber lembretes das minhas avaliações</p>
                <p className="text-xs text-muted-foreground">
                  {lembretes.ativos
                    ? 'Avisamos com antecedência, no ritmo que a coordenação definiu. Você desliga aqui a qualquer momento.'
                    : 'Ligue para ser avisado antes de cada prova desta seção e período.'}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={lembretes.ativos}
              onChange={lembretes.onChange}
              disabled={lembretes.salvando}
              className="shrink-0"
            />
          </div>
        )}
      </header>

      {visao === 'mes' ? (
        <>
          {/* ── Navegação do mês ── */}
          <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5">
            <button
              onClick={() => mover(-1)}
              aria-label="Mês anterior"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground sm:text-base">
                {MESES_NOME[mes - 1]} <span className="text-muted-foreground">{ano}</span>
              </h3>
              {referencia !== hoje.slice(0, 7) && (
                <button
                  onClick={() => setReferencia(hoje.slice(0, 7))}
                  className="rounded-md bg-muted/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Hoje
                </button>
              )}
            </div>

            <button
              onClick={() => mover(1)}
              aria-label="Próximo mês"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ── Grade ── */}
          <div className="px-2 pb-3 sm:px-4">
            <div className="grid grid-cols-7 gap-px">
              {DIAS_SEMANA_CURTO.map(nome => (
                <div key={nome} className="pb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className="sm:hidden">{nome.charAt(0)}</span>
                  <span className="hidden sm:inline">{nome}</span>
                </div>
              ))}

              {grade.map(dia => {
                const doMes = Number(dia.slice(5, 7)) === mes
                const eHoje = dia === hoje
                const doDia = porDia.get(dia) ?? []
                const carga = cargaPorDia[dia]
                const selecionado = dia === diaSelecionado

                return (
                  <button
                    key={dia}
                    onClick={() => setDiaAberto(selecionado ? null : dia)}
                    className={`relative flex min-h-[3.5rem] flex-col gap-1 rounded-lg p-1 text-left transition-all sm:min-h-[5rem] sm:p-1.5 ${
                      doMes ? 'hover:bg-muted/60' : 'opacity-40 hover:opacity-70'
                    } ${selecionado ? 'bg-muted/70 ring-2 ring-inset ring-[#468152]/40' : ''}`}
                    aria-label={`${formatarDiaLongo(dia)}${doDia.length > 0 ? `, ${doDia.length} avaliação(ões)` : ''}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        eHoje ? 'bg-[#468152] text-white' : 'text-foreground'
                      }`}
                    >
                      {Number(dia.slice(8, 10))}
                    </span>

                    <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                      {doDia.slice(0, 2).map(avaliacao => {
                        const estilo = ESTILO_FAIXA[faixaProximidade(diasEntre(hoje, avaliacao.data))]
                        return (
                          <span
                            key={avaliacao._id}
                            className={`flex items-center gap-1 overflow-hidden rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${estilo.chip} border`}
                          >
                            <span className={`h-2.5 w-0.5 shrink-0 rounded-full ${estilo.barra}`} aria-hidden />
                            <span className="truncate">
                              <span className="hidden sm:inline">{avaliacao.titulo}</span>
                              <span className="sm:hidden">{getTipoAvaliacao(avaliacao.tipo).emoji}</span>
                            </span>
                          </span>
                        )
                      })}
                      {doDia.length > 2 && (
                        <span className="px-1 text-[10px] font-medium text-muted-foreground">
                          +{doDia.length - 2}
                        </span>
                      )}
                    </div>

                    {carga && carga.horas > 0 && (
                      <span
                        className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-[#468152]/50"
                        title={`${carga.horas}h de estudo planejadas`}
                        aria-hidden
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {diaSelecionado && (
            <DetalheDoDia
              dia={diaSelecionado}
              hoje={hoje}
              avaliacoes={porDia.get(diaSelecionado) ?? []}
              carga={cargaPorDia[diaSelecionado]}
              onNovaAvaliacao={onNovaAvaliacao}
              onAvaliacaoClick={onAvaliacaoClick}
            />
          )}
        </>
      ) : (
        <Agenda
          avaliacoes={futuras}
          hoje={hoje}
          onAvaliacaoClick={onAvaliacaoClick}
        />
      )}
    </section>
  )
}

function DetalheDoDia({
  dia,
  hoje,
  avaliacoes,
  carga,
  onNovaAvaliacao,
  onAvaliacaoClick,
}: {
  dia: string
  hoje: string
  avaliacoes: Avaliacao[]
  carga?: CargaDoDia
  onNovaAvaliacao?: (dia: string) => void
  onAvaliacaoClick?: (avaliacao: Avaliacao) => void
}) {
  return (
    <div className="border-t border-border/40 bg-muted/20 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold capitalize text-foreground">{formatarDiaLongo(dia)}</h4>
        {onNovaAvaliacao && (
          <button
            onClick={() => onNovaAvaliacao(dia)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#468152]/12 px-2.5 py-1.5 text-xs font-semibold text-[#468152] transition-colors hover:bg-[#468152]/20 dark:text-[#7DCEA0]"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova avaliação
          </button>
        )}
      </div>

      {avaliacoes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {carga && carga.horas > 0
            ? `Sem avaliação neste dia — mas há ${carga.horas}h de estudo no seu cronograma.`
            : 'Nada marcado neste dia.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {avaliacoes.map(avaliacao => (
            <li key={avaliacao._id}>
              <CartaoAvaliacao avaliacao={avaliacao} hoje={hoje} onClick={onAvaliacaoClick} />
            </li>
          ))}
        </ul>
      )}

      {carga && carga.horas > 0 && avaliacoes.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {carga.horas}h de estudo planejadas · {carga.concluidos}/{carga.itens} concluídas
        </p>
      )}
    </div>
  )
}

function Agenda({
  avaliacoes,
  hoje,
  onAvaliacaoClick,
}: {
  avaliacoes: Avaliacao[]
  hoje: string
  onAvaliacaoClick?: (avaliacao: Avaliacao) => void
}) {
  if (avaliacoes.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-sm font-medium text-foreground">Nenhuma avaliação futura por aqui</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Quando a coordenação publicar as datas desta seção e período, elas aparecem aqui.
        </p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border/40">
      {avaliacoes.map(avaliacao => (
        <li key={avaliacao._id} className="p-3 sm:px-5">
          <CartaoAvaliacao avaliacao={avaliacao} hoje={hoje} onClick={onAvaliacaoClick} />
        </li>
      ))}
    </ul>
  )
}

export function CartaoAvaliacao({
  avaliacao,
  hoje,
  onClick,
}: {
  avaliacao: Avaliacao
  hoje: string
  onClick?: (avaliacao: Avaliacao) => void
}) {
  const dias = diasEntre(hoje, avaliacao.data)
  const estilo = ESTILO_FAIXA[faixaProximidade(dias)]
  const tipo = getTipoAvaliacao(avaliacao.tipo)
  const Elemento = onClick ? 'button' : 'div'

  return (
    <Elemento
      {...(onClick ? { onClick: () => onClick(avaliacao), type: 'button' as const } : {})}
      className={`flex w-full items-stretch gap-3 rounded-xl border border-border/50 bg-background/60 text-left transition-colors ${
        onClick ? 'hover:border-foreground/20 hover:bg-muted/40' : ''
      }`}
    >
      <span className={`w-1 shrink-0 rounded-l-xl ${estilo.barra}`} aria-hidden />

      <div className="min-w-0 flex-1 py-2.5 pr-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}>
            {tipo.rotulo}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">{avaliacao.titulo}</span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className={`font-semibold ${estilo.texto}`}>{textoProximidade(dias)}</span>
          <span className="capitalize">{formatarDiaLongo(avaliacao.data)}</span>
          {avaliacao.hora && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {avaliacao.hora}
            </span>
          )}
          {avaliacao.local && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {avaliacao.local}
            </span>
          )}
        </div>

        {avaliacao.conteudo && (
          <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{avaliacao.conteudo}</p>
        )}
      </div>
    </Elemento>
  )
}
