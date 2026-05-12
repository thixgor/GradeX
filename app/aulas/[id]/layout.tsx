import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { AulaPostagem } from '@/lib/types'
import { DEFAULT_OG_IMAGE, absoluteUrl, joinSeoParts, privateNoIndexRobots, sanitizeSeoText } from '@/lib/seo'

interface Props {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    
    // Validar se é um ObjectId válido
    if (!ObjectId.isValid(id)) {
      return {
        title: 'Aula - DomineAqui',
        description: 'Assista aulas exclusivas na plataforma DomineAqui'
      }
    }

    // Buscar a aula do banco de dados
    const db = await getDb()
    const aula = await db.collection('aulas_postagens').findOne({
      _id: new ObjectId(id)
    }) as AulaPostagem | null

    if (!aula) {
      return {
        title: 'Aula - DomineAqui',
        description: 'Assista aulas exclusivas na plataforma DomineAqui'
      }
    }

    const descricaoBase = sanitizeSeoText(aula.descricao, 'Assista aulas exclusivas na plataforma DomineAqui', 130)
    const imagemOG = aula.capa?.tipo === 'imagem' && aula.capa?.imagem
      ? aula.capa.imagem
      : DEFAULT_OG_IMAGE

    const isPremium = aula.visibilidade === 'premium'
    const accessLabel = isPremium ? 'Aula Premium' : 'Aula Gratuita'
    const tipoLabel = aula.tipo === 'ao-vivo' ? 'Ao vivo' : aula.tipo === 'gravada' ? 'Gravada' : ''

    const description = joinSeoParts([descricaoBase, accessLabel, tipoLabel]).slice(0, 200)

    return {
      title: aula.titulo,
      description,
      robots: privateNoIndexRobots,
      alternates: { canonical: `/aulas/${id}` },
      openGraph: {
        title: aula.titulo,
        description,
        siteName: 'DomineAqui',
        type: 'article',
        url: absoluteUrl(`/aulas/${id}`),
        locale: 'pt_BR',
        images: [
          {
            url: imagemOG,
            width: 1200,
            height: 630,
            alt: aula.titulo,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: aula.titulo,
        description,
        images: [imagemOG],
      },
    }
  } catch (error) {
    console.error('Erro ao gerar metadata:', error)
    return {
      title: 'Aula - DomineAqui',
      description: 'Assista aulas exclusivas na plataforma DomineAqui'
    }
  }
}

export default function Layout({ children }: Props) {
  return children
}
