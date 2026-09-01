import { describe, expect, it } from 'vitest'

import {
  MAX_EMAIL_ATTACHMENT_BYTES,
  SMTP_MAX_MESSAGE_MB,
  base64EncodedSize,
  checkEmailAttachmentSize,
  emailTooLargeMessage,
  isMessageTooLargeError,
  trimAttachmentsToEmailLimit,
} from '@/lib/email-attachment-size'

/**
 * O envio manual do admin devolvia 502 "verifique a configuração de SMTP" para
 * um PDF grande demais — o servidor tinha recusado com 552 (tamanho), e o admin
 * ia caçar credenciais. O tamanho que conta é o da mensagem depois do base64,
 * não o do arquivo em disco.
 */

const MB = 1024 * 1024

function attachment(mb: number, title = 'Material') {
  return { title, filename: 'material.pdf', buffer: { byteLength: Math.round(mb * MB) } }
}

describe('orçamento de tamanho dos anexos de e-mail', () => {
  it('conta a inflação do base64, não o tamanho em disco', () => {
    // 3 bytes viram 4 caracteres + CRLF da primeira (única) linha.
    expect(base64EncodedSize(3)).toBe(6)
    expect(base64EncodedSize(0)).toBe(0)
    // ~37% de inflação em arquivos grandes (4/3 + as quebras de linha).
    const encoded = base64EncodedSize(10 * MB)
    expect(encoded).toBeGreaterThan(13.3 * MB)
    expect(encoded).toBeLessThan(13.7 * MB)
  })

  it('recusa um PDF que só estoura o limite depois de codificado', () => {
    // 20MB em disco passam por baixo de 25MB, mas viram ~27MB na mensagem.
    const check = checkEmailAttachmentSize([attachment(20)])
    expect(SMTP_MAX_MESSAGE_MB).toBe(25)
    expect(check.rawBytes).toBeLessThan(check.limitBytes)
    expect(check.messageBytes).toBeGreaterThan(check.limitBytes)
    expect(check.ok).toBe(false)
  })

  it('aceita o que cabe na mensagem', () => {
    const check = checkEmailAttachmentSize([attachment(10), attachment(5)])
    expect(check.ok).toBe(true)
    expect(check.rawBytes).toBe(15 * MB)
  })

  it('o teto em bytes crus é coerente com o teto da mensagem', () => {
    expect(checkEmailAttachmentSize([attachment(MAX_EMAIL_ATTACHMENT_BYTES / MB)]).ok).toBe(true)
    expect(
      checkEmailAttachmentSize([{ buffer: { byteLength: MAX_EMAIL_ATTACHMENT_BYTES + 4 } }]).ok
    ).toBe(false)
  })

  it('a mensagem de erro diz o tamanho real, o limite e o que fazer', () => {
    const msg = emailTooLargeMessage(checkEmailAttachmentSize([attachment(30)]))
    expect(msg).toContain('30.0MB')
    expect(msg).toContain(`${SMTP_MAX_MESSAGE_MB}MB`)
    expect(msg).toMatch(/comprima/i)
  })

  it('corta os anexos que não cabem e mantém o resto na ordem', () => {
    const { kept, dropped } = trimAttachmentsToEmailLimit([
      attachment(10, 'Resumo'),
      attachment(30, 'Atlas'),
      attachment(3, 'Anexos'),
    ])
    expect(kept.map(k => k.title)).toEqual(['Resumo', 'Anexos'])
    expect(dropped.map(d => d.title)).toEqual(['Atlas'])
  })

  it('reconhece a recusa por tamanho do servidor', () => {
    expect(isMessageTooLargeError({ responseCode: 552 })).toBe(true)
    expect(isMessageTooLargeError({ responseCode: 523 })).toBe(true)
    expect(
      isMessageTooLargeError({ response: '552 5.3.4 Message size exceeds fixed maximum' })
    ).toBe(true)
    // Falha de credencial continua sendo falha de credencial (502, não 413).
    expect(isMessageTooLargeError({ responseCode: 535, response: '535 auth failed' })).toBe(false)
    expect(isMessageTooLargeError({ code: 'ETIMEDOUT' })).toBe(false)
  })
})
