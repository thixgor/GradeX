import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { sendProfileReminderEmail } from '@/lib/mail'
import { getMissingProfileFields } from '@/lib/profile-completeness'
import type { User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DAY = 24 * 60 * 60 * 1000
// Não muito frequente (pedido explícito): no máximo 1 lembrete a cada 14 dias
// por usuário, mesmo que o cron externo rode com mais frequência.
const REENVIO_MIN_DIAS = 14
// Teto de candidatos buscados por execução. O SMTP é limitado a poucas
// mensagens/segundo (ver lib/mail.ts), então um lote grande demora minutos —
// e serviços de cron externos (cron-job.org etc.) costumam ter timeout curto
// (às vezes 30s no plano free). Mantemos isso baixo e confiamos no orçamento
// de tempo abaixo pra garantir resposta rápida mesmo assim.
const MAX_POR_EXECUCAO = 40
// Para de mandar novos e-mails depois desse tempo de execução (contado desde
// o início do handler, antes até de conectar no banco), mesmo que ainda
// sobrem candidatos — eles são pegos na próxima chamada do cron. cron-job.org
// usa timeout de 30s, então isso deixa ~8s de folga pra resposta voltar,
// contabilizando handshake/rede.
const TIME_BUDGET_MS = 22_000

/**
 * Cron externo (rodar via cron-job.org — NÃO está no vercel.json porque o
 * plano Hobby da Vercel só permite crons diários e o projeto já usa todos).
 * Sugestão de frequência: semanal em regime normal. Como o lote por execução
 * é pequeno (MAX_POR_EXECUCAO/TIME_BUDGET_MS), se houver um backlog grande
 * (ex.: logo após lançar essa feature, quando quase todo mundo tem algo
 * faltando) vale rodar manualmente ou com frequência maior por alguns dias
 * até esvaziar a fila — o cooldown de REENVIO_MIN_DIAS por usuário garante
 * que rodar mais vezes não gera spam, só acelera cobrir todo mundo.
 *
 * Lembra usuários com dados de perfil incompletos (telefone, estado e os
 * campos específicos da profissão atual — especialidade pro médico,
 * área/hospital/ano pro residente, instituição pro acadêmico) de
 * completá-los em /profile. Usuários com e-mail ainda não verificado também
 * são elegíveis (não são mais excluídos) e recebem um item extra na lista
 * pedindo pra confirmar o e-mail.
 *
 * Auth: header `x-cron-token` deve bater com process.env.CRON_TOKEN (se
 * setado). Configure esse header na chamada HTTP do cron-job.org.
 */
export async function GET(request: NextRequest) {
  const startedAt = Date.now()

  const token = process.env.CRON_TOKEN
  if (token) {
    const header = request.headers.get('x-cron-token') || ''
    if (header !== token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const usersCollection = db.collection<User>('users')
  const now = new Date()
  const cooldownCutoff = new Date(now.getTime() - REENVIO_MIN_DIAS * DAY)

  const candidatos = await usersCollection
    .find(
      {
        banned: { $ne: true },
        $or: [
          { profileReminderLastSentAt: { $exists: false } },
          { profileReminderLastSentAt: { $lte: cooldownCutoff } },
        ],
      },
      {
        // Precisa trazer TODO campo que getMissingProfileFields lê: um campo
        // fora da projeção chega como ausente e o usuário é cobrado por um
        // dado que já preencheu.
        projection: {
          email: 1,
          name: 1,
          phone: 1,
          state: 1,
          profession: 1,
          specialty: 1,
          crm: 1,
          residencySpecialty: 1,
          residencyHospital: 1,
          residencyYear: 1,
          afyaUnit: 1,
          periodoBase: 1,
          cpf: 1,
          dateOfBirth: 1,
          emailVerified: 1,
        },
      }
    )
    .limit(MAX_POR_EXECUCAO)
    .toArray()

  let enviados = 0
  let pulados = 0
  let interrompidoPorTempo = false

  for (const user of candidatos) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      interrompidoPorTempo = true
      break
    }

    if (!user.email) {
      pulados++
      continue
    }

    const missing = getMissingProfileFields(user)
    if (!user.emailVerified) {
      missing.push({ key: 'emailVerified', label: 'Confirmar seu e-mail (verifique sua caixa de entrada ou o spam)' })
    }
    if (missing.length === 0) {
      pulados++
      continue
    }

    try {
      await sendProfileReminderEmail({
        email: user.email,
        name: user.name || '',
        missing: missing.map((m) => m.label),
      })
      await usersCollection.updateOne(
        { _id: user._id as any },
        { $set: { profileReminderLastSentAt: now } }
      )
      enviados++
    } catch (error) {
      console.error('[profile-reminder] falha ao enviar para', user.email, error)
      pulados++
    }
  }

  return NextResponse.json({
    ok: true,
    candidatos: candidatos.length,
    enviados,
    pulados,
    interrompidoPorTempo,
  })
}
