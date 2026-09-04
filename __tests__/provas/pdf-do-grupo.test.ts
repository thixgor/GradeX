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
/** O documento que `users.findOne` devolve — só o período importa aqui. */
let usuarioNoBanco: any = { _id: 'u1', periodoBase: null }

function colecaoFalsa(nome: string) {
  return {
    async findOne(query: any, opcoes: any = {}) {
      chamadas.push({ colecao: nome, query, opcoes })
      if (nome === 'users') return usuarioNoBanco
      return null
    },
    find(query: any, opcoes: any = {}) {
      chamadas.push({ colecao: nome, query, opcoes })
      const universo = nome === 'exams' ? provasNoBanco : submissoesNoBanco
      const ids: any[] | null = query?._id?.$in ?? null
      void opcoes
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
  usuarioNoBanco = { _id: 'u1', periodoBase: null }
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
    // Para o aluno o filtro base fica dentro do $and, ao lado do de público.
    const base = query.$and?.[0] ?? query
    expect(base.isDeleted).toEqual({ $ne: true })
    expect(Array.isArray(base.$or)).toBe(true)
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

  it('entregar cedo NÃO abre o gabarito de prova que ainda está correndo', async () => {
    // A turma responde até amanhã; quem entregou às 14h não leva o gabarito
    // junto. Ver lib/provas/sanitizar-prova.ts.
    submissoesNoBanco = [{ examId: ID_B, userId: 'u1' }]

    const res = await pedir(`https://x.test/api/exams?ids=${ID_A},${ID_B}`)
    const { exams } = await res.json()

    const provaB = exams.find((p: any) => p.title === 'Prova B')
    expect(provaB.questions[0].alternatives.every((a: any) => !a.isCorrect)).toBe(true)
  })

  it('entrega o gabarito depois que a prova encerra', async () => {
    provasNoBanco = provasNoBanco.map((p) =>
      p._id === ID_B ? { ...p, endTime: new Date(Date.now() - 86_400_000).toISOString() } : p,
    )

    const res = await pedir(`https://x.test/api/exams?ids=${ID_B}`)
    const { exams } = await res.json()

    expect(exams[0].questions[0].alternatives.some((a: any) => a.isCorrect)).toBe(true)
  })

  it('nunca consulta submissões: o veredito do gabarito não depende mais delas', async () => {
    submissoesNoBanco = [{ examId: ID_B, userId: 'u1' }]
    await pedir(`https://x.test/api/exams?ids=${ID_A},${ID_B}`)
    expect(chamadas.filter((c) => c.colecao === 'submissions')).toHaveLength(0)
  })

  it('a listagem do aluno é filtrada pelo período dele', async () => {
    // O id da sessão precisa ser um ObjectId de verdade: é assim que ele chega
    // em produção, e `lerPeriodoDoAluno` recusa qualquer outra coisa em vez de
    // estourar (ver lib/provas/periodo-do-aluno.ts).
    const ID_ALUNO = '507f1f77bcf86cd799439099'
    sessao = { userId: ID_ALUNO, role: 'user' }
    usuarioNoBanco = { _id: ID_ALUNO, periodoBase: 3, periodoBaseRef: null }

    await pedir('https://x.test/api/exams?campos=lista')

    const { query } = chamadas.find((c) => c.colecao === 'exams')!
    const ramoDePublico = query.$and[1].$or
    expect(ramoDePublico).toContainEqual({ 'audience.periodos': 3 })
    expect(ramoDePublico).toContainEqual({ createdBy: ID_ALUNO })
  })

  it('aluno sem período não recebe a prova aplicada a um período', async () => {
    const ID_ALUNO = '507f1f77bcf86cd799439099'
    sessao = { userId: ID_ALUNO, role: 'user' }
    usuarioNoBanco = { _id: ID_ALUNO, periodoBase: null }

    await pedir('https://x.test/api/exams?campos=lista')

    const { query } = chamadas.find((c) => c.colecao === 'exams')!
    const ramoDePublico = query.$and[1].$or
    expect(JSON.stringify(ramoDePublico)).not.toContain('audience.periodos')
  })

  it('o admin não é filtrado por período', async () => {
    sessao = { userId: 'admin1', role: 'admin' }

    await pedir('https://x.test/api/exams?campos=lista')

    const { query } = chamadas.find((c) => c.colecao === 'exams')!
    expect(query.$and).toBeUndefined()
    expect(chamadas.filter((c) => c.colecao === 'users')).toHaveLength(0)
  })

  it('sem `ids`, a listagem segue enxuta e sem consulta de submissões', async () => {
    await pedir('https://x.test/api/exams?campos=lista')

    const consulta = chamadas.find((c) => c.colecao === 'exams')!
    expect(consulta.opcoes.projection).toBeTruthy()
    expect(consulta.opcoes.projection.questions).toBeUndefined()
    expect(chamadas.filter((c) => c.colecao === 'submissions')).toHaveLength(0)
  })
})
