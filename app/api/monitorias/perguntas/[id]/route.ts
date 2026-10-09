import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { limparTexto } from '@/lib/monitorias/validacao'
import { mascararContato } from '@/lib/monitorias/contato'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

const Corpo = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('responder'), texto: z.string().max(2000) }).strict(),
  z.object({ acao: z.literal('ocultar') }).strict(),
  z.object({ acao: z.literal('mostrar') }).strict(),
  z.object({ acao: z.literal('denunciar') }).strict(),
])

/**
 * POST {acao}:
 *  - responder: só o monitor dono do anúncio
 *  - ocultar/mostrar: monitor dono ou admin
 *  - denunciar: qualquer pessoa logada (3 denúncias ocultam até o admin ver)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    if (!ObjectId.isValid(params.id)) return naoEncontrado()
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Ação inválida.')
    const c = await obterColecoes()
    const p = await c.perguntas.findOne({ _id: new ObjectId(params.id) } as any)
    if (!p) return naoEncontrado()
    const ehDono = p.tutorUserId === sessao.userId
    const ehAdmin = sessao.role === 'admin'
    const acao = corpo.data.acao

    if (acao === 'responder') {
      if (!ehDono) return naoEncontrado()
      const texto = mascararContato(limparTexto(corpo.data.texto)).texto
      if (texto.length < 2) return erro(400, 'Resposta muito curta.')
      await c.perguntas.updateOne({ _id: p._id as any }, { $set: { resposta: { texto, em: new Date() } } })
      const anuncio = await c.anuncios.findOne({ _id: new ObjectId(p.anuncioId) } as any, { projection: { slug: 1, titulo: 1 } })
      await avisar([
        {
          userId: p.autorId,
          titulo: 'Sua pergunta foi respondida',
          mensagem: `O monitor respondeu sobre "${anuncio?.titulo || 'monitoria'}".`,
          url: `/monitorias/anuncio/${anuncio?.slug || ''}#perguntas`,
        },
      ])
      return ok({ resposta: { texto, em: new Date() } })
    }
    if (acao === 'ocultar' || acao === 'mostrar') {
      if (!ehDono && !ehAdmin) return naoEncontrado()
      await c.perguntas.updateOne({ _id: p._id as any }, { $set: { status: acao === 'ocultar' ? 'oculta' : 'visivel' } })
      return ok({ status: acao === 'ocultar' ? 'oculta' : 'visivel' })
    }
    // denunciar
    if (p.denuncias.some((d) => d.userId === sessao.userId)) return ok({ denunciada: true })
    const atual = await c.perguntas.findOneAndUpdate(
      { _id: p._id as any, 'denuncias.userId': { $ne: sessao.userId } },
      { $push: { denuncias: { userId: sessao.userId, em: new Date() } } },
      { returnDocument: 'after' },
    )
    if (atual && atual.denuncias.length >= 3 && atual.status === 'visivel') {
      await c.perguntas.updateOne({ _id: p._id as any }, { $set: { status: 'oculta' } })
    }
    return ok({ denunciada: true })
  })
}
