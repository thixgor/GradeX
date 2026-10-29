import { describe, expect, it } from 'vitest'
import { precoDoPlus } from '@/lib/landing/preco-do-plus'
import type { PlanConfig } from '@/lib/types'

const plano = (p: Partial<PlanConfig>): PlanConfig =>
  ({ tipo: 'anual', nome: 'DomineAqui Plus+', periodo: 'Anual', preco: 397, oculto: false, ordem: 0, durationMonths: 12, ...p }) as PlanConfig

/**
 * O preço do cartão do Plus+ na landing. O que estes testes seguram é a
 * honestidade do número: o menor mensal lidera, a cobrança real vem junto, e
 * sem plano válido não aparece número nenhum.
 */
describe('preço do Plus+ na landing', () => {
  it('lidera com o equivalente mensal e diz a cobrança real', () => {
    expect(precoDoPlus([plano({})])).toEqual({
      chamada: 'R$ 33,08/mês',
      apoio: 'R$ 397,00 cobrados de uma vez, a cada 12 meses.',
    })
  })

  it('escolhe o menor mensal entre os planos Plus+ visíveis', () => {
    const r = precoDoPlus([
      plano({ preco: 49.9, durationMonths: 1, ordem: 0 }),
      plano({ preco: 397, durationMonths: 12, ordem: 1 }),
    ])
    expect(r?.chamada).toBe('R$ 33,08/mês')
  })

  it('ignora plano oculto, de outro cargo e sem preço', () => {
    expect(
      precoDoPlus([
        plano({ preco: 10, oculto: true }),
        plano({ preco: 12, role: 'quest' as PlanConfig['role'] }),
        plano({ preco: 0 }),
      ]),
    ).toBeNull()
  })

  it('não inventa número quando não há catálogo', () => {
    expect(precoDoPlus(null)).toBeNull()
    expect(precoDoPlus([])).toBeNull()
  })
})
