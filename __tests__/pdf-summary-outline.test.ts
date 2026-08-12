import { describe, expect, it } from 'vitest'

import {
  buildSummaryOutline,
  findActiveSummaryId,
  outlineAncestors,
  visibleOutlineNodes,
  type SummaryOutlineEntry,
} from '@/lib/pdf-summary-outline'

function entry(id: string, page: number, level?: number): SummaryOutlineEntry {
  return { id, title: id, page, level }
}

/** Capítulo 1 com duas seções (uma delas com uma subseção) + Capítulo 2 raso. */
const SAMPLE: SummaryOutlineEntry[] = [
  entry('cap1', 1, 0),
  entry('cap1-a', 3, 1),
  entry('cap1-a-i', 5, 2),
  entry('cap1-b', 8, 1),
  entry('cap2', 14, 0),
]

describe('buildSummaryOutline', () => {
  it('pendura os subtópicos no tópico anterior', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(outline.rootIds).toEqual(['cap1', 'cap2'])
    expect(outline.byId.get('cap1')?.childIds).toEqual(['cap1-a', 'cap1-b'])
    expect(outline.byId.get('cap1-a')?.childIds).toEqual(['cap1-a-i'])
    expect(outline.byId.get('cap2')?.childIds).toEqual([])
    expect(outline.branchIds).toEqual(['cap1', 'cap1-a'])
  })

  it('conta filhos e netos para o distintivo da linha fechada', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(outline.byId.get('cap1')?.descendantCount).toBe(3)
    expect(outline.byId.get('cap1-a')?.descendantCount).toBe(1)
    expect(outline.byId.get('cap2')?.descendantCount).toBe(0)
  })

  it('usa a profundidade real quando o sumário pula um nível', () => {
    const outline = buildSummaryOutline([entry('a', 1, 1), entry('b', 2, 2)])

    // Sem nenhum nível 0 no material, `a` é raiz e `b` é filho dele: o recuo
    // desenhado acompanha a árvore, não o número declarado.
    expect(outline.rootIds).toEqual(['a'])
    expect(outline.byId.get('a')?.depth).toBe(0)
    expect(outline.byId.get('b')?.depth).toBe(1)
  })

  it('trata sumário plano (sem nível) como só raízes', () => {
    const outline = buildSummaryOutline([entry('a', 1), entry('b', 2), entry('c', 3)])

    expect(outline.rootIds).toEqual(['a', 'b', 'c'])
    expect(outline.branchIds).toEqual([])
  })

  it('ignora entradas sem id ou com id repetido', () => {
    const outline = buildSummaryOutline([
      entry('a', 1, 0),
      { id: '', title: 'sem id', page: 2, level: 1 },
      entry('a', 3, 1),
      entry('b', 4, 1),
    ])

    expect(outline.size).toBe(2)
    expect(outline.byId.get('a')?.childIds).toEqual(['b'])
  })

  it('não quebra com lista vazia', () => {
    const outline = buildSummaryOutline([])

    expect(outline.size).toBe(0)
    expect(visibleOutlineNodes(outline, new Set())).toEqual([])
  })
})

describe('outlineAncestors', () => {
  it('devolve os pais da raiz para baixo', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(outlineAncestors(outline, 'cap1-a-i')).toEqual(['cap1', 'cap1-a'])
    expect(outlineAncestors(outline, 'cap1')).toEqual([])
    expect(outlineAncestors(outline, 'inexistente')).toEqual([])
  })
})

describe('visibleOutlineNodes', () => {
  it('mostra só os tópicos quando nada está aberto', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(visibleOutlineNodes(outline, new Set()).map((node) => node.id)).toEqual(['cap1', 'cap2'])
  })

  it('abre um nível por vez, na ordem original', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(visibleOutlineNodes(outline, new Set(['cap1'])).map((node) => node.id)).toEqual([
      'cap1',
      'cap1-a',
      'cap1-b',
      'cap2',
    ])
    expect(visibleOutlineNodes(outline, new Set(['cap1', 'cap1-a'])).map((node) => node.id)).toEqual([
      'cap1',
      'cap1-a',
      'cap1-a-i',
      'cap1-b',
      'cap2',
    ])
  })

  it('não mostra neto quando o pai do meio está fechado', () => {
    const outline = buildSummaryOutline(SAMPLE)

    expect(visibleOutlineNodes(outline, new Set(['cap1-a'])).map((node) => node.id)).toEqual([
      'cap1',
      'cap2',
    ])
  })
})

describe('findActiveSummaryId', () => {
  it('pega a última seção que já começou', () => {
    expect(findActiveSummaryId(SAMPLE, 1)).toBe('cap1')
    expect(findActiveSummaryId(SAMPLE, 4)).toBe('cap1-a')
    expect(findActiveSummaryId(SAMPLE, 13)).toBe('cap1-b')
    expect(findActiveSummaryId(SAMPLE, 20)).toBe('cap2')
  })

  it('devolve vazio antes da primeira seção', () => {
    expect(findActiveSummaryId([entry('a', 5, 0)], 2)).toBe('')
  })
})
