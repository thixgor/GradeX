import { describe, expect, it } from 'vitest'
import {
  aplicarUpgradeAoPreco,
  LIMITES_DO_UPGRADE,
  normalizarConfigDoUpgrade,
  planoElegivelAoUpgrade,
  planoPadraoDoUpgrade,
  planosDoUpgrade,
  prazoDaOferta,
  precoDeUpgrade,
  questVigente,
  retornoAoQuest,
  UPGRADE_QUEST_PADRAO,
  type PlanoDoUpgrade,
} from '@/lib/upgrade-quest'

/**
 * O upgrade do Quest+ para o Plus+.
 *
 * Estes testes seguram as quatro regras do cabeçalho de `lib/upgrade-quest.ts`:
 * o desconto é calculado igual nos dois lados, descontos não somam, ninguém
 * perde o Quest+ que já pagou e o contador nunca promete o que o checkout
 * recusaria.
 */

const plano = (p: Partial<PlanoDoUpgrade>): PlanoDoUpgrade => ({ tipo: 'x', preco: 100, role: 'plus', ...p })
const config = (c: Partial<ReturnType<typeof normalizarConfigDoUpgrade>> = {}) =>
  normalizarConfigDoUpgrade({ ...UPGRADE_QUEST_PADRAO, ...c })

describe('normalizarConfigDoUpgrade', () => {
  it('sem nada gravado, devolve o padrão (30%, ligado, 48h)', () => {
    expect(normalizarConfigDoUpgrade(undefined)).toEqual(UPGRADE_QUEST_PADRAO)
    expect(UPGRADE_QUEST_PADRAO.descontoPercentual).toBe(30)
  })

  it('puxa desconto e horas para dentro dos limites', () => {
    const c = normalizarConfigDoUpgrade({ descontoPercentual: 95, urgencia: { horas: 1 } })
    expect(c.descontoPercentual).toBe(LIMITES_DO_UPGRADE.descontoMaximo)
    expect(c.urgencia.horas).toBe(LIMITES_DO_UPGRADE.horasMinimas)
    expect(normalizarConfigDoUpgrade({ descontoPercentual: -10 }).descontoPercentual).toBe(
      LIMITES_DO_UPGRADE.descontoMinimo,
    )
  })

  it('texto no lugar de número cai no padrão, não em NaN', () => {
    expect(normalizarConfigDoUpgrade({ descontoPercentual: 'muito' }).descontoPercentual).toBe(30)
  })

  it('limpa a lista de planos (duplicados, vazios, formato inválido)', () => {
    const c = normalizarConfigDoUpgrade({ planos: ['anual', 'anual', '', 'a b', '$where', 'semestral'] })
    expect(c.planos).toEqual(['anual', 'semestral'])
  })
})

describe('precoDeUpgrade', () => {
  it('aplica o percentual e arredonda no centavo', () => {
    expect(precoDeUpgrade(397, 30)).toBe(277.9)
    expect(precoDeUpgrade(99.9, 30)).toBe(69.93)
    expect(precoDeUpgrade(149.9, 25)).toBe(112.43)
  })

  it('nunca fica negativo', () => {
    expect(precoDeUpgrade(100, 150)).toBe(0)
    expect(precoDeUpgrade(-5, 30)).toBe(0)
  })
})

describe('aplicarUpgradeAoPreco — vence o maior desconto', () => {
  it('upgrade menor que o preço com cupom: vale o upgrade', () => {
    expect(aplicarUpgradeAoPreco(357.3, 277.9)).toEqual({ preco: 277.9, upgradeVenceu: true })
  })

  it('cupom/PROUNI melhor que o upgrade: vale o cupom', () => {
    expect(aplicarUpgradeAoPreco(198.5, 277.9)).toEqual({ preco: 198.5, upgradeVenceu: false })
  })

  it('empate fica com o cupom/benefício', () => {
    expect(aplicarUpgradeAoPreco(277.9, 277.9).upgradeVenceu).toBe(false)
  })

  it('sem upgrade, nada muda', () => {
    expect(aplicarUpgradeAoPreco(397, null)).toEqual({ preco: 397, upgradeVenceu: false })
    expect(aplicarUpgradeAoPreco(397, 0)).toEqual({ preco: 397, upgradeVenceu: false })
  })
})

describe('planos da oferta', () => {
  const catalogo = [
    plano({ tipo: 'quest-anual', role: 'quest', ordem: 0, durationMonths: 12 }),
    plano({ tipo: 'mensal', ordem: 1, durationMonths: 1 }),
    plano({ tipo: 'anual', ordem: 3, durationMonths: 12 }),
    plano({ tipo: 'semestral', ordem: 2, durationMonths: 6, destaque: true }),
    plano({ tipo: 'upgrade-only', ordem: 4, oculto: true, durationMonths: 12 }),
    plano({ tipo: 'gratis', ordem: 5, preco: 0 }),
  ]

  it('com a lista vazia, entram os Plus+ visíveis e pagos — nunca o Quest+', () => {
    expect(planosDoUpgrade(catalogo, config()).map((p) => p.tipo)).toEqual(['mensal', 'semestral', 'anual'])
  })

  it('plano sem cargo vale Plus+', () => {
    expect(planoElegivelAoUpgrade(plano({ role: undefined }), config())).toBe(true)
  })

  it('com lista do admin, só os listados — oculto inclusive', () => {
    const c = config({ planos: ['upgrade-only', 'quest-anual'] })
    expect(planosDoUpgrade(catalogo, c).map((p) => p.tipo)).toEqual(['upgrade-only'])
  })

  it('o padrão é o escolhido pelo admin, senão o anual', () => {
    const planos = planosDoUpgrade(catalogo, config())
    expect(planoPadraoDoUpgrade(planos, config())?.tipo).toBe('anual')
    expect(planoPadraoDoUpgrade(planos, config({ planoPadrao: 'mensal' }))?.tipo).toBe('mensal')
    expect(planoPadraoDoUpgrade(planos, config({ planoPadrao: 'sumiu' }))?.tipo).toBe('anual')
  })

  it('sem anual, cai no destaque', () => {
    const planos = [plano({ tipo: 'mensal', durationMonths: 1 }), plano({ tipo: 'semestral', durationMonths: 6, destaque: true })]
    expect(planoPadraoDoUpgrade(planos, config())?.tipo).toBe('semestral')
  })

  it('sem anual nem destaque, o mais longo (vitalício ganha de todos)', () => {
    const planos = [plano({ tipo: 'mensal', durationMonths: 1 }), plano({ tipo: 'vitalicio', durationMonths: 0 })]
    expect(planoPadraoDoUpgrade(planos, config())?.tipo).toBe('vitalicio')
  })
})

describe('prazoDaOferta', () => {
  const H = 60 * 60 * 1000
  const agora = Date.UTC(2026, 9, 25, 12, 0, 0)

  it('é sempre no futuro e no máximo uma janela à frente', () => {
    for (const id of ['a', 'b', '65f0c0ffee', 'x'.repeat(24)]) {
      const prazo = prazoDaOferta(id, agora, 48)
      expect(prazo).toBeGreaterThan(agora)
      expect(prazo - agora).toBeLessThanOrEqual(48 * H)
    }
  })

  it('é o mesmo prazo para a mesma pessoa durante a janela inteira', () => {
    const prazo = prazoDaOferta('conta-1', agora, 48)
    expect(prazoDaOferta('conta-1', agora + 3 * H, 48)).toBe(prazo)
    expect(prazoDaOferta('conta-1', prazo - 1, 48)).toBe(prazo)
  })

  it('quando a janela fecha, abre a seguinte — a oferta não some', () => {
    const prazo = prazoDaOferta('conta-1', agora, 48)
    expect(prazoDaOferta('conta-1', prazo, 48)).toBe(prazo + 48 * H)
  })

  it('pessoas diferentes não zeram no mesmo minuto', () => {
    const prazos = new Set(['a', 'b', 'c', 'd', 'e'].map((id) => prazoDaOferta(id, agora, 48)))
    expect(prazos.size).toBeGreaterThan(1)
  })
})

describe('a conta', () => {
  const agora = new Date('2026-10-25T12:00:00Z')
  const futuro = new Date('2027-03-01T00:00:00Z')
  const passado = new Date('2026-01-01T00:00:00Z')

  it('questVigente: Quest+ com data no futuro ou sem data', () => {
    expect(questVigente({ accountType: 'quest', premiumExpiresAt: futuro }, agora)).toBe(true)
    expect(questVigente({ accountType: 'quest+', premiumExpiresAt: null }, agora)).toBe(true)
    expect(questVigente({ accountType: 'quest', premiumExpiresAt: passado }, agora)).toBe(false)
    expect(questVigente({ accountType: 'plus', premiumExpiresAt: futuro }, agora)).toBe(false)
    expect(questVigente(null, agora)).toBe(false)
  })

  it('Plus+ que perde o acesso volta ao Quest+ que ainda vale', () => {
    const conta = {
      accountType: 'plus',
      questAntesDoUpgrade: { expiresAt: futuro, planType: 'quest-anual', orderId: 'o1', em: passado },
    }
    expect(retornoAoQuest(conta, agora)).toEqual({
      accountType: 'quest',
      premiumExpiresAt: futuro,
      premiumPlanType: 'quest-anual',
    })
  })

  it('Quest+ vitalício volta sempre, sem data', () => {
    const conta = { accountType: 'plus', questAntesDoUpgrade: { expiresAt: null, orderId: 'o1', em: passado } }
    expect(retornoAoQuest(conta, agora)).toEqual({ accountType: 'quest', premiumExpiresAt: null, premiumPlanType: null })
  })

  it('Quest+ que já venceu não volta: destino é o gratuito', () => {
    const conta = { accountType: 'plus', questAntesDoUpgrade: { expiresAt: passado, orderId: 'o1', em: passado } }
    expect(retornoAoQuest(conta, agora)).toBeNull()
  })

  it('data ilegível não vira vitalício por engano', () => {
    const conta = { accountType: 'plus', questAntesDoUpgrade: { expiresAt: 'lixo', orderId: 'o1', em: passado } }
    expect(retornoAoQuest(conta, agora)).toBeNull()
  })

  it('só vale para quem está no Plus+', () => {
    const guardado = { expiresAt: futuro, orderId: 'o1', em: passado }
    expect(retornoAoQuest({ accountType: 'gratuito', questAntesDoUpgrade: guardado }, agora)).toBeNull()
    expect(retornoAoQuest({ accountType: 'plus' }, agora)).toBeNull()
  })
})
