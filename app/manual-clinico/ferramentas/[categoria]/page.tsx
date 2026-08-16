'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Loader2, Search, Star, X } from 'lucide-react'
import {
  CATEGORIAS,
  CATEGORIA_POR_ID,
  buscar,
  carregarModulo,
  ehCategoria,
  ferramentasDaCategoria,
  normalizar,
  type CategoriaId,
  type Ferramenta,
} from '@/lib/ferramentas-clinicas'
import { ICONES, ICONE_PADRAO, tema } from '@/components/ferramentas-clinicas/tema'
import { BarraFerramentas } from '@/components/ferramentas-clinicas/barra-superior'
import { useFavoritos } from '@/components/ferramentas-clinicas/use-favoritos'
import { useAcessoFerramentas } from '@/components/ferramentas-clinicas/use-acesso'
import { VitrineFerramentas } from '@/components/ferramentas-clinicas/vitrine'

/**
 * A lista de uma área.
 *
 * Esta página era uma sanfona: as 21 ferramentas de infectologia empilhadas, e
 * abrir uma delas desdobrava ali mesmo um painel de tela inteira — campos,
 * resultado, fórmula, fundamento, armadilhas e referências. Bastava abrir duas
 * para a página virar um rolo de vários metros em que ninguém achava mais nada,
 * e o item aberto empurrava todos os outros para longe.
 *
 * Agora ela faz uma coisa só, e bem: ser o índice da área. Cada ferramenta é um
 * cartão que leva à página dela. A sanfona virou navegação — o que dá endereço
 * próprio a cada calculadora, botão de voltar que funciona, e uma lista que não
 * muda de tamanho embaixo do dedo.
 */
export default function CategoriaFerramentasPage() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Conteudo />
    </AppShell>
  )
}

/**
 * Endereços antigos no formato `?f=<id>` continuam funcionando.
 *
 * Eles foram copiados pelo botão "copiar link", colados em conversa e salvos em
 * favorito do navegador. Quebrá-los agora seria transformar a melhoria numa
 * perda para quem mais usava a seção — então eles são redirecionados para a
 * página própria da ferramenta.
 *
 * Lido de `window.location` e não de `useSearchParams()` de propósito: o hook
 * obriga a página a desistir da renderização no servidor, e as 15 categorias,
 * que são pré-renderizadas no build, passariam a chegar ao navegador como HTML
 * vazio.
 */
function ancoraDaUrl(): string | null {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('f')
}

function Conteudo() {
  const params = useParams<{ categoria: string }>()
  const router = useRouter()
  const id = (params?.categoria ?? '') as CategoriaId
  const valida = ehCategoria(id)
  const categoria = valida ? CATEGORIA_POR_ID[id] : null

  const [ferramentas, setFerramentas] = useState<Ferramenta[] | null>(null)
  const [erro, setErro] = useState(false)
  const [busca, setBusca] = useState('')
  const { ehFavorito, sincronizar } = useFavoritos()
  const { loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoFerramentas()

  const prontoAcesso = carregado && !carregandoShell
  const temAcesso = dados?.access?.hasFullAccess === true

  // Link antigo com `?f=`: vai direto para a página da ferramenta.
  useEffect(() => {
    const alvo = ancoraDaUrl()
    if (alvo) router.replace(`/manual-clinico/ferramentas/${id}/${alvo}`)
  }, [id, router])

  /**
   * Carrega o módulo desta categoria e os das ferramentas emprestadas de outras
   * áreas. É o preço de deixar uma ferramenta aparecer em mais de um lugar sem
   * duplicá-la: quem abre "Emergência" também paga pelos chunks de gasometria e
   * cardiologia, mas só uma vez e só ao abrir.
   */
  useEffect(() => {
    // Sem acesso a página mostra a vitrine, e baixar os 15 módulos de conteúdo
    // para ninguém ver seria pagar o peso inteiro do produto na página de vendas.
    if (!valida || !temAcesso) return
    let ativo = true
    const outras = CATEGORIAS.map((c) => c.id).filter((c) => c !== id)
    Promise.all([carregarModulo(id), ...outras.map((c) => carregarModulo(c))])
      .then((listas) => {
        if (!ativo) return
        const vistos = new Set<string>()
        const todas: Ferramenta[] = []
        for (const lista of listas) {
          for (const f of lista) {
            if (vistos.has(f.id)) continue
            vistos.add(f.id)
            todas.push(f)
          }
        }
        setFerramentas(ferramentasDaCategoria(todas, id))
      })
      .catch(() => ativo && setErro(true))
    return () => {
      ativo = false
    }
  }, [id, valida, temAcesso])

  // Os favoritos guardam um retrato do texto de cada ferramenta. Com o módulo
  // desta área já carregado, aproveita para renovar o que tiver envelhecido —
  // `sincronizar` só grava se algo mudou de fato.
  useEffect(() => {
    if (ferramentas) sincronizar(ferramentas)
  }, [ferramentas, sincronizar])

  const visiveis = useMemo(() => {
    if (!ferramentas) return []
    const t = normalizar(busca)
    if (t.length < 2) return ferramentas
    return buscar(ferramentas, busca, 200).map((r) => r.ferramenta)
  }, [ferramentas, busca])

  const proprias = useMemo(() => visiveis.filter((f) => f.categorias[0] === id), [visiveis, id])
  const emprestadas = useMemo(() => visiveis.filter((f) => f.categorias[0] !== id), [visiveis, id])

  if (!valida || !categoria) return null

  if (!prontoAcesso) {
    return (
      <div className="surface-page flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Link direto para uma área sem ter acesso: mostra a vitrine já dizendo qual
  // área a pessoa tentou abrir, em vez de jogá-la num índice genérico.
  if (!temAcesso) {
    return (
      <div className="surface-page min-h-screen">
        <BarraFerramentas voltarHref="/manual-clinico" voltarLabel="Voltar ao Manual Clínico" />
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <VitrineFerramentas
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={dados?.isAuthenticated ?? false}
            planos={dados?.product?.plans ?? []}
            precoAvulso={dados?.product?.currentPrice ?? dados?.product?.price ?? 0}
            produtoAtivo={dados?.product?.isActive ?? false}
            resumo={dados?.resumo}
            areaAlvo={categoria.nome}
          />
        </div>
      </div>
    )
  }

  const t = tema(categoria.cor)
  const Icone = ICONES[categoria.icone] || ICONE_PADRAO

  const indice = CATEGORIAS.findIndex((c) => c.id === id)
  const anterior = CATEGORIAS[(indice - 1 + CATEGORIAS.length) % CATEGORIAS.length]
  const proxima = CATEGORIAS[(indice + 1) % CATEGORIAS.length]

  return (
    <div className="surface-page min-h-screen">
      <BarraFerramentas
        voltarHref="/manual-clinico/ferramentas"
        voltarLabel="Todas as ferramentas"
        titulo={categoria.nome}
        subtitulo={`${categoria.total} ferramentas`}
      />

      {/* ══════════════════════════ CABEÇALHO ══════════════════════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className={`absolute inset-0 bg-gradient-to-b ${t.grad}`} aria-hidden />
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-7 pt-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 rounded-xl border ${t.border} ${t.bg} p-3`}>
              <Icone className={`h-6 w-6 ${t.text}`} />
            </div>
            <div className="min-w-0">
              <p className="editorial-mark mb-1.5">Ferramentas Clínicas</p>
              <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                {categoria.nome}
              </h1>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {categoria.total} ferramenta{categoria.total !== 1 ? 's' : ''} · {categoria.subtitulo}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {categoria.descricao}
          </p>

          <div className="group relative mt-5 flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors focus-within:border-primary/50">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder={`Filtrar em ${categoria.nome.toLowerCase()}...`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="h-11 border-0 bg-transparent pl-10 pr-10 text-sm ring-0 placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
              aria-label="Filtrar ferramentas desta categoria"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-muted p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Limpar filtro"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════ LISTA ══════════════════════════ */}
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {erro ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Não foi possível carregar as ferramentas desta área. Recarregue a página.
          </p>
        ) : !ferramentas ? (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : visiveis.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma ferramenta desta área corresponde a &ldquo;{busca}&rdquo;.
          </p>
        ) : (
          <>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {proprias.map((f) => (
                <CartaoFerramenta
                  key={f.id}
                  ferramenta={f}
                  categoriaAtual={id}
                  cor={categoria.cor}
                  favorito={ehFavorito(f.id)}
                />
              ))}
            </div>

            {emprestadas.length > 0 && (
              <div className="mt-10">
                <div className="mb-4">
                  <p className="editorial-mark mb-1.5">Também se aplicam aqui</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ferramentas que moram em outra área do Manual, mas que fazem parte do raciocínio desta.
                  </p>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {emprestadas.map((f) => (
                    <CartaoFerramenta
                      key={f.id}
                      ferramenta={f}
                      categoriaAtual={id}
                      cor={CATEGORIA_POR_ID[f.categorias[0]]?.cor ?? categoria.cor}
                      favorito={ehFavorito(f.id)}
                      mostrarArea
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════ NAVEGAÇÃO ══════════════════════════ */}
        <nav className="mt-12 grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
          <Link
            href={`/manual-clinico/ferramentas/${anterior.id}`}
            prefetch={false}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/35"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:-translate-x-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">Anterior</p>
              <p className="truncate text-sm font-semibold">{anterior.nome}</p>
            </div>
          </Link>
          <Link
            href={`/manual-clinico/ferramentas/${proxima.id}`}
            prefetch={false}
            className="group flex items-center justify-end gap-3 rounded-xl border border-border bg-card p-4 text-right transition-colors hover:border-primary/35"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">Próxima</p>
              <p className="truncate text-sm font-semibold">{proxima.nome}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </nav>

        <p className="mt-8 border-t border-border pt-6 text-center text-xs leading-relaxed text-muted-foreground">
          Material educacional. Escores descrevem probabilidades em populações e não substituem julgamento clínico,
          protocolo institucional nem a bula do medicamento.
        </p>
      </div>
    </div>
  )
}

/**
 * Um item do índice.
 *
 * Cartão inteiro clicável, altura previsível e resumo em duas linhas: a lista
 * precisa ser varrida com o olho, e para isso as linhas têm que ser
 * comparáveis. A estrela aparece só como marca de favorito — alternar continua
 * dentro da ferramenta, onde a decisão de salvar de fato acontece.
 */
function CartaoFerramenta({
  ferramenta,
  categoriaAtual,
  cor,
  favorito,
  mostrarArea = false,
}: {
  ferramenta: Ferramenta
  categoriaAtual: CategoriaId
  cor: string
  favorito?: boolean
  mostrarArea?: boolean
}) {
  const t = tema(cor)
  const area = CATEGORIA_POR_ID[ferramenta.categorias[0]]

  return (
    <Link
      href={`/manual-clinico/ferramentas/${categoriaAtual}/${ferramenta.id}`}
      prefetch={false}
      className={`group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.hoverBorder}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {ferramenta.nome}
          </h3>
          {ferramenta.sigla && (
            <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${t.bg} ${t.text}`}>
              {ferramenta.sigla}
            </span>
          )}
          {favorito && (
            <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber-500" aria-label="Nos favoritos" />
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{ferramenta.resumo}</p>
        {mostrarArea && area && (
          <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/60">{area.nome}</p>
        )}
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  )
}
