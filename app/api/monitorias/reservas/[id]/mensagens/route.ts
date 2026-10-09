import { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro, idDe, lerJson, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { carregarReserva, papelNaReserva } from '@/lib/monitorias/reservas'
import { SchemaMensagem } from '@/lib/monitorias/validacao'
import { AVISO_CONTATO, mascararContato } from '@/lib/monitorias/contato'
import { STATUS_FINAIS } from '@/lib/monitorias/estado'
import { avisar } from '@/lib/monitorias/avisos'

export const dynamic = 'force-dynamic'

const LIVRE = ['confirmada', 'realizada', 'em_disputa', 'concluida']

/** GET ?depois=<ISO> — mensagens novas (polling enquanto a aba está visível). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 120, windowMs: 60_000 } }, async ({ sessao }) => {
    const reserva = await carregarReserva(params.id)
    const papel = await papelNaReserva(reserva, sessao.userId)
    if (!papel) return naoEncontrado()
    const depois = new URL(request.url).searchParams.get('depois')
    const c = await obterColecoes()
    const filtro: Record<string, unknown> = { reservaId: idDe(reserva) }
    if (depois && !Number.isNaN(Date.parse(depois))) filtro.createdAt = { $gt: new Date(depois) }
    const mensagens = await c.mensagens.find(filtro as any).sort({ createdAt: 1 }).limit(100).toArray()
    return ok({
      status: reserva.status,
      versao: reserva.versao,
      mensagens: mensagens.map((m) => ({
        id: idDe(m),
        autor: m.autorId === 'sistema' ? 'sistema' : m.autorId === sessao.userId ? 'eu' : m.autorId === reserva.tutorUserId ? 'monitor' : 'aluno',
        tipo: m.tipo,
        texto: m.texto,
        propostaId: m.propostaId || null,
        createdAt: m.createdAt,
      })),
    })
  })
}

/** POST {texto} — mensagem no chat. Antes do pagamento, contatos pessoais são ocultados. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = SchemaMensagem.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, corpo.error.issues[0]?.message || 'Mensagem inválida.')
    const limite = await checkRateLimit(`mon-msg:${sessao.userId}`, 'monitorias_mensagem', 20, 60_000)
    if (!limite.success) return erro(429, 'Calma! Muitas mensagens seguidas.')
    const reserva = await carregarReserva(params.id)
    const papel = await papelNaReserva(reserva, sessao.userId)
    if (!papel) return naoEncontrado()
    if (STATUS_FINAIS.includes(reserva.status) && reserva.status !== 'concluida') return erro(409, 'Esta reserva foi encerrada.')
    const { texto, mascarou } = LIVRE.includes(reserva.status) ? { texto: corpo.data.texto, mascarou: false } : mascararContato(corpo.data.texto)
    const c = await obterColecoes()
    const agora = new Date()
    const res = await c.mensagens.insertOne({ reservaId: idDe(reserva), autorId: sessao.userId, tipo: 'texto', texto, createdAt: agora })
    const primeiraRespostaDoMonitor = papel === 'monitor' && reserva.status === 'solicitada'
    await c.reservas.updateOne(
      { _id: reserva._id as any },
      { $set: { ultimaAtividadeEm: agora, updatedAt: agora, ...(primeiraRespostaDoMonitor ? { status: 'em_negociacao' } : {}) }, ...(primeiraRespostaDoMonitor ? { $inc: { versao: 1 } } : {}) },
    )
    // Aviso no sino para o outro lado (sem e-mail por mensagem: seria spam).
    const destino = papel === 'monitor' ? reserva.solicitanteId : reserva.tutorUserId
    await avisar([{ userId: destino, titulo: 'Nova mensagem', mensagem: `"${reserva.anuncioTitulo}": ${texto.slice(0, 80)}`, url: `/monitorias/reservas/${idDe(reserva)}` }])
    return ok({ id: String(res.insertedId), texto, createdAt: agora, aviso: mascarou ? AVISO_CONTATO : null }, 201)
  })
}
