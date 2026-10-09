import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { erro, idDe, obterColecoes } from '@/lib/monitorias/db'
import { anuncioPublico, tutorPublico } from '@/lib/monitorias/servidor'
import { rotaPublica } from '@/lib/monitorias/rota'
import { SLUG_VALIDO } from '@/lib/monitorias/validacao'
import { avaliacoesDoAnuncio } from '@/lib/monitorias/avaliacoes'

export const dynamic = 'force-dynamic'

/** Página pública do anúncio: anúncio + monitor + primeiras perguntas + outros anúncios do monitor. */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return rotaPublica(request, { limit: 120, windowMs: 60_000 }, async () => {
    if (!SLUG_VALIDO.test(params.slug)) return erro(404, 'Anúncio não encontrado.')
    const c = await obterColecoes()
    const anuncio = await c.anuncios.findOne({ slug: params.slug, status: 'publicado' })
    if (!anuncio || !ObjectId.isValid(anuncio.tutorId)) return erro(404, 'Anúncio não encontrado.')
    const [tutor, perguntas, outros, avaliacoes] = await Promise.all([
      c.tutores.findOne({ _id: new ObjectId(anuncio.tutorId), status: 'ativo' } as any),
      c.perguntas.find({ anuncioId: idDe(anuncio), status: 'visivel' }).sort({ createdAt: -1 }).limit(20).toArray(),
      c.anuncios
        .find({ tutorId: anuncio.tutorId, status: 'publicado', _id: { $ne: anuncio._id } } as any, { projection: { slug: 1, titulo: 1, materia: 1, preco: 1 } })
        .limit(6)
        .toArray(),
      avaliacoesDoAnuncio(idDe(anuncio)),
    ])
    if (!tutor) return erro(404, 'Anúncio não encontrado.')
    return jsonComprimido(
      request,
      {
        anuncio: anuncioPublico(anuncio),
        tutor: { ...tutorPublico(tutor), userId: tutor.userId },
        disponibilidade: tutor.disponibilidade.semanal,
        perguntas: perguntas.map((p) => ({
          id: idDe(p),
          autorNome: p.autorNome.split(' ')[0],
          texto: p.texto,
          resposta: p.resposta || null,
          createdAt: p.createdAt,
        })),
        avaliacoes,
        outros: outros.map((o) => ({ slug: o.slug, titulo: o.titulo, materia: o.materia, preco: o.preco })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
    )
  })
}
