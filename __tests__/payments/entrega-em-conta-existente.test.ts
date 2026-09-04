import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

const grantSerialKeyProduct = vi.fn()
const markSerialKeyActivated = vi.fn()

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: vi.fn() }) },
}))

vi.mock('@/lib/serial-keys', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/serial-keys')>()
  return {
    ...original,
    grantSerialKeyProduct: (...args: any[]) => grantSerialKeyProduct(...args),
    markSerialKeyActivated: (...args: any[]) => markSerialKeyActivated(...args),
  }
})

import {
  accountDeliveryTargetOf,
  activateKeysForAccount,
  type AccountDeliveryTarget,
} from '@/lib/serial-key-fulfillment'
import { findAccountByEmail } from '@/lib/serial-keys'
import type { PaymentOrder, SerialKey } from '@/lib/types'

/**
 * Compra SEM LOGIN cujo e-mail já tem conta no site.
 *
 * O comprador é perguntado, antes de pagar, se quer o material aplicado direto
 * nessa conta. Quando ele diz que sim, a compra deixa de terminar numa Serial
 * Key para ativar depois: o fulfillment ativa as keys sozinho, na conta certa.
 *
 * Os casos abaixo protegem as três coisas que não podem falhar nesse caminho:
 * o destino nunca vir do navegador, o webhook do Mercado Pago poder repetir a
 * mesma notificação sem conceder o produto duas vezes, e uma falha na ativação
 * devolver a compra para o caminho da Serial Key — o comprador jamais pode
 * ficar sem o que pagou.
 */

const TARGET_ID = new ObjectId().toString()

const TARGET: AccountDeliveryTarget = {
  userId: TARGET_ID,
  email: 'aluno@exemplo.com',
  name: 'Ana Souza',
}

function makeOrder(metadata: Record<string, any>): PaymentOrder {
  return {
    _id: new ObjectId(),
    payerEmail: 'aluno@exemplo.com',
    payerName: 'Ana Souza',
    provider: 'mercado_pago',
    type: 'material',
    amount: 49,
    currency: 'BRL',
    status: 'approved',
    idempotencyKey: 'k',
    metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as PaymentOrder
}

function makeKey(overrides: Partial<SerialKey> = {}): SerialKey {
  return {
    _id: new ObjectId(),
    key: 'AAAA-BBBB-CCCC-DDDD',
    type: 'custom',
    used: false,
    generatedBy: 'system',
    generatedByName: 'Compra automática',
    generatedAt: new Date(),
    origin: 'purchase',
    status: 'unactivated',
    grant: { productType: 'material', itemType: 'material', itemId: 'm1', itemTitle: 'Resumo de Farmaco' },
    productType: 'material',
    buyerEmail: 'aluno@exemplo.com',
    emailHistory: [],
    ...overrides,
  } as unknown as SerialKey
}

/** Coleção mínima: só o `findOne` que `findAccountByEmail` usa. */
function fakeDbWithUser(user: any) {
  return {
    collection: () => ({ findOne: async (filter: any) => (user && user.email === filter.email ? user : null) }),
  } as any
}

beforeEach(() => {
  grantSerialKeyProduct.mockReset()
  markSerialKeyActivated.mockReset()
  grantSerialKeyProduct.mockResolvedValue({ productLabel: 'Resumo de Farmaco', redirectTo: '/materiais/m1' })
  markSerialKeyActivated.mockResolvedValue(undefined)
})

describe('destino da compra gravado na order', () => {
  it('lê a conta de destino quando a compra foi marcada para entrega em conta', () => {
    const target = accountDeliveryTargetOf(makeOrder({
      deliveryMode: 'account',
      accountDelivery: { userId: TARGET_ID, email: 'aluno@exemplo.com', name: 'Ana Souza' },
    }))
    expect(target).toEqual({ userId: TARGET_ID, email: 'aluno@exemplo.com', name: 'Ana Souza' })
  })

  it('ignora a compra normal, que continua terminando em Serial Key', () => {
    expect(accountDeliveryTargetOf(makeOrder({ deliveryMode: 'serial_key' }))).toBeNull()
    expect(accountDeliveryTargetOf(makeOrder({}))).toBeNull()
  })

  it('recusa um id de conta que não é um ObjectId — nada de destino inventado', () => {
    const target = accountDeliveryTargetOf(makeOrder({
      deliveryMode: 'account',
      accountDelivery: { userId: '../admin', email: 'a@b.com', name: 'X' },
    }))
    expect(target).toBeNull()
  })
})

describe('procura da conta pelo e-mail da compra', () => {
  it('devolve só o necessário para a pergunta e para a entrega', async () => {
    const db = fakeDbWithUser({ _id: new ObjectId(TARGET_ID), name: 'Ana Souza', email: 'aluno@exemplo.com' })
    await expect(findAccountByEmail(db, '  Aluno@Exemplo.COM ')).resolves.toEqual({
      userId: TARGET_ID,
      name: 'Ana Souza',
      email: 'aluno@exemplo.com',
    })
  })

  it('e-mail sem conta e e-mail inválido devolvem nada', async () => {
    const db = fakeDbWithUser({ _id: new ObjectId(), name: 'Outro', email: 'outro@exemplo.com' })
    await expect(findAccountByEmail(db, 'aluno@exemplo.com')).resolves.toBeNull()
    await expect(findAccountByEmail(db, 'nao-e-email')).resolves.toBeNull()
  })
})

describe('aplicação das keys na conta escolhida', () => {
  it('ativa a key na conta e leva o comprador para o produto comprado', async () => {
    const key = makeKey()
    const outcome = await activateKeysForAccount({} as any, [key], TARGET)

    expect(grantSerialKeyProduct).toHaveBeenCalledTimes(1)
    expect(grantSerialKeyProduct.mock.calls[0][2]).toEqual(TARGET)
    expect(markSerialKeyActivated).toHaveBeenCalledTimes(1)
    expect(outcome.applied).toHaveLength(1)
    expect(outcome.pending).toHaveLength(0)
    expect(outcome.accessPath).toBe('/materiais/m1')
  })

  it('carrinho com vários itens manda para "meus materiais"', async () => {
    grantSerialKeyProduct
      .mockResolvedValueOnce({ productLabel: 'A', redirectTo: '/materiais/a' })
      .mockResolvedValueOnce({ productLabel: 'B', redirectTo: '/materiais/b' })

    const outcome = await activateKeysForAccount({} as any, [makeKey(), makeKey()], TARGET)

    expect(outcome.applied).toHaveLength(2)
    expect(outcome.accessPath).toBe('/materiais?tab=mine')
  })

  it('key já ativada nessa conta conta como entregue e não concede de novo', async () => {
    // O webhook do Mercado Pago repete a mesma notificação: conceder duas vezes
    // daria dois acessos (ou dois meses de plano) pelo mesmo pagamento.
    const key = makeKey({ used: true, status: 'activated', activatedByUserId: TARGET.userId })

    const outcome = await activateKeysForAccount({} as any, [key], TARGET)

    expect(grantSerialKeyProduct).not.toHaveBeenCalled()
    expect(outcome.applied).toHaveLength(1)
    expect(outcome.pending).toHaveLength(0)
  })

  it('key já ativada em OUTRA conta não é reaplicada nem reenviada', async () => {
    const key = makeKey({ used: true, status: 'activated', activatedByUserId: new ObjectId().toString() })

    const outcome = await activateKeysForAccount({} as any, [key], TARGET)

    expect(grantSerialKeyProduct).not.toHaveBeenCalled()
    expect(outcome.applied).toHaveLength(0)
    expect(outcome.pending).toHaveLength(0)
  })

  it('falha ao conceder devolve a key para o caminho da Serial Key', async () => {
    // A entrega não pode sumir porque a concessão quebrou: a key volta em
    // `pending` e o fulfillment manda o e-mail de sempre, com a key para ativar.
    grantSerialKeyProduct.mockRejectedValueOnce(new Error('banco fora do ar'))
    const key = makeKey()

    const outcome = await activateKeysForAccount({} as any, [key], TARGET)

    expect(markSerialKeyActivated).not.toHaveBeenCalled()
    expect(outcome.applied).toHaveLength(0)
    expect(outcome.pending).toEqual([key])
  })

  it('numa compra mista, só o item que falhou vira Serial Key', async () => {
    grantSerialKeyProduct
      .mockResolvedValueOnce({ productLabel: 'A', redirectTo: '/materiais/a' })
      .mockRejectedValueOnce(new Error('falhou'))
    const ok = makeKey()
    const quebrado = makeKey()

    const outcome = await activateKeysForAccount({} as any, [ok, quebrado], TARGET)

    expect(outcome.applied.map(k => String(k._id))).toEqual([String(ok._id)])
    expect(outcome.pending).toEqual([quebrado])
  })
})
