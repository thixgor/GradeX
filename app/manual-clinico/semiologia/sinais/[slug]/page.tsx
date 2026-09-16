import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AreaSemiologia } from '@/components/semiologia/area'
import { FichaDeSinal } from '@/components/semiologia/ficha-sinal'
import { comAcervoSinal } from '@/lib/semiologia/acervo'
import { SINAIS, sinalPorSlug } from '@/lib/semiologia/sinais'

/** Catálogo estático em código: pré-renderizar tira o servidor do caminho. */
export function generateStaticParams() {
  return SINAIS.map((sinal) => ({ slug: sinal.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const sinal = sinalPorSlug(params.slug)
  if (!sinal) return { title: 'Sinal não encontrado | Manual de Semiologia' }
  return {
    title: `${sinal.nome} - exame físico | Manual de Semiologia`,
    description: sinal.resumo,
  }
}

export default function SinalPage({ params }: { params: { slug: string } }) {
  const encontrado = sinalPorSlug(params.slug)
  if (!encontrado) notFound()
  const sinal = comAcervoSinal(encontrado)

  return (
    <AreaSemiologia alvo={sinal.nome}>
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <FichaDeSinal sinal={sinal} />
        </div>
      </div>
    </AreaSemiologia>
  )
}
