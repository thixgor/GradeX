import { describe, expect, it } from 'vitest'
import {
  apresentarPreco,
  chaveDeBeneficio,
  formatarBRL,
  linhaDeApoio,
  normalizarMeses,
  rotuloCurtoDePreco,
  rotuloDeCiclo,
  rotuloDePeriodo,
} from '@/lib/buy/pricing'

describe('formatarBRL', () => {
  it('põe separador de milhar e sempre duas casas', () => {
    expect(formatarBRL(3128.99)).toBe('3.128,99')
    expect(formatarBRL(397)).toBe('397,00')
    expect(formatarBRL(54.5)).toBe('54,50')
  })

  it('não quebra com entrada inválida', () => {
    expect(formatarBRL(Number.NaN)).toBe('0,00')
    expect(formatarBRL(Number.POSITIVE_INFINITY)).toBe('0,00')
  })
})

describe('apresentarPreco', () => {
  it('semestral: lidera pelo mensal, não pelo total que assusta', () => {
    const preco = apresentarPreco({ preco: 327, durationMonths: 6 })
    expect(preco.chamada).toEqual({ valor: 54.5, unidade: 'mes' })
    expect(preco.total).toBe(327)
    expect(preco.mensal).toBe(54.5)
  })

  it('anual: mensal e diário derivados do total', () => {
    const preco = apresentarPreco({ preco: 397, precoOriginal: 3128.99, durationMonths: 12 })
    expect(preco.mensal).toBe(33.08)
    expect(preco.diario).toBe(1.09)
    expect(preco.ancora).toBe(3128.99)
    expect(preco.economia).toBe(2731.99)
    expect(preco.descontoPercentual).toBe(87)
  })

  it('mensal: o total já é o mensal e não há leitura diária', () => {
    const preco = apresentarPreco({ preco: 29.9, durationMonths: 1 })
    expect(preco.chamada).toEqual({ valor: 29.9, unidade: 'mes' })
    expect(preco.diario).toBeNull()
  })

  it('trimestral já mostra a leitura diária', () => {
    expect(apresentarPreco({ preco: 90, durationMonths: 3 }).diario).toBe(0.99)
  })

  it('vitalício não inventa mensalidade', () => {
    const preco = apresentarPreco({ preco: 997, durationMonths: 0 })
    expect(preco.vitalicio).toBe(true)
    expect(preco.mensal).toBeNull()
    expect(preco.diario).toBeNull()
    expect(preco.chamada).toEqual({ valor: 997, unidade: 'unico' })
  })

  it('duração ausente é tratada como vitalício', () => {
    expect(apresentarPreco({ preco: 500 }).vitalicio).toBe(true)
  })

  it('ignora preço "de" que não é maior que o cobrado', () => {
    const igual = apresentarPreco({ preco: 397, precoOriginal: 397, durationMonths: 12 })
    expect(igual.ancora).toBeNull()
    expect(igual.economia).toBeNull()
    expect(igual.descontoPercentual).toBeNull()

    const menor = apresentarPreco({ preco: 397, precoOriginal: 200, durationMonths: 12 })
    expect(menor.ancora).toBeNull()
  })

  it('preço inválido vira zero em vez de NaN na tela', () => {
    const preco = apresentarPreco({ preco: Number.NaN, durationMonths: 12 })
    expect(preco.total).toBe(0)
    expect(preco.mensal).toBe(0)
  })
})

describe('linhaDeApoio', () => {
  it('mostra o total real, porque o mensal arredondado não fecha a conta', () => {
    const anual = apresentarPreco({ preco: 397, durationMonths: 12 })
    // 33,08 × 12 = 396,96 — o total precisa aparecer para a página não mentir.
    expect(anual.mensal! * 12).not.toBe(anual.total)
    expect(linhaDeApoio(anual)).toBe('R$ 397,00 cobrados de uma vez, a cada 12 meses.')
  })

  it('semestral nomeia o ciclo real', () => {
    expect(linhaDeApoio(apresentarPreco({ preco: 327, durationMonths: 6 }))).toBe(
      'R$ 327,00 cobrados de uma vez, a cada 6 meses.'
    )
  })

  it('mensal e vitalício têm frases próprias', () => {
    expect(linhaDeApoio(apresentarPreco({ preco: 29.9, durationMonths: 1 }))).toBe(
      'R$ 29,90 cobrados por mês.'
    )
    expect(linhaDeApoio(apresentarPreco({ preco: 997, durationMonths: 0 }))).toBe(
      'R$ 997,00 uma vez. Sem renovação.'
    )
  })
})

describe('rotuloCurtoDePreco', () => {
  it('período fechado sai como mensalidade', () => {
    expect(rotuloCurtoDePreco(apresentarPreco({ preco: 397, durationMonths: 12 }))).toBe('R$ 33,08/mês')
    expect(rotuloCurtoDePreco(apresentarPreco({ preco: 327, durationMonths: 6 }))).toBe('R$ 54,50/mês')
  })

  it('vitalício não vira mensalidade em lugar nenhum', () => {
    expect(rotuloCurtoDePreco(apresentarPreco({ preco: 997, durationMonths: 0 }))).toBe(
      'R$ 997,00 à vista'
    )
  })
})

describe('rótulos', () => {
  it('normalizarMeses derruba lixo para vitalício', () => {
    expect(normalizarMeses(12)).toBe(12)
    expect(normalizarMeses(0)).toBe(0)
    expect(normalizarMeses(-3)).toBe(0)
    expect(normalizarMeses(undefined)).toBe(0)
    expect(normalizarMeses(Number.NaN)).toBe(0)
  })

  it('rotuloDeCiclo é usado dentro de frase', () => {
    expect(rotuloDeCiclo(1)).toBe('mês')
    expect(rotuloDeCiclo(6)).toBe('6 meses')
    expect(rotuloDeCiclo(0)).toBe('sempre')
  })

  it('rotuloDePeriodo prefere o texto do admin', () => {
    expect(rotuloDePeriodo('Anual', 12)).toBe('Anual')
    expect(rotuloDePeriodo('  ', 6)).toBe('Semestral')
    expect(rotuloDePeriodo(undefined, 0)).toBe('Vitalício')
    expect(rotuloDePeriodo(undefined, 7)).toBe('7 meses')
  })
})

describe('chaveDeBeneficio', () => {
  it('junta o mesmo benefício escrito de jeitos diferentes', () => {
    expect(chaveDeBeneficio('Todas as Provas da Faculdade + Download em PDF')).toBe(
      chaveDeBeneficio('todas as provas da faculdade + download em pdf')
    )
    expect(chaveDeBeneficio('Criação ilimitada de Mapas Mentais')).toBe(
      'criacao ilimitada de mapas mentais'
    )
  })

  it('não colapsa benefícios diferentes', () => {
    expect(chaveDeBeneficio('Todos os Flashcards')).not.toBe(chaveDeBeneficio('Todos os Materiais'))
  })
})
