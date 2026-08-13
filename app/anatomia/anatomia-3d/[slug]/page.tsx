'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'

/** A explicação aprofundada de cada peça é conteúdo pago: entra sob demanda. */
const ModeloDetalhe = dynamic(() => import('@/components/anatomia/modelo-detalhe'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function ModeloDetalhePage() {
  return <PortaoAnatomia secao="modelos">{() => <ModeloDetalhe />}</PortaoAnatomia>
}
