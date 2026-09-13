import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { VisorDeComparador } from '@/components/semiologia/comparador'
import { COMPARADORES, comparadorPorSlug } from '@/lib/semiologia/comparadores'

export function generateStaticParams() {
  return COMPARADORES.map((comparador) => ({ slug: comparador.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const comparador = comparadorPorSlug(params.slug)
  if (!comparador) return { title: 'Comparador não encontrado | Manual de Semiologia' }
  return { title: `${comparador.titulo} | Manual de Semiologia`, description: comparador.introducao }
}

export default function ComparadorPage({ params }: { params: { slug: string } }) {
  const comparador = comparadorPorSlug(params.slug)
  if (!comparador) notFound()

  return (
    <AreaSemiologia alvo={comparador.titulo}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <VisorDeComparador comparador={comparador} />
        </div>
      </div>
    </AreaSemiologia>
  )
}
