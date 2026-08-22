import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { getManualClinicoAccess, getManualClinicoConfig } from '@/lib/manual-clinico-product'
import { ATLAS_SYSTEMS, type AtlasCollection, type AtlasSystem } from '@/lib/atlas-anatomia/catalogo'

export const dynamic = 'force-dynamic'

/**
 * Acervo do Atlas, um sistema por vez.
 *
 * O catálogo inteiro tem 63 KB comprimidos e antes viajava dentro do bundle da
 * página: todo assinante que abria o Atlas baixava as 418 pranchas e os 2.382
 * marcadores dos dez sistemas antes de ver a primeira tela — mesmo indo estudar
 * só o crânio. Aqui ele vem sob demanda, e o maior sistema (esquelético) custa
 * 17 KB; a maioria custa menos de 6 KB.
 *
 * Servir por rota, e não por chunk estático, também fecha uma brecha: arquivos
 * em `/_next/static` são públicos por definição, então quem descobrisse o nome
 * do chunk levava o acervo sem assinar. Aqui o veredito de acesso é o mesmo de
 * `/api/anatomia`, e sem ele a resposta é 403.
 */

/** O caminho de origem na UFJF não é usado em lugar nenhum da interface. */
function enxugar(colecoes: AtlasCollection[]): AtlasCollection[] {
  return colecoes.map(colecao => ({
    ...colecao,
    pieces: colecao.pieces?.map(({ sourceImage: _origem, ...peca }) => peca),
    children: colecao.children ? enxugar(colecao.children) : undefined,
  }))
}

const ENXUTOS = new Map<string, AtlasSystem>(
  ATLAS_SYSTEMS.map(sistema => [sistema.slug, { ...sistema, collections: enxugar(sistema.collections) }]),
)

export async function GET(request: NextRequest) {
  let liberado = false
  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    liberado = (await getManualClinicoAccess(db, session, config, 'anatomia3d')).hasFullAccess
  } catch (error) {
    console.error('Erro ao verificar acesso ao acervo do Atlas:', error)
  }

  if (!liberado) {
    return NextResponse.json({ erro: 'Acervo exclusivo para assinantes.' }, { status: 403 })
  }

  const pedido = request.nextUrl.searchParams.get('sistema')
  const sistemas =
    !pedido || pedido === 'todos'
      ? [...ENXUTOS.values()]
      : pedido
          .split(',')
          .map(slug => ENXUTOS.get(slug.trim()))
          .filter((sistema): sistema is AtlasSystem => !!sistema)

  if (sistemas.length === 0) {
    return NextResponse.json({ erro: 'Sistema não encontrado.' }, { status: 404 })
  }

  return NextResponse.json(
    { sistemas },
    {
      headers: {
        // O acervo só muda quando o projeto é publicado de novo. Guardar no
        // navegador (e não em cache compartilhado — a resposta depende da
        // assinatura) evita rebaixar quem volta ao mesmo sistema no dia.
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400',
      },
    },
  )
}
