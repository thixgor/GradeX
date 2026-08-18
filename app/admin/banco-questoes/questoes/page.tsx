'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { EditorDeQuestao } from '@/components/admin/banco/editor-de-questao'
import {
  CATALOGO_VAZIO,
  caminhoDaQuestao,
  modulosOrdenados,
  type Catalogo,
} from '@/lib/banco/catalogo'
import type { BancoPaginacao, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { cn } from '@/lib/utils'

/**
 * Gerenciar as questões do banco.
 *
 * A tela anterior tinha um bug que impedia salvar QUALQUER questão criada
 * depois de o nível "Período" sair do produto (ver lib/banco/hierarquia.ts):
 * ela abria o formulário com `String(questao.periodoId)`, que numa questão sem
 * período é a string "undefined", pedia os módulos daquele "período"
 * inexistente — e mandava esse texto para a rota, que tentava construir um
 * ObjectId com ele e devolvia 500 "Erro ao atualizar questão".
 *
 * O conserto não foi só remover o campo: o problema era a forma. Quatro
 * `<select>` encadeados, cada um esperando o anterior e cada um com uma
 * requisição própria; `alert()` do navegador para erro; `confirm()` para
 * excluir; a busca só disparando no Enter; e a lista trazendo Período numa
 * coluna que já não existia. Agora o catálogo inteiro vem numa chamada só, o
 * assunto é um campo com busca, e cada resposta do servidor aparece na tela em
 * que foi pedida.
 */

const POR_PAGINA = 20

interface Filtros {
  busca: string
  moduloId: string
  topicoId: string
  tipo: string
  dificuldade: string
  ordenar: string
  revisar: boolean
}

const FILTROS_VAZIOS: Filtros = {
  busca: '',
  moduloId: '',
  topicoId: '',
  tipo: '',
  dificuldade: '',
  ordenar: 'recentes',
  revisar: false,
}

const ROTULO_DIFICULDADE: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Média',
  dificil: 'Difícil',
}

export default function AdminQuestoesPage() {
  return (
    <AppShell headerTitle="Questões do banco">
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const [catalogo, setCatalogo] = useState<Catalogo>(CATALOGO_VAZIO)
  const [questoes, setQuestoes] = useState<BancoQuestaoComHierarquia[]>([])
  const [paginacao, setPaginacao] = useState<BancoPaginacao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [buscaDigitada, setBuscaDigitada] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS)
  const [filtrosAbertos, setFiltrosAbertos] = useState(false)
  const [pagina, setPagina] = useState(1)

  const [editando, setEditando] = useState<{ questao: BancoQuestaoComHierarquia | null } | null>(null)
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [recado, setRecado] = useState('')

  const [duplicatasAbertas, setDuplicatasAbertas] = useState(false)
  const [duplicatas, setDuplicatas] = useState<any[]>([])
  const [carregandoDuplicatas, setCarregandoDuplicatas] = useState(false)

  // Cada busca leva um número. Só a resposta do pedido mais recente entra na
  // tela: digitando rápido, a resposta de "car" chegava depois da de "cardio" e
  // a lista terminava mostrando o resultado do que a pessoa já tinha apagado.
  const pedido = useRef(0)

  const carregarCatalogo = useCallback(async () => {
    try {
      const res = await fetch('/api/banco/hierarquia', { cache: 'no-store' })
      if (!res.ok) return
      const dados = await res.json()
      setCatalogo({
        modulos: dados.modulos || [],
        topicos: dados.topicos || [],
        subtopicos: dados.subtopicos || [],
      })
    } catch {
      // A lista de questões ainda funciona sem o catálogo; os filtros de
      // assunto é que ficam vazios. Falhar a tela inteira aqui seria pior.
    }
  }, [])

  const carregarQuestoes = useCallback(async () => {
    const meu = ++pedido.current
    setCarregando(true)
    setErro('')
    try {
      const params = new URLSearchParams({ page: String(pagina), limit: String(POR_PAGINA) })
      if (filtros.busca) params.set('busca', filtros.busca)
      if (filtros.moduloId) params.set('moduloId', filtros.moduloId)
      if (filtros.topicoId) params.set('topicoId', filtros.topicoId)
      if (filtros.tipo) params.set('tipo', filtros.tipo)
      if (filtros.dificuldade) params.set('dificuldade', filtros.dificuldade)
      if (filtros.ordenar !== 'recentes') params.set('ordenar', filtros.ordenar)
      if (filtros.revisar) params.set('revisar', '1')

      const res = await fetch(`/api/admin/banco/questoes?${params.toString()}`, { cache: 'no-store' })
      const dados = await res.json().catch(() => ({}))
      if (meu !== pedido.current) return

      if (!res.ok) {
        setErro(dados.error || 'Não foi possível carregar as questões')
        setQuestoes([])
        setPaginacao(null)
        return
      }

      setQuestoes(dados.questoes || [])
      setPaginacao(dados.paginacao || null)
    } catch {
      if (meu === pedido.current) setErro('Não foi possível falar com o servidor')
    } finally {
      if (meu === pedido.current) setCarregando(false)
    }
  }, [filtros, pagina])

  useEffect(() => {
    void carregarCatalogo()
  }, [carregarCatalogo])

  /**
   * Entrar direto numa questão pelo endereço.
   *
   * A tela de relatos abre `?busca=<id da questão>` quando o admin clica em
   * "ver questão" — e caía numa busca por enunciado, que nunca casa com um id:
   * a lista abria vazia e o relato ficava sem resposta. Um id abre a questão;
   * qualquer outro texto vira busca mesmo. Lido de `window.location` de
   * propósito: `useSearchParams` obrigaria a envolver a página inteira num
   * Suspense só por causa disto.
   */
  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search)
    const inicial = (parametros.get('id') || parametros.get('busca') || '').trim()
    if (!inicial) return

    if (!/^[0-9a-fA-F]{24}$/.test(inicial)) {
      setBuscaDigitada(inicial)
      return
    }

    let cancelado = false
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/banco/questoes/${inicial}`, { cache: 'no-store' })
        const dados = await res.json().catch(() => ({}))
        if (cancelado) return
        if (!res.ok) {
          setErro(dados.error || 'Questão não encontrada')
          return
        }
        setEditando({ questao: dados.questao })
      } catch {
        if (!cancelado) setErro('Não foi possível abrir a questão')
      }
    })()
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    void carregarQuestoes()
  }, [carregarQuestoes])

  // A busca acompanha a digitação, com uma pausa. Antes era preciso apertar
  // Enter ou clicar na lupa — e nada na tela dizia isso.
  useEffect(() => {
    const t = setTimeout(() => {
      setFiltros((f) => (f.busca === buscaDigitada.trim() ? f : { ...f, busca: buscaDigitada.trim() }))
    }, 350)
    return () => clearTimeout(t)
  }, [buscaDigitada])

  useEffect(() => {
    setPagina(1)
  }, [filtros])

  const modulos = useMemo(() => modulosOrdenados(catalogo), [catalogo])
  const topicosDoFiltro = useMemo(() => {
    const lista = filtros.moduloId
      ? catalogo.topicos.filter((t) => t.moduloId === filtros.moduloId)
      : catalogo.topicos
    return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }))
  }, [catalogo, filtros.moduloId])

  const temFiltro =
    Boolean(filtros.busca || filtros.moduloId || filtros.topicoId || filtros.tipo || filtros.dificuldade || filtros.revisar) ||
    filtros.ordenar !== 'recentes'

  async function excluir(id: string) {
    setExcluindo(id)
    try {
      const res = await fetch(`/api/admin/banco/questoes/${id}`, { method: 'DELETE' })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível excluir a questão')
        return
      }
      setConfirmandoExclusao(null)
      setRecado('Questão excluída.')
      await carregarQuestoes()
    } catch {
      setErro('Não foi possível excluir a questão')
    } finally {
      setExcluindo(null)
    }
  }

  async function exportar() {
    setExportando(true)
    try {
      const params = new URLSearchParams()
      if (filtros.moduloId) params.set('moduloId', filtros.moduloId)
      if (filtros.topicoId) params.set('topicoId', filtros.topicoId)
      if (filtros.tipo) params.set('tipo', filtros.tipo)

      const res = await fetch(`/api/admin/banco/exportar?${params.toString()}`)
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}))
        setErro(dados.error || 'Não foi possível exportar')
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `banco_questoes_${new Date().toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      setErro('Não foi possível exportar')
    } finally {
      setExportando(false)
    }
  }

  async function carregarDuplicatas() {
    setCarregandoDuplicatas(true)
    setDuplicatasAbertas(true)
    try {
      const res = await fetch('/api/admin/banco/questoes/duplicatas')
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível buscar duplicatas')
        setDuplicatasAbertas(false)
        return
      }
      setDuplicatas(dados.duplicatas || [])
    } catch {
      setErro('Não foi possível buscar duplicatas')
      setDuplicatasAbertas(false)
    } finally {
      setCarregandoDuplicatas(false)
    }
  }

  async function excluirDuplicata(id: string) {
    setExcluindo(id)
    try {
      const res = await fetch(`/api/admin/banco/questoes/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const dados = await res.json().catch(() => ({}))
        setErro(dados.error || 'Não foi possível excluir')
        return
      }
      setDuplicatas((grupos) =>
        grupos
          .map((grupo) => {
            const restantes = grupo.questoes.filter((q: any) => String(q._id) !== id)
            return { ...grupo, questoes: restantes, count: restantes.length }
          })
          .filter((grupo) => grupo.count > 1),
      )
      await carregarQuestoes()
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
      {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/banco-questoes"
          className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Questões
          </h1>
          <p className="text-xs text-muted-foreground">
            {paginacao
              ? `${paginacao.total.toLocaleString('pt-BR')} ${paginacao.total === 1 ? 'questão' : 'questões'}${temFiltro ? ' no filtro atual' : ' no banco'}`
              : 'Criar, editar e excluir questões'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditando({ questao: null })}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Nova questão
        </button>
      </div>

      {/* ── Busca e filtros ────────────────────────────────────────────── */}
      <section className="vidro vidro-brilho relevo rounded-[22px] p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
              placeholder="Buscar no enunciado, na fonte ou nas tags…"
              className="h-10 w-full rounded-xl border border-border bg-background/70 pl-9 pr-9 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
            {buscaDigitada ? (
              <button
                type="button"
                onClick={() => setBuscaDigitada('')}
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
              data-marcado={filtrosAbertos || temFiltro}
              aria-expanded={filtrosAbertos}
              onClick={() => setFiltrosAbertos((v) => !v)}
              className="tecla inline-flex h-10 flex-1 items-center justify-center gap-1.5 px-3 text-xs font-semibold sm:flex-none"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
            </button>
            {temFiltro ? (
              <button
                type="button"
                onClick={() => {
                  setFiltros(FILTROS_VAZIOS)
                  setBuscaDigitada('')
                }}
                className="inline-flex h-10 items-center rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Limpar
              </button>
            ) : null}
          </div>
        </div>

        {filtrosAbertos ? (
          <div className="mt-3 space-y-3 border-t border-border pt-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Campo rotulo="Módulo">
                <select
                  value={filtros.moduloId}
                  onChange={(e) =>
                    // Trocar de módulo zera o tópico: o tópico escolhido é de
                    // outro módulo e a lista voltaria vazia sem explicar por quê.
                    setFiltros((f) => ({ ...f, moduloId: e.target.value, topicoId: '' }))
                  }
                  className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todos</option>
                  {modulos.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo rotulo="Tópico">
                <select
                  value={filtros.topicoId}
                  onChange={(e) => setFiltros((f) => ({ ...f, topicoId: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todos</option>
                  {topicosDoFiltro.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo rotulo="Tipo">
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todos</option>
                  <option value="objetiva">Objetiva</option>
                  <option value="discursiva">Discursiva</option>
                </select>
              </Campo>

              <Campo rotulo="Dificuldade">
                <select
                  value={filtros.dificuldade}
                  onChange={(e) => setFiltros((f) => ({ ...f, dificuldade: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="">Todas</option>
                  <option value="facil">Fácil</option>
                  <option value="medio">Média</option>
                  <option value="dificil">Difícil</option>
                </select>
              </Campo>

              <Campo rotulo="Ordenar por">
                <select
                  value={filtros.ordenar}
                  onChange={(e) => setFiltros((f) => ({ ...f, ordenar: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-background px-2 text-[13px] outline-none focus:border-primary/50"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="atualizadas">Editadas por último</option>
                </select>
              </Campo>
            </div>

            {/* O filtro que existe por causa do bug antigo: enquanto o PUT
                gravava o que viesse, dava para salvar objetiva sem gabarito e
                discursiva sem resposta. Isto é como se acha o estrago. */}
            <button
              type="button"
              data-marcado={filtros.revisar}
              onClick={() => setFiltros((f) => ({ ...f, revisar: !f.revisar }))}
              className="tecla inline-flex h-9 items-center gap-1.5 px-3 text-xs font-semibold"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Só as que precisam de revisão
            </button>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => void carregarDuplicatas()}
            disabled={carregandoDuplicatas}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {carregandoDuplicatas ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Procurar duplicatas
          </button>
          <button
            type="button"
            onClick={() => void exportar()}
            disabled={exportando}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            {exportando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Exportar TXT
          </button>
          <Link
            href="/admin/banco-questoes/hierarquia"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <FolderTree className="h-3.5 w-3.5" />
            Hierarquia
          </Link>
        </div>
      </section>

      {erro ? (
        <p className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
          <span>{erro}</span>
        </p>
      ) : null}

      {/* ── Lista ──────────────────────────────────────────────────────── */}
      {carregando ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl skeleton-pulse" />
          ))}
        </div>
      ) : questoes.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-border p-10 text-center">
          <p className="text-sm font-medium">Nenhuma questão encontrada</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {temFiltro ? 'Tente afrouxar os filtros.' : 'Crie a primeira ou importe uma prova.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questoes.map((questao) => {
            const id = String(questao._id)
            const semGabarito =
              questao.tipo === 'objetiva' && !(questao.alternativas || []).some((a) => a.correta)
            const caminho = caminhoDaQuestao(questao)

            return (
              <article
                key={id}
                className="vidro relevo group rounded-2xl border border-border/60 p-3 transition hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
                          questao.tipo === 'objetiva'
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {questao.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                      </span>
                      {questao.dificuldade ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {ROTULO_DIFICULDADE[questao.dificuldade] || questao.dificuldade}
                        </span>
                      ) : null}
                      {questao.imagemUrl ? (
                        <span title="Tem imagem" className="text-muted-foreground">
                          <ImageIcon className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                      {questao.explicacao ? (
                        <span title="Tem comentário" className="text-muted-foreground">
                          <MessageSquareText className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                      {semGabarito ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                          <AlertTriangle className="h-3 w-3" /> sem gabarito
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditando({ questao })}
                      className="block w-full text-left"
                    >
                      <p className="line-clamp-2 text-sm">{questao.enunciado}</p>
                    </button>

                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {caminho || 'Sem assunto'}
                      {questao.fonte ? ` · ${questao.fonte}` : ''}
                      {questao.ano ? ` · ${questao.ano}` : ''}
                      {questao.totalRespostas
                        ? ` · ${questao.totalRespostas} ${questao.totalRespostas === 1 ? 'resposta' : 'respostas'}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex flex-none gap-1">
                    <button
                      type="button"
                      onClick={() => setEditando({ questao })}
                      aria-label="Editar questão"
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoExclusao(id)}
                      aria-label="Excluir questão"
                      className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* A confirmação de exclusão fica na própria linha, dizendo o
                    que some junto. Era um `confirm()` do navegador, que não
                    mostra de qual questão está falando. */}
                {confirmandoExclusao === id ? (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-500/40 bg-red-500/5 px-3 py-2">
                    <p className="text-[12px] text-red-600 dark:text-red-400">
                      Excluir esta questão? As respostas dos alunos e o lugar dela nas listas somem
                      junto.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmandoExclusao(null)}
                        className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-3 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => void excluir(id)}
                        disabled={excluindo === id}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {excluindo === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Excluir
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      {/* ── Paginação ──────────────────────────────────────────────────── */}
      {paginacao && paginacao.totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={pagina <= 1 || carregando}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs tabular-nums text-muted-foreground">
            Página {paginacao.page} de {paginacao.totalPages}
          </span>
          <button
            type="button"
            disabled={pagina >= paginacao.totalPages || carregando}
            onClick={() => setPagina((p) => p + 1)}
            className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-xs font-semibold disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}

      <EditorDeQuestao
        aberto={editando !== null}
        questao={editando?.questao || null}
        catalogo={catalogo}
        onFechar={() => setEditando(null)}
        onCatalogoMudou={carregarCatalogo}
        onSalvo={(salva, criada) => {
          setEditando(null)
          setRecado(criada ? 'Questão criada.' : 'Questão salva.')
          if (criada) {
            void carregarQuestoes()
          } else {
            // A linha editada é trocada no lugar: recarregar a página inteira
            // faria a lista pular para o topo e perder onde a pessoa estava.
            setQuestoes((atuais) =>
              atuais.map((q) => (String(q._id) === String(salva._id) ? salva : q)),
            )
          }
          void carregarCatalogo()
        }}
      />

      {/* ── Duplicatas ─────────────────────────────────────────────────── */}
      <Dialog open={duplicatasAbertas} onOpenChange={(v) => setDuplicatasAbertas(v)}>
        <DialogContent className="w-full max-w-3xl p-0">
          <DialogHeader className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Copy className="h-4 w-4 text-yellow-500" />
              Questões duplicadas
            </DialogTitle>
            <button
              type="button"
              onClick={() => setDuplicatasAbertas(false)}
              aria-label="Fechar"
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            {carregandoDuplicatas ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : duplicatas.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
                <p className="text-sm font-medium">Nenhuma duplicata</p>
                <p className="text-xs text-muted-foreground">
                  Todos os enunciados do banco são diferentes entre si.
                </p>
              </div>
            ) : (
              duplicatas.map((grupo, i) => (
                <div key={i} className="rounded-xl border border-border p-3">
                  <p className="mb-2 line-clamp-2 text-[13px] font-medium">{grupo.enunciado}</p>
                  <div className="space-y-1.5">
                    {grupo.questoes.map((q: any) => (
                      <div
                        key={String(q._id)}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-xs"
                      >
                        <span className="text-muted-foreground">
                          {String(q._id).slice(-6)} · criada em{' '}
                          {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => void excluirDuplicata(String(q._id))}
                          disabled={excluindo === String(q._id)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-500 px-2.5 text-[11px] font-semibold text-white disabled:opacity-60"
                        >
                          {excluindo === String(q._id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={Boolean(recado)}
        onOpenChange={(v) => (v ? null : setRecado(''))}
        message={recado}
        type="success"
        duration={2500}
      />
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{rotulo}</span>
      {children}
    </label>
  )
}
