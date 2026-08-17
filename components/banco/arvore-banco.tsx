'use client'

import { useMemo, useState } from 'react'
import { ChevronRight, Layers, Search, X } from 'lucide-react'
import {
  filtrarArvore,
  montarArvore,
  totalDaArvore,
  type ModuloDaArvore,
} from '@/lib/banco/hierarquia'
import { cn } from '@/lib/utils'

/**
 * O catálogo do Banco de Questões, visível de uma vez.
 *
 * O que existia antes eram quatro `<select>` encadeados — Período, depois
 * Módulo, depois Tópico, depois Subtópico — em que cada um só ganhava opções
 * depois do clique no anterior. Não dava para VER o catálogo, só adivinhá-lo:
 * para descobrir se havia questões de arritmia era preciso escolher um período
 * ao acaso e ir abrindo caixinhas.
 *
 * Aqui a árvore inteira está na tela, com a contagem em cada nível, e a busca
 * filtra sem ir ao servidor. Escolher um tópico é um clique, e o que está
 * escolhido fica marcado — inclusive quando a busca esconde a linha.
 */

export interface SelecaoDaArvore {
  moduloIds: string[]
  topicoIds: string[]
  subtopicoIds: string[]
}

export const SELECAO_VAZIA: SelecaoDaArvore = { moduloIds: [], topicoIds: [], subtopicoIds: [] }

export function contarSelecionados(selecao: SelecaoDaArvore): number {
  return selecao.moduloIds.length + selecao.topicoIds.length + selecao.subtopicoIds.length
}

export function ArvoreDoBanco({
  modulos,
  topicos,
  subtopicos,
  selecao,
  onChange,
  carregando = false,
}: {
  modulos: { _id: string; nome: string; totalQuestoes?: number }[]
  topicos: { _id: string; moduloId: string; nome: string; totalQuestoes?: number }[]
  subtopicos: { _id: string; topicoId: string; nome: string; totalQuestoes?: number }[]
  selecao: SelecaoDaArvore
  onChange: (selecao: SelecaoDaArvore) => void
  carregando?: boolean
}) {
  const [busca, setBusca] = useState('')
  const [abertos, setAbertos] = useState<string[]>([])

  const arvore = useMemo(
    () => montarArvore(modulos, topicos, subtopicos),
    [modulos, topicos, subtopicos],
  )
  const visivel = useMemo(() => filtrarArvore(arvore, busca), [arvore, busca])
  const buscando = busca.trim().length >= 2

  function alternar(campo: keyof SelecaoDaArvore, id: string) {
    const atual = selecao[campo]
    onChange({
      ...selecao,
      [campo]: atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id],
    })
  }

  const totalEscolhido = contarSelecionados(selecao)

  if (carregando) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg skeleton-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Busca ──────────────────────────────────────────────────────── */}
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar módulo ou tópico…"
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

      {totalEscolhido > 0 ? (
        <button
          type="button"
          onClick={() => onChange(SELECAO_VAZIA)}
          className="mb-2 self-start rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/15"
        >
          {totalEscolhido} {totalEscolhido === 1 ? 'assunto escolhido' : 'assuntos escolhidos'} · limpar
        </button>
      ) : null}

      {/* ── Árvore ─────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {visivel.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            {buscando ? 'Nenhum assunto com esse nome.' : 'O banco ainda não tem assuntos cadastrados.'}
          </p>
        ) : (
          visivel.map((modulo) => (
            <Modulo
              key={modulo._id}
              modulo={modulo}
              // Durante a busca tudo nasce aberto: esconder o resultado atrás de
              // mais um clique desfaz o motivo de ter buscado.
              aberto={buscando || abertos.includes(modulo._id)}
              onAlternarAberto={() =>
                setAbertos((a) =>
                  a.includes(modulo._id) ? a.filter((i) => i !== modulo._id) : [...a, modulo._id],
                )
              }
              selecao={selecao}
              onEscolher={alternar}
            />
          ))
        )}
      </div>

      {buscando ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {totalDaArvore(visivel)} questões nos assuntos encontrados
        </p>
      ) : null}
    </div>
  )
}

function Modulo({
  modulo,
  aberto,
  onAlternarAberto,
  selecao,
  onEscolher,
}: {
  modulo: ModuloDaArvore
  aberto: boolean
  onAlternarAberto: () => void
  selecao: SelecaoDaArvore
  onEscolher: (campo: keyof SelecaoDaArvore, id: string) => void
}) {
  const escolhido = selecao.moduloIds.includes(modulo._id)

  return (
    <div className="mb-0.5">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onAlternarAberto}
          aria-label={aberto ? `Recolher ${modulo.nome}` : `Expandir ${modulo.nome}`}
          aria-expanded={aberto}
          disabled={modulo.topicos.length === 0}
          className="flex h-7 w-6 flex-none items-center justify-center rounded text-muted-foreground transition hover:bg-muted disabled:opacity-25"
        >
          <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', aberto && 'rotate-90')} />
        </button>
        <button
          type="button"
          onClick={() => onEscolher('moduloIds', modulo._id)}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
            escolhido ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
          )}
        >
          <Layers className="h-3.5 w-3.5 flex-none opacity-60" />
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{modulo.nome}</span>
          <span className="flex-none text-[11px] tabular-nums opacity-60">{modulo.totalQuestoes}</span>
        </button>
      </div>

      {aberto ? (
        <div className="ml-3 border-l border-border pl-1">
          {modulo.topicos.map((topico) => {
            const topicoEscolhido = selecao.topicoIds.includes(topico._id)
            return (
              <div key={topico._id}>
                <button
                  type="button"
                  onClick={() => onEscolher('topicoIds', topico._id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition',
                    topicoEscolhido ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px]">{topico.nome}</span>
                  <span className="flex-none text-[11px] tabular-nums opacity-60">
                    {topico.totalQuestoes}
                  </span>
                </button>

                {topico.subtopicos.length > 0 ? (
                  <div className="ml-3 border-l border-border pl-1">
                    {topico.subtopicos.map((sub) => {
                      const subEscolhido = selecao.subtopicoIds.includes(sub._id)
                      return (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => onEscolher('subtopicoIds', sub._id)}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition',
                            subEscolhido ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                            {sub.nome}
                          </span>
                          <span className="flex-none text-[10.5px] tabular-nums opacity-60">
                            {sub.totalQuestoes}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
