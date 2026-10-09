import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { erro, idDe, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { normalizarAnuncio } from '@/lib/monitorias/validacao'
import type { ConteudoAnuncio } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

async function meuAnuncio(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null
  const c = await obterColecoes()
  return c.anuncios.findOne({ _id: new ObjectId(id), userId } as any)
}

/** GET — o anúncio para edição (com a revisão pendente, se houver). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const a = await meuAnuncio(params.id, sessao.userId)
    if (!a) return naoEncontrado()
    const { ofertaAssinada, ...resto } = a
    return ok({ anuncio: { ...resto, id: idDe(a), ofertaAssinada: ofertaAssinada ? { versao: ofertaAssinada.versao, em: ofertaAssinada.em } : null } })
  })
}

/** Campos que, se mudarem, invalidam a oferta-padrão do agendamento direto. */
function mudouCondicoesDiretas(antes: ConteudoAnuncio, depois: ConteudoAnuncio): boolean {
  return (
    JSON.stringify(antes.preco) !== JSON.stringify(depois.preco) ||
    JSON.stringify(antes.grupo) !== JSON.stringify(depois.grupo) ||
    JSON.stringify(antes.modos.direto || null) !== JSON.stringify(depois.modos.direto || null) ||
    JSON.stringify(antes.aulaGratis) !== JSON.stringify(depois.aulaGratis)
  )
}

/**
 * PATCH — salva o conteúdo. Rascunho/rejeitado: grava direto. Publicado ou
 * pausado: vira "revisão pendente" — a versão aprovada continua no ar até o
 * admin aprovar a nova (ninguém troca o anúncio aprovado por outro às escondidas).
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const a = await meuAnuncio(params.id, sessao.userId)
    if (!a) return naoEncontrado()
    if (a.status === 'suspenso') return erro(403, 'Anúncio suspenso pela moderação.')
    const normalizado = normalizarAnuncio(await lerJson(request))
    if (!normalizado.ok) return erro(400, normalizado.erros[0], { erros: normalizado.erros })
    const c = await obterColecoes()
    const agora = new Date()
    if (a.status === 'rascunho' || a.status === 'rejeitado' || a.status === 'em_analise') {
      const invalidaOferta = mudouCondicoesDiretas(a, normalizado.conteudo)
      await c.anuncios.updateOne(
        { _id: a._id as any },
        {
          $set: { ...normalizado.conteudo, status: a.status === 'em_analise' ? 'rascunho' : a.status, updatedAt: agora },
          ...(invalidaOferta ? { $unset: { ofertaAssinada: '' } } : {}),
        },
      )
      return ok({ salvo: true, status: a.status === 'em_analise' ? 'rascunho' : a.status, ofertaInvalidada: invalidaOferta && !!a.ofertaAssinada })
    }
    await c.anuncios.updateOne({ _id: a._id as any }, { $set: { revisaoPendente: { ...normalizado.conteudo, enviadaEm: agora }, updatedAt: agora } })
    return ok({ salvo: true, status: a.status, revisaoPendente: true })
  })
}

/** DELETE — só rascunho/rejeitado sem nenhuma reserva. */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    const a = await meuAnuncio(params.id, sessao.userId)
    if (!a) return naoEncontrado()
    if (a.status !== 'rascunho' && a.status !== 'rejeitado') return erro(409, 'Só rascunhos podem ser apagados. Pause o anúncio em vez disso.')
    const c = await obterColecoes()
    const reservas = await c.reservas.countDocuments({ anuncioId: idDe(a) })
    if (reservas) return erro(409, 'Este anúncio já tem reservas e não pode ser apagado.')
    await c.anuncios.deleteOne({ _id: a._id as any, status: a.status })
    return ok({ apagado: true })
  })
}
