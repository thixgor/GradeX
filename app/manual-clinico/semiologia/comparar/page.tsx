import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { COMPARADORES } from '@/lib/semiologia/comparadores'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Comparadores - o mesmo achado, causa por causa | Manual de Semiologia',
  description:
    'Qual edema é qual? Onde a cadeia da bilirrubina quebrou? Cianose central ou periférica? Matrizes de diferenciação com o achado que decide cada causa em destaque.',
}

export default function ComparadoresPage() {
  return (
    <AreaSemiologia alvo="Comparadores">
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <header className="mb-8">
            <Link
              href={ROTAS.raiz}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Manual de Semiologia
            </Link>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Comparadores</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              O livro é organizado por doença; a pessoa chega com o achado. Aqui o corte é transversal: o mesmo
              achado, causa por causa, eixo por eixo — com a célula que decide destacada.
            </p>
          </header>

          <ul className="grid gap-4 sm:grid-cols-2">
            {COMPARADORES.map((comparador) => (
              <li key={comparador.slug}>
                <Link
                  href={ROTAS.comparador(comparador.slug)}
                  className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-sky-500/50"
                >
                  <h2 className="text-base font-semibold transition-colors group-hover:text-sky-700 dark:group-hover:text-sky-400">
                    {comparador.titulo}
                  </h2>
                  <p className="mt-1.5 text-sm italic text-muted-foreground">“{comparador.pergunta}”</p>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-muted-foreground">{comparador.introducao}</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {comparador.colunas.map((coluna) => (
                      <li key={coluna.id} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                        {coluna.titulo}
                      </li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AreaSemiologia>
  )
}
