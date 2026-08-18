import { describe, it, expect } from 'vitest'
import {
  chaveDeOrigem,
  hierarquiaNecessaria,
  mapearProvas,
  montarEnunciado,
  montarExplicacao,
  type GrupoDeProvas,
  type ProvaParaImportar,
} from '@/lib/banco/importar-provas'

/*
 *  medicina  (raiz escolhida pelo admin)
 *   ├── p1
 *   │    └── mod1
 *   └── p2
 *  fora  (outro ramo, não escolhido)
 */
const grupos: GrupoDeProvas[] = [
  { _id: 'medicina', name: 'Medicina', parentGroupId: null },
  { _id: 'p1', name: 'Período 1', parentGroupId: 'medicina' },
  { _id: 'mod1', name: 'Módulo I', parentGroupId: 'p1' },
  { _id: 'p2', name: 'Período 2', parentGroupId: 'medicina' },
  { _id: 'fora', name: 'Outro curso', parentGroupId: null },
]
const raiz = grupos[0]

function objetiva(extra: Partial<any> = {}) {
  return {
    id: 'q1',
    number: 1,
    type: 'multiple-choice',
    statement: 'Qual é a principal causa de X?',
    command: 'Assinale a alternativa correta.',
    alternatives: [
      { letter: 'A', text: 'Primeira', isCorrect: true },
      { letter: 'B', text: 'Segunda', isCorrect: false },
    ],
    ...extra,
  }
}

describe('mapearProvas', () => {
  it('põe o caminho relativo no tópico e a prova no subtópico', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'Prova de Anatomia', groupId: 'mod1', questions: [objetiva()] },
    ]
    const { questoes } = mapearProvas(raiz, provas, grupos)
    expect(questoes).toHaveLength(1)
    expect(questoes[0].moduloNome).toBe('Medicina')
    expect(questoes[0].topicoNome).toBe('Período 1 › Módulo I')
    expect(questoes[0].subtopicoNome).toBe('Prova de Anatomia')
  })

  it('usa "Geral" quando a prova está direto no grupo escolhido', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'Simulado', groupId: 'medicina', questions: [objetiva()] },
    ]
    expect(mapearProvas(raiz, provas, grupos).questoes[0].topicoNome).toBe('Geral')
  })

  it('não traz prova de fora do ramo escolhido', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'De outro curso', groupId: 'fora', questions: [objetiva()] },
      { _id: 'e2', title: 'Sem grupo', groupId: null, questions: [objetiva()] },
    ]
    expect(mapearProvas(raiz, provas, grupos).questoes).toHaveLength(0)
  })

  it('mantém separados dois "Módulo I" de ramos diferentes', () => {
    // Se o tópico fosse só o último segmento, os dois virariam um tópico só —
    // e a fusão não daria erro nenhum, as questões só apareceriam no lugar
    // errado do filtro.
    const comHomonimo = [...grupos, { _id: 'mod1b', name: 'Módulo I', parentGroupId: 'p2' }]
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'A', groupId: 'mod1', questions: [objetiva()] },
      { _id: 'e2', title: 'B', groupId: 'mod1b', questions: [objetiva()] },
    ]
    const nomes = mapearProvas(raiz, provas, comHomonimo).questoes.map((q) => q.topicoNome)
    expect(nomes).toEqual(['Período 1 › Módulo I', 'Período 2 › Módulo I'])
  })

  it('recusa objetiva sem gabarito', () => {
    const provas: ProvaParaImportar[] = [
      {
        _id: 'e1',
        title: 'Prova',
        groupId: 'p1',
        questions: [
          objetiva({
            alternatives: [
              { letter: 'A', text: 'Primeira', isCorrect: false },
              { letter: 'B', text: 'Segunda', isCorrect: false },
            ],
          }),
        ],
      },
    ]
    const { questoes, ignoradas } = mapearProvas(raiz, provas, grupos)
    expect(questoes).toHaveLength(0)
    expect(ignoradas[0].motivo).toContain('correta')
  })

  it('recusa objetiva com menos de duas alternativas', () => {
    const provas: ProvaParaImportar[] = [
      {
        _id: 'e1',
        title: 'Prova',
        groupId: 'p1',
        questions: [objetiva({ alternatives: [{ letter: 'A', text: 'Só uma', isCorrect: true }] })],
      },
    ]
    expect(mapearProvas(raiz, provas, grupos).ignoradas[0].motivo).toContain('duas alternativas')
  })

  it('traz discursiva usando os pontos-chave como resposta modelo', () => {
    const provas: ProvaParaImportar[] = [
      {
        _id: 'e1',
        title: 'Prova',
        groupId: 'p1',
        questions: [
          {
            id: 'q9',
            type: 'discursive',
            statement: 'Explique a fisiopatologia.',
            keyPoints: [{ description: 'Cita a inflamação' }, { description: 'Cita a fibrose' }],
          },
        ],
      },
    ]
    const q = mapearProvas(raiz, provas, grupos).questoes[0]
    expect(q.tipo).toBe('discursiva')
    expect(q.respostaModelo).toBe('• Cita a inflamação\n• Cita a fibrose')
  })

  it('deixa a redação de fora, dizendo por quê', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'Prova', groupId: 'p1', questions: [{ id: 'q1', type: 'essay', statement: 'Tema' }] },
    ]
    const { questoes, ignoradas } = mapearProvas(raiz, provas, grupos)
    expect(questoes).toHaveLength(0)
    expect(ignoradas[0].motivo).toContain('Redação')
  })

  it('usa a data da prova só quando o título não diz o período', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'P', groupId: 'p1', startTime: '2023-04-10T12:00:00Z', questions: [objetiva()] },
    ]
    const questao = mapearProvas(raiz, provas, grupos).questoes[0]
    expect(questao.ano).toBe(2023)
    expect(questao.periodoLetivo).toBeUndefined()
  })

  it('lê o período letivo do título, e não da data em que a prova foi cadastrada', () => {
    // O caso que motivou a mudança: prova de 2023.2 digitada na plataforma em
    // 2026. A data diria 2026; o título diz a verdade.
    const provas: ProvaParaImportar[] = [
      {
        _id: 'e1',
        title: 'N1 SOI I - 2023.2',
        groupId: 'p1',
        createdAt: '2026-03-01T12:00:00Z',
        questions: [objetiva()],
      },
    ]
    const questao = mapearProvas(raiz, provas, grupos).questoes[0]
    expect(questao.ano).toBe(2023)
    expect(questao.semestre).toBe(2)
    expect(questao.periodoLetivo).toBe('2023.2')
  })

  it('aceita o título sem semestre sem inventar um', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'Simulado 2024', groupId: 'p1', questions: [objetiva()] },
    ]
    const questao = mapearProvas(raiz, provas, grupos).questoes[0]
    expect(questao.ano).toBe(2024)
    expect(questao.semestre).toBeUndefined()
    expect(questao.periodoLetivo).toBeUndefined()
  })
})

describe('montarEnunciado', () => {
  it('junta enunciado e comando', () => {
    expect(montarEnunciado({ statement: 'Texto.', command: 'Assinale.' })).toBe('Texto.\n\nAssinale.')
  })

  it('não repete o comando quando ele já está no enunciado', () => {
    expect(montarEnunciado({ statement: 'Texto. Assinale.', command: 'Assinale.' })).toBe('Texto. Assinale.')
  })

  it('aguenta faltar um dos dois', () => {
    expect(montarEnunciado({ command: 'Só o comando' })).toBe('Só o comando')
    expect(montarEnunciado({ statement: 'Só o enunciado' })).toBe('Só o enunciado')
    expect(montarEnunciado({})).toBe('')
  })
})

describe('montarExplicacao', () => {
  it('monta o comentário por alternativa em ordem', () => {
    const texto = montarExplicacao({
      commentedFeedback: { explanations: { B: 'Erra porque…', A: 'Certa porque…' } },
    })
    expect(texto).toContain('**A)** Certa porque…')
    expect(texto!.indexOf('**A)**')).toBeLessThan(texto!.indexOf('**B)**'))
  })

  it('junta a explicação avulsa com o comentário por alternativa', () => {
    const texto = montarExplicacao({
      explanation: 'Visão geral.',
      commentedFeedback: { explanations: { A: 'Certa.' } },
    })
    expect(texto).toContain('Visão geral.')
    expect(texto).toContain('**A)** Certa.')
  })

  it('devolve indefinido quando não há nada', () => {
    expect(montarExplicacao({})).toBeUndefined()
    expect(montarExplicacao({ commentedFeedback: { explanations: { A: '   ' } } })).toBeUndefined()
  })
})

describe('origem e hierarquia', () => {
  it('a chave de origem é estável', () => {
    expect(chaveDeOrigem({ tipo: 'prova', examId: 'e1', questaoId: 'q1' })).toBe('prova:e1:q1')
  })

  it('lista a hierarquia sem repetição', () => {
    const provas: ProvaParaImportar[] = [
      { _id: 'e1', title: 'Prova A', groupId: 'p1', questions: [objetiva(), objetiva({ id: 'q2' })] },
      { _id: 'e2', title: 'Prova B', groupId: 'p1', questions: [objetiva({ id: 'q3' })] },
    ]
    const { questoes } = mapearProvas(raiz, provas, grupos)
    const { modulos, topicos, subtopicos } = hierarquiaNecessaria(questoes)
    expect(modulos.size).toBe(1)
    expect(topicos.size).toBe(1)
    // Uma prova = um subtópico, mesmo com várias questões dentro.
    expect(subtopicos.size).toBe(2)
  })
})
