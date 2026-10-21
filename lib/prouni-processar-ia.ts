import 'server-only'

/**
 * A análise automática de uma solicitação, do começo ao fim, FORA do caminho
 * da resposta.
 *
 * Ela rodava dentro do `POST` de envio, com teto de ~30 s para caber no tempo
 * da requisição — e um PDF escaneado de várias páginas (contrato do FIES, por
 * exemplo) passava disso: "tempo esgotado", fila manual, e a IA não servia
 * justamente para os documentos mais pesados. Agora o envio grava a
 * solicitação com `aiReview.outcome: 'processing'`, responde na hora e entrega
 * esta função ao `waitUntil` da mesma invocação (até 300 s). A tela acompanha
 * pelo `GET /api/prouni/beneficio` até o parecer chegar; o e-mail sai daqui.
 *
 * O mesmo caminho atende ao "Reanalisar com IA" do painel, sem os avisos de
 * envio (o admin está olhando a tela).
 *
 * Nunca lança: qualquer falha vira `aiReview.outcome: 'failed'`, que deixa a
 * solicitação na fila manual — o comportamento de antes da IA.
 */

import { waitUntil } from '@vercel/functions'
import { ObjectId, type Db } from 'mongodb'
import { audit } from '@/lib/payments/audit'
import {
  deliverTransactionalEmails,
  sendProuniRequestAdminAlert,
  sendProuniRequestAiFlaggedEmail,
  sendProuniRequestApprovedEmail,
  sendProuniRequestReceivedEmail,
} from '@/lib/mail'
import { resolveProuniProduto } from '@/lib/prouni-catalogo'
import { analisarComprovantesComIA } from '@/lib/prouni-analise-ia'
import {
  getLiveProuniBenefit,
  getProuniDiscountLabel,
  montarConcessao,
  PROUNI_AI_REVIEWER_ID,
  PROUNI_AI_REVIEWER_NAME,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniAiReview,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export type OrigemDaAnalise = 'envio' | 'admin'

/**
 * Entrega o processamento ao `waitUntil` (a resposta sai antes). Fora da
 * Vercel — testes, `next dev` — a promessa simplesmente segue sozinha.
 */
export function analisarEmSegundoPlano(db: Db, requestId: string, origem: OrigemDaAnalise): Promise<void> {
  const trabalho = processarAnaliseIA(db, requestId, origem)
  try {
    waitUntil(trabalho)
  } catch {
    /* fora da Vercel */
  }
  return trabalho
}

export async function processarAnaliseIA(db: Db, requestId: string, origem: OrigemDaAnalise): Promise<void> {
  if (!ObjectId.isValid(requestId)) return
  const colecao = db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION)
  const filtroPendente = { _id: new ObjectId(requestId), status: 'pending' } as any

  let solicitacao: ProuniRequest | null = null
  try {
    solicitacao = await colecao.findOne(filtroPendente)
    // Já decidida por alguém (ou apagada) enquanto esperava: nada a fazer.
    if (!solicitacao) return

    const [benefit, produto] = await Promise.all([
      getLiveProuniBenefit(db, solicitacao.itemType, solicitacao.itemId),
      resolveProuniProduto(db, solicitacao.itemType, solicitacao.itemId),
    ])

    const resultado = await analisarComprovantesComIA({
      program: solicitacao.program,
      applicant: solicitacao.applicant,
      itemTitle: solicitacao.itemTitle,
      attachments: solicitacao.attachments || [],
    })
    const agora = new Date()
    let aiReview: ProuniAiReview = { ...resultado, reviewedAt: agora }
    let final: ProuniRequest = solicitacao

    if (aiReview.outcome === 'approved') {
      // Oferta desligada no meio do caminho: a IA não concede sozinha.
      const grant = benefit
        ? montarConcessao(benefit, { id: PROUNI_AI_REVIEWER_ID, nome: PROUNI_AI_REVIEWER_NAME }, agora)
        : null
      if (grant) {
        const set = {
          status: 'approved' as const,
          grant,
          aiReview,
          reviewNotes: '',
          reviewedBy: PROUNI_AI_REVIEWER_ID,
          reviewedByName: PROUNI_AI_REVIEWER_NAME,
          reviewedAt: agora,
          updatedAt: agora,
        }
        // `status: 'pending'` é o mesmo guarda da aprovação manual: se o admin
        // decidiu enquanto a IA pensava, a decisão dele fica.
        const r = await colecao.updateOne(filtroPendente, { $set: set })
        await registrar(solicitacao, aiReview, r.matchedCount === 1)
        if (r.matchedCount !== 1) return
        final = { ...solicitacao, ...set }
      } else {
        aiReview = { ...aiReview, outcome: 'failed', reason: 'oferta sem desconto ativo; precisa de revisão manual' }
      }
    }

    if (final.status === 'pending') {
      const r = await colecao.updateOne(filtroPendente, { $set: { aiReview, updatedAt: agora } })
      await registrar(solicitacao, aiReview, false)
      if (r.matchedCount !== 1) return
      final = { ...solicitacao, aiReview }
    }

    await avisar(db, final, aiReview, origem, produto)
  } catch (erro) {
    console.error('[prouni/ia] processamento interrompido:', erro instanceof Error ? erro.message : 'erro')
    if (!solicitacao) return
    // Não deixa o "analisando…" pendurado: vira falha e cai na fila manual.
    const aiReview: ProuniAiReview = { outcome: 'failed', reason: 'erro interno na análise automática', reviewedAt: new Date() }
    try {
      const r = await colecao.updateOne(filtroPendente, { $set: { aiReview, updatedAt: new Date() } })
      if (r.matchedCount === 1) await avisar(db, { ...solicitacao, aiReview }, aiReview, origem, null)
    } catch {
      /* o painel mostra a análise como não concluída depois do prazo */
    }
  }
}

async function registrar(solicitacao: ProuniRequest, parecer: ProuniAiReview, aprovou: boolean) {
  await audit({
    action: 'prouni_request_ai_reviewed',
    actorUserId: PROUNI_AI_REVIEWER_ID,
    targetUserId: solicitacao.userId,
    resourceType: 'prouni_request',
    resourceId: String(solicitacao._id),
    metadata: {
      outcome: parecer.outcome,
      approved: aprovou,
      model: parecer.model,
      durationMs: parecer.durationMs,
      itemType: solicitacao.itemType,
      itemId: solicitacao.itemId,
    },
  })
}

/**
 * Os e-mails que fecham a análise.
 *
 * - **envio**: a pessoa recebe aprovado / revisão manual / recebemos; o admin,
 *   o alerta com o parecer.
 * - **admin** (reanálise pedida no painel): só o "aprovado" para a pessoa, se
 *   for o caso — quem pediu está olhando a tela, e a pessoa já recebeu o aviso
 *   do envio.
 */
async function avisar(
  db: Db,
  final: ProuniRequest,
  parecer: ProuniAiReview,
  origem: OrigemDaAnalise,
  produtoJaLido: Awaited<ReturnType<typeof resolveProuniProduto>> | null
) {
  const aprovada = final.status === 'approved' && final.grant
  if (origem === 'admin' && !aprovada) return

  const destinatarios = Array.from(
    new Set([final.userEmail, final.applicant?.email].filter((v): v is string => Boolean(v)))
  )
  const nome = final.applicant?.fullName || final.userName
  const produto = produtoJaLido ?? (await resolveProuniProduto(db, final.itemType, final.itemId).catch(() => null))
  const titulo = produto?.title || final.itemTitle

  const daPessoa = destinatarios.map((email) => {
    if (aprovada) {
      return sendProuniRequestApprovedEmail({
        email,
        name: nome,
        itemTitle: titulo,
        itemType: final.itemType,
        itemId: final.itemId,
        program: final.program,
        discountLabel: getProuniDiscountLabel(final.grant!),
        stackWithTier: final.grant!.stackWithTier === true,
        expiresAt: final.grant!.expiresAt || null,
        productUrl: produto?.href,
      })
    }
    if (parecer.outcome === 'rejected' && parecer.reason) {
      return sendProuniRequestAiFlaggedEmail({ email, name: nome, itemTitle: titulo, program: final.program, reason: parecer.reason })
    }
    return sendProuniRequestReceivedEmail({
      email,
      name: nome,
      itemTitle: titulo,
      itemType: final.itemType,
      itemId: final.itemId,
      program: final.program,
      attachments: (final.attachments || []).length,
    })
  })

  if (origem === 'admin') {
    await deliverTransactionalEmails(daPessoa)
    return
  }

  const pendentes = await db
    .collection(PROUNI_REQUESTS_COLLECTION)
    .countDocuments({ status: 'pending' })
    .catch(() => undefined)

  await deliverTransactionalEmails([
    ...daPessoa,
    sendProuniRequestAdminAlert({
      requestId: String(final._id),
      userName: final.userName,
      userEmail: final.userEmail,
      applicantName: final.applicant?.fullName || '',
      applicantCpf: final.applicant?.cpf,
      institution: final.applicant?.institution,
      itemTitle: titulo,
      program: final.program,
      attachments: (final.attachments || []).length,
      pendingCount: typeof pendentes === 'number' ? pendentes : undefined,
      aiReview: {
        outcome: aprovada ? 'approved' : parecer.outcome === 'rejected' ? 'rejected' : 'failed',
        reason: parecer.reason,
        adminNotes: parecer.adminNotes,
        documentType: parecer.documentType,
        discountLabel: final.grant ? getProuniDiscountLabel(final.grant) : undefined,
      },
    }),
  ])
}
