import { describe, expect, it } from 'vitest'

import {
  HISTORY_LIMIT,
  type HistoryEntry,
  invertEntry,
  invertOp,
  pushEntry,
} from '@/lib/pdf-viewer-history'

/**
 * Desfazer/refazer das anotações. O que estes testes protegem é a propriedade
 * que o usuário sente: desfazer devolve exatamente o estado anterior, e uma
 * ação do usuário — mesmo quando mexe em seis anotações — é UM toque de
 * desfazer, não seis.
 */

type Payload = { content: string }

describe('invertOp', () => {
  it('criar e apagar são o inverso um do outro', () => {
    const add = { kind: 'add' as const, clientId: 'a', payload: { content: 'traço' } }
    expect(invertOp(add)).toEqual({ kind: 'remove', clientId: 'a', payload: { content: 'traço' } })
    expect(invertOp(invertOp(add))).toEqual(add)
  })

  it('edição inverte trocando antes por depois', () => {
    const update = {
      kind: 'update' as const,
      clientId: 'a',
      before: { content: 'antes' },
      after: { content: 'depois' },
    }
    expect(invertOp(update)).toEqual({
      kind: 'update',
      clientId: 'a',
      before: { content: 'depois' },
      after: { content: 'antes' },
    })
    expect(invertOp(invertOp(update))).toEqual(update)
  })
})

describe('invertEntry', () => {
  it('desfaz o lote de trás para a frente', () => {
    // Uma passada da borracha precisa: apagou o traço original e criou dois
    // pedaços. Desfazer tem que TIRAR os pedaços antes de devolver o original,
    // senão os três coexistem por um instante.
    const entry: HistoryEntry<Payload> = [
      { kind: 'remove', clientId: 'original', payload: { content: 'inteiro' } },
      { kind: 'add', clientId: 'pedaco-1', payload: { content: 'esquerda' } },
      { kind: 'add', clientId: 'pedaco-2', payload: { content: 'direita' } },
    ]
    expect(invertEntry(entry).map((op) => [op.kind, op.clientId])).toEqual([
      ['remove', 'pedaco-2'],
      ['remove', 'pedaco-1'],
      ['add', 'original'],
    ])
  })

  it('inverter duas vezes devolve o lote original', () => {
    const entry: HistoryEntry<Payload> = [
      { kind: 'add', clientId: 'a', payload: { content: 'um' } },
      { kind: 'update', clientId: 'b', before: { content: 'x' }, after: { content: 'y' } },
    ]
    expect(invertEntry(invertEntry(entry))).toEqual(entry)
  })
})

describe('pushEntry', () => {
  it('lote vazio não vira passo de desfazer', () => {
    const stack: Array<HistoryEntry<Payload>> = []
    expect(pushEntry(stack, [])).toBe(stack)
  })

  it('descarta o passo mais antigo ao encher', () => {
    let stack: Array<HistoryEntry<Payload>> = []
    for (let index = 0; index < HISTORY_LIMIT + 5; index++) {
      stack = pushEntry(stack, [{ kind: 'add', clientId: `id-${index}`, payload: { content: String(index) } }])
    }
    expect(stack).toHaveLength(HISTORY_LIMIT)
    expect(stack[0][0].clientId).toBe('id-5')
    expect(stack[stack.length - 1][0].clientId).toBe(`id-${HISTORY_LIMIT + 4}`)
  })

  it('não mexe na pilha recebida', () => {
    const stack: Array<HistoryEntry<Payload>> = [[{ kind: 'add', clientId: 'a', payload: { content: 'um' } }]]
    const next = pushEntry(stack, [{ kind: 'add', clientId: 'b', payload: { content: 'dois' } }])
    expect(stack).toHaveLength(1)
    expect(next).toHaveLength(2)
  })
})
