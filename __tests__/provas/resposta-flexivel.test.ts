import { describe, expect, it } from 'vitest'
import {
  compararComGabarito,
  corrigirPorGabarito,
  distanciaDeEdicao,
  limparRespostasAceitas,
  normalizarResposta,
} from '@/lib/provas/resposta-flexivel'
import { sanitizarQuestaoParaAluno } from '@/lib/provas/sanitizar-prova'
import type { Question } from '@/lib/types'

describe('normalizarResposta', () => {
  it('ignora maiúsculas, acentos, cedilha, pontuação e artigo inicial', () => {
    for (const variante of ['coração', 'Coracao', 'coraçao', 'CORAÇÃO', 'coracao.', '.coracao', '  "Coração!" ', 'o coração']) {
      expect(normalizarResposta(variante)).toBe('coracao')
    }
  })

  it('mantém a resposta que é só um artigo', () => {
    expect(normalizarResposta('A')).toBe('a')
  })

  it('transforma hífen e pontuação interna em espaço', () => {
    expect(normalizarResposta('Ventrículo-Esquerdo.')).toBe('ventriculo esquerdo')
  })
})

describe('distanciaDeEdicao', () => {
  it('conta inversão de vizinhas como um erro só', () => {
    expect(distanciaDeEdicao('coracoa', 'coracao')).toBe(1)
  })
  it('conta substituição, inserção e remoção', () => {
    expect(distanciaDeEdicao('corasao', 'coracao')).toBe(1)
    expect(distanciaDeEdicao('coracaoo', 'coracao')).toBe(1)
    expect(distanciaDeEdicao('coraao', 'coracao')).toBe(1)
    expect(distanciaDeEdicao('figado', 'coracao')).toBeGreaterThan(3)
  })
})

describe('compararComGabarito', () => {
  const gabarito = ['coração']

  it('aceita as variações do enunciado do pedido', () => {
    for (const r of ['coracao', 'coraçao', 'coracao.', '.coracao', 'coracoa', 'Coração', 'o coração']) {
      expect(compararComGabarito(r, gabarito).aceita, r).toBe(true)
    }
  })

  it('recusa resposta errada', () => {
    expect(compararComGabarito('pulmão', gabarito).aceita).toBe(false)
    expect(compararComGabarito('', gabarito).aceita).toBe(false)
  })

  it('não perdoa erro em palavra curta (sal ≠ sol)', () => {
    expect(compararComGabarito('sol', ['sal']).aceita).toBe(false)
  })

  it('rigor exato não perdoa erro de digitação, mas ignora acento', () => {
    expect(compararComGabarito('coracoa', gabarito, 'exato').aceita).toBe(false)
    expect(compararComGabarito('CORACAO!', gabarito, 'exato').aceita).toBe(true)
  })

  it('aceita qualquer sinônimo, com a mesma tolerância', () => {
    const sinonimos = ['coração', 'miocárdio', 'bomba cardíaca']
    const v = compararComGabarito('miocardoi', sinonimos)
    expect(v.aceita).toBe(true)
    expect(v.respostaCorrespondente).toBe('miocárdio')
    expect(compararComGabarito('Bomba-cardiaca.', sinonimos).aceita).toBe(true)
    expect(compararComGabarito('bombacardiaca', sinonimos).aceita).toBe(true)
  })
})

describe('limparRespostasAceitas', () => {
  it('remove vazias e repetidas (pela forma normalizada)', () => {
    expect(limparRespostasAceitas(['coração', '', '  ', 'Coracao', 'miocárdio ', 3])).toEqual(['coração', 'miocárdio'])
  })
})

describe('corrigirPorGabarito', () => {
  const questao = { id: 'q1', maxScore: 2, acceptedAnswers: ['coração'] }

  it('dá nota cheia para a resposta aceita', () => {
    const c = corrigirPorGabarito(questao, 'coracoa')
    expect(c.score).toBe(2)
    expect(c.maxScore).toBe(2)
    expect(c.method).toBe('answer-key')
  })

  it('dá zero para resposta errada ou em branco', () => {
    expect(corrigirPorGabarito(questao, 'rim').score).toBe(0)
    expect(corrigirPorGabarito(questao, undefined).score).toBe(0)
  })
})

describe('sanitização', () => {
  it('as respostas aceitas não chegam ao aluno', () => {
    const q = {
      id: 'q1', number: 1, type: 'discursive', statement: '', command: '', alternatives: [],
      acceptedAnswers: ['coração'], acceptedAnswersRigor: 'normal',
    } as Question
    const s = sanitizarQuestaoParaAluno(q) as Partial<Question>
    expect(s.acceptedAnswers).toBeUndefined()
    expect(s.acceptedAnswersRigor).toBeUndefined()
  })
})
