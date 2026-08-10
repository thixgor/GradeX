import Link from 'next/link'
import { ArrowRight, Stethoscope } from 'lucide-react'

import { rotaDaDoenca } from '@/lib/histopatologia/rotas'
import { MARCA_DE_REVISAO } from './tema'
import type { EstadoDeRevisao } from '@/lib/histopatologia/esquemas'

/**
 * Bloco "o que dá errado aqui", exibido nas páginas de Histologia **normal**.
 *
 * É a metade normal → patológico do vínculo bidirecional pedido no plano (§12).
 * Fica num componente próprio, e não embutido nos componentes da Histologia,
 * por uma razão de acoplamento: a Histologia normal não deve passar a depender
 * do módulo de patologia para renderizar. Este bloco é inserido pela rota, ao
 * lado do conteúdo existente, e desaparece por completo quando não há doença
 * vinculada — sem espaço reservado, sem cabeçalho vazio.
 */
export function DoencasRelacionadas({
  doencas,
}: {
  doencas: Array<{ slug: string; nome: string; estadoDeRevisao: EstadoDeRevisao }>
}) {
  if (doencas.length === 0) return null

  return (
    <section
      aria-labelledby="doencas-relacionadas"
      className="container mx-auto max-w-6xl px-4 pb-10"
    >
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="editorial-mark mb-1.5">Histopatologia</p>
        <h2
          id="doencas-relacionadas"
          className="inline-flex items-center gap-2 font-heading text-lg font-semibold tracking-tight"
        >
          <Stethoscope className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden />
          O que dá errado neste tecido
        </h2>
        <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Estas doenças usam esta lâmina como referência de normalidade. Abrir uma delas mostra o
          mesmo tecido depois da agressão — e o que exatamente foi perdido, ganho ou reorganizado.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {doencas.map((doenca) => {
            const marca = MARCA_DE_REVISAO[doenca.estadoDeRevisao]
            return (
              <li key={doenca.slug}>
                <Link
                  href={rotaDaDoenca(doenca.slug)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-background px-3.5 text-sm font-semibold transition-colors hover:border-rose-500/50"
                >
                  {doenca.nome}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${marca.classe}`}
                  >
                    <span aria-hidden>{marca.simbolo}</span> {marca.rotulo}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
