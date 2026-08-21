'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { TiltCard } from '@/components/tilt-card'
import { useTrackView } from '@/hooks/use-track-view'
import {
  ArrowDownWideNarrow,
  CalendarRange,
  Check,
  Database,
  History,
  ImageIcon,
  ListPlus,
  Loader2,
  MessageSquareText,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Portal } from '@/components/ui/portal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { readPageCache, writePageCache } from '@/lib/page-cache'
import {
  ArvoreDoBanco,
  SELECAO_VAZIA,
  contarSelecionados,
  type SelecaoDaArvore,
} from '@/components/banco/arvore-banco'
import { CartaoDeQuestao, ListaVazia, type QuestaoDoCartao } from '@/components/banco/cartao-questao'
import { CriadorDeLista } from '@/components/banco/criador-de-lista'
import { PainelDeDesempenho } from '@/components/banco/painel-desempenho'
import type {
  BancoDificuldade,
  BancoListaUsuario,
  BancoOrdenacao,
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
 *
 * ## A segunda passada: catalogar e ver o próprio desempenho
 *
 * - **O recorte temporal virou PERÍODO LETIVO.** A prova se chama "N1 SOI I -
 *   2026.2"; filtrar por "2026" juntava dois semestres diferentes num balaio
 *   só. As pastilhas de período mostram quantas questões cada semestre tem
 *   antes do clique — um `<select>` mudo não mostrava nem isso.
 *
 * - **O filtro aplicado ficou visível.** Antes, quem escolhia três tópicos e
 *   rolava a página perdia de vista o que tinha escolhido: a lista encurtava e
 *   o motivo estava fora da tela. Agora cada recorte ativo é uma pastilha com
 *   um X próprio, logo acima das questões.
 *
 * - **O desempenho mora aqui, colapsado.** A pergunta "onde eu erro" se faz
 *   olhando a lista de questões, não numa aba de perfil do outro lado do app.
 *   Fechado, o painel custa uma faixa; aberto, responde em cinco recortes.
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

interface PeriodoDisponivel {
  periodo: string
  total: number
}

const POR_PAGINA = 20

/*
 * O que sobrevive à navegação.
 *
 * A árvore do catálogo e o eixo de períodos são os mesmos em toda visita e
 * demoram para chegar; sem guardá-los, sair para uma questão e voltar
 * remontava a tela do zero, com esqueleto, por dados que não mudaram. Ficam de
 * fora o saldo do plano gratuito e as listas do usuário: são dados de conta, e
 * mostrar um saldo velho diria à pessoa que ela pode abrir uma questão que na
 * verdade já gastou (ver o aviso em lib/page-cache.ts).
 */
const CACHE_HIERARQUIA = 'banco:hierarquia'
const CACHE_EIXO = 'banco:eixo'

interface EixoTemporalEmCache {
  anos: number[]
  periodos: PeriodoDisponivel[]
}

function Conteudo() {
  const router = useRouter()
  const { isAdmin } = useAppShell()

  // Registra a visita ao Banco para o painel de estatísticas.
  useTrackView({ kind: 'banco_questoes_open', resourceId: 'banco-questoes', resourceTitle: 'Banco de Questões' })

  const [hierarquia, setHierarquia] = useState<{ modulos: any[]; topicos: any[]; subtopicos: any[] }>(
    () =>
      readPageCache<{ modulos: any[]; topicos: any[]; subtopicos: any[] }>(CACHE_HIERARQUIA) ?? {
        modulos: [],
        topicos: [],
        subtopicos: [],
      },
  )
  // O esqueleto de tela cheia só aparece para quem chega sem nada em mãos. Com
  // a árvore em cache, a tela já pinta e as questões entram por baixo.
  const [carregando, setCarregando] = useState(
    () => readPageCache<unknown>(CACHE_HIERARQUIA) === null,
  )
  const [selecao, setSelecao] = useState<SelecaoDaArvore>(SELECAO_VAZIA)

  const [questoes, setQuestoes] = useState<QuestaoDoCartao[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  // Começa em `true`: a primeira busca só dispara no efeito, que roda DEPOIS da
  // primeira pintura. Começando em `false`, quem chega com a árvore em cache —
  // e portanto sem o esqueleto de tela cheia — via por um quadro a mensagem "o
  // banco ainda não tem questões" antes de a lista chegar.
  const [carregandoQuestoes, setCarregandoQuestoes] = useState(true)
  const [gratuito, setGratuito] = useState<SaldoGratuito | null>(null)
  const [abrindo, setAbrindo] = useState<string | null>(null)

  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [tipo, setTipo] = useState<BancoQuestaoTipo | ''>('')
  const [dificuldade, setDificuldade] = useState<BancoDificuldade | ''>('')
  const [periodos, setPeriodos] = useState<string[]>([])
  const [periodosDisponiveis, setPeriodosDisponiveis] = useState<PeriodoDisponivel[]>(
    () => readPageCache<EixoTemporalEmCache>(CACHE_EIXO)?.periodos ?? [],
  )
  const [anos, setAnos] = useState<number[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>(
    () => readPageCache<EixoTemporalEmCache>(CACHE_EIXO)?.anos ?? [],
  )
  // "Não resolvidas" e "erradas" são mutuamente exclusivas: a primeira exclui
  // quem já respondeu, a segunda exige ter respondido errado — nunca fazem
  // sentido juntas. Ver o mesmo par no criador de listas.
  const [apenasNaoResolvidas, setApenasNaoResolvidas] = useState(false)
  const [apenasErradas, setApenasErradas] = useState(false)
  const [comImagem, setComImagem] = useState(false)
  const [comExplicacao, setComExplicacao] = useState(false)
  const [ordenar, setOrdenar] = useState<BancoOrdenacao>('recentes')
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [arvoreAberta, setArvoreAberta] = useState(false)

  const [listas, setListas] = useState<ListaComContagem[]>([])

  const [questaoParaLista, setQuestaoParaLista] = useState<string | null>(null)
  const [nomeDaNovaLista, setNomeDaNovaLista] = useState('')
  const [salvandoLista, setSalvandoLista] = useState(false)

  const [sorteioAberto, setSorteioAberto] = useState(false)

  const primeiraCarga = useRef(true)

  const temFiltro =
    contarSelecionados(selecao) > 0 ||
    !!buscaAplicada ||
    !!tipo ||
    !!dificuldade ||
    periodos.length > 0 ||
    anos.length > 0 ||
    apenasNaoResolvidas ||
    apenasErradas ||
    comImagem ||
    comExplicacao ||
    ordenar !== 'recentes'

  const parametros = useMemo(() => {
    const p = new URLSearchParams()
    p.set('limit', String(POR_PAGINA))
    if (selecao.moduloIds.length) p.set('moduloId', selecao.moduloIds.join(','))
    if (selecao.topicoIds.length) p.set('topicoId', selecao.topicoIds.join(','))
    if (selecao.subtopicoIds.length) p.set('subtopicoId', selecao.subtopicoIds.join(','))
    if (tipo) p.set('tipo', tipo)
    if (dificuldade) p.set('dificuldade', dificuldade)
    if (periodos.length) p.set('periodos', periodos.join(','))
    if (anos.length) p.set('anos', anos.join(','))
    if (apenasErradas) p.set('apenasErradas', 'true')
    else if (apenasNaoResolvidas) p.set('apenasNaoResolvidas', 'true')
    if (comImagem) p.set('comImagem', 'true')
    if (comExplicacao) p.set('comExplicacao', 'true')
    if (ordenar !== 'recentes') p.set('ordenar', ordenar)
    if (buscaAplicada) p.set('busca', buscaAplicada)
    return p
  }, [
    selecao,
    tipo,
    dificuldade,
    periodos,
    anos,
    apenasNaoResolvidas,
    apenasErradas,
    comImagem,
    comExplicacao,
    ordenar,
    buscaAplicada,
  ])

  const carregarQuestoes = useCallback(
    async (pagina = 1) => {
      setCarregandoQuestoes(true)
      try {
        const p = new URLSearchParams(parametros)
        p.set('page', String(pagina))
        // `campos=lista`: o cartão desenha assunto, etiquetas e as três
        // primeiras linhas do enunciado. Sem isso o servidor manda o documento
        // inteiro de vinte questões — alternativas, gabarito e explicação
        // comentada — e a tela espera por texto que ela não vai mostrar.
        p.set('campos', 'lista')
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

    // As quatro chamadas partem juntas: a lista de questões (a mais lenta,
    // por ter os lookups de hierarquia e resolução) não depende de nenhuma
    // das outras três, então esperar hierarquia+anos+listas terminarem
    // antes de pedi-la só somava o tempo das quatro em vez de sobrepô-las.
    //
    // E cada uma se aplica À TELA ASSIM QUE CHEGA. Antes elas eram esperadas
    // num `Promise.all` e a página inteira só saía do esqueleto quando a mais
    // lenta das quatro voltasse — a lista de questões ficava pronta e escondida
    // esperando as listas do usuário, que a maior parte das contas nem tem.
    const questoesProntas = carregarQuestoes(1).finally(() => {
      if (vivo) setCarregando(false)
    })

    fetch('/api/banco/hierarquia')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return
        setHierarquia(d)
        writePageCache(CACHE_HIERARQUIA, d)
        setCarregando(false)
      })
      .catch(() => {})

    fetch('/api/banco/anos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d) return
        const eixo: EixoTemporalEmCache = { anos: d.anos || [], periodos: d.periodos || [] }
        setAnosDisponiveis(eixo.anos)
        setPeriodosDisponiveis(eixo.periodos)
        writePageCache(CACHE_EIXO, eixo)
      })
      .catch(() => {})

    // As listas são de assinante; para quem é gratuito a resposta vem vazia
    // ou negada, e a tela simplesmente não mostra a seção.
    fetch('/api/banco/listas')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (vivo && d) setListas(d.listas || [])
      })
      .catch(() => {})

    questoesProntas.finally(() => {
      primeiraCarga.current = false
    })

    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (primeiraCarga.current) return
    carregarQuestoes(1)
  }, [carregarQuestoes])

  /** Nome legível de cada nó escolhido — as pastilhas mostram o assunto, não o id. */
  const nomePorId = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const m of hierarquia.modulos || []) mapa.set(String(m._id), m.nome)
    for (const t of hierarquia.topicos || []) mapa.set(String(t._id), t.nome)
    for (const s of hierarquia.subtopicos || []) mapa.set(String(s._id), s.nome)
    return mapa
  }, [hierarquia])

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

  function alternarPeriodo(rotulo: string) {
    setPeriodos((atual) =>
      atual.includes(rotulo) ? atual.filter((p) => p !== rotulo) : [...atual, rotulo],
    )
  }

  function tirarDaSelecao(campo: keyof SelecaoDaArvore, id: string) {
    setSelecao((atual) => ({ ...atual, [campo]: atual[campo].filter((i) => i !== id) }))
  }

  function limparTudo() {
    setSelecao(SELECAO_VAZIA)
    setBusca('')
    setBuscaAplicada('')
    setTipo('')
    setDificuldade('')
    setPeriodos([])
    setAnos([])
    setApenasNaoResolvidas(false)
    setApenasErradas(false)
    setComImagem(false)
    setComExplicacao(false)
    setOrdenar('recentes')
  }

  if (carregando) {
    return (
      <div className="surface-page vidro-ambiente">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <div className="h-24 rounded-2xl skeleton-pulse" />
          <div className="h-16 rounded-2xl skeleton-pulse" />
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
    <div className="surface-page vidro-ambiente">
      <div className="mx-auto max-w-7xl space-y-4 p-4 sm:space-y-5 sm:p-6 lg:p-8">
        {/* ── Cabeçalho ────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-wrap items-start justify-between gap-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            {/* O ícone é uma peça com espessura, não um quadrado chapado: é a
                primeira coisa da tela e dá o tom do resto. */}
            <TiltCard maxTilt={12} scale={1.06} className="flex-none rounded-2xl">
              <div className="relevo relevo-varre flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                <Database className="h-6 w-6" />
              </div>
            </TiltCard>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">Banco de Questões</h1>
              <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                {paginacao ? `${paginacao.total.toLocaleString('pt-BR')} questões` : 'Carregando…'}
                {temFiltro ? ' com os filtros atuais' : ' no banco'}
              </p>
            </div>
          </div>

          {/* Rolagem horizontal no celular: empilhar quatro botões empurraria
              a primeira questão para fora da tela. */}
          <div className="-mx-4 flex w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            <Link
              href="/banco-questoes/historico"
              className="tecla inline-flex h-9 flex-none items-center gap-1.5 px-3 text-xs font-semibold"
            >
              <History className="h-3.5 w-3.5" /> Histórico
            </Link>
            <Link
              href="/banco-questoes/listas"
              className="tecla inline-flex h-9 flex-none items-center gap-1.5 px-3 text-xs font-semibold"
            >
              <ListPlus className="h-3.5 w-3.5" /> Minhas listas
              {listas.length > 0 ? (
                <span className="rounded bg-muted px-1.5 text-[10px] tabular-nums">{listas.length}</span>
              ) : null}
            </Link>
            {!gratuito ? (
              <Button
                size="sm"
                className="btn-brand-glow h-9 flex-none gap-1.5 rounded-xl text-xs font-bold text-white active:scale-[0.97]"
                onClick={() => setSorteioAberto(true)}
              >
                <Shuffle className="h-3.5 w-3.5" /> Montar lista
              </Button>
            ) : null}
            {isAdmin ? (
              <Link
                href="/admin/banco-questoes"
                className="tecla inline-flex h-9 flex-none items-center px-3 text-xs font-semibold"
              >
                Administrar
              </Link>
            ) : null}
          </div>
        </motion.header>

        {/* ── Faixa do plano gratuito ───────────────────────────────────── */}
        {gratuito ? (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className={cn(
              'vidro vidro-brilho relevo rounded-[22px] p-4 sm:p-5',
              semSaldo && 'border-primary/40 bg-primary/5',
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4 flex-none text-primary" />
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
                className="btn-brand-glow inline-flex h-10 flex-none items-center justify-center rounded-xl px-4 text-xs font-bold text-white active:scale-[0.98]"
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
          </motion.section>
        ) : null}

        {/* ── Desempenho ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <PainelDeDesempenho />
        </motion.div>

        {/* ── Busca + filtros ──────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="vidro vidro-brilho relevo rounded-[22px] p-3"
        >
          {/* No celular o campo tem a linha inteira: dividindo com dois botões
              ele encolhia até caber só "Buscar nc". */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setBuscaAplicada(busca.trim())
                }}
                placeholder="Buscar no enunciado…"
                className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-9 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
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

            <div className="flex gap-2">
              <button
                type="button"
                data-marcado={contarSelecionados(selecao) > 0}
                className="tecla inline-flex h-10 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-semibold sm:flex-none md:hidden"
                onClick={() => setArvoreAberta((v) => !v)}
              >
                <Database className="h-3.5 w-3.5" />
                Assuntos
                {contarSelecionados(selecao) > 0 ? (
                  <span className="rounded bg-primary/15 px-1.5 text-[10px] font-bold tabular-nums">
                    {contarSelecionados(selecao)}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                data-marcado={filtrosAbertos}
                aria-expanded={filtrosAbertos}
                className="tecla inline-flex h-10 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-semibold sm:flex-none"
                onClick={() => setFiltrosAbertos((v) => !v)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
              </button>

              {temFiltro ? (
                <Button variant="ghost" className="h-10 flex-none rounded-xl text-xs" onClick={limparTudo}>
                  Limpar
                </Button>
              ) : null}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {filtrosAbertos ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 border-t border-border pt-3">
                  {/* ── Período letivo ───────────────────────────────── */}
                  {periodosDisponiveis.length > 0 ? (
                    <div>
                      <Label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarRange className="h-3 w-3" /> Período letivo
                      </Label>
                      {/* Pastilhas e não um `<select>`: aqui a contagem aparece
                          ANTES do clique, e escolher dois semestres é natural.
                          Um `<select>` esconde o catálogo e só aceita um. */}
                      <div className="-mx-1 mt-1.5 flex gap-1.5 overflow-x-auto px-1 pb-1">
                        {periodosDisponiveis.map((p) => {
                          const marcado = periodos.includes(p.periodo)
                          return (
                            <button
                              key={p.periodo}
                              type="button"
                              data-marcado={marcado}
                              aria-pressed={marcado}
                              onClick={() => alternarPeriodo(p.periodo)}
                              className="tecla inline-flex h-9 flex-none items-center gap-1.5 px-2.5 text-xs font-semibold"
                            >
                              <span className="tabular-nums">{p.periodo}</span>
                              <span
                                className={cn(
                                  'rounded px-1 text-[10px] tabular-nums',
                                  marcado ? 'bg-primary/20' : 'bg-muted text-muted-foreground',
                                )}
                              >
                                {p.total}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Campo rotulo="Tipo">
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as BancoQuestaoTipo | '')}
                        className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
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
                        className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
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
                        className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                      >
                        <option value="">Todos</option>
                        {anosDisponiveis.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    {/* Ordenar por: "recentes" continua sendo o padrão — só
                        entra no filtro ativo (e no parâmetro da URL) quando a
                        pessoa escolhe outra coisa. */}
                    <Campo rotulo="Ordenar por">
                      <div className="relative">
                        <ArrowDownWideNarrow className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                        <select
                          value={ordenar}
                          onChange={(e) => setOrdenar(e.target.value as BancoOrdenacao)}
                          className="h-9 w-full rounded-xl border border-border bg-background py-0 pl-7 pr-2 text-[13px] outline-none focus:border-primary/50"
                        >
                          <option value="recentes">Mais recentes</option>
                          <option value="menosPraticadas">Menos praticadas</option>
                          <option value="maisDificeis">Mais difíceis</option>
                        </select>
                      </div>
                    </Campo>
                  </div>

                  {/* ── Conteúdo da questão ─────────────────────────────
                      Toggles, não checkboxes de formulário: são o mesmo
                      vocabulário das pastilhas de período, e cabem lado a lado
                      sem crescer a grade acima. */}
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Conteúdo da questão</Label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <ToggleDeFiltro
                        marcado={comImagem}
                        onClick={() => setComImagem((v) => !v)}
                        icone={<ImageIcon className="h-3.5 w-3.5" />}
                      >
                        Só com imagem
                      </ToggleDeFiltro>
                      <ToggleDeFiltro
                        marcado={comExplicacao}
                        onClick={() => setComExplicacao((v) => !v)}
                        icone={<MessageSquareText className="h-3.5 w-3.5" />}
                      >
                        Com comentário
                      </ToggleDeFiltro>
                    </div>
                  </div>

                  {/* O que já foi resolvido não existe para quem é gratuito:
                      quase todo o catálogo ainda está bloqueado para essa
                      pessoa, e "esconder as que já resolvi" filtraria sobre um
                      recorte que ela mal viu. */}
                  {!gratuito ? (
                    <div>
                      <Label className="text-[11px] text-muted-foreground">
                        Sobre o que você já resolveu
                      </Label>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <ToggleDeFiltro
                          marcado={apenasNaoResolvidas}
                          onClick={() => {
                            setApenasNaoResolvidas((v) => !v)
                            setApenasErradas(false)
                          }}
                          icone={<Check className="h-3.5 w-3.5" />}
                        >
                          Ainda não resolvi
                        </ToggleDeFiltro>
                        <ToggleDeFiltro
                          marcado={apenasErradas}
                          onClick={() => {
                            setApenasErradas((v) => !v)
                            setApenasNaoResolvidas(false)
                          }}
                          icone={<XCircle className="h-3.5 w-3.5" />}
                        >
                          Só as que errei
                        </ToggleDeFiltro>
                      </div>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>

        {/* ── O que está filtrado agora ─────────────────────────────────── */}
        {temFiltro ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {selecao.moduloIds.map((id) => (
              <Pastilha
                key={`m-${id}`}
                rotulo={nomePorId.get(id) || 'Módulo'}
                onRemover={() => tirarDaSelecao('moduloIds', id)}
              />
            ))}
            {selecao.topicoIds.map((id) => (
              <Pastilha
                key={`t-${id}`}
                rotulo={nomePorId.get(id) || 'Tópico'}
                onRemover={() => tirarDaSelecao('topicoIds', id)}
              />
            ))}
            {selecao.subtopicoIds.map((id) => (
              <Pastilha
                key={`s-${id}`}
                rotulo={nomePorId.get(id) || 'Subtópico'}
                onRemover={() => tirarDaSelecao('subtopicoIds', id)}
              />
            ))}
            {periodos.map((p) => (
              <Pastilha key={`p-${p}`} rotulo={p} onRemover={() => alternarPeriodo(p)} />
            ))}
            {anos.map((a) => (
              <Pastilha
                key={`a-${a}`}
                rotulo={`Ano ${a}`}
                onRemover={() => setAnos((atual) => atual.filter((x) => x !== a))}
              />
            ))}
            {tipo ? (
              <Pastilha
                rotulo={tipo === 'discursiva' ? 'Discursiva' : 'Objetiva'}
                onRemover={() => setTipo('')}
              />
            ) : null}
            {dificuldade ? (
              <Pastilha
                rotulo={{ facil: 'Fácil', medio: 'Média', dificil: 'Difícil' }[dificuldade] || dificuldade}
                onRemover={() => setDificuldade('')}
              />
            ) : null}
            {apenasNaoResolvidas ? (
              <Pastilha rotulo="Não resolvidas" onRemover={() => setApenasNaoResolvidas(false)} />
            ) : null}
            {apenasErradas ? (
              <Pastilha rotulo="Só as que errei" onRemover={() => setApenasErradas(false)} />
            ) : null}
            {comImagem ? (
              <Pastilha rotulo="Com imagem" onRemover={() => setComImagem(false)} />
            ) : null}
            {comExplicacao ? (
              <Pastilha rotulo="Com comentário" onRemover={() => setComExplicacao(false)} />
            ) : null}
            {ordenar !== 'recentes' ? (
              <Pastilha
                rotulo={ordenar === 'maisDificeis' ? 'Mais difíceis' : 'Menos praticadas'}
                onRemover={() => setOrdenar('recentes')}
              />
            ) : null}
            {buscaAplicada ? (
              <Pastilha
                rotulo={`“${buscaAplicada}”`}
                onRemover={() => {
                  setBusca('')
                  setBuscaAplicada('')
                }}
              />
            ) : null}
          </div>
        ) : null}

        {/* ── Assuntos + questões ──────────────────────────────────────── */}
        <div className="grid gap-5 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
          {/* Do tablet para cima a árvore é uma COLUNA: com 800px de largura
              sobra espaço de sobra, e escondê-la atrás de um botão fazia a
              página desperdiçar metade da tela e o catálogo desaparecer. */}
          <aside className="vidro vidro-brilho relevo sticky top-4 hidden rounded-[22px] p-3 md:block">
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
            <AnimatePresence mode="wait" initial={false}>
              {carregandoQuestoes ? (
                <motion.div
                  key="carregando"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-28 rounded-2xl skeleton-pulse" />
                  ))}
                </motion.div>
              ) : questoes.length === 0 ? (
                <motion.div key="vazio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ListaVazia temFiltro={temFiltro} onLimpar={limparTudo} />
                </motion.div>
              ) : (
                <motion.div
                  // A chave muda com o filtro e com a página: é o que faz a
                  // lista TROCAR com uma transição em vez de piscar no lugar.
                  key={`${parametros.toString()}-${paginacao?.page || 1}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {questoes.map((q, i) => (
                    <CartaoDeQuestao
                      key={q._id}
                      questao={q}
                      indice={((paginacao?.page || 1) - 1) * POR_PAGINA + i + 1}
                      podeAbrir={!!gratuito && gratuito.restantes > 0}
                      abrindo={abrindo === q._id}
                      onAbrir={abrirQuestao}
                      onAdicionarALista={gratuito ? undefined : setQuestaoParaLista}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {paginacao && paginacao.totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs"
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
                  className="rounded-xl text-xs"
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

      {/* ── Assuntos no celular ────────────────────────────────────────
          Centralizado, e fora da árvore da página.

          Era uma gaveta colada embaixo (`inset-x-0 bottom-0`) e dava dois
          problemas ao mesmo tempo. O primeiro é que a gaveta se ajusta ao
          conteúdo: com poucos módulos no catálogo, ela virava uma tira de dois
          dedos grudada na base da tela, com o título quase encostando no
          rodapé. O segundo é que o botão de voltar e a doca flutuante passavam
          POR CIMA dela — não por z-index baixo, mas porque a página inteira
          vive dentro de `.vidro-ambiente`, que isola o contexto de
          empilhamento; nenhum número de `z-index` atravessa isso. Daí o
          `Portal`. Ver components/ui/portal.tsx. */}
      <AnimatePresence>
        {arvoreAberta ? (
          <Portal key="assuntos">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[210] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm md:hidden"
              style={{
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setArvoreAberta(false)
              }}
            >
              <motion.div
                // Cresce a partir do centro, em vez de subir da base: a gaveta
                // que desliza de baixo promete que ela mora ali embaixo.
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: 'spring', damping: 28, stiffness: 340 }}
                role="dialog"
                aria-modal="true"
                aria-label="Assuntos do banco"
                className="vidro-denso vidro-brilho relevo flex max-h-full w-full max-w-md flex-col rounded-[28px] p-3"
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-2">
                  <h2 className="text-sm font-bold">Assuntos</h2>
                  <button
                    type="button"
                    onClick={() => setArvoreAberta(false)}
                    aria-label="Fechar"
                    className="-m-1 rounded-lg p-1 text-muted-foreground hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Altura mínima para o painel não encolher até virar tira
                    quando o catálogo tem poucos módulos, e máxima para a
                    rolagem ficar DENTRO da árvore, nunca no modal inteiro. */}
                <div className="flex min-h-[18rem] flex-1 flex-col overflow-hidden">
                  <ArvoreDoBanco
                    modulos={hierarquia.modulos}
                    topicos={hierarquia.topicos}
                    subtopicos={hierarquia.subtopicos}
                    selecao={selecao}
                    onChange={setSelecao}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setArvoreAberta(false)}
                  className="btn-brand-glow mt-2 h-11 flex-none rounded-xl text-sm font-bold text-white active:scale-[0.98]"
                >
                  Ver {paginacao ? `${paginacao.total.toLocaleString('pt-BR')} ` : ''}questões
                </button>
              </motion.div>
            </motion.div>
          </Portal>
        ) : null}
      </AnimatePresence>

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

      {/* ── Montar lista (multifatorial) ───────────────────────────────── */}
      <CriadorDeLista
        aberto={sorteioAberto}
        hierarquia={hierarquia}
        anosDisponiveis={anosDisponiveis}
        periodosDisponiveis={periodosDisponiveis}
        // Começa de onde a pessoa estava: se ela filtrou arritmias na página,
        // pedir os assuntos de novo no criador seria refazer trabalho.
        selecaoInicial={selecao}
        onFechar={() => setSorteioAberto(false)}
        onCriada={(id) => {
          setSorteioAberto(false)
          if (id) router.push(`/banco-questoes/listas/${id}`)
        }}
      />
    </div>
  )
}

/**
 * Um recorte ativo, com o X que o desfaz.
 *
 * Existe porque o filtro aplicado some da vista assim que a pessoa rola a
 * página: a lista encurta e o motivo fica lá em cima. Aqui o motivo anda junto
 * das questões, e desfazer um recorte não obriga a reabrir o painel de filtros.
 */
function Pastilha({ rotulo, onRemover }: { rotulo: string; onRemover: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/25 bg-primary/10 py-1 pl-2.5 pr-1 text-[11px] font-semibold text-primary">
      <span className="min-w-0 max-w-[14rem] truncate">{rotulo}</span>
      <button
        type="button"
        onClick={onRemover}
        aria-label={`Remover filtro ${rotulo}`}
        className="flex h-4 w-4 flex-none items-center justify-center rounded-full transition hover:bg-primary/20"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
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

/**
 * Um filtro de liga/desliga, para o que não é uma escolha entre opções (tipo,
 * dificuldade) mas sim "com isso" ou "sem isso" — imagem, comentário,
 * resolução. Mesmo vocabulário visual das pastilhas de período, só que sem a
 * contagem: contar "quantas têm imagem" custaria uma consulta a mais só para
 * um número que ninguém pediu.
 */
function ToggleDeFiltro({
  marcado,
  onClick,
  icone,
  children,
}: {
  marcado: boolean
  onClick: () => void
  icone: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      data-marcado={marcado}
      aria-pressed={marcado}
      onClick={onClick}
      className="tecla inline-flex h-9 flex-none items-center gap-1.5 px-3 text-xs font-semibold"
    >
      {icone}
      {children}
    </button>
  )
}
