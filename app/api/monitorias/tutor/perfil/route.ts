import { NextRequest } from 'next/server'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { SchemaPerfilTutor, semContato } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

/** PUT {titulo, bio, historia} — cria o perfil de monitor na primeira vez. */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = SchemaPerfilTutor.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Dados inválidos.')
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    const tutor = await obterOuCriarTutor(user)
    const c = await obterColecoes()
    // O perfil aparece na página pública do anúncio: contato pessoal é mascarado.
    const { titulo, bio, historia } = corpo.data
    await c.tutores.updateOne(
      { _id: tutor._id as any },
      { $set: { titulo: semContato(titulo), bio: semContato(bio), historia: semContato(historia), nome: user.name, updatedAt: new Date() } },
    )
    return ok({ salvo: true })
  })
}
