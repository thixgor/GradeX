import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

interface PublicAnuncio {
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
}

export async function GET() {
  try {
    const db = await getDb()
    const anuncios = await db
      .collection<PublicAnuncio>('anuncios')
      .find(
        { ativo: true },
        {
          projection: {
            imagemUrl: 1,
            ativo: 1,
            ordem: 1,
            tipoAcao: 1,
            linkUrl: 1,
            linkNovaAba: 1,
            modalTitulo: 1,
            modalConteudo: 1,
            modalBotaoTexto: 1,
            modalBotaoLink: 1,
          },
        },
      )
      .sort({ ordem: 1, criadoEm: -1 })
      .toArray()

    return NextResponse.json({ anuncios })
  } catch (error) {
    console.error('Erro ao buscar anuncios publicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anuncios' }, { status: 500 })
  }
}
