import { NextRequest } from 'next/server'
import { erro, idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaPublica, ok } from '@/lib/monitorias/rota'
import { SLUG_VALIDO } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

/** Perguntas públicas do anúncio, paginadas por data. GET ?antes=<ISO> */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return rotaPublica(request, { limit: 60, windowMs: 60_000 }, async () => {
    if (!SLUG_VALIDO.test(params.slug)) return erro(404, 'Anúncio não encontrado.')
    const antes = new URL(request.url).searchParams.get('antes')
    const c = await obterColecoes()
    const anuncio = await c.anuncios.findOne({ slug: params.slug, status: 'publicado' }, { projection: { _id: 1 } })
    if (!anuncio) return erro(404, 'Anúncio não encontrado.')
    const filtro: Record<string, unknown> = { anuncioId: idDe(anuncio), status: 'visivel' }
    if (antes && !Number.isNaN(Date.parse(antes))) filtro.createdAt = { $lt: new Date(antes) }
    const perguntas = await c.perguntas.find(filtro as any).sort({ createdAt: -1 }).limit(20).toArray()
    return ok({
      perguntas: perguntas.map((p) => ({ id: idDe(p), autorNome: p.autorNome.split(' ')[0], texto: p.texto, resposta: p.resposta || null, createdAt: p.createdAt })),
    })
  })
}
