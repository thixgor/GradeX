import { describe, it, expect } from 'vitest'
import type { Db } from 'mongodb'
import { ObjectId } from 'mongodb'
import {
  resolveCheckoutCpf,
  isCpfRequiredForMethod,
  CPF_REQUIRED_MESSAGE,
  CPF_INVALID_MESSAGE,
  CPF_TAKEN_MESSAGE,
  CPF_MISMATCH_MESSAGE,
} from '@/lib/payments/checkout-identity'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/payment-methods'

/**
 * CPF passou a ser obrigatório em toda compra (nota fiscal) e é anexado ao
 * perfil de quem ainda não tem um. Estes testes cobrem o servidor, que é a
 * única barreira que vale: validar só no formulário deixaria a rota aberta a
 * um POST direto.
 */

/** CPFs estruturalmente válidos (dígitos verificadores corretos). */
const CPF_A = '52998224725'
const CPF_B = '11144477735'

type FakeUser = { _id: ObjectId; cpf?: string | null }

/** `requireCpfForPix` como o painel gravaria em admin_settings. */
function fakeDb(users: FakeUser[], paymentMethods?: Record<string, boolean>) {
  const updates: Array<{ filter: any; update: any }> = []
  const db = {
    collection(name?: string) {
      if (name === 'admin_settings') {
        return {
          async findOne() {
            return paymentMethods ? { paymentMethods } : null
          },
        } as any
      }
      return {
        async findOne(filter: any) {
          if (filter._id && !filter.cpf) {
            return users.find(u => String(u._id) === String(filter._id)) || null
          }
          // Consulta de duplicidade: { cpf, _id: { $ne } }
          return (
            users.find(
              u => u.cpf === filter.cpf && String(u._id) !== String(filter._id?.$ne)
            ) || null
          )
        },
        async updateOne(filter: any, update: any) {
          updates.push({ filter, update })
          const target = users.find(u => String(u._id) === String(filter._id))
          if (target && !target.cpf) target.cpf = update.$set.cpf
          return { modifiedCount: target ? 1 : 0 }
        },
      }
    },
  } as unknown as Db
  return { db, updates, users }
}

describe('resolveCheckoutCpf', () => {
  it('exige CPF quando não há nenhum no corpo nem no perfil', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, { cpf: '' })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.status).toBe(400)
      expect(res.error).toBe(CPF_REQUIRED_MESSAGE)
    }
  })

  it('rejeita CPF com dígito verificador errado', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, { cpf: '111.111.111-11' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe(CPF_INVALID_MESSAGE)
  })

  it('aceita CPF válido na compra sem conta, sem nada a vincular', async () => {
    const { db, updates } = fakeDb([])
    const res = await resolveCheckoutCpf(db, { cpf: '529.982.247-25' })
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.cpf).toBe(CPF_A)
      expect(res.linkedToProfile).toBe(false)
    }
    expect(updates).toHaveLength(0)
  })

  it('anexa o CPF ao perfil quando a conta ainda não tem um', async () => {
    const userId = new ObjectId()
    const { db, updates, users } = fakeDb([{ _id: userId }])
    const res = await resolveCheckoutCpf(db, { cpf: CPF_A, userId: String(userId) })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.linkedToProfile).toBe(true)
    expect(users[0].cpf).toBe(CPF_A)
    // Vinculado no checkout não é "conferido na Receita" — a auditoria precisa
    // enxergar essa diferença.
    expect(updates[0].update.$set.cpfVerified).toBe(false)
    expect(updates[0].update.$set.cpfSource).toBe('checkout')
  })

  it('não sobrescreve o CPF já gravado — troca de titular é operação de cadastro', async () => {
    const userId = new ObjectId()
    const { db, updates } = fakeDb([{ _id: userId, cpf: CPF_A }])
    const res = await resolveCheckoutCpf(db, { cpf: CPF_B, userId: String(userId) })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe(CPF_MISMATCH_MESSAGE)
    expect(updates).toHaveLength(0)
  })

  it('deixa passar quando o CPF informado é o mesmo do perfil', async () => {
    const userId = new ObjectId()
    const { db, updates } = fakeDb([{ _id: userId, cpf: CPF_A }])
    const res = await resolveCheckoutCpf(db, { cpf: '529.982.247-25', userId: String(userId) })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.cpf).toBe(CPF_A)
    expect(updates).toHaveLength(0)
  })

  it('bloqueia CPF que já pertence a outra conta', async () => {
    const userId = new ObjectId()
    const outro = new ObjectId()
    const { db } = fakeDb([{ _id: userId }, { _id: outro, cpf: CPF_A }])
    const res = await resolveCheckoutCpf(db, { cpf: CPF_A, userId: String(userId) })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(409)
    if (!res.ok) expect(res.error).toBe(CPF_TAKEN_MESSAGE)
  })

  it('usa o CPF do perfil quando o corpo não manda nenhum (cliente antigo em cache)', async () => {
    const userId = new ObjectId()
    const { db } = fakeDb([{ _id: userId, cpf: CPF_A }])
    const res = await resolveCheckoutCpf(db, { cpf: undefined, userId: String(userId) })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.cpf).toBe(CPF_A)
  })

  it('recusa CNPJ — a obrigatoriedade aqui é de pessoa física', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, { cpf: CPF_A, documentType: 'CNPJ' })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.status).toBe(400)
  })
})

describe('isCpfRequiredForMethod', () => {
  const dispensaPix = { ...DEFAULT_PAYMENT_METHODS, requireCpfForPix: false }

  it('dispensa o Pix quando o painel manda', () => {
    expect(isCpfRequiredForMethod('pix', dispensaPix)).toBe(false)
    expect(isCpfRequiredForMethod('pix', DEFAULT_PAYMENT_METHODS)).toBe(true)
  })

  it('nunca dispensa cartão nem boleto — o Mercado Pago recusa sem documento', () => {
    expect(isCpfRequiredForMethod('bolbradesco', dispensaPix)).toBe(true)
    expect(isCpfRequiredForMethod('visa', dispensaPix, { hasCardToken: true })).toBe(true)
    expect(isCpfRequiredForMethod('debvisa', dispensaPix)).toBe(true)
  })

  it('exige quando o método não foi reconhecido — não dá para supor que é Pix', () => {
    expect(isCpfRequiredForMethod(undefined, dispensaPix)).toBe(true)
    expect(isCpfRequiredForMethod('', dispensaPix)).toBe(true)
  })
})

describe('resolveCheckoutCpf com Pix dispensado no painel', () => {
  const dispensaPix = { ...DEFAULT_PAYMENT_METHODS, requireCpfForPix: false }

  it('deixa o Pix passar sem CPF, e o pagamento segue sem documento', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, {
      cpf: '',
      paymentMethodId: 'pix',
      enabledMethods: dispensaPix,
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.cpf).toBe('')
  })

  it('ainda vincula ao perfil quem escolhe informar o CPF', async () => {
    const userId = new ObjectId()
    const { db, users } = fakeDb([{ _id: userId }])
    const res = await resolveCheckoutCpf(db, {
      cpf: CPF_A,
      userId: String(userId),
      paymentMethodId: 'pix',
      enabledMethods: dispensaPix,
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.linkedToProfile).toBe(true)
    expect(users[0].cpf).toBe(CPF_A)
  })

  it('CPF pela metade não vira "opcional" — segue sendo inválido', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, {
      cpf: '529.982.247-2',
      paymentMethodId: 'pix',
      enabledMethods: dispensaPix,
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe(CPF_INVALID_MESSAGE)
  })

  it('não estende a dispensa ao cartão nem ao boleto', async () => {
    const { db } = fakeDb([])
    for (const paymentMethodId of ['bolbradesco', 'visa']) {
      const res = await resolveCheckoutCpf(db, {
        cpf: '',
        paymentMethodId,
        hasCardToken: paymentMethodId === 'visa',
        enabledMethods: dispensaPix,
      })
      expect(res.ok, paymentMethodId).toBe(false)
      if (!res.ok) expect(res.error).toBe(CPF_REQUIRED_MESSAGE)
    }
  })

  it('lê a config do painel quando a rota não a passa', async () => {
    const { db } = fakeDb([], { ...DEFAULT_PAYMENT_METHODS, requireCpfForPix: false })
    const res = await resolveCheckoutCpf(db, { cpf: '', paymentMethodId: 'pix' })
    expect(res.ok).toBe(true)
  })

  it('sem config gravada, o default exige — Pix sem CPF é barrado', async () => {
    const { db } = fakeDb([])
    const res = await resolveCheckoutCpf(db, { cpf: '', paymentMethodId: 'pix' })
    expect(res.ok).toBe(false)
  })

  it('prefere o CPF do perfil a mandar o pagamento sem documento', async () => {
    const userId = new ObjectId()
    const { db } = fakeDb([{ _id: userId, cpf: CPF_A }])
    const res = await resolveCheckoutCpf(db, {
      cpf: '',
      userId: String(userId),
      paymentMethodId: 'pix',
      enabledMethods: dispensaPix,
    })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.cpf).toBe(CPF_A)
  })
})
