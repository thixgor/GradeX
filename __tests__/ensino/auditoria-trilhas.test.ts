import { describe, expect, it } from 'vitest'
import {
  auditarReferenciasDeTrilhas,
  indexarAulasPorTitulo,
  resumirAuditoria,
  type TrilhaParaAuditar,
} from '@/lib/ensino/auditoria-trilhas'
import type { EtapaDaTrilha } from '@/lib/ensino/trilha'

const id = (n: number) => String(n).padStart(24, 'a')

function trilha(etapas: EtapaDaTrilha[], overrides: Partial<TrilhaParaAuditar> = {}): TrilhaParaAuditar {
  return { _id: id(1), titulo: 'Trilha de teste', slug: 'trilha-de-teste', etapas, ...overrides }
}

describe('auditarReferenciasDeTrilhas', () => {
  it('marca como válida uma referência cujo id existe no acervo', () => {
    const t = trilha([
      { id: 'e1', titulo: 'Etapa', itens: [{ id: 'i1', tipo: 'aula', refId: id(2), obrigatorio: true }] },
    ])
    const [r] = auditarReferenciasDeTrilhas([t], new Set([id(2)]), new Map())
    expect(r.status).toBe('valida')
  })

  it('marca como órfã sem título quando o id não existe e não há rotulo salvo', () => {
    const t = trilha([
      { id: 'e1', titulo: 'Etapa', itens: [{ id: 'i1', tipo: 'aula', refId: id(2), obrigatorio: true }] },
    ])
    const [r] = auditarReferenciasDeTrilhas([t], new Set(), new Map())
    expect(r.status).toBe('orfa-sem-titulo')
  })

  it('recupera pelo título quando existe exatamente uma aula viva com o título salvo', () => {
    const t = trilha([
      {
        id: 'e1',
        titulo: 'Etapa',
        itens: [{ id: 'i1', tipo: 'aula', refId: id(2), rotulo: 'Lei de Frank-Starling', obrigatorio: true }],
      },
    ])
    const indice = indexarAulasPorTitulo([{ _id: id(3), titulo: 'Lei de Frank-Starling' }])
    const [r] = auditarReferenciasDeTrilhas([t], new Set(), indice)
    expect(r.status).toBe('recuperavel')
    expect(r.sugestao).toEqual({ id: id(3), titulo: 'Lei de Frank-Starling' })
  })

  it('a recuperação por título ignora maiúscula/minúscula, acento, espaço duplicado e o tipo de traço', () => {
    const t = trilha([
      {
        id: 'e1',
        titulo: 'Etapa',
        itens: [
          { id: 'i1', tipo: 'aula', refId: id(2), rotulo: '  lei DE frank—starling  ', obrigatorio: true },
        ],
      },
    ])
    const indice = indexarAulasPorTitulo([{ _id: id(3), titulo: 'Lei de Frank-Starling' }])
    const [r] = auditarReferenciasDeTrilhas([t], new Set(), indice)
    expect(r.status).toBe('recuperavel')
    expect(r.sugestao?.id).toBe(id(3))
  })

  it('marca como ambígua quando duas aulas vivas compartilham o título normalizado', () => {
    const t = trilha([
      {
        id: 'e1',
        titulo: 'Etapa',
        itens: [{ id: 'i1', tipo: 'aula', refId: id(2), rotulo: 'Fisiologia', obrigatorio: true }],
      },
    ])
    const indice = indexarAulasPorTitulo([
      { _id: id(3), titulo: 'Fisiologia' },
      { _id: id(4), titulo: 'Fisiologia' },
    ])
    const [r] = auditarReferenciasDeTrilhas([t], new Set(), indice)
    expect(r.status).toBe('ambigua')
    expect(r.candidatos).toHaveLength(2)
  })

  it('marca como órfã irrecuperável quando há título salvo mas nenhuma aula viva casa', () => {
    const t = trilha([
      {
        id: 'e1',
        titulo: 'Etapa',
        itens: [{ id: 'i1', tipo: 'aula', refId: id(2), rotulo: 'Aula que não existe mais', obrigatorio: true }],
      },
    ])
    const [r] = auditarReferenciasDeTrilhas([t], new Set(), new Map())
    expect(r.status).toBe('orfa-irrecuperavel')
  })

  it('ignora itens que não são do tipo aula', () => {
    const t = trilha([
      {
        id: 'e1',
        titulo: 'Etapa',
        itens: [{ id: 'i1', tipo: 'link', refId: '', url: 'https://exemplo.com', obrigatorio: false }],
      },
    ])
    const r = auditarReferenciasDeTrilhas([t], new Set(), new Map())
    expect(r).toHaveLength(0)
  })

  it('percorre todas as trilhas e etapas dadas', () => {
    const t1 = trilha(
      [{ id: 'e1', titulo: 'Etapa', itens: [{ id: 'i1', tipo: 'aula', refId: id(2), obrigatorio: true }] }],
      { _id: id(1) },
    )
    const t2 = trilha(
      [{ id: 'e1', titulo: 'Etapa', itens: [{ id: 'i1', tipo: 'aula', refId: id(3), obrigatorio: true }] }],
      { _id: id(5) },
    )
    const r = auditarReferenciasDeTrilhas([t1, t2], new Set([id(2), id(3)]), new Map())
    expect(r).toHaveLength(2)
    expect(r.every((x) => x.status === 'valida')).toBe(true)
  })
})

describe('resumirAuditoria', () => {
  it('conta cada status corretamente', () => {
    const referencias = auditarReferenciasDeTrilhas(
      [
        trilha([
          {
            id: 'e1',
            titulo: 'Etapa',
            itens: [
              { id: 'i1', tipo: 'aula', refId: id(2), obrigatorio: true },
              { id: 'i2', tipo: 'aula', refId: id(3), rotulo: 'Recuperável', obrigatorio: true },
              { id: 'i3', tipo: 'aula', refId: id(4), obrigatorio: true },
            ],
          },
        ]),
      ],
      new Set([id(2)]),
      indexarAulasPorTitulo([{ _id: id(9), titulo: 'Recuperável' }]),
    )

    const resumo = resumirAuditoria(1, referencias)
    expect(resumo).toEqual({
      trilhasAnalisadas: 1,
      referencias: 3,
      validas: 1,
      recuperaveis: 1,
      ambiguas: 0,
      orfasSemTitulo: 1,
      orfasIrrecuperaveis: 0,
    })
  })
})

describe('indexarAulasPorTitulo', () => {
  it('agrupa aulas pelo título normalizado', () => {
    const indice = indexarAulasPorTitulo([
      { _id: id(1), titulo: 'Débito Cardíaco' },
      { _id: id(2), titulo: 'débito cardíaco' },
      { _id: id(3), titulo: 'Outra aula' },
    ])
    expect(indice.get('debito-cardiaco')).toHaveLength(2)
    expect(indice.get('outra-aula')).toHaveLength(1)
  })

  it('ignora aulas sem título', () => {
    const indice = indexarAulasPorTitulo([{ _id: id(1), titulo: '' }])
    expect(indice.size).toBe(0)
  })
})
