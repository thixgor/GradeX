import crypto from 'crypto'
import { ObjectId, type Db } from 'mongodb'
import {
  SERIAL_KEYS_COLLECTION,
  grantSerialKeyProduct,
  isValidEmail,
  markSerialKeyActivated,
  normalizeSerialKey,
} from './serial-keys'
import type { PaymentOrder, SerialKey } from './types'

/**
 * Conta criada DEPOIS da compra, já com o produto ativado.
 *
 * Quem compra sem conta recebe a Serial Key por e-mail e, até aqui, precisava
 * de quatro passos para usar o que pagou: abrir o link, ir ao cadastro, voltar
 * ao link e ativar. Metade se perdia no meio — o cadastro nem devolvia a pessoa
 * para a ativação. Agora a página da compra aprovada (e a de ativação) cria a
 * conta com o e-mail da compra e ativa todas as keys do pedido na mesma ida.
 *
 * O que autoriza isso é o mesmo segredo que já libera as keys: o `receiptToken`
 * do pedido (página /compra/aprovada) ou o `activationToken` da key (link do
 * e-mail) — ou a própria key, digitada em /ativar. Quem tem um deles já podia ativar a compra em qualquer conta; aqui
 * só pula o vai-e-volta.
 */

/** Uma compra pronta para virar conta: as keys e o comprador, conferidos. */
export interface CompraParaConta {
  keys: SerialKey[]
  buyerEmail: string
  buyerName: string
}

export type ResolucaoDaCompra =
  | { ok: true; compra: CompraParaConta }
  | { ok: false; status: number; error: string }

/** Comparação de segredo em tempo constante. */
export function segredoConfere(recebido: string, esperado: string): boolean {
  if (!recebido || !esperado) return false
  const a = Buffer.from(recebido)
  const b = Buffer.from(esperado)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * Acha as keys pelo segredo que a pessoa tem na mão: pedido + `receiptToken`
 * (todas as keys do pedido, carrinho inclusive), `activationToken` ou a key
 * digitada (só aquela key).
 */
export async function resolverCompraParaConta(
  db: Db,
  input: { orderId?: unknown; receiptToken?: unknown; activationToken?: unknown; key?: unknown }
): Promise<ResolucaoDaCompra> {
  const orderId = typeof input.orderId === 'string' ? input.orderId : ''
  const receiptToken = typeof input.receiptToken === 'string' ? input.receiptToken : ''
  const activationToken = typeof input.activationToken === 'string' ? input.activationToken : ''
  const serial = typeof input.key === 'string' ? normalizeSerialKey(input.key) : ''
  const keysCol = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  if (orderId && receiptToken) {
    if (!ObjectId.isValid(orderId)) return { ok: false, status: 400, error: 'Compra inválida.' }
    const order = await db.collection<PaymentOrder>('payment_orders').findOne({ _id: new ObjectId(orderId) as any })
    // Mesma resposta para pedido inexistente e token errado: ninguém descobre
    // por aqui quais pedidos existem.
    if (!order || !order.metadata?.serialKeyPurchase || !segredoConfere(receiptToken, String(order.metadata?.receiptToken || ''))) {
      return { ok: false, status: 403, error: 'Sem permissão para esta compra.' }
    }
    if (order.status !== 'approved') {
      return { ok: false, status: 409, error: 'O pagamento desta compra ainda não foi aprovado.' }
    }
    const keys = await keysCol.find({ orderId }).sort({ cartIndex: 1 }).toArray()
    if (keys.length === 0) {
      return { ok: false, status: 409, error: 'Ainda estamos gerando sua compra. Tente de novo em instantes.' }
    }
    return {
      ok: true,
      compra: {
        keys,
        buyerEmail: String(order.metadata?.buyerEmail || order.payerEmail || keys[0].buyerEmail || ''),
        buyerName: String(order.metadata?.buyerName || order.payerName || keys[0].buyerName || ''),
      },
    }
  }

  if (activationToken || serial) {
    const key = await keysCol.findOne(activationToken ? { activationToken } : { key: serial })
    if (!key) return { ok: false, status: 404, error: 'Serial key não encontrada.' }
    if (key.paymentStatus !== 'approved') {
      return { ok: false, status: 409, error: 'O pagamento desta compra ainda não foi aprovado.' }
    }
    return {
      ok: true,
      compra: { keys: [key], buyerEmail: String(key.buyerEmail || ''), buyerName: String(key.buyerName || '') },
    }
  }

  return { ok: false, status: 400, error: 'Informe a compra.' }
}

/** Key que ainda pode ser ativada (tem concessão, não foi usada nem cancelada). */
export function keyAtivavel(key: SerialKey): boolean {
  return Boolean(key.grant) && key.status !== 'cancelled' && key.status !== 'activated' && !key.used
}

/**
 * As keys que esta conta pode ativar. A key restrita ao e-mail da compra (PDF
 * com envio automático) só entra numa conta com aquele e-mail — a mesma regra
 * de /api/serial-keys/activate.
 */
export function keysAtivaveisPara(keys: SerialKey[], contaEmail: string): {
  ativaveis: SerialKey[]
  restritas: SerialKey[]
} {
  const email = contaEmail.trim().toLowerCase()
  const ativaveis: SerialKey[] = []
  const restritas: SerialKey[] = []
  for (const key of keys) {
    if (!keyAtivavel(key)) continue
    const dono = String(key.buyerEmail || '').trim().toLowerCase()
    if (key.restrictActivationToBuyerEmail && dono && dono !== email) restritas.push(key)
    else ativaveis.push(key)
  }
  return { ativaveis, restritas }
}

/** Para onde mandar a pessoa depois: o lugar onde o que ela comprou aparece. */
export function destinoDasKeys(keys: SerialKey[]): string {
  const tipos = new Set(keys.map((key) => key.grant?.productType || key.productType))
  if (tipos.size === 1) {
    const [tipo] = Array.from(tipos)
    if (tipo === 'manual_clinico') return '/manual-clinico'
    if (tipo === 'material' || tipo === 'package' || tipo === 'flashcard') return '/materiais?tab=mine'
  }
  if (keys.length > 0 && keys.every((key) => ['material', 'package', 'flashcard'].includes(String(key.grant?.productType || key.productType)))) {
    return '/materiais?tab=mine'
  }
  return '/dashboard'
}

export interface ResultadoDaAtivacao {
  ativadas: SerialKey[]
  falharam: SerialKey[]
}

/**
 * Ativa as keys na conta, uma a uma, como o botão de /ativar faria.
 *
 * É o mesmo laço de `activateKeysForAccount` (lib/serial-key-fulfillment), sem
 * importar aquele módulo: ele arrasta a geração de PDF e de e-mail com anexo
 * para dentro desta função, que não usa nada disso. A key que falhar continua
 * ativável pelo link do e-mail — ninguém fica sem o que pagou.
 */
export async function ativarKeysNaConta(
  db: Db,
  keys: SerialKey[],
  conta: { userId: string; name: string; email: string }
): Promise<ResultadoDaAtivacao> {
  const ativadas: SerialKey[] = []
  const falharam: SerialKey[] = []
  for (const key of keys) {
    if (!key._id || !keyAtivavel(key)) continue
    try {
      await grantSerialKeyProduct(db, key, conta)
      await markSerialKeyActivated(db, key._id as any, conta)
      ativadas.push(key)
    } catch (err) {
      console.error('[conta-pos-compra] falha ao ativar key na conta nova:', key.key, err)
      falharam.push(key)
    }
  }
  return { ativadas, falharam }
}

/** Senha da conta criada aqui. O cadastro comum não tem regra; esta tem o mínimo. */
export function validarSenhaNova(senha: unknown): string | null {
  if (typeof senha !== 'string' || senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (senha.length > 128) return 'A senha pode ter no máximo 128 caracteres.'
  return null
}

export function emailDaCompraValido(email: string): boolean {
  return isValidEmail(email.trim().toLowerCase())
}
