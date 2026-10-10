'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CalendarX2, Check, ChevronLeft, ChevronRight, Copy, Eraser, Loader2, Moon, Sun, Sunrise } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BLOCO_MIN, NOMES_DIAS, NOMES_DIAS_CURTOS, celulasParaJanelas, chaveCelula, horasPorSemana, janelasParaCelulas, minutosParaHhmm } from '@/lib/monitorias/agenda'
import type { Disponibilidade } from '@/lib/monitorias/tipos'
import { cn } from '@/lib/utils'
import { CaixaErro, api } from '../base'

/** Segunda primeiro: é como a semana de aula é lida. */
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]
const UTEIS = [1, 2, 3, 4, 5]
const MINUTOS_DIA = 24 * 60
const MADRUGADA_FIM = 6 * 60

const ATALHOS: Array<{ rotulo: string; icone: typeof Moon; janelas: Array<[number[], number, number]> }> = [
  { rotulo: 'Noites de semana', icone: Moon, janelas: [[UTEIS, 19 * 60, 22 * 60]] },
  { rotulo: 'Manhãs de fim de semana', icone: Sunrise, janelas: [[[6, 0], 9 * 60, 12 * 60]] },
  { rotulo: 'Tardes de semana', icone: Sun, janelas: [[UTEIS, 14 * 60, 18 * 60]] },
]

function hojeEmBrasilia(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function formatarHoras(h: number): string {
  return Number.isInteger(h) ? `${h}h` : `${Math.floor(h)}h30`
}

/**
 * Editor da agenda semanal: o monitor PINTA os horários numa grade (clicar e
 * arrastar), em vez de escolher início e fim em listas. No celular, toca nos
 * horários do dia escolhido. Tudo em horário de Brasília, salvo de uma vez.
 */
export function EditorAgenda({ inicial, recarregar }: { inicial: Disponibilidade; recarregar: () => void }) {
  const reduzir = useReducedMotion()
  const [celulas, setCelulas] = useState<Set<string>>(() => janelasParaCelulas(inicial.semanal))
  const [bloqueados, setBloqueados] = useState<string[]>(inicial.diasBloqueados)
  const [intervalo, setIntervalo] = useState(inicial.intervaloMin)
  const [base, setBase] = useState(() => ({ celulas: janelasParaCelulas(inicial.semanal), bloqueados: inicial.diasBloqueados, intervalo: inicial.intervaloMin }))
  const [madrugada, setMadrugada] = useState(() => inicial.semanal.some((j) => j.inicio < '06:00'))
  const [diaMovel, setDiaMovel] = useState(1)
  const [menuDia, setMenuDia] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [salvoEm, setSalvoEm] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  const inicioGrade = madrugada ? 0 : MADRUGADA_FIM
  const linhas = useMemo(() => {
    const l: number[] = []
    for (let m = inicioGrade; m < MINUTOS_DIA; m += BLOCO_MIN) l.push(m)
    return l
  }, [inicioGrade])

  const alterado = useMemo(() => {
    if (intervalo !== base.intervalo) return true
    if (bloqueados.join() !== base.bloqueados.join()) return true
    if (celulas.size !== base.celulas.size) return true
    for (const c of celulas) if (!base.celulas.has(c)) return true
    return false
  }, [celulas, bloqueados, intervalo, base])

  // ── Pintura: o primeiro clique decide se o arrasto marca ou desmarca ──
  const pintura = useRef<boolean | null>(null)
  const aplicar = useCallback((chave: string, marcar: boolean) => {
    setCelulas((s) => {
      if (s.has(chave) === marcar) return s
      const n = new Set(s)
      if (marcar) n.add(chave)
      else n.delete(chave)
      return n
    })
  }, [])
  useEffect(() => {
    const soltar = () => {
      pintura.current = null
    }
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [])

  function iniciarPintura(e: React.PointerEvent<HTMLButtonElement>, chave: string) {
    e.preventDefault()
    // Sem captura: o arrasto precisa "entrar" nas outras células.
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const marcar = !celulas.has(chave)
    pintura.current = marcar
    aplicar(chave, marcar)
    setSalvoEm(null)
  }

  function alternar(chave: string) {
    aplicar(chave, !celulas.has(chave))
    setSalvoEm(null)
  }

  function horasDoDia(dia: number): number {
    let n = 0
    for (let m = 0; m < MINUTOS_DIA; m += BLOCO_MIN) if (celulas.has(chaveCelula(dia, m))) n++
    return (n * BLOCO_MIN) / 60
  }

  function faixasDoDia(dia: number): string[] {
    return celulasParaJanelas(new Set(Array.from(celulas).filter((c) => c.startsWith(`${dia}:`)))).map((j) => `${j.inicio}-${j.fim}`)
  }

  function copiarDia(origem: number, destinos: number[]) {
    setCelulas((s) => {
      const n = new Set(Array.from(s).filter((c) => !destinos.includes(Number(c.split(':')[0])) || Number(c.split(':')[0]) === origem))
      for (let m = 0; m < MINUTOS_DIA; m += BLOCO_MIN) {
        if (!s.has(chaveCelula(origem, m))) continue
        for (const d of destinos) n.add(chaveCelula(d, m))
      }
      return n
    })
    setMenuDia(null)
    setSalvoEm(null)
  }

  function limparDia(dia: number) {
    setCelulas((s) => new Set(Array.from(s).filter((c) => !c.startsWith(`${dia}:`))))
    setMenuDia(null)
    setSalvoEm(null)
  }

  function aplicarAtalho(a: (typeof ATALHOS)[number]) {
    setCelulas((s) => {
      const n = new Set(s)
      for (const [dias, ini, fim] of a.janelas) for (const d of dias) for (let m = ini; m < fim; m += BLOCO_MIN) n.add(chaveCelula(d, m))
      return n
    })
    setSalvoEm(null)
  }

  function descartar() {
    setCelulas(new Set(base.celulas))
    setBloqueados(base.bloqueados)
    setIntervalo(base.intervalo)
    setErro('')
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const semanal = celulasParaJanelas(celulas)
      await api('/api/monitorias/tutor/disponibilidade', { method: 'PUT', json: { semanal, diasBloqueados: bloqueados, intervaloMin: intervalo } })
      setBase({ celulas: new Set(celulas), bloqueados, intervalo })
      setSalvoEm(Date.now())
      recarregar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const total = horasPorSemana(celulas)
  const diasComAula = ORDEM_DIAS.filter((d) => horasDoDia(d) > 0).length

  return (
    <div className="pb-24">
      {/* Resumo + atalhos */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Quando você dá aula</h2>
          <p className="mt-1 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
            Clique e arraste na grade para marcar seus horários. Alunos só conseguem agendar direto dentro deles. Aulas já marcadas não mudam.
          </p>
        </div>
        <div className="flex items-baseline gap-4 rounded-2xl bg-muted/50 px-4 py-3">
          <div>
            <p className="font-heading text-2xl font-semibold tabular-nums">{formatarHoras(total)}</p>
            <p className="text-xs text-muted-foreground">por semana</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="font-heading text-2xl font-semibold tabular-nums">{diasComAula}</p>
            <p className="text-xs text-muted-foreground">{diasComAula === 1 ? 'dia' : 'dias'} com aula</p>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted-foreground">Começar rápido:</span>
        {ATALHOS.map((a) => (
          <button
            key={a.rotulo}
            type="button"
            onClick={() => aplicarAtalho(a)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-primary/40 hover:text-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <a.icone className="h-4 w-4" strokeWidth={1.75} /> {a.rotulo}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMadrugada((x) => !x)}
          aria-pressed={madrugada}
          className={cn('ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', madrugada ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}
        >
          {madrugada ? 'Esconder madrugada' : 'Mostrar madrugada (0h-6h)'}
        </button>
      </div>

      {/* Grade semanal (tablet e computador) */}
      <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
        <div className="grid grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] border-b border-border">
          <div />
          {ORDEM_DIAS.map((dia) => {
            const h = horasDoDia(dia)
            return (
              <div key={dia} className="relative border-l border-border">
                <button
                  type="button"
                  onClick={() => setMenuDia(menuDia === dia ? null : dia)}
                  aria-expanded={menuDia === dia}
                  className="flex w-full flex-col items-center gap-0.5 px-1 py-2.5 transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="text-sm font-semibold">{NOMES_DIAS_CURTOS[dia]}</span>
                  <span className={cn('text-xs tabular-nums', h ? 'text-primary' : 'text-muted-foreground')}>{h ? formatarHoras(h) : 'livre'}</span>
                </button>
                <AnimatePresence>
                  {menuDia === dia && (
                    <motion.div
                      initial={reduzir ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-1/2 top-full z-20 mt-1 w-52 -translate-x-1/2 rounded-xl border border-border bg-popover p-1 text-sm shadow-lg"
                    >
                      <MenuItem icone={Copy} onClick={() => copiarDia(dia, ORDEM_DIAS.filter((d) => d !== dia))} disabled={!h}>Copiar para todos os dias</MenuItem>
                      <MenuItem icone={Copy} onClick={() => copiarDia(dia, UTEIS.filter((d) => d !== dia))} disabled={!h}>Copiar para seg a sex</MenuItem>
                      <MenuItem icone={Eraser} onClick={() => limparDia(dia)} disabled={!h}>Limpar {NOMES_DIAS[dia].toLowerCase()}</MenuItem>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
        <div className="grid select-none grid-cols-[3.25rem_repeat(7,minmax(0,1fr))] [touch-action:none]" role="grid" aria-label="Grade de horários da semana">
          {linhas.map((m) => (
            <div key={m} className="contents" role="row">
              <div className={cn('relative h-[18px] pr-2 text-right text-[11px] tabular-nums text-muted-foreground', m % 60 === 0 && 'border-t border-border/60')}>
                {m % 60 === 0 && <span className="absolute -top-2 right-2 bg-card px-0.5">{minutosParaHhmm(m)}</span>}
              </div>
              {ORDEM_DIAS.map((dia) => {
                const chave = chaveCelula(dia, m)
                const on = celulas.has(chave)
                const antes = celulas.has(chaveCelula(dia, m - BLOCO_MIN)) && m > inicioGrade
                const depois = celulas.has(chaveCelula(dia, m + BLOCO_MIN))
                let fimBloco = m
                if (on && !antes) while (celulas.has(chaveCelula(dia, fimBloco))) fimBloco += BLOCO_MIN
                return (
                  <div key={chave} className={cn('border-l border-border px-1', m % 60 === 0 && !(on && antes) && 'border-t border-t-border/60')} role="gridcell">
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-label={`${NOMES_DIAS[dia]}, ${minutosParaHhmm(m)}`}
                      onPointerDown={(e) => iniciarPintura(e, chave)}
                      onPointerEnter={() => pintura.current !== null && aplicar(chave, pintura.current)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          alternar(chave)
                        }
                      }}
                      className={cn(
                        'block h-[18px] w-full cursor-pointer transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                        on ? 'bg-primary' : 'hover:bg-primary/15',
                        on && !antes && 'rounded-t-md',
                        on && !depois && 'rounded-b-md',
                      )}
                    >
                      {on && !antes && depois && (
                        <span className="pointer-events-none block truncate px-1.5 text-left text-[10px] font-semibold leading-[18px] text-primary-foreground">
                          {minutosParaHhmm(m)}-{minutosParaHhmm(fimBloco)}
                        </span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Celular: um dia por vez, toque para marcar */}
      <div className="md:hidden">
        <div className="-mx-4 mb-3 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {ORDEM_DIAS.map((dia) => {
            const h = horasDoDia(dia)
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setDiaMovel(dia)}
                aria-pressed={diaMovel === dia}
                className={cn(
                  'flex min-w-[3.25rem] shrink-0 flex-col items-center rounded-xl px-2 py-2 transition',
                  diaMovel === dia ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground ring-1 ring-border',
                )}
              >
                <span className="text-sm font-semibold">{NOMES_DIAS_CURTOS[dia]}</span>
                <span className={cn('text-[11px] tabular-nums', diaMovel === dia ? 'text-primary-foreground/80' : h ? 'text-primary' : 'text-muted-foreground')}>{h ? formatarHoras(h) : 'livre'}</span>
              </button>
            )
          })}
        </div>
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold">{NOMES_DIAS[diaMovel]}</p>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-xs" disabled={!horasDoDia(diaMovel)} onClick={() => copiarDia(diaMovel, ORDEM_DIAS.filter((d) => d !== diaMovel))}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copiar p/ todos
              </Button>
              <Button type="button" size="sm" variant="ghost" className="h-8 rounded-lg px-2 text-xs" disabled={!horasDoDia(diaMovel)} onClick={() => limparDia(diaMovel)}>
                <Eraser className="mr-1 h-3.5 w-3.5" /> Limpar
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {linhas.map((m) => {
              const chave = chaveCelula(diaMovel, m)
              const on = celulas.has(chave)
              return (
                <button
                  key={chave}
                  type="button"
                  aria-pressed={on}
                  onClick={() => alternar(chave)}
                  className={cn('h-10 rounded-lg text-sm tabular-nums transition active:scale-[0.97]', on ? 'bg-primary font-semibold text-primary-foreground' : 'bg-muted/50 text-muted-foreground')}
                >
                  {minutosParaHhmm(m)}
                </button>
              )
            })}
          </div>
          {faixasDoDia(diaMovel).length > 0 && <p className="mt-3 text-xs text-muted-foreground">Livre: {faixasDoDia(diaMovel).join(', ')}</p>}
        </div>
      </div>

      {/* Folga entre aulas + dias bloqueados */}
      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="font-heading text-base font-semibold">Pausa entre aulas</h3>
          <p className="mt-1 text-sm text-muted-foreground">Tempo livre antes e depois de cada aula, para você respirar.</p>
          <div className="mt-4 inline-flex rounded-xl bg-muted/60 p-1" role="radiogroup" aria-label="Pausa entre aulas">
            {[0, 15, 30].map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={intervalo === m}
                onClick={() => {
                  setIntervalo(m)
                  setSalvoEm(null)
                }}
                className={cn('relative rounded-lg px-4 py-1.5 text-sm font-medium transition', intervalo === m ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                {intervalo === m && <motion.span layoutId="pausa-aula" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{m ? `${m} min` : 'Sem pausa'}</span>
              </button>
            ))}
          </div>
        </section>
        <CalendarioFolgas
          bloqueados={bloqueados}
          alternar={(d) => {
            setBloqueados((b) => (b.includes(d) ? b.filter((x) => x !== d) : [...b, d].sort()))
            setSalvoEm(null)
          }}
        />
      </div>

      {erro && <CaixaErro mensagem={erro} className="mt-4" />}

      {/* Barra de salvar: só aparece quando há o que salvar */}
      <AnimatePresence>
        {(alterado || salvoEm) && (
          <motion.div
            initial={reduzir ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="sticky bottom-4 z-30 mt-6"
          >
            <div className="mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_12px_32px_-12px_hsl(var(--primary)/0.35)] backdrop-blur">
              {alterado ? (
                <>
                  <p className="text-sm font-medium">Alterações não salvas</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" className="rounded-xl" onClick={descartar} disabled={salvando}>Descartar</Button>
                    <Button type="button" className="rounded-xl" onClick={salvar} disabled={salvando}>
                      {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar agenda'}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2 text-sm font-medium text-primary"><Check className="h-4 w-4" /> Agenda salva. Os alunos já veem os novos horários.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MenuItem({ icone: Icone, children, onClick, disabled }: { icone: typeof Copy; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40">
      <Icone className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} /> {children}
    </button>
  )
}

/** Dois meses lado a lado: toque num dia para bloquear (férias, provas, plantão). */
function CalendarioFolgas({ bloqueados, alternar }: { bloqueados: string[]; alternar: (dia: string) => void }) {
  const hoje = hojeEmBrasilia()
  const [deslocamento, setDeslocamento] = useState(0)
  const [ano, mes] = hoje.split('-').map(Number)
  const meses = [0, 1].map((k) => {
    const d = new Date(Date.UTC(ano, mes - 1 + deslocamento + k, 1))
    return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() }
  })
  const futuros = bloqueados.filter((d) => d >= hoje)
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 font-heading text-base font-semibold"><CalendarX2 className="h-4 w-4 text-primary" strokeWidth={1.75} /> Dias de folga</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {futuros.length ? `${futuros.length} ${futuros.length === 1 ? 'dia bloqueado' : 'dias bloqueados'}. Toque de novo para liberar.` : 'Toque nos dias em que você não pode dar aula.'}
          </p>
        </div>
        <div className="flex gap-1">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={deslocamento <= 0} onClick={() => setDeslocamento((x) => x - 1)} aria-label="Meses anteriores">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 rounded-lg" disabled={deslocamento >= 10} onClick={() => setDeslocamento((x) => x + 1)} aria-label="Próximos meses">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {meses.map(({ ano: a, mes: m }) => {
          const primeiro = new Date(Date.UTC(a, m, 1)).getUTCDay()
          const dias = new Date(Date.UTC(a, m + 1, 0)).getUTCDate()
          const vazios = (primeiro + 6) % 7
          const nomeCru = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(a, m, 1)))
          const nome = nomeCru.charAt(0).toUpperCase() + nomeCru.slice(1)
          return (
            <div key={`${a}-${m}`}>
              <p className="mb-2 text-sm font-semibold">{nome}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
                {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={i} className="py-1">{d}</span>)}
                {Array.from({ length: vazios }).map((_, i) => <span key={`v${i}`} />)}
                {Array.from({ length: dias }).map((_, i) => {
                  const dia = `${a}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
                  const passado = dia < hoje
                  const bloqueado = bloqueados.includes(dia)
                  return (
                    <button
                      key={dia}
                      type="button"
                      disabled={passado}
                      aria-pressed={bloqueado}
                      aria-label={`${i + 1} ${bloqueado ? '(bloqueado)' : ''}`}
                      onClick={() => alternar(dia)}
                      className={cn(
                        'aspect-square rounded-lg text-sm tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        passado && 'text-muted-foreground/40',
                        !passado && !bloqueado && 'text-foreground hover:bg-muted',
                        bloqueado && 'bg-foreground/85 font-semibold text-background line-through decoration-background/60',
                        dia === hoje && !bloqueado && 'ring-1 ring-primary',
                      )}
                    >
                      {i + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
