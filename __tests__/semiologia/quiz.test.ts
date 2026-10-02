import { describe, expect, it } from 'vitest'
import { QUESTOES_SEMIOLOGIA, QUIZZES_SEMIOLOGIA, midiaDaQuestao } from '@/lib/semiologia/quiz'

/**
 * O quiz de semiologia é texto escrito à mão sobre mídia curada. Os testes
 * cobram as duas pontas: que cada questão tenha a mídia que promete e que a
 * forma das alternativas não entregue o gabarito.
 */
describe('quiz de semiologia', () => {
  const questoes = QUESTOES_SEMIOLOGIA.map((q) => ({ q, alternativas: [q.achado, ...q.distratores.map((x) => x.nome)] }))

  it('tem ids únicos e quizzes com pelo menos cinco questões', () => {
    expect(new Set(QUESTOES_SEMIOLOGIA.map((q) => q.id)).size).toBe(QUESTOES_SEMIOLOGIA.length)
    for (const quiz of QUIZZES_SEMIOLOGIA) expect(quiz.questoes.length, quiz.id).toBeGreaterThanOrEqual(5)
  })

  it('aponta para mídia que existe no acervo da ficha', () => {
    for (const { q } of questoes) expect(midiaDaQuestao(q), `${q.id}: sem mídia em ${q.sinal}[${q.midia ?? 0}]`).not.toBeNull()
  })

  it('conta a consulta inteira, com antecedentes por natureza', () => {
    for (const { q } of questoes) {
      expect(q.identificacao.length, q.id).toBeGreaterThan(15)
      expect(q.queixa.length, q.id).toBeGreaterThan(15)
      expect(q.historia.length, q.id).toBeGreaterThan(180)
      expect(q.antecedentes.pessoais.length, q.id).toBeGreaterThan(0)
      expect(q.antecedentes.familiares.length, q.id).toBeGreaterThan(0)
      expect(q.antecedentes.habitos.length, q.id).toBeGreaterThan(0)
      expect(q.exame.length, q.id).toBeGreaterThanOrEqual(3)
      for (const campo of ['pa', 'fc', 'fr', 'satO2'] as const) expect(q.vitais[campo], `${q.id}: ${campo}`).toBeTruthy()
    }
  })

  it('comenta a resposta em profundidade', () => {
    for (const { q } of questoes) {
      expect(q.veredito.length, q.id).toBeGreaterThan(q.achado.length)
      expect(q.olhar.length, `${q.id}: apontamento raso`).toBeGreaterThan(120)
      expect(q.explicacao.length, `${q.id}: explicação rasa`).toBeGreaterThan(400)
      expect(q.conduta.length, q.id).toBeGreaterThan(100)
      expect(q.distratores.length, q.id).toBe(3)
      const nomes = new Set(q.distratores.map((x) => x.nome))
      expect(nomes.size, q.id).toBe(3)
      expect(nomes.has(q.achado), q.id).toBe(false)
      for (const x of q.distratores) {
        expect(x.nome.length, q.id).toBeGreaterThan(10)
        expect(x.porQue.length, `${q.id}: descarte raso em "${x.nome}"`).toBeGreaterThan(120)
      }
    }
  })

  describe('a forma não entrega o gabarito', () => {
    it('sem travessão, parênteses, aspas nem vírgula; no máximo sete palavras', () => {
      for (const { q, alternativas } of questoes) {
        for (const a of alternativas) {
          expect(a, `${q.id}: "${a}"`).not.toMatch(/[—–("'",]/)
          expect(a.trim().split(/\s+/).length, `${q.id}: "${a}"`).toBeLessThanOrEqual(7)
        }
      }
    })

    it('sem advérbio absoluto ou palavra terminada em -mente', () => {
      const absoluto = /\b\w+mente\b|\bsempre\b|\bnunca\b|\bjamais\b|\btodos?\b|\bnenhum|\bapenas\b/i
      for (const { q, alternativas } of questoes) for (const a of alternativas) expect(a, `${q.id}: "${a}"`).not.toMatch(absoluto)
    })

    it('a certa tem o tamanho dos distratores e não é sistematicamente a mais longa ou a mais curta', () => {
      let maisLonga = 0
      let maisCurta = 0
      for (const { q, alternativas } of questoes) {
        const media = alternativas.slice(1).reduce((t, x) => t + x.length, 0) / 3
        const razao = q.achado.length / media
        expect(razao, `${q.id}: "${q.achado}" curta demais`).toBeGreaterThan(0.6)
        expect(razao, `${q.id}: "${q.achado}" longa demais`).toBeLessThan(1.5)
        const tamanhos = alternativas.map((x) => x.length)
        if (q.achado.length === Math.max(...tamanhos)) maisLonga += 1
        if (q.achado.length === Math.min(...tamanhos)) maisCurta += 1
      }
      const teto = Math.round(questoes.length * 0.38)
      expect(maisLonga, `certa é a mais longa em ${maisLonga}/${questoes.length}`).toBeLessThanOrEqual(teto)
      expect(maisCurta, `certa é a mais curta em ${maisCurta}/${questoes.length}`).toBeLessThanOrEqual(teto)
    })
  })
})
