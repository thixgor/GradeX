'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronDown,
  Gauge,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleSwitch } from '@/components/ui/toggle-switch'
import { EmentaNavegador } from '@/components/cronogramas/ementa-navegador'
import { SeletorSecao } from '@/components/cronogramas/seletor-secao'
import { useCronogramaSecao } from '@/hooks/use-cronograma-secao'
import { estimar, gerarCronograma } from '@/lib/cronogramas/gerador'
import { formatarDiaCurto, hojeBrasilia, somarDias } from '@/lib/cronogramas/brasilia'
import { ESTILO_PRIORIDADE, getSecao, type EmentaTopico, type Prioridade } from '@/lib/cronogramas/tipos'
import type { StudyTime } from '@/lib/cronograma-types'

/**
 * Criação de cronograma numa tela só.
 *
 * O fluxo anterior tinha seis passos — modelo, período, tempo, data, tópicos,
 * confirmação — e o aluno só descobria se o plano cabia no semestre depois de
 * atravessar todos eles. Aqui as três perguntas que realmente existem (*o quê*,
 * *em que ritmo*, *a partir de quando*) ficam visíveis ao mesmo tempo, com
 * respostas já preenchidas, e a estimativa recalcula a cada mexida.
 *
 * O trabalho pesado é o mesmo `gerarCronograma` que os testes cobrem: ele é
 * puro, então roda aqui no navegador e o aluno vê o plano nascer sem uma ida
 * ao servidor.
 */

const DIAS: Array<{ chave: keyof StudyTime; curto: string; longo: string }> = [
  { chave: 'segunda', curto: 'Seg', longo: 'Segunda' },
  { chave: 'terca', curto: 'Ter', longo: 'Terça' },
  { chave: 'quarta', curto: 'Qua', longo: 'Quarta' },
  { chave: 'quinta', curto: 'Qui', longo: 'Quinta' },
  { chave: 'sexta', curto: 'Sex', longo: 'Sexta' },
  { chave: 'sabado', curto: 'Sáb', longo: 'Sábado' },
  { chave: 'domingo', curto: 'Dom', longo: 'Domingo' },
]

/** Os três ritmos cobrem quase todo mundo; o ajuste fino fica a um clique. */
const RITMOS: Array<{ id: string; rotulo: string; descricao: string; tempo: StudyTime }> = [
  {
    id: 'leve',
    rotulo: 'Leve',
    descricao: '7h por semana',
    tempo: { segunda: 1, terca: 1, quarta: 1, quinta: 1, sexta: 1, sabado: 2, domingo: 0 },
  },
  {
    id: 'equilibrado',
    rotulo: 'Equilibrado',
    descricao: '14h por semana',
    tempo: { segunda: 2, terca: 2, quarta: 2, quinta: 2, sexta: 2, sabado: 3, domingo: 1 },
  },
  {
    id: 'intenso',
    rotulo: 'Intenso',
    descricao: '25h por semana',
    tempo: { segunda: 3, terca: 4, quarta: 3, quinta: 4, sexta: 3, sabado: 5, domingo: 3 },
  },
]

/** Atalhos de seleção por prioridade — o caminho de um clique para "o quê". */
const ATALHOS: Array<{ id: string; rotulo: string; descricao: string; prioridades: Prioridade[] | null }> = [
  { id: 'tudo', rotulo: 'Período inteiro', descricao: 'Toda a ementa publicada', prioridades: null },
  { id: 'essencial', rotulo: 'Só o essencial', descricao: 'Apenas prioridade Alta', prioridades: ['alta'] },
  { id: 'foco', rotulo: 'Alta + Média', descricao: 'Corta o que é secundário', prioridades: ['alta', 'media', 'normal'] },
]

function ConteudoCriar() {
  const router = useRouter()
  const contexto = useCronogramaSecao()

  const [titulo, setTitulo] = useState('')
  const [tituloEditado, setTituloEditado] = useState(false)
  const [ritmo, setRitmo] = useState('equilibrado')
  const [tempoEstudo, setTempoEstudo] = useState<StudyTime>(RITMOS[1].tempo)
  const [ajusteAberto, setAjusteAberto] = useState(false)
  const [dataInicio, setDataInicio] = useState(() => hojeBrasilia())
  const [dataTermino, setDataTermino] = useState('')
  const [revisaoEspacada, setRevisaoEspacada] = useState(true)
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [atalhoAtivo, setAtalhoAtivo] = useState<string | null>('tudo')
  const [escolhaAberta, setEscolhaAberta] = useState(false)
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const secao = getSecao(contexto.secao)
  const rotuloContexto = `${secao.nome} · ${contexto.periodo}º período`

  /** Todos os ids de módulo da ementa carregada, na ordem em que aparecem. */
  const todosOsModulos = useMemo(() => {
    const ids: Array<{ id: string; prioridade: Prioridade }> = []
    for (const topico of contexto.topicos) {
      for (const sub of topico.subtopicos) {
        for (const modulo of sub.modulos) ids.push({ id: modulo.id, prioridade: modulo.prioridade })
      }
    }
    return ids
  }, [contexto.topicos])

  const aplicarAtalho = useCallback(
    (atalhoId: string) => {
      const atalho = ATALHOS.find(item => item.id === atalhoId)
      if (!atalho) return
      setAtalhoAtivo(atalhoId)
      setSelecionados(
        new Set(
          todosOsModulos
            .filter(item => atalho.prioridades === null || atalho.prioridades.includes(item.prioridade))
            .map(item => item.id),
        ),
      )
    },
    [todosOsModulos],
  )

  // Trocar de seção ou período reescreve a seleção: manter ids de outra ementa
  // seria uma seleção invisível que o aluno não consegue nem revisar.
  useEffect(() => {
    if (todosOsModulos.length === 0) {
      setSelecionados(new Set())
      return
    }
    aplicarAtalho(atalhoAtivo ?? 'tudo')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todosOsModulos])

  useEffect(() => {
    if (!tituloEditado) setTitulo(`${secao.nome} — ${contexto.periodo}º período`)
  }, [secao.nome, contexto.periodo, tituloEditado])

  /** A ementa marcada, no formato que o gerador entende. */
  const topicosMarcados = useMemo<EmentaTopico[]>(
    () =>
      contexto.topicos.map(topico => ({
        ...topico,
        incluido: true,
        subtopicos: topico.subtopicos.map(sub => ({
          ...sub,
          incluido: true,
          modulos: sub.modulos.map(modulo => ({ ...modulo, incluido: selecionados.has(modulo.id) })),
        })),
      })),
    [contexto.topicos, selecionados],
  )

  const estimativa = useMemo(
    () => estimar(topicosMarcados, tempoEstudo, dataInicio, revisaoEspacada),
    [topicosMarcados, tempoEstudo, dataInicio, revisaoEspacada],
  )

  /** Avaliações futuras da seção entram no plano como prazo e como véspera. */
  const avaliacoesDoPlano = useMemo(
    () =>
      contexto.avaliacoes
        .filter(avaliacao => avaliacao.data >= dataInicio)
        .map(avaliacao => ({
          titulo: avaliacao.titulo,
          data: avaliacao.data,
          itensEmenta: avaliacao.itensEmenta,
        })),
    [contexto.avaliacoes, dataInicio],
  )

  function trocarRitmo(id: string) {
    const escolhido = RITMOS.find(item => item.id === id)
    if (!escolhido) return
    setRitmo(id)
    setTempoEstudo(escolhido.tempo)
  }

  function ajustarDia(chave: keyof StudyTime, horas: number) {
    setRitmo('personalizado')
    setTempoEstudo(anterior => ({ ...anterior, [chave]: horas }))
  }

  function alternarModulo(id: string) {
    setAtalhoAtivo(null)
    setSelecionados(anterior => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function alternarSubtopico(ids: string[], marcar: boolean) {
    setAtalhoAtivo(null)
    setSelecionados(anterior => {
      const proximo = new Set(anterior)
      for (const id of ids) {
        if (marcar) proximo.add(id)
        else proximo.delete(id)
      }
      return proximo
    })
  }

  async function criar() {
    if (selecionados.size === 0) {
      setErro('Escolha pelo menos um módulo para estudar.')
      return
    }
    if (estimativa.horasSemana <= 0) {
      setErro('Reserve pelo menos uma hora de estudo na semana.')
      return
    }

    setErro(null)
    setCriando(true)

    try {
      const plano = gerarCronograma({
        topicos: topicosMarcados,
        tempoEstudo,
        dataInicio,
        dataTermino: dataTermino || undefined,
        avaliacoes: avaliacoesDoPlano,
        revisaoEspacada,
      })

      const resposta = await fetch('/api/cronogramas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim() || rotuloContexto,
          modelo: contexto.secao,
          secao: contexto.secao,
          periodo: contexto.periodo,
          revisaoEspacada,
          tempoEstudo,
          dataInicio,
          dataTermino: dataTermino || null,
          config: {
            modelo: contexto.secao,
            tempoEstudo,
            topicosInclusos: topicosMarcados.map(t => t.id),
            subtopicosInclusos: topicosMarcados.flatMap(t => t.subtopicos.map(s => s.id)),
            modulosInclusos: [...selecionados],
          },
          cronograma: plano.dias,
          totalHoras: plano.totalHoras,
          horasEstudo: plano.horasEstudo,
          horasRevisao: plano.horasRevisao,
        }),
      })

      if (resposta.ok) {
        const dados = await resposta.json()
        router.push(dados?.cronogramaId ? `/cronogramas/${dados.cronogramaId}` : '/cronogramas')
        return
      }

      const falha = await resposta.json().catch(() => ({}))
      if (falha?.requiresUpgrade) {
        router.push('/buy')
        return
      }
      setErro(falha?.error || 'Não foi possível criar o cronograma. Tente de novo.')
    } catch {
      setErro('Não foi possível criar o cronograma. Verifique sua conexão.')
    } finally {
      setCriando(false)
    }
  }

  const carregando = !contexto.pronto || contexto.carregandoEmenta

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-32">
      <div className="container mx-auto max-w-3xl px-4 py-6">
        <button
          onClick={() => router.push('/cronogramas')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Criar cronograma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Já vem preenchido com a sua seção e um ritmo equilibrado. Ajuste o que quiser — a previsão
          embaixo acompanha.
        </p>

        <div className="mt-6 space-y-4">
          {/* ── 1. O que estudar ── */}
          <section className="glass-page-card rounded-2xl p-4 sm:p-5">
            <Cabecalho numero={1} titulo="O que estudar" />

            <div className="mt-3">
              <SeletorSecao
                secao={contexto.secao}
                periodo={contexto.periodo}
                periodosDisponiveis={contexto.periodosDisponiveis}
                periodosComEmenta={contexto.periodosComEmenta}
                onSecaoChange={contexto.setSecao}
                onPeriodoChange={contexto.setPeriodo}
                secaoPadrao={contexto.secaoAcompanhada}
                compacto
              />
            </div>

            {carregando ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Carregando a ementa…
              </div>
            ) : todosOsModulos.length === 0 ? (
              <p className="mt-4 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                A coordenação ainda não importou a ementa deste período. Escolha um período com o
                ponto verde no seletor acima.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  {ATALHOS.map(atalho => {
                    const quantidade =
                      atalho.prioridades === null
                        ? todosOsModulos.length
                        : todosOsModulos.filter(item => atalho.prioridades!.includes(item.prioridade)).length
                    const ativo = atalhoAtivo === atalho.id

                    return (
                      <button
                        key={atalho.id}
                        onClick={() => aplicarAtalho(atalho.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          ativo
                            ? 'border-[#468152]/50 bg-[#468152]/10 shadow-sm'
                            : 'border-border/60 bg-background/60 hover:border-foreground/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {ativo && <Check className="h-3.5 w-3.5 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />}
                          <span className="text-sm font-semibold text-foreground">{atalho.rotulo}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{atalho.descricao}</p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          {quantidade} módulo{quantidade === 1 ? '' : 's'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">{selecionados.size}</strong> de {todosOsModulos.length} módulos
                    selecionados
                    {atalhoAtivo === null && ' (escolha manual)'}
                  </p>
                  <button
                    onClick={() => setEscolhaAberta(aberta => !aberta)}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[#468152] transition-colors hover:underline dark:text-[#7DCEA0]"
                  >
                    {escolhaAberta ? 'Fechar escolha manual' : 'Escolher módulo a módulo'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${escolhaAberta ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {escolhaAberta && (
                  <div className="mt-3">
                    <EmentaNavegador
                      topicos={contexto.topicos}
                      contexto={rotuloContexto}
                      limitarAltura
                      selecao={{
                        modulosSelecionados: selecionados,
                        onToggleModulo: alternarModulo,
                        onToggleSubtopico: alternarSubtopico,
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </section>

          {/* ── 2. Ritmo ── */}
          <section className="glass-page-card rounded-2xl p-4 sm:p-5">
            <Cabecalho numero={2} titulo="Seu ritmo" icone={Gauge} />

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {RITMOS.map(item => {
                const ativo = ritmo === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => trocarRitmo(item.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      ativo
                        ? 'border-[#468152]/50 bg-[#468152]/10 shadow-sm'
                        : 'border-border/60 bg-background/60 hover:border-foreground/20'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {ativo && <Check className="h-3.5 w-3.5 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />}
                      <span className="text-sm font-semibold text-foreground">{item.rotulo}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.descricao}</p>
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setAjusteAberto(aberto => !aberto)}
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#468152] transition-colors hover:underline dark:text-[#7DCEA0]"
            >
              {ajusteAberto ? 'Fechar ajuste por dia' : 'Ajustar dia a dia'}
              <ChevronDown className={`h-4 w-4 transition-transform ${ajusteAberto ? 'rotate-180' : ''}`} />
            </button>

            {ajusteAberto && (
              <div className="mt-3 space-y-2.5 rounded-xl bg-muted/30 p-3">
                {DIAS.map(dia => (
                  <div key={dia.chave} className="flex items-center gap-3">
                    <span className="w-12 shrink-0 text-xs font-semibold text-muted-foreground">{dia.curto}</span>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={tempoEstudo[dia.chave]}
                      onChange={event => ajustarDia(dia.chave, Number(event.target.value))}
                      aria-label={`Horas de estudo em ${dia.longo}`}
                      className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-[#468152]"
                    />
                    <span className="w-12 shrink-0 text-right text-xs font-bold tabular-nums text-foreground">
                      {tempoEstudo[dia.chave]}h
                    </span>
                  </div>
                ))}
              </div>
            )}

            <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/50 p-3">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <RefreshCw className="h-3.5 w-3.5 text-[#2E8FA8]" aria-hidden />
                  Repetição espaçada
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Agenda revisões em intervalos crescentes depois de cada módulo. É o que faz o conteúdo
                  ficar até a prova.
                </span>
              </span>
              <ToggleSwitch checked={revisaoEspacada} onChange={setRevisaoEspacada} className="shrink-0" />
            </label>
          </section>

          {/* ── 3. Quando ── */}
          <section className="glass-page-card rounded-2xl p-4 sm:p-5">
            <Cabecalho numero={3} titulo="Quando" icone={CalendarRange} />

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Começar em
                </span>
                <Input
                  type="date"
                  value={dataInicio}
                  min={somarDias(hojeBrasilia(), -30)}
                  onChange={event => setDataInicio(event.target.value)}
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Terminar até <span className="font-normal normal-case">(opcional)</span>
                </span>
                <Input
                  type="date"
                  value={dataTermino}
                  min={dataInicio}
                  onChange={event => setDataTermino(event.target.value)}
                  className="h-11 rounded-xl"
                />
              </label>
            </div>

            {avaliacoesDoPlano.length > 0 && (
              <p className="mt-3 rounded-xl bg-[#E2A43E]/10 p-3 text-xs text-[#9A6D12] dark:text-[#E2A43E]">
                {avaliacoesDoPlano.length} avaliação{avaliacoesDoPlano.length === 1 ? '' : 'ões'} desta seção
                {avaliacoesDoPlano.length === 1 ? ' entra' : ' entram'} no plano: o conteúdo cobrado é estudado
                antes e a véspera vira revisão geral.
              </p>
            )}

            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nome do cronograma
              </span>
              <Input
                value={titulo}
                onChange={event => {
                  setTitulo(event.target.value)
                  setTituloEditado(true)
                }}
                maxLength={80}
                className="h-11 rounded-xl"
              />
            </label>
          </section>
        </div>
      </div>

      {/* ── Barra de resultado: a previsão e a única ação ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto max-w-3xl px-4 py-3">
          {erro && (
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {erro}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <Metrica rotulo="Módulos" valor={String(estimativa.modulos)} />
              <Metrica rotulo="Carga" valor={`${estimativa.horas}h`} />
              <Metrica rotulo="Por semana" valor={`${estimativa.horasSemana}h`} />
              <Metrica
                rotulo="Termina em"
                valor={
                  estimativa.terminoPrevisto
                    ? `~${formatarDiaCurto(estimativa.terminoPrevisto)}`
                    : '—'
                }
                destaque
              />
            </dl>

            <Button
              onClick={criar}
              disabled={criando || carregando || selecionados.size === 0}
              className="h-11 rounded-xl bg-gradient-to-r from-[#468152] to-[#5a9a63] px-6 font-semibold text-white shadow-lg shadow-[#468152]/20"
            >
              {criando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Montando…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Criar cronograma
                </>
              )}
            </Button>
          </div>

          {dataTermino && estimativa.terminoPrevisto && estimativa.terminoPrevisto > dataTermino && (
            <p className="mt-2 text-xs text-[#9A6D12] dark:text-[#E2A43E]">
              Nesse ritmo o conteúdo não fecha até {formatarDiaCurto(dataTermino)}. Aumente as horas,
              tire módulos de prioridade{' '}
              <span className="font-semibold">{ESTILO_PRIORIDADE.baixa.rotulo}</span> ou estenda o prazo.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Cabecalho({
  numero,
  titulo,
  icone: Icone,
}: {
  numero: number
  titulo: string
  icone?: typeof Gauge
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#468152]/12 text-xs font-bold text-[#468152] dark:text-[#7DCEA0]">
        {numero}
      </span>
      <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
        {Icone && <Icone className="h-4 w-4 text-muted-foreground" aria-hidden />}
        {titulo}
      </h2>
    </div>
  )
}

function Metrica({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
      <dd className={`text-sm font-bold tabular-nums ${destaque ? 'text-[#468152] dark:text-[#7DCEA0]' : 'text-foreground'}`}>
        {valor}
      </dd>
    </div>
  )
}

export default function PaginaCriarCronograma() {
  return (
    <AppShell headerTitle="Criar cronograma" headerSubtitle="Um plano em uma tela">
      <ConteudoCriar />
    </AppShell>
  )
}
