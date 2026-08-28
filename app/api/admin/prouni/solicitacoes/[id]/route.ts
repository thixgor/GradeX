import { NextRequest, NextResponse } from 'next/server'
import { ObjectId, type Db } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { audit } from '@/lib/payments/audit'
import { apagarAnexos } from '@/lib/prouni-anexos'
import { resolveProuniProduto } from '@/lib/prouni-catalogo'
import {
  deliverTransactionalEmails,
  sendProuniRequestApprovedEmail,
  sendProuniRequestRejectedEmail,
} from '@/lib/mail'
import {
  getProuniBenefit,
  getProuniDiscountLabel,
  prouniResubmitAvailableAt,
  serializeProuniRequestForAdmin,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniGrant,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Análise de uma solicitação.
 *
 * `PATCH` decide (aprovar/recusar) e `DELETE` apaga só os arquivos, mantendo a
 * decisão. Essa separação é o ponto: comprovante é documento pessoal que a
 * plataforma não tem por que guardar depois de conferir, mas o registro do que
 * foi decidido — por quem, quando, com que desconto — precisa sobreviver, ou
 * some a única prova de que o benefício foi concedido de forma legítima.
 *
 * Aprovar grava uma FOTOGRAFIA das condições no documento da solicitação. A
 * partir daí o checkout não consulta mais a oferta: mexer na campanha não muda
 * o que já foi prometido a quem passou pela análise.
 */

const PatchSchema = z.object({
  action: z.enum(['approve', 'reject', 'revoke']),
  notes: z.string().max(600).optional(),
  // Ajustes na aprovação. Ausentes, valem as condições da oferta do produto.
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().positive().optional(),
  stackWithTier: z.boolean().optional(),
  validityDays: z.number().int().positive().max(365).nullable().optional(),
  /** Apagar os anexos junto com a decisão (o caminho normal). */
  purgeAttachments: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.discountType === 'percentage' && (data.discountValue || 0) > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentual máximo é 100%.' })
  }
})

async function carregar(db: any, id: string) {
  if (!ObjectId.isValid(id)) return null
  return db.collection(PROUNI_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(id) })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos' }, { status: 400 })
  }
  const data = parsed.data

  // O motivo é obrigatório na recusa porque ele VAI POR E-MAIL para a pessoa.
  // Sem ele o aviso vira uma porta batida, e a resposta previsível é reenviar
  // exatamente o mesmo documento — mais uma volta na fila para todo mundo.
  if (data.action === 'reject' && !(data.notes || '').trim()) {
    return NextResponse.json(
      { error: 'Escreva o motivo da recusa: ele é enviado por e-mail para quem solicitou.' },
      { status: 400 }
    )
  }

  try {
    const db = await getDb()
    const solicitacao: ProuniRequest | null = await carregar(db, params.id)
    if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

    const agora = new Date()

    // Desfazer uma aprovação. Existe porque aprovação é ato humano e humano
    // erra: sem isto, um "aprovar" no cartão errado só teria conserto no banco.
    // Só alcança benefício ainda NÃO usado — desfazer um desconto que já virou
    // compra seria cobrar depois do fato.
    if (data.action === 'revoke') {
      if (solicitacao.status !== 'approved' || solicitacao.grant?.usage !== 'available') {
        return NextResponse.json(
          { error: 'Só é possível revogar um desconto aprovado que ainda não foi usado.' },
          { status: 409 }
        )
      }
      await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
        { _id: new ObjectId(params.id) as any, 'grant.usage': 'available' } as any,
        {
          $set: {
            status: 'cancelled',
            'grant.usage': 'revoked',
            reviewNotes: (data.notes || '').trim(),
            reviewedBy: session.userId,
            reviewedByName: session.name || '',
            reviewedAt: agora,
            updatedAt: agora,
          },
        } as any
      )
      await audit({
        action: 'prouni_request_reviewed',
        actorUserId: session.userId,
        targetUserId: solicitacao.userId,
        resourceType: 'prouni_request',
        resourceId: params.id,
        metadata: { decision: 'revoke', itemType: solicitacao.itemType, itemId: solicitacao.itemId },
      })
      const revogado = await carregar(db, params.id)
      return NextResponse.json({
        success: true,
        request: revogado ? serializeProuniRequestForAdmin(revogado) : null,
      })
    }

    // Reanalisar o que já foi decidido reabriria a porta para "aprovar de novo"
    // e emitir um segundo desconto para a mesma pessoa no mesmo item.
    if (solicitacao.status !== 'pending') {
      return NextResponse.json({ error: 'Esta solicitação já foi analisada.' }, { status: 409 })
    }

    const set: Record<string, any> = {
      status: data.action === 'approve' ? 'approved' : 'rejected',
      reviewNotes: (data.notes || '').trim(),
      reviewedBy: session.userId,
      reviewedByName: session.name || '',
      reviewedAt: agora,
      updatedAt: agora,
    }

    if (data.action === 'approve') {
      const benefit = await getProuniBenefit(db, solicitacao.itemType, solicitacao.itemId)
      const discountType = data.discountType || benefit?.discountType
      const discountValue = data.discountValue ?? benefit?.discountValue
      if (!discountType || !discountValue || discountValue <= 0) {
        return NextResponse.json(
          { error: 'Defina o desconto: este item não tem mais uma oferta PROUNI/FIES configurada.' },
          { status: 400 }
        )
      }
      if (discountType === 'percentage' && discountValue > 100) {
        return NextResponse.json({ error: 'Percentual máximo é 100%.' }, { status: 400 })
      }

      const validityDays = data.validityDays !== undefined
        ? data.validityDays
        : benefit?.grantValidityDays ?? null
      const expiresAt = validityDays && validityDays > 0
        ? new Date(agora.getTime() + validityDays * 86_400_000)
        : null

      const grant: ProuniGrant = {
        discountType,
        discountValue,
        stackWithTier: data.stackWithTier ?? benefit?.stackWithTier === true,
        usage: 'available',
        expiresAt,
        reservedOrderId: null,
        approvedBy: session.userId,
        approvedByName: session.name || '',
        approvedAt: agora,
      }
      set.grant = grant
    } else {
      set.grant = null
    }

    // Limpeza opcional junto da decisão: é o caminho barato de manter o Blob
    // enxuto, sem depender de o admin lembrar de voltar aqui depois.
    let anexosApagados = 0
    if (data.purgeAttachments && (solicitacao.attachments || []).length > 0) {
      const resultado = await apagarAnexos(solicitacao.attachments.map((file) => file.blobUrl))
      anexosApagados = resultado.apagados
      set.attachments = []
      set.attachmentsPurgedAt = agora
      set.attachmentsPurgedBy = session.userId
    }

    await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
      { _id: new ObjectId(params.id) as any, status: 'pending' } as any,
      { $set: set }
    )

    await notificarDecisao(db, solicitacao, {
      decisao: data.action,
      notas: (data.notes || '').trim(),
      grant: set.grant as ProuniGrant | null,
    })

    await audit({
      action: 'prouni_request_reviewed',
      actorUserId: session.userId,
      targetUserId: solicitacao.userId,
      resourceType: 'prouni_request',
      resourceId: params.id,
      metadata: {
        decision: data.action,
        itemType: solicitacao.itemType,
        itemId: solicitacao.itemId,
        discountType: set.grant?.discountType,
        discountValue: set.grant?.discountValue,
        stackWithTier: set.grant?.stackWithTier,
        attachmentsPurged: anexosApagados,
      },
    })

    const atualizado = await carregar(db, params.id)
    return NextResponse.json({
      success: true,
      request: atualizado ? serializeProuniRequestForAdmin(atualizado) : null,
    })
  } catch (error) {
    console.error('[admin/prouni/solicitacoes/:id] PATCH erro:', error)
    return NextResponse.json({ error: 'Erro ao analisar solicitação' }, { status: 500 })
  }
}

/**
 * O e-mail que fecha o ciclo da análise.
 *
 * Aguardado na rota, com o orçamento de `deliverTransactionalEmails`: em
 * serverless a instância congela junto com a resposta, e o que estava
 * pendurado num disparo em segundo plano nunca sai. O orçamento é o que impede
 * que esperar trave o painel de quem está analisando uma fila inteira.
 *
 * Vai para o e-mail da CONTA e, quando for outro, também para o que a pessoa
 * digitou no formulário — as duas caixas são endereços que ela indicou.
 *
 * Na recusa vai junto a data em que a pessoa poderá tentar de novo, quando
 * houver espera; na primeira recusa não há, e o botão "Refazer solicitação" do
 * e-mail funciona na hora.
 */
async function notificarDecisao(
  db: Db,
  solicitacao: ProuniRequest,
  decisao: { decisao: 'approve' | 'reject'; notas: string; grant: ProuniGrant | null }
) {
  const destinatarios = Array.from(
    new Set(
      [solicitacao.applicant?.email, solicitacao.userEmail].filter(
        (valor): valor is string => Boolean(valor)
      )
    )
  )
  if (destinatarios.length === 0) return

  const nome = solicitacao.applicant?.fullName || solicitacao.userName
  const comum = {
    itemTitle: solicitacao.itemTitle,
    itemType: solicitacao.itemType,
    itemId: solicitacao.itemId,
    program: solicitacao.program,
  }

  try {
    if (decisao.decisao === 'approve' && decisao.grant) {
      const produto = await resolveProuniProduto(db, solicitacao.itemType, solicitacao.itemId)
      await deliverTransactionalEmails(
        destinatarios.map((email) =>
          sendProuniRequestApprovedEmail({
            ...comum,
            email,
            name: nome,
            discountLabel: getProuniDiscountLabel(decisao.grant!),
            stackWithTier: decisao.grant!.stackWithTier === true,
            expiresAt: decisao.grant!.expiresAt || null,
            productUrl: produto?.href,
            notes: decisao.notas || undefined,
          })
        )
      )
      return
    }

    const liberaEm = await prouniResubmitAvailableAt(db, {
      userId: solicitacao.userId,
      itemType: solicitacao.itemType,
      itemId: solicitacao.itemId,
    })
    await deliverTransactionalEmails(
      destinatarios.map((email) =>
        sendProuniRequestRejectedEmail({
          ...comum,
          email,
          name: nome,
          reason: decisao.notas,
          canResubmitAt: liberaEm,
        })
      )
    )
  } catch (error) {
    // Notificar é consequência da decisão, nunca condição dela: a análise já
    // está gravada e não pode voltar atrás por causa do SMTP.
    console.error('[admin/prouni] falha ao notificar decisão:', error)
  }
}

/**
 * Apaga os arquivos do Blob, preservando a solicitação.
 *
 * Não é "excluir a solicitação": o histórico permanece, com quem decidiu o quê
 * e quando. O que sai é o documento pessoal — que, depois de conferido, só
 * ocupa espaço pago e aumenta o estrago de qualquer vazamento futuro.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const solicitacao: ProuniRequest | null = await carregar(db, params.id)
    if (!solicitacao) return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })

    const anexos = solicitacao.attachments || []
    if (anexos.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, alreadyEmpty: true })
    }

    const { apagados } = await apagarAnexos(anexos.map((file) => file.blobUrl))
    const agora = new Date()

    // Os metadados saem mesmo se o Blob recusou algum apagamento: manter a
    // referência de um arquivo que talvez não exista mais só faria a tela do
    // admin oferecer um download quebrado.
    await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
      { _id: new ObjectId(params.id) as any },
      {
        $set: {
          attachments: [],
          attachmentsPurgedAt: agora,
          attachmentsPurgedBy: session.userId,
          updatedAt: agora,
        },
      } as any
    )

    await audit({
      action: 'prouni_attachments_purged',
      actorUserId: session.userId,
      targetUserId: solicitacao.userId,
      resourceType: 'prouni_request',
      resourceId: params.id,
      metadata: { requested: anexos.length, deleted: apagados },
    })

    return NextResponse.json({ success: true, deleted: apagados })
  } catch (error) {
    console.error('[admin/prouni/solicitacoes/:id] DELETE erro:', error)
    return NextResponse.json({ error: 'Erro ao apagar anexos' }, { status: 500 })
  }
}
