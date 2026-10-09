import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarUsuario, obterOuCriarTutor } from '@/lib/monitorias/servidor'
import { gerarSlug, normalizarAnuncio } from '@/lib/monitorias/validacao'
import type { Anuncio } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

const MAX_ANUNCIOS = 10

/** POST — cria um anúncio em RASCUNHO (só vai ao ar depois da análise do admin). */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const normalizado = normalizarAnuncio(await lerJson(request))
    if (!normalizado.ok) return erro(400, normalizado.erros[0], { erros: normalizado.erros })
    const user = await carregarUsuario(sessao.userId)
    if (!user || user.banned) return erro(403, 'Conta indisponível.')
    const tutor = await obterOuCriarTutor(user)
    if (tutor.status !== 'ativo') return erro(403, 'Seu perfil de monitor está suspenso.')
    const c = await obterColecoes()
    const total = await c.anuncios.countDocuments({ userId: sessao.userId, status: { $ne: 'suspenso' } })
    if (total >= MAX_ANUNCIOS) return erro(409, `Limite de ${MAX_ANUNCIOS} anúncios por monitor.`)
    const agora = new Date()
    const anuncio: Anuncio = {
      ...normalizado.conteudo,
      tutorId: idDe(tutor),
      userId: sessao.userId,
      slug: gerarSlug(normalizado.conteudo.titulo, randomBytes(3).toString('hex')),
      status: 'rascunho',
      stats: { reservas: 0, nota: 0, avaliacoes: 0, perguntas: 0 },
      createdAt: agora,
      updatedAt: agora,
    }
    const res = await c.anuncios.insertOne(anuncio as any)
    return ok({ id: String(res.insertedId), slug: anuncio.slug }, 201)
  })
}
