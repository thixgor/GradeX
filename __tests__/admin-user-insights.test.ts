import { describe, expect, it } from 'vitest'
import {
  buildAdminUserInsights,
  buildManualSubscription,
  buildPaidSubscription,
  describeAccountRole,
  formatDurationBreakdown,
  formatSubscriptionRemaining,
  matchesCycleFilter,
  matchesExpiryFilter,
  matchesSubscriptionFilter,
  nextExpiryValue,
  pickBestManualPurchase,
  resolvePlanLabel,
  type AdminUserRow,
  type ManualPurchaseRanking,
} from '@/lib/admin-user-insights'

const NOW = new Date('2026-06-01T12:00:00.000Z')
const DAY = 86_400_000

function daysFromNow(days: number) {
  return new Date(NOW.getTime() + days * DAY)
}

function makeRow(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    _id: 'u1',
    name: 'Usuário',
    email: 'user@example.com',
    role: 'user',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    paidSubscription: null,
    manualSubscription: null,
    spend: { total: 0, count: 0, materialTotal: 0, manualTotal: 0, lastPurchaseAt: null },
    ...overrides,
  } as AdminUserRow
}

describe('buildPaidSubscription', () => {
  it('devolve null para conta que nunca pagou nada', () => {
    expect(buildPaidSubscription({ accountType: 'gratuito' }, NOW)).toBeNull()
  })

  it('lê o ciclo contratado e o tempo restante', () => {
    const info = buildPaidSubscription(
      {
        accountType: 'plus',
        premiumPlanType: 'semestral',
        premiumActivatedAt: daysFromNow(-30),
        premiumExpiresAt: daysFromNow(150),
        premiumPrice: 120,
      },
      NOW,
    )

    expect(info).not.toBeNull()
    expect(info!.planKey).toBe('semestral')
    expect(info!.planLabel).toBe('Semestral')
    expect(info!.durationMonths).toBe(6)
    expect(info!.active).toBe(true)
    expect(info!.expired).toBe(false)
    expect(info!.lifetime).toBe(false)
    expect(info!.daysRemaining).toBe(150)
    // 30 dos 180 dias já correram.
    expect(info!.elapsedRatio).toBeCloseTo(30 / 180, 5)
  })

  it('trata cargo pago legado (premium/essential) como Plus+', () => {
    const info = buildPaidSubscription(
      { accountType: 'premium', premiumPlanType: 'anual', premiumExpiresAt: daysFromNow(10) },
      NOW,
    )
    expect(info!.planLabel).toBe('Anual')
    expect(info!.active).toBe(true)
  })

  it('sem data de expiração é vitalício e nunca vence', () => {
    const info = buildPaidSubscription({ accountType: 'plus', premiumPlanType: 'vitalicio' }, NOW)
    expect(info!.lifetime).toBe(true)
    expect(info!.active).toBe(true)
    expect(info!.daysRemaining).toBeNull()
    expect(formatSubscriptionRemaining(info!)).toBe('Vitalício — não expira')
  })

  it('mantém a assinatura vencida visível — é a fila do rebaixamento', () => {
    const info = buildPaidSubscription(
      { accountType: 'plus', premiumPlanType: 'mensal', premiumExpiresAt: daysFromNow(-3) },
      NOW,
    )
    expect(info!.expired).toBe(true)
    expect(info!.active).toBe(false)
    expect(formatSubscriptionRemaining(info!)).toBe('Expirou há 3 dias')
  })

  it('marca como "vence logo" quem está dentro da janela de 7 dias', () => {
    const info = buildPaidSubscription(
      { accountType: 'plus', premiumPlanType: 'mensal', premiumExpiresAt: daysFromNow(5) },
      NOW,
    )
    expect(info!.expiringSoon).toBe(true)
    expect(info!.active).toBe(true)
  })

  it('reconhece recorrência pelo preapproval do provedor', () => {
    const info = buildPaidSubscription(
      {
        accountType: 'plus',
        premiumPlanType: 'mensal',
        premiumExpiresAt: daysFromNow(20),
        mercadoPagoPreapprovalId: 'preapproval-1',
      },
      NOW,
    )
    expect(info!.autoRenew).toBe(true)
  })

  it('não mostra vitalício para conta já rebaixada que só teve um ciclo pago', () => {
    // Cargo já caiu para gratuito (cron rebaixou), mas o registro ainda
    // carrega `premiumActivatedAt`/`premiumPrice` de quando comprou um Mensal
    // — sem `premiumPlanType`/`premiumExpiresAt`, que o cron já limpou.
    const info = buildPaidSubscription(
      {
        accountType: 'gratuito',
        premiumActivatedAt: daysFromNow(-90),
        premiumPrice: 76.98,
      },
      NOW,
    )

    expect(info).not.toBeNull()
    expect(info!.lifetime).toBe(false)
    expect(info!.active).toBe(false)
    expect(info!.expired).toBe(true)
  })

  it('não chama de Plus+ quem comprou o Quest+', () => {
    // Os dois cargos gravam nos mesmos campos do usuário; só `accountType`
    // separa. O painel mostrava "Plus+ Semestral" com o preço do Quest+.
    const info = buildPaidSubscription(
      {
        accountType: 'quest',
        premiumPlanType: 'semestral',
        premiumActivatedAt: daysFromNow(-1),
        premiumExpiresAt: daysFromNow(183),
        premiumPrice: 80.81,
      },
      NOW,
    )

    expect(info!.product).toBe('quest')
    expect(info!.productLabel).toBe('Quest+')
    expect(info!.planLabel).toBe('Semestral')
    expect(info!.price).toBe(80.81)
    expect(info!.active).toBe(true)
  })

  it('Quest+ vitalício não é lido como assinatura vencida', () => {
    const info = buildPaidSubscription(
      { accountType: 'quest', premiumPlanType: 'vitalicio' },
      NOW,
    )
    expect(info!.product).toBe('quest')
    expect(info!.lifetime).toBe(true)
    expect(info!.active).toBe(true)
  })

  it('conta já rebaixada guarda o produto pelo cargo do plano comprado', () => {
    const info = buildPaidSubscription(
      {
        accountType: 'gratuito',
        premiumPlanType: 'quest_semestral',
        premiumActivatedAt: daysFromNow(-200),
        premiumExpiresAt: daysFromNow(-10),
      },
      NOW,
      null,
      { quest_semestral: 'quest' },
    )
    expect(info!.product).toBe('quest')
    expect(info!.expired).toBe(true)
  })

  it('sem catálogo para consultar, a assinatura vencida fica como Plus+', () => {
    const info = buildPaidSubscription(
      { accountType: 'gratuito', premiumPlanType: 'mensal', premiumExpiresAt: daysFromNow(-3) },
      NOW,
    )
    expect(info!.product).toBe('plus')
  })

  it('usa o rótulo do plano personalizado quando o admin criou um', () => {
    const info = buildPaidSubscription(
      { accountType: 'plus', premiumPlanType: 'black_friday', premiumExpiresAt: daysFromNow(20) },
      NOW,
      { black_friday: 'Black Friday 3 meses' },
    )
    expect(info!.planLabel).toBe('Black Friday 3 meses')
  })
})

describe('buildManualSubscription', () => {
  it('lê plano, término e tempo restante da compra', () => {
    const info = buildManualSubscription(
      {
        planKey: 'anual',
        planLabel: 'Anual',
        planDurationMonths: 12,
        accessType: 'temporary',
        purchasedAt: daysFromNow(-65),
        expiresAt: daysFromNow(300),
        price: 49.9,
      },
      NOW,
    )
    expect(info!.productLabel).toBe('Manual Clínico')
    expect(info!.planLabel).toBe('Anual')
    expect(info!.daysRemaining).toBe(300)
    expect(info!.autoRenew).toBe(false)
  })

  it('acesso vitalício não tem término', () => {
    const info = buildManualSubscription(
      { accessType: 'lifetime', purchasedAt: daysFromNow(-10), expiresAt: null, price: 97 },
      NOW,
    )
    expect(info!.lifetime).toBe(true)
    expect(info!.planKey).toBe('vitalicio')
    expect(info!.active).toBe(true)
  })
})

describe('pickBestManualPurchase', () => {
  const expired: ManualPurchaseRanking = { accessType: 'temporary', expiresAt: daysFromNow(-40), purchasedAt: daysFromNow(-220) }
  const active: ManualPurchaseRanking = { accessType: 'temporary', expiresAt: daysFromNow(60), purchasedAt: daysFromNow(-120) }
  const longer: ManualPurchaseRanking = { accessType: 'temporary', expiresAt: daysFromNow(200), purchasedAt: daysFromNow(-10) }
  const lifetime: ManualPurchaseRanking = { accessType: 'lifetime', expiresAt: null, purchasedAt: daysFromNow(-300) }

  it('ativa ganha de expirada', () => {
    expect(pickBestManualPurchase(expired, active, NOW)).toBe(active)
    expect(pickBestManualPurchase(active, expired, NOW)).toBe(active)
  })

  it('entre ativas vence a que termina mais tarde', () => {
    expect(pickBestManualPurchase(active, longer, NOW)).toBe(longer)
  })

  it('vitalícia ganha de qualquer temporária', () => {
    expect(pickBestManualPurchase(longer, lifetime, NOW)).toBe(lifetime)
  })

  it('sem nenhuma ativa, fica a que expirou mais recentemente', () => {
    const older: ManualPurchaseRanking = { accessType: 'temporary', expiresAt: daysFromNow(-200), purchasedAt: daysFromNow(-400) }
    expect(pickBestManualPurchase(older, expired, NOW)).toBe(expired)
  })
})

describe('formatDurationBreakdown', () => {
  it('quebra em meses e dias acima de 30 dias', () => {
    expect(formatDurationBreakdown(65 * DAY)).toBe('2 meses e 5 dias')
    expect(formatDurationBreakdown(60 * DAY)).toBe('2 meses')
    expect(formatDurationBreakdown(31 * DAY)).toBe('1 mês e 1 dia')
  })

  it('usa dias abaixo de um mês', () => {
    expect(formatDurationBreakdown(9 * DAY)).toBe('9 dias')
    expect(formatDurationBreakdown(1 * DAY)).toBe('1 dia')
  })

  it('cai para horas e minutos no fim do prazo', () => {
    expect(formatDurationBreakdown(5 * 3_600_000)).toBe('5 horas')
    expect(formatDurationBreakdown(20 * 60_000)).toBe('20 min')
    expect(formatDurationBreakdown(10_000)).toBe('menos de 1 min')
  })
})

describe('filtros da lista', () => {
  const plusMensal = makeRow({
    _id: 'plus-mensal',
    paidSubscription: buildPaidSubscription(
      { accountType: 'plus', premiumPlanType: 'mensal', premiumExpiresAt: daysFromNow(4) },
      NOW,
    ),
  })
  const manualAnual = makeRow({
    _id: 'manual-anual',
    manualSubscription: buildManualSubscription(
      { planKey: 'anual', accessType: 'temporary', purchasedAt: daysFromNow(-10), expiresAt: daysFromNow(200) },
      NOW,
    ),
  })
  const plusExpirado = makeRow({
    _id: 'plus-expirado',
    paidSubscription: buildPaidSubscription(
      { accountType: 'plus', premiumPlanType: 'semestral', premiumExpiresAt: daysFromNow(-2) },
      NOW,
    ),
  })
  const questSemestral = makeRow({
    _id: 'quest-semestral',
    paidSubscription: buildPaidSubscription(
      { accountType: 'quest', premiumPlanType: 'semestral', premiumExpiresAt: daysFromNow(120) },
      NOW,
    ),
  })
  const semAssinatura = makeRow({ _id: 'free' })

  it('separa assinantes Plus+ de assinantes do Manual Clínico', () => {
    expect(matchesSubscriptionFilter(plusMensal, 'plus_active')).toBe(true)
    expect(matchesSubscriptionFilter(manualAnual, 'plus_active')).toBe(false)
    expect(matchesSubscriptionFilter(manualAnual, 'manual_active')).toBe(true)
    expect(matchesSubscriptionFilter(plusMensal, 'manual_active')).toBe(false)
  })

  it('o recorte Plus+ não devolve quem tem só o Quest+', () => {
    expect(matchesSubscriptionFilter(questSemestral, 'plus_active')).toBe(false)
    expect(matchesSubscriptionFilter(questSemestral, 'plus')).toBe(false)
    expect(matchesSubscriptionFilter(questSemestral, 'quest_active')).toBe(true)
    expect(matchesSubscriptionFilter(plusMensal, 'quest_active')).toBe(false)
    // Quest+ é assinatura: entra em "com assinatura" e sai de "sem nenhuma".
    expect(matchesSubscriptionFilter(questSemestral, 'any')).toBe(true)
    expect(matchesSubscriptionFilter(questSemestral, 'none')).toBe(false)
  })

  it('expirado não conta como ativo, mas continua no histórico', () => {
    expect(matchesSubscriptionFilter(plusExpirado, 'plus_active')).toBe(false)
    expect(matchesSubscriptionFilter(plusExpirado, 'plus_expired')).toBe(true)
    expect(matchesSubscriptionFilter(plusExpirado, 'plus')).toBe(true)
    expect(matchesSubscriptionFilter(plusExpirado, 'none')).toBe(true)
    expect(matchesSubscriptionFilter(semAssinatura, 'any')).toBe(false)
  })

  it('filtra por ciclo contratado', () => {
    expect(matchesCycleFilter(plusMensal, 'mensal')).toBe(true)
    expect(matchesCycleFilter(plusMensal, 'anual')).toBe(false)
    expect(matchesCycleFilter(manualAnual, 'anual')).toBe(true)
    expect(matchesCycleFilter(manualAnual, 'all')).toBe(true)
  })

  it('filtra por proximidade do vencimento', () => {
    expect(matchesExpiryFilter(plusMensal, 'expiring7')).toBe(true)
    expect(matchesExpiryFilter(manualAnual, 'expiring30')).toBe(false)
    expect(matchesExpiryFilter(plusExpirado, 'expired')).toBe(true)
    expect(matchesExpiryFilter(plusMensal, 'expired')).toBe(false)
  })

  it('ordena por vencimento mais próximo', () => {
    expect(nextExpiryValue(plusMensal)).toBeLessThan(nextExpiryValue(manualAnual))
    expect(nextExpiryValue(semAssinatura)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('buildAdminUserInsights', () => {
  const users: AdminUserRow[] = [
    makeRow({
      _id: 'a',
      paidSubscription: buildPaidSubscription(
        {
          accountType: 'plus',
          premiumPlanType: 'mensal',
          premiumExpiresAt: daysFromNow(3),
          premiumPrice: 30,
        },
        NOW,
      ),
      spend: { total: 30, count: 1, materialTotal: 30, manualTotal: 0, lastPurchaseAt: null },
    }),
    makeRow({
      _id: 'b',
      paidSubscription: buildPaidSubscription(
        {
          accountType: 'plus',
          premiumPlanType: 'semestral',
          premiumExpiresAt: daysFromNow(100),
          premiumPrice: 120,
        },
        NOW,
      ),
      manualSubscription: buildManualSubscription(
        { planKey: 'anual', accessType: 'temporary', purchasedAt: daysFromNow(-5), expiresAt: daysFromNow(360), price: 48 },
        NOW,
      ),
      spend: { total: 168, count: 2, materialTotal: 120, manualTotal: 48, lastPurchaseAt: null },
    }),
    makeRow({
      _id: 'c',
      paidSubscription: buildPaidSubscription(
        { accountType: 'plus', premiumPlanType: 'mensal', premiumExpiresAt: daysFromNow(-1) },
        NOW,
      ),
    }),
    makeRow({
      _id: 'q',
      paidSubscription: buildPaidSubscription(
        {
          accountType: 'quest',
          premiumPlanType: 'semestral',
          premiumExpiresAt: daysFromNow(150),
          premiumPrice: 80.81,
        },
        NOW,
      ),
    }),
    makeRow({ _id: 'admin', role: 'admin' }),
    makeRow({ _id: 'free' }),
  ]

  const insights = buildAdminUserInsights(users, NOW)

  it('conta assinantes ativos por produto sem contar os expirados', () => {
    expect(insights.plus.active).toBe(2)
    expect(insights.plus.expired).toBe(1)
    expect(insights.manual.active).toBe(1)
  })

  it('Quest+ tem bucket próprio e não infla o de Plus+', () => {
    expect(insights.quest.active).toBe(1)
    expect(insights.quest.cycles).toEqual([{ key: 'semestral', label: 'Semestral', count: 1 }])
    // O assinante Quest+ continua contando como assinante da base.
    expect(insights.payingUsers).toBe(3)
  })

  it('agrupa os ativos por ciclo contratado', () => {
    expect(insights.plus.cycles).toEqual([
      { key: 'mensal', label: 'Mensal', count: 1 },
      { key: 'semestral', label: 'Semestral', count: 1 },
    ])
  })

  it('sinaliza quem vence dentro das janelas de 7 e 30 dias', () => {
    expect(insights.plus.expiringSoon).toBe(1)
    expect(insights.plus.expiringMonth).toBe(1)
  })

  it('conta assinantes únicos e quem tem os dois produtos', () => {
    expect(insights.payingUsers).toBe(3)
    expect(insights.bothProducts).toBe(1)
  })

  it('soma a receita e calcula o ticket médio sobre quem comprou', () => {
    expect(insights.revenueTotal).toBe(198)
    expect(insights.buyers).toBe(2)
    expect(insights.averageTicket).toBe(99)
  })

  it('estima o MRR somando os três produtos', () => {
    // 30/1 (mensal) + 120/6 (semestral) + 48/12 (anual do Manual)
    // + 80,81/6 (semestral do Quest+) = 54 + 13,468…
    expect(insights.estimatedMrr).toBeCloseTo(54 + 80.81 / 6, 5)
  })

  it('mede conversão sobre as contas de usuário, fora os admins', () => {
    // 3 assinantes ativos entre 5 contas não-admin.
    expect(insights.conversionRate).toBeCloseTo(60, 5)
  })

  it('lista os maiores gastos primeiro', () => {
    expect(insights.topSpenders.map(s => s.id)).toEqual(['b', 'a'])
  })
})

describe('resolvePlanLabel', () => {
  it('traduz os ciclos conhecidos', () => {
    expect(resolvePlanLabel('mensal')).toBe('Mensal')
    expect(resolvePlanLabel('semestral')).toBe('Semestral')
    expect(resolvePlanLabel('anual')).toBe('Anual')
    expect(resolvePlanLabel('vitalicio')).toBe('Vitalício')
  })

  it('capitaliza chaves desconhecidas em vez de escondê-las', () => {
    expect(resolvePlanLabel('promo_natal')).toBe('Promo_natal')
  })
})

describe('describeAccountRole', () => {
  it('nomeia o cargo pago que a conta tem de verdade', () => {
    expect(describeAccountRole({ accountType: 'quest' } as any)).toBe('Quest+')
    expect(describeAccountRole({ accountType: 'plus' } as any)).toBe('Plus+')
    // Legado ainda gravado como premium/essential continua sendo Plus+.
    expect(describeAccountRole({ accountType: 'premium' } as any)).toBe('Plus+')
    expect(describeAccountRole({ accountType: 'trial' } as any)).toBe('Trial')
    expect(describeAccountRole({ accountType: 'gratuito' } as any)).toBe('Gratuito')
  })

  it('cargo criado em /admin/cargos aparece pelo id, não como Gratuito', () => {
    expect(describeAccountRole({ accountType: 'residencia' } as any)).toBe('Residencia')
  })

  it('admin e banido vêm antes do cargo', () => {
    expect(describeAccountRole({ role: 'admin', accountType: 'quest' } as any)).toBe('Administrador')
    expect(describeAccountRole({ banned: true, accountType: 'plus' } as any)).toBe('Banido')
  })
})
