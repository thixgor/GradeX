import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { avisar } from '@/lib/monitorias/avisos'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    acao: z.enum(['aprovar', 'rejeitar', 'suspender', 'reativar', 'aprovar_revisao', 'rejeitar_revisao']),
    motivo: z.string().max(1000).optional(),
  })
  .strict()

/** POST {acao, motivo} — moderação de anúncio (tudo auditado). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success || !ObjectId.isValid(params.id)) return erro(400, 'Ação inválida.')
    const { acao } = corpo.data
    const motivo = corpo.data.motivo ? limparTexto(corpo.data.motivo) : undefined
    if (['rejeitar', 'suspender', 'rejeitar_revisao'].includes(acao) && (!motivo || motivo.length < 5)) {
      return erro(400, 'Informe o motivo para o monitor.')
    }
    const c = await obterColecoes()
    const a = await c.anuncios.findOne({ _id: new ObjectId(params.id) } as any)
    if (!a) return naoEncontrado()
    const agora = new Date()
    const moderacao = { por: sessao.userId, em: agora, acao, motivo }
    let res
    switch (acao) {
      case 'aprovar':
        res = await c.anuncios.updateOne({ _id: a._id as any, status: 'em_analise' }, { $set: { status: 'publicado', publicadoEm: a.publicadoEm || agora, moderacao, updatedAt: agora } })
        break
      case 'rejeitar':
        res = await c.anuncios.updateOne({ _id: a._id as any, status: 'em_analise' }, { $set: { status: 'rejeitado', moderacao, updatedAt: agora } })
        break
      case 'suspender':
        res = await c.anuncios.updateOne({ _id: a._id as any, status: { $in: ['publicado', 'pausado', 'em_analise'] } }, { $set: { status: 'suspenso', moderacao, updatedAt: agora } })
        break
      case 'reativar':
        res = await c.anuncios.updateOne({ _id: a._id as any, status: 'suspenso' }, { $set: { status: 'publicado', moderacao, updatedAt: agora } })
        break
      case 'aprovar_revisao': {
        if (!a.revisaoPendente) return erro(409, 'Não há revisão pendente.')
        const { enviadaEm: _e, ...novo } = a.revisaoPendente
        const mudouCondicoes =
          JSON.stringify([a.preco, a.grupo, a.modos.direto || null, a.aulaGratis]) !==
          JSON.stringify([novo.preco, novo.grupo, novo.modos.direto || null, novo.aulaGratis])
        res = await c.anuncios.updateOne(
          { _id: a._id as any, revisaoPendente: { $exists: true } },
          {
            $set: { ...novo, moderacao, updatedAt: agora },
            $unset: { revisaoPendente: '', ...(mudouCondicoes ? { ofertaAssinada: '' } : {}) },
          },
        )
        break
      }
      case 'rejeitar_revisao':
        res = await c.anuncios.updateOne({ _id: a._id as any }, { $set: { moderacao, updatedAt: agora }, $unset: { revisaoPendente: '' } })
        break
    }
    if (!res?.matchedCount) return erro(409, 'O anúncio mudou de estado. Recarregue.')
    await audit({ action: 'monitoria_anuncio_moderado', actorUserId: sessao.userId, targetUserId: a.userId, resourceType: 'monitoria_anuncio', resourceId: params.id, metadata: { acao, motivo }, ip })
    const textos: Record<string, [string, string]> = {
      aprovar: ['Anúncio aprovado 🎉', `"${a.titulo}" está no ar na vitrine de monitorias.`],
      rejeitar: ['Anúncio precisa de ajustes', `"${a.titulo}" não foi aprovado: ${motivo}`],
      suspender: ['Anúncio suspenso', `"${a.titulo}" foi suspenso: ${motivo}`],
      reativar: ['Anúncio reativado', `"${a.titulo}" voltou para a vitrine.`],
      aprovar_revisao: ['Alterações aprovadas', `As mudanças em "${a.titulo}" estão no ar.`],
      rejeitar_revisao: ['Alterações não aprovadas', `As mudanças em "${a.titulo}" não foram aprovadas: ${motivo}`],
    }
    const [titulo, mensagem] = textos[acao]
    await avisar([
      {
        userId: a.userId,
        titulo,
        mensagem,
        url: '/monitorias/painel',
        email: { assunto: titulo, paragrafos: [mensagem, acao === 'aprovar_revisao' && !a.ofertaAssinada ? '' : ''].filter(Boolean), botao: 'Abrir meu painel' },
      },
    ])
    return ok({ feito: true })
  })
}
