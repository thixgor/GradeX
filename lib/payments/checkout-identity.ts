import { ObjectId } from 'mongodb'
import type { Db } from 'mongodb'
import { isValidCpf, onlyCpfDigits } from '@/lib/cpf'

/**
 * CPF do comprador no checkout.
 *
 * Toda compra passa a exigir CPF — é o dado que a nota fiscal precisa e que
 * antes só era pedido no cartão e no boleto (o Pix passava batido). Como o
 * valor cobrado é decidido no servidor, a exigência também mora aqui: validar
 * só no formulário deixaria a porta aberta para um POST direto na rota.
 *
 * O CPF informado é INDEXADO AO PERFIL quando a conta ainda não tem um. É de
 * propósito que ele não SOBRESCREVA um CPF já gravado: trocar o titular de uma
 * conta é operação de cadastro (com conferência na Receita, em
 * /api/user/complete-profile), não efeito colateral de uma compra.
 */

export interface CheckoutCpfOk {
  ok: true
  /** 11 dígitos, sem pontuação. */
  cpf: string
  /** `true` quando este checkout foi quem gravou o CPF no perfil. */
  linkedToProfile: boolean
}

export interface CheckoutCpfError {
  ok: false
  error: string
  status: number
}

export type CheckoutCpfResult = CheckoutCpfOk | CheckoutCpfError

export const CPF_REQUIRED_MESSAGE =
  'Informe seu CPF para concluir a compra — ele é obrigatório para a emissão da nota fiscal.'

export const CPF_INVALID_MESSAGE = 'CPF inválido. Confira os números digitados.'

export const CPF_TAKEN_MESSAGE =
  'Este CPF já está cadastrado em outra conta. Entre com a conta correta ou fale com o suporte.'

export const CPF_MISMATCH_MESSAGE =
  'Este CPF é diferente do que está no seu perfil. Use o CPF do titular da conta ou atualize seu cadastro no perfil.'

/**
 * Valida o CPF recebido no checkout e, quando houver conta logada, o vincula
 * ao perfil.
 *
 * @param userId  id do usuário logado; ausente em compra sem conta (/comprar),
 *                onde só cabe a validação estrutural.
 */
export async function resolveCheckoutCpf(
  db: Db,
  input: { cpf?: string | null; documentType?: 'CPF' | 'CNPJ'; userId?: string | null }
): Promise<CheckoutCpfResult> {
  // CNPJ tem 14 dígitos e outra regra de validação. A obrigatoriedade aqui é
  // de CPF (pessoa física); quem paga como empresa segue pelo suporte.
  if (input.documentType === 'CNPJ') {
    return { ok: false, error: 'Compra com CNPJ não está disponível neste checkout. Informe o CPF do comprador.', status: 400 }
  }

  const digits = onlyCpfDigits(input.cpf || '')
  const users = db.collection('users')

  let profileCpf = ''
  let userObjectId: ObjectId | null = null
  if (input.userId && ObjectId.isValid(input.userId)) {
    userObjectId = new ObjectId(input.userId)
    const user = await users.findOne({ _id: userObjectId }, { projection: { cpf: 1 } })
    profileCpf = onlyCpfDigits(user?.cpf || '')
  }

  // Sem CPF no corpo: só dá para seguir se o perfil já tiver um. É o caso de
  // um cliente antigo cujo checkout em cache ainda não manda o campo.
  if (!digits) {
    if (profileCpf) return { ok: true, cpf: profileCpf, linkedToProfile: false }
    return { ok: false, error: CPF_REQUIRED_MESSAGE, status: 400 }
  }

  if (!isValidCpf(digits)) {
    return { ok: false, error: CPF_INVALID_MESSAGE, status: 400 }
  }

  if (!userObjectId) {
    // Compra sem conta: nada a vincular, a validação estrutural basta.
    return { ok: true, cpf: digits, linkedToProfile: false }
  }

  if (profileCpf) {
    if (profileCpf !== digits) {
      return { ok: false, error: CPF_MISMATCH_MESSAGE, status: 400 }
    }
    return { ok: true, cpf: digits, linkedToProfile: false }
  }

  // Perfil sem CPF: este é o momento de anexar. Antes, a checagem de
  // duplicidade — o índice de CPF é esparso e não único, então a garantia de
  // "um CPF por conta" é desta consulta.
  const duplicate = await users.findOne(
    { cpf: digits, _id: { $ne: userObjectId } },
    { projection: { _id: 1 } }
  )
  if (duplicate) {
    return { ok: false, error: CPF_TAKEN_MESSAGE, status: 409 }
  }

  try {
    await users.updateOne(
      { _id: userObjectId, $or: [{ cpf: { $exists: false } }, { cpf: '' }, { cpf: null }] },
      {
        $set: {
          cpf: digits,
          // Não passou pela Receita Federal — quem confere é o modal de
          // perfil. Marcar como verificado aqui seria mentir na auditoria.
          cpfVerified: false,
          cpfSource: 'checkout',
          cpfLinkedAt: new Date(),
        },
      }
    )
  } catch (err) {
    // Uma falha ao gravar o CPF no perfil não pode derrubar a venda: o
    // pagamento segue com o CPF informado e o perfil fica para a próxima.
    console.error('[checkout-identity] falha ao vincular CPF ao perfil:', err)
    return { ok: true, cpf: digits, linkedToProfile: false }
  }

  return { ok: true, cpf: digits, linkedToProfile: true }
}
