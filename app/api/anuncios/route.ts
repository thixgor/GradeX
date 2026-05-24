import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'

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
  periodos?: number[]
}

export async function GET() {
  try {
    const db = await getDb()

    // Período do usuário logado (quando houver) para segmentar os anúncios.
    // Visitante anônimo ou sem período só vê anúncios sem restrição de período.
    let userPeriodo: number | null = null
    const session = await getSession()
    if (session?.userId) {
      try {
        const userDoc = await db.collection('users').findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { periodoBase: 1, periodoBaseRef: 1 } },
        )
        userPeriodo = getUserCurrentPeriodo(userDoc as any)
      } catch {
        userPeriodo = null
      }
    }

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
            periodos: 1,
          },
        },
      )
      .sort({ ordem: 1, criadoEm: -1 })
      .toArray()

    // Filtra por período: anúncio sem `periodos` (vazio/ausente) vai para todos;
    // com `periodos`, só aparece se o período atual do usuário estiver na lista.
    const filtered = anuncios.filter((anuncio) => {
      const periodos = Array.isArray(anuncio.periodos) ? anuncio.periodos : []
      if (periodos.length === 0) return true
      return userPeriodo !== null && periodos.includes(userPeriodo)
    })

    // A resposta agora depende do usuário (período), então não pode ser
    // compartilhada entre usuários por CDN. Cache privado curto deduplica
    // rajadas do mesmo usuário sem vazar segmentação entre contas.
    return NextResponse.json({ anuncios: filtered }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar anuncios publicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anuncios' }, { status: 500 })
  }
}
