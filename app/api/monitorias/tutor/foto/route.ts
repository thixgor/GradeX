import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { hostDoBlobDeImagens, pastaDaFoto } from '@/lib/monitorias/cripto'

export const dynamic = 'force-dynamic'

/**
 * PUT {url} — grava a foto já enviada ao Blob. A URL só é aceita se for do
 * store público da Vercel E da pasta desta conta: colar a foto de outra
 * pessoa (ou um link qualquer) não passa.
 */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = z.object({ url: z.string().url().max(500) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'URL inválida.')
    let url: URL
    try {
      url = new URL(corpo.data.url)
    } catch {
      return erro(400, 'URL inválida.')
    }
    // Só o store de imagens DESTE site (o de outra conta Vercel passaria por
    // cima do limite de tipo e tamanho do upload) e só a pasta desta conta.
    const host = hostDoBlobDeImagens()
    const hostOk = url.protocol === 'https:' && (host ? url.hostname.toLowerCase() === host : /^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/i.test(url.hostname))
    if (!hostOk || !url.pathname.startsWith(`/${pastaDaFoto(sessao.userId)}`)) return erro(400, 'Foto inválida.')
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    const tutor = await obterOuCriarTutor(user)
    const c = await obterColecoes()
    await c.tutores.updateOne({ _id: tutor._id as any }, { $set: { fotoUrl: `${url.origin}${url.pathname}`, updatedAt: new Date() } })
    return ok({ fotoUrl: `${url.origin}${url.pathname}` })
  })
}

/** GET — a pasta onde o navegador deve enviar a foto (apelido opaco da conta). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => ok({ pasta: pastaDaFoto(sessao.userId) }))
}
