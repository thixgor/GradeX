import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EstudoRaioXView } from '@/components/radiologia/estudo-raio-x'
import { getEstudoRaioX } from '@/lib/radiologia/raio-x'

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const estudo = getEstudoRaioX(params.slug)
  if (!estudo) return { title: 'Radiografia não encontrada | Manual de Radiologia' }
  return {
    title: `${estudo.titulo} (${estudo.incidencia}) - Atlas de Raio-X | Manual de Radiologia`,
    description: estudo.foco,
  }
}

export default function EstudoRaioXPage({ params }: { params: { slug: string } }) {
  const estudo = getEstudoRaioX(params.slug)
  if (!estudo) notFound()
  return <EstudoRaioXView estudo={estudo} />
}
