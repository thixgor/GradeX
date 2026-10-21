import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O que estes testes protegem: o e-mail sair mesmo quando o SMTP tropeça.
 *
 * O "Esqueci minha senha" e a Serial Key sumiam em silêncio: conexão velha no
 * pool (a instância serverless congela entre requisições), nenhuma segunda
 * tentativa e nenhum rastro. Cada caso abaixo fixa uma parte do conserto.
 */

const h = vi.hoisted(() => ({
  transportes: [] as Array<{ opcoes: any; sendMail: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }>,
  responder: (async () => ({ messageId: 'ok', accepted: [], rejected: [] })) as (opcoes: any, mensagem: any) => Promise<any>,
  registros: [] as any[],
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: (opcoes: any) => {
      const transporte = {
        opcoes,
        sendMail: vi.fn((mensagem: any) => h.responder(opcoes, mensagem)),
        close: vi.fn(),
      }
      h.transportes.push(transporte)
      return transporte
    },
  },
}))

vi.mock('@/lib/registro-de-emails', () => ({
  registrarEnvio: async (registro: any) => {
    h.registros.push(registro)
  },
}))

import {
  classificarFalhaSmtp,
  descartarConexoesSmtp,
  enviarEmail,
  htmlParaTexto,
  trocarEnderecoDoRemetente,
} from '@/lib/envio-de-email'

function erroSmtp(campos: Record<string, unknown>) {
  return Object.assign(new Error(String(campos.message || campos.response || 'falha')), campos)
}

const MENSAGEM = {
  from: '"DomineAqui - Suporte" <no-reply@domineaqui.com.br>',
  to: 'aluno@example.com',
  subject: 'Redefinição de Senha - DomineAqui',
  html: '<p>Olá!</p>',
}

/** Roda o envio deixando os timers (esperas entre tentativas) passarem na hora. */
async function enviarSemEsperar(...args: Parameters<typeof enviarEmail>) {
  const envio = enviarEmail(...args)
  envio.catch(() => undefined)
  await vi.runAllTimersAsync()
  return envio
}

beforeEach(() => {
  vi.useFakeTimers()
  descartarConexoesSmtp()
  h.transportes.length = 0
  h.registros.length = 0
  h.responder = async () => ({ messageId: 'ok', accepted: ['aluno@example.com'], rejected: [], response: '250 OK' })
  delete process.env.SMTP_FALLBACK_HOST
  delete process.env.SMTP_FALLBACK_FROM_ADDRESS
})

afterEach(() => {
  vi.useRealTimers()
})

describe('classificarFalhaSmtp', () => {
  it('socket morto é falha de conexão (vale repetir com pool novo)', () => {
    expect(classificarFalhaSmtp(erroSmtp({ code: 'ECONNRESET' }))).toBe('conexao')
    expect(classificarFalhaSmtp(erroSmtp({ code: 'ETIMEDOUT' }))).toBe('conexao')
    expect(classificarFalhaSmtp(new Error('Connection closed unexpectedly'))).toBe('conexao')
    expect(classificarFalhaSmtp(new Error('Reached maximum number of retries after connection was closed'))).toBe('conexao')
  })

  it('4xx e o "auth limit" da Hostinger são passageiros', () => {
    expect(classificarFalhaSmtp(erroSmtp({ responseCode: 421, response: '421 Try again later' }))).toBe('temporaria')
    expect(classificarFalhaSmtp(erroSmtp({ responseCode: 451 }))).toBe('temporaria')
    expect(classificarFalhaSmtp(erroSmtp({ code: 'EAUTH', responseCode: 535 }))).toBe('temporaria')
  })

  it('mensagem grande demais nunca é repetida', () => {
    expect(classificarFalhaSmtp(erroSmtp({ responseCode: 552, response: '552 message size exceeds' }))).toBe('tamanho')
  })

  it('destinatário inexistente é definitivo; remetente recusado pode ir para a reserva', () => {
    expect(
      classificarFalhaSmtp(erroSmtp({ code: 'EENVELOPE', responseCode: 550, response: '550 5.1.1 Recipient address rejected: user unknown' }))
    ).toBe('destinatario')
    expect(
      classificarFalhaSmtp(erroSmtp({ code: 'EENVELOPE', responseCode: 553, response: '553 Sender address rejected: not owned by user' }))
    ).toBe('permanente')
    expect(classificarFalhaSmtp(erroSmtp({ responseCode: 554, response: '554 Message rejected as spam' }))).toBe('permanente')
  })
})

describe('htmlParaTexto', () => {
  it('tira estilo, mantém o texto e escreve os links por extenso', () => {
    const texto = htmlParaTexto(`
      <html><head><style>.x { color: red }</style></head><body>
      <h1 class="h1">Redefinição de Senha</h1>
      <p>Olá, Ana!&nbsp;Clique&nbsp;abaixo:</p>
      <a href="https://site/auth/reset-password?token=abc&amp;x=1" class="button">Redefinir Minha Senha</a>
      <p>Ou copie: <a href="https://site/r">https://site/r</a></p>
      <img src="cid:qr" alt="QR">
      <ul><li>Um</li><li>Dois</li></ul>
      <p>&copy; 2026 DomineAqui &#8212; contato: <a href="mailto:contato@domineaqui.com.br">contato@domineaqui.com.br</a></p>
      </body></html>
    `)
    expect(texto).not.toContain('color: red')
    expect(texto).not.toMatch(/<[^>]+>/)
    expect(texto).toContain('Redefinição de Senha')
    expect(texto).toContain('Olá, Ana! Clique abaixo:')
    expect(texto).toContain('Redefinir Minha Senha (https://site/auth/reset-password?token=abc&x=1)')
    // Link cujo texto já é o endereço não sai duplicado.
    expect(texto).toContain('Ou copie: https://site/r')
    expect(texto).not.toContain('https://site/r (https://site/r)')
    expect(texto).toContain('• Um')
    expect(texto).toContain('© 2026 DomineAqui — contato: contato@domineaqui.com.br')
    expect(texto).not.toMatch(/\n{3,}/)
  })
})

describe('trocarEnderecoDoRemetente', () => {
  it('troca só o endereço e mantém o nome exibido', () => {
    expect(trocarEnderecoDoRemetente('"DomineAqui - Suporte" <no-reply@domineaqui.com.br>', 'envios@outro.com')).toBe(
      '"DomineAqui - Suporte" <envios@outro.com>'
    )
    expect(trocarEnderecoDoRemetente('no-reply@domineaqui.com.br', 'envios@outro.com')).toBe('envios@outro.com')
    expect(trocarEnderecoDoRemetente({ name: 'DomineAqui', address: 'a@b.com' }, 'c@d.com')).toEqual({
      name: 'DomineAqui',
      address: 'c@d.com',
    })
    expect(trocarEnderecoDoRemetente('"X" <a@b.com>', undefined)).toBe('"X" <a@b.com>')
  })
})

describe('enviarEmail', () => {
  it('completa a mensagem: texto alternativo e Reply-To para uma caixa lida', async () => {
    await enviarSemEsperar(MENSAGEM)
    const enviada = h.transportes[0].sendMail.mock.calls[0][0]
    expect(enviada.text).toBe('Olá!')
    expect(enviada.replyTo).toBe('contato@domineaqui.com.br')
    expect(enviada.from).toBe(MENSAGEM.from)
  })

  it('conexão velha no pool: descarta, abre outra e o e-mail sai', async () => {
    let chamadas = 0
    h.responder = async () => {
      chamadas++
      if (chamadas === 1) throw erroSmtp({ code: 'ECONNRESET', message: 'socket hang up' })
      return { messageId: 'segunda', accepted: ['aluno@example.com'], rejected: [] }
    }

    const info = await enviarSemEsperar(MENSAGEM, { categoria: 'redefinicao-senha' })

    expect(info.messageId).toBe('segunda')
    expect(h.transportes).toHaveLength(2)
    expect(h.transportes[0].close).toHaveBeenCalled()
    expect(h.registros).toHaveLength(1)
    expect(h.registros[0]).toMatchObject({ status: 'enviado', tentativas: 2, categoria: 'redefinicao-senha' })
  })

  it('pool parado tempo bastante para a instância ter congelado é trocado antes do envio', async () => {
    await enviarSemEsperar(MENSAGEM)
    await vi.advanceTimersByTimeAsync(5_000)
    await enviarSemEsperar(MENSAGEM)
    // Rajada: a mesma conexão serve.
    expect(h.transportes).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(60_000)
    await enviarSemEsperar(MENSAGEM)
    expect(h.transportes).toHaveLength(2)
    expect(h.transportes[0].close).toHaveBeenCalled()
  })

  it('caixa inexistente: uma tentativa só, erro original relançado e registrado', async () => {
    const recusa = erroSmtp({ code: 'EENVELOPE', responseCode: 550, response: '550 user unknown' })
    h.responder = async () => {
      throw recusa
    }

    await expect(enviarSemEsperar(MENSAGEM)).rejects.toBe(recusa)
    expect(h.transportes[0].sendMail).toHaveBeenCalledTimes(1)
    expect(h.registros[0]).toMatchObject({ status: 'falhou', tentativas: 1, para: ['aluno@example.com'] })
  })

  it('falha passageira que não passa: desiste depois de 3 tentativas', async () => {
    h.responder = async () => {
      throw erroSmtp({ responseCode: 421, response: '421 busy' })
    }
    await expect(enviarSemEsperar(MENSAGEM)).rejects.toMatchObject({ responseCode: 421 })
    const tentativas = h.transportes.reduce((n, t) => n + t.sendMail.mock.calls.length, 0)
    expect(tentativas).toBe(3)
  })

  it('servidor principal recusando: o de reserva entrega, com o remetente dele', async () => {
    process.env.SMTP_FALLBACK_HOST = 'smtp-relay.exemplo.com'
    process.env.SMTP_FALLBACK_FROM_ADDRESS = 'envios@exemplo.com'
    h.responder = async (opcoes) => {
      if (opcoes.host === 'smtp-relay.exemplo.com') return { messageId: 'reserva', accepted: ['aluno@example.com'], rejected: [] }
      throw erroSmtp({ responseCode: 554, response: '554 rejected by policy' })
    }

    const info = await enviarSemEsperar(MENSAGEM)

    expect(info.messageId).toBe('reserva')
    const reserva = h.transportes.find((t) => t.opcoes.host === 'smtp-relay.exemplo.com')!
    expect(reserva.sendMail.mock.calls[0][0].from).toBe('"DomineAqui - Suporte" <envios@exemplo.com>')
    expect(h.registros[0]).toMatchObject({ status: 'enviado', transporte: 'reserva' })
  })

  it('mensagem grande demais não vai para a reserva (nenhum servidor aceitaria)', async () => {
    process.env.SMTP_FALLBACK_HOST = 'smtp-relay.exemplo.com'
    h.responder = async () => {
      throw erroSmtp({ responseCode: 552, response: '552 message size exceeds fixed maximum' })
    }
    await expect(enviarSemEsperar(MENSAGEM)).rejects.toMatchObject({ responseCode: 552 })
    expect(h.transportes.some((t) => t.opcoes.host === 'smtp-relay.exemplo.com')).toBe(false)
  })

  it('não grava no registro quando o chamador já tem histórico próprio', async () => {
    await enviarSemEsperar(MENSAGEM, { registrar: false })
    expect(h.registros).toHaveLength(0)
  })
})
