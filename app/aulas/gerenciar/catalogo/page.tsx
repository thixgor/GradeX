'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  FileText,
  Layers,
  Loader2,
  Pencil,
  Play,
  Plus,
  Route,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'

import { AppShell } from '@/components/app-shell'
import {
  BotaoPrincipal,
  BotaoSecundario,
  Campo,
  PainelDeEnsino,
  classeDeEntrada,
} from '@/components/ensino/painel'
import { BotaoDuo } from '@/components/ensino/duo'
import { EstadoVazio, Esqueleto, Selo } from '@/components/ensino/primitivos'
import { cn } from '@/lib/utils'

/**
 * O catálogo de aulas do painel (§22, §23).
 *
 * NÃO É UMA TABELA
 *
 * O pedido era explícito: nada de tabela gigante. A razão não é estética — é
 * que a pergunta que o administrador faz sobre uma aula não cabe em colunas.
 * Ele quer saber, de relance: onde ela está organizada, quanto tempo tem, se
 * tem resumo/PDF/flashcards e **em quantas Trilhas ela é usada**. Esse último
 * número é o mais importante do painel inteiro: é ele que mostra o reuso
 * funcionando, e é ele que avisa que mexer nesta aula mexe em três caminhos.
 *
 * Cada aula é uma linha densa, legível, com os filtros por cima. A edição
 * pesada continua no editor completo; o que dá para resolver aqui — a
 * organização na taxonomia — é resolvido num painel lateral, sem sair da lista.
 */

interface AulaNoCatalogo {
  _id: string
  titulo: string
  localizacao?: string
  duracaoLabel?: string
  profundidade?: string
  tipo?: string
  publicada?: boolean
  recursos?: { resumo?: boolean; pdf?: boolean; flashcards?: boolean }
  trilhas?: Array<{ slug: string; titulo: string }>
  ensino?: any
}

interface NoNaTela {
  _id: string
  nome: string
  nivel: string
  paiId: string | null
}

const NIVEIS = ['area', 'modulo', 'topico', 'subtopico'] as const

const ROTULO_DO_NIVEL: Record<string, string> = {
  area: 'Área',
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

export default function CatalogoPage() {
  return (
    <AppShell headerTitle="Catálogo de aulas" headerSubtitle="Administração de Ensino">
      <Suspense
        fallback={
          <div className="container mx-auto max-w-6xl px-4 py-8">
            <Esqueleto className="h-64 w-full" />
          </div>
        }
      >
        <Conteudo />
      </Suspense>
    </AppShell>
  )
}

function Conteudo() {
  const parametros = useSearchParams()

  const [aulas, setAulas] = useState<AulaNoCatalogo[]>([])
  const [nos, setNos] = useState<NoNaTela[]>([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)

  const [busca, setBusca] = useState('')
  const [no, setNo] = useState('')
  const [profundidade, setProfundidade] = useState('')
  const [trilha, setTrilha] = useState('')
  const [situacao, setSituacao] = useState('')
  const [semClassificacao, setSemClassificacao] = useState(
    parametros.get('semClassificacao') === '1',
  )
  const [organizando, setOrganizando] = useState<AulaNoCatalogo | null>(null)

  /** Ids marcados na lista. É a fonte de tudo que a barra de ações faz. */
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set())
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [aplicando, setAplicando] = useState('')
  const [aviso, setAviso] = useState('')

  const carregar = useCallback(() => {
    setCarregando(true)
    const q = new URLSearchParams({ admin: '1', limite: '200', nos: '1', tipo: 'todos' })
    if (busca.trim().length >= 2) q.set('q', busca.trim())
    if (no) q.set('no', no)
    if (profundidade) q.set('profundidade', profundidade)
    if (trilha) q.set('trilha', trilha)
    if (situacao) q.set('situacao', situacao)
    if (semClassificacao) q.set('semClassificacao', '1')

    fetch(`/api/ensino/catalogo?${q}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setAulas(d.aulas || [])
        setTotal(d.total || 0)
        if (d.nos) setNos(d.nos)
      })
      .catch(() => {})
      .finally(() => setCarregando(false))

    // A seleção não sobrevive a uma troca de filtro: manter marcada uma aula
    // que saiu da tela é o caminho mais curto para alguém excluir o que não
    // está vendo.
    setMarcadas(new Set())
  }, [busca, no, profundidade, trilha, situacao, semClassificacao])

  // O atraso evita uma requisição por tecla digitada na busca.
  useEffect(() => {
    const relogio = setTimeout(carregar, 250)
    return () => clearTimeout(relogio)
  }, [carregar])

  const trilhasDisponiveis = useMemo(() => {
    const mapa = new Map<string, string>()
    for (const aula of aulas) {
      for (const t of aula.trilhas || []) mapa.set(t.slug, t.titulo)
    }
    return Array.from(mapa.entries())
  }, [aulas])

  const nosOrdenados = useMemo(() => {
    // Achatado com recuo, para o seletor mostrar a hierarquia sem uma árvore.
    const filhos = new Map<string | null, NoNaTela[]>()
    for (const item of nos) {
      const chave = item.paiId || null
      filhos.set(chave, [...(filhos.get(chave) || []), item])
    }
    const saida: Array<{ id: string; rotulo: string }> = []
    const descer = (pai: string | null, nivel: number) => {
      for (const item of filhos.get(pai) || []) {
        saida.push({ id: item._id, rotulo: `${'— '.repeat(nivel)}${item.nome}` })
        descer(item._id, nivel + 1)
      }
    }
    descer(null, 0)
    return saida
  }, [nos])

  const limpar = () => {
    setBusca('')
    setNo('')
    setProfundidade('')
    setTrilha('')
    setSituacao('')
    setSemClassificacao(false)
  }

  const filtrando = Boolean(busca || no || profundidade || trilha || situacao || semClassificacao)

  const todasMarcadas = aulas.length > 0 && marcadas.size === aulas.length

  function alternarMarcada(id: string) {
    setMarcadas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function alternarTodas() {
    setMarcadas(todasMarcadas ? new Set() : new Set(aulas.map((a) => a._id)))
  }

  /**
   * Marca TODAS as aulas que passam pelos filtros de agora, e não só as que a
   * página desenhou.
   *
   * Ela pede ao servidor a lista crua de ids — os mesmos filtros, o mesmo motor
   * de acesso — em vez de confiar no que está na tela. Marcar "todas" com base
   * numa página de 200 e chamar aquilo de acervo inteiro seria mentira, e a
   * ação seguinte é a exclusão.
   */
  async function marcarTodasDoFiltro() {
    const q = new URLSearchParams({ admin: '1', soIds: '1', tipo: 'todos' })
    if (busca.trim().length >= 2) q.set('q', busca.trim())
    if (no) q.set('no', no)
    if (profundidade) q.set('profundidade', profundidade)
    if (trilha) q.set('trilha', trilha)
    if (situacao) q.set('situacao', situacao)
    if (semClassificacao) q.set('semClassificacao', '1')

    setAplicando('selecionar')
    try {
      const resposta = await fetch(`/api/ensino/catalogo?${q}`, { cache: 'no-store' })
      const d = await resposta.json().catch(() => ({}))
      if (Array.isArray(d.ids)) setMarcadas(new Set(d.ids))
    } catch {
      setAviso('Não foi possível selecionar todas.')
    } finally {
      setAplicando('')
    }
  }

  /**
   * Aplica uma ação a tudo que está marcado.
   *
   * Em fatias de 200 porque a rota aceita 500 por chamada e um acervo grande
   * estoura isso com facilidade. Fatiar aqui, e não pedir ao admin que
   * selecione menos, é o que faz "excluir todas" significar todas de verdade.
   */
  async function aplicarEmLote(acao: 'publicar' | 'ocultar' | 'excluir') {
    const ids = Array.from(marcadas)
    if (ids.length === 0) return

    setAplicando(acao)
    setAviso('')
    let afetadas = 0

    try {
      for (let i = 0; i < ids.length; i += 200) {
        const resposta = await fetch('/api/aulas/lote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acao,
            ids: ids.slice(i, i + 200),
            ...(acao === 'excluir' ? { confirmar: true } : {}),
          }),
        })
        const d = await resposta.json().catch(() => ({}))
        if (!resposta.ok) throw new Error(d.error || 'Não foi possível aplicar a ação.')
        afetadas += Number(d.afetadas) || 0
      }

      setMarcadas(new Set())
      setConfirmandoExclusao(false)
      setAviso(
        acao === 'excluir'
          ? `${afetadas} ${afetadas === 1 ? 'aula excluída' : 'aulas excluídas'}.`
          : `${afetadas} ${afetadas === 1 ? 'aula atualizada' : 'aulas atualizadas'}.`,
      )
      carregar()
    } catch (e: any) {
      setAviso(e?.message || 'Não foi possível aplicar a ação.')
    } finally {
      setAplicando('')
    }
  }

  return (
    <PainelDeEnsino
      largura="larga"
      titulo="Aulas"
      descricao="Unidades específicas de conhecimento. A mesma aula pode servir a várias Trilhas — o número ao lado mostra em quantas."
      acoes={
        <BotaoPrincipal href="/aulas/gerenciar/catalogo/nova">
          <Plus className="h-4 w-4" /> Nova aula
        </BotaoPrincipal>
      }
    >
      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, assunto ou tag…"
            className={cn(classeDeEntrada, 'pl-9')}
          />
        </div>

        <select value={no} onChange={(e) => setNo(e.target.value)} className={classeDeEntrada}>
          <option value="">Toda a organização</option>
          {nosOrdenados.map((item) => (
            <option key={item.id} value={item.id}>
              {item.rotulo}
            </option>
          ))}
        </select>

        <select
          value={profundidade}
          onChange={(e) => setProfundidade(e.target.value)}
          className={classeDeEntrada}
        >
          <option value="">Qualquer nível</option>
          <option value="essencial">Essencial</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>

        <select
          value={trilha}
          onChange={(e) => setTrilha(e.target.value)}
          className={classeDeEntrada}
        >
          <option value="">Qualquer Trilha</option>
          {trilhasDisponiveis.map(([slug, titulo]) => (
            <option key={slug} value={slug}>
              {titulo}
            </option>
          ))}
        </select>

        <select
          value={situacao}
          onChange={(e) => setSituacao(e.target.value)}
          className={classeDeEntrada}
        >
          <option value="">Publicadas e rascunhos</option>
          <option value="publicada">Só publicadas</option>
          <option value="rascunho">Só rascunhos</option>
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSemClassificacao((v) => !v)}
          aria-pressed={semClassificacao}
          className={cn(
            'inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition',
            semClassificacao
              ? 'bg-accent text-accent-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground',
          )}
        >
          Sem organização
        </button>

        {filtrando ? (
          <button
            type="button"
            onClick={limpar}
            className="inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3 w-3" /> Limpar filtros
          </button>
        ) : null}

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {carregando ? 'Carregando…' : `${total} ${total === 1 ? 'aula' : 'aulas'}`}
        </span>
      </div>

      {aviso ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
          <Check className="h-4 w-4" />
          <span className="flex-1">{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* ── Lista ───────────────────────────────────────────────────── */}
      {carregando && aulas.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Esqueleto key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : aulas.length === 0 ? (
        <EstadoVazio
          icone={Play}
          titulo={filtrando ? 'Nenhuma aula com esses filtros' : 'O acervo está vazio'}
          descricao={
            filtrando
              ? 'Ajuste os filtros para ver o restante do acervo.'
              : 'Comece cadastrando aulas pequenas e específicas — elas serão reutilizadas em várias Trilhas.'
          }
          acaoLabel={filtrando ? 'Limpar filtros' : 'Criar a primeira aula'}
          onAcao={filtrando ? limpar : undefined}
          acaoHref={filtrando ? undefined : '/aulas/gerenciar/aulas/criar'}
        />
      ) : (
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card">
          {/* A linha de seleção. Ela fica DENTRO da lista, colada ao primeiro
              item, porque "selecionar todas" precisa deixar óbvio quais são
              "todas": as que estão na tela, com os filtros que estão valendo. */}
          <label className="flex cursor-pointer items-center gap-3 bg-muted/40 px-4 py-2.5 text-sm font-semibold transition hover:bg-muted/70">
            <Caixa marcada={todasMarcadas} onChange={alternarTodas} />
            <span className="flex-1">
              {marcadas.size > 0
                ? `${marcadas.size} ${marcadas.size === 1 ? 'selecionada' : 'selecionadas'}`
                : 'Selecionar todas desta lista'}
            </span>
            {total > aulas.length ? (
              todasMarcadas && marcadas.size < total ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    marcarTodasDoFiltro()
                  }}
                  className="text-xs font-bold text-primary underline"
                >
                  {aplicando === 'selecionar'
                    ? 'selecionando…'
                    : `selecionar todas as ${total}`}
                </button>
              ) : (
                <span className="text-xs font-normal text-muted-foreground">
                  mostrando {aulas.length} de {total}
                </span>
              )
            ) : null}
          </label>

          {aulas.map((aula) => (
            <div
              key={aula._id}
              className={cn(
                'flex flex-wrap items-center gap-3 px-4 py-3 transition',
                marcadas.has(aula._id) && 'bg-primary/[0.06]',
              )}
            >
              <Caixa
                marcada={marcadas.has(aula._id)}
                onChange={() => alternarMarcada(aula._id)}
                rotulo={`Selecionar ${aula.titulo}`}
              />
              <div className="min-w-[14rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/aulas/${aula._id}`}
                    className="truncate font-semibold transition hover:text-primary"
                  >
                    {aula.titulo}
                  </Link>
                  {aula.tipo === 'resumo' ? <Selo tom="primario">Resumo</Selo> : null}
                  {aula.publicada === false ? <Selo>Rascunho</Selo> : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {aula.localizacao || (
                    <span className="text-accent-foreground">Sem organização</span>
                  )}
                </p>
              </div>

              <div className="flex flex-none items-center gap-3 text-xs text-muted-foreground">
                {aula.duracaoLabel ? (
                  <span className="tabular-nums">{aula.duracaoLabel}</span>
                ) : null}

                <span className="flex items-center gap-1.5">
                  <Recurso ativo={aula.recursos?.resumo} icone={Sparkles} rotulo="Aula Resumo" />
                  <Recurso ativo={aula.recursos?.pdf} icone={FileText} rotulo="PDF" />
                  <Recurso ativo={aula.recursos?.flashcards} icone={Layers} rotulo="Flashcards" />
                </span>

                {aula.trilhas && aula.trilhas.length > 0 ? (
                  <span
                    title={aula.trilhas.map((t) => t.titulo).join('\n')}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary"
                  >
                    <Route className="h-3 w-3" />
                    {aula.trilhas.length}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-none items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOrganizando(aula)}
                  title="Organizar na taxonomia"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Layers className="h-4 w-4" />
                </button>
                <Link
                  href={`/aulas/gerenciar/catalogo/${aula._id}`}
                  title="Editar aula"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {organizando ? (
        <PainelDeOrganizacao
          aula={organizando}
          nos={nos}
          aoFechar={() => setOrganizando(null)}
          aoSalvar={() => {
            setOrganizando(null)
            carregar()
          }}
        />
      ) : null}

      {/* ══ A barra de ações em lote ══════════════════════════════════
          Ela só existe quando há seleção, e desliza de baixo. Uma barra
          permanente com botões cinzentos ensinaria o olho a ignorá-la
          justamente onde mora a ação mais destrutiva do painel. */}
      <AnimatePresence>
        {marcadas.size > 0 ? (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md"
          >
            <div className="container mx-auto flex max-w-[100rem] flex-wrap items-center gap-2">
              <span className="flex items-center gap-2 font-heading text-base font-extrabold">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-primary px-2 text-sm text-primary-foreground">
                  {marcadas.size}
                </span>
                {marcadas.size === 1 ? 'aula selecionada' : 'aulas selecionadas'}
              </span>

              <button
                type="button"
                onClick={() => setMarcadas(new Set())}
                className="text-xs font-semibold text-muted-foreground underline transition hover:text-foreground"
              >
                limpar
              </button>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <BotaoDuo
                  tom="claro"
                  tamanho="pequeno"
                  onClick={() => aplicarEmLote('publicar')}
                  disabled={Boolean(aplicando)}
                >
                  {aplicando === 'publicar' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Publicar
                </BotaoDuo>

                <BotaoDuo
                  tom="claro"
                  tamanho="pequeno"
                  onClick={() => aplicarEmLote('ocultar')}
                  disabled={Boolean(aplicando)}
                >
                  {aplicando === 'ocultar' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  Ocultar
                </BotaoDuo>

                <BotaoDuo
                  tom="perigo"
                  tamanho="pequeno"
                  onClick={() => setConfirmandoExclusao(true)}
                  disabled={Boolean(aplicando)}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </BotaoDuo>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {confirmandoExclusao ? (
        <ConfirmacaoDeExclusao
          quantidade={marcadas.size}
          ocupado={aplicando === 'excluir'}
          aoCancelar={() => setConfirmandoExclusao(false)}
          aoConfirmar={() => aplicarEmLote('excluir')}
        />
      ) : null}
    </PainelDeEnsino>
  )
}

function Recurso({
  ativo,
  icone: Icone,
  rotulo,
}: {
  ativo?: boolean
  icone: typeof FileText
  rotulo: string
}) {
  return (
    <span
      title={ativo ? rotulo : `Sem ${rotulo.toLowerCase()}`}
      className={cn('inline-flex', ativo ? 'text-primary' : 'text-muted-foreground/25')}
    >
      <Icone className="h-3.5 w-3.5" />
    </span>
  )
}

/**
 * O painel lateral de classificação rápida.
 *
 * Existe para uma tarefa só: esvaziar a fila de "aulas sem organização" sem
 * sair da lista. São quatro campos — onde a aula mora, profundidade, duração e
 * tags — e nada além. Todo o resto (vídeo, resumo, relações, permissões) mora
 * no editor completo, porque campo repetido em dois lugares vira duas verdades.
 */
function PainelDeOrganizacao({
  aula,
  nos,
  aoFechar,
  aoSalvar,
}: {
  aula: AulaNoCatalogo
  nos: NoNaTela[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const [ensino, setEnsino] = useState<any>({ tipo: 'aula', ...(aula.ensino || {}) })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const porNivel = useCallback(
    (nivel: string, paiId?: string | null) =>
      nos.filter((n) => n.nivel === nivel && (paiId === undefined || n.paiId === paiId)),
    [nos],
  )

  function definir(campo: string, valor: any) {
    setEnsino((atual: any) => {
      const proximo = { ...atual, [campo]: valor || null }
      // Trocar um nível acima invalida os de baixo: um subtópico que pertencia
      // a outro tópico ficaria pendurado no lugar errado, calado.
      const indice = NIVEIS.indexOf(campo.replace('Id', '') as any)
      if (indice >= 0) {
        for (const abaixo of NIVEIS.slice(indice + 1)) proximo[`${abaixo}Id`] = null
      }
      return proximo
    })
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const resposta = await fetch(`/api/ensino/aulas/${aula._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ensino }),
      })
      const d = await resposta.json().catch(() => ({}))
      if (!resposta.ok) throw new Error(d.error || 'Não foi possível salvar.')
      aoSalvar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível salvar.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={aoFechar}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-hidden bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Organizar aula
            </p>
            <h2 className="truncate font-heading text-base font-semibold tracking-tight">
              {aula.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {NIVEIS.map((nivel, indice) => {
            const paiCampo = indice === 0 ? null : `${NIVEIS[indice - 1]}Id`
            const paiId = paiCampo ? ensino[paiCampo] : null
            const opcoes = indice === 0 ? porNivel('area') : porNivel(nivel, paiId || null)

            return (
              <Campo
                key={nivel}
                rotulo={ROTULO_DO_NIVEL[nivel]}
                dica={
                  nivel === 'subtopico'
                    ? 'Opcional — nem todo conteúdo precisa de mais um nível.'
                    : undefined
                }
              >
                <select
                  value={ensino[`${nivel}Id`] || ''}
                  onChange={(e) => definir(`${nivel}Id`, e.target.value)}
                  disabled={indice > 0 && !paiId}
                  className={cn(classeDeEntrada, indice > 0 && !paiId && 'opacity-50')}
                >
                  <option value="">— nenhum —</option>
                  {opcoes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </Campo>
            )
          })}

          <Campo rotulo="Grau de profundidade">
            <select
              value={ensino.profundidade || ''}
              onChange={(e) => setEnsino({ ...ensino, profundidade: e.target.value || null })}
              className={classeDeEntrada}
            >
              <option value="">Não definido</option>
              <option value="essencial">Essencial</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </Campo>

          <Campo rotulo="Duração (minutos)" dica="Aparece nos cartões sem abrir o vídeo.">
            <input
              type="number"
              min={0}
              value={ensino.duracaoSegundos ? Math.round(ensino.duracaoSegundos / 60) : ''}
              onChange={(e) =>
                setEnsino({ ...ensino, duracaoSegundos: Math.max(0, Number(e.target.value) || 0) * 60 })
              }
              className={classeDeEntrada}
            />
          </Campo>

          <Campo rotulo="Tags" dica="Separadas por vírgula. Servem à busca, não à navegação.">
            <input
              value={(ensino.tags || []).join(', ')}
              onChange={(e) =>
                setEnsino({
                  ...ensino,
                  tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean),
                })
              }
              className={classeDeEntrada}
            />
          </Campo>

          {/*
           * O painel para aqui de propósito.
           *
           * Aula Resumo, pré-requisitos, vídeo, PDFs e permissões moram no
           * editor completo. Repeti-los aqui criaria dois lugares para editar a
           * mesma coisa, e a pergunta "qual dos dois vale?" não teria resposta.
           * Este painel resolve UMA coisa: tirar a aula da fila de "sem
           * organização" sem sair da lista.
           */}
          <Link
            href={`/aulas/gerenciar/catalogo/${aula._id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" /> Abrir o editor completo desta aula
          </Link>
        </div>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <BotaoPrincipal onClick={salvar} carregando={salvando}>
            {salvando ? 'Salvando…' : 'Salvar organização'}
          </BotaoPrincipal>
          <BotaoSecundario onClick={aoFechar}>Cancelar</BotaoSecundario>
          {erro ? <span className="text-xs font-semibold text-destructive">{erro}</span> : null}
        </div>
      </div>
    </div>
  )
}

/* =================== SELEÇÃO =================== */

/**
 * A caixa de seleção.
 *
 * Desenhada à mão em vez de `<input type="checkbox">` cru por um motivo
 * prático: o controle nativo é pequeno demais para o dedo e ignora a paleta do
 * tema em boa parte dos navegadores. O input continua existindo, invisível, para
 * o teclado e o leitor de tela funcionarem sem gambiarra de `role`.
 */
function Caixa({
  marcada,
  onChange,
  rotulo,
}: {
  marcada: boolean
  onChange: () => void
  rotulo?: string
}) {
  return (
    <span className="relative flex h-6 w-6 flex-none items-center justify-center">
      <input
        type="checkbox"
        checked={marcada}
        onChange={onChange}
        aria-label={rotulo}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        className={cn(
          'pointer-events-none flex h-5 w-5 items-center justify-center rounded-md transition',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2',
          marcada
            ? 'bg-primary text-primary-foreground'
            : 'bg-card ring-2 ring-inset ring-border peer-hover:ring-primary/50',
        )}
      >
        {marcada ? <Check className="h-3.5 w-3.5" strokeWidth={4} /> : null}
      </span>
    </span>
  )
}

/**
 * A confirmação de exclusão.
 *
 * ELA PEDE ESFORÇO PROPORCIONAL AO ESTRAGO
 *
 * Até dez aulas, um clique em "Excluir" basta — é uma limpeza normal e um
 * diálogo pesado só treinaria o admin a confirmar sem ler. A partir de dez, é
 * preciso digitar a palavra: nesse volume o clique errado apaga trabalho de
 * semanas, e digitar seis letras é o único obstáculo que a pressa não vence
 * por reflexo.
 *
 * O texto diz o que sobrevive e o que não: as Trilhas continuam, mas ficam sem
 * essas aulas. Esconder isso faria a exclusão parecer menor do que é.
 */
function ConfirmacaoDeExclusao({
  quantidade,
  ocupado,
  aoCancelar,
  aoConfirmar,
}: {
  quantidade: number
  ocupado: boolean
  aoCancelar: () => void
  aoConfirmar: () => void
}) {
  const exigeDigitar = quantidade > 10
  const [texto, setTexto] = useState('')
  const liberado = !exigeDigitar || texto.trim().toUpperCase() === 'EXCLUIR'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={aoCancelar}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-full max-w-md rounded-3xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/12 text-destructive">
          <AlertTriangle className="h-7 w-7" strokeWidth={2.5} />
        </span>

        <h2 className="mt-4 font-heading text-xl font-extrabold tracking-tight">
          Excluir {quantidade} {quantidade === 1 ? 'aula' : 'aulas'}?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Isso apaga {quantidade === 1 ? 'a aula' : 'as aulas'} de vez, junto com o progresso e as
          anotações de quem já assistiu. As Trilhas que {quantidade === 1 ? 'a' : 'as'} usavam
          continuam existindo — só ficam sem {quantidade === 1 ? 'ela' : 'elas'}.
        </p>

        <p className="mt-2 text-sm font-semibold">Não dá para desfazer.</p>

        {exigeDigitar ? (
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Digite EXCLUIR para confirmar
            </span>
            <input
              value={texto}
              autoFocus
              onChange={(e) => setTexto(e.target.value)}
              className={cn(classeDeEntrada, 'uppercase tracking-widest')}
            />
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <BotaoDuo tom="perigo" onClick={aoConfirmar} disabled={!liberado || ocupado}>
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {ocupado ? 'Excluindo…' : 'Excluir'}
          </BotaoDuo>
          <BotaoDuo tom="contorno" onClick={aoCancelar}>
            Cancelar
          </BotaoDuo>
        </div>
      </motion.div>
    </div>
  )
}
