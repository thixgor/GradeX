import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EstudoRaioXView } from '@/components/radiologia/estudo-raio-x'
import { ESTUDOS_RAIO_X, getEstudoRaioX } from '@/lib/radiologia/raio-x'

/**
 * As 28 incidências são um catálogo estático em código: pré-renderizá-las tira
 * o servidor do caminho quando o aluno navega entre elas, e faz o `prefetch`
 * dos cards do catálogo devolver HTML pronto em vez de disparar um render.
 */
export function generateStaticParams() {
  return ESTUDOS_RAIO_X.map((estudo) => ({ slug: estudo.id }))
}

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
