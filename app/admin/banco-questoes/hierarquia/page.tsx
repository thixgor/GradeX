'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { filtrarArvore, montarArvore, type ModuloDaArvore } from '@/lib/banco/hierarquia'

/**
 * Gerenciar a hierarquia do Banco de Questões.
 *
 * A tela anterior tinha quatro abas — Períodos, Módulos, Tópicos, Subtópicos —
 * e cada aba só funcionava depois de escolher o item da aba anterior num
 * `<select>`. Para renomear um subtópico era preciso lembrar em que período
 * ficava o módulo que continha o tópico que continha o subtópico. A estrutura
 * do banco existia, mas nunca aparecia inteira em lugar nenhum.
 *
 * Agora é uma árvore só, com a contagem em cada nível e criar/renomear/excluir
 * no lugar onde a coisa está. E o nível "Período" saiu: módulo é o topo
 * (ver lib/banco/hierarquia.ts).
 */

type Nivel = 'modulo' | 'topico' | 'subtopico'

const ROTULO: Record<Nivel, string> = {
  modulo: 'Módulo',
  topico: 'Tópico',
  subtopico: 'Subtópico',
}

const ROTA: Record<Nivel, string> = {
  modulo: '/api/admin/banco/modulos',
  topico: '/api/admin/banco/topicos',
  subtopico: '/api/admin/banco/subtopicos',
}

interface Edicao {
  nivel: Nivel
  /** Preenchido ao renomear; vazio ao criar. */
  id?: string
  nome: string
  /** Pai ao criar: moduloId para tópico, topicoId para subtópico. */
  paiId?: string
}

/**
 * O que o admin pediu para excluir, com o tamanho do estrago já medido.
 *
 * A tela usava `confirm()` do navegador, que só cabe uma frase e só tem "ok" e
 * "cancelar" — e do outro lado a rota recusava qualquer nível que tivesse
 * conteúdo. Ou seja: o aviso dizia "ele tem 300 questões", a pessoa clicava em
 * OK e nada acontecia, porque o `?cascata=true` que a rota exigia não era
 * mandado por ninguém. Agora a confirmação lista o que vai junto e a chamada
 * leva a autorização correspondente.
 */
interface Exclusao {
  nivel: Nivel
  id: string
  nome: string
  questoes: number
  topicos: number
  subtopicos: number
  /** Só para subtópico: apagar as questões em vez de apenas desvinculá-las. */
  apagarQuestoes: boolean
}

export default function HierarquiaPage() {
  const [modulos, setModulos] = useState<any[]>([])
  const [topicos, setTopicos] = useState<any[]>([])
  const [subtopicos, setSubtopicos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])

  const [edicao, setEdicao] = useState<Edicao | null>(null)
  const [exclusao, setExclusao] = useState<Exclusao | null>(null)
  const [excluindo, setExcluindo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [recado, setRecado] = useState('')

  const carregar = useCallback(async () => {
    const res = await fetch('/api/banco/hierarquia', { cache: 'no-store' })
    if (res.ok) {
      const d = await res.json()
      setModulos(d.modulos || [])
      setTopicos(d.topicos || [])
      setSubtopicos(d.subtopicos || [])
    }
    setCarregando(false)
  }, [])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const arvore = useMemo(
    () => montarArvore(modulos, topicos, subtopicos),
    [modulos, topicos, subtopicos],
  )
  const visivel = useMemo(() => filtrarArvore(arvore, busca), [arvore, busca])
  const buscando = busca.trim().length >= 2

  async function salvar() {
    if (!edicao || !edicao.nome.trim()) return
    setSalvando(true)
    setErro('')
    try {
      const criando = !edicao.id
      const corpo: Record<string, unknown> = { nome: edicao.nome.trim() }
      if (criando) {
        if (edicao.nivel === 'topico') corpo.moduloId = edicao.paiId
        if (edicao.nivel === 'subtopico') corpo.topicoId = edicao.paiId
      }

      const res = await fetch(criando ? ROTA[edicao.nivel] : `${ROTA[edicao.nivel]}/${edicao.id}`, {
        method: criando ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErro(dados.error || 'Não foi possível salvar')
        return
      }
      setEdicao(null)
      await carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    if (!exclusao) return
    setExcluindo(true)
    setErro('')
    setRecado('')

    // Módulo e tópico levam tudo embaixo deles — a questão não sobrevive à
    // perda do tópico. O subtópico é opcional na questão, então o padrão é
    // soltá-la; apagar só se o admin marcar.
    const cascata = exclusao.nivel === 'subtopico' ? exclusao.apagarQuestoes : true

    try {
      const res = await fetch(`${ROTA[exclusao.nivel]}/${exclusao.id}${cascata ? '?cascata=true' : ''}`, {
        method: 'DELETE',
      })
      const dados = await res.json().catch(() => ({}))

      if (!res.ok) {
        setErro(dados.mensagem || dados.error || 'Não foi possível excluir')
        return
      }

      setRecado(descreverExclusao(exclusao, dados))
      setExclusao(null)
      await carregar()
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <AppShell headerTitle="Hierarquia do banco">
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <div>
          <Link
            href="/admin/banco-questoes"
            className="-m-2 mb-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Banco de Questões
          </Link>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
            <FolderTree className="h-6 w-6 text-primary" />
            Hierarquia
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Módulo › Tópico › Subtópico. O número ao lado é quantas questões estão em cada nível.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar módulo, tópico ou subtópico…"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm outline-none focus:border-primary/50"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <Button
            className="h-10 gap-1.5 rounded-lg text-xs"
            onClick={() => setEdicao({ nivel: 'modulo', nome: '' })}
          >
            <Plus className="h-3.5 w-3.5" /> Novo módulo
          </Button>
        </div>

        {erro ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {erro}
          </p>
        ) : null}

        {recado ? (
          <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
            {recado}
          </p>
        ) : null}

        <section className="rounded-xl border border-border bg-card p-2">
          {carregando ? (
            <div className="space-y-2 p-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-9 rounded-lg skeleton-pulse" />
              ))}
            </div>
          ) : visivel.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {buscando ? 'Nada com esse nome.' : 'Nenhum módulo cadastrado ainda.'}
            </p>
          ) : (
            visivel.map((modulo) => (
              <LinhaModulo
                key={modulo._id}
                modulo={modulo}
                aberto={buscando || abertos.includes(modulo._id)}
                onAlternar={() =>
                  setAbertos((a) =>
                    a.includes(modulo._id) ? a.filter((i) => i !== modulo._id) : [...a, modulo._id],
                  )
                }
                onEditar={setEdicao}
                onExcluir={(alvo) => {
                  setErro('')
                  setRecado('')
                  setExclusao(alvo)
                }}
              />
            ))
          )}
        </section>
      </div>

      {/* ── Criar / renomear ───────────────────────────────────────────── */}
      {edicao ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !salvando) setEdicao(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={edicao.id ? `Renomear ${ROTULO[edicao.nivel]}` : `Novo ${ROTULO[edicao.nivel]}`}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
          >
            <h2 className="text-sm font-bold">
              {edicao.id ? `Renomear ${ROTULO[edicao.nivel].toLowerCase()}` : `Novo ${ROTULO[edicao.nivel].toLowerCase()}`}
            </h2>
            <Label className="mt-3 block text-xs text-muted-foreground">Nome</Label>
            <Input
              autoFocus
              value={edicao.nome}
              onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void salvar()
              }}
              placeholder={edicao.nivel === 'modulo' ? 'Ex: Cardiologia' : 'Ex: Arritmias'}
              className="mt-1 h-9 text-sm"
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={salvando} onClick={() => setEdicao(null)}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!edicao.nome.trim() || salvando} onClick={salvar}>
                {salvando ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {/* ── Excluir ────────────────────────────────────────────────────── */}
      {exclusao ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !excluindo) setExclusao(null)
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Excluir ${ROTULO[exclusao.nivel]}`}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
          >
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Trash2 className="h-4 w-4 text-destructive" />
              Excluir {ROTULO[exclusao.nivel].toLowerCase()} &ldquo;{exclusao.nome}&rdquo;
            </h2>

            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {exclusao.nivel === 'subtopico' ? (
                <p>
                  {exclusao.questoes > 0
                    ? `As ${exclusao.questoes} questões continuam no banco, no mesmo módulo e tópico — elas só deixam de ter subtópico.`
                    : 'Este subtópico está vazio.'}
                </p>
              ) : (
                <>
                  <p>Isto exclui, de uma vez:</p>
                  <ul className="list-disc space-y-0.5 pl-4">
                    {exclusao.topicos > 0 ? <li>{exclusao.topicos} tópico(s)</li> : null}
                    {exclusao.subtopicos > 0 ? <li>{exclusao.subtopicos} subtópico(s)</li> : null}
                    <li className={exclusao.questoes > 0 ? 'font-semibold text-destructive' : undefined}>
                      {exclusao.questoes} questão(ões)
                    </li>
                  </ul>
                  {exclusao.questoes > 0 ? (
                    <p>
                      As respostas já dadas por alunos e as listas que usam essas questões também
                      caem. Não dá para desfazer.
                    </p>
                  ) : null}
                </>
              )}
            </div>

            {exclusao.nivel === 'subtopico' && exclusao.questoes > 0 ? (
              <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-border p-2.5 text-xs">
                <input
                  type="checkbox"
                  checked={exclusao.apagarQuestoes}
                  onChange={(e) => setExclusao({ ...exclusao, apagarQuestoes: e.target.checked })}
                  className="mt-0.5 h-3.5 w-3.5 flex-none accent-[hsl(var(--destructive))]"
                />
                <span>
                  Excluir também as {exclusao.questoes} questões, com as respostas e listas delas.
                  <span className="block text-muted-foreground">Não dá para desfazer.</span>
                </span>
              </label>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" disabled={excluindo} onClick={() => setExclusao(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" size="sm" disabled={excluindo} onClick={confirmarExclusao}>
                {excluindo ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                Excluir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

/** O que aconteceu de fato, com os números que a rota devolveu. */
function descreverExclusao(exclusao: Exclusao, dados: any): string {
  const nome = `${ROTULO[exclusao.nivel]} "${exclusao.nome}"`
  const questoes = dados?.excluidos?.questoes || 0
  const desvinculadas = dados?.questoesDesvinculadas || 0

  if (desvinculadas > 0) return `${nome} excluído. ${desvinculadas} questão(ões) continuam no banco, sem subtópico.`
  if (questoes > 0) return `${nome} excluído, com ${questoes} questão(ões).`
  return `${nome} excluído.`
}

function LinhaModulo({
  modulo,
  aberto,
  onAlternar,
  onEditar,
  onExcluir,
}: {
  modulo: ModuloDaArvore
  aberto: boolean
  onAlternar: () => void
  onEditar: (e: Edicao) => void
  onExcluir: (alvo: Exclusao) => void
}) {
  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-0.5 rounded-lg px-1 hover:bg-muted/60">
        <button
          type="button"
          onClick={onAlternar}
          disabled={modulo.topicos.length === 0}
          aria-label={aberto ? `Recolher ${modulo.nome}` : `Expandir ${modulo.nome}`}
          aria-expanded={aberto}
          className="flex h-8 w-6 flex-none items-center justify-center rounded text-muted-foreground transition hover:bg-muted disabled:opacity-25"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', aberto && 'rotate-90')} />
        </button>
        <span className="min-w-0 flex-1 truncate py-1.5 text-[13px] font-semibold">{modulo.nome}</span>
        <span className="flex-none text-[11px] tabular-nums text-muted-foreground">
          {modulo.totalQuestoes}
        </span>
        <Acoes
          onNovo={() => onEditar({ nivel: 'topico', nome: '', paiId: modulo._id })}
          rotuloNovo="Novo tópico"
          onRenomear={() => onEditar({ nivel: 'modulo', id: modulo._id, nome: modulo.nome })}
          onExcluir={() =>
            onExcluir({
              nivel: 'modulo',
              id: modulo._id,
              nome: modulo.nome,
              questoes: modulo.totalQuestoes,
              topicos: modulo.topicos.length,
              subtopicos: modulo.topicos.reduce((s, t) => s + t.subtopicos.length, 0),
              apagarQuestoes: true,
            })
          }
        />
      </div>

      {aberto ? (
        <div className="ml-3 border-l border-border pl-1">
          {modulo.topicos.length === 0 ? (
            <p className="px-3 py-1.5 text-[11px] text-muted-foreground">Sem tópicos.</p>
          ) : (
            modulo.topicos.map((topico) => (
              <div key={topico._id}>
                <div className="flex items-center gap-0.5 rounded-lg px-1 hover:bg-muted/60">
                  <span className="min-w-0 flex-1 truncate py-1.5 pl-2 text-[12.5px]">{topico.nome}</span>
                  <span className="flex-none text-[11px] tabular-nums text-muted-foreground">
                    {topico.totalQuestoes}
                  </span>
                  <Acoes
                    onNovo={() => onEditar({ nivel: 'subtopico', nome: '', paiId: topico._id })}
                    rotuloNovo="Novo subtópico"
                    onRenomear={() => onEditar({ nivel: 'topico', id: topico._id, nome: topico.nome })}
                    onExcluir={() =>
                      onExcluir({
                        nivel: 'topico',
                        id: topico._id,
                        nome: topico.nome,
                        questoes: topico.totalQuestoes,
                        topicos: 0,
                        subtopicos: topico.subtopicos.length,
                        apagarQuestoes: true,
                      })
                    }
                  />
                </div>

                {topico.subtopicos.length > 0 ? (
                  <div className="ml-3 border-l border-border pl-1">
                    {topico.subtopicos.map((sub) => (
                      <div key={sub._id} className="flex items-center gap-0.5 rounded-lg px-1 hover:bg-muted/60">
                        <span className="min-w-0 flex-1 truncate py-1.5 pl-2 text-[12px] text-muted-foreground">
                          {sub.nome}
                        </span>
                        <span className="flex-none text-[10.5px] tabular-nums text-muted-foreground">
                          {sub.totalQuestoes}
                        </span>
                        <Acoes
                          onRenomear={() => onEditar({ nivel: 'subtopico', id: sub._id, nome: sub.nome })}
                          onExcluir={() =>
                            onExcluir({
                              nivel: 'subtopico',
                              id: sub._id,
                              nome: sub.nome,
                              questoes: sub.totalQuestoes,
                              topicos: 0,
                              subtopicos: 0,
                              apagarQuestoes: false,
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function Acoes({
  onNovo,
  rotuloNovo,
  onRenomear,
  onExcluir,
}: {
  onNovo?: () => void
  rotuloNovo?: string
  onRenomear: () => void
  onExcluir: () => void
}) {
  return (
    <div className="flex flex-none items-center">
      {onNovo ? (
        <button
          type="button"
          onClick={onNovo}
          aria-label={rotuloNovo}
          title={rotuloNovo}
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onRenomear}
        aria-label="Renomear"
        title="Renomear"
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onExcluir}
        aria-label="Excluir"
        title="Excluir"
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
