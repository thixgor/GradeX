'use client'

/**
 * Área de estudo do Atlas: escolha da região e visualizador de pranchas.
 *
 * Está separada da tela de sistemas de propósito. Esta metade carrega o acervo
 * do sistema aberto e, com ele, o visualizador, a ficha e o motor de conteúdo —
 * enquanto a tela de sistemas precisa apenas de dez nomes e dez capas. Juntas
 * num único pacote, escolher o sistema custava 172 KB antes de aparecer coisa
 * alguma; separadas, a primeira tela chega imediatamente e este pedaço vem por
 * baixo, enquanto o aluno decide por onde entrar.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Portal } from '@/components/ui/portal'
import { PranchaInterativa } from '@/components/anatomia/prancha-interativa'
import { FichaCarregando, FichaMarcador, FichaVazia } from '@/components/anatomia/ficha-estrutura'
import {
  flattenCollections,
  type AtlasCollection,
  type AtlasMarker,
  type AtlasPiece,
  type AtlasSystem,
} from '@/lib/atlas-anatomia/estrutura'
import type { MarkerInsight } from '@/lib/atlas-anatomia/insights'
import { AcervoIndisponivel, carregarAcervo } from '@/lib/atlas-anatomia/acervo-cliente'
import { prepararMotorDeFichas, useMotorDeFichas } from '@/lib/atlas-anatomia/motor-fichas'
import { registrarVisita } from '@/lib/anatomia/ultima-visita'
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  LayoutGrid,
  Loader2,
  Search,
  Target,
  X,
} from 'lucide-react'

type Colecao = AtlasCollection & { breadcrumb: string[] }

/** Onde a área de estudo deve abrir: prancha e, se houver, estrutura. */
export interface AlvoDeAbertura {
  peca: number
  marcador?: number | null
}

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

function folhas(sistema: AtlasSystem): Colecao[] {
  return flattenCollections(sistema.collections).filter(colecao => colecao.pieces?.length)
}

interface Regiao {
  /** `null` quando a própria coleção é a região (sistemas sem subdivisão). */
  titulo: string | null
  colecoes: Colecao[]
  pranchas: number
  marcadores: number
}

/**
 * Agrupa as coleções do sistema pela primeira parte do caminho.
 *
 * O acervo é irregular de propósito: o esquelético se divide em Crânio, Tronco
 * e membros, enquanto o respiratório vai direto em Nariz, Faringe, Laringe.
 * Aqui os dois casos viram a mesma coisa — uma lista de regiões —, e é isso que
 * permite oferecer o mesmo passo de escolha para os dez sistemas.
 */
function regioes(colecoes: Colecao[]): Regiao[] {
  const ordem: string[] = []
  const mapa = new Map<string, Colecao[]>()

  for (const colecao of colecoes) {
    // Sem subdivisão, a coleção é a própria região — a chave usa o slug para
    // duas coleções de mesmo nome não se fundirem.
    const chave = colecao.breadcrumb.length > 1 ? colecao.breadcrumb[0] : `\u0000${colecao.slug}`
    if (!mapa.has(chave)) {
      mapa.set(chave, [])
      ordem.push(chave)
    }
    mapa.get(chave)!.push(colecao)
  }

  return ordem.map(chave => {
    const itens = mapa.get(chave)!
    return {
      titulo: chave.startsWith('\u0000') ? null : chave,
      colecoes: itens,
      pranchas: itens.reduce((total, item) => total + (item.pieces?.length || 0), 0),
      marcadores: itens.reduce(
        (total, item) => total + (item.pieces || []).reduce((soma, peca) => soma + peca.markers.length, 0),
        0,
      ),
    }
  })
}

/* ══════════════════════════ Busca de estrutura ══════════════════════════ */

interface Resultado {
  colecao: Colecao
  peca: AtlasPiece
  indicePeca: number
  indiceMarcador: number
  titulo: string
}

/**
 * Procura a estrutura em todo o sistema aberto, e não só na coleção da vez.
 *
 * O acervo já está na memória quando esta tela existe, então a busca é uma
 * varredura local — sem rede, sem espera. O teto de 40 resultados existe porque
 * "artéria" casa com centenas de marcadores, e ninguém rola uma lista dessas.
 */
function useResultados(colecoes: Colecao[], busca: string): Resultado[] {
  return useMemo(() => {
    const termo = normalizar(busca)
    if (termo.length < 2) return []
    const encontrados: Resultado[] = []
    for (const item of colecoes) {
      ;(item.pieces || []).forEach((umaPeca, posicaoPeca) => {
        umaPeca.markers.forEach((umMarcador, posicaoMarcador) => {
          if (encontrados.length >= 40) return
          if (normalizar(umMarcador.title).includes(termo)) {
            encontrados.push({
              colecao: item,
              peca: umaPeca,
              indicePeca: posicaoPeca,
              indiceMarcador: posicaoMarcador,
              titulo: umMarcador.title,
            })
          }
        })
      })
    }
    return encontrados
  }, [busca, colecoes])
}

function BuscaDeEstrutura({
  valor,
  onMudar,
  resultados,
  onAbrir,
  placeholder = 'Buscar estrutura neste sistema…',
}: {
  valor: string
  onMudar: (valor: string) => void
  resultados: Resultado[]
  onAbrir: (resultado: Resultado) => void
  placeholder?: string
}) {
  const [focada, setFocada] = useState(false)
  const aberta = focada && valor.trim().length >= 2

  return (
    <div className="relative">
      <div className="anatomia-campo flex h-10 items-center rounded-2xl">
        <Search className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={valor}
          onChange={evento => onMudar(evento.target.value)}
          onFocus={() => setFocada(true)}
          onBlur={() => window.setTimeout(() => setFocada(false), 150)}
          placeholder={placeholder}
          aria-label="Buscar estrutura"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground/70"
        />
        {valor && (
          <button
            type="button"
            onClick={() => onMudar('')}
            className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {aberta && (
        <div className="vidro-denso vidro-brilho absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-80 overflow-y-auto rounded-[22px] p-1.5">
          {resultados.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhuma estrutura encontrada para “{valor}”.
            </p>
          ) : (
            resultados.map(resultado => (
              <button
                key={`${resultado.peca.id}-${resultado.indiceMarcador}`}
                type="button"
                onMouseDown={evento => evento.preventDefault()}
                onClick={() => onAbrir(resultado)}
                className="flex w-full flex-col gap-0.5 rounded-2xl px-3 py-2 text-left transition hover:bg-foreground/[0.06]"
              >
                <span className="text-sm font-semibold leading-tight">{resultado.titulo}</span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {resultado.colecao.title} · {resultado.peca.title}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════ Escolha da região ══════════════════════════ */

/**
 * Passo entre o sistema e a prancha.
 *
 * Antes, escolher "Esquelético" jogava o aluno direto na primeira coleção do
 * crânio, e a existência de Tronco, Membro Superior e Membro Inferior só ficava
 * visível para quem abrisse o índice lateral. Agora o sistema mostra do que ele
 * é feito, e o aluno escolhe por onde entrar.
 *
 * A busca por estrutura vive aqui também, e não só dentro da área de estudo:
 * quem já sabe o nome do que procura não deveria ter que adivinhar em que
 * coleção ele mora para poder digitá-lo.
 */
function EscolhaDeRegiao({
  sistema,
  onAbrirColecao,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  onAbrirColecao: (slug: string, alvo?: AlvoDeAbertura) => void
  onTrocarSistema: () => void
}) {
  const colecoes = useMemo(() => folhas(sistema), [sistema])
  const listaRegioes = useMemo(() => regioes(colecoes), [colecoes])
  const totalPranchas = listaRegioes.reduce((total, regiao) => total + regiao.pranchas, 0)
  const totalMarcadores = listaRegioes.reduce((total, regiao) => total + regiao.marcadores, 0)

  const [busca, setBusca] = useState('')
  const resultados = useResultados(colecoes, busca)

  return (
    <main className="surface-page anatomia-ambiente min-h-screen">
      {/* Sem `overflow-hidden`: a lista de resultados da busca nasce dentro
          deste cabeçalho e desce por baixo dele — recortar aqui deixaria a
          busca com metade dos resultados invisíveis. A capa não transborda
          (é `fill`, presa ao próprio quadro), então não há o que recortar. */}
      <header className="relative isolate border-b border-border bg-slate-950">
        <Image
          src={sistema.cover}
          alt=""
          fill
          priority
          // Fundo a 35% de opacidade atrás de um gradiente: pedir 1920 px aqui
          // seria pagar resolução que ninguém enxerga.
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/55" aria-hidden />

        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-6 sm:pb-10 sm:pt-8">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os sistemas
          </button>

          <p className="editorial-mark !text-amber-300">Sistema {sistema.title}</p>
          <h1 className="mt-2.5 font-heading text-[2.25rem] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Por onde você quer começar?
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">
            {listaRegioes.length} {listaRegioes.length === 1 ? 'região' : 'regiões'} · {totalPranchas} pranchas ·{' '}
            {totalMarcadores.toLocaleString('pt-BR')} estruturas marcadas.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* O campo herda o vidro escuro do herói: um retângulo branco colado
                sobre a fotografia da capa seria um adesivo, não uma lâmina. */}
            <div className="min-w-0 flex-1 sm:max-w-md [&_.anatomia-campo]:border-white/20 [&_.anatomia-campo]:bg-white/10 [&_input]:text-white [&_input]:placeholder:text-white/45 [&_svg]:text-white/50">
              <BuscaDeEstrutura
                valor={busca}
                onMudar={setBusca}
                resultados={resultados}
                onAbrir={resultado =>
                  onAbrirColecao(resultado.colecao.slug, {
                    peca: resultado.indicePeca,
                    marcador: resultado.indiceMarcador,
                  })
                }
                placeholder="Ir direto a uma estrutura…"
              />
            </div>
            <Link
              href={`/anatomia/atlas-anatomia/quiz?sistema=${sistema.slug}`}
              className="anatomia-vidro-escuro inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <Target className="h-4 w-4 text-amber-300" /> Testar este sistema
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:py-9">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {listaRegioes.map(regiao => {
            // Região sem subdivisão abre a prancha direto: um clique, não dois.
            if (!regiao.titulo) {
              const unica = regiao.colecoes[0]
              return (
                <button
                  key={unica.slug}
                  type="button"
                  onClick={() => onAbrirColecao(unica.slug)}
                  className="vidro-leve vidro-brilho relevo relevo-toca group flex items-center gap-3 rounded-[22px] p-4 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-lg font-semibold leading-tight tracking-tight">
                      {unica.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {regiao.pranchas} prancha{regiao.pranchas !== 1 ? 's' : ''} ·{' '}
                      {regiao.marcadores.toLocaleString('pt-BR')} estruturas
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              )
            }

            return (
              <div key={regiao.titulo} className="vidro-leve vidro-brilho relevo flex flex-col rounded-[22px] p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight">{regiao.titulo}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {regiao.colecoes.length} coleç{regiao.colecoes.length !== 1 ? 'ões' : 'ão'} · {regiao.pranchas}{' '}
                      pranchas
                    </p>
                  </div>
                  {/* Uma região é um lugar, não uma pasta: dá para entrar nela
                      sem antes decidir por qual das coleções. */}
                  <button
                    type="button"
                    onClick={() => onAbrirColecao(regiao.colecoes[0].slug)}
                    className="tecla inline-flex h-8 shrink-0 items-center gap-1 px-2.5 text-[11px] font-bold text-primary"
                  >
                    Abrir <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="space-y-1">
                  {regiao.colecoes.map(colecao => (
                    <button
                      key={colecao.slug}
                      type="button"
                      onClick={() => onAbrirColecao(colecao.slug)}
                      className="vidro-pastilha group flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left"
                    >
                      <span className="min-w-0 truncate text-[13px] font-semibold">{colecao.title}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                          {colecao.pieces?.length || 0}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

/* ══════════════════════════ Área de estudo ══════════════════════════ */

/**
 * Os três estados da ficha, num lugar só: nenhum marcador escolhido, marcador
 * escolhido antes do conteúdo chegar, e a ficha completa. O estado do meio é
 * curto — o motor começa a ser buscado assim que a área de estudo abre — mas
 * existir evita que um toque durante a espera pareça um toque que não pegou.
 */
function PainelDaFicha({
  marcador,
  insight,
  numero,
  chave,
  compacta,
}: {
  marcador: AtlasMarker | null
  insight: MarkerInsight | null
  numero: number
  chave: string
  compacta?: boolean
}) {
  if (!marcador) return <FichaVazia compacta={compacta} />
  if (!insight) return <FichaCarregando titulo={marcador.title} numero={numero} />
  return <FichaMarcador titulo={marcador.title} numero={numero} insight={insight} chave={chave} compacta={compacta} />
}

function AreaDeEstudo({
  sistema,
  slugColecao,
  alvo,
  onAbrirColecao,
  onVoltarParaRegioes,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  slugColecao: string
  alvo?: AlvoDeAbertura
  onAbrirColecao: (slug: string, alvo?: AlvoDeAbertura) => void
  onVoltarParaRegioes: () => void
  onTrocarSistema: () => void
}) {
  const colecoes = useMemo(() => folhas(sistema), [sistema])
  const [indicePeca, setIndicePeca] = useState(alvo?.peca ?? 0)
  const [indiceMarcador, setIndiceMarcador] = useState<number | null>(alvo?.marcador ?? null)
  const [busca, setBusca] = useState('')
  const [modoEstudo, setModoEstudo] = useState(false)
  const [gavetaAberta, setGavetaAberta] = useState(alvo?.marcador != null)
  const [indiceVisivel, setIndiceVisivel] = useState(false)
  const palcoRef = useRef<HTMLDivElement>(null)

  const colecao = colecoes.find(item => item.slug === slugColecao) || colecoes[0] || null
  const pecas = colecao?.pieces || []
  const peca: AtlasPiece | null = pecas[indicePeca] || pecas[0] || null
  const marcador = indiceMarcador === null ? null : peca?.markers[indiceMarcador] || null

  // `null` enquanto o texto das fichas não terminou de chegar. Nesse intervalo
  // a ficha mostra o nome da estrutura — que é o que a maioria dos toques quer.
  const calcularFicha = useMotorDeFichas()

  const insight = useMemo(() => {
    if (!marcador || !colecao || !calcularFicha) return null
    return calcularFicha(marcador, {
      sistema: sistema.slug,
      caminho: colecao.breadcrumb,
      prancha: peca?.title,
    })
  }, [calcularFicha, marcador, colecao, sistema.slug, peca?.title])

  const resultados = useResultados(colecoes, busca)

  // O hub oferece "continuar de onde parou"; quem alimenta esse atalho é esta
  // tela, que é onde de fato se estuda.
  useEffect(() => {
    if (!colecao) return
    registrarVisita({
      tipo: 'atlas',
      titulo: `${sistema.title} · ${colecao.title}`,
      detalhe: `${pecas.length} prancha${pecas.length !== 1 ? 's' : ''} no Atlas`,
      href: `/anatomia/atlas-anatomia?sistema=${sistema.slug}&colecao=${colecao.slug}`,
    })
  }, [sistema.slug, sistema.title, colecao, pecas.length])

  const selecionarMarcador = useCallback((indice: number | null) => {
    setIndiceMarcador(indice)
    setGavetaAberta(indice !== null)
  }, [])

  /** Anda de estrutura em estrutura sem fechar a ficha — o gesto de folhear. */
  const passarMarcador = useCallback(
    (passo: number) => {
      const total = peca?.markers.length || 0
      if (total === 0) return
      const atual = indiceMarcador ?? -1
      setIndiceMarcador((atual + passo + total) % total)
      setGavetaAberta(true)
    },
    [indiceMarcador, peca?.markers.length],
  )

  const trocarPeca = useCallback(
    (indice: number) => {
      setIndicePeca(Math.min(Math.max(indice, 0), Math.max(pecas.length - 1, 0)))
      setIndiceMarcador(null)
      setGavetaAberta(false)
    },
    [pecas.length],
  )

  function abrirResultado(resultado: Resultado) {
    setBusca('')
    // Trocar de coleção remonta esta tela (a chave inclui o slug), então a
    // posição precisa viajar pela URL — senão o alvo se perderia no caminho.
    if (resultado.colecao.slug !== slugColecao) {
      onAbrirColecao(resultado.colecao.slug, {
        peca: resultado.indicePeca,
        marcador: resultado.indiceMarcador,
      })
      return
    }
    setIndicePeca(resultado.indicePeca)
    setIndiceMarcador(resultado.indiceMarcador)
    setGavetaAberta(true)
    palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Setas trocam de prancha, ↑/↓ folheiam as estruturas e Esc fecha a ficha —
  // os atalhos que se espera de um visualizador.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const alvoDoEvento = evento.target as HTMLElement | null
      if (alvoDoEvento && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvoDoEvento.tagName)) return
      if (evento.key === 'ArrowRight') trocarPeca(indicePeca + 1)
      else if (evento.key === 'ArrowLeft') trocarPeca(indicePeca - 1)
      else if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        passarMarcador(1)
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        passarMarcador(-1)
      } else if (evento.key === 'Escape') selecionarMarcador(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [indicePeca, trocarPeca, selecionarMarcador, passarMarcador])

  const agrupadas = useMemo(() => {
    const grupos = new Map<string, Colecao[]>()
    for (const item of colecoes) {
      const grupo = item.breadcrumb.length > 1 ? item.breadcrumb[0] : 'Coleções'
      grupos.set(grupo, [...(grupos.get(grupo) || []), item])
    }
    return [...grupos.entries()]
  }, [colecoes])

  // O mesmo índice serve a coluna fixa do desktop e a gaveta do celular. Manter
  // duas cópias garantiria que uma delas envelhecesse sem ninguém notar.
  const indice = (
    <nav className="space-y-2">
      {agrupadas.map(([grupo, itens]) => (
        <div key={grupo}>
          <p className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground/70">
            {grupo}
          </p>
          <div className="space-y-0.5">
            {itens.map(item => {
              const ativa = item.slug === colecao?.slug
              const total = item.pieces?.length || 0
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => {
                    setIndiceVisivel(false)
                    if (ativa) return
                    onAbrirColecao(item.slug)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl px-2.5 py-2 text-left transition ${
                    ativa
                      ? 'bg-primary/12 text-foreground ring-1 ring-inset ring-primary/25'
                      : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
                  }`}
                >
                  <span className="min-w-0 truncate text-[13px] font-semibold leading-tight">{item.title}</span>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      ativa ? 'bg-primary/20 text-primary' : 'bg-foreground/[0.06] text-muted-foreground/70'
                    }`}
                  >
                    {total}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <main className="surface-page anatomia-ambiente min-h-screen pb-24 xl:pb-0">
      {/* ── Barra superior ── */}
      {/* O AppShell mantém controles flutuantes fixos nos cantos superiores
          (menu à esquerda abaixo de `lg`, tema e modo leve à direita). A barra
          reserva esse espaço para não ter botão coberto em nenhuma largura. */}
      <header className="anatomia-barra sticky top-0 z-40">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 py-2.5 pl-[3.75rem] pr-[9.75rem] sm:gap-3 sm:py-3 lg:pl-4">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="tecla flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs font-semibold text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Sistemas</span>
          </button>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={onVoltarParaRegioes}
              className="flex max-w-full items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary transition hover:text-primary/75"
            >
              <span className="truncate">{sistema.title}</span>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
              <span className="hidden shrink-0 sm:inline">regiões</span>
            </button>
            <h1 className="truncate font-heading text-base font-semibold leading-tight sm:text-lg">
              {colecao?.title || sistema.title}
            </h1>
          </div>

          <div className="relative hidden min-w-0 max-w-sm flex-1 lg:block">
            <BuscaDeEstrutura valor={busca} onMudar={setBusca} resultados={resultados} onAbrir={abrirResultado} />
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <BotaoQuiz sistemaSlug={sistema.slug} />
            <SegmentoModoEstudo ativo={modoEstudo} onMudar={setModoEstudo} />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>

        {/* Em telas estreitas, busca e ações descem para uma segunda linha, que
            usa a largura inteira sem disputar espaço com os flutuantes. */}
        <div className="flex items-center gap-2 border-t border-border/50 px-3 py-2 lg:hidden">
          <div className="min-w-0 flex-1">
            <BuscaDeEstrutura valor={busca} onMudar={setBusca} resultados={resultados} onAbrir={abrirResultado} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <BotaoQuiz sistemaSlug={sistema.slug} />
            <SegmentoModoEstudo ativo={modoEstudo} onMudar={setModoEstudo} compacto />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 sm:py-5 xl:grid-cols-[264px_minmax(0,1fr)_390px]">
        {/* ── Índice de coleções (coluna fixa no desktop largo) ── */}
        <aside className="hidden xl:sticky xl:top-[84px] xl:block xl:max-h-[calc(100vh-100px)] xl:overflow-y-auto">
          <div className="vidro vidro-brilho relevo rounded-[22px] p-2">{indice}</div>
        </aside>

        {/* ── Palco ── */}
        <section ref={palcoRef} className="min-w-0 scroll-mt-24">
          {colecao && peca ? (
            <>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {colecao.breadcrumb.slice(0, -1).join(' · ') || sistema.title}
                  </p>
                  <h2 className="font-heading text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                    {colecao.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{peca.title}</p>
                </div>
                <span className="vidro inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" />
                  {indicePeca + 1} / {pecas.length}
                </span>
              </div>

              <PranchaInterativa
                imagem={peca.image}
                alt={`${colecao.title}: ${peca.title}`}
                marcadores={peca.markers}
                indiceAtivo={indiceMarcador}
                onSelecionar={selecionarMarcador}
                modoEstudo={modoEstudo}
                chaveDaPeca={peca.id}
                prioridade
              />

              {/* Navegação entre pranchas — só existe quando há mais de uma. */}
              {pecas.length > 1 && (
                <div className="vidro vidro-brilho relevo mt-3 flex items-center gap-2 rounded-[22px] p-2">
                  <button
                    type="button"
                    onClick={() => trocarPeca(indicePeca - 1)}
                    disabled={indicePeca === 0}
                    className="tecla flex h-10 w-10 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Prancha anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {pecas.map((item, posicao) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => trocarPeca(posicao)}
                        title={item.title}
                        className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-slate-950 transition ${
                          posicao === indicePeca
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <Image src={item.image} alt="" fill sizes="56px" className="object-contain" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => trocarPeca(indicePeca + 1)}
                    disabled={indicePeca >= pecas.length - 1}
                    className="tecla flex h-10 w-10 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Próxima prancha"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Lista de estruturas da prancha */}
              <div className="vidro vidro-brilho relevo mt-3 rounded-[22px] p-3 sm:p-4">
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                    Estruturas desta prancha
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground/70">{peca.markers.length}</span>
                </div>
                {peca.markers.length === 0 ? (
                  <p className="py-2 text-sm text-muted-foreground">Esta prancha não tem marcadores no acervo.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {peca.markers.map((item, posicao) => {
                      const ativo = posicao === indiceMarcador
                      return (
                        <button
                          key={`${item.title}-${posicao}`}
                          type="button"
                          onClick={() => selecionarMarcador(ativo ? null : posicao)}
                          data-marcado={ativo ? 'true' : 'false'}
                          className={`vidro-pastilha inline-flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-left text-xs font-medium ${
                            ativo ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                              ativo ? 'bg-primary text-primary-foreground' : 'bg-foreground/[0.07] text-muted-foreground'
                            }`}
                          >
                            {posicao + 1}
                          </span>
                          {modoEstudo && !ativo ? '• • •' : item.title}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Ficha embutida em telas médias (a lateral só existe no xl) */}
              <div className="mt-3 xl:hidden">
                <PainelDaFicha
                  marcador={marcador}
                  insight={insight}
                  numero={(indiceMarcador || 0) + 1}
                  chave={`${peca?.id}:${indiceMarcador}`}
                  compacta
                />
              </div>
            </>
          ) : (
            <div className="vidro flex min-h-[400px] items-center justify-center rounded-[22px] !border-dashed p-8 text-center text-sm text-muted-foreground">
              Escolha uma coleção no índice para abrir as pranchas.
            </div>
          )}
        </section>

        {/* ── Ficha (desktop largo) ── */}
        <aside className="hidden xl:block">
          <div className="sticky top-[84px] max-h-[calc(100vh-100px)] overflow-y-auto pb-4">
            <PainelDaFicha
              marcador={marcador}
              insight={insight}
              numero={(indiceMarcador || 0) + 1}
              chave={`${peca?.id}:${indiceMarcador}`}
            />
            <div className="vidro mt-3 rounded-2xl p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Uso educacional
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Pranchas do acervo, com autorização de uso integral. Os aprofundamentos de cada estrutura são conteúdo
                editorial do GradeX e não substituem avaliação clínica.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Índice como gaveta (abaixo do xl) ──
          Antes ele empurrava a prancha para fora da tela ao abrir; agora sobe
          por cima, some ao escolher e devolve a peça no mesmo lugar.

          Vai pelo `Portal` porque a página inteira vive dentro de
          `.anatomia-ambiente`, que isola o contexto de empilhamento para prender
          as manchas de cor do fundo. Lá dentro, nenhum `z-index` alcança os
          botões flutuantes do shell. Ver components/ui/portal.tsx. */}
      {indiceVisivel && (
        <Portal>
          <div className="fixed inset-0 z-50 xl:hidden">
            <button
              type="button"
              aria-label="Fechar índice"
              onClick={() => setIndiceVisivel(false)}
              className="absolute inset-0 bg-slate-950/45"
            />
            <div className="anatomia-gaveta absolute inset-x-0 bottom-0 max-h-[76vh] overflow-y-auto rounded-t-[28px] p-3 pb-6">
              <div className="mb-2 flex flex-col items-center gap-2">
                <span className="anatomia-puxador" aria-hidden />
                <div className="flex w-full items-center justify-between gap-3 px-1">
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                    Coleções de {sistema.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIndiceVisivel(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground transition hover:text-foreground"
                    aria-label="Fechar índice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {indice}
            </div>
          </div>
        </Portal>
      )}

      {/* ── Gaveta da ficha (celular e tablet) ── */}
      {marcador && (
        <Portal>
          <div className={`fixed inset-x-0 bottom-0 z-50 xl:hidden ${gavetaAberta ? '' : 'pointer-events-none'}`}>
            <div
              className={`transition-transform duration-300 ease-out ${
                gavetaAberta ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="anatomia-gaveta mx-auto max-h-[74vh] max-w-3xl overflow-y-auto rounded-t-[28px]">
                <div className="sticky top-0 z-10 flex flex-col items-center gap-2 border-b border-border/50 px-3 pb-2 pt-2.5">
                  <span className="anatomia-puxador" aria-hidden />
                  <div className="flex w-full items-center justify-between gap-2">
                    {/* Folhear as estruturas da prancha sem fechar a ficha: é o
                        gesto de quem estuda a peça inteira, e não uma só. */}
                    <div className="anatomia-segmento h-9">
                      <button
                        type="button"
                        onClick={() => passarMarcador(-1)}
                        className="anatomia-segmento-item h-full w-9"
                        aria-label="Estrutura anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 text-[11px] font-bold tabular-nums text-muted-foreground">
                        {(indiceMarcador ?? 0) + 1}/{peca?.markers.length ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => passarMarcador(1)}
                        className="anatomia-segmento-item h-full w-9"
                        aria-label="Próxima estrutura"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGavetaAberta(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/[0.07] text-muted-foreground transition hover:text-foreground"
                      aria-label="Fechar ficha"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <PainelDaFicha
                    marcador={marcador}
                    insight={insight}
                    numero={(indiceMarcador || 0) + 1}
                    chave={`${peca?.id}:${indiceMarcador}`}
                    compacta
                  />
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </main>
  )
}

/** Atalho para treinar exatamente o sistema que está aberto. */
function BotaoQuiz({ sistemaSlug }: { sistemaSlug: string }) {
  return (
    <Link
      href={`/anatomia/atlas-anatomia/quiz?sistema=${sistemaSlug}`}
      title="Treinar identificação das estruturas deste sistema"
      className="tecla flex h-9 shrink-0 items-center gap-1.5 px-2.5 text-xs font-bold text-primary"
      data-marcado="true"
    >
      <Target className="h-4 w-4" />
      <span className="hidden xl:inline">Treinar</span>
    </Link>
  )
}

/**
 * Modo estudo como segmentado, e não como interruptor.
 *
 * O botão de olho anterior dizia o estado com um ícone que troca — e ícone que
 * troca é ambíguo: o olho fechado significa "está escondido" ou "toque para
 * esconder"? Os dois rótulos lado a lado mostram as duas opções e qual delas
 * está valendo, sem depender de memória.
 */
function SegmentoModoEstudo({
  ativo,
  onMudar,
  compacto,
}: {
  ativo: boolean
  onMudar: (valor: boolean) => void
  compacto?: boolean
}) {
  return (
    <div
      className="anatomia-segmento h-9 shrink-0"
      role="group"
      aria-label="Rótulos das estruturas na prancha"
      title="Esconde os nomes para você tentar nomear cada estrutura antes de conferir"
    >
      <button
        type="button"
        onClick={() => onMudar(false)}
        data-ativo={!ativo}
        aria-pressed={!ativo}
        className="anatomia-segmento-item h-full px-2.5 text-[11px] font-bold"
      >
        <Eye className="h-3.5 w-3.5" />
        {!compacto && <span className="hidden xl:inline">Ver nomes</span>}
      </button>
      <button
        type="button"
        onClick={() => onMudar(true)}
        data-ativo={ativo}
        aria-pressed={ativo}
        className="anatomia-segmento-item h-full px-2.5 text-[11px] font-bold"
      >
        <EyeOff className="h-3.5 w-3.5" />
        {!compacto && <span className="hidden xl:inline">Modo estudo</span>}
      </button>
    </div>
  )
}

function BotaoIndice({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label="Abrir índice de coleções"
      data-marcado={ativo ? 'true' : 'false'}
      className="tecla flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground xl:hidden"
    >
      <LayoutGrid className="h-4 w-4" />
    </button>
  )
}

/* ══════════════════════════ Carregamento do acervo ══════════════════════════ */

function Esperando({ mensagem }: { mensagem: string }) {
  return (
    <main className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{mensagem}</p>
    </main>
  )
}

function Falhou({ mensagem, onTentarDeNovo }: { mensagem: string; onTentarDeNovo: () => void }) {
  return (
    <main className="surface-page flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="font-heading text-lg font-semibold">{mensagem}</p>
      <button
        type="button"
        onClick={onTentarDeNovo}
        className="mt-1 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
      >
        Tentar de novo
      </button>
    </main>
  )
}

/**
 * Busca o sistema pedido e entrega a tela certa.
 *
 * Enquanto o acervo não chega, a tela mostra que está buscando em vez de piscar
 * um layout vazio. Na segunda visita ao mesmo sistema não há espera nenhuma: o
 * `carregarAcervo` guarda a resposta.
 */
export default function AtlasEstudo({
  sistemaSlug,
  slugColecao,
  alvo,
  onAbrirColecao,
  onVoltarParaRegioes,
  onTrocarSistema,
}: {
  sistemaSlug: string
  slugColecao: string
  /** Prancha (e estrutura) em que abrir — vem da URL, para o link ser direto. */
  alvo?: AlvoDeAbertura
  onAbrirColecao: (slug: string, alvo?: AlvoDeAbertura) => void
  onVoltarParaRegioes: () => void
  onTrocarSistema: () => void
}) {
  const [sistema, setSistema] = useState<AtlasSystem | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    setSistema(null)
    setErro(null)
    carregarAcervo(sistemaSlug)
      .then(([encontrado]) => {
        if (ativo) setSistema(encontrado)
      })
      .catch((falha: unknown) => {
        if (!ativo) return
        setErro(falha instanceof AcervoIndisponivel ? falha.message : 'Não foi possível carregar o acervo do Atlas.')
      })
    return () => {
      ativo = false
    }
  }, [sistemaSlug, tentativa])

  // O texto das fichas é o pedaço mais pesado da seção e só é usado depois de um
  // toque no marcador: começa a vir agora, em paralelo com o acervo.
  useEffect(() => {
    prepararMotorDeFichas().catch(() => {})
  }, [])

  if (erro) return <Falhou mensagem={erro} onTentarDeNovo={() => setTentativa(numero => numero + 1)} />
  if (!sistema) return <Esperando mensagem="Carregando o acervo do sistema…" />

  const colecaoValida = folhas(sistema).some(item => item.slug === slugColecao)
  if (!colecaoValida) {
    return (
      <EscolhaDeRegiao
        key={sistema.slug}
        sistema={sistema}
        onAbrirColecao={onAbrirColecao}
        onTrocarSistema={onTrocarSistema}
      />
    )
  }

  return (
    <AreaDeEstudo
      key={`${sistema.slug}:${slugColecao}`}
      sistema={sistema}
      slugColecao={slugColecao}
      alvo={alvo}
      onAbrirColecao={onAbrirColecao}
      onVoltarParaRegioes={onVoltarParaRegioes}
      onTrocarSistema={onTrocarSistema}
    />
  )
}
