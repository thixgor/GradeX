import { describe, it, expect } from 'vitest'
import { podeMoverProva, resumirMovimentacao } from '@/lib/provas/mover-provas'
import type { GrupoNaArvore } from '@/lib/provas/arvore-grupos'

const geral: GrupoNaArvore = { _id: 'g', name: 'Geral', type: 'general' }
const meu: GrupoNaArvore = { _id: 'm', name: 'Meu', type: 'personal', createdBy: 'u1' }
const dela: GrupoNaArvore = { _id: 'd', name: 'Dela', type: 'personal', createdBy: 'u2' }

const admin = { id: 'adm', ehAdmin: true }
const u1 = { id: 'u1', ehAdmin: false }

describe('podeMoverProva', () => {
  it('deixa o dono mover a própria prova entre grupos pessoais', () => {
    expect(podeMoverProva({ createdBy: 'u1' }, null, meu, u1)).toEqual({ ok: true })
  })

  it('deixa admin mover qualquer prova', () => {
    expect(podeMoverProva({ createdBy: 'u2' }, geral, geral, admin).ok).toBe(true)
  })

  it('impede usuário comum de tirar prova de grupo geral', () => {
    const v = podeMoverProva({ createdBy: 'u1' }, geral, meu, u1)
    expect(v.ok).toBe(false)
    expect(v.motivo).toContain('administradores')
  })

  it('impede usuário comum de pôr prova em grupo geral', () => {
    expect(podeMoverProva({ createdBy: 'u1' }, null, geral, u1).ok).toBe(false)
  })

  it('impede mexer em prova de outra pessoa', () => {
    expect(podeMoverProva({ createdBy: 'u2' }, null, meu, u1).ok).toBe(false)
  })

  it('impede usar grupo pessoal de outra pessoa como destino', () => {
    expect(podeMoverProva({ createdBy: 'u1' }, null, dela, u1).ok).toBe(false)
  })

  it('permite tirar a prova de qualquer grupo (destino nulo)', () => {
    expect(podeMoverProva({ createdBy: 'u1' }, meu, null, u1).ok).toBe(true)
  })
})

describe('resumirMovimentacao', () => {
  it('conta no singular e no plural', () => {
    expect(resumirMovimentacao(1, 0)).toBe('1 prova movida.')
    expect(resumirMovimentacao(12, 0)).toBe('12 provas movidas.')
  })

  it('não esconde o que ficou para trás', () => {
    // O caso mais provável de um lote é o parcial; um resumo que só diz "ok"
    // faz o admin fechar o diálogo achando que terminou.
    expect(resumirMovimentacao(38, 2)).toContain('2 ficaram para trás')
    expect(resumirMovimentacao(3, 1)).toContain('1 ficou para trás')
  })

  it('diz claramente quando nada moveu', () => {
    expect(resumirMovimentacao(0, 5)).toBe('Nenhuma prova foi movida.')
  })
})
