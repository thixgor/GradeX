'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  X,
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
} from '@/lib/cronogramas/brasilia'
import { ESTILO_FAIXA, getTipoAvaliacao, type Avaliacao } from '@/lib/cronogramas/tipos'
import type { CargaDoDia } from '@/lib/cronogramas/progresso'

export type { CargaDoDia }

interface CalendarioProps {
  avaliacoes: Avaliacao[]
  /** "AAAA-MM-DD" → carga de estudo daquele dia. */
  cargaPorDia?: Record<string, CargaDoDia>
  hoje: string
  /**
   * Pedido externo para abrir um dia (a barra de foco da página manda o dia da
   * próxima avaliação). O `token` existe para o mesmo dia poder ser pedido duas
   * vezes seguidas: sem ele, clicar de novo no mesmo cartão não faria nada.
   */
  foco?: { dia: string; token: number } | null
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

/** Os 42 dias (6 semanas) que a grade de um mês precisa, começando no domingo. */
function gradeDoMes(ano: number, mes: number): string[] {
  const primeiro = `${ano}-${String(mes + 1).padStart(2, '0')}-01`
  const inicio = somarDias(primeiro, -diaDaSemana(primeiro))
  return Array.from({ length: 42 }, (_, i) => somarDias(inicio, i))
}

/** Seis horas num dia já é um dia pesado — é a régua da barrinha de carga. */
const HORAS_CHEIAS = 6

/**
 * O mesmo dia do mês, noutro mês, sem estourar: 31 de janeiro + 1 mês é 28 (ou
 * 29) de fevereiro, não "31 de fevereiro". Importa porque o dia em foco
 * atravessa a virada de mês pelo PageDown, e uma data impossível faria
 * `somarDias` devolver `NaN` — as setas parariam de funcionar sem aviso.
 */
function diaNoMes(ano: number, mesBaseZero: number, diaDoMes: number): string {
  const ultimo = new Date(Date.UTC(ano, mesBaseZero + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mesBaseZero, Math.min(diaDoMes, ultimo)))
    .toISOString()
    .slice(0, 10)
}

/**
 * Calendário de avaliações e carga de estudo.
 *
 * Três coisas mudaram em relação à versão anterior, e todas vieram de ver
 * alguém usando no celular:
 *
 * 1. O detalhe do dia abre DENTRO da semana clicada, não no fim da grade. Antes
 *    o aluno tocava num dia da primeira semana e a resposta aparecia quatro
 *    linhas abaixo, fora da tela.
 * 2. A grade é navegável pelo teclado como uma grade de verdade — setas andam
 *    pelos dias, PageUp/PageDown trocam o mês, e só um dia por vez fica no
 *    caminho do Tab. Antes eram 42 paradas de tabulação antes de chegar ao
 *    resto da página.
 * 3. No celular a avaliação virou ponto colorido em vez de emoji espremido, e
 *    a carga de estudo virou uma barrinha proporcional às horas em vez de um
 *    ponto de tamanho fixo — a semana pesada passa a ser visível de longe.
 */
export function Calendario({
  avaliacoes,
  cargaPorDia = {},
  hoje,
  foco,
  lembretes,
  onNovaAvaliacao,
  onAvaliacaoClick,
}: CalendarioProps) {
  const [visao, setVisao] = useState<'mes' | 'agenda'>('mes')
  const [referencia, setReferencia] = useState(() => hoje.slice(0, 7))
  const [diaAberto, setDiaAberto] = useState<string | null>(null)
  const [diaFocado, setDiaFocado] = useState<string>(hoje)

  const celulas = useRef(new Map<string, HTMLButtonElement>())
  const moverFocoPara = useRef<string | null>(null)

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
  const semanas = useMemo(
    () => Array.from({ length: 6 }, (_, i) => grade.slice(i * 7, i * 7 + 7)),
    [grade],
  )

  const futuras = useMemo(
    () => avaliacoes.filter(a => a.data >= hoje).sort((a, b) => a.data.localeCompare(b.data)),
    [avaliacoes, hoje],
  )

  const noMes = useMemo(
    () => avaliacoes.filter(a => a.data.slice(0, 7) === referencia).length,
    [avaliacoes, referencia],
  )

  const proxima = futuras[0]
  const diaSelecionado = diaAberto ?? (porDia.has(hoje) ? hoje : null)

  const irPara = useCallback((dia: string, comFoco: boolean) => {
    setReferencia(dia.slice(0, 7))
    setDiaFocado(dia)
    if (comFoco) moverFocoPara.current = dia
  }, [])

  // Pedido vindo de fora (barra de foco da página): abre o mês e o dia.
  useEffect(() => {
    if (!foco) return
    setVisao('mes')
    setDiaAberto(foco.dia)
    irPara(foco.dia, false)
  }, [foco, irPara])

  // O foco do teclado só pode ser movido depois que a célula nova existe no DOM.
  useEffect(() => {
    const alvo = moverFocoPara.current
    if (!alvo) return
    moverFocoPara.current = null
    celulas.current.get(alvo)?.focus()
  })

  function mover(passo: number) {
    // `Date.UTC` normaliza a virada de ano sozinho (mês -1 e mês 12).
    const novo = new Date(Date.UTC(ano, mes - 1 + passo, 1)).toISOString().slice(0, 7)
    setReferencia(novo)
    // Mantém o foco num dia que exista no mês novo.
    setDiaFocado(anterior =>
      diaNoMes(Number(novo.slice(0, 4)), Number(novo.slice(5, 7)) - 1, Number(anterior.slice(8, 10))),
    )
  }

  function aoTeclarNaGrade(evento: React.KeyboardEvent) {
    const teclas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }

    if (evento.key in teclas) {
      evento.preventDefault()
      irPara(somarDias(diaFocado, teclas[evento.key]), true)
      return
    }

    if (evento.key === 'Home' || evento.key === 'End') {
      evento.preventDefault()
      const deslocamento = diaDaSemana(diaFocado)
      irPara(somarDias(diaFocado, evento.key === 'Home' ? -deslocamento : 6 - deslocamento), true)
      return
    }

    if (evento.key === 'PageUp' || evento.key === 'PageDown') {
      evento.preventDefault()
      const passo = evento.key === 'PageUp' ? -1 : 1
      irPara(diaNoMes(ano, mes - 1 + passo, Number(diaFocado.slice(8, 10))), true)
    }
  }

  return (
    <section className="glass-page-card overflow-clip rounded-2xl">
      {/* ── Cabeçalho: o que importa antes de qualquer grade ── */}
      <header className="border-b border-border/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <CalendarDays className="h-5 w-5 shrink-0 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
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

          <div
            role="group"
            aria-label="Formato do calendário"
            className="flex shrink-0 items-center gap-1 rounded-xl bg-muted/60 p-1"
          >
            {(['mes', 'agenda'] as const).map(modo => (
              <button
                key={modo}
                type="button"
                onClick={() => setVisao(modo)}
                aria-pressed={visao === modo}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 ${
                  visao === modo
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border/60'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {modo === 'mes' ? (
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <List className="h-3.5 w-3.5" aria-hidden />
                )}
                {modo === 'mes' ? 'Mês' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>

        {lembretes && <FaixaDeLembretes {...lembretes} />}
      </header>

      {visao === 'mes' ? (
        <>
          {/* ── Navegação do mês ── */}
          <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => mover(-1)}
              aria-label="Mês anterior"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex min-w-0 items-center gap-2">
              <h3 className="truncate font-heading text-base font-bold text-foreground sm:text-lg">
                {MESES_NOME[mes - 1]} <span className="font-normal text-muted-foreground">{ano}</span>
              </h3>
              {noMes > 0 && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {noMes}
                </span>
              )}
              {referencia !== hoje.slice(0, 7) && (
                <button
                  type="button"
                  onClick={() => irPara(hoje, false)}
                  className="shrink-0 rounded-md bg-muted/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
                >
                  Hoje
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => mover(1)}
              aria-label="Próximo mês"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* ── Grade ── */}
          <div className="px-2 pb-3 sm:px-4">
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DIAS_SEMANA_CURTO.map(nome => (
                <div
                  key={nome}
                  className="pb-1 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]"
                >
                  <span className="sm:hidden">{nome.charAt(0)}</span>
                  <span className="hidden sm:inline">{nome}</span>
                </div>
              ))}
            </div>

            {/*
              Não é `role="grid"`: a grade abre o detalhe do dia DENTRO da
              semana clicada, e um painel entre duas linhas quebraria o
              contrato do papel (todo filho de um grid tem que ser linha). O
              que o leitor de tela precisa saber já está no rótulo de cada dia
              — data por extenso, quantas avaliações e quantas horas —, e as
              setas continuam andando pelos dias porque o foco é itinerante.
            */}
            <div
              role="group"
              aria-label={`${MESES_NOME[mes - 1]} de ${ano}`}
              onKeyDown={aoTeclarNaGrade}
              className="flex flex-col gap-1"
            >
              {semanas.map((semana, indice) => {
                const temSelecionado = diaSelecionado != null && semana.includes(diaSelecionado)

                return (
                  <Fragment key={semana[0]}>
                    <div className="grid grid-cols-7 gap-1">
                      {semana.map(dia => (
                        <CelulaDoDia
                          key={dia}
                          dia={dia}
                          mesExibido={mes}
                          hoje={hoje}
                          avaliacoes={porDia.get(dia) ?? []}
                          carga={cargaPorDia[dia]}
                          selecionado={dia === diaSelecionado}
                          focavel={dia === diaFocado}
                          registrar={(elemento) => {
                            if (elemento) celulas.current.set(dia, elemento)
                            else celulas.current.delete(dia)
                          }}
                          onSelecionar={() => {
                            setDiaFocado(dia)
                            setDiaAberto(dia === diaSelecionado ? null : dia)
                          }}
                        />
                      ))}
                    </div>

                    {/* O detalhe abre logo abaixo da semana clicada — não no fim da grade. */}
                    {temSelecionado && diaSelecionado && (
                      <DetalheDoDia
                        dia={diaSelecionado}
                        hoje={hoje}
                        avaliacoes={porDia.get(diaSelecionado) ?? []}
                        carga={cargaPorDia[diaSelecionado]}
                        onFechar={() => setDiaAberto(null)}
                        onNovaAvaliacao={onNovaAvaliacao}
                        onAvaliacaoClick={onAvaliacaoClick}
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>

            <Legenda />
          </div>
        </>
      ) : (
        <Agenda avaliacoes={futuras} hoje={hoje} onAvaliacaoClick={onAvaliacaoClick} />
      )}
    </section>
  )
}

/**
 * O opt-in de lembretes.
 *
 * Ligado, ele encolhe para uma linha: a explicação de três linhas é útil
 * exatamente uma vez, e depois disso rouba o espaço do calendário em toda
 * visita. Desligado, continua explicando o que o aluno ganha ao ligar.
 */
function FaixaDeLembretes({
  ativos,
  onChange,
  salvando,
}: {
  ativos: boolean
  onChange: (ativo: boolean) => void
  salvando?: boolean
}) {
  return (
    <div
      className={`mt-4 flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
        ativos ? 'border-[#468152]/30 bg-[#468152]/[0.06]' : 'border-border/60 bg-muted/30'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            ativos
              ? 'bg-[#468152]/15 text-[#468152] dark:text-[#7DCEA0]'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {ativos ? <Bell className="h-4 w-4" aria-hidden /> : <BellOff className="h-4 w-4" aria-hidden />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {ativos ? 'Lembretes ligados' : 'Quero receber lembretes das minhas avaliações'}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ativos
              ? 'Avisamos antes de cada prova desta seção e período.'
              : 'Ligue para ser avisado com antecedência, no ritmo que a coordenação definiu.'}
          </p>
        </div>
      </div>
      <ToggleSwitch checked={ativos} onChange={onChange} disabled={salvando} className="shrink-0" />
    </div>
  )
}

function CelulaDoDia({
  dia,
  mesExibido,
  hoje,
  avaliacoes,
  carga,
  selecionado,
  focavel,
  registrar,
  onSelecionar,
}: {
  dia: string
  mesExibido: number
  hoje: string
  avaliacoes: Avaliacao[]
  carga?: CargaDoDia
  selecionado: boolean
  focavel: boolean
  registrar: (elemento: HTMLButtonElement | null) => void
  onSelecionar: () => void
}) {
  const doMes = Number(dia.slice(5, 7)) === mesExibido
  const eHoje = dia === hoje
  const proporcao = carga && carga.horas > 0 ? Math.min(1, carga.horas / HORAS_CHEIAS) : 0

  return (
    <button
      ref={registrar}
      type="button"
      tabIndex={focavel ? 0 : -1}
      aria-expanded={selecionado}
      aria-controls={selecionado ? `detalhe-${dia}` : undefined}
      onClick={onSelecionar}
      aria-label={`${formatarDiaLongo(dia)}${
        avaliacoes.length > 0 ? `, ${avaliacoes.length} avaliação(ões)` : ''
      }${carga && carga.horas > 0 ? `, ${carga.horas}h de estudo` : ''}`}
      className={`relative flex min-h-[3.75rem] min-w-0 flex-col gap-1 rounded-lg p-1 pb-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#468152] sm:min-h-[5.25rem] sm:p-1.5 sm:pb-2.5 ${
        doMes ? 'hover:bg-muted/60' : 'opacity-45 hover:opacity-75'
      } ${selecionado ? 'bg-muted/70 ring-2 ring-inset ring-[#468152]/45' : ''}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
          eHoje ? 'bg-[#468152] text-white' : 'text-foreground'
        }`}
      >
        {Number(dia.slice(8, 10))}
      </span>

      {/* Celular: pontos. Desktop: o título cabe, então o título aparece. */}
      {avaliacoes.length > 0 && (
        <>
          <span className="flex flex-wrap gap-1 px-0.5 sm:hidden" aria-hidden>
            {avaliacoes.slice(0, 3).map(avaliacao => (
              <span
                key={avaliacao._id}
                className={`h-1.5 w-1.5 rounded-full ${
                  ESTILO_FAIXA[faixaProximidade(diasEntre(hoje, avaliacao.data))].barra
                }`}
              />
            ))}
            {avaliacoes.length > 3 && (
              <span className="text-[9px] font-bold leading-none text-muted-foreground">
                +{avaliacoes.length - 3}
              </span>
            )}
          </span>

          <span className="hidden min-h-0 flex-1 flex-col gap-0.5 sm:flex" aria-hidden>
            {avaliacoes.slice(0, 2).map(avaliacao => {
              const estilo = ESTILO_FAIXA[faixaProximidade(diasEntre(hoje, avaliacao.data))]
              return (
                <span
                  key={avaliacao._id}
                  className={`flex min-w-0 items-center gap-1 overflow-hidden rounded border px-1 py-0.5 text-[10px] font-medium leading-tight ${estilo.chip}`}
                >
                  <span className={`h-2.5 w-0.5 shrink-0 rounded-full ${estilo.barra}`} />
                  <span className="truncate">{avaliacao.titulo}</span>
                </span>
              )
            })}
            {avaliacoes.length > 2 && (
              <span className="px-1 text-[10px] font-medium text-muted-foreground">
                +{avaliacoes.length - 2}
              </span>
            )}
          </span>
        </>
      )}

      {/* Carga de estudo: barra proporcional às horas, não um ponto de tamanho fixo. */}
      {proporcao > 0 && (
        <span
          className="absolute inset-x-1.5 bottom-1 h-1 overflow-hidden rounded-full bg-[#468152]/12"
          title={`${carga?.horas}h de estudo planejadas`}
          aria-hidden
        >
          <span
            className="block h-full rounded-full bg-[#468152]/60"
            style={{ width: `${Math.round(proporcao * 100)}%` }}
          />
        </span>
      )}
    </button>
  )
}

function Legenda() {
  const itens: Array<{ cor: string; texto: string; barra?: boolean }> = [
    { cor: 'bg-[#CE5929]', texto: 'até 3 dias' },
    { cor: 'bg-[#E2A43E]', texto: 'até 2 semanas' },
    { cor: 'bg-[#468152]', texto: 'mais longe' },
    { cor: 'bg-[#468152]/60', texto: 'carga de estudo', barra: true },
  ]

  return (
    <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-[11px] text-muted-foreground">
      {itens.map(item => (
        <li key={item.texto} className="inline-flex items-center gap-1.5">
          <span
            className={`${item.barra ? 'h-1 w-3.5' : 'h-1.5 w-1.5'} rounded-full ${item.cor}`}
            aria-hidden
          />
          {item.texto}
        </li>
      ))}
    </ul>
  )
}

function DetalheDoDia({
  dia,
  hoje,
  avaliacoes,
  carga,
  onFechar,
  onNovaAvaliacao,
  onAvaliacaoClick,
}: {
  dia: string
  hoje: string
  avaliacoes: Avaliacao[]
  carga?: CargaDoDia
  onFechar: () => void
  onNovaAvaliacao?: (dia: string) => void
  onAvaliacaoClick?: (avaliacao: Avaliacao) => void
}) {
  return (
    <div
      id={`detalhe-${dia}`}
      className="mt-0.5 rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h4 className="min-w-0 truncate text-sm font-bold text-foreground first-letter:uppercase">
          {formatarDiaLongo(dia)}
        </h4>
        <div className="flex shrink-0 items-center gap-1">
          {onNovaAvaliacao && (
            <button
              type="button"
              onClick={() => onNovaAvaliacao(dia)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#468152]/12 px-2.5 py-1.5 text-xs font-semibold text-[#468152] transition-colors hover:bg-[#468152]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 dark:text-[#7DCEA0]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Nova avaliação
            </button>
          )}
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar detalhe do dia"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
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

/**
 * Agenda: as avaliações futuras em lista, agrupadas por mês.
 *
 * O agrupamento existe porque uma lista corrida de dezoito provas não tem onde
 * o olho descansar — e "o que ainda vem em maio" é a pergunta que o aluno faz
 * quando troca para esta visão.
 */
function Agenda({
  avaliacoes,
  hoje,
  onAvaliacaoClick,
}: {
  avaliacoes: Avaliacao[]
  hoje: string
  onAvaliacaoClick?: (avaliacao: Avaliacao) => void
}) {
  const meses = useMemo(() => {
    const mapa = new Map<string, Avaliacao[]>()
    for (const avaliacao of avaliacoes) {
      const chave = avaliacao.data.slice(0, 7)
      mapa.set(chave, (mapa.get(chave) ?? []).concat(avaliacao))
    }
    return [...mapa.entries()]
  }, [avaliacoes])

  if (avaliacoes.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">Nenhuma avaliação futura por aqui</p>
        <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Quando a coordenação publicar as datas desta seção e período, elas aparecem aqui.
        </p>
      </div>
    )
  }

  return (
    <div className="pb-2">
      {meses.map(([chave, doMes]) => {
        const [ano, mes] = chave.split('-').map(Number)
        return (
          <section key={chave}>
            <h3 className="sticky top-0 z-10 border-y border-border/40 bg-card/95 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur sm:px-5">
              {MESES_NOME[mes - 1]} {ano}
              <span className="ml-2 font-medium normal-case tracking-normal opacity-70">
                {doMes.length} avaliaç{doMes.length === 1 ? 'ão' : 'ões'}
              </span>
            </h3>
            <ul className="divide-y divide-border/40">
              {doMes.map(avaliacao => (
                <li key={avaliacao._id} className="p-3 sm:px-5">
                  <CartaoAvaliacao avaliacao={avaliacao} hoje={hoje} onClick={onAvaliacaoClick} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
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
      className={`flex w-full items-stretch gap-3 overflow-hidden rounded-xl border border-border/50 bg-background/60 text-left transition-colors ${
        onClick
          ? 'hover:border-foreground/20 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50'
          : ''
      }`}
    >
      <span className={`w-1 shrink-0 ${estilo.barra}`} aria-hidden />

      <div className="min-w-0 flex-1 py-2.5 pr-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}
          >
            {tipo.rotulo}
          </span>
          <span className="min-w-0 break-words text-sm font-semibold text-foreground">
            {avaliacao.titulo}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className={`font-semibold ${estilo.texto}`}>{textoProximidade(dias)}</span>
          <span>{formatarDiaLongo(avaliacao.data)}</span>
          {avaliacao.hora && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {avaliacao.hora}
            </span>
          )}
          {avaliacao.local && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{avaliacao.local}</span>
            </span>
          )}
        </div>

        {avaliacao.conteudo && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {avaliacao.conteudo}
          </p>
        )}
      </div>
    </Elemento>
  )
}
