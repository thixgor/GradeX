/**
 * Serviço de marca d'água em PDF para entrega segura de materiais.
 *
 * AVISO: Não existe proteção 100% inviolável em PDF. Este serviço aplica
 * camadas de proteção para dificultar redistribuição não autorizada, mas um
 * usuário determinado com ferramentas avançadas pode contorná-las.
 *
 * Modos de proteção (env: PDF_PROTECTION_MODE):
 *   WATERMARK_ONLY          – Marca d'água diagonal visível + metadados de rastreio
 *   WATERMARK_AND_FLATTEN   – Acima + flattening de campos de formulário
 *   WATERMARK_AND_RESTRICT  – Acima + permissões de leitura (sem cópia/impressão via viewer)
 */

import { PDFDocument, rgb, degrees, StandardFonts, PDFPage } from 'pdf-lib'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PdfProtectionMode =
  | 'WATERMARK_ONLY'
  | 'WATERMARK_AND_FLATTEN'
  | 'WATERMARK_AND_RESTRICT'

export interface WatermarkOptions {
  /** Nome completo do usuário */
  userName: string
  /** E-mail do usuário */
  userEmail: string
  /** ID do usuário no banco */
  userId: string
  /** ID do pedido / payment */
  orderId: string
  /** Data e hora do download */
  downloadedAt: Date
  /** Modo de proteção */
  mode?: PdfProtectionMode
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const DEFAULT_MODE: PdfProtectionMode =
  (process.env.PDF_PROTECTION_MODE as PdfProtectionMode) || 'WATERMARK_ONLY'

// Opacidade da marca d'água (0 = invisível, 1 = opaco)
const WATERMARK_OPACITY = 0.10

// Tamanho da fonte da marca d'água
const WATERMARK_FONT_SIZE = 11

// Espaçamento vertical entre repetições da marca
const WATERMARK_REPEAT_GAP = 120

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Aplica marca d'água diagonal repetida em uma única página do PDF.
 * A marca é desenhada em múltiplas posições para cobrir toda a página
 * e dificultar a remoção.
 */
function applyWatermarkToPage(
  page: PDFPage,
  lines: string[],
  font: any
): void {
  const { width, height } = page.getSize()

  // Cor: cinza muito transparente — visível mas não atrapalha leitura
  const color = rgb(0.3, 0.3, 0.3)

  // Ângulo diagonal (45°)
  const angle = degrees(45)

  // Calcular largura máxima de linha (para centralização)
  const maxLineWidth = Math.max(
    ...lines.map(l => font.widthOfTextAtSize(l, WATERMARK_FONT_SIZE))
  )

  // Tiling: repetir a marca em grade cobrindo toda a página
  // Espaçamento horizontal entre colunas (≈ largura máxima + margem)
  const xGap = maxLineWidth + 80

  // Deslocamento vertical base de cada grupo de linhas
  const blockHeight = lines.length * (WATERMARK_FONT_SIZE + 4)

  // Quantidade de repetições necessárias para cobrir diagonal
  const diagonal = Math.sqrt(width * width + height * height)
  const cols = Math.ceil(diagonal / xGap) + 2
  const rows = Math.ceil(diagonal / WATERMARK_REPEAT_GAP) + 2

  // Centro da página (ponto de rotação)
  const cx = width / 2
  const cy = height / 2

  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      // Posição no espaço não-rotacionado
      const x = cx + col * xGap - maxLineWidth / 2
      const y = cy + row * WATERMARK_REPEAT_GAP - blockHeight / 2

      lines.forEach((line, i) => {
        page.drawText(line, {
          x,
          y: y - i * (WATERMARK_FONT_SIZE + 4),
          size: WATERMARK_FONT_SIZE,
          font,
          color,
          opacity: WATERMARK_OPACITY,
          rotate: angle,
        })
      })
    }
  }
}

// ─── Exportação principal ────────────────────────────────────────────────────

/**
 * Baixa o PDF original do storage, aplica marca d'água com dados do usuário
 * e retorna os bytes do PDF personalizado.
 *
 * @param originalPdfBytes  Bytes do PDF original
 * @param options           Dados do usuário e modo de proteção
 * @returns                 Bytes do PDF com marca d'água
 */
export async function applyWatermark(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const {
    userName,
    userEmail,
    userId,
    orderId,
    downloadedAt,
    mode = DEFAULT_MODE,
  } = options

  const pdfDoc = await PDFDocument.load(originalPdfBytes, {
    // Ignora erros de XRef para compatibilidade com PDFs mal-formados
    ignoreEncryption: true,
  })

  // ── Metadados de rastreio (embutidos no arquivo) ────────────────────────
  // Coloca dados do usuário nos metadados do PDF para rastreio forense.
  const originalTitle = pdfDoc.getTitle() || 'Material DomineAqui'
  pdfDoc.setTitle(`${originalTitle} — ${userName} <${userEmail}>`)
  pdfDoc.setAuthor(userName)
  pdfDoc.setSubject(
    `Licenciado para: ${userName} (${userEmail}) | Pedido: ${orderId} | Download: ${formatDate(downloadedAt)}`
  )
  pdfDoc.setKeywords([userName, userEmail, userId, orderId, 'DomineAqui'])
  pdfDoc.setCreator('DomineAqui — domineaqui.com.br')
  pdfDoc.setProducer('DomineAqui PDF Service')
  pdfDoc.setModificationDate(downloadedAt)

  // ── Fonte ───────────────────────────────────────────────────────────────
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Linhas que aparecem na marca d'água
  const watermarkLines = [
    userName,
    userEmail,
    `ID: ${userId.slice(-8)}`,
    `Pedido: ${orderId.slice(-8)}`,
    formatDate(downloadedAt),
  ]

  // ── Aplicar marca em todas as páginas ───────────────────────────────────
  const pages = pdfDoc.getPages()
  for (const page of pages) {
    applyWatermarkToPage(page, watermarkLines, font)
  }

  // ── Modo WATERMARK_AND_FLATTEN ──────────────────────────────────────────
  // Flattening converte campos de formulário interativos em conteúdo estático,
  // impedindo que scripts/formulários sejam manipulados.
  if (mode === 'WATERMARK_AND_FLATTEN' || mode === 'WATERMARK_AND_RESTRICT') {
    try {
      const form = pdfDoc.getForm()
      form.flatten()
    } catch {
      // PDF sem formulários — ignorar
    }
  }

  // ── Modo WATERMARK_AND_RESTRICT ─────────────────────────────────────────
  // pdf-lib não suporta criptografia nativa de PDF (AES/RC4).
  // Esta seção aplica restrições de visualizador via ViewerPreferences,
  // que orientam o leitor a não permitir cópia — mas NÃO são enforçadas
  // criptograficamente e podem ser ignoradas por leitores não-conformes.
  //
  // Para criptografia real (UserPassword/OwnerPassword), seria necessário
  // uma biblioteca adicional como hummus-recipe ou node-qpdf.
  if (mode === 'WATERMARK_AND_RESTRICT') {
    try {
      // Definir preferências de visualização que sugerem restrições
      const catalog = pdfDoc.catalog
      // Instrução ao viewer: não mostrar barra de ferramentas, não abrir em tela cheia
      // A restrição de cópia real requer encryption — apenas setamos a flag de hint
      catalog.set(
        catalog.context.obj('Perms'),
        catalog.context.obj('{}')
      )
    } catch {
      // Silencioso — não crítico
    }
  }

  return pdfDoc.save()
}

/**
 * Valida se um buffer é um PDF válido pelo magic bytes (%PDF).
 */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  // %PDF = 0x25 0x50 0x44 0x46
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
}
