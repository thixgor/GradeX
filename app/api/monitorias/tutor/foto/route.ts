import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { avatarPorId } from '@/lib/monitorias/avatares'
import { apagarFotoEnviada } from '@/lib/monitorias/fotos'

export const dynamic = 'force-dynamic'

/**
 * PUT {avatar} — escolhe o retrato do monitor no catálogo. Não há envio de
 * arquivo: o corpo só tem o id, e a URL gravada sai do catálogo do servidor.
 * Qualquer outra coisa (URL, id inventado) é recusada. Uma foto antiga enviada
 * ao Blob, se houver, é apagada na hora.
 */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = z.object({ avatar: z.string().max(60) }).strict().safeParse(await lerJson(request))
    const escolhido = corpo.success ? avatarPorId(corpo.data.avatar) : null
    if (!escolhido) return erro(400, 'Escolha um dos retratos da galeria.')
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    const tutor = await obterOuCriarTutor(user)
    const c = await obterColecoes()
    await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { avatar: escolhido.id, fotoUrl: escolhido.url, updatedAt: new Date() } })
    if (tutor.fotoUrl && tutor.fotoUrl !== escolhido.url) await apagarFotoEnviada(tutor.fotoUrl)
    return ok({ avatar: escolhido.id, fotoUrl: escolhido.url })
  })
}
