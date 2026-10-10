import { describe, expect, it } from 'vitest'
import { materialIsentaTaxa, percentualGravado, precoMinimoParaIsencao, taxaPercentDaContratacao } from '@/lib/monitorias/comissao'
import { dividirValor } from '@/lib/monitorias/dinheiro'

const r = (reais: number) => Math.round(reais * 100)

describe('comissão: material oficial junto isenta a taxa só com preço ≥ 10% da aula', () => {
  it.each([
    // [aula, material, % da plataforma] — a tabela do pedido
    [100, 10, 0],
    [100, 15, 0],
    [100, 9.99, 10],
    [200, 20, 0],
    [200, 15, 10],
  ])('aula R$ %s + material R$ %s → plataforma %s%%', (aula, material, taxa) => {
    expect(taxaPercentDaContratacao({ valorAulaCentavos: r(aula), materialCentavos: r(material) })).toBe(taxa)
    const d = dividirValor(r(aula), taxa)
    expect(d.liquidoTutorCentavos).toBe(taxa === 0 ? r(aula) : r(aula) - Math.floor(r(aula) / 10))
  })

  it('limite exato e um centavo de cada lado, sem arredondamento', () => {
    expect(materialIsentaTaxa(10000, 1000)).toBe(true) // exatamente 10%
    expect(materialIsentaTaxa(10000, 999)).toBe(false) // 1 centavo abaixo
    expect(materialIsentaTaxa(10000, 1001)).toBe(true) // 1 centavo acima
    // Aula com centavos: 10% de R$ 125,55 = R$ 12,555 → precisa de R$ 12,56
    expect(materialIsentaTaxa(12555, 1255)).toBe(false)
    expect(materialIsentaTaxa(12555, 1256)).toBe(true)
    expect(precoMinimoParaIsencao(12555)).toBe(1256)
    expect(precoMinimoParaIsencao(10000)).toBe(1000)
  })

  it('sem material, material grátis, valores inválidos ou adulterados → 10%', () => {
    expect(taxaPercentDaContratacao({ valorAulaCentavos: 10000 })).toBe(10)
    expect(taxaPercentDaContratacao({ valorAulaCentavos: 10000, materialCentavos: null })).toBe(10)
    for (const material of [0, -5000, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(taxaPercentDaContratacao({ valorAulaCentavos: 10000, materialCentavos: material })).toBe(10)
    }
    // Aula grátis/zerada não "isenta" nada.
    expect(materialIsentaTaxa(0, 1000)).toBe(false)
  })

  it('percentual gravado: só 0 vale como isenção; ausente (registro antigo) e qualquer outro número = 10%', () => {
    expect(percentualGravado(0)).toBe(0)
    expect(percentualGravado(undefined)).toBe(10)
    expect(percentualGravado(null)).toBe(10)
    expect(percentualGravado(5)).toBe(10)
    expect(percentualGravado(-1)).toBe(10)
    // dividirValor nunca aceita uma taxa "inventada" (ex.: 1%).
    expect(dividirValor(10000, 1).taxaPlataformaCentavos).toBe(1000)
    expect(dividirValor(10000).taxaPlataformaCentavos).toBe(1000)
    expect(dividirValor(10000, 0)).toEqual({ brutoCentavos: 10000, taxaPlataformaCentavos: 0, liquidoTutorCentavos: 10000 })
  })

  it('grupo: cada assento usa o próprio valor e a própria escolha', () => {
    // Mesmo material de R$ 5: assento de R$ 45 isenta (5 ≥ 4,50); de R$ 60 não (5 < 6).
    expect(taxaPercentDaContratacao({ valorAulaCentavos: 4500, materialCentavos: 500 })).toBe(0)
    expect(taxaPercentDaContratacao({ valorAulaCentavos: 6000, materialCentavos: 500 })).toBe(10)
    // Colega sem material, mesma aula: 10%.
    expect(taxaPercentDaContratacao({ valorAulaCentavos: 4500 })).toBe(10)
  })
})
