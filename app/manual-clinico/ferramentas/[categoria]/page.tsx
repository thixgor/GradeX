'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, ChevronsDownUp, Loader2, Search, X } from 'lucide-react'
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
import { PainelFerramenta } from '@/components/ferramentas-clinicas/painel'
import { useFavoritos } from '@/components/ferramentas-clinicas/use-favoritos'
import { useAcessoFerramentas } from '@/components/ferramentas-clinicas/use-acesso'
import { VitrineFerramentas } from '@/components/ferramentas-clinicas/vitrine'

export default function CategoriaFerramentasPage() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Conteudo />
    </AppShell>
  )
}

/**
 * O `?f=` que a busca da página anterior usa para abrir direto numa ferramenta.
 *
 * Lido de `window.location.search` em vez de `useSearchParams()` de propósito:
 * o hook obriga a página a "desistir" da renderização no servidor (bailout para
 * CSR), e as 16 categorias, que são pré-renderizadas no build, passavam a
 * chegar ao navegador como HTML vazio — a pessoa via um carregando enquanto o
 * JS montava uma página cujo conteúdo já existia pronto. Este parâmetro só
 * decide para onde rolar depois que a lista já está na tela; nada do que é
 * renderizado depende dele.
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
  const [abertos, setAbertos] = useState<Set<string>>(new Set())
  const [ancorado, setAncorado] = useState<string | null>(null)
  const ancoraRef = useRef<string | null>(ancoraDaUrl())
  const { alternar: alternarFavorito, ehFavorito, sincronizar } = useFavoritos()
  const { loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoFerramentas()

  const prontoAcesso = carregado && !carregandoShell
  const temAcesso = dados?.access?.hasFullAccess === true

  /**
   * Carrega o módulo desta categoria e, se houver, os módulos das ferramentas
   * emprestadas de outras áreas. É o preço de deixar uma ferramenta aparecer em
   * mais de um lugar sem duplicá-la: quem abre "Emergência" também paga pelos
   * chunks de gasometria e cardiologia, mas só uma vez e só ao abrir.
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

  // Abre e rola até a ferramenta indicada em `?f=`, uma única vez.
  useEffect(() => {
    const alvo = ancoraRef.current
    if (!alvo || !ferramentas) return
    if (!ferramentas.some((f) => f.id === alvo)) return
    setAbertos(new Set([alvo]))
    setAncorado(alvo)
    ancoraRef.current = null
    requestAnimationFrame(() => {
      document.getElementById(`f-${alvo}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    const timer = setTimeout(() => setAncorado(null), 2600)
    return () => clearTimeout(timer)
  }, [ferramentas])

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
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4 pb-4 pt-16 sm:pt-6">
            <button
              onClick={() => router.push('/manual-clinico')}
              className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
            </button>
          </div>
        </div>
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

  const alternar = (fid: string) =>
    setAbertos((atual) => {
      const novo = new Set(atual)
      if (novo.has(fid)) novo.delete(fid)
      else novo.add(fid)
      return novo
    })

  const indice = CATEGORIAS.findIndex((c) => c.id === id)
  const anterior = CATEGORIAS[(indice - 1 + CATEGORIAS.length) % CATEGORIAS.length]
  const proxima = CATEGORIAS[(indice + 1) % CATEGORIAS.length]

  return (
    <div className="surface-page min-h-screen">
      {/* ══════════════════════════ CABEÇALHO ══════════════════════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className={`absolute inset-0 bg-gradient-to-b ${t.grad}`} aria-hidden />
        {/* `pt-16` no celular pelo mesmo motivo da página índice: os botões
            flutuantes do AppShell ocupam os 52px do topo. */}
        <div className="container relative z-10 mx-auto max-w-5xl px-4 pb-8 pt-16 sm:pt-8">
          <button
            onClick={() => router.push('/manual-clinico/ferramentas')}
            className="-m-2 mb-4 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Todas as ferramentas
          </button>

          <div className="flex items-start gap-4">
            <div className={`shrink-0 rounded-xl border ${t.border} ${t.bg} p-3`}>
              <Icone className={`h-6 w-6 ${t.text}`} />
            </div>
            <div className="min-w-0">
              <p className="editorial-mark mb-1.5">Ferramentas Clínicas</p>
              <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{categoria.nome}</h1>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {categoria.total} ferramenta{categoria.total !== 1 ? 's' : ''} · {categoria.subtitulo}
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{categoria.descricao}</p>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="group relative flex flex-1 items-center overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors focus-within:border-primary/50">
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
            {abertos.size > 0 && (
              <button
                onClick={() => setAbertos(new Set())}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
              >
                <ChevronsDownUp className="h-4 w-4" /> Fechar todas
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
          <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : visiveis.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Nenhuma ferramenta desta área corresponde a &ldquo;{busca}&rdquo;.
          </p>
        ) : (
          <>
            <div className="space-y-2.5">
              {proprias.map((f) => (
                <PainelFerramenta
                  key={f.id}
                  ferramenta={f}
                  cor={categoria.cor}
                  aberto={abertos.has(f.id)}
                  onToggle={() => alternar(f.id)}
                  ancora={ancorado === f.id}
                  favorito={ehFavorito(f.id)}
                  onFavoritar={() => alternarFavorito(f)}
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
                <div className="space-y-2.5">
                  {emprestadas.map((f) => (
                    <PainelFerramenta
                      key={f.id}
                      ferramenta={f}
                      cor={CATEGORIA_POR_ID[f.categorias[0]]?.cor ?? categoria.cor}
                      aberto={abertos.has(f.id)}
                      onToggle={() => alternar(f.id)}
                      ancora={ancorado === f.id}
                      favorito={ehFavorito(f.id)}
                      onFavoritar={() => alternarFavorito(f)}
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
