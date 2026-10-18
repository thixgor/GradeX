'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { PageScaffold } from '@/components/page-scaffold'
import { CaixaErro, Esqueleto, api } from '@/components/monitorias/base'
import { LeitorDoResumo } from '@/components/monitorias/resumo/leitor-resumo'
import type { EstadoDoResumo } from '@/lib/monitorias/resumo/tipos'

type Resposta = EstadoDoResumo & { reserva: { id: string; titulo: string; inicio: string | null } }

/** Página de leitura do Resumo por IA (comprador ou admin). Lida do banco: abrir não chama o modelo. */
export default function PaginaDoResumo({ params }: { params: { id: string } }) {
  const [dados, setDados] = useState<Resposta | null>(null)
  const [erro, setErro] = useState('')
  useEffect(() => {
    api<Resposta>(`/api/monitorias/reservas/${params.id}/resumo`)
      .then(setDados)
      .catch((e) => setErro(e instanceof Error ? e.message : 'Não foi possível abrir o resumo.'))
  }, [params.id])

  const voltar = (
    <Link href={`/monitorias/reservas/${params.id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary print:hidden">
      <ArrowLeft className="h-4 w-4" /> Voltar para a reserva
    </Link>
  )
  if (erro) return <PageScaffold>{voltar}<CaixaErro mensagem={erro} className="mx-auto mt-10 max-w-md" /></PageScaffold>
  if (!dados) return <PageScaffold>{voltar}<Esqueleto className="h-[640px] rounded-3xl" /></PageScaffold>
  if (!dados.resultado) {
    return (
      <PageScaffold>
        {voltar}
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          {dados.tarefa?.erroPublico || 'O resumo ainda não está pronto. Você recebe um aviso quando ficar.'}
        </div>
      </PageScaffold>
    )
  }
  return (
    <PageScaffold wide>
      {voltar}
      <LeitorDoResumo resumo={dados.resultado} reserva={dados.reserva} cobertura={dados.tarefa?.cobertura ?? null} />
    </PageScaffold>
  )
}
