'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { PortaoAnatomia } from '@/components/anatomia/portao-anatomia'

/**
 * A experiência do Atlas só entra depois que `/api/anatomia` confirma a
 * assinatura; para quem cai na landing de vendas, este import nunca acontece.
 *
 * `precarregar` faz o pacote começar a vir junto com a consulta de acesso, e
 * não depois dela: as duas esperas passam a acontecer ao mesmo tempo.
 */
const carregarExperiencia = () => import('@/components/anatomia/atlas-experiencia')

const AtlasExperiencia = dynamic(carregarExperiencia, {
  ssr: false,
  loading: () => (
    <div className="surface-page flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

export default function AtlasAnatomiaPage() {
  return (
    <PortaoAnatomia secao="atlas" precarregar={carregarExperiencia}>
      {dados => (
        <Suspense fallback={<div className="surface-page min-h-screen" />}>
          <AtlasExperiencia catalogo={dados.catalogo} />
        </Suspense>
      )}
    </PortaoAnatomia>
  )
}
