import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { CatalogoDeSinais } from '@/components/semiologia/catalogo-sinais'
import { resumosDeSinais } from '@/lib/semiologia/catalogo'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Sinais do exame físico | Manual de Semiologia',
  description:
    'Icterícia, edema, cianose, turgência jugular, baqueteamento, asterixe e mais: definição operacional, manobra, mecanismo, causas e desempenho diagnóstico.',
}

export default function SinaisPage() {
  const sinais = resumosDeSinais()
  return (
    <AreaSemiologia alvo="Sinais do exame físico">
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8">
            <Link
              href={ROTAS.raiz}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Manual de Semiologia
            </Link>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Sinais do exame físico</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Cada ficha responde na ordem em que o raciocínio acontece: o que conta como presente, como se procura,
              por que aparece, o que muda na conduta e onde engana.
            </p>
          </header>
          <CatalogoDeSinais sinais={sinais} />
        </div>
      </div>
    </AreaSemiologia>
  )
}
