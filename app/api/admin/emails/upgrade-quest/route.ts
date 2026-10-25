import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { drainQueueNow } from '@/lib/comms/process'
import {
  CAMPAIGNS_COLLECTION,
  createAndEnqueueCampaign,
  getCampaignProgress,
  type CampaignRecipient,
} from '@/lib/comms/email-campaigns'
import { getMarketingEmailTemplate, personalize } from '@/lib/comms/email-render'
import { getManualClinicoConfig } from '@/lib/manual-clinico-product'
import { itensInclusos } from '@/lib/plus-oferta'
import { normalizarConfigDoUpgrade, planoPadraoDoUpgrade, planosDoUpgrade, precoDeUpgrade } from '@/lib/upgrade-quest'
import { montarEmailDeUpgrade } from '@/lib/upgrade-quest-email'
import { filtroDeQuestVigente } from '@/lib/upgrade-quest-server'
import type { PlanConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/** Prefixo do nome da campanha: é por ele que o histórico e a trava a acham. */
const NOME_DA_CAMPANHA = 'Upgrade Quest+ → Plus+'
/** Dois cliques no botão não podem virar dois e-mails para a mesma pessoa. */
const TRAVA_MS = 15 * 60_000
const DRAIN_BUDGET_MS = 35_000

/** O Quest+ já tem estes; a lista de ganhos não repete o que a pessoa paga. */
const JA_NO_QUEST = new Set(['bancoQuestoes', 'provasPdf'])

/**
 * O e-mail de upgrade do botão de /admin/emails.
 *
 * GET  → quantos Quest+ vão receber, o assunto e a prévia do HTML (já no
 *        layout, com "Fulano" no lugar do nome).
 * POST → `{ teste: true }` manda só para o e-mail do admin; sem isso, enfileira
 *        para todo Quest+ vigente pela outbox de campanhas (retry, backoff e
 *        status por pessoa, igual ao envio manual).
 */
async function montar() {
  const db = await getDb()
  const settings = await db.collection('admin_settings').findOne({}, { projection: { planos: 1, upgradeQuest: 1 } })
  const config = normalizarConfigDoUpgrade(settings?.upgradeQuest)
  const planos = planosDoUpgrade((settings?.planos || []) as PlanConfig[], config)
  const plano = planoPadraoDoUpgrade(planos, config)
  if (!config.ativo) return { erro: 'A oferta de upgrade está desligada em /admin/settings.' } as const
  if (!plano) return { erro: 'Nenhum plano Plus+ entra na oferta. Confira os planos em /admin/settings.' } as const

  const manual = await getManualClinicoConfig(db).catch(() => null)
  const ganhos = itensInclusos(plano, { manualIncluidoNoPlus: manual?.includedInPlus !== false })
    .filter((i) => !JA_NO_QUEST.has(i.chave))
    .map((i) => i.rotulo)

  const email = montarEmailDeUpgrade({
    descontoPercentual: config.descontoPercentual,
    plano: {
      nome: plano.nome,
      periodo: plano.periodo || '',
      preco: Number(plano.preco),
      precoUpgrade: precoDeUpgrade(Number(plano.preco), config.descontoPercentual),
      durationMonths: Number(plano.durationMonths) || 0,
    },
    ganhos,
    janelaHoras: config.urgencia.ativa ? config.urgencia.horas : null,
    extraBolsista: config.bolsista.ativo ? config.bolsista.descontoExtra : null,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br',
  })
  return { db, email, config } as const
}

export async function GET() {
  const session = await getSession()
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const r = await montar()
    if ('erro' in r) return NextResponse.json({ error: r.erro, destinatarios: 0 }, { status: 409 })
    const [destinatarios, ultima] = await Promise.all([
      r.db.collection('users').countDocuments(filtroDeQuestVigente()),
      r.db
        .collection(CAMPAIGNS_COLLECTION)
        .find({ name: { $regex: '^Upgrade Quest\\+' } })
        .project({ campaignId: 1, total: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(1)
        .next(),
    ])
    return NextResponse.json({
      destinatarios,
      assunto: r.email.assunto,
      previa: r.email.previa,
      html: personalize(getMarketingEmailTemplate(r.email.conteudo, r.email.previa), 'Fulano de Tal'),
      descontoPercentual: r.config.descontoPercentual,
      ultimaCampanha: ultima ? { campaignId: ultima.campaignId, total: ultima.total, createdAt: ultima.createdAt } : null,
    })
  } catch (error) {
    console.error('[admin/emails/upgrade-quest] GET:', error)
    return NextResponse.json({ error: 'Erro ao montar o e-mail de upgrade' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (session?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  try {
    const body = await request.json().catch(() => ({}))
    const teste = body?.teste === true

    const r = await montar()
    if ('erro' in r) return NextResponse.json({ error: r.erro }, { status: 409 })
    const { db, email } = r

    let destinatarios: CampaignRecipient[]
    if (teste) {
      const admin = ObjectId.isValid(session.userId)
        ? await db.collection('users').findOne({ _id: new ObjectId(session.userId) }, { projection: { email: 1, name: 1 } })
        : null
      const para = String(admin?.email || session.email || '').trim().toLowerCase()
      if (!para) return NextResponse.json({ error: 'Sua conta não tem e-mail para o teste.' }, { status: 400 })
      destinatarios = [{ email: para, name: String(admin?.name || session.name || ''), userId: session.userId }]
    } else {
      const recente = await db.collection(CAMPAIGNS_COLLECTION).findOne({
        name: { $regex: '^Upgrade Quest\\+' },
        source: 'manual',
        total: { $gt: 1 },
        createdAt: { $gte: new Date(Date.now() - TRAVA_MS) },
      })
      if (recente) {
        return NextResponse.json(
          { error: 'Esta campanha já foi disparada há menos de 15 minutos. Acompanhe o envio no histórico.', campaignId: recente.campaignId },
          { status: 409 },
        )
      }
      const linhas = await db
        .collection('users')
        .find(filtroDeQuestVigente())
        .project<{ _id: ObjectId; email?: string; name?: string }>({ email: 1, name: 1 })
        .toArray()
      const vistos = new Set<string>()
      destinatarios = []
      for (const u of linhas) {
        const e = String(u.email || '').trim().toLowerCase()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || vistos.has(e)) continue
        vistos.add(e)
        destinatarios.push({ email: e, name: String(u.name || ''), userId: String(u._id) })
      }
    }

    if (destinatarios.length === 0) {
      return NextResponse.json({ error: 'Nenhum assinante Quest+ vigente para receber a oferta.' }, { status: 400 })
    }

    const data = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const { campaignId } = await createAndEnqueueCampaign({
      recipients: destinatarios,
      content: { subject: email.assunto, content: email.conteudo, previewText: email.previa },
      name: `${NOME_DA_CAMPANHA}${teste ? ' (teste)' : ''} · ${data}`,
      source: 'manual',
      createdBy: session.userId,
    })

    await drainQueueNow(['email'], { timeBudgetMs: DRAIN_BUDGET_MS })
    const progresso = await getCampaignProgress(campaignId)

    return NextResponse.json({
      success: true,
      campaignId,
      teste,
      stats: progresso?.stats ?? { total: destinatarios.length, sent: 0, pending: destinatarios.length, failed: 0, dead: 0, skipped: 0 },
      done: progresso?.done ?? false,
    })
  } catch (error) {
    console.error('[admin/emails/upgrade-quest] POST:', error)
    return NextResponse.json({ error: 'Erro ao disparar o e-mail de upgrade' }, { status: 500 })
  }
}
