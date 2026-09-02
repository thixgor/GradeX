'use client'

import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2,
  Minimize2,
  Search,
  X,
} from 'lucide-react'

import {
  ESTILO_PRIORIDADE,
  PRIORIDADES,
  contarEmenta,
  type EmentaTopico,
  type Prioridade,
} from '@/lib/cronogramas/tipos'

interface EmentaNavegadorProps {
  topicos: EmentaTopico[]
  carregando?: boolean
  /** Rótulo do que está sendo exibido, ex. "Medicina · 1º período". */
  contexto: string
  /** Ações extras no cabeçalho (baixar PDF, criar cronograma…). */
  acoes?: React.ReactNode
  /**
   * Prende a árvore numa caixa com rolagem própria.
   *
   * Só faz sentido quando a ementa é um passo DENTRO de outra tela — é o caso
   * da criação de cronograma, onde soltar 350 módulos no meio do formulário
   * empurraria o botão de criar para muito longe. Na página da ementa fica
   * `false`: rolagem dentro de rolagem no celular é uma armadilha, o dedo
   * quase nunca acerta qual das duas vai andar.
   */
  limitarAltura?: boolean
  /** Modo seleção: mostra caixas e devolve os ids marcados. */
  selecao?: {
    modulosSelecionados: Set<string>
    onToggleModulo: (id: string) => void
    onToggleSubtopico: (ids: string[], marcar: boolean) => void
  }
}

function semAcento(texto: string) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/**
 * Pinta o trecho que casou com a busca.
 *
 * Sem isso, procurar "ECG" devolvia trinta linhas e deixava o aluno relendo
 * cada uma para descobrir por que ela estava ali. Compara sem acento mas
 * recorta o texto ORIGINAL — senão "cardíaco" voltaria escrito "cardiaco".
 */
function Realce({ texto, termo }: { texto: string; termo: string }) {
  if (termo.length < 2) return <>{texto}</>

  const alvo = semAcento(texto)
  const partes: React.ReactNode[] = []
  let posicao = 0
  let achado = alvo.indexOf(termo)

  while (achado !== -1) {
    if (achado > posicao) partes.push(texto.slice(posicao, achado))
    partes.push(
      <mark
        key={`${achado}-${partes.length}`}
        className="rounded-[3px] bg-[#E2A43E]/35 px-0.5 text-inherit"
      >
        {texto.slice(achado, achado + termo.length)}
      </mark>,
    )
    posicao = achado + termo.length
    achado = alvo.indexOf(termo, posicao)
  }

  if (posicao < texto.length) partes.push(texto.slice(posicao))
  return <>{partes}</>
}

/**
 * Navegador da ementa.
 *
 * A ementa de um período de Medicina tem ~85 módulos e ~350 submódulos. A
 * versão anterior desenhava a árvore inteira aberta dentro de uma caixa de
 * 32rem com rolagem própria — o que dava, ao mesmo tempo, uma parede de texto
 * e uma rolagem aninhada que no celular quase nunca obedece ao dedo.
 *
 * Aqui a hierarquia volta a ser navegação: os tópicos abrem e fecham (o
 * primeiro já vem aberto, para a tela nunca começar vazia), a busca e o filtro
 * de prioridade continuam abrindo o que encontraram — e agora também pintam o
 * trecho que casou —, e a barra de controle gruda no topo enquanto se rola,
 * porque procurar de novo depois de descer 300 linhas era voltar ao começo.
 */
export function EmentaNavegador({
  topicos,
  carregando,
  contexto,
  acoes,
  limitarAltura = false,
  selecao,
}: EmentaNavegadorProps) {
  const [busca, setBusca] = useState('')
  const [prioridades, setPrioridades] = useState<Set<Prioridade>>(new Set())
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [topicosFechados, setTopicosFechados] = useState<Set<string>>(new Set())

  const buscaAdiada = useDeferredValue(busca)
  const termo = semAcento(buscaAdiada.trim())
  const filtrando = termo.length >= 2 || prioridades.size > 0

  const resumo = useMemo(() => contarEmenta(topicos), [topicos])

  // Ementa nova (trocou de período): a memória de aberto/fechado da anterior
  // não vale mais — os ids são outros e o aluno começaria com tudo fechado.
  useEffect(() => {
    setAbertos(new Set())
    setTopicosFechados(new Set(topicos.slice(1).map(topico => topico.id)))
  }, [topicos])

  /**
   * Aplica busca e filtro de prioridade preservando a hierarquia: um módulo que
   * casa mantém o subtópico e o tópico dele no resultado, para o aluno ver
   * ONDE o assunto mora.
   */
  const visiveis = useMemo(() => {
    if (!filtrando) return topicos

    const casaTexto = (nome: string) => termo.length < 2 || semAcento(nome).includes(termo)
    const casaPrioridade = (p: Prioridade) => prioridades.size === 0 || prioridades.has(p)

    return topicos
      .map(topico => {
        const subtopicos = topico.subtopicos
          .map(sub => {
            const modulos = sub.modulos.filter(modulo => {
              if (!casaPrioridade(modulo.prioridade)) return false
              return (
                casaTexto(modulo.nome) ||
                casaTexto(sub.nome) ||
                casaTexto(topico.nome) ||
                modulo.submodulos.some(sm => casaTexto(sm.nome))
              )
            })
            return { ...sub, modulos }
          })
          .filter(sub => sub.modulos.length > 0)

        return { ...topico, subtopicos }
      })
      .filter(topico => topico.subtopicos.length > 0)
  }, [topicos, termo, prioridades, filtrando])

  const resumoVisivel = useMemo(() => contarEmenta(visiveis), [visiveis])
  const tudoFechado = topicosFechados.size >= visiveis.length && visiveis.length > 0

  function alternar(id: string) {
    setAbertos(anterior => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function alternarTopico(id: string) {
    setTopicosFechados(anterior => {
      const proximo = new Set(anterior)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function alternarPrioridade(prioridade: Prioridade) {
    setPrioridades(anterior => {
      const proximo = new Set(anterior)
      if (proximo.has(prioridade)) proximo.delete(prioridade)
      else proximo.add(prioridade)
      return proximo
    })
  }

  function limparFiltros() {
    setBusca('')
    setPrioridades(new Set())
  }

  return (
    <section className="glass-page-card overflow-clip rounded-2xl">
      <header className="border-b border-border/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-foreground">
              <BookOpen className="h-5 w-5 shrink-0 text-[#468152] dark:text-[#7DCEA0]" aria-hidden />
              Ementa do período
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{contexto}</p>
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </div>

        {/* ── Números do que está em tela ── */}
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { rotulo: 'Tópicos', valor: resumoVisivel.topicos },
            { rotulo: 'Subtópicos', valor: resumoVisivel.subtopicos },
            { rotulo: 'Módulos', valor: resumoVisivel.modulos },
            { rotulo: 'Horas', valor: `${Math.round(resumoVisivel.horas)}h` },
          ].map(item => (
            <div key={item.rotulo} className="min-w-0 rounded-xl bg-muted/40 px-3 py-2">
              <dt className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                {item.rotulo}
              </dt>
              <dd className="font-heading text-lg font-bold tabular-nums text-foreground">
                {item.valor}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      {/* ── Busca + prioridade: gruda no topo enquanto a árvore rola ── */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-card/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[11rem] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={busca}
              onChange={event => setBusca(event.target.value)}
              placeholder="Buscar assunto na ementa…"
              aria-label="Buscar na ementa"
              className="h-10 w-full rounded-xl border border-border/60 bg-background/70 pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-[#468152]/60 focus:ring-2 focus:ring-[#468152]/20"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRIORIDADES.map(prioridade => {
              const estilo = ESTILO_PRIORIDADE[prioridade]
              const ativo = prioridades.has(prioridade)
              const quantidade = resumo.porPrioridade[prioridade]
              if (quantidade === 0 && !ativo) return null
              return (
                <button
                  key={prioridade}
                  type="button"
                  onClick={() => alternarPrioridade(prioridade)}
                  aria-pressed={ativo}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 ${
                    ativo
                      ? estilo.classe
                      : 'border-border/60 bg-background/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${estilo.ponto}`} aria-hidden />
                  {estilo.rotulo}
                  <span className="tabular-nums opacity-60">{quantidade}</span>
                </button>
              )
            })}

            {visiveis.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setTopicosFechados(tudoFechado ? new Set() : new Set(visiveis.map(t => t.id)))
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50"
              >
                <Minimize2 className="h-3.5 w-3.5" aria-hidden />
                {tudoFechado ? 'Abrir tudo' : 'Fechar tudo'}
              </button>
            )}
          </div>
        </div>

        {filtrando && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              {resumoVisivel.modulos} de {resumo.modulos} módulos
            </span>
            <button
              type="button"
              onClick={limparFiltros}
              className="font-semibold text-[#468152] underline-offset-4 hover:underline dark:text-[#7DCEA0]"
            >
              Limpar filtros
            </button>
          </p>
        )}
      </div>

      <div className={`p-3 sm:p-4 ${limitarAltura ? 'max-h-[32rem] overflow-y-auto' : ''}`}>
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Carregando a ementa…
          </div>
        ) : topicos.length === 0 ? (
          <EstadoVazio
            titulo="Ementa ainda não publicada"
            descricao="A coordenação ainda não importou o conteúdo programático deste período. Os períodos que já têm ementa aparecem com um ponto verde no seletor de contexto."
          />
        ) : visiveis.length === 0 ? (
          <EstadoVazio
            titulo="Nada encontrado"
            descricao={`Nenhum assunto da ementa combina com ${
              termo.length >= 2 ? `"${busca.trim()}"` : 'os filtros escolhidos'
            }.`}
            acao={
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-lg bg-[#468152]/12 px-3 py-1.5 text-xs font-semibold text-[#468152] transition-colors hover:bg-[#468152]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 dark:text-[#7DCEA0]"
              >
                Limpar filtros
              </button>
            }
          />
        ) : (
          <ol className="space-y-2">
            {visiveis.map((topico, indiceTopico) => {
              // Buscar abre tudo: caçar em qual tópico o resultado caiu é o
              // trabalho que a busca deveria ter evitado.
              const topicoAberto = filtrando || !topicosFechados.has(topico.id)

              return (
                <li key={topico.id} className="overflow-hidden rounded-xl border border-border/40">
                  <h3>
                    <button
                      type="button"
                      onClick={() => alternarTopico(topico.id)}
                      aria-expanded={topicoAberto}
                      className="flex w-full items-center gap-2 bg-gradient-to-r from-[#153D1F] to-[#1a472a] px-3 py-2.5 text-left transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E2A43E]"
                    >
                      <ChevronDown
                        className={`h-3.5 w-3.5 shrink-0 text-[#E2A43E] transition-transform duration-200 ${
                          topicoAberto ? '' : '-rotate-90'
                        }`}
                        aria-hidden
                      />
                      <span className="shrink-0 text-xs font-bold text-[#E2A43E]">
                        {indiceTopico + 1}.
                      </span>
                      <span className="min-w-0 flex-1 break-words text-sm font-semibold text-white">
                        <Realce texto={topico.nome} termo={termo} />
                      </span>
                      <span className="shrink-0 text-[11px] text-white/55">
                        {topico.subtopicos.length} subtópico
                        {topico.subtopicos.length === 1 ? '' : 's'}
                      </span>
                    </button>
                  </h3>

                  {topicoAberto && (
                    <ol className="divide-y divide-border/30">
                      {topico.subtopicos.map((sub, indiceSub) => {
                        const idsDoSub = sub.modulos.map(m => m.id)
                        const todosMarcados =
                          selecao != null &&
                          idsDoSub.length > 0 &&
                          idsDoSub.every(id => selecao.modulosSelecionados.has(id))

                        return (
                          <li key={sub.id}>
                            <div className="flex items-center gap-2 bg-[#468152]/[0.06] px-3 py-2">
                              {selecao && (
                                <input
                                  type="checkbox"
                                  checked={todosMarcados}
                                  onChange={() => selecao.onToggleSubtopico(idsDoSub, !todosMarcados)}
                                  aria-label={`Selecionar todos os módulos de ${sub.nome}`}
                                  className="h-4 w-4 shrink-0 accent-[#468152]"
                                />
                              )}
                              <span className="shrink-0 text-[11px] font-bold tabular-nums text-[#468152] dark:text-[#7DCEA0]">
                                {indiceTopico + 1}.{indiceSub + 1}
                              </span>
                              <h4 className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
                                <Realce texto={sub.nome} termo={termo} />
                              </h4>
                              <Selo prioridade={sub.prioridade} />
                            </div>

                            <ol>
                              {sub.modulos.map(modulo => {
                                const aberto =
                                  abertos.has(modulo.id) || (filtrando && termo.length >= 2)
                                const temSubmodulos = modulo.submodulos.length > 0

                                return (
                                  <li key={modulo.id} className="px-3 py-1">
                                    <div className="flex items-center gap-2">
                                      {selecao && (
                                        <input
                                          type="checkbox"
                                          checked={selecao.modulosSelecionados.has(modulo.id)}
                                          onChange={() => selecao.onToggleModulo(modulo.id)}
                                          aria-label={`Incluir ${modulo.nome}`}
                                          className="h-4 w-4 shrink-0 accent-[#468152]"
                                        />
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => temSubmodulos && alternar(modulo.id)}
                                        disabled={!temSubmodulos}
                                        aria-expanded={temSubmodulos ? aberto : undefined}
                                        className={`flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152]/50 ${
                                          temSubmodulos ? 'hover:bg-muted/50' : 'cursor-default'
                                        }`}
                                      >
                                        {temSubmodulos ? (
                                          <ChevronRight
                                            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                              aberto ? 'rotate-90' : ''
                                            }`}
                                            aria-hidden
                                          />
                                        ) : (
                                          <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                        )}
                                        <span className="min-w-0 flex-1 break-words text-sm text-foreground/85">
                                          <Realce texto={modulo.nome} termo={termo} />
                                        </span>
                                        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                                          {modulo.horasEstimadas}h
                                        </span>
                                        <Selo prioridade={modulo.prioridade} />
                                      </button>
                                    </div>

                                    {aberto && temSubmodulos && (
                                      <ul className="mb-1 ml-6 space-y-0.5 border-l border-border/50 pl-3">
                                        {modulo.submodulos.map(submodulo => (
                                          <li
                                            key={submodulo.id}
                                            className="flex items-start gap-2 py-0.5"
                                          >
                                            <span
                                              className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                                                ESTILO_PRIORIDADE[submodulo.prioridade].ponto
                                              }`}
                                              aria-hidden
                                            />
                                            <span className="min-w-0 break-words text-xs leading-relaxed text-muted-foreground">
                                              <Realce texto={submodulo.nome} termo={termo} />
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </li>
                                )
                              })}
                            </ol>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}

/** O selo só aparece quando a ementa DECLAROU prioridade — "Padrão" é ruído. */
function Selo({ prioridade }: { prioridade: Prioridade }) {
  if (prioridade === 'normal') return null
  const estilo = ESTILO_PRIORIDADE[prioridade]
  return (
    <span
      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${estilo.classe}`}
    >
      {estilo.rotulo}
    </span>
  )
}

function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao: string
  acao?: React.ReactNode
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <BookOpen className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
        {descricao}
      </p>
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
