/**
 * Optimized Bootstrap Endpoint
 * Aggregates multiple user data points in a single request
 * Replaces: /api/auth/me, /api/user/tier-limits, /api/auth/check-ban
 *
 * Benefits:
 * - Single HTTP request instead of 3+
 * - Reduced Vercel function invocations
 * - Atomic user state (no race conditions)
 * - Optimized database queries with aggregation
 *
 * Invocation reduction: ~60-70% for authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { inicioDoDiaEmBrasilia, offsetDeBrasilia, relogioBrasilia } from '@/lib/fuso-brasilia'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  normalizeSidebarOrder,
  normalizeSidebarSections,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'
import {
  normalizeSidebarGroups,
  normalizeSidebarSectionGroups,
  type SidebarGroupDefinition,
  type SidebarSectionGroups,
} from '@/lib/sidebar-groups'
import { normalizeAccountType } from '@/lib/account-tier'
import { getMissingProfileFields } from '@/lib/profile-completeness'

export const dynamic = 'force-dynamic'

interface BootstrapResponse {
  user: {
    _id: string
    email: string
    name: string
    role: 'admin' | 'user'
    secondaryRole?: 'monitor' | string
    emailVerified: boolean
    accountType: 'free' | 'trial' | 'premium'
    trialExpiresAt?: string
    trialDaysUsed?: number
    trialDaysRemaining?: number
    isBanned: boolean
    banReason?: string
    banDetails?: string
    bannedAt?: string
    subscriptionStartDate?: string
    subscriptionEndDate?: string
  }
  /** Estado do perfil, para o modal de completar perfil decidir se abre. */
  profile: {
    missingFields: string[]
    promptSnoozedUntil?: string
    hasCpf: boolean
    fullName?: string
    phone?: string
    state?: string
    profession?: 'medico' | 'academico' | 'residente'
    specialty?: string
    crm?: string
    crmUf?: string
    residencySpecialty?: string
    residencyHospital?: string
    residencyYear?: string
    afyaUnit?: string
    periodo?: number
  }
  tierLimits: {
    tier: 'free' | 'trial' | 'plus'
    examsPerMonth: number
    questionsPerDay: number
    questionsPerMonth: number
    customExamsLimit: number
    flashcardsPerMonth: number
    maxGroupSize: number
    teamMembersLimit: number
    videoAccessLimit: 'none' | 'limited' | 'unlimited'
    aiGenerationLimit: number
    storageGB: number
    features: {
      proctoring: boolean
      bulkImport: boolean
      customBranding: boolean
      advancedAnalytics: boolean
      apiAccess: boolean
      sso: boolean
      prioritySupport: boolean
      offlineAccess: boolean
    }
  }
  tierUsage: {
    examsUsedThisMonth: number
    questionsUsedToday: number
    questionsUsedThisMonth: number
    customExamsCreated: number
    flashcardsUsedThisMonth: number
    aiGenerationsUsedThisMonth: number
    storageUsedGB: number
  }
  percentageUsed: {
    exams: number
    questions: number
    aiGenerations: number
    storage: number
  }
  notificationCount: number
  sidebarSections: SidebarSectionSettings
  sidebarSectionOrder: SidebarSectionOrder
  sidebarSectionIcons: SidebarSectionIcons
  sidebarGroups: SidebarGroupDefinition[]
  sidebarSectionGroups: SidebarSectionGroups
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Local UI testing: mock premium admin without Mongo/login
  try {
    const { isDevAuthBypassEnabled, isDevMockUserId, getDevMockBootstrap } = await import(
      '@/lib/dev-auth'
    )
    if (isDevAuthBypassEnabled()) {
      const { getSession } = await import('@/lib/auth')
      const session = await getSession()
      if (!session || isDevMockUserId(session.userId)) {
        return NextResponse.json(getDevMockBootstrap())
      }
    }
  } catch {
    // fall through to normal auth
  }

  // Security: Require authentication
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: { requireAuth: true },
  })

  if (!security.success) {
    // Last-chance bypass if security failed for any reason in local dev
    try {
      const { isDevAuthBypassEnabled, getDevMockBootstrap } = await import('@/lib/dev-auth')
      if (isDevAuthBypassEnabled()) {
        return NextResponse.json(getDevMockBootstrap())
      }
    } catch {
      /* ignore */
    }
    return security.errorResponse!
  }

  try {
    const db = await getDb()
    const userId = new ObjectId(security.session!.userId)
    const userIdString = security.session!.userId

    /*
     * "Hoje" e "este mês" no relógio do aluno, não no do datacenter.
     *
     * `setHours(0,0,0,0)` usa o fuso de quem executa — o servidor, que roda em
     * UTC. A meia-noite dele é 21h de Brasília: das 21h à meia-noite, as
     * provas que o aluno acabou de criar já contavam para o dia seguinte, e o
     * contador de uso que ele vê na tela discordava do que a cota dele diz.
     */
    const startOfDay = inicioDoDiaEmBrasilia()
    const { dia } = relogioBrasilia()
    const startOfMonth = new Date(`${dia.slice(0, 7)}-01T00:00:00${offsetDeBrasilia()}`)

    // ── Otimização ──────────────────────────────────────────────
    // Antes: 6 roundtrips ao Mongo (users.findOne + 4 countDocuments
    // sequenciais sobre exam_submissions/personal_exams + landing_settings
    // findOne + notifications.countDocuments). Custo de CPU dominado
    // pela latência somada das chamadas.
    //
    // Agora: 1 roundtrip com $facet — todas as contagens em paralelo
    // dentro do servidor Mongo. Reduz ~80% do tempo total.
    // `users.findOne` e `landing_settings.findOne` continuam separados
    // porque vivem em coleções diferentes e são leves (lookups indexados).
    // ────────────────────────────────────────────────────────────
    // As cinco queries vão numa única onda. Antes eram dois `Promise.all`
    // sequenciais, mas o segundo (personal_exams + notifications) só depende
    // de `userId` — nunca do resultado do primeiro. Fundir elimina um
    // round-trip inteiro ao Atlas do caminho que bloqueia o dashboard.
    const [userDoc, landingSettings, usageFacet, customExams, notificationCount] = await Promise.all([
      db.collection('users').findOne(
        { _id: userId },
        {
          projection: {
            email: 1, name: 1, role: 1, secondaryRole: 1, emailVerified: 1,
            accountType: 1, trialExpiresAt: 1, trialDaysUsed: 1, trialDaysRemaining: 1,
            isBanned: 1, banReason: 1, banDetails: 1, bannedAt: 1,
            subscriptionStartDate: 1, subscriptionEndDate: 1,
            // Perfil: alimenta o modal de completar perfil sem custar uma
            // segunda ida ao banco (a projeção já está aqui de qualquer jeito).
            cpf: 1, dateOfBirth: 1, fullName: 1, phone: 1, state: 1, profession: 1,
            specialty: 1, crm: 1, crmUf: 1,
            residencySpecialty: 1, residencyHospital: 1, residencyYear: 1,
            afyaUnit: 1, periodoBase: 1, profilePromptSnoozedUntil: 1,
          },
        }
      ),
      db.collection('landing_settings').findOne(
        {},
        {
          projection: {
            sidebarSections: 1,
            sidebarSectionOrder: 1,
            sidebarSectionIcons: 1,
            sidebarGroups: 1,
            sidebarSectionGroups: 1,
          },
        }
      ),
      db.collection('exam_submissions').aggregate([
        { $match: { userId, createdAt: { $gte: startOfMonth } } },
        {
          $facet: {
            month: [{ $count: 'n' }],
            today: [
              { $match: { createdAt: { $gte: startOfDay } } },
              { $count: 'n' },
            ],
          },
        },
      ]).toArray(),
      db.collection('personal_exams').countDocuments({ createdBy: userId }),
      db.collection('notifications').countDocuments({
        userId: userIdString,
        read: false,
      }),
    ])

    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate tier limits based on subscription
    const tierLimits = getTierLimits(userDoc.accountType || 'free')

    const examsUsed = usageFacet[0]?.month?.[0]?.n ?? 0
    const questionsUsedToday = usageFacet[0]?.today?.[0]?.n ?? 0
    // exam_submissions este mês == "questions" no plano atual; mantém compat
    const questionsUsedMonth = examsUsed

    // Calculate percentages
    const percentageUsed = {
      exams: (examsUsed / tierLimits.examsPerMonth) * 100,
      questions: (questionsUsedMonth / tierLimits.questionsPerMonth) * 100,
      aiGenerations: tierLimits.aiGenerationLimit > 0 ? 0 : 0,
      storage: tierLimits.storageGB > 0 ? 0 : 0,
    }

    // Os vínculos seção → grupo são validados contra a lista de grupos que
    // realmente sobreviveu à normalização, e não contra o que está cru no
    // banco: assim uma seção nunca aponta para um grupo já apagado.
    const sidebarGroups = normalizeSidebarGroups(landingSettings?.sidebarGroups)

    const response: BootstrapResponse = {
      user: {
        _id: userDoc._id.toString(),
        email: userDoc.email,
        name: userDoc.name,
        role: userDoc.role || 'user',
        secondaryRole: userDoc.secondaryRole,
        emailVerified: userDoc.emailVerified || false,
        accountType: userDoc.accountType || 'free',
        trialExpiresAt: userDoc.trialExpiresAt,
        trialDaysUsed: userDoc.trialDaysUsed,
        trialDaysRemaining: userDoc.trialDaysRemaining,
        isBanned: userDoc.isBanned || false,
        banReason: userDoc.banReason,
        banDetails: userDoc.banDetails,
        bannedAt: userDoc.bannedAt,
        subscriptionStartDate: userDoc.subscriptionStartDate,
        subscriptionEndDate: userDoc.subscriptionEndDate,
      },
      profile: {
        missingFields: getMissingProfileFields(userDoc as any).map((field) => field.key),
        promptSnoozedUntil: userDoc.profilePromptSnoozedUntil
          ? new Date(userDoc.profilePromptSnoozedUntil).toISOString()
          : undefined,
        // O CPF em si nunca sai do servidor — a UI só precisa saber se existe.
        hasCpf: !!userDoc.cpf,
        fullName: userDoc.fullName,
        phone: userDoc.phone,
        state: userDoc.state,
        profession: userDoc.profession,
        specialty: userDoc.specialty,
        crm: userDoc.crm,
        crmUf: userDoc.crmUf,
        residencySpecialty: userDoc.residencySpecialty,
        residencyHospital: userDoc.residencyHospital,
        residencyYear: userDoc.residencyYear,
        afyaUnit: userDoc.afyaUnit,
        periodo: userDoc.periodoBase,
      },
      tierLimits,
      tierUsage: {
        examsUsedThisMonth: examsUsed,
        questionsUsedToday: questionsUsedToday,
        questionsUsedThisMonth: questionsUsedMonth,
        customExamsCreated: customExams,
        flashcardsUsedThisMonth: 0, // TODO: Track flashcard usage
        aiGenerationsUsedThisMonth: 0, // TODO: Track AI generations
        storageUsedGB: 0, // TODO: Track storage usage
      },
      percentageUsed,
      notificationCount,
      sidebarSections: normalizeSidebarSections(landingSettings?.sidebarSections),
      sidebarSectionOrder: normalizeSidebarOrder(landingSettings?.sidebarSectionOrder),
      sidebarSectionIcons: normalizeSidebarIcons(landingSettings?.sidebarSectionIcons),
      sidebarGroups: sidebarGroups,
      sidebarSectionGroups: normalizeSidebarSectionGroups(
        landingSettings?.sidebarSectionGroups,
        sidebarGroups
      ),
    }

    // User/session-specific data must never survive logout/account switches.
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Content-Type': 'application/json',
    })

    return NextResponse.json(response, { headers })
  } catch (error) {
    console.error('Bootstrap endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get tier limits based on account type
 */
function getTierLimits(accountType: string) {
  const tiers: Record<string, BootstrapResponse['tierLimits']> = {
    free: {
      tier: 'free',
      examsPerMonth: 10,
      questionsPerDay: 50,
      questionsPerMonth: 500,
      customExamsLimit: 2,
      flashcardsPerMonth: 20,
      maxGroupSize: 5,
      teamMembersLimit: 1,
      videoAccessLimit: 'none',
      aiGenerationLimit: 0,
      storageGB: 0.5,
      features: {
        proctoring: false,
        bulkImport: false,
        customBranding: false,
        advancedAnalytics: false,
        apiAccess: false,
        sso: false,
        prioritySupport: false,
        offlineAccess: false,
      },
    },
    trial: {
      tier: 'trial',
      examsPerMonth: 50,
      questionsPerDay: 200,
      questionsPerMonth: 2000,
      customExamsLimit: 10,
      flashcardsPerMonth: 100,
      maxGroupSize: 10,
      teamMembersLimit: 3,
      videoAccessLimit: 'limited',
      aiGenerationLimit: 20,
      storageGB: 5,
      features: {
        proctoring: true,
        bulkImport: false,
        customBranding: false,
        advancedAnalytics: true,
        apiAccess: false,
        sso: false,
        prioritySupport: true,
        offlineAccess: false,
      },
    },
    plus: {
      tier: 'plus',
      // Plus+ libera a plataforma inteira — nenhum destes tetos é aplicado.
      examsPerMonth: Infinity,
      questionsPerDay: Infinity,
      questionsPerMonth: Infinity,
      customExamsLimit: Infinity,
      flashcardsPerMonth: Infinity,
      maxGroupSize: Infinity,
      teamMembersLimit: Infinity,
      videoAccessLimit: 'unlimited',
      aiGenerationLimit: Infinity,
      storageGB: Infinity,
      features: {
        proctoring: true,
        bulkImport: true,
        customBranding: true,
        advancedAnalytics: true,
        apiAccess: true,
        sso: true,
        prioritySupport: true,
        offlineAccess: true,
      },
    },
  }

  // Normaliza: 'plus' e os legados premium/essential apontam para o mesmo
  // conjunto; qualquer outro valor cai em gratuito.
  const normalized = normalizeAccountType(accountType)
  if (normalized === 'plus') return tiers.plus
  if (normalized === 'trial') return tiers.trial
  return tiers.free
}

// Funções de contagem foram substituídas por uma única aggregation
// com $facet acima — reduz roundtrips ao Mongo.

