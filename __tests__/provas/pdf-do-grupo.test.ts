import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * O PDF de um grupo de provas precisa das QUESTÕES, e a tela /provas não as
 * tem.
 *
 * A listagem pede `campos=lista` de propósito — sem esse recorte, abrir
 * /provas baixa o banco de questões de todas as provas visíveis só para
 * desenhar cartões. O preço é que o objeto na mão do cliente não tem
 * `questions`, e o gerador de PDF quebrava exatamente aí:
 *
 *   TypeError: Cannot read properties of undefined (reading 'filter')
 *
 * O download de UMA prova já buscava a prova completa antes de gerar; o do
 * grupo não. A correção busca as provas do grupo em lote, por `?ids=`, e é
 * esse parâmetro que estes testes travam: uma consulta só (não uma por
 * prova), o mesmo filtro de visibilidade do resto da rota, e o gabarito
 * decidido prova a prova.
 */

const chamadas: { colecao: string; query: any; opcoes: any }[] = []

let provasNoBanco: any[] = []
let submissoesNoBanco: any[] = []
let sessao: any = { userId: 'u1', role: 'user' }

function colecaoFalsa(nome: string) {
  return {
    find(query: any, opcoes: any = {}) {
      chamadas.push({ colecao: nome, query, opcoes })
      const universo = nome === 'exams' ? provasNoBanco : submissoesNoBanco
      const ids: any[] | null = query?._id?.$in ?? null
      const examIds: any[] | null = query?.examId?.$in ?? null
      const resultado = universo.filter((doc) => {
        if (ids) return ids.some((id) => String(id) === String(doc._id))
        if (examIds) return examIds.some((id) => String(id) === String(doc.examId))
        return true
      })
      const cursor: any = {
        sort: () => cursor,
        limit: () => cursor,
        toArray: async () => resultado,
      }
      return cursor
    },
  }
}

vi.mock('@/lib/mongodb', () => ({
  default: Promise.resolve({ db: () => ({ collection: colecaoFalsa }) }),
  getDb: async () => ({ collection: colecaoFalsa }),
}))

vi.mock('@/lib/auth', () => ({
  getSession: async () => sessao,
}))

import { GET } from '@/app/api/exams/route'

const ID_A = '507f1f77bcf86cd799439011'
const ID_B = '507f1f77bcf86cd799439012'

function questao(numero: number) {
  return {
    number: numero,
    text: `Questão ${numero}`,
    alternatives: [
      { letter: 'A', text: 'a', isCorrect: true },
      { letter: 'B', text: 'b', isCorrect: false },
    ],
    explanation: 'porque sim',
  }
}

function pedir(url: string) {
  return GET({ nextUrl: new URL(url) } as any)
}

beforeEach(() => {
  chamadas.length = 0
  sessao = { userId: 'u1', role: 'user' }
  submissoesNoBanco = []
  provasNoBanco = [
    {
      _id: ID_A,
      title: 'Prova A',
      isPracticeExam: true,
      createdBy: 'outro',
      questions: [questao(1), questao(2)],
    },
    {
      _id: ID_B,
      title: 'Prova B',
      isPracticeExam: false,
      createdBy: 'outro',
      endTime: new Date(Date.now() + 86_400_000).toISOString(),
      questions: [questao(1)],
    },
  ]
})

describe('GET /api/exams?ids=', () => {
  it('devolve as provas COM as questões — é o que faltava ao PDF do grupo', async () => {
    const res = await pedir(`https://x.test/api/exams?ids=${ID_A},${ID_B}`)
    const { exams } = await res.json()

    expect(exams).toHaveLength(2)
    for (const prova of exams) {
      expect(Array.isArray(prova.questions)).toBe(true)
      expect(prova.questions.length).toBeGreaterThan(0)
    }
  })

  it('busca o grupo inteiro numa consulta só, não uma por prova', async () => {
    await pedir(`https://x.test/api/exams?ids=${ID_A},${ID_B}`)

    const consultasDeProvas = chamadas.filter((c) => c.colecao === 'exams')
    expect(consultasDeProvas).toHaveLength(1)
    expect(consultasDeProvas[0].query._id.$in).toHaveLength(2)
  })

  it('mantém o filtro de visibilidade: pedir um id não abre prova escondida', async () => {
    await pedir(`https://x.test/api/exams?ids=${ID_A}`)

    const { query } = chamadas.find((c) => c.colecao === 'exams')!
    expect(query.isDeleted).toEqual({ $ne: true })
    expect(Array.isArray(query.$or)).toBe(true)
  })

  it('ignora id malformado em vez de estourar no ObjectId', async () => {
    const res = await pedir('https://x.test/api/exams?ids=nao-e-um-id')
    expect(res.status).toBe(200)
    expect((await res.json()).exams).toEqual([])
    expect(chamadas.filter((c) => c.colecao === 'exams')).toHaveLength(0)
  })

  it('esconde o gabarito da prova avaliativa que a pessoa ainda não entregou', async () => {
    const res = await pedir(`https://x.test/api/exams?ids=${ID_B}`)
    const { exams } = await res.json()

    expect(exams[0].questions[0].alternatives.every((a: any) => !a.isCorrect)).toBe(true)
    expect(exams[0].questions[0].explanation).toBeUndefined()
  })

  it('entrega o gabarito de quem já entregou — e faz essa conta numa consulta só', async () => {
    submissoesNoBanco = [{ examId: ID_B, userId: 'u1' }]

    const res = await pedir(`https://x.test/api/exams?ids=${ID_A},${ID_B}`)
    const { exams } = await res.json()

    const provaB = exams.find((p: any) => p.title === 'Prova B')
    expect(provaB.questions[0].alternatives.some((a: any) => a.isCorrect)).toBe(true)
    expect(chamadas.filter((c) => c.colecao === 'submissions')).toHaveLength(1)
  })

  it('não vai às submissões quando nenhuma prova depende disso', async () => {
    // Prova de treino: o gabarito é o recurso, e `podeVerGabarito` já libera.
    await pedir(`https://x.test/api/exams?ids=${ID_A}`)
    expect(chamadas.filter((c) => c.colecao === 'submissions')).toHaveLength(0)
  })

  it('sem `ids`, a listagem segue enxuta e sem consulta de submissões', async () => {
    await pedir('https://x.test/api/exams?campos=lista')

    const consulta = chamadas.find((c) => c.colecao === 'exams')!
    expect(consulta.opcoes.projection).toBeTruthy()
    expect(consulta.opcoes.projection.questions).toBeUndefined()
    expect(chamadas.filter((c) => c.colecao === 'submissions')).toHaveLength(0)
  })
})
