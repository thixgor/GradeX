import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro, idDe, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import {
  aceitarProposta,
  cancelar,
  carregarReserva,
  confirmarComQuemPagou,
  ErroMonitoria,
  papelNaReserva,
  acessoDeLeitura,
  proporNova,
  reportarProblema,
} from '@/lib/monitorias/reservas'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { limparTexto, semContato } from '@/lib/monitorias/validacao'
import { PLATAFORMAS_DE_REUNIAO, validarLinkDeReuniao, validarLinkExterno } from '@/lib/monitorias/links'
import { podeTransitar } from '@/lib/monitorias/estado'
import { avisar } from '@/lib/monitorias/avisos'
import { avaliar } from '@/lib/monitorias/avaliacoes'

export const dynamic = 'force-dynamic'

const motivo = z.string().min(5, 'Explique o motivo (mínimo 5 caracteres).').max(1000)

const Corpo = z.discriminatedUnion('acao', [
  z
    .object({
      acao: z.literal('propor'),
      inicio: z.string().datetime(),
      duracaoMin: z.number().int().min(30).max(480).refine((v) => v % 30 === 0),
      conteudos: z.array(z.string().max(60)).max(20),
      vagas: z.number().int().min(1).max(30),
      valorPorPessoaCentavos: z.number().int().min(0).max(500_000).optional(),
      gratis: z.boolean(),
      observacao: z.string().max(500).optional(),
    })
    .strict(),
  z.object({ acao: z.literal('aceitar'), propostaId: z.string().uuid() }).strict(),
  z.object({ acao: z.literal('recusar'), motivo }).strict(),
  z.object({ acao: z.literal('cancelar'), motivo }).strict(),
  z.object({ acao: z.literal('confirmar') }).strict(),
  z.object({ acao: z.literal('reportar'), motivo }).strict(),
  z.object({ acao: z.literal('link'), url: z.string().max(500) }).strict(),
  z.object({ acao: z.literal('material'), titulo: z.string().min(2).max(100), url: z.string().max(500) }).strict(),
  z.object({ acao: z.literal('material_remover'), url: z.string().max(500) }).strict(),
  z.object({ acao: z.literal('avaliar'), nota: z.number().int().min(1).max(5), comentario: z.string().max(1000) }).strict(),
])

/** POST {acao, ...} — todas as ações da sala da reserva num lugar só. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const parsed = Corpo.safeParse(await lerJson(request))
    if (!parsed.success) return erro(400, parsed.error.issues[0]?.message || 'Ação inválida.')
    const corpo = parsed.data
    const reserva = await carregarReserva(params.id)
    const papel = await papelNaReserva(reserva, sessao.userId)
    if (!papel) {
      // Quem já saiu (vê o histórico) recebe o motivo; estranho continua com 404.
      const leitura = await acessoDeLeitura(reserva, sessao.userId)
      if (leitura?.somenteLeitura) return erro(409, 'Você já saiu desta monitoria. O histórico continua disponível só para consulta.')
      return naoEncontrado()
    }
    const ator = await carregarUsuario(sessao.userId)
    if (!ator || ator.banned) return erro(403, 'Conta indisponível.')
    const c = await obterColecoes()
    // Antes do pagamento, contato pessoal não passa nem pela observação da
    // proposta nem pelos motivos (que aparecem na sala e vão por e-mail).
    const livre = ['confirmada', 'realizada', 'em_disputa', 'concluida'].includes(reserva.status)
    const seguro = (t: string) => (livre ? limparTexto(t) : semContato(limparTexto(t)))

    switch (corpo.acao) {
      case 'propor': {
        // Cada proposta manda e-mail ao outro lado: no máximo 6 a cada 10 min por pessoa e reserva.
        const lim = await checkRateLimit(`mon-prop:${idDe(reserva)}:${sessao.userId}`, 'monitorias_proposta', 6, 10 * 60_000)
        if (!lim.success) throw new ErroMonitoria(429, 'Muitas propostas seguidas. Converse no chat e tente de novo em alguns minutos.')
        const anuncio = await c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any)
        if (!anuncio) throw new ErroMonitoria(404, 'Anúncio não encontrado.')
        const atualizada = await proporNova({
          reserva,
          anuncio,
          autor: ator,
          papel,
          inicio: new Date(corpo.inicio),
          duracaoMin: corpo.duracaoMin,
          conteudos: corpo.conteudos.map(limparTexto).filter(Boolean).slice(0, 20),
          vagas: corpo.vagas,
          // Valor livre só na negociação/"a combinar"; o servidor aplica limites.
          valorPorPessoaCentavos: corpo.gratis ? undefined : corpo.valorPorPessoaCentavos,
          gratis: corpo.gratis,
          observacao: corpo.observacao ? seguro(corpo.observacao) : undefined,
        })
        return ok({ status: atualizada.status, propostaId: atualizada.proposta?.id })
      }
      case 'aceitar': {
        const [anuncio, tutor, aluno, monitor] = await Promise.all([
          c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any),
          c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any),
          carregarUsuario(reserva.solicitanteId),
          carregarUsuario(reserva.tutorUserId),
        ])
        if (!anuncio || !tutor || !aluno || !monitor) throw new ErroMonitoria(404, 'Dados da reserva indisponíveis.')
        if (tutor.status !== 'ativo') throw new ErroMonitoria(409, 'O perfil deste monitor está suspenso.')
        const atualizada = await aceitarProposta({ reserva, anuncio, tutor, ator, papel, propostaId: corpo.propostaId, aluno, monitor })
        return ok({ status: atualizada.status })
      }
      case 'recusar': {
        if (papel !== 'monitor') throw new ErroMonitoria(403, 'Só o monitor recusa um pedido. Você pode cancelar o seu.')
        if (!podeTransitar(reserva.status, 'recusada')) throw new ErroMonitoria(409, 'Não é possível recusar agora.')
        const res = await c.reservas.updateOne(
          { _id: reserva._id as any, status: reserva.status, versao: reserva.versao },
          { $set: { status: 'recusada', motivoCancelamento: seguro(corpo.motivo), updatedAt: new Date() }, $inc: { versao: 1 } },
        )
        if (!res.matchedCount) throw new ErroMonitoria(409, 'A reserva mudou. Recarregue.')
        await avisar([
          {
            userId: reserva.solicitanteId,
            titulo: 'Pedido recusado',
            mensagem: `O monitor recusou "${reserva.anuncioTitulo}".`,
            url: `/monitorias/reservas/${idDe(reserva)}`,
            email: { assunto: `Pedido recusado: ${reserva.anuncioTitulo}`, paragrafos: ['O monitor não pôde aceitar seu pedido desta vez.'], linhas: [['Motivo', seguro(corpo.motivo)]], botao: 'Ver outros monitores' },
          },
        ])
        return ok({ status: 'recusada' })
      }
      case 'cancelar': {
        const r = await cancelar({ reserva, ator, papel, motivo: seguro(corpo.motivo) })
        return ok(r)
      }
      case 'confirmar': {
        await confirmarComQuemPagou(reserva, papel)
        return ok({ status: 'confirmada' })
      }
      case 'reportar': {
        const ticketId = await reportarProblema({ reserva, autor: ator, papel, motivo: seguro(corpo.motivo) })
        return ok({ status: 'em_disputa', ticketId })
      }
      case 'link': {
        if (papel !== 'monitor') throw new ErroMonitoria(403, 'Só o monitor define o link da reunião.')
        if (!['aguardando_pagamento', 'confirmada', 'aguardando_assinaturas'].includes(reserva.status)) {
          throw new ErroMonitoria(409, 'Não é possível alterar o link agora.')
        }
        const link = validarLinkDeReuniao(corpo.url)
        if (!link) throw new ErroMonitoria(400, `Use um link https de ${PLATAFORMAS_DE_REUNIAO}.`)
        await c.reservas.updateOne({ _id: reserva._id as any }, { $set: { linkReuniao: link.url, updatedAt: new Date() } })
        await c.mensagens.insertOne({ reservaId: idDe(reserva), autorId: 'sistema', tipo: 'sistema', texto: 'O monitor adicionou o link da reunião (visível só para quem pagou).', createdAt: new Date() })
        return ok({ linkReuniao: link.url })
      }
      case 'material': {
        if (papel !== 'monitor') throw new ErroMonitoria(403, 'Só o monitor envia materiais.')
        if (!['aguardando_pagamento', 'confirmada', 'realizada', 'em_disputa', 'concluida'].includes(reserva.status)) {
          throw new ErroMonitoria(409, 'Materiais podem ser enviados depois que a monitoria for combinada.')
        }
        const link = validarLinkExterno(corpo.url)
        if (!link) throw new ErroMonitoria(400, 'Use um link https válido (Drive, Notion, YouTube...).')
        const titulo = limparTexto(corpo.titulo).slice(0, 100)
        if (titulo.length < 2) throw new ErroMonitoria(400, 'Dê um título ao material.')
        const extras = reserva.materiaisExtras || []
        if (extras.length >= 20) throw new ErroMonitoria(409, 'Limite de 20 materiais por monitoria.')
        if (extras.some((m) => m.url === link.url)) throw new ErroMonitoria(409, 'Este link já foi enviado.')
        const agora = new Date()
        const res = await c.reservas.updateOne(
          { _id: reserva._id as any, 'materiaisExtras.19': { $exists: false } } as any,
          { $push: { materiaisExtras: { titulo, url: link.url, dominio: link.dominio, em: agora } }, $set: { updatedAt: agora } } as any,
        )
        if (!res.modifiedCount) throw new ErroMonitoria(409, 'Não foi possível adicionar agora.')
        const alunos = await c.participacoes
          .find({ reservaId: idDe(reserva), status: { $in: ['paga', 'gratis', 'concluida', 'aguardando_pagamento'] } }, { projection: { alunoId: 1 } })
          .toArray()
        await Promise.all([
          c.mensagens.insertOne({ reservaId: idDe(reserva), autorId: 'sistema', tipo: 'sistema', texto: `O monitor enviou um material: "${titulo}" (${link.dominio}). Ele fica guardado em "Materiais desta monitoria".`, createdAt: agora }),
          avisar(alunos.map((a) => ({ userId: a.alunoId, titulo: 'Material novo na sua monitoria', mensagem: `"${titulo}" em "${reserva.anuncioTitulo}"`, url: `/monitorias/reservas/${idDe(reserva)}` }))),
        ])
        return ok({ adicionado: true })
      }
      case 'material_remover': {
        if (papel !== 'monitor') throw new ErroMonitoria(403, 'Só o monitor remove materiais.')
        // Depois que a aula começou, o material vira registro do que foi entregue
        // (o aluno e o PDF da conversa contam com ele): não some mais.
        if (!reserva.inicio || reserva.inicio.getTime() <= Date.now() || ['realizada', 'concluida', 'em_disputa'].includes(reserva.status)) {
          throw new ErroMonitoria(409, 'Depois do início da aula o material fica guardado para o aluno. Se precisar corrigir, envie uma versão nova.')
        }
        await c.reservas.updateOne({ _id: reserva._id as any }, { $pull: { materiaisExtras: { url: corpo.url } }, $set: { updatedAt: new Date() } } as any)
        return ok({ removido: true })
      }
      case 'avaliar': {
        if (papel === 'monitor') throw new ErroMonitoria(403, 'O monitor não se avalia.')
        await avaliar({ reserva, alunoId: sessao.userId, nota: corpo.nota, comentario: limparTexto(corpo.comentario) })
        return ok({ avaliado: true })
      }
    }
  })
}
