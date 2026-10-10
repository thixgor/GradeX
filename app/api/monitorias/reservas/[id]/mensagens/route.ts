import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { getDb } from '@/lib/mongodb'
import { erro, idDe, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { acessoDeLeitura, assentoPago, carregarReserva, papelNaReserva } from '@/lib/monitorias/reservas'
import { SchemaMensagem } from '@/lib/monitorias/validacao'
import { AVISO_CONTATO, mascararContato } from '@/lib/monitorias/contato'
import { STATUS_FINAIS } from '@/lib/monitorias/estado'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

const LIVRE = ['confirmada', 'realizada', 'em_disputa', 'concluida']

const POR_PAGINA = 100

/**
 * GET ?depois=<ISO> — mensagens novas (o polling da sala: barato, quase sempre
 * volta vazio) junto com `versao`/`status`, para a tela só recarregar tudo
 * quando a reserva mudou de verdade.
 * GET ?antes=<ISO> — página anterior do histórico ("Ver mensagens anteriores").
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 120, windowMs: 60_000 } }, async ({ sessao }) => {
    const reserva = await carregarReserva(params.id)
    const acesso = await acessoDeLeitura(reserva, sessao.userId)
    if (!acesso) return naoEncontrado()
    const busca = new URL(request.url).searchParams
    const depois = busca.get('depois')
    const antes = busca.get('antes')
    const c = await obterColecoes()
    const filtro: Record<string, unknown> = { reservaId: idDe(reserva) }
    let mensagens
    if (antes && !Number.isNaN(Date.parse(antes))) {
      filtro.createdAt = { $lt: new Date(antes) }
      mensagens = (await c.mensagens.find(filtro as any).sort({ createdAt: -1 }).limit(POR_PAGINA).toArray()).reverse()
    } else {
      if (depois && !Number.isNaN(Date.parse(depois))) filtro.createdAt = { $gt: new Date(depois) }
      mensagens = await c.mensagens.find(filtro as any).sort({ createdAt: 1 }).limit(POR_PAGINA).toArray()
    }
    return ok({
      status: reserva.status,
      versao: reserva.versao,
      maisAntigas: !!antes && mensagens.length === POR_PAGINA,
      mensagens: mensagens.map((m) => ({
        id: idDe(m),
        autor: m.autorId === 'sistema' ? 'sistema' : m.autorId === sessao.userId ? 'eu' : m.autorId === reserva.tutorUserId ? 'monitor' : 'aluno',
        tipo: m.tipo,
        texto: acesso.mascarar ? mascararContato(m.texto).texto : m.texto,
        propostaId: m.propostaId || null,
        createdAt: m.createdAt,
      })),
    })
  })
}

/** POST {texto} — mensagem no chat. Antes do pagamento, contatos pessoais são ocultados. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    // Limite ANTES de validar: o limite por conta (não por reserva) segura
    // quem tentasse gastar CPU trocando o id na URL.
    const limite = await checkRateLimit(`mon-msg:${sessao.userId}`, 'monitorias_mensagem', 20, 60_000)
    if (!limite.success) return erro(429, 'Calma! Muitas mensagens seguidas.')
    const corpo = SchemaMensagem.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Mensagem inválida.')
    const reserva = await carregarReserva(params.id)
    const papel = await papelNaReserva(reserva, sessao.userId)
    if (!papel) return naoEncontrado()
    if (STATUS_FINAIS.includes(reserva.status) && reserva.status !== 'concluida') return erro(409, 'Esta reserva foi encerrada.')
    // Chat livre só depois da confirmação E para quem tem assento pago (ou o monitor).
    const livre = LIVRE.includes(reserva.status) && (await assentoPago(reserva, sessao.userId))
    const { texto, mascarou } = livre ? { texto: corpo.data.texto, mascarou: false } : mascararContato(corpo.data.texto)
    const c = await obterColecoes()
    const agora = new Date()
    const destino = papel === 'monitor' ? reserva.solicitanteId : reserva.tutorUserId
    const url = `/monitorias/reservas/${idDe(reserva)}`
    const primeiraRespostaDoMonitor = papel === 'monitor' && reserva.status === 'solicitada'
    const [res, , avisoRecente] = await Promise.all([
      c.mensagens.insertOne({ reservaId: idDe(reserva), autorId: sessao.userId, tipo: 'texto', texto, createdAt: agora }),
      c.reservas.updateOne(
        { _id: reserva._id as any },
        { $set: { ultimaAtividadeEm: agora, updatedAt: agora, ...(primeiraRespostaDoMonitor ? { status: 'em_negociacao' } : {}) }, ...(primeiraRespostaDoMonitor ? { $inc: { versao: 1 } } : {}) },
      ),
      // Uma conversa animada não pode virar 30 avisos no sino: se o outro lado
      // já tem um "Nova mensagem" desta sala não lido dos últimos 10 min, basta.
      (await getDb()).collection('notifications').findOne(
        { userId: destino, read: false, title: 'Nova mensagem', actionUrl: url, createdAt: { $gt: new Date(agora.getTime() - 10 * 60_000) } },
        { projection: { _id: 1 } },
      ),
    ])
    // Aviso no sino para o outro lado (sem e-mail por mensagem: seria spam).
    if (!avisoRecente) {
      await avisar([{ userId: destino, titulo: 'Nova mensagem', mensagem: `"${reserva.anuncioTitulo}": ${texto.slice(0, 80)}`, url }])
    }
    return ok({ id: String(res.insertedId), texto, createdAt: agora, aviso: mascarou ? AVISO_CONTATO : null }, 201)
  })
}
