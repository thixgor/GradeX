import { describe, expect, it } from 'vitest'
import {
  CAMPOS_DE_NOTA,
  MOTIVO_NOTA_PRESA,
  notaLiberadaParaOAluno,
  prepararSubmissaoParaEntrega,
  resolverNotaDaProva,
  sanitizarNotaDaSubmissao,
} from '@/lib/provas/nota-da-prova'
import { podeVerGabarito } from '@/lib/provas/sanitizar-prova'

const ALUNO = { userId: 'aluno-1', isAdmin: false, jaSubmeteu: true }
const ADMIN = { userId: 'admin-1', isAdmin: true }

/** Prova aplicada à turma: começa 14h, termina 18h. */
function agendada(campos: Record<string, any> = {}) {
  return {
    startTime: new Date('2026-05-10T14:00:00Z'),
    endTime: new Date('2026-05-10T18:00:00Z'),
    totalPoints: 100,
    ...campos,
  } as any
}

/** Quem entregou às 14h05 e quer a nota com a turma respondendo. */
const DURANTE = new Date('2026-05-10T14:05:00Z')
const DEPOIS = new Date('2026-05-10T18:00:01Z')

function submissao(campos: Record<string, any> = {}) {
  return {
    examId: 'p1',
    userId: 'aluno-1',
    userName: 'Aluno',
    answers: [{ questionId: 'q1', selectedAlternative: 'a' }],
    score: 72,
    triScore: 610,
    discursiveScore: 8,
    corrections: [{ questionId: 'q2', score: 8, maxScore: 10, feedback: 'faltou citar X' }],
    correctionStatus: 'corrected',
    submittedAt: DURANTE,
    ...campos,
  } as any
}

describe('notaLiberadaParaOAluno', () => {
  it('a nota não sai com a prova em andamento', () => {
    expect(notaLiberadaParaOAluno(agendada(), { ...ALUNO, agora: DURANTE })).toBe(false)
  })

  it('sai quando a prova termina', () => {
    expect(notaLiberadaParaOAluno(agendada(), { ...ALUNO, agora: DEPOIS })).toBe(true)
  })

  it('entregar cedo não antecipa a nota', () => {
    // `jaSubmeteu` é exatamente o que NÃO pode liberar: quem entrega às 14h05
    // saberia quantas acertou enquanto a turma responde até as 18h.
    expect(notaLiberadaParaOAluno(agendada(), { ...ALUNO, jaSubmeteu: true, agora: DURANTE })).toBe(
      false,
    )
  })

  it('o admin vê a nota na hora', () => {
    expect(notaLiberadaParaOAluno(agendada(), { ...ADMIN, agora: DURANTE })).toBe(true)
  })

  it('treino e prova pessoal têm nota imediata — não há turma esperando', () => {
    expect(
      notaLiberadaParaOAluno(agendada({ isPracticeExam: true }), { ...ALUNO, agora: DURANTE }),
    ).toBe(true)
    expect(
      notaLiberadaParaOAluno(agendada({ isPersonalExam: true }), { ...ALUNO, agora: DURANTE }),
    ).toBe(true)
  })

  it('quem criou a prova vê a nota dela', () => {
    expect(
      notaLiberadaParaOAluno(agendada({ createdBy: 'aluno-1' }), { ...ALUNO, agora: DURANTE }),
    ).toBe(true)
  })

  it('segue o MESMO critério do gabarito, caso a caso', () => {
    const casos = [
      agendada(),
      agendada({ isPracticeExam: true }),
      agendada({ isPersonalExam: true }),
      agendada({ createdBy: 'aluno-1' }),
      agendada({ endTime: new Date('2026-05-10T14:00:00Z') }),
    ]
    for (const prova of casos) {
      for (const agora of [DURANTE, DEPOIS]) {
        expect(notaLiberadaParaOAluno(prova, { ...ALUNO, agora })).toBe(
          podeVerGabarito(prova, { ...ALUNO, agora }),
        )
      }
    }
  })
})

describe('resolverNotaDaProva', () => {
  it('diz o motivo e quando a nota sai', () => {
    const v = resolverNotaDaProva(agendada(), { ...ALUNO, agora: DURANTE })
    expect(v.liberada).toBe(false)
    expect(v.motivo).toBe(MOTIVO_NOTA_PRESA)
    expect(v.liberaEm?.toISOString()).toBe('2026-05-10T18:00:00.000Z')
  })

  it('liberada não tem motivo nem espera', () => {
    const v = resolverNotaDaProva(agendada(), { ...ALUNO, agora: DEPOIS })
    expect(v).toEqual({ liberada: true, liberaEm: null, motivo: null })
  })
})

describe('sanitizarNotaDaSubmissao', () => {
  it('remove todos os campos de nota e marca a espera', () => {
    const limpa = sanitizarNotaDaSubmissao(submissao()) as Record<string, unknown>
    for (const campo of CAMPOS_DE_NOTA) expect(campo in limpa).toBe(false)
    expect(limpa.notaPresaAteOTermino).toBe(true)
  })

  it('as respostas da pessoa continuam ali — elas são dela', () => {
    const limpa = sanitizarNotaDaSubmissao(submissao())
    expect(limpa.answers).toHaveLength(1)
    expect(limpa.userName).toBe('Aluno')
    // "Aguardando correção" é estado do processo, não julgamento das respostas.
    expect(limpa.correctionStatus).toBe('corrected')
  })

  it('não mexe no objeto original', () => {
    const original = submissao()
    sanitizarNotaDaSubmissao(original)
    expect(original.score).toBe(72)
  })
})

describe('prepararSubmissaoParaEntrega', () => {
  it('prova em andamento: o aluno não recebe a nota', () => {
    const saida = prepararSubmissaoParaEntrega(submissao(), agendada(), {
      ...ALUNO,
      agora: DURANTE,
    }) as Record<string, unknown>
    expect(saida.score).toBeUndefined()
    expect(saida.corrections).toBeUndefined()
    expect(saida.notaPresaAteOTermino).toBe(true)
  })

  it('prova encerrada: a submissão vai inteira', () => {
    const saida = prepararSubmissaoParaEntrega(submissao(), agendada(), {
      ...ALUNO,
      agora: DEPOIS,
    }) as Record<string, unknown>
    expect(saida.score).toBe(72)
    expect(saida.corrections).toHaveLength(1)
    expect(saida.notaPresaAteOTermino).toBeUndefined()
  })

  it('admin recebe a nota durante a prova — é ele que corrige', () => {
    const saida = prepararSubmissaoParaEntrega(submissao(), agendada(), {
      ...ADMIN,
      agora: DURANTE,
    }) as Record<string, unknown>
    expect(saida.score).toBe(72)
  })

  it('prova apagada não vira porta aberta', () => {
    // Sem o documento da prova não há término a consultar: a nota espera.
    const saida = prepararSubmissaoParaEntrega(submissao(), null, {
      ...ALUNO,
      agora: DEPOIS,
    }) as Record<string, unknown>
    expect(saida.score).toBeUndefined()
  })
})
