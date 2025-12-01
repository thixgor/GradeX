import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User, AccountType, TrialPlanType, PremiumPlanType } from '@/lib/types'
import { getTierLimits, getPersonalExamsQuota } from '@/lib/tier-limits'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const submissionsCollection = db.collection('submissions')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permite deletar o próprio usuário
    if (id === session.userId) {
      return NextResponse.json(
        { error: 'Você não pode deletar sua própria conta' },
        { status: 400 }
      )
    }

    // Deletar todas as submissões do usuário
    await submissionsCollection.deleteMany({ userId: id })

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
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { action, banReason, banDetails, accountType, trialPlanType, premiumPlanType, dailyPersonalExamsCreated } = body

    if (!action || !['ban', 'unban', 'update_tier', 'update_quota'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "ban", "unban", "update_tier" ou "update_quota"' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Não permite banir a si mesmo
    if (action === 'ban' && id === session.userId) {
      return NextResponse.json(
        { error: 'Você não pode banir sua própria conta' },
        { status: 400 }
      )
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
