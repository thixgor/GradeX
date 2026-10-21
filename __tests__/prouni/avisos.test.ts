import { describe, expect, it, vi } from 'vitest'

const sendMailMock = vi.fn()

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail: (...args: any[]) => sendMailMock(...args) }) },
}))

// Cada envio vira uma linha no registro de e-mails (Mongo); aqui não há banco.
vi.mock('@/lib/registro-de-emails', () => ({ registrarEnvio: async () => undefined }))

import {
  deliverTransactionalEmails,
  sendProuniRequestAdminAlert,
  sendProuniRequestAiFlaggedEmail,
} from '@/lib/mail'

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

describe('avisos da análise automática', () => {
  const base = {
    requestId: 'r1',
    applicantName: 'Maria',
    itemTitle: 'Manual',
    program: 'prouni' as const,
    attachments: 1,
  }

  it('admin: reprovação pela IA pede decisão e traz o parecer escapado', async () => {
    sendMailMock.mockClear()
    await sendProuniRequestAdminAlert({
      ...base,
      aiReview: { outcome: 'rejected', reason: 'Arquivo <script>sem relação</script>', adminNotes: '[nada_a_ver]' },
    })
    const [envio] = sendMailMock.mock.calls[0]
    expect(envio.subject).toContain('IA reprovou')
    expect(envio.html).toContain('precisa da sua decisão')
    // O motivo vem do modelo, que leu um arquivo de terceiro: nunca vira HTML.
    expect(envio.html).not.toContain('<script>sem')
    expect(envio.html).toContain('&lt;script&gt;')
  })

  it('admin: aprovação pela IA é só informativa', async () => {
    sendMailMock.mockClear()
    await sendProuniRequestAdminAlert({ ...base, aiReview: { outcome: 'approved', discountLabel: '40% OFF' } })
    const [envio] = sendMailMock.mock.calls[0]
    expect(envio.subject).toContain('aprovado pela IA')
    expect(envio.html).toContain('40% OFF')
  })

  it('admin: sem parecer (IA desligada) mantém o aviso de sempre', async () => {
    sendMailMock.mockClear()
    await sendProuniRequestAdminAlert(base)
    expect(sendMailMock.mock.calls[0][0].subject).toContain('Nova solicitação')
  })

  it('pessoa: revisão manual explica o motivo e que ainda não é recusa', async () => {
    sendMailMock.mockClear()
    await sendProuniRequestAiFlaggedEmail({
      email: 'maria@example.com',
      name: 'Maria Souza',
      itemTitle: 'Manual',
      program: 'fies',
      reason: 'Não encontramos o contrato do FIES.',
    })
    const [envio] = sendMailMock.mock.calls[0]
    expect(envio.to).toBe('maria@example.com')
    expect(envio.subject).toContain('revisão manual')
    expect(envio.html).toContain('Não encontramos o contrato do FIES.')
    expect(envio.html).toContain('ainda não é uma recusa')
  })
})
