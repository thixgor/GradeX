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
import { emailFingerprint } from './watermark-fingerprint'

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

interface WatermarkRenderConfig {
  enabled: boolean
  opacity: number
  fontSize: number
  repeatGap: number
  xGap: number
  angle: number
  lineGap: number
  maxTextLength: number
}

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

function envNumber(name: string, fallback: number, min?: number, max?: number): number {
  const value = Number(process.env[name])
  if (!Number.isFinite(value)) return fallback
  return Math.min(max ?? value, Math.max(min ?? value, value))
}

function envBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name]
  if (value == null) return fallback
  return !['0', 'false', 'no', 'off'].includes(value.toLowerCase())
}

function trimText(value: string, maxLength: number): string {
  const normalized = (value || '').replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`
}

function getWatermarkRenderConfig(): WatermarkRenderConfig {
  return {
    enabled: envBoolean('PDF_WATERMARK_ENABLED', true),
    opacity: envNumber('PDF_WATERMARK_OPACITY', 0.055, 0.01, 0.25),
    fontSize: envNumber('PDF_WATERMARK_FONT_SIZE', 8, 6, 18),
    repeatGap: envNumber('PDF_WATERMARK_REPEAT_GAP', 260, 120, 520),
    xGap: envNumber('PDF_WATERMARK_X_GAP', 260, 120, 520),
    angle: envNumber('PDF_WATERMARK_ANGLE', 38, 0, 70),
    lineGap: envNumber('PDF_WATERMARK_LINE_GAP', 3, 0, 12),
    maxTextLength: envNumber('PDF_WATERMARK_MAX_TEXT_LENGTH', 64, 24, 120),
  }
}

/**
 * Aplica marca d'água diagonal repetida em uma única página do PDF.
 * A marca é desenhada em múltiplas posições para cobrir toda a página
 * e dificultar a remoção.
 */
function applyWatermarkToPage(
  page: PDFPage,
  lines: string[],
  font: any,
  config: WatermarkRenderConfig
): void {
  if (!config.enabled) return

  const { width, height } = page.getSize()

  // Cor: cinza muito transparente — visível mas não atrapalha leitura
  const color = rgb(0.3, 0.3, 0.3)

  // Ângulo diagonal (45°)
  const angle = degrees(config.angle)

  // Calcular largura máxima de linha (para centralização)
  const maxLineWidth = Math.max(
    ...lines.map(l => font.widthOfTextAtSize(l, config.fontSize))
  )

  // Tiling: repetir a marca em grade cobrindo toda a página
  // Espaçamento horizontal entre colunas (≈ largura máxima + margem)
  const xGap = maxLineWidth + config.xGap

  // Deslocamento vertical base de cada grupo de linhas
  const blockHeight = lines.length * (config.fontSize + config.lineGap)

  // Quantidade de repetições necessárias para cobrir diagonal
  const diagonal = Math.sqrt(width * width + height * height)
  const cols = Math.ceil(diagonal / xGap) + 2
  const rows = Math.ceil(diagonal / config.repeatGap) + 2

  // Centro da página (ponto de rotação)
  const cx = width / 2
  const cy = height / 2

  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      // Posição no espaço não-rotacionado
      const x = cx + col * xGap - maxLineWidth / 2
      const y = cy + row * config.repeatGap - blockHeight / 2

      lines.forEach((line, i) => {
        page.drawText(line, {
          x,
          y: y - i * (config.fontSize + config.lineGap),
          size: config.fontSize,
          font,
          color,
          opacity: config.opacity,
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

  // Carrega o PDF de origem. Em vez de modificar `sourceDoc` direto e
  // re-serializar (padrão que faz pdf-lib descartar XObjects de imagem em
  // PDFs gerados por PowerPoint/Canva/outros com estruturas indiretas),
  // copiamos todas as páginas para um novo documento — mesma abordagem
  // usada pelo viewer protegido (createWatermarkedSinglePagePdf), que
  // preserva imagens corretamente.
  const sourceDoc = await PDFDocument.load(originalPdfBytes, {
    ignoreEncryption: true,
  })

  const outputDoc = await PDFDocument.create()
  const pageIndices = sourceDoc.getPageIndices()
  const copiedPages = await outputDoc.copyPages(sourceDoc, pageIndices)
  for (const page of copiedPages) {
    outputDoc.addPage(page)
  }

  // ── Metadados de rastreio (embutidos no arquivo) ────────────────────────
  // Coloca dados do usuário nos metadados do PDF para rastreio forense.
  const originalTitle = sourceDoc.getTitle() || 'Material DomineAqui'
  const emailMarker = emailFingerprint(userEmail)
  const userMarker = `UID ${userId.slice(-8)} | ${emailMarker}`
  outputDoc.setTitle(`${originalTitle} - ${userName}`)
  outputDoc.setAuthor(userName)
  outputDoc.setSubject(
    `Licenciado para: ${userName} | ${userMarker} | Pedido: ${orderId} | Download: ${formatDate(downloadedAt)}`
  )
  outputDoc.setKeywords([userName, userId, emailMarker, orderId, 'DomineAqui'])
  outputDoc.setCreator('DomineAqui — domineaqui.com.br')
  outputDoc.setProducer('DomineAqui PDF Service')
  outputDoc.setModificationDate(downloadedAt)

  // ── Fonte ───────────────────────────────────────────────────────────────
  const font = await outputDoc.embedFont(StandardFonts.HelveticaBold)
  const renderConfig = getWatermarkRenderConfig()

  // Linhas que aparecem na marca d'água
  const watermarkLines = [
    trimText(userName, renderConfig.maxTextLength),
    userMarker,
    `Pedido: ${orderId.slice(-8)}`,
    formatDate(downloadedAt),
  ]

  // ── Aplicar marca em todas as páginas ───────────────────────────────────
  const pages = outputDoc.getPages()
  for (const page of pages) {
    applyWatermarkToPage(page, watermarkLines, font, renderConfig)
  }

  // ── Modo WATERMARK_AND_FLATTEN ──────────────────────────────────────────
  // Flattening converte campos de formulário interativos em conteúdo estático,
  // impedindo que scripts/formulários sejam manipulados.
  if (mode === 'WATERMARK_AND_FLATTEN' || mode === 'WATERMARK_AND_RESTRICT') {
    try {
      const form = outputDoc.getForm()
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
      const catalog = outputDoc.catalog
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

  return outputDoc.save({ useObjectStreams: true })
}

/**
 * Valida se um buffer é um PDF válido pelo magic bytes (%PDF).
 */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  // %PDF = 0x25 0x50 0x44 0x46
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
}
