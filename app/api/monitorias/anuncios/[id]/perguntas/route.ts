import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { SchemaPergunta } from '@/lib/monitorias/validacao'
import { mascararContato } from '@/lib/monitorias/contato'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

/** POST {texto} — pergunta pública no anúncio (5 por dia por pessoa). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    if (!ObjectId.isValid(params.id)) return erro(404, 'Anúncio não encontrado.')
    const corpo = SchemaPergunta.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Pergunta inválida.')
    const limite = await checkRateLimit(`mon-pergunta:${sessao.userId}`, 'monitorias_pergunta', 5, 24 * 3_600_000)
    if (!limite.success) return erro(429, 'Limite de perguntas por hoje atingido.')
    const c = await obterColecoes()
    const [anuncio, user] = await Promise.all([
      c.anuncios.findOne({ _id: new ObjectId(params.id), status: 'publicado' } as any, { projection: { userId: 1, titulo: 1, slug: 1 } }),
      carregarUsuario(sessao.userId),
    ])
    if (!anuncio) return erro(404, 'Anúncio não encontrado.')
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    if (anuncio.userId === sessao.userId) return erro(400, 'Use o FAQ para responder dúvidas no seu próprio anúncio.')
    // Pergunta é pública: contato pessoal nunca fica exposto ali.
    const texto = mascararContato(corpo.data.texto).texto
    const agora = new Date()
    const res = await c.perguntas.insertOne({
      anuncioId: idDe(anuncio),
      tutorUserId: anuncio.userId,
      autorId: sessao.userId,
      autorNome: user.name,
      texto,
      status: 'visivel',
      denuncias: [],
      createdAt: agora,
    } as any)
    await c.anuncios.updateOne({ _id: anuncio._id as any }, { $inc: { 'stats.perguntas': 1 } })
    await avisar([
      {
        userId: anuncio.userId,
        titulo: 'Nova pergunta no seu anúncio',
        mensagem: `"${texto.slice(0, 80)}"`,
        url: `/monitorias/anuncio/${anuncio.slug}#perguntas`,
        email: { assunto: `Nova pergunta em "${anuncio.titulo}"`, paragrafos: ['Alguém fez uma pergunta pública no seu anúncio. Responder rápido aumenta suas chances de fechar a monitoria.', texto], botao: 'Responder' },
      },
    ])
    return ok({ id: String(res.insertedId), texto, autorNome: user.name.split(' ')[0], createdAt: agora, resposta: null }, 201)
  })
}
