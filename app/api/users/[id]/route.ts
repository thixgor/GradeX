import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { User, AccountType, TrialPlanType, PremiumPlanType, SubscriptionRecord } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'
import { sendAccountDeletedEmail } from '@/lib/mail'
import { secureApiEndpoint, canAdminModifyUser } from '@/lib/api-security'
import { getPaymentProvider } from '@/lib/payments'
import { normalizePeriodo, getCurrentSemesterRef } from '@/lib/user-periodo'
import { isPlusAccount, isQuestAccount, QUEST_TIER } from '@/lib/account-tier'
import { revokePlusClaims, restorePlusClaims } from '@/lib/plus-claims'

export const dynamic = 'force-dynamic'

/**
 * Cancela o preapproval do Mercado Pago e marca o registro na coleção subscriptions
 * como cancelled. Usado quando o admin revoga o acesso Plus+, bane ou deleta um usuário.
 * Fire-and-forget — não lança exceção se o MP falhar (registra intenção mesmo assim).
 */
async function cancelUserMpSubscription(userId: string): Promise<void> {
  const db = await getDb()
  const activeSub = await db.collection<SubscriptionRecord>('subscriptions').findOne({
    userId,
    status: { $in: ['authorized', 'pending', 'paused'] },
  })
  if (!activeSub) return

  try {
    const provider = getPaymentProvider()
    await provider.cancelPreapproval(activeSub.providerSubscriptionId)
  } catch (err: any) {
    console.error('[admin] cancelPreapproval no MP falhou (registrando intenção):', err?.message)
  }

  await db.collection<SubscriptionRecord>('subscriptions').updateOne(
    { _id: activeSub._id as any },
    {
      $set: {
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        canceledAt: new Date(),
        updatedAt: new Date(),
      },
    }
  )
}

/** Meses de duração por tipo de plano premium */
const PLAN_DURATION_MONTHS: Record<string, number | null> = {
  mensal: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
  vitalicio: null, // sem expiração
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const session = security.session!
    const canModify = await canAdminModifyUser(session.userId, id, 'delete')
    if (!canModify.allowed) {
      return NextResponse.json({ error: canModify.reason }, { status: 403 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    // 1. Cancela preapproval ativo no MP antes de deletar
    await cancelUserMpSubscription(id)

    // 2. Remove registros de assinatura órfãos
    await db.collection('subscriptions').deleteMany({ userId: id })

    // 3. Deleta submissões
    await db.collection('submissions').deleteMany({ userId: id })

    // 4. Notifica por email (best-effort)
    try {
      await sendAccountDeletedEmail(user.email, user.name)
    } catch {}

    // 5. Deleta o usuário
    await usersCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ success: true, message: 'Usuário deletado com sucesso' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 })
  }
}

// PATCH - Banir, desbanir ou atualizar tier do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: { requireAuth: true, allowedRoles: ['admin'] },
    })
    if (!security.success || security.errorResponse) return security.errorResponse

    const session = security.session!

    const body = await request.json()
    const {
      action,
      banReason,
      banDetails,
      accountType,
      trialPlanType,
      premiumPlanType,
      dailyPersonalExamsCreated,
      secondaryRole,
      periodo,
      role,
    } = body

    const VALID_ACTIONS = ['ban', 'unban', 'update_tier', 'update_quota', 'toggle_monitor', 'update_periodo', 'toggle_admin']
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

    if (action === 'ban') {
      const canModify = await canAdminModifyUser(session.userId, id, 'ban')
      if (!canModify.allowed) {
        return NextResponse.json({ error: canModify.reason }, { status: 403 })
      }
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    let updateData: Partial<User> = {}
    let successMessage = ''
    /** Resgates do Plus+ a suspender/devolver após gravar o novo cargo. */
    let plusClaimsAction: 'revoke' | 'restore' | null = null

    if (action === 'ban') {
      if (!banReason) {
        return NextResponse.json({ error: 'Motivo do banimento é obrigatório' }, { status: 400 })
      }
      // Cancela assinatura MP ao banir
      await cancelUserMpSubscription(id)
      updateData = {
        banned: true,
        banReason,
        banDetails: banDetails || '',
        bannedBy: session.userId,
        bannedAt: new Date(),
        mercadoPagoPreapprovalId: undefined,
      }
      successMessage = 'Usuário banido com sucesso'

    } else if (action === 'unban') {
      updateData = {
        banned: false,
        banReason: undefined,
        banDetails: undefined,
        bannedBy: undefined,
        bannedAt: undefined,
      }
      successMessage = 'Usuário desbanido com sucesso'

    } else if (action === 'update_tier') {
      const VALID_TYPES = ['gratuito', 'trial', 'quest', 'plus', 'premium', 'essential']
      if (!accountType || !VALID_TYPES.includes(accountType)) {
        return NextResponse.json({ error: 'Tipo de conta inválido' }, { status: 400 })
      }

      // Os materiais resgatados pelo Plus+ acompanham o cargo: caem quando o
      // admin rebaixa, voltam quando ele concede. Aplicado depois do update do
      // usuário, para não suspender nada se a gravação falhar.
      plusClaimsAction = isPlusAccount(accountType) ? 'restore' : 'revoke'

      const newQuota = getPersonalExamsQuota(accountType as AccountType)

      // Se o usuário tem assinatura recorrente ativa e está sendo rebaixado (ou mudando de plano),
      // cancelar o preapproval no MP para evitar cobranças futuras.
      const isLosingPremium = !isPlusAccount(accountType)
      const isChangingPremiumPlan =
        isPlusAccount(accountType) &&
        user.mercadoPagoPreapprovalId
      if (isLosingPremium || isChangingPremiumPlan) {
        await cancelUserMpSubscription(id)
      }

      if (accountType === 'trial') {
        let durationMs = 7 * 24 * 60 * 60 * 1000
        if (trialPlanType === 'teste') durationMs = 2 * 60 * 1000

        updateData = {
          accountType: 'trial',
          trialPlanType: (trialPlanType || '7dias') as TrialPlanType,
          trialExpiresAt: new Date(Date.now() + durationMs),
          trialActivatedAt: new Date(),
          premiumExpiresAt: undefined,
          premiumPlanType: undefined,
          mercadoPagoPreapprovalId: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date(),
        }
      } else if (isQuestAccount(accountType)) {
        /*
         * Quest usa os mesmos campos de prazo do Plus+ (`premiumPlanType` /
         * `premiumExpiresAt`) de propósito: é a data que o cron varre e a que
         * o `check-plan-expiration` lê. Um par de campos próprio significaria
         * um cargo que ninguém rebaixa quando vence.
         */
        const planType = (premiumPlanType || 'vitalicio') as PremiumPlanType
        const durationMonths = PLAN_DURATION_MONTHS[planType] ?? null

        let questExpiresAt: Date | undefined = undefined
        if (durationMonths !== null) {
          questExpiresAt = new Date()
          questExpiresAt.setMonth(questExpiresAt.getMonth() + durationMonths)
        }

        updateData = {
          accountType: QUEST_TIER,
          premiumPlanType: planType,
          premiumActivatedAt: new Date(),
          premiumExpiresAt: questExpiresAt,
          trialExpiresAt: undefined,
          trialPlanType: undefined,
          mercadoPagoPreapprovalId: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date(),
        }
      } else if (isPlusAccount(accountType)) {
        const planType = (premiumPlanType || 'vitalicio') as PremiumPlanType
        const durationMonths = PLAN_DURATION_MONTHS[planType] ?? null

        let premiumExpiresAt: Date | undefined = undefined
        if (durationMonths !== null) {
          premiumExpiresAt = new Date()
          premiumExpiresAt.setMonth(premiumExpiresAt.getMonth() + durationMonths)
        }

        updateData = {
          accountType: accountType as AccountType,
          premiumPlanType: planType,
          premiumActivatedAt: new Date(),
          premiumExpiresAt,
          trialExpiresAt: undefined,
          trialPlanType: undefined,
          mercadoPagoPreapprovalId: undefined, // admin grant não tem preapproval
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date(),
        }
      } else {
        // gratuito
        updateData = {
          accountType: 'gratuito',
          trialExpiresAt: undefined,
          trialPlanType: undefined,
          premiumExpiresAt: undefined,
          premiumPlanType: undefined,
          mercadoPagoPreapprovalId: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date(),
        }
      }

      successMessage = 'Plano do usuário atualizado com sucesso'

    } else if (action === 'update_quota') {
      if (typeof dailyPersonalExamsCreated !== 'number' || dailyPersonalExamsCreated < 0) {
        return NextResponse.json({ error: 'Valor de quota inválido' }, { status: 400 })
      }
      updateData = {
        dailyPersonalExamsRemaining: dailyPersonalExamsCreated,
        lastDailyReset: new Date(),
      }
      successMessage = 'Quotas do usuário atualizadas com sucesso'

    } else if (action === 'toggle_monitor') {
      updateData = { secondaryRole: secondaryRole || undefined }
      successMessage = secondaryRole === 'monitor'
        ? 'Usuário promovido a Monitor com sucesso'
        : 'Cargo de Monitor removido com sucesso'

    } else if (action === 'toggle_admin') {
      const makeAdmin = role === 'admin'

      // Impede que o admin remova o próprio acesso (evita auto-lockout)
      if (!makeAdmin && session.userId === id) {
        return NextResponse.json(
          { error: 'Você não pode remover seu próprio acesso de administrador' },
          { status: 403 }
        )
      }

      updateData = { role: makeAdmin ? 'admin' : 'user' }
      successMessage = makeAdmin
        ? 'Usuário promovido a administrador com sucesso. Ele precisa deslogar e logar novamente.'
        : 'Acesso de administrador removido com sucesso.'

    } else if (action === 'update_periodo') {
      // periodo nulo/0 limpa o período; valor válido (1-12) define e ancora no
      // semestre atual para que o avanço automático conte a partir de agora.
      const periodoBase = normalizePeriodo(periodo)
      updateData = {
        periodoBase: periodoBase ?? undefined,
        periodoBaseRef: periodoBase !== null ? getCurrentSemesterRef() : undefined,
      }
      successMessage = periodoBase !== null
        ? 'Período do usuário atualizado com sucesso'
        : 'Período do usuário removido com sucesso'
    }

    // Remover campos undefined do $set; campos undefined viram $unset
    const cleanSet = Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    )
    const unsetKeys = Object.keys(updateData).filter(k => (updateData as any)[k] === undefined)
    const cleanUnset = Object.fromEntries(unsetKeys.map(k => [k, 1 as const]))

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        ...(Object.keys(cleanSet).length > 0 ? { $set: cleanSet as any } : {}),
        ...(unsetKeys.length > 0 ? { $unset: cleanUnset } : {}),
      }
    )

    if (plusClaimsAction === 'revoke') {
      await revokePlusClaims(id, 'admin_tier_downgrade', db).catch(err =>
        console.error('[admin] revogar resgates Plus+ falhou:', err)
      )
    } else if (plusClaimsAction === 'restore') {
      await restorePlusClaims(id, 'admin_tier_grant', db).catch(err =>
        console.error('[admin] restaurar resgates Plus+ falhou:', err)
      )
    }

    return NextResponse.json({ success: true, message: successMessage })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}
