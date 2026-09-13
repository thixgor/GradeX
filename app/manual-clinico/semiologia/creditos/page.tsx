import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { AreaSemiologia } from '@/components/semiologia/area'
import { PaginaDeCreditos } from '@/components/semiologia/creditos'
import { ROTAS } from '@/lib/semiologia/rotas'

export const metadata: Metadata = {
  title: 'Créditos, proveniência e direitos | Manual de Semiologia',
  description:
    'Procedência das fontes do Manual de Semiologia: The POCUS Atlas e Radiopaedia.org, o que cada autorização permite, o que ela não cobre e qual documento a sustenta.',
}

export default function CreditosPage() {
  return (
    <AreaSemiologia alvo="Créditos e direitos">
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <Link
            href={ROTAS.raiz}
            className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
            Manual de Semiologia
          </Link>
          <PaginaDeCreditos />
        </div>
      </div>
    </AreaSemiologia>
  )
}
