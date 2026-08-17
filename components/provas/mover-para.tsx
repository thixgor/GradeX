'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CornerUpLeft,
  Folder,
  FolderOpen,
  Home,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import {
  buscarDestinos,
  caminhoAte,
  contarProvas,
  filhosDe,
  podeMoverGrupo,
  type GrupoNaArvore,
  type ProvaNaArvore,
} from '@/lib/provas/arvore-grupos'
import { cn } from '@/lib/utils'

/**
 * Escolher para onde mover — provas ou um grupo inteiro.
 *
 * O que existia antes era um submenu que desenhava a ÁRVORE INTEIRA aberta, um
 * item por grupo, indentado por profundidade. Com dezenas de grupos e
 * subgrupos, escolher o destino virava rolar uma lista de centenas de linhas
 * dentro de uma caixinha de 320px — e as linhas eram indistinguíveis, porque
 * "P1" aparece igual em quatro cursos.
 *
 * Aqui se navega um nível por vez, como numa pasta: o caminho fica na trilha do
 * topo, o botão de confirmar mostra onde a coisa vai cair, e quem já sabe o
 * nome digita e pula direto — cada resultado da busca vem com o caminho, que é
 * o que desfaz o empate entre os quatro "P1".
 *
 * Destinos impossíveis aparecem desabilitados COM o motivo, em vez de sumirem:
 * um grupo que some da lista é um grupo que o admin vai procurar para sempre.
 */

export type AlvoDaMovimentacao =
  | { tipo: 'provas'; ids: string[]; rotulo: string }
  | { tipo: 'grupo'; grupo: GrupoNaArvore }

export function MoverParaDialog({
  aberto,
  alvo,
  grupos,
  provas,
  usuario,
  onFechar,
  onConfirmar,
}: {
  aberto: boolean
  alvo: AlvoDaMovimentacao | null
  grupos: GrupoNaArvore[]
  provas: ProvaNaArvore[]
  usuario: { id: string; ehAdmin: boolean }
  onFechar: () => void
  onConfirmar: (destinoId: string | null) => Promise<void>
}) {
  const [nivelId, setNivelId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  // Abre onde a coisa já está: o destino quase sempre é perto da origem
  // ("subir um nível", "para o grupo irmão"), e começar da raiz obrigaria a
  // refazer à mão o caminho que a pessoa acabou de percorrer.
  useEffect(() => {
    if (!aberto || !alvo) return
    setBusca('')
    setErro('')
    if (alvo.tipo === 'grupo') {
      setNivelId(alvo.grupo.parentGroupId || null)
    } else {
      const primeira = provas.find((p) => alvo.ids.includes(String((p as any)._id)))
      setNivelId((primeira?.groupId as string) || null)
    }
  }, [aberto, alvo, provas])

  const nivel = useMemo(
    () => (nivelId ? grupos.find((g) => g._id === nivelId) || null : null),
    [grupos, nivelId],
  )
  const trilha = useMemo(() => (nivelId ? caminhoAte(grupos, nivelId) : []), [grupos, nivelId])

  /** O que o usuário pode ver como destino — o filtro de visibilidade, não o de permissão. */
  const visiveis = useMemo(
    () =>
      grupos.filter((g) =>
        g.type === 'personal' ? g.createdBy === usuario.id : usuario.ehAdmin || g.type === 'general',
      ),
    [grupos, usuario.id, usuario.ehAdmin],
  )

  const filhos = useMemo(() => filhosDe(visiveis, nivelId), [visiveis, nivelId])
  const resultados = useMemo(() => buscarDestinos(visiveis, busca), [visiveis, busca])

  if (!aberto || !alvo) return null

  /** Por que este destino não serve — ou `null` quando serve. */
  function recusa(destinoId: string | null): string | null {
    if (alvo!.tipo === 'grupo') {
      const v = podeMoverGrupo(grupos, alvo!.grupo._id, destinoId, usuario)
      return v.ok ? null : v.motivo || 'Destino inválido'
    }
    if (!destinoId) return null
    const destino = grupos.find((g) => g._id === destinoId)
    if (destino?.type === 'general' && !usuario.ehAdmin) {
      return 'Apenas administradores movem provas para grupos gerais'
    }
    if (destino?.type === 'personal' && destino.createdBy !== usuario.id) {
      return 'Este grupo é de outra pessoa'
    }
    return null
  }

  const recusaDoNivel = recusa(nivelId)
  const titulo =
    alvo.tipo === 'grupo' ? `Mover “${alvo.grupo.name}”` : `Mover ${alvo.rotulo}`

  async function confirmar(destinoId: string | null) {
    const impedimento = recusa(destinoId)
    if (impedimento) {
      setErro(impedimento)
      return
    }
    setSalvando(true)
    setErro('')
    try {
      await onConfirmar(destinoId)
      onFechar()
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível mover')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !salvando) onFechar()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
      >
        {/* ── Cabeçalho ──────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{titulo}</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Escolha a pasta de destino e confirme embaixo.
            </p>
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
            className="-m-1 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Busca ──────────────────────────────────────────────────── */}
        <div className="border-b border-border px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar grupo pelo nome…"
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-[13px] outline-none focus:border-primary/50"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => setBusca('')}
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Trilha ─────────────────────────────────────────────────── */}
        {!busca ? (
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
            <button
              type="button"
              onClick={() => setNivelId(null)}
              className={cn(
                'flex flex-none items-center gap-1 rounded-md px-2 py-1 transition hover:bg-muted',
                nivelId === null && 'font-bold text-foreground',
              )}
            >
              <Home className="h-3 w-3" /> Início
            </button>
            {trilha.map((g) => (
              <span key={g._id} className="flex flex-none items-center gap-1">
                <ChevronRight className="h-3 w-3 opacity-40" />
                <button
                  type="button"
                  onClick={() => setNivelId(g._id)}
                  className={cn(
                    'max-w-[10rem] truncate rounded-md px-2 py-1 transition hover:bg-muted',
                    g._id === nivelId && 'font-bold text-foreground',
                  )}
                >
                  {g.name}
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* ── Lista ──────────────────────────────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {busca ? (
            resultados.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                Nenhum grupo com esse nome.
              </p>
            ) : (
              resultados.map(({ grupo, caminho }) => (
                <LinhaDeDestino
                  key={grupo._id}
                  grupo={grupo}
                  caminho={caminho.map((g) => g.name).join(' › ')}
                  provas={contarProvas(grupos, provas, grupo._id)}
                  subgrupos={filhosDe(visiveis, grupo._id).length}
                  recusa={recusa(grupo._id)}
                  onAbrir={() => {
                    setBusca('')
                    setNivelId(grupo._id)
                  }}
                />
              ))
            )
          ) : (
            <>
              {nivelId ? (
                <button
                  type="button"
                  onClick={() => setNivelId(nivel?.parentGroupId || null)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted-foreground transition hover:bg-muted"
                >
                  <CornerUpLeft className="h-4 w-4 flex-none" />
                  Subir um nível
                </button>
              ) : null}

              {filhos.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  {nivelId ? 'Nenhum subgrupo aqui dentro.' : 'Nenhum grupo disponível.'}
                </p>
              ) : (
                filhos.map((g) => (
                  <LinhaDeDestino
                    key={g._id}
                    grupo={g}
                    provas={contarProvas(grupos, provas, g._id)}
                    subgrupos={filhosDe(visiveis, g._id).length}
                    recusa={recusa(g._id)}
                    onAbrir={() => setNivelId(g._id)}
                    onEscolher={() => confirmar(g._id)}
                  />
                ))
              )}
            </>
          )}
        </div>

        {/* ── Rodapé ─────────────────────────────────────────────────── */}
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          {erro ? <p className="mb-2 text-[11.5px] text-destructive">{erro}</p> : null}
          {recusaDoNivel && !erro ? (
            <p className="mb-2 text-[11.5px] text-amber-600 dark:text-amber-400">{recusaDoNivel}</p>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => confirmar(nivelId)}
              disabled={salvando || !!recusaDoNivel}
              className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 flex-none animate-spin" />
              ) : (
                <Check className="h-4 w-4 flex-none" />
              )}
              <span className="truncate">
                {nivel ? `Mover para “${nivel.name}”` : 'Mover para a página principal'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinhaDeDestino({
  grupo,
  caminho,
  provas,
  subgrupos,
  recusa,
  onAbrir,
  onEscolher,
}: {
  grupo: GrupoNaArvore
  caminho?: string
  provas: number
  subgrupos: number
  recusa: string | null
  onAbrir: () => void
  onEscolher?: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg px-1 transition',
        recusa ? 'opacity-60' : 'hover:bg-muted',
      )}
    >
      <button
        type="button"
        onClick={onAbrir}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-1.5 py-2 text-left"
        title={recusa || undefined}
      >
        <span
          className="flex h-7 w-7 flex-none items-center justify-center rounded-lg text-[13px]"
          style={{ background: `${grupo.color || '#3B82F6'}1f` }}
        >
          {grupo.icon && grupo.icon !== '📁' ? grupo.icon : <Folder className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{grupo.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">
            {caminho ? `${caminho} › ` : ''}
            {provas} {provas === 1 ? 'prova' : 'provas'}
            {subgrupos > 0 ? ` · ${subgrupos} ${subgrupos === 1 ? 'subgrupo' : 'subgrupos'}` : ''}
            {recusa ? ` · ${recusa}` : ''}
          </span>
        </span>
        {subgrupos > 0 ? (
          <ChevronRight className="h-4 w-4 flex-none text-muted-foreground/50" />
        ) : null}
      </button>

      {/* Escolher aqui sem precisar entrar: o destino mais comum é uma pasta
          que a pessoa está vendo, não uma que ela ainda vai abrir. */}
      {onEscolher && !recusa ? (
        <button
          type="button"
          onClick={onEscolher}
          aria-label={`Mover para ${grupo.name}`}
          title={`Mover para ${grupo.name}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        >
          <FolderOpen className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

/** Barra que aparece quando há provas selecionadas (§ seleção múltipla). */
export function BarraDeSelecao({
  quantidade,
  onMover,
  onLimpar,
  onSelecionarTodas,
  totalVisivel,
}: {
  quantidade: number
  onMover: () => void
  onLimpar: () => void
  onSelecionarTodas?: () => void
  totalVisivel?: number
}) {
  if (quantidade === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-border bg-card/95 px-3 py-2.5 shadow-2xl backdrop-blur">
        <span className="flex-none rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold tabular-nums text-primary">
          {quantidade}
        </span>
        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {quantidade === 1 ? 'prova selecionada' : 'provas selecionadas'}
          {onSelecionarTodas && totalVisivel && quantidade < totalVisivel ? (
            <button
              type="button"
              onClick={onSelecionarTodas}
              className="ml-1.5 font-semibold text-primary underline underline-offset-2"
            >
              selecionar as {totalVisivel}
            </button>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onLimpar}
          className="flex-none rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={onMover}
          className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition hover:brightness-110"
        >
          <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          Mover para…
        </button>
      </div>
    </div>
  )
}
