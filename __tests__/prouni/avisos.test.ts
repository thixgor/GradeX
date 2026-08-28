import { describe, expect, it, vi } from 'vitest'

const sendMailMock = vi.fn()

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: (...args: any[]) => sendMailMock(...args) }) },
}))

import { deliverTransactionalEmails } from '@/lib/mail'

/**
 * O que estes testes protegem: o aviso chegar.
 *
 * As solicitações PROUNI/FIES saíam num `void (async () => …)()` — a rota
 * respondia e a instância serverless congelava com o SMTP no meio do
 * handshake. Nenhum erro, nenhum log: só o e-mail que nunca chegou, para a
 * pessoa e para quem precisa analisar a fila. Os casos abaixo fixam as duas
 * metades do conserto: esperar de verdade, e não ficar preso esperando.
 */

describe('deliverTransactionalEmails', () => {
  it('só resolve depois que os envios terminam', async () => {
    let entregue = false
    const envio = new Promise<void>((resolve) => {
      setTimeout(() => {
        entregue = true
        resolve()
      }, 20)
    })

    await deliverTransactionalEmails([envio])

    // Se resolvesse antes, a resposta HTTP sairia e o envio morreria com a
    // instância — exatamente o defeito que este helper existe para impedir.
    expect(entregue).toBe(true)
  })

  it('um envio que falha não derruba a rota nem os outros avisos', async () => {
    let outroEntregue = false
    const quebrado = Promise.reject(new Error('SMTP fora do ar'))
    const bom = Promise.resolve().then(() => {
      outroEntregue = true
    })

    await expect(deliverTransactionalEmails([quebrado, bom])).resolves.toBeUndefined()
    expect(outroEntregue).toBe(true)
  })

  it('desiste de esperar no orçamento em vez de pendurar a resposta', async () => {
    const inicio = Date.now()
    // Uma promessa que nunca resolve é o SMTP travado: sem orçamento, a rota
    // ficaria pendurada até o serverless estourar o maxDuration e devolver 504.
    await deliverTransactionalEmails([new Promise<void>(() => {})], 30)
    expect(Date.now() - inicio).toBeLessThan(1_000)
  })

  it('não espera nada quando não há aviso para mandar', async () => {
    await expect(deliverTransactionalEmails([])).resolves.toBeUndefined()
    expect(sendMailMock).not.toHaveBeenCalled()
  })
})
