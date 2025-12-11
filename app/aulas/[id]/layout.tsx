import type { Metadata } from 'next'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { AulaPostagem } from '@/lib/types'

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

    // Limitar descrição a 160 caracteres para melhor exibição no WhatsApp
    const descricaoLimitada = aula.descricao 
      ? aula.descricao.substring(0, 160) + (aula.descricao.length > 160 ? '...' : '')
      : 'Assista aulas exclusivas na plataforma DomineAqui'

    // Usar imagem da capa se disponível, senão usar imagem padrão
    const imagemOG = aula.capa?.tipo === 'imagem' && aula.capa?.imagem 
      ? aula.capa.imagem
      : 'https://i.imgur.com/zHm5aSx.jpeg'

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    return {
      title: `${aula.titulo} - DomineAqui`,
      description: descricaoLimitada,
      openGraph: {
        title: aula.titulo,
        description: descricaoLimitada,
        type: 'article',
        url: `${baseUrl}/aulas/${id}`,
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
        description: descricaoLimitada,
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
