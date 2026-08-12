/**
 * Geração do comprovante de compra da Serial Key: QR Code de ativação (PNG)
 * e comprovante em PDF (via jsPDF), reaproveitados pelo e-mail e pela página
 * de sucesso. Roda apenas no servidor (runtime nodejs).
 */

import jsPDF from 'jspdf'
import QRCode from 'qrcode'

export interface SerialKeyReceiptData {
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  productTitle: string
  productTypeLabel: string
  amount: number
  paymentStatusLabel: string
  paymentMethodLabel?: string
  transactionId?: string
  purchasedAt: Date
  serialKey: string
  activationUrl: string
  supportEmail?: string
  /**
   * Preenchido quando a compra foi de uma versão por tempo limitado. A data de
   * término não entra aqui de propósito: no momento da compra o prazo ainda não
   * começou — ele só passa a correr na ativação da key.
   */
  timedAccess?: {
    versionLabel?: string
    durationLabel: string
  }
}

const BRAND_GREEN: [number, number, number] = [15, 61, 46] // #0f3d2e
const BRAND_ORANGE: [number, number, number] = [245, 124, 0] // #f57c00
const INK: [number, number, number] = [51, 51, 51]
const MUTED: [number, number, number] = [110, 120, 130]

export function formatBRL(value: number): string {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`
}

export function formatDateTimeBR(date: Date): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date)
  } catch {
    return date.toISOString()
  }
}

/** QR Code de ativação como Data URL (para embutir em HTML/e-mail/página). */
export async function generateActivationQrDataUrl(activationUrl: string): Promise<string> {
  return QRCode.toDataURL(activationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#0f3d2e', light: '#ffffff' },
  })
}

/** QR Code de ativação como Buffer PNG (para anexos CID de e-mail). */
export async function generateActivationQrBuffer(activationUrl: string): Promise<Buffer> {
  return QRCode.toBuffer(activationUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#0f3d2e', light: '#ffffff' },
  })
}

/** Comprovante da compra em texto puro (para o corpo do e-mail e histórico). */
export function buildReceiptText(data: SerialKeyReceiptData): string {
  const lines = [
    'DOMINEAQUI — COMPROVANTE DE COMPRA',
    '===================================',
    `Comprador: ${data.buyerName}`,
    `E-mail: ${data.buyerEmail}`,
    `Telefone: ${data.buyerPhone}`,
    `Produto: ${data.productTitle}`,
    `Tipo: ${data.productTypeLabel}`,
    `Valor pago: ${formatBRL(data.amount)}`,
    `Status do pagamento: ${data.paymentStatusLabel}`,
    data.paymentMethodLabel ? `Forma de pagamento: ${data.paymentMethodLabel}` : '',
    data.transactionId ? `ID da transação: ${data.transactionId}` : '',
    `Data/hora: ${formatDateTimeBR(data.purchasedAt)}`,
    data.timedAccess
      ? `Modalidade: ${data.timedAccess.versionLabel || 'Acesso temporário'} — ${data.timedAccess.durationLabel} a partir da ATIVAÇÃO da key, sem download (leitura no visualizador protegido).`
      : 'Modalidade: Acesso vitalício.',
    '-----------------------------------',
    `Serial Key: ${data.serialKey}`,
    `Link de ativação: ${data.activationUrl}`,
    '-----------------------------------',
    `Suporte: ${data.supportEmail || 'suporte@domineaqui.com.br'}`,
  ]
  return lines.filter(Boolean).join('\n')
}

/**
 * Gera o comprovante em PDF (A4) com logo/nome, dados do comprador, produto,
 * valor, status, ID da transação, serial key, link e QR de ativação.
 * Retorna um Buffer pronto para anexar no e-mail.
 */
export async function generateReceiptPdf(data: SerialKeyReceiptData): Promise<Buffer> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 18
  let y = 0

  // Header
  doc.setFillColor(...BRAND_GREEN)
  doc.rect(0, 0, pageW, 34, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('DomineAqui', margin, 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(255, 224, 178)
  doc.text('Comprovante de Compra', margin, 27)
  y = 46

  // Título + status "aprovado"
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Compra aprovada', margin, y)
  doc.setFillColor(...BRAND_ORANGE)
  doc.roundedRect(pageW - margin - 42, y - 6, 42, 8, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.text('PAGAMENTO OK', pageW - margin - 21, y - 0.5, { align: 'center' })
  y += 12

  // Bloco de dados
  const row = (label: string, value: string) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...MUTED)
    doc.text(label.toUpperCase(), margin, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...INK)
    const wrapped = doc.splitTextToSize(value || '-', pageW - margin * 2)
    doc.text(wrapped, margin, y + 5)
    y += 5 + wrapped.length * 5 + 3
  }

  row('Comprador', data.buyerName)
  row('E-mail', data.buyerEmail)
  row('Telefone', data.buyerPhone)
  row('Produto', `${data.productTitle} (${data.productTypeLabel})`)
  row('Valor pago', formatBRL(data.amount))
  row('Status do pagamento', data.paymentStatusLabel)
  if (data.paymentMethodLabel) row('Forma de pagamento', data.paymentMethodLabel)
  if (data.transactionId) row('ID da transação', data.transactionId)
  row('Data e hora', formatDateTimeBR(data.purchasedAt))
  row(
    'Modalidade de acesso',
    data.timedAccess
      ? `${data.timedAccess.versionLabel || 'Acesso temporário'} — ${data.timedAccess.durationLabel}, contados a partir da ativação da Serial Key. Leitura no visualizador protegido, sem download.`
      : 'Acesso vitalício'
  )

  // Divisor
  y += 2
  doc.setDrawColor(230, 230, 230)
  doc.line(margin, y, pageW - margin, y)
  y += 10

  // Serial Key em destaque
  doc.setFillColor(240, 250, 245)
  doc.setDrawColor(...BRAND_GREEN)
  doc.roundedRect(margin, y, pageW - margin * 2, 20, 3, 3, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  doc.text('SUA SERIAL KEY', margin + 5, y + 7)
  doc.setFont('courier', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...BRAND_GREEN)
  doc.text(data.serialKey, margin + 5, y + 15)
  y += 28

  // QR + link de ativação
  try {
    const qr = await generateActivationQrDataUrl(data.activationUrl)
    doc.addImage(qr, 'PNG', margin, y, 34, 34)
  } catch {
    // segue sem QR se falhar
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...INK)
  doc.text('Ativar produto', margin + 40, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const linkLines = doc.splitTextToSize(
    'Escaneie o QR Code ou acesse o link abaixo para ativar seu acesso:',
    pageW - margin - (margin + 40)
  )
  doc.text(linkLines, margin + 40, y + 12)
  doc.setTextColor(...BRAND_ORANGE)
  const urlLines = doc.splitTextToSize(data.activationUrl, pageW - margin - (margin + 40))
  doc.text(urlLines, margin + 40, y + 12 + linkLines.length * 4 + 3)
  y += 42

  // Rodapé de suporte
  doc.setDrawColor(230, 230, 230)
  doc.line(margin, y, pageW - margin, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...MUTED)
  const support = doc.splitTextToSize(
    `Teve algum problema? Fale com nosso suporte em ${data.supportEmail || 'suporte@domineaqui.com.br'} e informe sua Serial Key.`,
    pageW - margin * 2
  )
  doc.text(support, margin, y)

  const ab = doc.output('arraybuffer') as ArrayBuffer
  return Buffer.from(ab)
}
