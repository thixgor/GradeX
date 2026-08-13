'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'

/**
 * O Atlas em si carrega o catálogo do acervo — quase 900 KB de JSON. Ele só é
 * baixado depois que `/api/anatomia` confirma a assinatura; para quem cai na
 * landing de vendas, este import nunca acontece.
 */
const AtlasExperiencia = dynamic(() => import('@/components/anatomia/atlas-experiencia'), {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function AtlasAnatomiaPage() {
  return (
    <PortaoAnatomia secao="atlas">
      {() => (
        <Suspense fallback={<div className="surface-page min-h-screen" />}>
          <AtlasExperiencia />
        </Suspense>
      )}
    </PortaoAnatomia>
  )
}
