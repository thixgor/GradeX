'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  Flame,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { LogoLoading } from '@/components/logo-loading'
import { abrirCronogramaImpresso } from '@/lib/cronogramas/pdf'
import { ESTILO_PRIORIDADE, type Prioridade } from '@/lib/cronogramas/tipos'
import { diaDaSemana, formatarDiaCurto, formatarDiaLongo, hojeBrasilia } from '@/lib/cronogramas/brasilia'

/**
 * Um cronograma, dia a dia.
 *
 * A mudança que importa aqui é o tipo da atividade ficar visível. Um plano com
 * repetição espaçada tem três coisas diferentes acontecendo — conteúdo novo,
 * revisão de algo já visto e reta final de véspera de prova —, e quando todas
 * aparecem como um bloco cinza igual, o aluno trata revisão como releitura e o
 * método inteiro se perde.
 *
 * Os dias são agrupados por semana: é a unidade em que qualquer aluno pensa o
 * próprio estudo, e uma lista corrida de 60 cards não deixava enxergar nenhuma.
 */

type TipoAtividade = 'estudo' | 'revisao' | 'reta-final'

interface Atividade {
  id: string
  topico: string
  subtopico: string
  modulo: string
  dificuldadeUsuario: 'facil' | 'medio' | 'dificil'
  horas: number
  descricao: string
  concluido: boolean
  tipo?: TipoAtividade
  prioridade?: Prioridade
  etapa?: number
}

interface DiaDoPlano {
  dia: string
  data: string
  horasDisponivel: number
  atividades: Atividade[]
}

const ESTILO_TIPO: Record<TipoAtividade, { rotulo: string; classe: string; barra: string; icone: typeof BookOpen }> = {
  estudo: {
    rotulo: 'Estudo',
    classe: 'bg-[#468152]/12 text-[#468152] dark:text-[#7DCEA0] border-[#468152]/25',
    barra: 'bg-[#468152]',
    icone: BookOpen,
  },
  revisao: {
    rotulo: 'Revisão',
    classe: 'bg-[#2E8FA8]/12 text-[#2E8FA8] dark:text-[#7FCBDE] border-[#2E8FA8]/25',
    barra: 'bg-[#2E8FA8]',
    icone: RefreshCw,
  },
  'reta-final': {
    rotulo: 'Reta final',
    classe: 'bg-[#CE5929]/12 text-[#CE5929] dark:text-[#F3A588] border-[#CE5929]/25',
    barra: 'bg-[#CE5929]',
    icone: Flame,
  },
}

const DIFICULDADE: Record<string, string> = { facil: 'Fácil', medio: 'Médio', dificil: 'Difícil' }

/** Segunda-feira da semana de um dia — a chave do agrupamento. */
function inicioDaSemana(dia: string): string {
  const deslocamento = (diaDaSemana(dia) + 6) % 7
  const base = Date.parse(`${dia}T00:00:00Z`)
  return new Date(base - deslocamento * 86_400_000).toISOString().slice(0, 10)
}

function ConteudoDetalhe() {
  const router = useRouter()
  const params = useParams()
  const cronogramaId = params.id as string

  const [cronograma, setCronograma] = useState<any>(null)
  const [carregando, setCarregando] = useState(true)
  const [hoje] = useState(() => hojeBrasilia())

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch(`/api/cronogramas/${cronogramaId}`)
      if (resposta.ok) {
        const dados = await resposta.json()
        setCronograma(dados.cronograma ?? dados)
      }
    } finally {
      setCarregando(false)
    }
  }, [cronogramaId])

  useEffect(() => {
    void carregar()
  }, [carregar])

  // O `?? []` precisa ser memoizado: um array literal novo a cada render
  // invalidaria os dois `useMemo` abaixo sempre, refazendo o agrupamento por
  // semana de um plano que pode ter dois meses de dias.
  const dias = useMemo<DiaDoPlano[]>(() => cronograma?.cronograma ?? [], [cronograma])

  const numeros = useMemo(() => {
    let total = 0
    let feitas = 0
    let revisoes = 0
    for (const dia of dias) {
      for (const atividade of dia.atividades ?? []) {
        total += 1
        if (atividade.concluido) feitas += 1
        if (atividade.tipo === 'revisao') revisoes += 1
      }
    }
    return {
      total,
      feitas,
      revisoes,
      percentual: total === 0 ? 0 : Math.round((feitas / total) * 100),
    }
  }, [dias])

  /** Dias agrupados por semana, na ordem do calendário. */
  const semanas = useMemo(() => {
    const mapa = new Map<string, DiaDoPlano[]>()
    for (const dia of dias) {
      const chave = inicioDaSemana(dia.data)
      mapa.set(chave, (mapa.get(chave) ?? []).concat(dia))
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [dias])

  async function alternarConcluida(atividadeId: string, concluido: boolean) {
    // Otimista: marcar uma tarefa feita não deveria esperar a rede.
    setCronograma((anterior: any) =>
      anterior
        ? {
            ...anterior,
            cronograma: anterior.cronograma.map((dia: DiaDoPlano) => ({
              ...dia,
              atividades: dia.atividades.map(item =>
                item.id === atividadeId ? { ...item, concluido } : item,
              ),
            })),
          }
        : anterior,
    )

    try {
      const resposta = await fetch(`/api/cronogramas/${cronogramaId}/atividades/${atividadeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concluido }),
      })
      if (!resposta.ok) await carregar()
    } catch {
      await carregar()
    }
  }

  async function concluirCronograma() {
    const resposta = await fetch(`/api/cronogramas/${cronogramaId}/concluir`, { method: 'PATCH' })
    if (resposta.ok) await carregar()
  }

  /**
   * Imagem do plano. Carrega o html2canvas sob demanda — é a única tela que
   * usa, e embutir 200 KB no bundle por causa dela sairia caro para todo mundo.
   */
  function baixarImagem() {
    const alvo = document.getElementById('plano-para-imagem')
    if (!alvo || !cronograma) return

    const gerar = async () => {
      const canvas = await (window as any).html2canvas(alvo, { backgroundColor: '#ffffff', scale: 2, logging: false })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `cronograma-${cronograma.titulo}.png`
      link.click()
    }

    if ((window as any).html2canvas) {
      void gerar()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = () => void gerar()
    document.head.appendChild(script)
  }

  if (carregando) return <LogoLoading message="Carregando cronograma..." size="lg" fullscreen />

  if (!cronograma) {
    return (
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-4 text-lg font-semibold text-foreground">Cronograma não encontrado</p>
        <Button onClick={() => router.push('/cronogramas')}>Voltar para Cronogramas</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <button
          onClick={() => router.push('/cronogramas')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Cronogramas
        </button>

        {/* ── Resumo e ações ── */}
        <section className="glass-page-card mb-6 overflow-hidden rounded-2xl">
          <div className="h-1.5 bg-muted/40">
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-[#468152] to-[#E2A43E] transition-all duration-700"
              style={{ width: `${numeros.percentual}%` }}
            />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">{cronograma.titulo}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {dias.length > 0 && `${formatarDiaCurto(dias[0].data)} → ${formatarDiaCurto(dias[dias.length - 1].data)} · `}
                  {cronograma.totalHoras || 0}h
                  {numeros.revisoes > 0 && ` · ${numeros.revisoes} revisões agendadas`}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold tabular-nums text-foreground">{numeros.percentual}%</p>
                <p className="text-xs text-muted-foreground">
                  {numeros.feitas}/{numeros.total} atividades
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => abrirCronogramaImpresso(cronograma)} className="h-9 rounded-lg">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={baixarImagem} className="h-9 rounded-lg">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Imagem
              </Button>
              {numeros.percentual === 100 && !cronograma.concluido && (
                <Button
                  size="sm"
                  onClick={concluirCronograma}
                  className="ml-auto h-9 rounded-lg bg-[#468152] text-white hover:bg-[#468152]/90"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Marcar como concluído
                </Button>
              )}
              {cronograma.concluido && (
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#468152]/12 px-3 py-2 text-xs font-semibold text-[#468152] dark:text-[#7DCEA0]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Concluído
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Semanas ── */}
        <div id="plano-para-imagem" className="space-y-5">
          {semanas.length === 0 ? (
            <p className="glass-page-card rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground">
              Este cronograma não tem nenhum dia com atividade.
            </p>
          ) : (
            semanas.map(([inicio, diasDaSemana], indice) => {
              const horas = diasDaSemana.reduce(
                (soma, dia) => soma + dia.atividades.reduce((s, a) => s + (a.horas || 0), 0),
                0,
              )

              return (
                <section key={inicio} className="glass-page-card overflow-hidden rounded-2xl">
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 bg-muted/25 px-4 py-2.5">
                    <h2 className="text-sm font-bold text-foreground">
                      Semana {indice + 1}
                      <span className="ml-2 font-normal text-muted-foreground">
                        a partir de {formatarDiaCurto(inicio)}
                      </span>
                    </h2>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {Math.round(horas * 2) / 2}h
                    </span>
                  </header>

                  <div className="divide-y divide-border/30">
                    {diasDaSemana.map(dia => (
                      <div key={dia.data} className={dia.data === hoje ? 'bg-[#468152]/6' : ''}>
                        <div className="flex items-center justify-between gap-2 px-4 pb-1.5 pt-3">
                          <h3 className="text-xs font-semibold capitalize text-foreground">
                            {formatarDiaLongo(dia.data)}
                            {dia.data === hoje && (
                              <span className="ml-2 rounded-full bg-[#468152] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                Hoje
                              </span>
                            )}
                          </h3>
                          <span className="text-[11px] text-muted-foreground">{dia.horasDisponivel}h disponíveis</span>
                        </div>

                        <ul className="space-y-1.5 px-3 pb-3">
                          {dia.atividades.map(atividade => {
                            const tipo = ESTILO_TIPO[atividade.tipo ?? 'estudo'] ?? ESTILO_TIPO.estudo
                            const Icone = tipo.icone

                            return (
                              <li key={atividade.id}>
                                <button
                                  onClick={() => alternarConcluida(atividade.id, !atividade.concluido)}
                                  className={`flex w-full items-stretch gap-3 rounded-xl border text-left transition-all ${
                                    atividade.concluido
                                      ? 'border-[#468152]/30 bg-[#468152]/8'
                                      : 'border-border/50 bg-background/60 hover:border-foreground/20'
                                  }`}
                                >
                                  <span className={`w-1 shrink-0 rounded-l-xl ${tipo.barra}`} aria-hidden />

                                  <span className="flex flex-1 items-start gap-3 py-2.5 pr-3">
                                    <span
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                        atividade.concluido
                                          ? 'border-[#468152] bg-[#468152] text-white'
                                          : 'border-muted-foreground/40'
                                      }`}
                                      aria-hidden
                                    >
                                      {atividade.concluido && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    </span>

                                    <span className="min-w-0 flex-1">
                                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span
                                          className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}
                                        >
                                          <Icone className="h-2.5 w-2.5" aria-hidden />
                                          {tipo.rotulo}
                                          {atividade.etapa ? ` ${atividade.etapa}ª` : ''}
                                        </span>
                                        <span
                                          className={`text-sm font-medium ${
                                            atividade.concluido ? 'text-muted-foreground line-through' : 'text-foreground'
                                          }`}
                                        >
                                          {atividade.modulo}
                                        </span>
                                      </span>

                                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                        {atividade.topico} · {atividade.subtopico}
                                      </span>

                                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                          {DIFICULDADE[atividade.dificuldadeUsuario] ?? 'Médio'}
                                        </span>
                                        {atividade.prioridade && atividade.prioridade !== 'normal' && (
                                          <span
                                            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ESTILO_PRIORIDADE[atividade.prioridade].classe}`}
                                          >
                                            {ESTILO_PRIORIDADE[atividade.prioridade].rotulo}
                                          </span>
                                        )}
                                      </span>
                                    </span>

                                    <span className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                                      {atividade.horas}h
                                    </span>
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaginaCronograma() {
  return (
    <AppShell headerTitle="Cronograma" headerSubtitle="Seu plano de estudos">
      <ConteudoDetalhe />
    </AppShell>
  )
}
