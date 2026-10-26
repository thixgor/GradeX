import { describe, expect, it } from 'vitest'

import { auditarQuestao, precisaDescartar, sorteador } from '@/lib/ia/estudo/auditoria-de-questoes'
import {
  ALTERNATIVAS_ASSERCAO_RAZAO,
  combinacoesDasAfirmativas,
  esquemaDaQuestao,
  montarDaResposta,
  promptDaQuestao,
  rotuloDaCombinacao,
} from '@/lib/ia/estudo/prompt-da-questao'
import type { VagaDaQuestao } from '@/lib/ia/estudo/plano-da-prova'

const vaga = (extra: Partial<VagaDaQuestao>): VagaDaQuestao => ({
  tema: 'Insuficiência cardíaca',
  formato: 'standard',
  estilo: 'contextualizada',
  nivel: 'medio',
  recurso: null,
  posicaoCorreta: 0,
  ...extra,
})

const explicacao = { fundamento: 'Base.', raciocinio: 'Passos.', conclusao: 'Por isso.', pegadinha: 'Cuidado.', paraFixar: 'Regra.' }

const passaNaRevisao = (q: NonNullable<ReturnType<typeof montarDaResposta>>, v: VagaDaQuestao, n: number) =>
  !precisaDescartar(
    auditarQuestao(
      { formato: v.formato, enunciado: q.enunciado, comando: q.comando, alternativas: q.alternativas, temRecurso: !!q.recurso },
      v.formato === 'assertion-reason' ? 5 : n,
    ),
  )

describe('esquema por questão', () => {
  it('clássica: uma correta e exatamente N−1 distratoras, sem campo de recurso quando não pedido', () => {
    const e: any = esquemaDaQuestao(vaga({}), 5)
    expect(e.properties.distratoras.minItems).toBe(4)
    expect(e.properties.distratoras.maxItems).toBe(4)
    expect(e.properties.correta.type).toBe('OBJECT')
    expect(e.properties.recurso).toBeUndefined()
    expect(e.properties.alternativas).toBeUndefined()
  })

  it('recurso pedido vem antes do enunciado e com o tipo travado', () => {
    const e: any = esquemaDaQuestao(vaga({ recurso: 'tabela' }), 4)
    expect(e.properties.recurso.properties.tipo.enum).toEqual(['tabela'])
    expect(e.propertyOrdering.indexOf('recurso')).toBeLessThan(e.propertyOrdering.indexOf('enunciado'))
    expect(e.required).toContain('recurso')
  })

  it('afirmativas pedem 4 afirmativas; asserção-razão pede as duas asserções e os julgamentos', () => {
    const a: any = esquemaDaQuestao(vaga({ formato: 'multiple-affirmative' }), 4)
    expect(a.properties.afirmativas.minItems).toBe(4)
    expect(a.properties.afirmativas.maxItems).toBe(4)
    const r: any = esquemaDaQuestao(vaga({ formato: 'assertion-reason' }), 5)
    expect(r.required).toEqual(expect.arrayContaining(['assercaoI', 'assercaoII', 'iVerdadeira', 'iiVerdadeira', 'iiJustificaI']))
  })

  it('o prompt diz o número exato de distratoras e proíbe citar recurso ausente', () => {
    const p = promptDaQuestao(vaga({}), 'Medicina', 5, ['foco antigo'])
    expect(p).toContain('exatamente 4 distratoras')
    expect(p).toContain('não cita tabela')
    expect(p).toContain('foco antigo')
  })
})

describe('montagem da resposta', () => {
  it('clássica vira 1 correta + N−1 distratoras e passa na revisão', () => {
    const v = vaga({})
    const q = montarDaResposta(
      {
        foco: 'mecanismo do edema',
        enunciado: 'Mulher de 62 anos com dispneia e estertores bibasais.',
        comando: 'Qual é o mecanismo do edema',
        correta: { texto: 'Aumento da pressão hidrostática capilar pulmonar', comentario: 'Congestão.' },
        distratoras: [
          { erroConceitual: 'oncótica', texto: 'Queda da pressão oncótica por perda de albumina', comentario: 'Albumina normal.' },
          { erroConceitual: 'permeabilidade', texto: 'Aumento da permeabilidade por lesão alveolar difusa', comentario: 'Sem lesão.' },
          { erroConceitual: 'linfa', texto: 'Obstrução da drenagem linfática por infiltração tumoral', comentario: 'Sem tumor.' },
        ],
        ...explicacao,
      },
      v,
      4,
    )!
    expect(q.alternativas.filter((a) => a.correta)).toHaveLength(1)
    expect(q.alternativas).toHaveLength(4)
    expect(q.comando.endsWith(':')).toBe(true)
    expect(passaNaRevisao(q, v, 4)).toBe(true)
  })

  it('clássica com distratora a menos é recusada (não vira questão manca)', () => {
    expect(
      montarDaResposta({ enunciado: 'x', comando: 'y', correta: { texto: 'a' }, distratoras: [{ texto: 'b' }], ...explicacao }, vaga({}), 4),
    ).toBeNull()
  })

  it('afirmativas: enunciado com I–IV e combinações montadas aqui', () => {
    const v = vaga({ formato: 'multiple-affirmative' })
    const q = montarDaResposta(
      {
        enunciado: 'Sobre a insuficiência cardíaca com fração reduzida, analise as afirmativas.',
        afirmativas: [
          { texto: 'I. Betabloqueador reduz mortalidade.', verdadeira: true, comentario: 'Sim.' },
          { texto: 'Digoxina reduz mortalidade.', verdadeira: false, comentario: 'Só sintomas.' },
          { texto: 'Espironolactona reduz mortalidade.', verdadeira: true, comentario: 'RALES.' },
          { texto: 'Furosemida reduz mortalidade.', verdadeira: false, comentario: 'Só congestão.' },
        ],
        comando: '',
        ...explicacao,
      },
      v,
      5,
      sorteador(3),
    )!
    expect(q.enunciado).toContain('\nI. Betabloqueador')
    expect(q.enunciado).toContain('\nIV. Furosemida')
    expect(q.alternativas).toHaveLength(5)
    expect(q.alternativas.find((a) => a.correta)!.texto).toBe('I e III, apenas')
    expect(new Set(q.alternativas.map((a) => a.texto)).size).toBe(5)
    expect(q.comando).toBe('Está correto o que se afirma em:')
    expect(q.alternativas.filter((a) => !a.correta).every((a) => a.comentario.length > 0)).toBe(true)
    expect(passaNaRevisao(q, v, 5)).toBe(true)
  })

  it('combinações começam pelas mais parecidas com a certa', () => {
    const combos = combinacoesDasAfirmativas([true, false, true, false], 4, sorteador(1))
    expect(combos[0]).toEqual({ indices: [0, 2], correta: true })
    // As distratoras diferem da certa em uma afirmativa só.
    for (const c of combos.slice(1)) {
      const dif = [0, 1, 2, 3].filter((i) => c.indices.includes(i) !== [0, 2].includes(i)).length
      expect(dif).toBe(1)
    }
    expect(rotuloDaCombinacao([3, 0, 1, 2])).toBe('I, II, III e IV')
    expect(rotuloDaCombinacao([1])).toBe('II, apenas')
  })

  it('asserção-razão: a alternativa certa sai dos julgamentos, nunca de uma letra da IA', () => {
    const v = vaga({ formato: 'assertion-reason' })
    const base = { enunciado: 'Considere a fisiologia renal.', assercaoI: 'A ureia é reabsorvida.', assercaoII: 'O ducto coletor é permeável à ureia.', ...explicacao }
    const casos: [boolean, boolean, boolean, number][] = [
      [true, true, true, 0],
      [true, true, false, 1],
      [true, false, false, 2],
      [false, true, false, 3],
      [false, false, false, 4],
    ]
    for (const [i, ii, j, certa] of casos) {
      const q = montarDaResposta({ ...base, iVerdadeira: i, iiVerdadeira: ii, iiJustificaI: j }, v, 5)!
      expect(q.alternativas.map((a) => a.texto)).toEqual(ALTERNATIVAS_ASSERCAO_RAZAO)
      expect(q.alternativas.findIndex((a) => a.correta)).toBe(certa)
      expect(q.enunciado).toContain('PORQUE')
      expect(passaNaRevisao(q, v, 5)).toBe(true)
    }
  })

  it('recurso que veio entra; enunciado que cita tabela com tabela passa', () => {
    const v = vaga({ recurso: 'tabela' })
    const q = montarDaResposta(
      {
        recurso: { tipo: 'tabela', titulo: 'Exames', cabecalho: ['Exame', 'Valor'], linhas: [['K', '6,8'], ['Cr', '3,1']] },
        enunciado: 'Analise a tabela a seguir com os exames do paciente.',
        comando: 'Qual é a conduta imediata?',
        correta: { texto: 'Gluconato de cálcio por via endovenosa', comentario: 'Estabiliza a membrana.' },
        distratoras: [
          { texto: 'Bicarbonato de sódio por via endovenosa', comentario: 'Não é o primeiro passo.' },
          { texto: 'Furosemida em dose alta por via oral', comentario: 'Lenta.' },
          { texto: 'Resina de troca por via retal agora', comentario: 'Lenta.' },
        ],
        ...explicacao,
      },
      v,
      4,
    )!
    expect(q.recurso?.tipo).toBe('tabela')
    expect(passaNaRevisao(q, v, 4)).toBe(true)
  })
})

describe('revisão sem falso positivo', () => {
  it('"quadro clínico a seguir" não é material de apoio ausente', () => {
    const alertas = auditarQuestao(
      {
        formato: 'standard',
        enunciado: 'Paciente com o quadro clínico a seguir: febre e tosse há três dias.',
        comando: 'Qual o diagnóstico?',
        alternativas: [
          { texto: 'Pneumonia adquirida na comunidade', correta: true },
          { texto: 'Tromboembolismo pulmonar agudo', correta: false },
          { texto: 'Exacerbação de asma brônquica', correta: false },
          { texto: 'Insuficiência cardíaca descompensada', correta: false },
        ],
      },
      4,
    )
    expect(precisaDescartar(alertas)).toBe(false)
  })
})
