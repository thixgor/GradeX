import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { AdminSettings, PlanConfig, User } from '@/lib/types'
import { isPlusAccount, isActivePlusUser } from '@/lib/account-tier'

export const dynamic = 'force-dynamic'

type RevenueBucket = {
  label: string
  revenue: number
  subscribers: number
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function normalizePlanKey(value?: string | null) {
  return (value || '').toLowerCase().trim()
}

function getEstimatedPlanPrice(user: User, plans: PlanConfig[]) {
  if (typeof user.premiumPrice === 'number' && Number.isFinite(user.premiumPrice) && user.premiumPrice > 0) {
    return user.premiumPrice
  }

  const desiredType = normalizePlanKey(user.premiumPlanType)
  const desiredRole = normalizePlanKey(user.accountType)

  const plan =
    plans.find((item) => normalizePlanKey(item.tipo) === desiredType) ||
    plans.find((item) => normalizePlanKey(item.role) === desiredRole && typeof item.preco === 'number' && item.preco > 0)

  return typeof plan?.preco === 'number' && Number.isFinite(plan.preco) ? plan.preco : 0
}

// Mesma definição usada pelo painel Plus+ em /admin/settings — mantida em
// lib/account-tier.ts para os dois números nunca divergirem.
const isActivePaidUser = isActivePlusUser

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const adminSettingsCollection = db.collection<AdminSettings>('admin_settings')

    const [users, adminSettings] = await Promise.all([
      usersCollection.find({ role: 'user' }).toArray(),
      adminSettingsCollection.findOne({}),
    ])

    const plans = adminSettings?.planos || []
    const now = new Date()
    const monthStarts = Array.from({ length: 6 }, (_, index) => {
      const offset = 5 - index
      return new Date(now.getFullYear(), now.getMonth() - offset, 1)
    })

    const revenueSeries: RevenueBucket[] = monthStarts.map((monthStart) => {
      const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1)
      const paidUsersInMonth = users.filter((user) => {
        if (!isPlusAccount(user.accountType)) return false
        if (!user.premiumActivatedAt) return false
        const activatedAt = new Date(user.premiumActivatedAt)
        return activatedAt >= monthStart && activatedAt < nextMonth
      })

      return {
        label: formatMonthLabel(monthStart),
        revenue: paidUsersInMonth.reduce((sum, user) => sum + getEstimatedPlanPrice(user, plans), 0),
        subscribers: paidUsersInMonth.length,
      }
    })

    const activePaidUsers = users.filter((user) => isActivePaidUser(user, now))
    const totalEstimatedRevenue = activePaidUsers.reduce((sum, user) => sum + getEstimatedPlanPrice(user, plans), 0)

    // Cargo único: `premium`/`essential` sobrevivem apenas como valores legados
    // no banco, então contá-los separado devolvia zero. Todos somam em `plus`.
    const subscriberBreakdown = {
      plus: activePaidUsers.length,
      trial: users.filter((user) => user.accountType === 'trial' && (!user.trialExpiresAt || new Date(user.trialExpiresAt) > now)).length,
      free: users.filter((user) => !user.accountType || user.accountType === 'gratuito').length,
    }

    const currentMonth = revenueSeries[revenueSeries.length - 1]
    const previousMonth = revenueSeries[revenueSeries.length - 2]
    const revenueGrowthPercent = previousMonth?.revenue
      ? ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100
      : currentMonth.revenue > 0
        ? 100
        : 0

    const subscriberGrowthPercent = previousMonth?.subscribers
      ? ((currentMonth.subscribers - previousMonth.subscribers) / previousMonth.subscribers) * 100
      : currentMonth.subscribers > 0
        ? 100
        : 0

    return NextResponse.json({
      metrics: {
        totalEstimatedRevenue,
        activeSubscribers: activePaidUsers.length,
        revenueGrowthPercent,
        subscriberGrowthPercent,
        revenueSeries,
        subscriberSeries: revenueSeries.map((bucket) => ({
          label: bucket.label,
          value: bucket.subscribers,
        })),
        subscriberBreakdown,
        updatedAt: now.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Erro ao buscar métricas de receita:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
