import { describe, it, expect } from 'vitest'
import {
  apresentarPreco,
  prazoEmMeses,
  precoPorMes,
} from '@/lib/manual-clinico/pacote'

/**
 * O preço da vitrine é dito por MÊS quando o plano tem prazo — "R$ 197,00" é o
 * número de um semestre inteiro, e quem lê compara com o preço de uma coisa só.
 *
 * O risco dessa escolha é anunciar uma mensalidade que não existe: aqui não há
 * renovação nem débito recorrente, é um pagamento único que abre um prazo. Por
 * isso `cobranca` é obrigatória e sai sempre preenchida — os testes abaixo
 * existem para que ela nunca vire opcional, nunca fique vazia e nunca deixe de
 * dizer o total que será cobrado.
 */
/**
 * `Intl.NumberFormat('pt-BR')` separa "R$" do número com um espaço
 * NÃO-QUEBRÁVEL (U+00A0), e não com o espaço comum que se digita aqui. Sem
 * normalizar, todo `toBe('R$ 32,83')` deste arquivo falharia por um caractere
 * invisível — e a mensagem de erro mostraria duas strings idênticas.
 */
const semNbsp = (texto: string) => texto.replace(/\u00a0/g, ' ')

describe('precoPorMes', () => {
  it('divide pelo número de meses', () => {
    expect(precoPorMes(197, 6)).toBe(32.83)
  })

  it('não inventa mensal sem prazo — vitalício não tem "por mês"', () => {
    expect(precoPorMes(197, null)).toBeNull()
    expect(precoPorMes(197, 0)).toBeNull()
  })

  it('não divide preço que não existe', () => {
    expect(precoPorMes(0, 6)).toBeNull()
    expect(precoPorMes(Number.NaN, 6)).toBeNull()
  })
})

describe('prazoEmMeses', () => {
  it('concorda o singular', () => {
    expect(prazoEmMeses(1)).toBe('1 mês')
    expect(prazoEmMeses(6)).toBe('6 meses')
  })

  it('é nulo sem prazo', () => {
    expect(prazoEmMeses(null)).toBeNull()
  })
})

describe('apresentarPreco', () => {
  it('com prazo, o destaque é o mensal e a cobrança diz o total e o período', () => {
    const p = apresentarPreco({ precoBase: 197, precoFinal: 197, mesesDoPlano: 6 })
    expect(semNbsp(p.destaque)).toBe('R$ 32,83')
    expect(p.sufixo).toBe('/mês')
    expect(semNbsp(p.cobranca)).toBe('R$ 197,00 uma vez · acesso por 6 meses')
    expect(p.destaqueRiscado).toBeNull()
  })

  it('a cobrança NUNCA fica vazia — é ela que impede a tela de prometer mensalidade', () => {
    const casos = [
      { precoBase: 197, precoFinal: 197, mesesDoPlano: 6 },
      { precoBase: 197, precoFinal: 138, temLote: true, mesesDoPlano: 12 },
      { precoBase: 497, precoFinal: 497, mesesDoPlano: null },
      { precoBase: 497, precoFinal: 397, temLote: true, mesesDoPlano: null },
    ]
    for (const caso of casos) {
      expect(apresentarPreco(caso).cobranca.trim().length, JSON.stringify(caso)).toBeGreaterThan(0)
    }
  })

  it('sem prazo, o destaque volta a ser o total e não há sufixo', () => {
    const p = apresentarPreco({ precoBase: 497, precoFinal: 497, mesesDoPlano: null })
    expect(semNbsp(p.destaque)).toBe('R$ 497,00')
    expect(p.sufixo).toBeNull()
    expect(semNbsp(p.cobranca)).toBe('Pagamento único, sem mensalidade.')
  })

  it('com lote, o riscado é o MENSAL cheio — riscar o total ao lado de um mensal compararia coisas diferentes', () => {
    const p = apresentarPreco({ precoBase: 240, precoFinal: 120, temLote: true, mesesDoPlano: 6 })
    expect(semNbsp(p.destaque)).toBe('R$ 20,00')
    expect(semNbsp(p.destaqueRiscado || '')).toBe('R$ 40,00')
    expect(semNbsp(p.cobranca)).toBe('R$ 120,00 uma vez · acesso por 6 meses')
  })

  it('sem prazo e com lote, risca o total cheio', () => {
    const p = apresentarPreco({ precoBase: 497, precoFinal: 397, temLote: true, mesesDoPlano: null })
    expect(semNbsp(p.destaqueRiscado || '')).toBe('R$ 497,00')
  })

  it('não risca nada quando o lote não baixou o preço', () => {
    const p = apresentarPreco({ precoBase: 197, precoFinal: 197, temLote: true, mesesDoPlano: 6 })
    expect(p.destaqueRiscado).toBeNull()
  })

  it('o total da cobrança é sempre o preço FINAL, nunca o cheio', () => {
    const p = apresentarPreco({ precoBase: 300, precoFinal: 180, temLote: true, mesesDoPlano: 6 })
    expect(semNbsp(p.cobranca)).toContain('R$ 180,00')
    expect(semNbsp(p.cobranca)).not.toContain('R$ 300,00')
  })
})
