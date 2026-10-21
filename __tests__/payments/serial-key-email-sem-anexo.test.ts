import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'

/**
 * A Serial Key não pode ficar presa ao PDF.
 *
 * Material com envio automático segue anexado ao e-mail da key. Quando o
 * provedor recusava a mensagem pelo tamanho (552), todas as tentativas
 * falhavam do mesmo jeito e a pessoa ficava sem a key que pagou. Agora a
 * tentativa seguinte sai sem os PDFs — a key e o link de ativação chegam, e o
 * material fica para baixar na plataforma.
 */

const h = vi.hoisted(() => ({
  enviarKey: vi.fn(),
  historico: [] as any[],
}))

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: vi.fn() }) },
}))

vi.mock('@/lib/mongodb', () => ({
  getDb: async () => ({
    collection: () => ({
      updateOne: async (_f: any, update: any) => {
        h.historico.push(update)
      },
      updateMany: async () => undefined,
    }),
  }),
}))

vi.mock('@/lib/mail', () => ({
  sendSerialKeyPurchaseEmail: (...a: any[]) => h.enviarKey(...a),
  sendSerialKeyCartPurchaseEmail: vi.fn(),
  sendPlanPurchasedEmail: vi.fn(),
  sendManualClinicoPurchasedEmail: vi.fn(),
  sendMaterialPurchasedEmail: vi.fn(),
  sendCartPurchasedEmail: vi.fn(),
}))

vi.mock('@/lib/material-pdf-email', () => ({
  buildAutoEmailPdfAttachments: async () => ({
    items: [{ title: 'Apostila', filename: 'apostila.pdf', buffer: Buffer.alloc(10) }],
    eligible: true,
  }),
}))

vi.mock('@/lib/serial-key-receipt', () => ({
  generateReceiptPdf: async () => Buffer.from('pdf'),
  generateActivationQrBuffer: async () => Buffer.from('qr'),
  buildReceiptText: () => 'comprovante',
}))

import { sendSerialKeyEmail } from '@/lib/serial-key-fulfillment'
import { getDb } from '@/lib/mongodb'
import type { SerialKey } from '@/lib/types'

const KEY: SerialKey = {
  _id: new ObjectId() as any,
  key: 'DOM-AAAA-BBBB',
  activationToken: 'tok',
  buyerEmail: 'comprador@example.com',
  buyerName: 'Comprador',
  productTitle: 'Apostila',
  productType: 'material',
  amount: 50,
  grant: { productType: 'material', itemType: 'material', itemId: new ObjectId().toString() },
} as any

function erro552() {
  return Object.assign(new Error('552 message size exceeds fixed maximum message size'), { responseCode: 552 })
}

beforeEach(() => {
  h.enviarKey.mockReset()
  h.historico.length = 0
})

describe('sendSerialKeyEmail', () => {
  it('mensagem grande demais: reenvia na hora sem os PDFs e registra como enviada', async () => {
    h.enviarKey.mockRejectedValueOnce(erro552()).mockResolvedValueOnce(undefined)

    const ok = await sendSerialKeyEmail(await getDb(), KEY)

    expect(ok).toBe(true)
    expect(h.enviarKey).toHaveBeenCalledTimes(2)
    expect(h.enviarKey.mock.calls[0][0].materialAttachments).toHaveLength(1)
    expect(h.enviarKey.mock.calls[1][0].materialAttachments).toEqual([])
    // A key e o link continuam no e-mail sem anexo.
    expect(h.enviarKey.mock.calls[1][0]).toMatchObject({ serialKey: 'DOM-AAAA-BBBB', email: 'comprador@example.com' })
    expect(h.historico.at(-1).$push.emailHistory).toMatchObject({ status: 'sent', kind: 'purchase' })
  })

  it('caixa inexistente: não insiste e registra a falha para o sweeper e o admin', async () => {
    h.enviarKey.mockRejectedValue(
      Object.assign(new Error('550 user unknown'), { code: 'EENVELOPE', responseCode: 550, response: '550 user unknown' })
    )

    const ok = await sendSerialKeyEmail(await getDb(), KEY)

    expect(ok).toBe(false)
    expect(h.enviarKey).toHaveBeenCalledTimes(1)
    expect(h.historico.at(-1).$push.emailHistory).toMatchObject({ status: 'failed', error: '550 user unknown' })
  })
})
