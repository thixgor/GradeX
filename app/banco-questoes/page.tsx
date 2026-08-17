'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  Database,
  History,
  ListPlus,
  Loader2,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ArvoreDoBanco,
  SELECAO_VAZIA,
  contarSelecionados,
  type SelecaoDaArvore,
} from '@/components/banco/arvore-banco'
import { CartaoDeQuestao, ListaVazia, type QuestaoDoCartao } from '@/components/banco/cartao-questao'
import type {
  BancoDificuldade,
  BancoListaUsuario,
  BancoModoResposta,
  BancoPaginacao,
  BancoQuestaoTipo,
} from '@/lib/types/banco-questoes'

/**
 * Banco de Questões.
 *
 * A página foi refeita em torno de duas decisões:
 *
 * 1. **O catálogo fica visível.** Antes eram quatro `<select>` encadeados
 *    (Período → Módulo → Tópico → Subtópico) em que cada um só ganhava opções
 *    depois do clique anterior — não dava para ver o que existia, só adivinhar.
 *    Agora a árvore inteira aparece à esquerda, com contagem e busca.
 *
 * 2. **Quem é gratuito entra pela mesma porta.** Antes, a primeira tela era um
 *    modal pedindo um período da grade da faculdade, e o servidor sorteava 5
 *    questões daquele período — para sempre. Agora a lista inteira responde
 *    para todo mundo; o que muda é que a questão fechada mostra só o assunto, e
 *    abrir é uma escolha da pessoa.
 *
 * O nível "Período" saiu do produto inteiro. Ver lib/banco/hierarquia.ts.
 */
export default function BancoQuestoesPage() {
  return (
    <AppShell headerTitle="Banco de Questões">
      <Conteudo />
    </AppShell>
  )
}

interface ListaComContagem extends BancoListaUsuario {
  totalQuestoes?: number
}

interface SaldoGratuito {
  restantes: number
  limite: number
  desbloqueadas?: string[]
}

const POR_PAGINA = 20

function Conteudo() {
  const router = useRouter()
  const { isAdmin } = useAppShell()

  const [carregando, setCarregando] = useState(true)
  const [hierarquia, setHierarquia] = useState<{ modulos: any[]; topicos: any[]; subtopicos: any[] }>({
    modulos: [],
    topicos: [],
    subtopicos: [],
  })
  const [selecao, setSelecao] = useState<SelecaoDaArvore>(SELECAO_VAZIA)

  const [questoes, setQuestoes] = useState<QuestaoDoCartao[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(false)
  const [gratuito, setGratuito] = useState<SaldoGratuito | null>(null)
  const [abrindo, setAbrindo] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [tipo, setTipo] = useState<BancoQuestaoTipo | ''>('')
  const [dificuldade, setDificuldade] = useState<BancoDificuldade | ''>('')
  const [anos, setAnos] = useState<number[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])
  const [apenasNaoResolvidas, setApenasNaoResolvidas] = useState(false)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [arvoreAberta, setArvoreAberta] = useState(false)

  const [estatisticas, setEstatisticas] = useState<{ totalResolvidas: number; percentualAcerto: number } | null>(null)
  const [listas, setListas] = useState<ListaComContagem[]>([])

  const [questaoParaLista, setQuestaoParaLista] = useState<string | null>(null)
  const [nomeDaNovaLista, setNomeDaNovaLista] = useState('')
  const [salvandoLista, setSalvandoLista] = useState(false)

  const [sorteioAberto, setSorteioAberto] = useState(false)
  const [sorteio, setSorteio] = useState({
    nome: '',
    quantidade: 10,
    modoResposta: 'imediato' as BancoModoResposta,
    excluirJaResolvidas: false,
  })
  const [sorteando, setSorteando] = useState(false)

  const primeiraCarga = useRef(true)

  const temFiltro =
    contarSelecionados(selecao) > 0 ||
    !!buscaAplicada ||
    !!tipo ||
    !!dificuldade ||
    anos.length > 0 ||
    apenasNaoResolvidas

  const parametros = useMemo(() => {
    const p = new URLSearchParams()
    p.set('limit', String(POR_PAGINA))
    if (selecao.moduloIds.length) p.set('moduloId', selecao.moduloIds.join(','))
    if (selecao.topicoIds.length) p.set('topicoId', selecao.topicoIds.join(','))
    if (selecao.subtopicoIds.length) p.set('subtopicoId', selecao.subtopicoIds.join(','))
    if (tipo) p.set('tipo', tipo)
    if (dificuldade) p.set('dificuldade', dificuldade)
    if (anos.length) p.set('anos', anos.join(','))
    if (apenasNaoResolvidas) p.set('apenasNaoResolvidas', 'true')
    if (buscaAplicada) p.set('busca', buscaAplicada)
    return p
  }, [selecao, tipo, dificuldade, anos, apenasNaoResolvidas, buscaAplicada])

  const carregarQuestoes = useCallback(
    async (pagina = 1) => {
      setCarregandoQuestoes(true)
      try {
        const p = new URLSearchParams(parametros)
        p.set('page', String(pagina))
        const res = await fetch(`/api/banco/questoes?${p.toString()}`, { cache: 'no-store' })
        if (!res.ok) return
        const dados = await res.json()
        setQuestoes((dados.questoes || []).map((q: any) => ({ ...q, _id: String(q._id) })))
        setPaginacao(dados.paginacao || null)
        if (dados.gratuito) setGratuito(dados.gratuito)
      } finally {
        setCarregandoQuestoes(false)
      }
    },
    [parametros],
  )

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const [hierRes, anosRes, statsRes, listasRes] = await Promise.all([
        fetch('/api/banco/hierarquia', { cache: 'no-store' }),
        fetch('/api/banco/anos'),
        fetch('/api/banco/estatisticas'),
        fetch('/api/banco/listas'),
      ])
      if (!vivo) return

      if (hierRes.ok) setHierarquia(await hierRes.json())
      if (anosRes.ok) setAnosDisponiveis((await anosRes.json()).anos || [])
      // Estatística e listas são de assinante; para quem é gratuito a resposta
      // vem vazia ou negada, e a tela simplesmente não mostra a seção.
      if (statsRes.ok) {
        const d = await statsRes.json()
        if (d?.estatisticas) {
          setEstatisticas({
            totalResolvidas: d.estatisticas.totalResolvidas,
            percentualAcerto: d.estatisticas.percentualAcerto,
          })
        }
      }
      if (listasRes.ok) setListas((await listasRes.json()).listas || [])

      await carregarQuestoes(1)
      if (vivo) setCarregando(false)
      primeiraCarga.current = false
    })()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (primeiraCarga.current) return
    carregarQuestoes(1)
  }, [carregarQuestoes])

  async function abrirQuestao(id: string) {
    setAbrindo(id)
    try {
      const res = await fetch(`/api/banco/questoes/${id}/abrir`, { method: 'POST' })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (dados.gratuito) setGratuito(dados.gratuito)
        return
      }
      if (dados.gratuito) setGratuito(dados.gratuito)
      // Abriu: vai direto para a questão. Gastar o saldo e continuar na lista
      // faria a pessoa clicar duas vezes para ver o que acabou de comprar.
      router.push(`/banco-questoes/${id}`)
    } finally {
      setAbrindo(null)
    }
  }

  async function adicionarALista(listaId: string) {
    if (!questaoParaLista) return
    setSalvandoLista(true)
    try {
      const res = await fetch(`/api/banco/listas/${listaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addQuestaoId: questaoParaLista }),
      })
      if (res.ok) {
        setQuestaoParaLista(null)
        await recarregarListas()
      }
    } finally {
      setSalvandoLista(false)
    }
  }

  async function criarListaCom(questaoId: string) {
    if (!nomeDaNovaLista.trim()) return
    setSalvandoLista(true)
    try {
      const res = await fetch('/api/banco/listas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nomeDaNovaLista.trim(),
          questaoIds: [questaoId],
          modoResposta: 'imediato',
        }),
      })
      if (res.ok) {
        setQuestaoParaLista(null)
        setNomeDaNovaLista('')
        await recarregarListas()
      }
    } finally {
      setSalvandoLista(false)
    }
  }

  async function recarregarListas() {
    const res = await fetch('/api/banco/listas')
    if (res.ok) setListas((await res.json()).listas || [])
  }

  async function sortearLista() {
    if (!sorteio.nome.trim()) return
    setSorteando(true)
    try {
      const res = await fetch('/api/banco/listas/aleatorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: sorteio.nome.trim(),
          quantidade: sorteio.quantidade,
          // O sorteio herda os assuntos e filtros da tela: montar uma lista
          // "de arritmias" já filtrou por arritmias na lista — repetir a
          // escolha dentro do diálogo era o passo que ninguém entendia.
          moduloId: selecao.moduloIds.join(',') || undefined,
          topicoId: selecao.topicoIds.join(',') || undefined,
          subtopicoId: selecao.subtopicoIds.join(',') || undefined,
          tipo: tipo || undefined,
          dificuldade: dificuldade || undefined,
          ano: anos.length === 1 ? anos[0] : undefined,
          modoResposta: sorteio.modoResposta,
          excluirJaResolvidas: sorteio.excluirJaResolvidas || undefined,
        }),
      })
      const dados = await res.json().catch(() => ({}))
      if (res.ok && dados.lista?._id) {
        setSorteioAberto(false)
        router.push(`/banco-questoes/listas/${dados.lista._id}`)
      }
    } finally {
      setSorteando(false)
    }
  }

  function limparTudo() {
    setSelecao(SELECAO_VAZIA)
    setBusca('')
    setBuscaAplicada('')
    setTipo('')
    setDificuldade('')
    setAnos([])
    setApenasNaoResolvidas(false)
  }

  if (carregando) {
    return (
      <div className="surface-page">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="h-24 rounded-2xl skeleton-pulse" />
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-96 rounded-2xl skeleton-pulse" />
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-xl skeleton-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const semSaldo = !!gratuito && gratuito.restantes <= 0

  return (
    <div className="surface-page">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
        {/* ── Cabeçalho ────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
              <Database className="h-6 w-6 text-primary" />
              Banco de Questões
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {paginacao ? `${paginacao.total} questões` : 'Carregando…'}
              {temFiltro ? ' com os filtros atuais' : ' no banco'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/banco-questoes/historico"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
            >
              <History className="h-3.5 w-3.5" /> Histórico
            </Link>
            <Link
              href="/banco-questoes/listas"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
            >
              <ListPlus className="h-3.5 w-3.5" /> Minhas listas
              {listas.length > 0 ? (
                <span className="rounded bg-muted px-1.5 text-[10px] tabular-nums">{listas.length}</span>
              ) : null}
            </Link>
            {!gratuito ? (
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg text-xs font-bold"
                onClick={() => {
                  setSorteio((s) => ({ ...s, nome: '' }))
                  setSorteioAberto(true)
                }}
              >
                <Shuffle className="h-3.5 w-3.5" /> Montar lista
              </Button>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin/banco-questoes"
                className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"
              >
                Administrar
              </Link>
            ) : null}
          </div>
        </header>

        {/* ── Faixa do plano gratuito ───────────────────────────────────── */}
        {gratuito ? (
          <section
            className={cn(
              'rounded-xl border p-4',
              semSaldo ? 'border-primary/30 bg-primary/5' : 'border-border bg-card',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {semSaldo
                    ? 'Você abriu suas questões gratuitas'
                    : `${gratuito.restantes} de ${gratuito.limite} questões gratuitas`}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {semSaldo
                    ? 'As que você abriu continuam disponíveis, com a resposta comentada.'
                    : 'Você escolhe quais abrir — navegue pelos assuntos e comece pelo que quer testar.'}
                </p>
              </div>
              <Link
                href="/loja"
                className="inline-flex h-9 flex-none items-center rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:brightness-110"
              >
                Assinar o Plus+
              </Link>
            </div>

            {!semSaldo ? (
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${((gratuito.limite - gratuito.restantes) / gratuito.limite) * 100}%` }}
                />
              </div>
            ) : null}
          </section>
        ) : estatisticas ? (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Indicador
              icone={<Target className="h-4 w-4" />}
              rotulo="Resolvidas"
              valor={String(estatisticas.totalResolvidas)}
            />
            <Indicador
              icone={<BarChart3 className="h-4 w-4" />}
              rotulo="Acerto"
              valor={`${Math.round(estatisticas.percentualAcerto)}%`}
            />
            <Indicador
              icone={<ListPlus className="h-4 w-4" />}
              rotulo="Listas"
              valor={String(listas.length)}
            />
          </section>
        ) : null}

        {/* ── Busca + filtros ──────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setBuscaAplicada(busca.trim())
                }}
                placeholder="Buscar no enunciado…"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none focus:border-primary/50"
              />
              {busca ? (
                <button
                  type="button"
                  onClick={() => {
                    setBusca('')
                    setBuscaAplicada('')
                  }}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            <Button
              variant="outline"
              className="h-10 gap-1.5 rounded-lg text-xs"
              onClick={() => setArvoreAberta((v) => !v)}
            >
              <Database className="h-3.5 w-3.5" />
              Assuntos
              {contarSelecionados(selecao) > 0 ? (
                <span className="rounded bg-primary/15 px-1.5 text-[10px] font-bold text-primary tabular-nums">
                  {contarSelecionados(selecao)}
                </span>
              ) : null}
            </Button>

            <Button
              variant={filtrosAbertos ? 'secondary' : 'outline'}
              className="h-10 gap-1.5 rounded-lg text-xs"
              onClick={() => setFiltrosAbertos((v) => !v)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
            </Button>

            {temFiltro ? (
              <Button variant="ghost" className="h-10 rounded-lg text-xs" onClick={limparTudo}>
                Limpar
              </Button>
            ) : null}
          </div>

          {filtrosAbertos ? (
            <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
              <Campo rotulo="Tipo">
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as BancoQuestaoTipo | '')}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todos</option>
                  <option value="objetiva">Objetiva</option>
                  <option value="discursiva">Discursiva</option>
                </select>
              </Campo>

              <Campo rotulo="Dificuldade">
                <select
                  value={dificuldade}
                  onChange={(e) => setDificuldade(e.target.value as BancoDificuldade | '')}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todas</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Média</option>
                  <option value="dificil">Difícil</option>
                </select>
              </Campo>

              <Campo rotulo="Ano">
                <select
                  value={anos.length === 1 ? String(anos[0]) : ''}
                  onChange={(e) => setAnos(e.target.value ? [Number(e.target.value)] : [])}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todos</option>
                  {anosDisponiveis.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Campo>

              {!gratuito ? (
                <Campo rotulo="Já resolvidas">
                  <label className="flex h-9 cursor-pointer items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={apenasNaoResolvidas}
                      onChange={(e) => setApenasNaoResolvidas(e.target.checked)}
                    />
                    Esconder as que já resolvi
                  </label>
                </Campo>
              ) : null}
            </div>
          ) : null}
        </section>

        {/* ── Assuntos + questões ──────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside
            className={cn(
              'rounded-xl border border-border bg-card p-3 lg:block',
              // No celular a árvore ocupa a tela toda e some por padrão: ela é
              // uma ferramenta de escolha, não o conteúdo principal.
              arvoreAberta ? 'block' : 'hidden',
            )}
          >
            <div className="flex h-[26rem] flex-col lg:h-[32rem]">
              <ArvoreDoBanco
                modulos={hierarquia.modulos}
                topicos={hierarquia.topicos}
                subtopicos={hierarquia.subtopicos}
                selecao={selecao}
                onChange={setSelecao}
              />
            </div>
          </aside>

          <main className="min-w-0 space-y-3">
            {carregandoQuestoes ? (
              [0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl skeleton-pulse" />)
            ) : questoes.length === 0 ? (
              <ListaVazia temFiltro={temFiltro} onLimpar={limparTudo} />
            ) : (
              questoes.map((q, i) => (
                <CartaoDeQuestao
                  key={q._id}
                  questao={q}
                  indice={((paginacao?.page || 1) - 1) * POR_PAGINA + i + 1}
                  podeAbrir={!!gratuito && gratuito.restantes > 0}
                  abrindo={abrindo === q._id}
                  onAbrir={abrirQuestao}
                  onAdicionarALista={gratuito ? undefined : setQuestaoParaLista}
                />
              ))
            )}

            {paginacao && paginacao.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  disabled={paginacao.page <= 1 || carregandoQuestoes}
                  onClick={() => carregarQuestoes(paginacao.page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Página {paginacao.page} de {paginacao.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-xs"
                  disabled={paginacao.page >= paginacao.totalPages || carregandoQuestoes}
                  onClick={() => carregarQuestoes(paginacao.page + 1)}
                >
                  Próxima
                </Button>
              </div>
            ) : null}
          </main>
        </div>
      </div>

      {/* ── Adicionar a uma lista ──────────────────────────────────────── */}
      <Dialog open={!!questaoParaLista} onOpenChange={(a) => !a && setQuestaoParaLista(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à lista</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {listas.length > 0 ? (
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {listas.map((lista) => (
                  <button
                    key={String(lista._id)}
                    type="button"
                    disabled={salvandoLista}
                    onClick={() => adicionarALista(String(lista._id))}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm transition hover:bg-muted disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate">{lista.nome}</span>
                    <span className="flex-none text-xs text-muted-foreground tabular-nums">
                      {lista.totalQuestoes ?? lista.questaoIds?.length ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Você ainda não tem listas. Crie a primeira abaixo.
              </p>
            )}

            <div className="border-t border-border pt-3">
              <Label className="text-xs">Nova lista</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={nomeDaNovaLista}
                  onChange={(e) => setNomeDaNovaLista(e.target.value)}
                  placeholder="Ex: Revisar antes da prova"
                  className="h-9 text-sm"
                />
                <Button
                  size="sm"
                  className="h-9 rounded-lg text-xs"
                  disabled={!nomeDaNovaLista.trim() || salvandoLista}
                  onClick={() => questaoParaLista && criarListaCom(questaoParaLista)}
                >
                  {salvandoLista ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Montar lista por sorteio ───────────────────────────────────── */}
      <Dialog open={sorteioAberto} onOpenChange={setSorteioAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Montar lista</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              {contarSelecionados(selecao) > 0 || tipo || dificuldade || anos.length > 0
                ? 'A lista usa os assuntos e filtros que você já escolheu na tela.'
                : 'Sem filtros escolhidos, a lista sorteia de todo o banco.'}
            </p>

            <div>
              <Label className="text-xs">Nome</Label>
              <Input
                value={sorteio.nome}
                onChange={(e) => setSorteio((s) => ({ ...s, nome: e.target.value }))}
                placeholder="Ex: Simulado de arritmias"
                className="mt-1 h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={sorteio.quantidade}
                  onChange={(e) =>
                    setSorteio((s) => ({ ...s, quantidade: Number(e.target.value) || 10 }))
                  }
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Resposta</Label>
                <select
                  value={sorteio.modoResposta}
                  onChange={(e) =>
                    setSorteio((s) => ({ ...s, modoResposta: e.target.value as BancoModoResposta }))
                  }
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="imediato">Mostrar a cada questão</option>
                  <option value="final">Mostrar só no final</option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={sorteio.excluirJaResolvidas}
                onChange={(e) => setSorteio((s) => ({ ...s, excluirJaResolvidas: e.target.checked }))}
              />
              Não repetir questões que eu já resolvi
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSorteioAberto(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={!sorteio.nome.trim() || sorteando} onClick={sortearLista}>
              {sorteando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              Criar lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Indicador({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {icone} {rotulo}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground">{rotulo}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
