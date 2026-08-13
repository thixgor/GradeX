'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'

/** A vitrine carrega o catálogo dos modelos; só entra depois do veredito. */
const VitrineModelos = dynamic(() => import('@/components/anatomia/vitrine-modelos'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function Anatomia3DPage() {
  return <PortaoAnatomia secao="modelos">{() => <VitrineModelos />}</PortaoAnatomia>
}
