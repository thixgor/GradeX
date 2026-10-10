import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { formatarEmBrasilia } from '@/lib/fuso-brasilia'
import type { PaymentOrder } from '@/lib/types'
import { idDe, naoEncontrado, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { secoesDoContrato, tituloDoContrato } from '@/lib/monitorias/documentos/contrato'
import { secoesDosTermos, tituloDosTermos, VERSAO_TERMOS } from '@/lib/monitorias/documentos/termos'
import { pdfDaConversa, pdfDoComprovante, pdfDoContrato, pdfDoRepasse, pdfDosTermos } from '@/lib/monitorias/pdf'
import { acessoDeLeitura } from '@/lib/monitorias/reservas'
import { mascararContato } from '@/lib/monitorias/contato'
import { ROTULOS_STATUS } from '@/lib/monitorias/estado'
import { reaisParaCentavos } from '@/lib/monitorias/dinheiro'
import { formatarDuracao } from '@/lib/monitorias/agenda'
import { carregarUsuario } from '@/lib/monitorias/servidor'
import { nomeCivil } from '@/lib/monitorias/contratos'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/** Teto do PDF da conversa (o documento avisa quando corta; o resto segue na sala). */
const LIMITE_PDF_CONVERSA = 4000

const ROTULO_ASSENTO: Record<string, string> = {
  aguardando_assinatura: 'Aguardando assinatura',
  aguardando_pagamento: 'Aguardando pagamento',
  paga: 'Pago — valor em garantia',
  gratis: 'Gratuita',
  concluida: 'Pago — monitoria concluída',
  reembolso_processando: 'Reembolso em processamento',
  reembolsada: 'Reembolsado',
  cancelada: 'Cancelado',
  expirada: 'Expirado',
  chargeback: 'Contestado (chargeback)',
}

const ROTULO_REPASSE: Record<string, string> = {
  em_garantia: 'Em garantia (48h após a aula)',
  liberado: 'Liberado para repasse',
  em_pagamento: 'Em pagamento',
  pago: 'Pago ao monitor',
  estornado: 'Estornado',
  retido: 'Retido',
}

function pdf(bytes: Uint8Array, nome: string) {
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nome}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/**
 * GET /api/monitorias/documentos/<tipo>/<id> — PDFs formais:
 *  - contrato/<contratoId>       partes e admin
 *  - comprovante/<assentoId>     aluno dono, monitor da aula e admin
 *  - venda/<assentoId>           monitor da aula e admin (demonstrativo da venda)
 *  - repasse/<payoutId>          monitor e admin (comprovante do repasse)
 *  - termos/<monitor|aluno>      a própria pessoa (com o aceite registrado)
 *  - conversa/<reservaId>        participantes e admin (histórico do chat + materiais)
 */
export async function GET(request: NextRequest, { params }: { params: { tipo: string; id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 30, windowMs: 60_000 } }, async ({ sessao }) => {
    const admin = sessao.role === 'admin'
    const c = await obterColecoes()

    if (params.tipo === 'termos') {
      if (params.id !== 'monitor' && params.id !== 'aluno') return naoEncontrado()
      // O último aceite da pessoa, na versão que ELA aceitou (cópia guardada no aceite).
      // Sem aceite (ou aceite antigo sem cópia): a versão vigente, sem evidências.
      const [ultimo, user] = await Promise.all([
        c.termos.find({ userId: sessao.userId, papel: params.id }).sort({ em: -1 }).limit(1).next(),
        carregarUsuario(sessao.userId),
      ])
      const aceite = ultimo && (ultimo.secoes?.length || ultimo.versao === VERSAO_TERMOS) ? ultimo : null
      const versao = aceite?.versao || VERSAO_TERMOS
      const bytes = await pdfDosTermos({
        titulo: aceite?.titulo || tituloDosTermos(params.id),
        versao,
        secoes: aceite?.secoes?.length ? aceite.secoes : secoesDosTermos(params.id),
        aceite: aceite && user ? { nome: nomeCivil(user), em: aceite.em, ip: aceite.ip, hash: aceite.hash } : undefined,
      })
      return pdf(bytes, `termos-monitoria-${params.id}-${versao}.pdf`)
    }

    if (!ObjectId.isValid(params.id)) return naoEncontrado()
    const _id = new ObjectId(params.id)

    if (params.tipo === 'conversa') {
      const reserva = await c.reservas.findOne({ _id } as any)
      if (!reserva) return naoEncontrado()
      const acesso = await acessoDeLeitura(reserva, sessao.userId)
      if (!acesso && !admin) return naoEncontrado()
      const papel = acesso?.papel || null
      const reservaId = idDe(reserva)
      const [mensagens, assentos, tutor] = await Promise.all([
        c.mensagens.find({ reservaId }).sort({ createdAt: 1 }).limit(LIMITE_PDF_CONVERSA + 1).toArray(),
        c.participacoes.find({ reservaId }, { projection: { alunoId: 1, alunoNome: 1, status: 1 } }).toArray(),
        c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1 } }),
      ])
      const nomes = new Map<string, string>([[reserva.tutorUserId, `${tutor?.nome || 'Monitor'} (monitor)`]])
      for (const a of assentos) nomes.set(a.alunoId, `${a.alunoNome} (aluno)`)
      const pagou = assentos.some((a) => a.alunoId === sessao.userId && ['paga', 'gratis', 'concluida'].includes(a.status))
      const extras = papel === 'monitor' || pagou || admin ? reserva.materiaisExtras || [] : []
      const bytes = await pdfDaConversa({
        titulo: reserva.anuncioTitulo,
        reservaId,
        participantes: [
          ['Monitor', tutor?.nome || '—'],
          ['Alunos', assentos.map((a) => a.alunoNome).join(', ') || '—'],
          ['Situação', ROTULOS_STATUS[reserva.status]?.rotulo || reserva.status],
          ['Aula', reserva.inicio ? `${formatarEmBrasilia(reserva.inicio, { dateStyle: 'full', timeStyle: 'short' })} (Brasília)` : 'a combinar'],
        ],
        truncado: mensagens.length > LIMITE_PDF_CONVERSA,
        mensagens: mensagens.slice(0, LIMITE_PDF_CONVERSA).map((m) => ({
          autor: m.autorId === 'sistema' ? 'Sistema' : nomes.get(m.autorId) || 'Participante',
          texto: acesso?.mascarar ? mascararContato(m.texto).texto : m.texto,
          em: m.createdAt,
          sistema: m.autorId === 'sistema' || m.tipo === 'sistema',
        })),
        materiais: [...(reserva.materiais || []), ...extras].map((m) => ({ titulo: m.titulo, url: m.url })),
      })
      return pdf(bytes, `historico-monitoria-${reservaId}.pdf`)
    }

    if (params.tipo === 'contrato') {
      const k = await c.contratos.findOne({ _id } as any)
      if (!k || (!admin && k.contratanteId !== sessao.userId && k.contratadoId !== sessao.userId)) return naoEncontrado()
      const status = k.status === 'assinado' ? 'Assinado pelas partes' : k.status === 'rescindido' ? 'Sem efeito (substituído/cancelado)' : 'Aguardando assinaturas'
      const bytes = await pdfDoContrato({
        titulo: tituloDoContrato(k.dados),
        numero: k.numero,
        status,
        hash: k.hash,
        codigoVerificacao: k.codigoVerificacao,
        secoes: k.secoes || secoesDoContrato(k.dados),
        assinaturas: k.assinaturas,
      })
      return pdf(bytes, `contrato-${k.numero}.pdf`)
    }

    if (params.tipo === 'comprovante' || params.tipo === 'venda') {
      const part = await c.participacoes.findOne({ _id } as any)
      if (!part) return naoEncontrado()
      const reserva = await c.reservas.findOne({ _id: new ObjectId(part.reservaId) } as any)
      if (!reserva) return naoEncontrado()
      const ehAluno = part.alunoId === sessao.userId
      const ehMonitor = reserva.tutorUserId === sessao.userId
      if (params.tipo === 'comprovante' && !ehAluno && !ehMonitor && !admin) return naoEncontrado()
      if (params.tipo === 'venda' && !ehMonitor && !admin) return naoEncontrado()

      if (params.tipo === 'venda') {
        const [repasse, monitor] = await Promise.all([c.repasses.findOne({ participacaoId: idDe(part) }), carregarUsuario(reserva.tutorUserId)])
        if (!repasse || !monitor) return naoEncontrado()
        const bytes = await pdfDoRepasse({
          titulo: 'Demonstrativo de venda de monitoria',
          monitorNome: nomeCivil(monitor),
          monitorCpf: monitor.cpf || '',
          itens: [
            {
              descricao: `${reserva.anuncioTitulo} — aluno(a) ${part.alunoNome}`,
              brutoCentavos: repasse.brutoCentavos,
              taxaCentavos: repasse.taxaPlataformaCentavos,
              liquidoCentavos: repasse.liquidoTutorCentavos,
              status: ROTULO_REPASSE[repasse.status] || repasse.status,
            },
          ],
          totalCentavos: repasse.liquidoTutorCentavos,
          identificador: `Venda ${idDe(part)}`,
        })
        return pdf(bytes, `venda-monitoria-${idDe(part)}.pdf`)
      }

      // Comprovante só existe para pagamento que entrou de fato.
      if (!part.paymentOrderId || !ObjectId.isValid(part.paymentOrderId) || !part.pagoEm) return naoEncontrado()
      const db = await getDb()
      const [order, aluno, monitor, contrato] = await Promise.all([
        db.collection<PaymentOrder>('payment_orders').findOne({ _id: new ObjectId(part.paymentOrderId) as any }),
        carregarUsuario(part.alunoId),
        carregarUsuario(reserva.tutorUserId),
        c.contratos.findOne({ participacaoId: idDe(part) }, { projection: { numero: 1 } }),
      ])
      if (!order || !aluno || !monitor) return naoEncontrado()
      const total = reaisParaCentavos(order.paidAmount ?? order.amount)
      const bytes = await pdfDoComprovante({
        pedidoId: String(order._id),
        pagamentoId: order.providerPaymentId || '',
        pagoEm: part.pagoEm || order.paidAt,
        alunoNome: nomeCivil(aluno),
        alunoCpf: aluno.cpf || '',
        monitorNome: nomeCivil(monitor),
        anuncioTitulo: reserva.anuncioTitulo,
        inicio: reserva.inicio,
        duracao: reserva.proposta ? formatarDuracao(reserva.proposta.duracaoMin) : '—',
        valorCentavos: part.valorCentavos,
        taxaPixCentavos: Math.max(0, total - part.valorCentavos),
        totalPagoCentavos: total,
        contratoNumero: contrato?.numero,
        status: order.status === 'approved' ? ROTULO_ASSENTO[part.status] || 'Pago' : `Pagamento ${order.status}`,
        reembolsos: part.reembolsos,
      })
      return pdf(bytes, `comprovante-monitoria-${String(order._id)}.pdf`)
    }

    if (params.tipo === 'repasse') {
      const payout = await c.payouts.findOne({ _id } as any)
      if (!payout || (!admin && payout.tutorUserId !== sessao.userId)) return naoEncontrado()
      const [repasses, monitor] = await Promise.all([
        c.repasses.find({ _id: { $in: payout.repasseIds.filter(ObjectId.isValid).map((x) => new ObjectId(x)) } } as any).toArray(),
        carregarUsuario(payout.tutorUserId),
      ])
      const reservas = await c.reservas
        .find({ _id: { $in: Array.from(new Set(repasses.map((r) => r.reservaId))).map((x) => new ObjectId(x)) } } as any, { projection: { anuncioTitulo: 1, inicio: 1 } })
        .toArray()
      const titulos = new Map(reservas.map((r) => [idDe(r), r.anuncioTitulo]))
      const bytes = await pdfDoRepasse({
        titulo: 'Comprovante de repasse ao monitor',
        monitorNome: monitor ? nomeCivil(monitor) : '',
        monitorCpf: monitor?.cpf || '',
        itens: repasses.map((r) => ({
          descricao: titulos.get(r.reservaId) || 'Monitoria',
          brutoCentavos: r.brutoCentavos,
          taxaCentavos: r.taxaPlataformaCentavos,
          liquidoCentavos: r.liquidoTutorCentavos,
          status: ROTULO_REPASSE[r.status] || r.status,
        })),
        abatidoCentavos: payout.abatidoCentavos,
        totalCentavos: payout.totalCentavos,
        pix: `${payout.pix.mascarada} (${payout.pix.tipo})`,
        e2eId: payout.e2eId,
        pagoEm: payout.pagoEm,
        identificador: `Repasse ${idDe(payout)}`,
      })
      return pdf(bytes, `repasse-monitoria-${idDe(payout)}.pdf`)
    }

    return naoEncontrado()
  })
}
