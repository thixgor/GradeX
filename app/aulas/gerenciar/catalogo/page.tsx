'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  FileText,
  Layers,
  Pencil,
  Play,
  Plus,
  Route,
  Search,
  Sparkles,
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
          {aulas.map((aula) => (
            <div key={aula._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
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
