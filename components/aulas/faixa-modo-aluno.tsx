'use client'

import Link from 'next/link'
import { Eye, X } from 'lucide-react'
import { comModo, ROTULO_DO_MODO, type ModoDeVisualizacao } from '@/lib/aulas/modo-visualizacao'

/**
 * Aviso permanente de que a tela está simulando outra permissão (§28).
 *
 * Sem esta faixa, "visualizar como aluno" vira uma armadilha: o admin abre a
 * aula, vê um cadeado, e conclui que a plataforma quebrou. A faixa fica no topo,
 * é impossível de ignorar, e carrega a saída — voltar ao modo normal precisa
 * ser um clique, não uma edição de URL.
 */
export function FaixaModoAluno({ modo, caminho }: { modo: ModoDeVisualizacao; caminho: string }) {
  if (modo === 'admin') return null

  return (
    <div className="sticky top-0 z-40 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-xs text-amber-900 dark:text-amber-100">
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <Eye className="h-3.5 w-3.5" />
        Vendo como: {ROTULO_DO_MODO[modo]}
      </span>
      <span className="opacity-80">Os cadeados abaixo são os que essa pessoa encontraria.</span>
      <Link
        href={comModo(caminho, 'admin')}
        className="inline-flex items-center gap-1 rounded-full bg-amber-500/25 px-2.5 py-0.5 font-semibold transition hover:bg-amber-500/40"
      >
        <X className="h-3 w-3" />
        Sair
      </Link>
    </div>
  )
}
