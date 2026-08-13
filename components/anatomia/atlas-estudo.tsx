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
  Sparkles,
  Target,
  X,
} from 'lucide-react'

type Colecao = AtlasCollection & { breadcrumb: string[] }

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

function contarPranchas(sistema: AtlasSystem) {
  return folhas(sistema).reduce((total, colecao) => total + (colecao.pieces?.length || 0), 0)
}

/* ══════════════════════════ Escolha da região ══════════════════════════ */

/**
 * Passo entre o sistema e a prancha.
 *
 * Antes, escolher "Esquelético" jogava o aluno direto na primeira coleção do
 * crânio, e a existência de Tronco, Membro Superior e Membro Inferior só ficava
 * visível para quem abrisse o índice lateral. Agora o sistema mostra do que ele
 * é feito, e o aluno escolhe por onde entrar.
 */
function EscolhaDeRegiao({
  sistema,
  onAbrirColecao,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  onAbrirColecao: (slug: string) => void
  onTrocarSistema: () => void
}) {
  const listaRegioes = useMemo(() => regioes(folhas(sistema)), [sistema])
  const totalPranchas = listaRegioes.reduce((total, regiao) => total + regiao.pranchas, 0)
  const totalMarcadores = listaRegioes.reduce((total, regiao) => total + regiao.marcadores, 0)

  return (
    <main className="surface-page min-h-screen">
      <header className="relative isolate overflow-hidden border-b border-border bg-slate-950">
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

        <div className="relative mx-auto max-w-6xl px-4 pb-9 pt-7 sm:pb-12 sm:pt-9">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Todos os sistemas
          </button>

          <div className="mb-3">
            <p className="editorial-mark !text-amber-300">Sistema {sistema.title}</p>
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl">
            Por onde você quer começar?
          </h1>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-white/65">
            {listaRegioes.length} {listaRegioes.length === 1 ? 'região' : 'regiões'} · {totalPranchas} pranchas ·{' '}
            {totalMarcadores.toLocaleString('pt-BR')} estruturas marcadas.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-7 sm:py-10">
        <Link
          href={`/anatomia/atlas-anatomia/quiz?sistema=${sistema.slug}`}
          className="group mb-5 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.07] p-4 transition hover:border-primary/50 hover:bg-primary/10"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Target className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-heading text-lg font-semibold leading-tight tracking-tight">
              Já estudou? Teste-se
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              O marcador aparece sem rótulo e você identifica a estrutura — com resposta comentada em cada questão.
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
        </Link>

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
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
              <div
                key={regiao.titulo}
                className="flex flex-col rounded-2xl border border-border bg-card p-4 transition hover:border-primary/35"
              >
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Layers className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold leading-tight tracking-tight">{regiao.titulo}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {regiao.colecoes.length} coleç{regiao.colecoes.length !== 1 ? 'ões' : 'ão'} ·{' '}
                      {regiao.pranchas} pranchas
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  {regiao.colecoes.map(colecao => (
                    <button
                      key={colecao.slug}
                      type="button"
                      onClick={() => onAbrirColecao(colecao.slug)}
                      className="group flex w-full items-center justify-between gap-2 rounded-xl border border-transparent bg-muted/40 px-3 py-2 text-left transition hover:border-primary/30 hover:bg-primary/10"
                    >
                      <span className="min-w-0 truncate text-[13px] font-semibold">{colecao.title}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
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

interface Resultado {
  colecao: Colecao
  peca: AtlasPiece
  indicePeca: number
  indiceMarcador: number
  titulo: string
}

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
  return (
    <FichaMarcador titulo={marcador.title} numero={numero} insight={insight} chave={chave} compacta={compacta} />
  )
}

function AreaDeEstudo({
  sistema,
  slugColecao,
  onAbrirColecao,
  onVoltarParaRegioes,
  onTrocarSistema,
}: {
  sistema: AtlasSystem
  slugColecao: string
  onAbrirColecao: (slug: string) => void
  onVoltarParaRegioes: () => void
  onTrocarSistema: () => void
}) {
  const colecoes = useMemo(() => folhas(sistema), [sistema])
  const [indicePeca, setIndicePeca] = useState(0)
  const [indiceMarcador, setIndiceMarcador] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [modoEstudo, setModoEstudo] = useState(false)
  const [gavetaAberta, setGavetaAberta] = useState(false)
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

  /** Busca por estrutura em todo o sistema, e não só na coleção aberta. */
  const resultados = useMemo<Resultado[]>(() => {
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

  const selecionarMarcador = useCallback((indice: number | null) => {
    setIndiceMarcador(indice)
    setGavetaAberta(indice !== null)
  }, [])

  const trocarPeca = useCallback(
    (indice: number) => {
      setIndicePeca(Math.min(Math.max(indice, 0), Math.max(pecas.length - 1, 0)))
      setIndiceMarcador(null)
      setGavetaAberta(false)
    },
    [pecas.length],
  )

  function abrirResultado(resultado: Resultado) {
    if (resultado.colecao.slug !== slugColecao) onAbrirColecao(resultado.colecao.slug)
    setIndicePeca(resultado.indicePeca)
    setIndiceMarcador(resultado.indiceMarcador)
    setGavetaAberta(true)
    setBusca('')
    palcoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Setas trocam de prancha e Esc fecha a ficha — atalhos esperados num visualizador.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const alvo = evento.target as HTMLElement | null
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return
      if (evento.key === 'ArrowRight') trocarPeca(indicePeca + 1)
      else if (evento.key === 'ArrowLeft') trocarPeca(indicePeca - 1)
      else if (evento.key === 'Escape') selecionarMarcador(null)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [indicePeca, trocarPeca, selecionarMarcador])

  const agrupadas = useMemo(() => {
    const grupos = new Map<string, Colecao[]>()
    for (const item of colecoes) {
      const grupo = item.breadcrumb.length > 1 ? item.breadcrumb[0] : 'Coleções'
      grupos.set(grupo, [...(grupos.get(grupo) || []), item])
    }
    return [...grupos.entries()]
  }, [colecoes])

  return (
    <main className="surface-page min-h-screen pb-24 xl:pb-0">
      {/* ── Barra superior ── */}
      {/* O AppShell mantém controles flutuantes fixos nos cantos superiores
          (menu à esquerda abaixo de `lg`, tema e modo leve à direita). A barra
          reserva esse espaço para não ter botão coberto em nenhuma largura. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 py-2.5 pl-[3.75rem] pr-[9.75rem] sm:gap-3 sm:py-3 lg:pl-4">
          <button
            type="button"
            onClick={onTrocarSistema}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
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
            <BotaoModoEstudo ativo={modoEstudo} onClick={() => setModoEstudo(atual => !atual)} />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>

        {/* Em telas estreitas, busca e ações descem para uma segunda linha, que
            usa a largura inteira sem disputar espaço com os flutuantes. */}
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 lg:hidden">
          <div className="min-w-0 flex-1">
            <BuscaDeEstrutura valor={busca} onMudar={setBusca} resultados={resultados} onAbrir={abrirResultado} />
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <BotaoQuiz sistemaSlug={sistema.slug} />
            <BotaoModoEstudo ativo={modoEstudo} onClick={() => setModoEstudo(atual => !atual)} />
            <BotaoIndice ativo={indiceVisivel} onClick={() => setIndiceVisivel(atual => !atual)} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-4 px-3 py-4 sm:px-4 sm:py-5 xl:grid-cols-[264px_minmax(0,1fr)_390px]">
        {/* ── Índice de coleções ── */}
        <aside
          className={`${indiceVisivel ? 'block' : 'hidden'} xl:block xl:sticky xl:top-[76px] xl:max-h-[calc(100vh-92px)] xl:overflow-y-auto`}
        >
          <nav className="rounded-2xl border border-border bg-card p-2">
            {agrupadas.map(([grupo, itens]) => (
              <div key={grupo} className="mb-2 last:mb-0">
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
                          onAbrirColecao(item.slug)
                          setIndicePeca(0)
                          setIndiceMarcador(null)
                          setIndiceVisivel(false)
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                          ativa
                            ? 'bg-primary/12 text-foreground ring-1 ring-inset ring-primary/25'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        }`}
                      >
                        <span className="min-w-0 truncate text-[13px] font-semibold leading-tight">{item.title}</span>
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                            ativa ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground/70'
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
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
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

              {/* Navegação entre pranchas */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => trocarPeca(indicePeca - 1)}
                  disabled={indicePeca === 0}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Prancha anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {pecas.map((item, indice) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => trocarPeca(indice)}
                      title={item.title}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-slate-950 transition ${
                        indice === indicePeca
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border opacity-60 hover:opacity-100'
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Próxima prancha"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Lista de estruturas da prancha */}
              <div className="mt-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
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
                    {peca.markers.map((item, indice) => {
                      const ativo = indice === indiceMarcador
                      return (
                        <button
                          key={`${item.title}-${indice}`}
                          type="button"
                          onClick={() => selecionarMarcador(ativo ? null : indice)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition ${
                            ativo
                              ? 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                              : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black tabular-nums ${
                              ativo ? 'bg-amber-500 text-amber-950' : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {indice + 1}
                          </span>
                          {modoEstudo && !ativo ? '• • •' : item.title}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Ficha embutida em telas médias (a lateral só existe no xl) */}
              <div className="mt-4 xl:hidden">
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
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              Escolha uma coleção no índice para abrir as pranchas.
            </div>
          )}
        </section>

        {/* ── Ficha (desktop largo) ── */}
        <aside className="hidden xl:block">
          <div className="sticky top-[76px] max-h-[calc(100vh-92px)] overflow-y-auto pb-4">
            <PainelDaFicha
              marcador={marcador}
              insight={insight}
              numero={(indiceMarcador || 0) + 1}
              chave={`${peca?.id}:${indiceMarcador}`}
            />
            <div className="mt-3 rounded-xl border border-border bg-card p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-foreground">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Uso educacional
              </p>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Pranchas do acervo da UFJF, com autorização de uso integral. Os aprofundamentos de cada estrutura são
                conteúdo editorial do GradeX e não substituem avaliação clínica.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Gaveta do celular ── */}
      {marcador && (
        <div className={`fixed inset-x-0 bottom-0 z-50 xl:hidden ${gavetaAberta ? '' : 'pointer-events-none'}`}>
          <div
            className={`transition-transform duration-300 ease-out ${gavetaAberta ? 'translate-y-0' : 'translate-y-full'}`}
          >
            <div className="mx-auto max-h-[72vh] max-w-3xl overflow-y-auto rounded-t-3xl border-x border-t border-border bg-card shadow-[0_-8px_40px_rgba(0,0,0,0.28)]">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Estrutura selecionada
                </span>
                <button
                  type="button"
                  onClick={() => setGavetaAberta(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                  aria-label="Fechar ficha"
                >
                  <X className="h-4 w-4" />
                </button>
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
      className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-2.5 text-xs font-bold text-primary transition hover:bg-primary/15"
    >
      <Target className="h-4 w-4" />
      <span className="hidden xl:inline">Treinar</span>
    </Link>
  )
}

function BotaoModoEstudo({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      title="Esconde os números da prancha para você tentar nomear cada estrutura"
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition ${
        ativo
          ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      <span className="hidden xl:inline">Modo estudo</span>
    </button>
  )
}

function BotaoIndice({ ativo, onClick }: { ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      aria-label="Abrir índice de coleções"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition xl:hidden ${
        ativo ? 'border-primary/40 bg-primary/12 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      <LayoutGrid className="h-4 w-4" />
    </button>
  )
}

/* ══════════════════════════ Busca ══════════════════════════ */

function BuscaDeEstrutura({
  valor,
  onMudar,
  resultados,
  onAbrir,
}: {
  valor: string
  onMudar: (valor: string) => void
  resultados: Resultado[]
  onAbrir: (resultado: Resultado) => void
}) {
  const [focada, setFocada] = useState(false)
  const aberta = focada && valor.trim().length >= 2

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={valor}
        onChange={evento => onMudar(evento.target.value)}
        onFocus={() => setFocada(true)}
        onBlur={() => window.setTimeout(() => setFocada(false), 150)}
        placeholder="Buscar estrutura neste sistema..."
        aria-label="Buscar estrutura"
        className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-8 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onMudar('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Limpar busca"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {aberta && (
        <div className="absolute inset-x-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl">
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
                className="flex w-full flex-col gap-0.5 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
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
  onAbrirColecao,
  onVoltarParaRegioes,
  onTrocarSistema,
}: {
  sistemaSlug: string
  slugColecao: string
  onAbrirColecao: (slug: string) => void
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
        setErro(
          falha instanceof AcervoIndisponivel ? falha.message : 'Não foi possível carregar o acervo do Atlas.',
        )
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
      onAbrirColecao={onAbrirColecao}
      onVoltarParaRegioes={onVoltarParaRegioes}
      onTrocarSistema={onTrocarSistema}
    />
  )
}
