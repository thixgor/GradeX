import { describe, expect, it } from 'vitest'

import { lerCartoes } from '@/lib/ia/estudo/gerador-de-flashcards'
import { lerJson, montarExplicacao, montarQuestao } from '@/lib/ia/estudo/gerador-de-provas'
import { sorteador } from '@/lib/ia/estudo/auditoria-de-questoes'
import { montarRespostaComentada } from '@/lib/provas/resposta-comentada'

const vaga = {
  tema: 'Edema pulmonar',
  formato: 'standard' as const,
  estilo: 'contextualizada' as const,
  nivel: 'medio' as const,
  recurso: null,
  posicaoCorreta: 3,
}

const gerada = {
  vaga,
  foco: 'mecanismo do edema cardiogênico',
  enunciado: 'Paciente com dispneia.',
  recurso: null,
  fonte: 'Adaptado de: Guyton & Hall',
  comando: 'Qual o mecanismo?',
  alternativas: [
    { texto: 'Hidrostática', correta: true, comentario: 'Certa: congestão.' },
    { texto: 'Oncótica', correta: false, comentario: 'Errada: albumina normal.' },
    { texto: 'Permeabilidade', correta: false, comentario: 'Errada: sem lesão.' },
    { texto: 'Linfática', correta: false, comentario: 'Errada: sem obstrução.' },
  ],
  fundamento: 'O líquido sai do capilar quando…',
  raciocinio: 'Os estertores bibasais indicam…',
  conclusao: 'É a pressão hidrostática.',
  pegadinha: '',
  paraFixar: 'Starling.',
}

describe('montagem da questão gerada', () => {
  it('põe a correta na letra do plano e leva o comentário junto', () => {
    const q = montarQuestao(gerada, sorteador(3))
    expect(q.alternatives[3]).toMatchObject({ letter: 'D', text: 'Hidrostática', isCorrect: true })
    expect(q.commentedFeedback?.correctAlternative).toBe('D')
    expect(q.commentedFeedback?.explanations.D).toBe('Certa: congestão.')
    const letraOncotica = q.alternatives.find((a) => a.text === 'Oncótica')!.letter
    expect(q.commentedFeedback?.explanations[letraOncotica]).toBe('Errada: albumina normal.')
    expect(q.aiInfo).toMatchObject({ tema: 'Edema pulmonar', nivel: 'medio' })
  })

  it('a resposta comentada é uma aula em seções, e o PDF a recebe inteira', () => {
    const explicacao = montarExplicacao(gerada)
    expect(explicacao).toContain('**Do zero: o que você precisa saber**')
    expect(explicacao).not.toContain('Pegadinha') // seção vazia não entra
    const q = montarQuestao(gerada, sorteador(1))
    const texto = montarRespostaComentada(q)
    expect(texto.startsWith('**Do zero')).toBe(true)
    expect(texto).toContain('**Comentário por alternativa**')
  })

  it('lê JSON mesmo cercado de cerca de código', () => {
    expect(lerJson('```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(lerJson('lixo {"b":2} fim')).toEqual({ b: 2 })
  })
})

describe('leitura dos flashcards', () => {
  it('descarta vazios e repetidos e respeita a quantidade', () => {
    const cartoes = lerCartoes(
      JSON.stringify({
        cartoes: [
          { frente: 'O que é pré-carga?', verso: 'Volume diastólico final.', dica: 'Fim da diástole', objetivos: ['a', 'b', 'c'] },
          { frente: 'o que é PRÉ-carga', verso: 'Repetido.', dica: '' },
          { frente: '', verso: 'Sem frente.' },
          { frente: 'O que é pós-carga?', verso: '**Resistência** à ejeção.', dica: 'Aorta' },
          { frente: 'Extra', verso: 'Passa do pedido.' },
        ],
      }),
      2,
    )
    expect(cartoes.map((c) => c.front)).toEqual(['O que é pré-carga?', 'O que é pós-carga?'])
    expect(cartoes[0].objectives).toHaveLength(2)
    expect(cartoes[1].back).toBe('Resistência à ejeção.')
  })
})
