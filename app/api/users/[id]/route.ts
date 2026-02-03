import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { User, AccountType, TrialPlanType, PremiumPlanType } from '@/lib/types'
import { getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'
import { sendAccountDeletedEmail } from '@/lib/mail'
import { secureApiEndpoint, canAdminModifyUser } from '@/lib/api-security'

export const dynamic = 'force-dynamic'

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar rate limit e autorizacao
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: {
        requireAuth: true,
        allowedRoles: ['admin']
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!

    // Verificar se pode modificar o usuario alvo (protege admin de deletar admin)
    const canModify = await canAdminModifyUser(session.userId, id, 'delete')
    if (!canModify.allowed) {
      return NextResponse.json(
        { error: canModify.reason },
        { status: 403 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const submissionsCollection = db.collection('submissions')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Deletar todas as submissões do usuário
    await submissionsCollection.deleteMany({ userId: id })

    // Enviar email notificando a exclusão
    try {
      await sendAccountDeletedEmail(user.email, user.name)
    } catch (error) {
      console.error('Erro ao enviar email de exclusão:', error)
      // Não impede a deleção se o email falhar
    }

    // Deletar o usuário
    await usersCollection.deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar usuário' },
      { status: 500 }
    )
  }
}

// PATCH - Banir, desbanir ou atualizar tier do usuário
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar rate limit e autorizacao
    const security = await secureApiEndpoint(request, {
      rateLimit: 'ADMIN',
      auth: {
        requireAuth: true,
        allowedRoles: ['admin']
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!

    const body = await request.json()
    const { action, banReason, banDetails, accountType, trialPlanType, premiumPlanType, dailyPersonalExamsCreated, secondaryRole } = body

    if (!action || !['ban', 'unban', 'update_tier', 'update_quota', 'toggle_monitor'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "ban", "unban", "update_tier", "update_quota" ou "toggle_monitor"' },
        { status: 400 }
      )
    }

    // Verificar se pode modificar o usuario alvo para acoes de ban
    if (action === 'ban') {
      const canModify = await canAdminModifyUser(session.userId, id, 'ban')
      if (!canModify.allowed) {
        return NextResponse.json(
          { error: canModify.reason },
          { status: 403 }
        )
      }
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    let updateData: Partial<User> = {}
    let successMessage: string = ''

    if (action === 'ban') {
      if (!banReason) {
        return NextResponse.json(
          { error: 'Motivo do banimento é obrigatório' },
          { status: 400 }
        )
      }

      updateData = {
        banned: true,
        banReason,
        banDetails: banDetails || '',
        bannedBy: session.userId,
        bannedAt: new Date()
      }
      successMessage = 'Usuário banido com sucesso'
    } else if (action === 'unban') {
      updateData = {
        banned: false,
        banReason: undefined,
        banDetails: undefined,
        bannedBy: undefined,
        bannedAt: undefined
      }
      successMessage = 'Usuário desbanido com sucesso'
    } else if (action === 'update_tier') {
      // update_tier
      if (!accountType || !['gratuito', 'trial', 'premium'].includes(accountType)) {
        return NextResponse.json(
          { error: 'Tipo de conta inválido' },
          { status: 400 }
        )
      }

      // Definir quotas baseado no tipo de conta
      const newQuota = getPersonalExamsQuota(accountType as AccountType)

      if (accountType === 'trial') {
        // Calcular duração baseado no subtipo
        let durationMs = 7 * 24 * 60 * 60 * 1000 // 7 dias padrão
        if (trialPlanType === 'teste') {
          durationMs = 2 * 60 * 1000 // 2 minutos
        }

        const expirationDate = new Date(Date.now() + durationMs)

        updateData = {
          accountType: accountType as AccountType,
          trialPlanType: (trialPlanType || '7dias') as TrialPlanType,
          trialExpiresAt: expirationDate,
          trialActivatedAt: new Date(),
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date()
        }
      } else if (accountType === 'premium') {
        updateData = {
          accountType: accountType as AccountType,
          premiumPlanType: (premiumPlanType || 'mensal') as PremiumPlanType,
          premiumActivatedAt: new Date(),
          // Para premium, se não tiver expiresAt, considerar como vitalício
          // A verificação de expiração é feita na API de subscription-status
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date()
        }
      } else {
        // gratuito
        updateData = {
          accountType: accountType as AccountType,
          trialExpiresAt: undefined,
          trialPlanType: undefined,
          premiumExpiresAt: undefined,
          premiumPlanType: undefined,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date()
        }
      }

      successMessage = 'Plano do usuário atualizado com sucesso'
    } else if (action === 'update_quota') {
      // update_quota
      // dailyPersonalExamsCreated aqui representa o número de provas RESTANTES que o admin quer dar
      if (typeof dailyPersonalExamsCreated !== 'number' || dailyPersonalExamsCreated < 0) {
        return NextResponse.json(
          { error: 'Valor de quota inválido' },
          { status: 400 }
        )
      }

      updateData = {
        dailyPersonalExamsRemaining: dailyPersonalExamsCreated,
        lastDailyReset: new Date()
      }

      successMessage = 'Quotas do usuário atualizadas com sucesso'
    } else if (action === 'toggle_monitor') {
      // toggle_monitor
      updateData = {
        secondaryRole: secondaryRole || undefined
      }

      successMessage = secondaryRole === 'monitor'
        ? 'Usuário promovido a Monitor com sucesso'
        : 'Cargo de Monitor removido com sucesso'
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    return NextResponse.json({
      success: true,
      message: successMessage
    })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}
