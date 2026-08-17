'use client'

import Link from 'next/link'
import { CheckCircle2, CircleSlash, ListPlus, Lock, Sparkles, XCircle } from 'lucide-react'
import { descreverCaminho } from '@/lib/banco/hierarquia'
import { cn } from '@/lib/utils'

/**
 * Uma questão na lista.
 *
 * O cartão tem duas caras. Para quem pode ver, ele mostra o começo do enunciado
 * — o suficiente para reconhecer a questão sem transformar a lista num paredão
 * de texto. Para quem está no plano gratuito e ainda não abriu, ele mostra
 * apenas o que IDENTIFICA a questão (assunto, tipo, dificuldade, ano) e o custo
 * de abrir.
 *
 * Mostrar o metadado é o que permite escolher onde gastar as questões
 * gratuitas. O modelo antigo sorteava cinco e pronto: a pessoa recebia questões
 * de um assunto qualquer, quase nunca o que ela queria testar — que é
 * justamente a única coisa capaz de convencê-la a assinar.
 */

export interface QuestaoDoCartao {
  _id: string
  tipo?: string
  enunciado?: string
  dificuldade?: string
  ano?: number
  fonte?: string
  moduloNome?: string
  topicoNome?: string
  subtopicoNome?: string
  jaResolvida?: boolean
  ultimaResolucao?: { correta?: boolean }
  bloqueada?: boolean
}

const ROTULO_DIFICULDADE: Record<string, { texto: string; classe: string }> = {
  facil: { texto: 'Fácil', classe: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  medio: { texto: 'Média', classe: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  dificil: { texto: 'Difícil', classe: 'bg-red-500/10 text-red-600 dark:text-red-400' },
}

export function CartaoDeQuestao({
  questao,
  indice,
  podeAbrir,
  onAbrir,
  onAdicionarALista,
  abrindo = false,
}: {
  questao: QuestaoDoCartao
  indice: number
  /** Há saldo gratuito para abrir esta questão? Só importa quando bloqueada. */
  podeAbrir?: boolean
  onAbrir?: (id: string) => void
  onAdicionarALista?: (id: string) => void
  abrindo?: boolean
}) {
  const caminho = descreverCaminho(questao)
  const dificuldade = questao.dificuldade ? ROTULO_DIFICULDADE[questao.dificuldade] : null

  const etiquetas = (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
        {questao.tipo === 'discursiva' ? 'Discursiva' : 'Objetiva'}
      </span>
      {dificuldade ? (
        <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold', dificuldade.classe)}>
          {dificuldade.texto}
        </span>
      ) : null}
      {questao.ano ? (
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground tabular-nums">
          {questao.ano}
        </span>
      ) : null}
      {questao.jaResolvida ? (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
            questao.ultimaResolucao?.correta
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400',
          )}
        >
          {questao.ultimaResolucao?.correta ? (
            <CheckCircle2 className="h-2.5 w-2.5" />
          ) : (
            <XCircle className="h-2.5 w-2.5" />
          )}
          {questao.ultimaResolucao?.correta ? 'Acertou' : 'Errou'}
        </span>
      ) : null}
    </div>
  )

  // ── Bloqueada ────────────────────────────────────────────────────────
  if (questao.bloqueada) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/60 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Lock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-muted-foreground">
              {caminho || 'Sem assunto'}
            </p>
            <p className="mt-1 text-sm font-semibold">Questão {indice}</p>
            <div className="mt-2">{etiquetas}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {podeAbrir ? (
                <button
                  type="button"
                  onClick={() => onAbrir?.(questao._id)}
                  disabled={abrindo}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {abrindo ? 'Abrindo…' : 'Abrir com 1 questão grátis'}
                </button>
              ) : (
                <Link
                  href="/loja"
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-bold text-primary-foreground transition hover:brightness-110"
                >
                  Assinar para ver todas
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Aberta ───────────────────────────────────────────────────────────
  return (
    <div className="group relative rounded-xl border border-border bg-card p-4 transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground">
            {caminho || 'Sem assunto'}
          </p>
          <Link
            href={`/banco-questoes/${questao._id}`}
            className="mt-1 block text-sm font-medium leading-relaxed after:absolute after:inset-0 after:content-['']"
          >
            <span className="line-clamp-3">{questao.enunciado || 'Questão sem enunciado'}</span>
          </Link>
          <div className="mt-2">{etiquetas}</div>
        </div>

        {/* O botão fica ACIMA da camada do link do cartão: um botão dentro de
            um link não é clicável nem alcançável por teclado. */}
        {onAdicionarALista ? (
          <button
            type="button"
            onClick={() => onAdicionarALista(questao._id)}
            aria-label="Adicionar a uma lista"
            title="Adicionar a uma lista"
            className="relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
          >
            <ListPlus className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

/** O que aparece quando o filtro não devolve nada. */
export function ListaVazia({ temFiltro, onLimpar }: { temFiltro: boolean; onLimpar: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border py-14 text-center">
      <CircleSlash className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">
        {temFiltro ? 'Nenhuma questão com esses filtros.' : 'O banco ainda não tem questões.'}
      </p>
      {temFiltro ? (
        <button
          type="button"
          onClick={onLimpar}
          className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:bg-muted"
        >
          Limpar filtros
        </button>
      ) : null}
    </div>
  )
}
