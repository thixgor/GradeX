import { NextRequest } from 'next/server'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { obterColecoes } from '@/lib/monitorias/db'
import { cardDoAnuncio } from '@/lib/monitorias/servidor'
import { rotaPublica } from '@/lib/monitorias/rota'
import type { Anuncio } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

const POR_PAGINA = 24

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Vitrine pública: anúncios publicados com filtros simples.
 * GET ?q=&materia=&gratis=1&grupo=1&direto=1&ordem=recentes|nota|preco&pagina=1
 */
export async function GET(request: NextRequest) {
  return rotaPublica(request, { limit: 60, windowMs: 60_000 }, async () => {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim().slice(0, 60)
    const materia = (url.searchParams.get('materia') || '').trim().slice(0, 60)
    const pagina = Math.max(1, Math.min(50, Number(url.searchParams.get('pagina')) || 1))
    const ordem = url.searchParams.get('ordem') || 'recentes'

    const filtro: Record<string, unknown> = { status: 'publicado' }
    if (materia) filtro.materia = materia
    if (url.searchParams.get('gratis') === '1') filtro['aulaGratis.ativa'] = true
    if (url.searchParams.get('grupo') === '1') filtro['grupo.ativo'] = true
    if (url.searchParams.get('direto') === '1') filtro['ofertaAssinada'] = { $exists: true }
    if (q) {
      const rx = new RegExp(escaparRegex(q), 'i')
      filtro.$or = [{ titulo: rx }, { materia: rx }, { conteudos: rx }]
    }
    const sort: Record<string, 1 | -1> =
      ordem === 'nota' ? { 'stats.nota': -1, publicadoEm: -1 } : ordem === 'preco' ? { 'preco.valorCentavos': 1 } : { publicadoEm: -1 }

    const c = await obterColecoes()
    const [anuncios, total, materias] = await Promise.all([
      c.anuncios
        .find(filtro as any, { projection: { revisaoPendente: 0, moderacao: 0, descricao: 0, faq: 0 } })
        .sort(sort)
        .skip((pagina - 1) * POR_PAGINA)
        .limit(POR_PAGINA)
        .toArray(),
      c.anuncios.countDocuments(filtro as any),
      c.anuncios.distinct('materia', { status: 'publicado' }),
    ])
    const tutorIds = Array.from(new Set(anuncios.map((a) => a.tutorId)))
    const { ObjectId } = await import('mongodb')
    const tutores = await c.tutores
      .find({ _id: { $in: tutorIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id)) } } as any, {
        projection: { nome: 1, fotoUrl: 1, titulo: 1 },
      })
      .toArray()
    const porId = new Map(tutores.map((t) => [String(t._id), t]))
    // O card só olha se a oferta-padrão existe; IP e navegador dela não saem daqui.
    const itens = anuncios.map((a) => cardDoAnuncio({ ...(a as Anuncio), descricao: '', faq: [] }, porId.get(a.tutorId) || null))
    return jsonComprimido(
      request,
      { itens, total, pagina, paginas: Math.ceil(total / POR_PAGINA), materias: (materias as string[]).sort((x, y) => x.localeCompare(y, 'pt-BR')) },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  })
}
