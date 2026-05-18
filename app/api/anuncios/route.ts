import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

// Mantém force-dynamic para evitar tentativa de pré-renderização em
// build time (a rota lê do Mongo). A Edge cache da Vercel respeita
// o Cache-Control que devolvemos abaixo independentemente disso.
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

    // Anúncios são públicos e idênticos para todos os visitantes.
    // 5 min na Edge + SWR de 30 min: invocations cai drasticamente sem
    // afetar perceptivelmente o tempo de propagação de novos banners.
    return NextResponse.json({ anuncios }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=1800',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar anuncios publicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anuncios' }, { status: 500 })
  }
}
