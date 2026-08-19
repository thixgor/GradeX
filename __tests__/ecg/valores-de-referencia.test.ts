import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ECG_REFERENCIA, referenciaDe, type RefKey } from '../../lib/ecg/reference'

const RAIZ = path.resolve(__dirname, '../..')
const ler = (rel: string) => readFileSync(path.join(RAIZ, rel), 'utf8')

/**
 * Cada medida do simulador é impressa com o seu valor normal de referência
 * logo abaixo. O número sozinho não ensina: "PR 260 ms" só vira BAV de 1º grau
 * quando se sabe que o normal termina em 200 ms.
 *
 * Estes testes travam as faixas (que são conteúdo clínico, não enfeite) e
 * garantem que nenhum card volte a ser renderizado sem a sua referência.
 */
describe('valores normais de referência do ECG', () => {
  it('classifica a frequência cardíaca nos limites de 60 e 100 bpm', () => {
    expect(referenciaDe('hr', 72).status).toBe('normal')
    expect(referenciaDe('hr', 60).status).toBe('normal')
    expect(referenciaDe('hr', 100).status).toBe('normal')
    expect(referenciaDe('hr', 45).status).toBe('baixo')
    expect(referenciaDe('hr', 130).status).toBe('alto')
  })

  it('classifica o PR nos limites de 120 e 200 ms', () => {
    expect(referenciaDe('pr', 160).status).toBe('normal')
    expect(referenciaDe('pr', 100).status).toBe('baixo')   // pré-excitação / juncional
    expect(referenciaDe('pr', 260).status).toBe('alto')    // BAV de 1º grau
  })

  it('trata PR não mensurável (FA, BAVT) como sem julgamento', () => {
    expect(referenciaDe('pr', null).status).toBe('neutro')
  })

  it('considera QRS largo a partir de 120 ms', () => {
    expect(referenciaDe('qrs', 90).status).toBe('normal')
    expect(referenciaDe('qrs', 119).status).toBe('normal')
    expect(referenciaDe('qrs', 120).status).toBe('alto')
    expect(referenciaDe('qrs', 160).status).toBe('alto')
  })

  it('não julga o QT absoluto — ele depende da frequência', () => {
    expect(referenciaDe('qt', 320).status).toBe('neutro')
    expect(referenciaDe('qt', 480).status).toBe('neutro')
  })

  it('classifica o QTc pelos mesmos limiares do laudo (350–460 ms)', () => {
    expect(referenciaDe('qtc', 400).status).toBe('normal')
    expect(referenciaDe('qtc', 460).status).toBe('normal')
    expect(referenciaDe('qtc', 500).status).toBe('alto')
    expect(referenciaDe('qtc', 330).status).toBe('baixo')
  })

  it('classifica o eixo entre −30° e +90°, normalizando o ângulo', () => {
    expect(referenciaDe('axis', 60).status).toBe('normal')
    expect(referenciaDe('axis', -30).status).toBe('normal')
    expect(referenciaDe('axis', 90).status).toBe('normal')
    expect(referenciaDe('axis', -45).status).toBe('baixo')  // desvio para a esquerda
    expect(referenciaDe('axis', 120).status).toBe('alto')   // desvio para a direita
    expect(referenciaDe('axis', 420).status).toBe('normal') // 420° = 60°
  })

  it('classifica RR e amplitude de R', () => {
    expect(referenciaDe('rr', 830).status).toBe('normal')
    expect(referenciaDe('rr', 1200).status).toBe('alto')
    expect(referenciaDe('rr', 400).status).toBe('baixo')
    expect(referenciaDe('rAmp', 1.2).status).toBe('normal')
    expect(referenciaDe('rAmp', 2.6).status).toBe('alto')
    expect(referenciaDe('rAmp', 0.3).status).toBe('baixo')
  })

  it('dá faixa e explicação a toda medida catalogada', () => {
    for (const chave of Object.keys(ECG_REFERENCIA) as RefKey[]) {
      const r = ECG_REFERENCIA[chave]
      expect(r.faixa.length, chave).toBeGreaterThan(0)
      expect(r.detalhe.length, chave).toBeGreaterThan(20)
    }
  })

  it('imprime a referência em todo card de medida do simulador e do laboratório', () => {
    const fontes = [
      ['components/ecg/ecg-simulator.tsx', /<Measure\b[^>]*\/>/g],
      ['components/ecg/ecg-playground.tsx', /<LiveTile\b[^>]*\/>/g],
    ] as const
    for (const [arquivo, padrao] of fontes) {
      const codigo = ler(arquivo)
      const cards = codigo.match(padrao) ?? []
      expect(cards.length, arquivo).toBeGreaterThan(0)
      for (const card of cards) {
        expect(card, arquivo).toMatch(/refKey="/)
        expect(card, arquivo).toMatch(/num=\{/)
      }
      // a sigla usada no card ("VR") precisa estar explicada na tela
      expect(codigo, arquivo).toMatch(/valor normal de referência/i)
    }
  })
})
