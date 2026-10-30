'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Check, Pause, Pencil, Play, RotateCcw, Square, Trash2, X } from 'lucide-react'
import { useFocusSession } from '@/hooks/use-focus-session'
import {
  METAS_DE_FOCO,
  formatarMinutos,
  formatarRelogio,
  minutosPorDia,
  sequenciaDeFoco,
  sugestoesDeObjetivo,
} from '@/lib/foco/ritmo-de-foco'
import { cn } from '@/lib/utils'

/**
 * O corpo da sessão de foco — o mesmo no painel do cabeçalho e no cartão do
 * painel inicial.
 *
 * O que mudou em relação ao cronômetro antigo, e por quê:
 *
 * - **Meta de tempo** (25/50/90 ou livre). Um cronômetro que só sobe não tem
 *   fim; com meta, o anel enche e "bati a meta" vira o motivo de abrir de novo.
 * - **Objetivo em um toque.** Os últimos objetivos viram fichas: começar é
 *   tocar e apertar o botão, sem digitar.
 * - **O tempo aparece.** Hoje e a semana em minutos, com as sete colunas, e o
 *   resumo do fim diz que o tempo entrou no desempenho — antes a sessão
 *   terminava e sumia.
 */

const CHAVE_META = 'gradex:focus-session:meta'

function lerMeta(): number {
  try {
    const bruto = window.localStorage.getItem(CHAVE_META)
    // `Number(null)` é 0 — que é o "Livre". Sem escolha gravada, a meta é 25.
    const valor = bruto === null ? NaN : Number(bruto)
    return (METAS_DE_FOCO as readonly number[]).includes(valor) ? valor : 25
  } catch {
    return 25
  }
}

function gravarMeta(valor: number) {
  try {
    window.localStorage.setItem(CHAVE_META, String(valor))
  } catch {
    /* modo privado: a escolha vale só nesta visita */
  }
}

const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function diaDaSemana(chave: string): number {
  const [a, m, d] = chave.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay()
}

/** Anel do cronômetro: enche até a meta; sem meta, gira devagar como ponteiro. */
export function AnelDeFoco({
  fracao,
  tamanho,
  espessura,
  estado,
  children,
}: {
  fracao: number | null
  tamanho: number
  espessura: number
  estado: 'ativo' | 'pausado' | 'meta'
  children?: React.ReactNode
}) {
  const raio = (tamanho - espessura) / 2
  const circunferencia = 2 * Math.PI * raio
  const preenchido = fracao === null ? 0.12 : Math.min(1, Math.max(0, fracao))
  return (
    <div className="foco-anel relative shrink-0" data-estado={estado} data-livre={fracao === null ? 'true' : undefined} style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} className="-rotate-90" aria-hidden="true">
        <circle className="foco-anel-trilho" cx={tamanho / 2} cy={tamanho / 2} r={raio} strokeWidth={espessura} fill="none" />
        <circle
          className="foco-anel-traco"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          strokeWidth={espessura}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - preenchido)}
        />
      </svg>
      {children && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>}
    </div>
  )
}

/** Sete colunas da semana. Série única: o título nomeia, sem legenda. */
function SemanaDeFoco({ dias }: { dias: Array<{ date: string; minutos: number }> }) {
  const maximo = Math.max(30, ...dias.map(d => d.minutos))
  return (
    <ol className="foco-semana" aria-label="Minutos de foco nos últimos 7 dias">
      {dias.map((dia, i) => {
        const hoje = i === dias.length - 1
        const altura = dia.minutos > 0 ? Math.max(8, (dia.minutos / maximo) * 100) : 0
        return (
          <li key={dia.date} title={`${dia.minutos} min`} aria-label={`${hoje ? 'Hoje' : DIAS_CURTOS[diaDaSemana(dia.date)]}: ${dia.minutos} minutos`}>
            <span className="foco-semana-trilho">
              {altura > 0 && <span className="foco-semana-coluna" data-hoje={hoje ? 'true' : undefined} style={{ height: `${altura}%` }} />}
            </span>
            <span className={cn('foco-semana-dia', hoje && 'font-semibold text-foreground')}>{DIAS_CURTOS[diaDaSemana(dia.date)]}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function PainelDeFoco({
  variante = 'painel',
  onFechar,
}: {
  variante?: 'painel' | 'cartao'
  onFechar?: () => void
}) {
  const {
    currentSession,
    elapsedMs,
    startSession,
    pauseSession,
    resumeSession,
    finishSession,
    history,
    deleteSession,
    renameSession,
    isAuthenticated,
    lastFinished,
    dismissLastFinished,
  } = useFocusSession()

  const [objetivo, setObjetivo] = useState('')
  const [meta, setMeta] = useState(25)
  const [confirmarFim, setConfirmarFim] = useState(false)
  const [verHistorico, setVerHistorico] = useState(false)
  const [editando, setEditando] = useState<string | null>(null)
  const [textoEditado, setTextoEditado] = useState('')
  const campoRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMeta(lerMeta()), [])

  // O "Encerrar" pede confirmação; ela expira para não ficar armada.
  useEffect(() => {
    if (!confirmarFim) return
    const id = window.setTimeout(() => setConfirmarFim(false), 4000)
    return () => window.clearTimeout(id)
  }, [confirmarFim])

  const semana = useMemo(() => minutosPorDia(history), [history])
  const minutosHoje = semana[semana.length - 1]?.minutos || 0
  const minutosSemana = semana.reduce((soma, dia) => soma + dia.minutos, 0)
  const sequencia = useMemo(() => sequenciaDeFoco(history), [history])
  const sugestoes = useMemo(() => sugestoesDeObjetivo(history), [history])

  const ativa = currentSession?.status === 'active'
  const pausada = currentSession?.status === 'paused'
  const emAndamento = ativa || pausada
  const alvoMs = (currentSession?.targetMinutes || 0) * 60_000
  const fracao = alvoMs > 0 ? elapsedMs / alvoMs : null
  const bateuMeta = alvoMs > 0 && elapsedMs >= alvoMs

  // O instante em que a meta é batida merece um sinal — vibração curta no
  // celular. Uma vez por sessão.
  const avisou = useRef<string | null>(null)
  useEffect(() => {
    if (!bateuMeta || !currentSession || avisou.current === currentSession.id) return
    avisou.current = currentSession.id
    try {
      navigator.vibrate?.([30, 60, 30])
    } catch {
      /* sem vibração: o anel âmbar já diz */
    }
  }, [bateuMeta, currentSession])

  function comecar(texto = objetivo, minutos = meta) {
    startSession(texto, minutos || undefined)
    setObjetivo('')
  }

  function escolherMeta(valor: number) {
    setMeta(valor)
    gravarMeta(valor)
  }

  function encerrar() {
    if (!confirmarFim) {
      setConfirmarFim(true)
      return
    }
    setConfirmarFim(false)
    finishSession()
  }

  const compacto = variante === 'cartao'

  // ── Fim de sessão: o resumo ────────────────────────────────────────────────
  if (!emAndamento && lastFinished) {
    const minutos = Math.round(lastFinished.totalTimeMs / 60_000)
    const curta = lastFinished.totalTimeMs < 60_000
    const bateu = !!lastFinished.targetMinutes && minutos >= lastFinished.targetMinutes
    return (
      <div className={cn('foco-corpo', compacto && 'foco-corpo-cartao')}>
        <div className="flex items-start gap-3">
          <span className="foco-selo" data-tom={bateu ? 'meta' : 'ok'} aria-hidden="true">
            <Check className="h-5 w-5" strokeWidth={2.6} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-muted-foreground">{bateu ? 'Meta batida' : 'Sessão encerrada'}</p>
            <p className="foco-numero-grande">{curta ? 'Menos de 1 min' : formatarMinutos(minutos)}</p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{lastFinished.objective}</p>
          </div>
          <button type="button" onClick={dismissLastFinished} className="foco-icone-botao" aria-label="Fechar resumo">
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="foco-faixa mt-4">
          <div>
            <dt>Hoje</dt>
            <dd>{formatarMinutos(minutosHoje)}</dd>
          </div>
          <div>
            <dt>Semana</dt>
            <dd>{formatarMinutos(minutosSemana)}</dd>
          </div>
          <div>
            <dt>Sequência</dt>
            <dd>{sequencia} {sequencia === 1 ? 'dia' : 'dias'}</dd>
          </div>
        </dl>

        <p className="mt-3 text-[12.5px] text-muted-foreground">
          {curta
            ? 'Sessões de menos de um minuto não entram no desempenho.'
            : isAuthenticated
              ? lastFinished.syncedToServer
                ? 'Salvo no seu desempenho.'
                : 'Salvando no seu desempenho…'
              : 'Entre na sua conta para guardar o tempo no perfil.'}
        </p>

        <div className="mt-4 flex gap-2">
          <button type="button" className="foco-botao foco-botao-primario flex-1" onClick={() => comecar(lastFinished.objective, meta)}>
            <RotateCcw className="h-4 w-4" />
            Mais {meta ? `${meta} min` : 'uma'}
          </button>
          {isAuthenticated && (
            <Link href="/profile?tab=desempenho" className="foco-botao foco-botao-cinza" onClick={onFechar}>
              Ver desempenho
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Em andamento ───────────────────────────────────────────────────────────
  if (emAndamento && currentSession) {
    const restanteMs = Math.max(0, alvoMs - elapsedMs)
    return (
      <div className={cn('foco-corpo', compacto && 'foco-corpo-cartao')}>
        <div className={cn('flex items-center', compacto ? 'gap-4' : 'flex-col gap-3 text-center')}>
          <AnelDeFoco
            fracao={fracao}
            tamanho={compacto ? 112 : 168}
            espessura={compacto ? 9 : 11}
            estado={pausada ? 'pausado' : bateuMeta ? 'meta' : 'ativo'}
          >
            <span className={cn('foco-relogio', compacto && 'foco-relogio-p')} aria-live="off">
              {formatarRelogio(elapsedMs)}
            </span>
            <span className="text-[11.5px] font-medium text-muted-foreground">
              {pausada ? 'Pausada' : bateuMeta ? 'Meta batida' : alvoMs > 0 ? `faltam ${Math.ceil(restanteMs / 60_000)} min` : 'livre'}
            </span>
          </AnelDeFoco>
          <div className={cn('min-w-0', compacto ? 'flex-1' : 'w-full')}>
            <p className="text-[12px] font-medium text-muted-foreground">
              {alvoMs > 0 ? `Meta de ${currentSession.targetMinutes} min` : 'Cronômetro livre'}
            </p>
            <p className={cn('mt-0.5 font-semibold leading-snug', compacto ? 'line-clamp-2 text-[15px]' : 'line-clamp-2 text-base')}>
              {currentSession.objective}
            </p>
            {bateuMeta && !pausada && (
              <p className="mt-1 text-[12.5px] text-muted-foreground">Pode seguir — o tempo continua contando.</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {ativa ? (
            <button type="button" className="foco-botao foco-botao-cinza flex-1" onClick={pauseSession}>
              <Pause className="h-4 w-4" />
              Pausar
            </button>
          ) : (
            <button type="button" className="foco-botao foco-botao-primario flex-1" onClick={resumeSession}>
              <Play className="h-4 w-4" />
              Retomar
            </button>
          )}
          <button
            type="button"
            className={cn('foco-botao flex-1', confirmarFim ? 'foco-botao-perigo' : 'foco-botao-suave')}
            onClick={encerrar}
          >
            <Square className="h-3.5 w-3.5" />
            {confirmarFim ? 'Tocar de novo' : 'Encerrar'}
          </button>
        </div>
        {!compacto && (
          <p className="mt-3 text-center text-[12px] text-muted-foreground">
            Pode fechar o painel e navegar: o cronômetro segue no topo e no título da aba.
          </p>
        )}
      </div>
    )
  }

  // ── Antes de começar ──────────────────────────────────────────────────────
  return (
    <div className={cn('foco-corpo', compacto && 'foco-corpo-cartao')}>
      {!compacto && (
        <div className="mb-3">
          <h2 className="text-[17px] font-semibold tracking-tight">Sessão de foco</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
            Diga o que vai estudar e cronometre. O tempo entra no seu desempenho e vira XP.
          </p>
          <Link href="/profile?tab=foco" onClick={onFechar} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
            Abrir o Modo Foco — Pomodoro, respiração e jogos de atenção →
          </Link>
        </div>
      )}

      <div className="foco-hoje">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-muted-foreground">Hoje</p>
          <p className="foco-numero">{formatarMinutos(minutosHoje)}</p>
          <p className="text-[12px] text-muted-foreground">
            {formatarMinutos(minutosSemana)} na semana{sequencia > 1 ? ` · ${sequencia} dias seguidos` : ''}
          </p>
        </div>
        <SemanaDeFoco dias={semana} />
      </div>

      <label className="sr-only" htmlFor={`foco-objetivo-${variante}`}>
        O que você vai estudar?
      </label>
      <input
        id={`foco-objetivo-${variante}`}
        ref={campoRef}
        type="text"
        value={objetivo}
        onChange={e => setObjetivo(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && comecar()}
        maxLength={100}
        placeholder="O que você vai estudar?"
        // 16px no celular: abaixo disso o Safari dá zoom ao focar.
        className="foco-campo mt-3"
      />
      <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Objetivos recentes">
        {sugestoes.map(sugestao => (
          <button
            key={sugestao}
            type="button"
            className="foco-ficha"
            aria-pressed={objetivo === sugestao}
            onClick={() => setObjetivo(objetivo === sugestao ? '' : sugestao)}
          >
            {sugestao}
          </button>
        ))}
      </div>

      <div
        className="foco-segmentado mt-3"
        role="radiogroup"
        aria-label="Duração"
        style={{ ['--indice' as string]: Math.max(0, (METAS_DE_FOCO as readonly number[]).indexOf(meta)) }}
      >
        {METAS_DE_FOCO.map(valor => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={meta === valor}
            className="foco-segmento"
            onClick={() => escolherMeta(valor)}
          >
            {valor ? `${valor} min` : 'Livre'}
          </button>
        ))}
      </div>

      <button type="button" className="foco-botao foco-botao-primario foco-botao-g mt-3 w-full" onClick={() => comecar()}>
        <Play className="h-4 w-4" fill="currentColor" />
        {meta ? `Começar ${meta} min` : 'Começar cronômetro'}
      </button>

      {history.length > 0 && !compacto && (
        <div className="mt-3 border-t border-border/60 pt-2">
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between text-[13px] text-muted-foreground hover:text-foreground"
            onClick={() => setVerHistorico(v => !v)}
            aria-expanded={verHistorico}
          >
            <span>Sessões recentes</span>
            <span className="text-[12px]">{verHistorico ? 'Ocultar' : 'Mostrar'}</span>
          </button>
          {verHistorico && (
            <ul className="space-y-0.5">
              {history.slice(0, 5).map(sessao => (
                <li key={sessao.id} className="group flex min-h-[44px] items-center gap-2 rounded-lg px-1">
                  {editando === sessao.id ? (
                    <form
                      className="flex flex-1 items-center gap-1"
                      onSubmit={e => {
                        e.preventDefault()
                        renameSession(sessao.id, textoEditado.trim() || 'Sessão de foco')
                        setEditando(null)
                      }}
                    >
                      <input
                        autoFocus
                        value={textoEditado}
                        onChange={e => setTextoEditado(e.target.value)}
                        maxLength={100}
                        className="foco-campo !h-9 flex-1"
                        aria-label="Novo objetivo"
                      />
                      <button type="submit" className="foco-icone-botao" aria-label="Salvar">
                        <Check className="h-4 w-4" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium">{sessao.objective}</p>
                        <p className="text-[11.5px] text-muted-foreground">
                          {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(sessao.startedAt))}
                          {' · '}
                          {formatarMinutos(sessao.totalTimeMs / 60_000)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="foco-icone-botao lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                        aria-label={`Renomear "${sessao.objective}"`}
                        onClick={() => {
                          setEditando(sessao.id)
                          setTextoEditado(sessao.objective)
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="foco-icone-botao text-destructive lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                        aria-label={`Apagar "${sessao.objective}"`}
                        onClick={() => deleteSession(sessao.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
