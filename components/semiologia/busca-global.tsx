'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowRight, CornerDownLeft, Eye, GitCompareArrows, Search, Sparkles, Stethoscope, Waves, X } from 'lucide-react'
import {
  buscar,
  normalizar,
  ORDEM_DOS_TIPOS,
  preparar,
  ROTULO_DO_TIPO,
  type EntradaDeBusca,
  type Resultado,
  type TipoDeEntrada,
} from '@/lib/semiologia/busca-motor'
import { otimizavel } from '@/lib/semiologia/midia'
import { RAIZ } from '@/lib/semiologia/rotas'

/**
 * A paleta de busca do módulo.
 *
 * Uma caixa só, em todas as rotas, que acha sinal, cena de otoscopia, cena de
 * ultrassom, janela e comparador — porque o aluno que procura "pneumotórax"
 * não sabe (nem deveria precisar saber) que a resposta mora na ala de
 * ultrassom, na janela pulmonar, na terceira cena.
 *
 * O índice é carregado uma vez, no primeiro foco, e fica em memória de módulo:
 * navegar entre páginas não o baixa de novo. A pontuação roda no cliente a
 * cada tecla (`busca-motor.ts`); com ~600 entradas isso é instantâneo.
 */

let indicePrometido: Promise<EntradaDeBusca[]> | null = null

function carregarIndice(): Promise<EntradaDeBusca[]> {
  if (!indicePrometido) {
    indicePrometido = fetch(`${RAIZ}/indice`)
      .then((r) => (r.ok ? (r.json() as Promise<EntradaDeBusca[]>) : Promise.reject(new Error(String(r.status)))))
      .catch((erro) => {
        indicePrometido = null
        throw erro
      })
  }
  return indicePrometido
}

/** O índice, preparado uma vez para o motor. `null` enquanto não chegou. */
export function useIndiceDeBusca(ativo: boolean) {
  const [indice, setIndice] = useState<EntradaDeBusca[] | null>(null)
  useEffect(() => {
    if (!ativo || indice) return
    let vivo = true
    carregarIndice()
      .then((dados) => vivo && setIndice(dados))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [ativo, indice])
  return useMemo(() => (indice ? preparar(indice) : null), [indice])
}

const CHAVE_RECENTES = 'semiologia:buscas-recentes'

function lerRecentes(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE_RECENTES)
    const lista = bruto ? (JSON.parse(bruto) as unknown) : []
    return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string').slice(0, 6) : []
  } catch {
    return []
  }
}

function guardarRecente(termo: string) {
  try {
    const atual = lerRecentes().filter((t) => normalizar(t) !== normalizar(termo))
    localStorage.setItem(CHAVE_RECENTES, JSON.stringify([termo, ...atual].slice(0, 6)))
  } catch {
    /* sem armazenamento, sem histórico — a busca continua funcionando */
  }
}

const ICONE_DO_TIPO: Record<TipoDeEntrada, typeof Eye> = {
  sinal: Stethoscope,
  cena: Eye,
  vista: Eye,
  'cena-ultrassom': Waves,
  janela: Waves,
  comparador: GitCompareArrows,
}

export function BuscaGlobal({
  variante = 'compacta',
  placeholder = 'Buscar sinal, cena ou janela — flapping, pneumotórax, joanete…',
  autoFoco = false,
}: {
  variante?: 'hero' | 'compacta'
  placeholder?: string
  autoFoco?: boolean
}) {
  const router = useRouter()
  const caixa = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const [consulta, setConsulta] = useState('')
  const [focado, setFocado] = useState(false)
  const [ativa, setAtiva] = useState(0)
  const [recentes, setRecentes] = useState<string[]>([])

  const preparado = useIndiceDeBusca(focado || consulta.length > 0)

  useEffect(() => {
    if (focado) setRecentes(lerRecentes())
  }, [focado])

  // "/" ou Ctrl+K de qualquer lugar da página leva o cursor para a caixa —
  // o atalho que o aluno já conhece do GitHub e do editor.
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null
      const digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.isContentEditable)
      if ((evento.key === '/' && !digitando) || ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k')) {
        evento.preventDefault()
        caixa.current?.focus()
        caixa.current?.select()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [])

  const resposta = useMemo(() => {
    if (!preparado || consulta.trim().length < 2) return null
    return buscar(preparado, consulta, { limite: 18 })
  }, [preparado, consulta])

  // Agrupado por tipo, na ordem em que o aluno mais procura; a ordem interna
  // é a da pontuação. Os índices lineares servem ao teclado.
  const grupos = useMemo(() => {
    if (!resposta) return []
    const porTipo = new Map<TipoDeEntrada, Resultado[]>()
    for (const r of resposta.resultados) porTipo.set(r.entrada.tipo, [...(porTipo.get(r.entrada.tipo) ?? []), r])
    return ORDEM_DOS_TIPOS.filter((t) => porTipo.has(t)).map((t) => ({ tipo: t, itens: porTipo.get(t)! }))
  }, [resposta])
  const lineares = useMemo(() => grupos.flatMap((g) => g.itens), [grupos])

  useEffect(() => setAtiva(0), [consulta])

  const ir = useCallback(
    (resultado: Resultado) => {
      guardarRecente(consulta.trim())
      setFocado(false)
      caixa.current?.blur()
      router.push(resultado.entrada.href)
    },
    [consulta, router],
  )

  const aoTeclarNaCaixa = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === 'Escape') {
      setConsulta('')
      setFocado(false)
      caixa.current?.blur()
      return
    }
    if (!lineares.length) return
    if (evento.key === 'ArrowDown') {
      evento.preventDefault()
      setAtiva((a) => (a + 1) % lineares.length)
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault()
      setAtiva((a) => (a - 1 + lineares.length) % lineares.length)
    } else if (evento.key === 'Enter') {
      evento.preventDefault()
      ir(lineares[ativa])
    }
  }

  useEffect(() => {
    const el = lista.current?.querySelector<HTMLElement>(`[data-indice="${ativa}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [ativa])

  const aberta = focado && (consulta.trim().length >= 2 || recentes.length > 0)
  const hero = variante === 'hero'

  return (
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocado(false)}>
      <div className={`relative ${hero ? 'shadow-lg shadow-sky-500/5' : ''}`}>
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground ${hero ? 'h-5 w-5' : 'h-4 w-4'}`}
        />
        <input
          ref={caixa}
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          onFocus={() => setFocado(true)}
          onKeyDown={aoTeclarNaCaixa}
          placeholder={placeholder}
          autoFocus={autoFoco}
          role="combobox"
          aria-expanded={aberta}
          aria-controls="busca-semiologia-lista"
          aria-autocomplete="list"
          aria-label="Buscar no Manual de Semiologia"
          className={`w-full rounded-2xl border border-border bg-card outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 ${
            hero ? 'py-4 pl-12 pr-24 text-base' : 'py-2.5 pl-10 pr-20 text-sm'
          }`}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {consulta ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setConsulta('')
                caixa.current?.focus()
              }}
              aria-label="Limpar busca"
              className="pointer-events-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          )}
        </div>
      </div>

      {aberta && (
        <div
          id="busca-semiologia-lista"
          role="listbox"
          ref={lista}
          className="absolute left-0 right-0 z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xl shadow-black/10 dark:shadow-black/40"
        >
          {consulta.trim().length < 2 ? (
            <Recentes recentes={recentes} onEscolher={(t) => setConsulta(t)} />
          ) : !preparado ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando o índice…</p>
          ) : lineares.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              <p>
                Nada para <span className="font-medium text-foreground">“{consulta}”</span>.
              </p>
              <p className="mt-1.5 text-xs">
                Tente o nome do achado (“linhas B”, “icterícia”), o da doença (“cirrose”, “Graves”) ou o termo em inglês.
              </p>
            </div>
          ) : (
            <>
              {(resposta?.traduzido || resposta?.aproximado) && (
                <p className="flex items-center gap-2 border-b border-border bg-sky-500/5 px-4 py-2 text-xs text-sky-800 dark:text-sky-300">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  {resposta.aproximado
                    ? 'Nenhum resultado exato — estes são os mais parecidos.'
                    : 'Traduzimos o termo para o vocabulário do acervo.'}
                </p>
              )}
              {grupos.map((grupo) => (
                <section key={grupo.tipo} className="py-1.5">
                  <h3 className="px-4 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {ROTULO_DO_TIPO[grupo.tipo]}
                  </h3>
                  <ul>
                    {grupo.itens.map((resultado) => {
                      const indice = lineares.indexOf(resultado)
                      const selecionado = indice === ativa
                      return (
                        <li key={resultado.entrada.tipo + resultado.entrada.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selecionado}
                            data-indice={indice}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setAtiva(indice)}
                            onClick={() => ir(resultado)}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                              selecionado ? 'bg-sky-500/10' : 'hover:bg-muted/60'
                            }`}
                          >
                            <Miniatura entrada={resultado.entrada} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">
                                <Realce texto={resultado.entrada.titulo} tokens={resultado.tokensQueBateram} consulta={consulta} />
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {resultado.entrada.grupo}
                                {resultado.entrada.contexto && resultado.entrada.contexto !== resultado.entrada.grupo && (
                                  <> · {resultado.entrada.contexto}</>
                                )}
                              </span>
                            </span>
                            {resultado.entrada.temCasoReal && (
                              <span className="hidden shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:inline-block">
                                caso real
                              </span>
                            )}
                            {selecionado ? (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
              <p className="flex items-center gap-3 border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
                <span>
                  <kbd className="rounded border border-border bg-muted px-1 font-mono">↑↓</kbd> navegar
                </span>
                <span>
                  <kbd className="rounded border border-border bg-muted px-1 font-mono">↵</kbd> abrir
                </span>
                <span>
                  <kbd className="rounded border border-border bg-muted px-1 font-mono">esc</kbd> fechar
                </span>
                <span className="ml-auto">{resposta?.resultados.length} resultado(s)</span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Recentes({ recentes, onEscolher }: { recentes: string[]; onEscolher: (termo: string) => void }) {
  if (!recentes.length) return null
  return (
    <section className="py-1.5">
      <h3 className="px-4 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Buscas recentes
      </h3>
      <ul>
        {recentes.map((termo) => (
          <li key={termo}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onEscolher(termo)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-muted/60"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              {termo}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Miniatura({ entrada }: { entrada: EntradaDeBusca }) {
  const Icone = ICONE_DO_TIPO[entrada.tipo]
  if (entrada.capa && !/\.(gif|mp4|webm|mov)(\?|$)/i.test(entrada.capa)) {
    return (
      <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-black">
        <Image src={entrada.capa} alt="" fill sizes="40px" unoptimized={!otimizavel(entrada.capa)} className="object-cover" />
      </span>
    )
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
      <Icone className="h-4 w-4" />
    </span>
  )
}

/** Realça o trecho da consulta (ou os tokens que bateram) dentro do título. */
function Realce({ texto, tokens, consulta }: { texto: string; tokens: string[]; consulta: string }) {
  const alvos = [normalizar(consulta), ...tokens].filter((t) => t.length > 1)
  if (!alvos.length) return <>{texto}</>
  // Cada caractere do original vira o seu caractere-base minúsculo, na mesma
  // posição: "í" → "i". Assim as posições batem e o realce cai sobre o texto
  // com acento, não sobre uma cópia sem ele.
  const plano = Array.from(texto, (c) => c.normalize('NFD')[0]?.toLowerCase() ?? c).join('')
  const marcas = new Array<boolean>(texto.length).fill(false)
  for (const alvo of alvos) {
    let i = plano.indexOf(alvo)
    while (i !== -1) {
      for (let k = i; k < i + alvo.length; k++) marcas[k] = true
      i = plano.indexOf(alvo, i + 1)
    }
  }
  const partes: React.ReactNode[] = []
  let inicio = 0
  for (let i = 1; i <= texto.length; i++) {
    if (i === texto.length || marcas[i] !== marcas[inicio]) {
      const trecho = texto.slice(inicio, i)
      partes.push(marcas[inicio] ? <mark key={inicio} className="rounded bg-sky-500/20 text-inherit">{trecho}</mark> : trecho)
      inicio = i
    }
  }
  return <>{partes}</>
}
