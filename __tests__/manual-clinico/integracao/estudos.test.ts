import { describe, expect, it } from 'vitest'

import {
  MAX_ITENS_POR_ESTUDO,
  MAX_NOTA,
  acrescentarItens,
  aplicarAlteracao,
  completarEstudo,
  limparTitulo,
  refValida,
  type ItemGuardado,
} from '@/lib/manual-clinico/integracao/estudos'
import type { ItemDoManual } from '@/lib/manual-clinico/integracao/tipos'

const CONHECIDAS = new Set(['tc:carcinoma-de-celulas-renais', 'us:rins', 'orgao:rim', 'patologia:ccr'])
const conhecida = (r: string) => CONHECIDAS.has(r)
const agora = new Date('2026-10-02T12:00:00Z')

function item(ref: string, feito = false): ItemGuardado {
  return { ref, feito, adicionadoEm: agora }
}

describe('Meu Estudo — refs', () => {
  it('aceita só refs no formato do índice', () => {
    expect(refValida('tc:carcinoma-de-celulas-renais')).toBe(true)
    expect(refValida('uscena:rins/tumor-renal')).toBe(true)
    expect(refValida('javascript:alert(1)')).toBe(false)
    expect(refValida('tc:')).toBe(false)
    expect(refValida(42)).toBe(false)
  })
})

describe('Meu Estudo — acrescentar', () => {
  it('ignora repetidas, desconhecidas e malformadas', () => {
    const r = acrescentarItens(
      [item('us:rins')],
      ['us:rins', 'tc:carcinoma-de-celulas-renais', 'tc:inexistente', '<script>', 'tc:carcinoma-de-celulas-renais'],
      conhecida,
      agora,
    )
    expect(r.itens.map((i) => i.ref)).toEqual(['us:rins', 'tc:carcinoma-de-celulas-renais'])
    expect(r.acrescentados).toBe(1)
  })

  it('para no teto e conta o que ficou de fora', () => {
    const cheio = Array.from({ length: MAX_ITENS_POR_ESTUDO }, (_, i) => item(`tc:caso-${i}`))
    const r = acrescentarItens(cheio, ['us:rins', 'orgao:rim'], conhecida, agora)
    expect(r.itens).toHaveLength(MAX_ITENS_POR_ESTUDO)
    expect(r.recusados).toBe(2)
  })
})

describe('Meu Estudo — alterações', () => {
  const estado = { titulo: 'Neoplasias renais', itens: [item('us:rins'), item('orgao:rim'), item('patologia:ccr')] }

  it('renomeia saneando o título', () => {
    const r = aplicarAlteracao(estado, { acao: 'renomear', titulo: '  Rim \n e tumores  ' }, conhecida)
    expect(r.ok && r.titulo).toBe('Rim e tumores')
    expect(aplicarAlteracao(estado, { acao: 'renomear', titulo: '   ' }, conhecida).ok).toBe(false)
    expect(limparTitulo('x'.repeat(500))).toHaveLength(120)
  })

  it('marca, anota e remove', () => {
    const marcado = aplicarAlteracao(estado, { acao: 'marcar', ref: 'orgao:rim', feito: true }, conhecida)
    expect(marcado.ok && marcado.itens.find((i) => i.ref === 'orgao:rim')?.feito).toBe(true)

    const anotado = aplicarAlteracao(estado, { acao: 'anotar', ref: 'us:rins', nota: 'a'.repeat(MAX_NOTA + 50) }, conhecida)
    expect(anotado.ok && anotado.itens[0].nota).toHaveLength(MAX_NOTA)

    const semNota = aplicarAlteracao({ ...estado, itens: [{ ...item('us:rins'), nota: 'x' }] }, { acao: 'anotar', ref: 'us:rins', nota: '' }, conhecida)
    expect(semNota.ok && 'nota' in semNota.itens[0]).toBe(false)

    const removido = aplicarAlteracao(estado, { acao: 'remover', ref: 'orgao:rim' }, conhecida)
    expect(removido.ok && removido.itens.map((i) => i.ref)).toEqual(['us:rins', 'patologia:ccr'])
  })

  it('troca dois itens de lugar', () => {
    const r = aplicarAlteracao(estado, { acao: 'trocar', ref: 'patologia:ccr', com: 'us:rins' }, conhecida)
    expect(r.ok && r.itens.map((i) => i.ref)).toEqual(['patologia:ccr', 'orgao:rim', 'us:rins'])
  })

  it('recusa ação desconhecida ou corpo inválido', () => {
    expect(aplicarAlteracao(estado, { acao: 'apagar-tudo' }, conhecida).ok).toBe(false)
    expect(aplicarAlteracao(estado, null, conhecida).ok).toBe(false)
    expect(aplicarAlteracao(estado, { acao: 'marcar', ref: 'us:rins', feito: 'sim' }, conhecida).ok).toBe(false)
  })
})

describe('Meu Estudo — exibição', () => {
  it('resolve título e endereço pelo índice, nunca pelo que foi guardado', () => {
    const doc = {
      _id: { toString: () => 'abc' },
      titulo: 'Rim',
      itens: [item('us:rins', true), item('tc:sumiu')],
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const indice = new Map<string, ItemDoManual>([
      ['us:rins', { ref: 'us:rins', modulo: 'semiologia', tipo: 'Janela de ultrassom', titulo: 'Rins', href: '/manual-clinico/semiologia/ultrassom/rins', etapa: 'imagem', orgaos: ['rim'], naturezas: [], termos: ['rim'] }],
    ])
    const completo = completarEstudo(doc, (r) => indice.get(r))
    expect(completo.feitos).toBe(1)
    expect(completo.itens[0].href).toBe('/manual-clinico/semiologia/ultrassom/rins')
    expect(completo.itens[1].href).toBeUndefined()
  })
})
