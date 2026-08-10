import Link from 'next/link'
import { ArrowRight, Columns2 } from 'lucide-react'

import type { ReferenciaNormal } from '@/lib/histopatologia/esquemas'
import { rotaDeComparacao, rotaNormal } from '@/lib/histopatologia/rotas'

/**
 * Âncora na histologia normal e quadro comparativo.
 *
 * O plano é explícito quanto à ordem (§7.3): **primeiro** a arquitetura normal,
 * depois a alteração. Uma diferença só é diferença em relação a algo — e o erro
 * mais comum de quem estuda patologia cedo demais é reconhecer o achado
 * patológico sem conseguir dizer o que ele substituiu.
 *
 * A tabela vem depois, e nunca no lugar da explicação: "sem reduzir toda a
 * explicação à tabela" é literal no plano. Ela usa `<th scope>` em ambos os
 * eixos, porque uma tabela comparativa sem cabeçalhos de linha é ilegível por
 * leitor de tela — cada célula chega sem saber a que aspecto pertence.
 */
export function AncoraNormal({
  referencias,
  slugDaDoenca,
}: {
  referencias: ReferenciaNormal[]
  slugDaDoenca: string
}) {
  if (referencias.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        A âncora na histologia normal ainda não foi definida para esta doença.
      </p>
    )
  }

  return (
    <ul className="space-y-2.5">
      {referencias.map((ref) => (
        <li
          key={ref.caminhoNormal.join('/')}
          className="rounded-xl border border-border bg-card p-3.5"
        >
          <p className="text-sm font-bold leading-snug">{ref.titulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ref.oQueObservar}</p>

          {ref.aproximado && ref.notaDeAproximacao && (
            <p className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-1.5 text-[11px] leading-relaxed">
              <span className="font-bold">Aproximação: </span>
              {ref.notaDeAproximacao}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Link
              href={rotaNormal(ref.caminhoNormal)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] font-bold transition-colors hover:border-teal-600/50"
            >
              Abrir no Manual da Histologia
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link
              href={rotaDeComparacao(slugDaDoenca, ref.caminhoNormal)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-[11px] font-bold transition-colors hover:border-violet-600/50"
            >
              <Columns2 className="h-3.5 w-3.5" aria-hidden />
              Comparar lado a lado
            </Link>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TabelaNormalPatologico({
  linhas,
}: {
  linhas: Array<{ aspecto: string; normal: string; patologico: string }>
}) {
  if (linhas.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left text-xs">
        <caption className="sr-only">
          Comparação entre o tecido normal e o tecido alterado, aspecto por aspecto
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="px-3 py-2 font-bold">
              Aspecto
            </th>
            <th scope="col" className="px-3 py-2 font-bold">
              Normal
            </th>
            <th scope="col" className="px-3 py-2 font-bold">
              Patológico
            </th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.aspecto} className="border-b border-border/60 align-top">
              <th scope="row" className="px-3 py-2.5 font-bold">
                {linha.aspecto}
              </th>
              <td className="px-3 py-2.5 leading-relaxed text-muted-foreground">{linha.normal}</td>
              <td className="px-3 py-2.5 leading-relaxed">{linha.patologico}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
