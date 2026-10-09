import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { erro, obterColecoes } from '@/lib/monitorias/db'
import { rotaPublica } from '@/lib/monitorias/rota'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { SLUG_VALIDO } from '@/lib/monitorias/validacao'
import { duracoesPermitidas, horariosLivres } from '@/lib/monitorias/agenda'

export const dynamic = 'force-dynamic'

/**
 * Horários livres para o agendamento direto (próximos 21 dias, Brasília).
 * GET ?duracao=90&gratis=0
 * Devolve só inícios possíveis — nada sobre quem reservou o resto.
 */
export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  return rotaPublica(request, { limit: 60, windowMs: 60_000 }, async () => {
    if (!SLUG_VALIDO.test(params.slug)) return erro(404, 'Anúncio não encontrado.')
    const url = new URL(request.url)
    const gratis = url.searchParams.get('gratis') === '1'
    const c = await obterColecoes()
    const anuncio = await c.anuncios.findOne({ slug: params.slug, status: 'publicado' })
    if (!anuncio?.modos.direto || !anuncio.ofertaAssinada || !ObjectId.isValid(anuncio.tutorId)) {
      return erro(404, 'Este anúncio não tem agendamento direto.')
    }
    const direto = anuncio.modos.direto
    const permitidas = gratis ? [anuncio.aulaGratis.duracaoMin] : duracoesPermitidas(direto.duracaoMinMin, direto.duracaoMaxMin, direto.passoMin)
    if (gratis && !anuncio.aulaGratis.ativa) return erro(400, 'Este anúncio não oferece aula grátis.')
    const pedida = Number(url.searchParams.get('duracao')) || permitidas[0]
    if (!permitidas.includes(pedida)) return erro(400, 'Duração indisponível.')

    const agora = new Date()
    const dias = 21
    const [tutor, ocupados] = await Promise.all([
      c.tutores.findOne({ _id: new ObjectId(anuncio.tutorId), status: 'ativo' } as any, { projection: { disponibilidade: 1 } }),
      c.bloqueios
        .find(
          {
            tutorId: anuncio.tutorId,
            inicioBloco: { $gte: new Date(agora.getTime() - 3_600_000), $lte: new Date(agora.getTime() + (dias + 1) * 86_400_000) },
            $or: [{ tipo: 'firme' }, { expiraEm: { $gt: agora } }],
          } as any,
          { projection: { inicioBloco: 1 } },
        )
        .toArray(),
    ])
    if (!tutor) return erro(404, 'Anúncio não encontrado.')
    const livres = horariosLivres({
      disp: tutor.disponibilidade,
      duracaoMin: pedida,
      ocupados: new Set(ocupados.map((b) => b.inicioBloco.getTime())),
      agora,
      antecedenciaMinHoras: direto.antecedenciaMinHoras,
      dias,
      passoInicioMin: 30,
    })
    // Igual para todo mundo: o CDN segura 15 s. Se alguém pegar o horário nesse
    // meio-tempo, o agendamento recusa com "horário indisponível" (índice único).
    return jsonComprimido(
      request,
      { duracoes: permitidas, duracao: pedida, horarios: livres },
      { headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' } },
    )
  })
}
