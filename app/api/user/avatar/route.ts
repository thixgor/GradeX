import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { avatarPorId } from '@/lib/monitorias/avatares'
import { definirRetratoDaConta } from '@/lib/monitorias/fotos'

export const dynamic = 'force-dynamic'

/**
 * PUT {avatar} — retrato da conta, escolhido na mesma galeria das Monitorias.
 * Só o id do catálogo entra; URL própria, id inventado ou campo extra dão 400.
 * Nada é enviado nem guardado no nosso storage. Se a pessoa é monitora, o
 * perfil de monitor muda junto.
 */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    const corpo = z.object({ avatar: z.string().max(60) }).strict().safeParse(await lerJson(request))
    const escolhido = corpo.success ? avatarPorId(corpo.data.avatar) : null
    if (!escolhido) return erro(400, 'Escolha um dos retratos da galeria.')
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    await definirRetratoDaConta(sessao.userId, escolhido)
    return ok({ avatar: escolhido.id })
  })
}
