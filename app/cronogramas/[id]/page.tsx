'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
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
import { resumirPlano } from '@/lib/cronogramas/progresso'
import {
  diaDaSemana,
  formatarDiaCurto,
  formatarDiaLongo,
  hojeBrasilia,
} from '@/lib/cronogramas/brasilia'

/**
 * Um cronograma, dia a dia.
 *
 * A lista corrida de sessenta cartões que existia aqui só respondia bem a uma
 * pergunta ("o que tem no plano inteiro?") e mal a duas mais frequentes: *o que
 * é para hoje* e *o que eu deixei passar*. Agora as semanas abrem e fecham,
 * só a semana de hoje — e as que têm atraso — nascem abertas, e um filtro
 * corta o plano para o que ainda está em aberto.
 *
 * As semanas passadas continuam ali, fechadas, com o placar do que foi feito:
 * escondê-las de vez apagaria a única evidência de que o aluno andou.
 *
 * O tipo da atividade continua visível, e por um motivo de método: um plano
 * com repetição espaçada tem três coisas diferentes acontecendo — conteúdo
 * novo, revisão de algo já visto e reta final de véspera —, e quando todas
 * aparecem como um bloco cinza igual, o aluno trata revisão como releitura.
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

const ESTILO_TIPO: Record<
  TipoAtividade,
  { rotulo: string; classe: string; barra: string; icone: typeof BookOpen }
> = {
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

type Filtro = 'tudo' | 'abertas' | 'atrasadas'

const FILTROS: Array<{ id: Filtro; rotulo: string }> = [
  { id: 'tudo', rotulo: 'Tudo' },
  { id: 'abertas', rotulo: 'Em aberto' },
  { id: 'atrasadas', rotulo: 'Atrasadas' },
]

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
  const [filtro, setFiltro] = useState<Filtro>('tudo')
  const [fechadas, setFechadas] = useState<Set<string>>(new Set())
  const [tudoAberto, setTudoAberto] = useState(false)
  const areaDeHoje = useRef<HTMLElement | null>(null)

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
  // invalidaria os `useMemo` abaixo sempre, refazendo o agrupamento por semana
  // de um plano que pode ter dois meses de dias.
  const dias = useMemo<DiaDoPlano[]>(() => cronograma?.cronograma ?? [], [cronograma])
  const resumo = useMemo(() => resumirPlano(cronograma, hoje), [cronograma, hoje])

  /** Dias agrupados por semana, na ordem do calendário. */
  const semanas = useMemo(() => {
    const mapa = new Map<string, DiaDoPlano[]>()
    for (const dia of dias) {
      const chave = inicioDaSemana(dia.data)
      mapa.set(chave, (mapa.get(chave) ?? []).concat(dia))
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([inicio, diasDaSemana]) => {
        let horas = 0
        let total = 0
        let feitas = 0
        let atrasadas = 0
        let temHoje = false

        for (const dia of diasDaSemana) {
          if (dia.data === hoje) temHoje = true
          for (const atividade of dia.atividades ?? []) {
            horas += atividade.horas || 0
            total += 1
            if (atividade.concluido) feitas += 1
            else if (dia.data < hoje) atrasadas += 1
          }
        }

        return {
          inicio,
          dias: diasDaSemana.sort((a, b) => a.data.localeCompare(b.data)),
          horas: Math.round(horas * 2) / 2,
          total,
          feitas,
          atrasadas,
          temHoje,
          passada: diasDaSemana.every(dia => dia.data < hoje),
        }
      })
  }, [dias, hoje])

  /**
   * Quais semanas nascem abertas: a de hoje, as que têm atraso e — quando o
   * plano ainda não começou — a primeira. Abrir todas devolveria a parede de
   * cartões; abrir nenhuma faria a tela começar vazia.
   */
  useEffect(() => {
    if (semanas.length === 0) return
    const interessantes = new Set(
      semanas.filter(semana => semana.temHoje || semana.atrasadas > 0).map(semana => semana.inicio),
    )
    if (interessantes.size === 0) {
      const proxima = semanas.find(semana => !semana.passada) ?? semanas[0]
      interessantes.add(proxima.inicio)
    }
    setFechadas(new Set(semanas.filter(s => !interessantes.has(s.inicio)).map(s => s.inicio)))
  }, [semanas])

  const irParaHoje = useCallback(() => {
    const semanaDeHoje = semanas.find(semana => semana.temHoje)
    if (semanaDeHoje) {
      setFechadas(anterior => {
        const proximo = new Set(anterior)
        proximo.delete(semanaDeHoje.inicio)
        return proximo
      })
    }
    // O `setTimeout` espera a semana abrir antes de medir a posição, e a
    // rolagem suave sai de cena para quem pediu menos movimento no sistema.
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(
      () =>
        areaDeHoje.current?.scrollIntoView({
          behavior: suave ? 'smooth' : 'auto',
          block: 'center',
        }),
      60,
    )
  }, [semanas])

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
      const resposta = await fetch(
        `/api/cronogramas/${cronogramaId}/atividades/${atividadeId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concluido }),
        },
      )
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
   *
   * Abre todas as semanas antes de fotografar: com a sanfona fechada, a imagem
   * sairia com o plano pela metade.
   */
  async function baixarImagem() {
    if (!cronograma) return
    setTudoAberto(true)
    await new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))),
    )

    const alvo = document.getElementById('plano-para-imagem')
    if (!alvo) {
      setTudoAberto(false)
      return
    }

    const gerar = async () => {
      try {
        const canvas = await (window as any).html2canvas(alvo, {
          backgroundColor: '#ffffff',
          scale: 2,
          logging: false,
        })
        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = `cronograma-${cronograma.titulo}.png`
        link.click()
      } finally {
        setTudoAberto(false)
      }
    }

    if ((window as any).html2canvas) {
      void gerar()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
    script.onload = () => void gerar()
    script.onerror = () => setTudoAberto(false)
    document.head.appendChild(script)
  }

  if (carregando) return <LogoLoading message="Carregando cronograma..." size="lg" fullscreen />

  if (!cronograma) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-4 text-lg font-semibold text-foreground">Cronograma não encontrado</p>
        <Button onClick={() => router.push('/cronogramas')}>Voltar para Cronogramas</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto w-full max-w-4xl px-4 py-5 sm:py-7">
        <button
          type="button"
          onClick={() => router.push('/cronogramas?vista=planos')}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Cronogramas
        </button>

        {/* ── Resumo e ações ── */}
        <section className="glass-page-card mb-4 overflow-clip rounded-2xl">
          <div className="h-1.5 bg-muted/50">
            <div
              className="cronograma-anima-medida h-full rounded-r-full bg-gradient-to-r from-[#468152] to-[#E2A43E]"
              style={{ width: `${resumo.percentual}%` }}
            />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0 flex-1">
                <h1 className="min-w-0 break-words font-heading text-xl font-bold text-foreground sm:text-2xl">
                  {cronograma.titulo}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {resumo.inicio && resumo.fim && (
                    <span>
                      {formatarDiaCurto(resumo.inicio)} → {formatarDiaCurto(resumo.fim)}
                    </span>
                  )}
                  <span aria-hidden>·</span>
                  <span>{cronograma.totalHoras || 0}h</span>
                  {resumo.revisoes > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1 text-[#2E8FA8] dark:text-[#7FCBDE]">
                        <RefreshCw className="h-3 w-3" aria-hidden />
                        {resumo.revisoes} revisões
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-heading text-3xl font-bold leading-none tabular-nums text-foreground">
                  {resumo.percentual}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {resumo.feitas}/{resumo.total} atividades
                </p>
              </div>
            </div>

            {/* ── A leitura que o percentual sozinho não dá ── */}
            <div className="mt-3 flex flex-wrap gap-2">
              {resumo.atrasadas > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#CE5929]/25 bg-[#CE5929]/[0.08] px-2.5 py-1.5 text-xs font-semibold text-[#CE5929] dark:text-[#F3A588]">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {resumo.atrasadas} atrasada{resumo.atrasadas === 1 ? '' : 's'} ·{' '}
                  {resumo.horasAtrasadas}h
                </span>
              ) : (
                !resumo.terminado && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#468152]/25 bg-[#468152]/[0.08] px-2.5 py-1.5 text-xs font-semibold text-[#468152] dark:text-[#7DCEA0]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    Em dia
                  </span>
                )
              )}

              {resumo.hojeTotal > 0 && (
                <button
                  type="button"
                  onClick={irParaHoje}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2A43E]/30 bg-[#E2A43E]/[0.1] px-2.5 py-1.5 text-xs font-semibold text-[#9A6D12] transition-colors hover:bg-[#E2A43E]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2A43E]/50 dark:text-[#E2A43E]"
                >
                  {resumo.hojeTotal - resumo.hojeFeitas === 0
                    ? 'Hoje: tudo feito'
                    : `Hoje: ${resumo.hojeTotal - resumo.hojeFeitas} de ${resumo.hojeTotal}`}
                  <span className="opacity-60">· ir</span>
                </button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => abrirCronogramaImpresso(cronograma)}
                className="h-9 rounded-lg"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                PDF
              </Button>
              <Button size="sm" variant="outline" onClick={baixarImagem} className="h-9 rounded-lg">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Imagem
              </Button>
              {resumo.percentual === 100 && !cronograma.concluido && (
                <Button
                  size="sm"
                  onClick={concluirCronograma}
                  className="ml-auto h-9 rounded-lg bg-[#468152] text-white hover:bg-[#3d7148]"
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Marcar como concluído
                </Button>
              )}
              {cronograma.concluido && (
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#468152]/12 px-3 py-2 text-xs font-semibold text-[#468152] dark:text-[#7DCEA0]">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Concluído
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Filtro ── */}
        {resumo.total > 0 && (
          <div
            role="group"
            aria-label="Filtrar atividades"
            className="mb-3 flex flex-wrap gap-1.5"
          >
            {FILTROS.map(item => {
              const ativo = filtro === item.id
              const desabilitado = item.id === 'atrasadas' && resumo.atrasadas === 0
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFiltro(item.id)}
                  aria-pressed={ativo}
                  disabled={desabilitado}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 disabled:cursor-not-allowed disabled:opacity-40 ${
                    ativo
                      ? 'border-foreground/15 bg-foreground text-background'
                      : 'border-border/60 bg-card text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.rotulo}
                  {item.id === 'atrasadas' && resumo.atrasadas > 0 && (
                    <span className="ml-1.5 tabular-nums opacity-70">{resumo.atrasadas}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* ── Semanas ── */}
        <div id="plano-para-imagem" className="space-y-3">
          {semanas.length === 0 ? (
            <p className="glass-page-card rounded-2xl px-6 py-12 text-center text-sm text-muted-foreground">
              Este cronograma não tem nenhum dia com atividade.
            </p>
          ) : (
            semanas.map((semana, indice) => (
              <CartaoSemana
                key={semana.inicio}
                semana={semana}
                numero={indice + 1}
                hoje={hoje}
                filtro={filtro}
                aberta={tudoAberto || !fechadas.has(semana.inicio)}
                refDeHoje={semana.temHoje ? areaDeHoje : undefined}
                onAlternar={() =>
                  setFechadas(anterior => {
                    const proximo = new Set(anterior)
                    if (proximo.has(semana.inicio)) proximo.delete(semana.inicio)
                    else proximo.add(semana.inicio)
                    return proximo
                  })
                }
                onAlternarConcluida={alternarConcluida}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface SemanaResumida {
  inicio: string
  dias: DiaDoPlano[]
  horas: number
  total: number
  feitas: number
  atrasadas: number
  temHoje: boolean
  passada: boolean
}

function CartaoSemana({
  semana,
  numero,
  hoje,
  filtro,
  aberta,
  refDeHoje,
  onAlternar,
  onAlternarConcluida,
}: {
  semana: SemanaResumida
  numero: number
  hoje: string
  filtro: Filtro
  aberta: boolean
  refDeHoje?: React.MutableRefObject<HTMLElement | null>
  onAlternar: () => void
  onAlternarConcluida: (id: string, concluido: boolean) => void
}) {
  const dias = useMemo(() => {
    if (filtro === 'tudo') return semana.dias
    return semana.dias
      .map(dia => ({
        ...dia,
        atividades: dia.atividades.filter(atividade =>
          filtro === 'abertas'
            ? !atividade.concluido
            : !atividade.concluido && dia.data < hoje,
        ),
      }))
      .filter(dia => dia.atividades.length > 0)
  }, [semana.dias, filtro, hoje])

  if (filtro !== 'tudo' && dias.length === 0) return null

  const percentual = semana.total === 0 ? 0 : Math.round((semana.feitas / semana.total) * 100)

  return (
    <section
      ref={refDeHoje}
      className={`glass-page-card overflow-clip rounded-2xl transition-colors ${
        semana.temHoje ? 'ring-1 ring-[#468152]/30' : ''
      }`}
    >
      <h2>
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={aberta}
          className={`flex w-full flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#468152]/50 ${
            aberta ? 'border-border/40' : 'border-transparent'
          } ${semana.temHoje ? 'bg-[#468152]/[0.05]' : 'bg-muted/25'}`}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              aberta ? '' : '-rotate-90'
            }`}
            aria-hidden
          />

          <span className="min-w-0 text-sm font-bold text-foreground">
            Semana {numero}
            <span className="ml-2 font-normal text-muted-foreground">
              {formatarDiaCurto(semana.inicio)}
            </span>
          </span>

          {semana.temHoje && (
            <span className="shrink-0 rounded-full bg-[#468152] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Hoje
            </span>
          )}

          {semana.atrasadas > 0 && (
            <span className="shrink-0 rounded-md border border-[#CE5929]/25 bg-[#CE5929]/[0.1] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#CE5929] dark:text-[#F3A588]">
              {semana.atrasadas} atrasada{semana.atrasadas === 1 ? '' : 's'}
            </span>
          )}

          <span className="ml-auto flex shrink-0 items-center gap-2.5">
            <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block" aria-hidden>
              <span
                className="block h-full rounded-full bg-[#468152]"
                style={{ width: `${percentual}%` }}
              />
            </span>
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {semana.feitas}/{semana.total} · {semana.horas}h
            </span>
          </span>
        </button>
      </h2>

      {aberta && (
        <div className="divide-y divide-border/30">
          {dias.map(dia => (
            <div key={dia.data} className={dia.data === hoje ? 'bg-[#468152]/[0.05]' : ''}>
              <div className="flex items-center justify-between gap-2 px-4 pb-1.5 pt-3">
                <h3 className="min-w-0 truncate text-xs font-bold text-foreground first-letter:uppercase">
                  {formatarDiaLongo(dia.data)}
                  {dia.data === hoje && (
                    <span className="ml-2 rounded-full bg-[#468152] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                      Hoje
                    </span>
                  )}
                  {dia.data < hoje && dia.atividades.some(a => !a.concluido) && (
                    <span className="ml-2 rounded-full bg-[#CE5929]/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#CE5929] dark:text-[#F3A588]">
                      Atrasado
                    </span>
                  )}
                </h3>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {dia.horasDisponivel}h disponíveis
                </span>
              </div>

              <ul className="space-y-1.5 px-3 pb-3">
                {dia.atividades.map(atividade => (
                  <li key={atividade.id}>
                    <LinhaAtividade
                      atividade={atividade}
                      atrasada={dia.data < hoje && !atividade.concluido}
                      onAlternar={() => onAlternarConcluida(atividade.id, !atividade.concluido)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function LinhaAtividade({
  atividade,
  atrasada,
  onAlternar,
}: {
  atividade: Atividade
  atrasada: boolean
  onAlternar: () => void
}) {
  const tipo = ESTILO_TIPO[atividade.tipo ?? 'estudo'] ?? ESTILO_TIPO.estudo
  const Icone = tipo.icone

  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-pressed={atividade.concluido}
      className={`flex w-full items-stretch gap-3 overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 ${
        atividade.concluido
          ? 'border-[#468152]/30 bg-[#468152]/[0.07]'
          : atrasada
            ? 'border-[#CE5929]/30 bg-[#CE5929]/[0.04] hover:border-[#CE5929]/50'
            : 'border-border/50 bg-background/60 hover:border-foreground/20 hover:bg-muted/30'
      }`}
    >
      <span className={`w-1 shrink-0 ${tipo.barra}`} aria-hidden />

      <span className="flex flex-1 items-start gap-3 py-2.5 pr-3">
        <span
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            atividade.concluido
              ? 'border-[#468152] bg-[#468152] text-white'
              : 'border-muted-foreground/40'
          }`}
          aria-hidden
        >
          {atividade.concluido && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipo.classe}`}
            >
              <Icone className="h-2.5 w-2.5" aria-hidden />
              {tipo.rotulo}
              {atividade.etapa ? ` ${atividade.etapa}ª` : ''}
            </span>
            <span
              className={`min-w-0 break-words text-sm font-medium ${
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
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  ESTILO_PRIORIDADE[atividade.prioridade].classe
                }`}
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
  )
}

export default function PaginaCronograma() {
  return (
    <AppShell headerTitle="Cronograma" headerSubtitle="Seu plano de estudos">
      <ConteudoDetalhe />
    </AppShell>
  )
}
