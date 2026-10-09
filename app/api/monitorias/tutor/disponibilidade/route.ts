import { NextRequest } from 'next/server'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { normalizarDisponibilidade, SchemaDisponibilidade } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

/**
 * PUT {semanal, diasBloqueados, intervaloMin} — horários de Brasília.
 * Mudar a agenda não afeta aulas já reservadas (os blocos delas continuam travados).
 */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = SchemaDisponibilidade.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Agenda inválida.')
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    const tutor = await obterOuCriarTutor(user)
    const c = await obterColecoes()
    const disponibilidade = normalizarDisponibilidade(corpo.data)
    await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { disponibilidade, updatedAt: new Date() } })
    return ok({ disponibilidade })
  })
}
