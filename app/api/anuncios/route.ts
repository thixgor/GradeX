import { NextResponse, type NextRequest } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getUserCurrentPeriodo } from '@/lib/user-periodo'
import { anuncioVisivelParaPeriodo } from '@/lib/anuncio-exibicao'
import type { AnuncioExibicao, AnuncioMidia, AnuncioPosicao } from '@/lib/anuncio-midia'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

interface PublicAnuncio {
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  titulo?: string
  ctaTexto?: string
  destino?: { tipo?: string; rotulo?: string; refId?: string }
  modalBotaoDestino?: { tipo?: string; rotulo?: string; refId?: string }
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  periodos?: number[]
  modalMidia?: AnuncioMidia
  exibicao?: AnuncioExibicao
  midia?: AnuncioMidia
  midiaCelular?: AnuncioMidia
  paginas?: string[]
  posicao?: AnuncioPosicao
}

export async function GET(request: NextRequest) {
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
            titulo: 1,
            ctaTexto: 1,
            destino: 1,
            modalBotaoDestino: 1,
            linkUrl: 1,
            linkNovaAba: 1,
            modalTitulo: 1,
            modalConteudo: 1,
            modalBotaoTexto: 1,
            modalBotaoLink: 1,
            periodos: 1,
            modalMidia: 1,
            exibicao: 1,
            midia: 1,
            midiaCelular: 1,
            paginas: 1,
            posicao: 1,
          },
        },
      )
      .sort({ ordem: 1, criadoEm: -1 })
      .toArray()

    // Filtra por período: anúncio sem `periodos` (vazio/ausente) vai para todos;
    // com `periodos`, só aparece se o período atual do usuário estiver na lista.
    // A regra vive em `lib/anuncio-exibicao` porque o diagnóstico do admin
    // precisa explicar exatamente este descarte.
    const filtered = anuncios.filter((anuncio) =>
      anuncioVisivelParaPeriodo(anuncio.periodos, userPeriodo),
    )

    // A resposta agora depende do usuário (período), então não pode ser
    // compartilhada entre usuários por CDN. Cache privado curto deduplica
    // rajadas do mesmo usuário sem vazar segmentação entre contas.
    //
    // Comprimida dentro da função: o texto dos modais e as listas de páginas
    // fazem desta a maior resposta que todo aluno baixa, e no Vercel cada byte
    // cru que sai da função é Fast Origin Transfer.
    return jsonComprimido(request, { anuncios: filtered }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Erro ao buscar anuncios publicos:', error)
    return NextResponse.json({ error: 'Erro ao buscar anuncios' }, { status: 500 })
  }
}
