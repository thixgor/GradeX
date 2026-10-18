import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { avisar } from '@/lib/monitorias/avisos'
import { limparTexto } from '@/lib/monitorias/validacao'
import type { Anuncio } from '@/lib/monitorias/tipos'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    acao: z.enum(['aprovar', 'rejeitar', 'suspender', 'reativar', 'aprovar_revisao', 'rejeitar_revisao', 'excluir', 'restaurar']),
    motivo: z.string().max(1000).optional(),
  })
  .strict()

/**
 * POST {acao, motivo} — moderação de anúncio (tudo auditado).
 *
 * `excluir`: sem nenhuma reserva o anúncio (e as perguntas dele) é apagado de
 * vez; com reservas ele fica suspenso com `excluidoEm` — some da vitrine, do
 * painel do monitor e da moderação, e as reservas antigas seguem (guardam o
 * título). `restaurar` tira a marca e devolve o anúncio à moderação, suspenso.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success || !ObjectId.isValid(params.id)) return erro(400, 'Ação inválida.')
    const { acao } = corpo.data
    const motivo = corpo.data.motivo ? limparTexto(corpo.data.motivo) : undefined
    if (['rejeitar', 'suspender', 'rejeitar_revisao', 'excluir'].includes(acao) && (!motivo || motivo.length < 5)) {
      return erro(400, 'Informe o motivo para o monitor.')
    }
    const c = await obterColecoes()
    const a = await c.anuncios.findOne({ _id: new ObjectId(params.id) } as any)
    if (!a) return naoEncontrado()
    const agora = new Date()
    const moderacao = { por: sessao.userId, em: agora, acao, motivo }
    if (acao === 'excluir' || acao === 'restaurar') {
      const feito = await excluirOuRestaurar(c, a, acao, sessao.userId, motivo, agora)
      if (!feito.ok) return erro(409, feito.erro)
      await audit({ action: 'monitoria_anuncio_moderado', actorUserId: sessao.userId, targetUserId: a.userId, resourceType: 'monitoria_anuncio', resourceId: params.id, metadata: { acao, motivo, apagadoDeVez: feito.apagadoDeVez }, ip })
      if (acao === 'excluir') {
        const mensagem = `"${a.titulo}" foi removido pelo suporte: ${motivo}`
        await avisar([{ userId: a.userId, titulo: 'Anúncio removido', mensagem, url: '/monitorias/painel', email: { assunto: 'Anúncio removido', paragrafos: [mensagem, 'As aulas já marcadas continuam valendo.'], botao: 'Abrir meu painel' } }])
      }
      return ok({ feito: true, apagadoDeVez: feito.apagadoDeVez })
    }
    if (a.excluidoEm) return erro(409, 'Anúncio excluído. Restaure antes de moderar.')
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
    const [titulo, mensagem] = textos[acao as keyof typeof textos]
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

async function excluirOuRestaurar(
  c: Awaited<ReturnType<typeof obterColecoes>>,
  a: Anuncio,
  acao: 'excluir' | 'restaurar',
  adminId: string,
  motivo: string | undefined,
  agora: Date,
): Promise<{ ok: true; apagadoDeVez: boolean } | { ok: false; erro: string }> {
  const id = String(a._id)
  if (acao === 'restaurar') {
    const res = await c.anuncios.updateOne(
      { _id: a._id as any, excluidoEm: { $exists: true } },
      { $set: { status: 'suspenso', updatedAt: agora, moderacao: { por: adminId, em: agora, acao } }, $unset: { excluidoEm: '', excluidoPor: '', motivoExclusao: '' } },
    )
    return res.matchedCount ? { ok: true, apagadoDeVez: false } : { ok: false, erro: 'O anúncio não está excluído.' }
  }
  if (a.excluidoEm) return { ok: false, erro: 'O anúncio já está excluído.' }
  // tutorUserId na frente: usa o índice {tutorUserId, status, inicio}.
  const temReservas = await c.reservas.countDocuments({ tutorUserId: a.userId, anuncioId: id } as any, { limit: 1 })
  if (!temReservas) {
    const res = await c.anuncios.deleteOne({ _id: a._id as any, excluidoEm: { $exists: false } } as any)
    if (!res.deletedCount) return { ok: false, erro: 'O anúncio mudou de estado. Recarregue.' }
    await c.perguntas.deleteMany({ anuncioId: id })
    return { ok: true, apagadoDeVez: true }
  }
  const res = await c.anuncios.updateOne(
    { _id: a._id as any, excluidoEm: { $exists: false } },
    { $set: { status: 'suspenso', excluidoEm: agora, excluidoPor: adminId, motivoExclusao: motivo, moderacao: { por: adminId, em: agora, acao, motivo }, updatedAt: agora }, $unset: { revisaoPendente: '' } },
  )
  return res.matchedCount ? { ok: true, apagadoDeVez: false } : { ok: false, erro: 'O anúncio mudou de estado. Recarregue.' }
}
