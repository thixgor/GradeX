'use client'

/**
 * Vitrine, lado "Quero ensinar": pedidos reais de alunos abertos agora. É a
 * prova de que há procura, o que tira o medo de quem chega e vê poucos
 * monitores. Sem pedidos, a seção não aparece (nunca mostra "0").
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from './base'
import { CartaoDemanda } from './cartao-demanda'
import type { PeriodoDemanda, QuandoDemanda } from '@/lib/monitorias/demandas-regras'

interface Publico {
  total: number
  recentes: Array<{
    id: string
    materia: string
    assunto: string | null
    pessoas: number
    valorPorPessoaCentavos: number | null
    duracaoMin: number
    quando: QuandoDemanda
    periodos: PeriodoDemanda[]
    createdAt: string
  }>
}

export function AlunosProcurando() {
  const [dados, setDados] = useState<Publico | null>(null)
  useEffect(() => {
    api<Publico>('/api/monitorias/publico/demandas').then(setDados).catch(() => {})
  }, [])
  if (!dados || dados.total === 0) return null
  return (
    <section className="mb-16" aria-labelledby="alunos-procurando">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Agora
          </p>
          <h2 id="alunos-procurando" className="mt-1 font-heading text-2xl font-semibold">
            {dados.total} {dados.total === 1 ? 'aluno procurando' : 'alunos procurando'} monitor
          </h2>
          <p className="mt-1 max-w-[56ch] text-sm text-muted-foreground">Pedidos de verdade, esperando alguém que domine a matéria. Responda e combine pelo chat.</p>
        </div>
        <Link href="/monitorias/painel/oportunidades" className="shrink-0">
          <Button className="w-full rounded-xl sm:w-auto">Responder pedidos <ArrowRight className="ml-1.5 h-4 w-4" /></Button>
        </Link>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dados.recentes.map((d) => (
          <li key={d.id}>
            <CartaoDemanda d={{ ...d, assunto: d.assunto || undefined }} criadoEm={d.createdAt} className="h-full" />
          </li>
        ))}
      </ul>
    </section>
  )
}
