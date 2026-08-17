import { describe, it, expect } from 'vitest'
import {
  descreverAvaliacao,
  exigeAvaliacao,
  motivoDoBloqueio,
  normalizarAvaliacao,
} from '@/lib/aulas/avaliacao'

const ID = '507f1f77bcf86cd799439011'

describe('normalizarAvaliacao', () => {
  it('aceita um id de prova válido', () => {
    expect(normalizarAvaliacao({ examId: ID })).toEqual({
      examId: ID,
      titulo: '',
      obrigatoria: false,
    })
  })

  it('descarta id inválido em vez de gravar um vínculo quebrado', () => {
    expect(normalizarAvaliacao({ examId: 'nao-e-um-id' })).toBeNull()
    expect(normalizarAvaliacao({ examId: '' })).toBeNull()
    expect(normalizarAvaliacao({})).toBeNull()
  })

  it('trata null, undefined e tipos errados como "sem avaliação"', () => {
    expect(normalizarAvaliacao(null)).toBeNull()
    expect(normalizarAvaliacao(undefined)).toBeNull()
    expect(normalizarAvaliacao('507f1f77bcf86cd799439011')).toBeNull()
  })

  it('não liga a obrigatoriedade sozinha', () => {
    // O valor tem de ser exatamente `true`. Uma string vinda de formulário não
    // pode acabar prendendo o aluno no meio do curso.
    expect(normalizarAvaliacao({ examId: ID, obrigatoria: 'sim' })?.obrigatoria).toBe(false)
    expect(normalizarAvaliacao({ examId: ID, obrigatoria: 1 })?.obrigatoria).toBe(false)
    expect(normalizarAvaliacao({ examId: ID, obrigatoria: true })?.obrigatoria).toBe(true)
  })

  it('apara espaços e corta título muito longo', () => {
    const saida = normalizarAvaliacao({ examId: `  ${ID}  `, titulo: 'x'.repeat(300) })
    expect(saida?.examId).toBe(ID)
    expect(saida?.titulo).toHaveLength(160)
  })

  it('aceita id em maiúsculas', () => {
    expect(normalizarAvaliacao({ examId: ID.toUpperCase() })?.examId).toBe(ID.toUpperCase())
  })
})

describe('exigeAvaliacao', () => {
  it('só trava quando o admin pediu', () => {
    expect(exigeAvaliacao({ examId: ID })).toBe(false)
    expect(exigeAvaliacao({ examId: ID, obrigatoria: false })).toBe(false)
    expect(exigeAvaliacao({ examId: ID, obrigatoria: true })).toBe(true)
  })

  it('sem prova não há trava, mesmo marcada como obrigatória', () => {
    expect(exigeAvaliacao(null)).toBe(false)
    expect(exigeAvaliacao({ examId: '', obrigatoria: true })).toBe(false)
  })
})

describe('motivoDoBloqueio', () => {
  it('nomeia a prova quando ela tem título', () => {
    expect(motivoDoBloqueio({ examId: ID, titulo: 'Prova de Cardiologia I' })).toContain(
      'Prova de Cardiologia I',
    )
  })

  it('cai numa frase genérica sem título', () => {
    expect(motivoDoBloqueio({ examId: ID })).toBe(
      'Conclua a avaliação desta aula para marcá-la como concluída.',
    )
  })
})

describe('descreverAvaliacao', () => {
  it('muda conforme obrigatoriedade e entrega', () => {
    expect(descreverAvaliacao({ examId: ID, obrigatoria: true }, false)).toBe(
      'Necessária para concluir a aula.',
    )
    expect(descreverAvaliacao({ examId: ID }, false)).toBe('Teste o que você acabou de ver.')
    expect(descreverAvaliacao({ examId: ID, obrigatoria: true }, true)).toContain('já fez')
  })
})
