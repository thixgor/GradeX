import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PranchaView } from '@/components/radiologia/prancha'
import { PRANCHAS, getPrancha, irmasDaPrancha } from '@/lib/radiologia/pranchas'

/**
 * São quatro pranchas fixas em código: pré-renderizá-las tira o servidor do
 * caminho quando o aluno alterna entre as figuras pela trilha do cabeçalho.
 */
export function generateStaticParams() {
  return PRANCHAS.map((prancha) => ({ slug: prancha.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const prancha = getPrancha(params.slug)
  if (!prancha) return { title: 'Prancha não encontrada | Manual de Radiologia' }
  return {
    title: `${prancha.titulo} - Prancha ${prancha.figura} | Manual de Radiologia`,
    description: `${prancha.subtitulo}. ${prancha.resumo}`,
  }
}

export default function PranchaPage({ params }: { params: { slug: string } }) {
  const prancha = getPrancha(params.slug)
  if (!prancha) notFound()

  // Só esta prancha atravessa a rede. O visualizador é componente de cliente:
  // se ele mesmo importasse o módulo, levaria as outras três — com o dossiê
  // dos 40 territórios — para o bundle de cada uma das quatro páginas.
  return <PranchaView prancha={prancha} irmas={irmasDaPrancha()} />
}
