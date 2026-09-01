/**
 * Orçamento de tamanho para anexos de e-mail.
 *
 * O servidor SMTP não recusa pelo tamanho do ARQUIVO, e sim pelo tamanho da
 * MENSAGEM: todo anexo viaja codificado em base64 (+33%, mais uma quebra de
 * linha a cada 76 caracteres), então um PDF de 30MB chega como ~41MB do outro
 * lado. Passando do teto do provedor, a resposta é `552 message size exceeds
 * maximum` — foi exatamente esse 552 que o envio manual do admin devolvia como
 * 502 "verifique a configuração de SMTP", mandando investigar credenciais
 * quando o problema era o tamanho do PDF.
 *
 * Por isso o tamanho é conferido JÁ CODIFICADO e ANTES de abrir a conexão: dá
 * para falhar (ou cortar o anexo) com uma mensagem que diz o que fazer, em vez
 * de gastar o download + a marca d'água para tomar 552 no fim.
 *
 * O teto padrão é 25MB — não porque a Hostinger recuse aí, mas porque é o que
 * a caixa de entrada do destinatário (Gmail, Outlook) aceita. Enviar acima
 * disso passa no nosso SMTP e quica no provedor de destino. Ajustável via
 * `SMTP_MAX_MESSAGE_MB`.
 */

/** Teto da mensagem inteira (anexos codificados + corpo + cabeçalhos). */
export const SMTP_MAX_MESSAGE_MB = Number(process.env.SMTP_MAX_MESSAGE_MB) || 25

const SMTP_MAX_MESSAGE_BYTES = Math.max(1, SMTP_MAX_MESSAGE_MB) * 1024 * 1024

/**
 * Reserva para o que não é anexo: cabeçalhos MIME, corpo HTML do template e as
 * fronteiras entre as partes. 256KB é folgado para os nossos e-mails (o maior
 * template não chega a 30KB), e a folga é barata perto de tomar um 552.
 */
const MESSAGE_OVERHEAD_BYTES = 256 * 1024

/** Bytes que um anexo ocupa na mensagem depois de codificado em base64. */
export function base64EncodedSize(rawBytes: number): number {
  if (rawBytes <= 0) return 0
  const chars = Math.ceil(rawBytes / 3) * 4
  // Quebra de linha (CRLF) a cada 76 caracteres, como manda o MIME.
  return chars + Math.ceil(chars / 76) * 2
}

/**
 * Maior soma de bytes CRUS de anexo que ainda cabe na mensagem — o inverso de
 * `base64EncodedSize`: tira a reserva, desconta as quebras de linha (2 bytes a
 * cada 76 caracteres) e só então volta de 4 caracteres para 3 bytes.
 */
export const MAX_EMAIL_ATTACHMENT_BYTES = (() => {
  const budget = SMTP_MAX_MESSAGE_BYTES - MESSAGE_OVERHEAD_BYTES
  if (budget <= 0) return 0
  const chars = Math.floor((budget * 76) / 78)
  return Math.max(0, Math.floor(chars / 4) * 3)
})()

export type SizedAttachment = { title?: string; filename?: string; buffer: { byteLength: number } }

/** "12.3MB" — para as mensagens de erro. */
export function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function rawTotal(items: SizedAttachment[]): number {
  return items.reduce((sum, item) => sum + (item.buffer?.byteLength || 0), 0)
}

export interface EmailSizeCheck {
  ok: boolean
  /** Soma dos anexos como estão em disco. */
  rawBytes: number
  /** Tamanho estimado da mensagem que sairia daqui (anexos + corpo). */
  messageBytes: number
  /** Teto do servidor/destinatário. */
  limitBytes: number
  /** Teto equivalente em bytes crus, que é o número útil para o admin. */
  maxRawBytes: number
}

/** Confere se os anexos cabem na mensagem, já contando o base64. */
export function checkEmailAttachmentSize(items: SizedAttachment[]): EmailSizeCheck {
  const rawBytes = rawTotal(items)
  const messageBytes = base64EncodedSize(rawBytes) + MESSAGE_OVERHEAD_BYTES
  return {
    ok: messageBytes <= SMTP_MAX_MESSAGE_BYTES,
    rawBytes,
    messageBytes,
    limitBytes: SMTP_MAX_MESSAGE_BYTES,
    maxRawBytes: MAX_EMAIL_ATTACHMENT_BYTES,
  }
}

/**
 * Mensagem pronta para o admin: diz o tamanho real, o teto e o que fazer.
 */
export function emailTooLargeMessage(check: EmailSizeCheck): string {
  return (
    `O(s) arquivo(s) somam ${formatMb(check.rawBytes)} e, codificados para o e-mail (base64), ` +
    `viram ~${formatMb(check.messageBytes)} — acima do limite de ${SMTP_MAX_MESSAGE_MB}MB por mensagem. ` +
    `O servidor recusaria com "552 message size exceeds maximum". ` +
    `Envie no máximo ~${formatMb(check.maxRawBytes)} de PDF por e-mail: comprima o arquivo, ` +
    `divida em partes ou libere o download pelo painel.`
  )
}

/**
 * Mantém, na ordem, os anexos que couberem e devolve os que sobraram.
 *
 * Usado nos envios AUTOMÁTICOS de compra: ali o e-mail em si (confirmação,
 * serial key, link de acesso) importa mais que o anexo, então é melhor entregar
 * sem o PDF grande do que perder a confirmação inteira num 552.
 */
export function trimAttachmentsToEmailLimit<T extends SizedAttachment>(
  items: T[]
): { kept: T[]; dropped: T[] } {
  const kept: T[] = []
  const dropped: T[] = []
  for (const item of items) {
    if (checkEmailAttachmentSize([...kept, item]).ok) kept.push(item)
    else dropped.push(item)
  }
  return { kept, dropped }
}

/**
 * O erro do nodemailer é de tamanho? 552 é o código padrão ("message size
 * exceeds fixed maximum"); 523 aparece em alguns servidores para o mesmo caso.
 */
export function isMessageTooLargeError(err: any): boolean {
  const code = Number(err?.responseCode)
  if (code === 552 || code === 523) return true
  const text = `${err?.response || ''} ${err?.message || ''}`.toLowerCase()
  return /message (size|too large)|size exceeds|exceeds .*size limit|too much mail data/.test(text)
}
