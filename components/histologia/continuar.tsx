'use client'

import Link from 'next/link'
import { BookMarked, Clock, Play, Star, Trophy } from 'lucide-react'

import { useProgresso } from '@/lib/histologia/progresso'
import { BASE, rotaDaPagina } from '@/lib/histologia/rotas'

/**
 * "Continuar estudando".
 *
 * Só aparece quando há algo real para continuar. Um bloco vazio dizendo
 * "você ainda não estudou nada" ocuparia o lugar mais valioso da home para não
 * dizer nada — e é exatamente o tipo de placeholder que o módulo não pode ter.
 *
 * Enquanto `carregado` for falso, também não renderiza: o progresso vem do
 * `localStorage` e só existe depois da hidratação. Renderizar antes causaria
 * divergência com o HTML do servidor.
 */
export function ContinuarEstudando() {
  const { progresso, carregado } = useProgresso()

  if (!carregado) return null

  const concluidas = Object.keys(progresso.concluidas).length
  const favoritos = Object.entries(progresso.favoritos)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const aRevisar = Object.keys(progresso.aRevisar).length
  const quizzesFeitos = Object.keys(progresso.quizzes).length

  const temAlgo = progresso.ultima || concluidas > 0 || favoritos.length > 0 || quizzesFeitos > 0
  if (!temAlgo) return null

  return (
    <section
      aria-labelledby="continuar"
      className="rounded-xl border border-teal-600/25 bg-teal-500/[0.05] p-4"
    >
      <h2 id="continuar" className="mb-3 inline-flex items-center gap-1.5 text-sm font-bold">
        <Clock className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden />
        Continuar estudando
      </h2>

      {progresso.ultima && (
        <Link
          href={rotaDaPagina(progresso.ultima.rota)}
          className="group mb-3 flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-teal-600/50"
        >
          <span className="min-w-0">
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
              Onde você parou
            </span>
            <span className="block truncate text-sm font-semibold">{progresso.ultima.titulo}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-teal-700 px-3 py-2 text-xs font-bold text-white">
            <Play className="h-3.5 w-3.5" aria-hidden />
            Retomar
          </span>
        </Link>
      )}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Estatistica rotulo="Lâminas concluídas" valor={concluidas} icone={<Trophy className="h-3.5 w-3.5" aria-hidden />} />
        <Estatistica rotulo="Favoritas" valor={favoritos.length} icone={<Star className="h-3.5 w-3.5" aria-hidden />} />
        <Estatistica rotulo="Estruturas a revisar" valor={aRevisar} icone={<BookMarked className="h-3.5 w-3.5" aria-hidden />} />
        <Estatistica rotulo="Quizzes feitos" valor={quizzesFeitos} icone={<Trophy className="h-3.5 w-3.5" aria-hidden />} />
      </dl>

      {favoritos.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Suas favoritas
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {favoritos.map(([rota]) => (
              <li key={rota}>
                <Link
                  href={rotaDaPagina(rota)}
                  className="inline-flex min-h-[32px] items-center rounded-full border border-border bg-card px-3 text-xs transition-colors hover:border-amber-500/50"
                >
                  {rota.split('/').at(-1)?.replace(/-/g, ' ')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`${BASE}/caderno`}
        className="mt-3 inline-flex min-h-[36px] items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline dark:text-teal-400"
      >
        Abrir caderno e gerenciar meus dados
      </Link>
    </section>
  )
}

function Estatistica({
  rotulo,
  valor,
  icone,
}: {
  rotulo: string
  valor: number
  icone: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <dt className="inline-flex items-center gap-1 text-[10px] font-medium leading-tight text-muted-foreground">
        <span className="text-teal-700 dark:text-teal-400">{icone}</span>
        {rotulo}
      </dt>
      <dd className="mt-0.5 font-heading text-xl font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
