import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

const grantSerialKeyProduct = vi.fn()
const markSerialKeyActivated = vi.fn()

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: vi.fn() }) },
}))

const createSerialKeysForOrder = vi.fn()

vi.mock('@/lib/serial-keys', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/serial-keys')>()
  return {
    ...original,
    grantSerialKeyProduct: (...args: any[]) => grantSerialKeyProduct(...args),
    markSerialKeyActivated: (...args: any[]) => markSerialKeyActivated(...args),
    createSerialKeysForOrder: (...args: any[]) => createSerialKeysForOrder(...args),
  }
})

// Um banco de mentira que só aceita as escritas de histórico de e-mail.
vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({
      updateOne: async () => undefined,
      updateMany: async () => undefined,
    }),
  }),
}))

vi.mock('@/lib/material-pdf-email', () => ({
  buildAutoEmailPdfAttachments: async () => ({ items: [], eligible: false }),
}))

// Comprovante e QR são caros e não fazem parte do que está sob teste aqui.
vi.mock('@/lib/serial-key-receipt', () => ({
  generateReceiptPdf: async () => Buffer.from(''),
  generateActivationQrBuffer: async () => Buffer.from(''),
  buildReceiptText: () => 'comprovante',
}))

const mail = {
  plano: vi.fn(),
  manualClinico: vi.fn(),
  material: vi.fn(),
  carrinho: vi.fn(),
  serialKey: vi.fn(),
  serialKeyCarrinho: vi.fn(),
}

vi.mock('@/lib/mail', () => ({
  sendPlanPurchasedEmail: (...a: any[]) => mail.plano(...a),
  sendManualClinicoPurchasedEmail: (...a: any[]) => mail.manualClinico(...a),
  sendMaterialPurchasedEmail: (...a: any[]) => mail.material(...a),
  sendCartPurchasedEmail: (...a: any[]) => mail.carrinho(...a),
  sendSerialKeyPurchaseEmail: (...a: any[]) => mail.serialKey(...a),
  sendSerialKeyCartPurchaseEmail: (...a: any[]) => mail.serialKeyCarrinho(...a),
}))

import {
  accountDeliveryTargetOf,
  activateKeysForAccount,
  fulfillSerialKeyOrder,
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
    productTitle: 'Resumo de Farmaco',
    // Sem token o envio de Serial Key desiste na entrada — e o teste do caminho
    // de recuo (concessão falhou) não veria e-mail nenhum.
    activationToken: 'tok-' + Math.random().toString(36).slice(2),
    buyerEmail: 'aluno@exemplo.com',
    buyerName: 'Ana Souza',
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
  createSerialKeysForOrder.mockReset()
  Object.values(mail).forEach(fn => fn.mockReset())
  grantSerialKeyProduct.mockResolvedValue({
    productLabel: 'Resumo de Farmaco',
    redirectTo: '/materiais/m1',
    purchase: { kind: 'material', itemType: 'material', itemTitle: 'Resumo de Farmaco' },
  })
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
  it('ativa a key na conta e guarda o que foi concedido para a confirmação', async () => {
    // Os fatos vêm da concessão, não de quem envia: é o que permite mandar a
    // MESMA confirmação do checkout logado em vez de um e-mail paralelo.
    const key = makeKey()
    const outcome = await activateKeysForAccount({} as any, [key], TARGET)

    expect(grantSerialKeyProduct).toHaveBeenCalledTimes(1)
    expect(grantSerialKeyProduct.mock.calls[0][2]).toEqual(TARGET)
    expect(markSerialKeyActivated).toHaveBeenCalledTimes(1)
    expect(outcome.applied).toHaveLength(1)
    expect(outcome.applied[0].purchase).toEqual({
      kind: 'material',
      itemType: 'material',
      itemTitle: 'Resumo de Farmaco',
    })
    expect(outcome.pending).toHaveLength(0)
  })

  it('aplica todos os itens de um carrinho na mesma conta', async () => {
    const outcome = await activateKeysForAccount({} as any, [makeKey(), makeKey()], TARGET)

    expect(outcome.applied).toHaveLength(2)
    expect(outcome.pending).toHaveLength(0)
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

    expect(outcome.applied.map(entry => String(entry.key._id))).toEqual([String(ok._id)])
    expect(outcome.pending).toEqual([quebrado])
  })
})

/**
 * Aplicado na conta = compra logada. Então a confirmação é a MESMA de
 * `lib/payments/effects` — plano, Manual Clínico, material ou carrinho —, e não
 * um e-mail paralelo falando de Serial Key que ali não existe.
 */
describe('confirmação da compra aplicada na conta', () => {
  function orderParaConta(): PaymentOrder {
    return makeOrder({
      serialKeyPurchase: true,
      deliveryMode: 'account',
      accountDelivery: { userId: TARGET_ID, email: TARGET.email, name: TARGET.name },
    })
  }

  it('material avulso recebe o e-mail de material liberado, sem Serial Key', async () => {
    createSerialKeysForOrder.mockResolvedValue([makeKey({ amount: 49 })])

    await fulfillSerialKeyOrder(orderParaConta())

    expect(mail.material).toHaveBeenCalledTimes(1)
    expect(mail.material.mock.calls[0].slice(0, 4)).toEqual([
      TARGET.email, TARGET.name, 'Resumo de Farmaco', 49,
    ])
    expect(mail.serialKey).not.toHaveBeenCalled()
    expect(mail.serialKeyCarrinho).not.toHaveBeenCalled()
  })

  it('assinatura recebe o e-mail de plano, com o prazo concedido', async () => {
    grantSerialKeyProduct.mockResolvedValue({
      productLabel: 'Plus+ anual',
      redirectTo: '/dashboard',
      purchase: { kind: 'plan', planLabel: 'Plus+ anual', durationMonths: 12 },
    })
    createSerialKeysForOrder.mockResolvedValue([makeKey({ amount: 397, productType: 'plus' })])

    await fulfillSerialKeyOrder(orderParaConta())

    expect(mail.plano).toHaveBeenCalledWith(TARGET.email, TARGET.name, 'Plus+ anual', 12, 397)
    expect(mail.material).not.toHaveBeenCalled()
  })

  it('Manual Clínico recebe o e-mail do Manual, com plano e vencimento', async () => {
    const expiresAt = new Date('2027-01-01T00:00:00Z')
    grantSerialKeyProduct.mockResolvedValue({
      productLabel: 'Manual Clínico',
      redirectTo: '/manual-clinico',
      purchase: { kind: 'manual_clinico', planLabel: 'Anual', planKey: 'anual', durationMonths: 12, expiresAt },
    })
    createSerialKeysForOrder.mockResolvedValue([makeKey({ amount: 197, productType: 'manual_clinico' })])

    await fulfillSerialKeyOrder(orderParaConta())

    expect(mail.manualClinico).toHaveBeenCalledTimes(1)
    expect(mail.manualClinico.mock.calls[0][0]).toMatchObject({
      email: TARGET.email, planLabel: 'Anual', planKey: 'anual', durationMonths: 12, amount: 197, expiresAt,
    })
  })

  it('carrinho recebe o e-mail de carrinho, com os itens e o total', async () => {
    grantSerialKeyProduct
      .mockResolvedValueOnce({
        productLabel: 'A', redirectTo: '/materiais/a',
        purchase: { kind: 'material', itemType: 'material', itemTitle: 'Resumo A' },
      })
      .mockResolvedValueOnce({
        productLabel: 'B', redirectTo: '/pacotes/b',
        purchase: { kind: 'material', itemType: 'package', itemTitle: 'Pacote B' },
      })
    createSerialKeysForOrder.mockResolvedValue([makeKey({ amount: 30 }), makeKey({ amount: 70 })])

    await fulfillSerialKeyOrder(orderParaConta())

    const [email, nome, itens, total] = mail.carrinho.mock.calls[0]
    expect(email).toBe(TARGET.email)
    expect(nome).toBe(TARGET.name)
    expect(itens).toEqual([
      { itemType: 'material', itemTitle: 'Resumo A', price: 30 },
      { itemType: 'package', itemTitle: 'Pacote B', price: 70 },
    ])
    expect(total).toBe(100)
    expect(mail.serialKeyCarrinho).not.toHaveBeenCalled()
  })

  it('concessão que falha volta para o e-mail de Serial Key', async () => {
    grantSerialKeyProduct.mockRejectedValue(new Error('banco fora do ar'))
    createSerialKeysForOrder.mockResolvedValue([makeKey()])

    await fulfillSerialKeyOrder(orderParaConta())

    expect(mail.material).not.toHaveBeenCalled()
    expect(mail.serialKey).toHaveBeenCalledTimes(1)
  })

  it('compra normal continua recebendo a Serial Key', async () => {
    createSerialKeysForOrder.mockResolvedValue([makeKey()])

    await fulfillSerialKeyOrder(makeOrder({ serialKeyPurchase: true }))

    expect(grantSerialKeyProduct).not.toHaveBeenCalled()
    expect(mail.serialKey).toHaveBeenCalledTimes(1)
    expect(mail.material).not.toHaveBeenCalled()
  })

  it('e-mail já enviado não é reenviado quando o webhook repete', async () => {
    const key = makeKey({
      used: true,
      status: 'activated',
      activatedByUserId: TARGET_ID,
      emailHistory: [{ to: TARGET.email, status: 'sent', kind: 'purchase', sentAt: new Date() }],
    })
    createSerialKeysForOrder.mockResolvedValue([key])

    await fulfillSerialKeyOrder(orderParaConta())

    expect(grantSerialKeyProduct).not.toHaveBeenCalled()
    Object.values(mail).forEach(fn => expect(fn).not.toHaveBeenCalled())
  })
})
