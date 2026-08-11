/**
 * Local-only auth bypass for UI testing without login.
 *
 * Enable in `.env.local`:
 *   DEV_BYPASS_AUTH=true
 *
 * Hard requirements (all must be true):
 * - NODE_ENV !== 'production'
 * - DEV_BYPASS_AUTH === 'true'
 *
 * Never enable in production — this module no-ops there.
 */

import type { TokenPayload } from '@/lib/auth'
import {
  DEFAULT_SIDEBAR_ORDER,
  DEFAULT_SIDEBAR_SECTIONS,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'

/** Fixed valid ObjectId used by the mock session (does not need to exist in Mongo). */
export const DEV_MOCK_USER_ID = '000000000000000000000001'

export function isDevAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  const flag = process.env.DEV_BYPASS_AUTH
  return flag === 'true' || flag === '1'
}

export function isDevMockUserId(userId: string | undefined | null): boolean {
  return userId === DEV_MOCK_USER_ID
}

export function getDevMockSession(): TokenPayload {
  return {
    userId: DEV_MOCK_USER_ID,
    email: 'dev@localhost',
    name: 'Dev Local',
    role: 'admin',
    emailVerified: true,
    jti: 'dev-bypass-session',
  }
}

/** Full `/api/bootstrap` payload so AppShell mounts without Mongo/login. */
export function getDevMockBootstrap() {
  const sidebarSections: SidebarSectionSettings = { ...DEFAULT_SIDEBAR_SECTIONS }
  const sidebarSectionOrder: SidebarSectionOrder = [...DEFAULT_SIDEBAR_ORDER]
  const sidebarSectionIcons: SidebarSectionIcons = normalizeSidebarIcons()

  return {
    user: {
      _id: DEV_MOCK_USER_ID,
      email: 'dev@localhost',
      name: 'Dev Local',
      role: 'admin' as const,
      secondaryRole: undefined,
      emailVerified: true,
      accountType: 'premium' as const,
      isBanned: false,
    },
    // Perfil completo: o modal de completar perfil não incomoda o dev local.
    profile: {
      missingFields: [] as string[],
      hasCpf: true,
    },
    tierLimits: {
      tier: 'premium' as const,
      examsPerMonth: 999,
      questionsPerDay: 999,
      questionsPerMonth: 9999,
      customExamsLimit: 999,
      flashcardsPerMonth: 9999,
      maxGroupSize: 50,
      teamMembersLimit: 20,
      videoAccessLimit: 'unlimited' as const,
      aiGenerationLimit: 999,
      storageGB: 50,
      features: {
        proctoring: true,
        bulkImport: true,
        customBranding: true,
        advancedAnalytics: true,
        apiAccess: true,
        sso: false,
        prioritySupport: true,
        offlineAccess: true,
      },
    },
    tierUsage: {
      examsUsedThisMonth: 0,
      questionsUsedToday: 0,
      questionsUsedThisMonth: 0,
      customExamsCreated: 0,
      flashcardsUsedThisMonth: 0,
      aiGenerationsUsedThisMonth: 0,
      storageUsedGB: 0,
    },
    percentageUsed: {
      exams: 0,
      questions: 0,
      aiGenerations: 0,
      storage: 0,
    },
    notificationCount: 0,
    sidebarSections,
    sidebarSectionOrder,
    sidebarSectionIcons,
    /** Marker so the client can show a small “dev bypass” badge if desired */
    _devBypass: true as const,
  }
}
