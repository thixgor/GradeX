import { describe, expect, it } from 'vitest'
import { ObjectId } from 'mongodb'
import { montarResumoDeEstudo, totalDoDia } from '@/lib/estudo/resumo-de-estudo'

const USER = new ObjectId().toHexString()
const PROVA_ENCERRADA = new ObjectId()
const PROVA_EM_ANDAMENTO = new ObjectId()
const AGORA = new Date('2026-10-26T15:00:00Z')

const questoes = [
  { id: 'q1', type: 'multiple-choice', alternatives: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] },
  { id: 'q2', type: 'multiple-choice', alternatives: [{ id: 'a', isCorrect: true }, { id: 'b', isCorrect: false }] },
]

/** Banco falso: cada coleção devolve as linhas já agregadas que o Mongo devolveria. */
function bancoFalso(linhas: Record<string, unknown[]>) {
  return {
    collection: (nome: string) => ({
      aggregate: () => ({ toArray: async () => linhas[nome] ?? [] }),
      find: () => ({ toArray: async () => linhas[`${nome}:find`] ?? [] }),
    }),
  } as any
}

describe('montarResumoDeEstudo', () => {
  const db = bancoFalso({
    submissions: [
      {
        examId: PROVA_ENCERRADA.toHexString(),
        submittedAt: new Date('2026-10-25T14:00:00Z'),
        triScore: 612.4,
        respostas: [
          { questionId: 'q1', selectedAlternative: 'a' },
          { questionId: 'q2', selectedAlternative: 'b' },
        ],
      },
      {
        examId: PROVA_EM_ANDAMENTO.toHexString(),
        submittedAt: new Date('2026-10-26T14:00:00Z'),
        triScore: 700,
        respostas: [{ questionId: 'q1', selectedAlternative: 'a' }, { questionId: 'q2' }],
      },
    ],
    'exams:find': [
      { _id: PROVA_ENCERRADA, endTime: new Date('2026-10-25T16:00:00Z'), questions: questoes },
      { _id: PROVA_EM_ANDAMENTO, endTime: new Date('2026-10-26T18:00:00Z'), questions: questoes },
    ],
    banco_resolucoes: [
      {
        porDia: [{ _id: '2026-10-26', total: 5, objetivas: 4, acertos: 3 }],
        questoes: [{ n: 4 }],
        discursivas: [{ n: 1 }],
      },
    ],
    flashcardManualSessions: [{ porDia: [{ _id: '2026-10-24', total: 10, errei: 3 }], cartas: [{ n: 8 }] }],
    flashcardSpacedProgress: [{ dominadas: 2, noCaderno: 3 }],
    activity_events: [
      { _id: { kind: 'material_open', dia: '2026-10-26', recurso: 'm1' }, n: 2, acertos: 0, total: 0 },
      { _id: { kind: 'anatomia_open', dia: '2026-10-26', recurso: '/atlas/x' }, n: 1, acertos: 0, total: 0 },
      { _id: { kind: 'anatomia_quiz', dia: '2026-10-26', recurso: 'quiz:1' }, n: 1, acertos: 7, total: 10 },
    ],
    material_pdf_viewer_logs: [{ _id: { dia: '2026-10-26', recurso: 'm1' } }, { _id: { dia: '2026-10-26', recurso: 'm2' } }],
    'focus-sessions': [{ _id: '2026-10-26', ms: 50 * 60_000, n: 2 }],
  })

  it('junta todas as frentes e só conta o acerto da prova que já terminou', async () => {
    const r = await montarResumoDeEstudo(db, USER, { agora: AGORA })

    expect(r.provas).toMatchObject({ entregues: 2, respondidas: 3, objetivasRespondidas: 2, acertos: 1, aguardandoTermino: 1 })
    // Só a prova encerrada entra na curva: 1 de 2 objetivas, com a TRI junto.
    expect(r.notasDasProvas).toEqual([expect.objectContaining({ acerto: 50, acertos: 1, objetivas: 2, tri: 612 })])
    expect(r.banco).toMatchObject({ resolucoes: 5, questoes: 4, objetivas: 4, acertos: 3, erros: 1, acuracia: 75 })
    expect(r.flashcards).toMatchObject({ revisoes: 10, lembrei: 7, errei: 3, acuracia: 70, dominadas: 2, noCaderno: 3 })
    // m1 aberto pela página e pelo leitor no mesmo dia conta uma vez.
    expect(r.materiais).toEqual({ estudados: 2, aberturas: 4 })
    expect(r.anatomia).toMatchObject({ pranchas: 1, quizzes: 1, quizQuestoes: 10, quizAcertos: 7, acuracia: 70 })
    expect(r.foco).toMatchObject({ sessoes: 2, minutos: 50, minutosHoje: 50, minutosNaSemana: 50 })

    const hoje = r.porDia['2026-10-26']
    expect(hoje).toMatchObject({ banco: 5, provas: 1, materiais: 2, anatomia: 11, focoMin: 50 })
    expect(totalDoDia(hoje)).toBe(19)
    expect(r.geral.questoes).toBe(3 + 5 + 10)
    // (1 + 3 + 7) / (2 + 4 + 10)
    expect(r.geral.acuracia).toBe(69)
    // 24, 25 e 26 de outubro: três dias seguidos, com estudo hoje.
    expect(r.geral).toMatchObject({ sequencia: 3, estudouHoje: true, diasAtivos: 3 })
  })

  it('sai com zeros quando uma fonte falha, em vez de derrubar o resumo', async () => {
    const quebrado = {
      collection: () => ({
        aggregate: () => ({ toArray: async () => Promise.reject(new Error('fora do ar')) }),
        find: () => ({ toArray: async () => [] }),
      }),
    } as any
    const r = await montarResumoDeEstudo(quebrado, USER, { agora: AGORA })
    expect(r.geral).toMatchObject({ questoes: 0, acuracia: null, sequencia: 0 })
  })
})
