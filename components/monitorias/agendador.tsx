'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, Clock, Loader2, Minus, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatarDuracao, NOMES_DIAS_CURTOS, diaDaSemana } from '@/lib/monitorias/agenda'
import { formatarCentavos } from '@/lib/monitorias/dinheiro'
import { precoPorPessoaCentavos } from '@/lib/monitorias/precos'
import type { ConteudoAnuncio } from '@/lib/monitorias/tipos'
import { api, CaixaErro, ErroApi, HoraBrasilia } from './base'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const PERIODOS = [
  { rotulo: 'Madrugada', de: 0, ate: 6 },
  { rotulo: 'Manhã', de: 6, ate: 12 },
  { rotulo: 'Tarde', de: 12, ate: 18 },
  { rotulo: 'Noite', de: 18, ate: 24 },
]

interface Horario {
  inicio: string
  dia: string
  hora: string
}

export function irParaLogin() {
  window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
}

/**
 * Agendamento direto: duração → dia → horário (sempre em Brasília) → contrato
 * e pagamento no checkout. O horário fica travado por 30 min ao continuar.
 */
export function Agendador({
  anuncioId,
  slug,
  anuncio,
  gratis,
}: {
  anuncioId: string
  slug: string
  anuncio: Pick<ConteudoAnuncio, 'preco' | 'grupo' | 'aulaGratis' | 'conteudos'>
  gratis: boolean
}) {
  const router = useRouter()
  const [duracoes, setDuracoes] = useState<number[]>([])
  const [duracao, setDuracao] = useState<number | null>(null)
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [dia, setDia] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<Horario | null>(null)
  const [vagas, setVagas] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  // A 1ª resposta já traz os horários da duração padrão: guardar essa duração
  // não deve disparar uma 2ª requisição idêntica.
  const duracaoDaResposta = useRef<number | null>(null)

  useEffect(() => {
    if (duracao !== null && duracao === duracaoDaResposta.current) {
      duracaoDaResposta.current = null
      return
    }
    let vivo = true
    setCarregando(true)
    setErro('')
    const p = new URLSearchParams()
    if (duracao) p.set('duracao', String(duracao))
    if (gratis) p.set('gratis', '1')
    api<{ duracoes: number[]; duracao: number; horarios: Horario[] }>(`/api/monitorias/publico/anuncios/${slug}/horarios?${p}`)
      .then((r) => {
        if (!vivo) return
        setDuracoes(r.duracoes)
        if (!duracao) {
          duracaoDaResposta.current = r.duracao
          setDuracao(r.duracao)
        }
        setHorarios(r.horarios)
        setEscolhido(null)
        setDia((atual) => (atual && r.horarios.some((h) => h.dia === atual) ? atual : r.horarios[0]?.dia || null))
      })
      .catch((e) => vivo && setErro(e.message))
      .finally(() => vivo && setCarregando(false))
    return () => {
      vivo = false
    }
  }, [slug, duracao, gratis])

  const dias = useMemo(() => Array.from(new Set(horarios.map((h) => h.dia))), [horarios])
  const doDia = horarios.filter((h) => h.dia === dia)
  const maxVagas = anuncio.grupo.ativo && !gratis ? anuncio.grupo.maxAlunos : 1
  const valor = gratis || !duracao ? 0 : precoPorPessoaCentavos(anuncio, duracao, vagas)

  async function continuar() {
    if (!escolhido || !duracao) return
    setEnviando(true)
    setErro('')
    try {
      const r = await api<{ reservaId: string }>(`/api/monitorias/anuncios/${anuncioId}/agendar`, {
        method: 'POST',
        json: { inicio: escolhido.inicio, duracaoMin: duracao, vagas, gratis, conteudos: [] },
      })
      router.push(`/monitorias/checkout/${r.reservaId}`)
    } catch (e) {
      if (e instanceof ErroApi && e.status === 401) return irParaLogin()
      setErro(e instanceof Error ? e.message : 'Erro ao reservar.')
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Duração */}
      {!gratis && duracoes.length > 1 && (
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold"><Clock className="h-4 w-4 text-primary" strokeWidth={1.75} /> Duração</p>
          <div className="flex flex-wrap gap-2">
            {duracoes.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={d === duracao}
                onClick={() => setDuracao(d)}
                className={cn('rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98]', d === duracao ? 'bg-foreground text-background' : 'bg-card ring-1 ring-border hover:ring-primary/40')}
              >
                {formatarDuracao(d)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dia */}
      <div>
        <p className="mb-2.5 flex items-center gap-1.5 text-sm font-semibold"><CalendarDays className="h-4 w-4 text-primary" strokeWidth={1.75} /> Dia</p>
        {carregando ? (
          <div className="flex gap-2" aria-label="Carregando horários">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-[72px] w-16 shrink-0 animate-pulse rounded-xl bg-muted/70" />)}
          </div>
        ) : dias.length === 0 ? (
          <p className="rounded-xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            Sem horários livres nas próximas 3 semanas. Tente outra duração ou combine pelo chat.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {dias.map((d) => {
              const [, m, dd] = d.split('-')
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === dia}
                  onClick={() => {
                    setDia(d)
                    setEscolhido(null)
                  }}
                  className={cn(
                    'flex w-16 shrink-0 flex-col items-center rounded-xl px-2 py-2.5 transition active:scale-[0.98]',
                    d === dia ? 'bg-foreground text-background' : 'bg-card ring-1 ring-border hover:ring-primary/40',
                  )}
                >
                  <span className="text-xs opacity-75">{NOMES_DIAS_CURTOS[diaDaSemana(d)]}</span>
                  <span className="font-heading text-xl font-semibold leading-tight tabular-nums">{dd}</span>
                  <span className="text-[11px] opacity-60">{MESES[Number(m) - 1]}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Horário */}
      <AnimatePresence mode="wait">
        {dia && doDia.length > 0 && (
          <motion.div key={dia} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <p className="mb-2.5 flex items-center justify-between text-sm font-semibold">
              <span>Horário</span> <HoraBrasilia />
            </p>
            <div className="space-y-3">
              {PERIODOS.map((per) => {
                const lista = doDia.filter((h) => per.de <= Number(h.hora.slice(0, 2)) && Number(h.hora.slice(0, 2)) < per.ate)
                if (!lista.length) return null
                return (
                  <div key={per.rotulo}>
                    <p className="mb-1.5 text-xs text-muted-foreground">{per.rotulo}</p>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {lista.map((h) => (
                        <button
                          key={h.inicio}
                          type="button"
                          aria-pressed={escolhido?.inicio === h.inicio}
                          onClick={() => setEscolhido(h)}
                          className={cn(
                            'rounded-lg py-2 text-sm font-medium tabular-nums transition active:scale-[0.97]',
                            escolhido?.inicio === h.inicio ? 'bg-primary text-primary-foreground' : 'bg-card ring-1 ring-border hover:ring-primary/40',
                          )}
                        >
                          {h.hora}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alunos */}
      {maxVagas > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3.5 py-2.5">
          <span className="flex items-center gap-1.5 text-sm font-medium"><Users className="h-4 w-4 text-primary" strokeWidth={1.75} /> Alunos no grupo</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setVagas((v) => Math.max(1, v - 1))} aria-label="Menos alunos">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center font-bold tabular-nums">{vagas}</span>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setVagas((v) => Math.min(maxVagas, v + 1))} aria-label="Mais alunos">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
      {vagas > 1 && (
        <p className="text-xs text-muted-foreground">
          Você vai receber um link de convite para os colegas. Cada um assina o próprio contrato e paga a sua parte. Se o grupo não fechar no prazo, todo mundo é reembolsado.
        </p>
      )}

      {erro && <CaixaErro mensagem={erro} />}

      <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center justify-between gap-3 border-t border-border bg-card px-5 py-4 sm:-mx-6 sm:-mb-6 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{gratis ? 'Aula experimental' : vagas > 1 ? 'Por pessoa' : 'Total'}</p>
          <p className="font-heading text-2xl font-semibold tabular-nums">{gratis ? 'Grátis' : formatarCentavos(valor)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {escolhido && duracao ? `${escolhido.dia.split('-').reverse().slice(0, 2).join('/')} às ${escolhido.hora}, ${formatarDuracao(duracao)}` : 'Escolha um horário'}
          </p>
        </div>
        <Button onClick={continuar} disabled={!escolhido || enviando} className="h-11 shrink-0 rounded-xl px-6">
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continuar'}
        </Button>
      </div>
      <p className="-mt-2 text-center text-xs text-muted-foreground">O horário fica guardado por 30 minutos enquanto você assina e paga.</p>
    </div>
  )
}
