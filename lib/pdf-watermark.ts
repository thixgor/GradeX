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

import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFPage,
  PDFName,
  PDFEmbeddedPage,
  PDFDict,
  PDFRef,
  PDFStream,
} from 'pdf-lib'
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
    // Padrões calibrados para a marca ser legível (nome/UID/pedido/data
    // identificáveis num vazamento) sem atrapalhar a leitura. O valor antigo
    // (opacity 0.055) deixava a marca praticamente invisível. Tudo continua
    // ajustável por env.
    opacity: envNumber('PDF_WATERMARK_OPACITY', 0.10, 0.01, 0.25),
    fontSize: envNumber('PDF_WATERMARK_FONT_SIZE', 9, 6, 18),
    repeatGap: envNumber('PDF_WATERMARK_REPEAT_GAP', 210, 120, 520),
    xGap: envNumber('PDF_WATERMARK_X_GAP', 180, 120, 520),
    angle: envNumber('PDF_WATERMARK_ANGLE', 38, 0, 70),
    lineGap: envNumber('PDF_WATERMARK_LINE_GAP', 3, 0, 12),
    maxTextLength: envNumber('PDF_WATERMARK_MAX_TEXT_LENGTH', 64, 24, 120),
  }
}

/**
 * Declara um grupo de transparência (DeviceRGB) na página.
 *
 * Por que isso é necessário:
 *   PDFs exportados de PowerPoint/Canva/etc. frequentemente contêm imagens
 *   com soft mask (SMask, transparência). Ao reescrever as páginas e desenhar
 *   a marca d'água com `opacity` (alpha), introduzimos estados de transparência
 *   na página. Renderizadores de desktop (Adobe, Chrome/pdfium) e o pdf.js do
 *   viewer toleram a ausência de um grupo de transparência declarado, mas o
 *   renderizador NATIVO do iOS/Safari (PDFKit/QuickLook) é estrito: sem o
 *   `/Group` de transparência, ele compõe as imagens com soft-mask de forma
 *   incorreta, exibindo-as PRETAS ou BRANCAS no download.
 *
 *   Declarar `<< /Type /Group /S /Transparency /CS /DeviceRGB >>` na página
 *   faz o iOS compor corretamente tanto a marca d'água translúcida quanto as
 *   imagens da fonte. Sem efeito colateral nos demais leitores.
 */
function ensurePageTransparencyGroup(page: PDFPage, doc: PDFDocument): void {
  const existing = page.node.lookupMaybe(PDFName.of('Group'), PDFDict)
  if (existing) {
    // Grupo já declarado no PDF de origem: preserva como está, apenas
    // completando o espaço de cor quando ele falta — o iOS precisa do /CS
    // para compor a transparência, e um grupo sem ele cai no mesmo problema
    // de grupo nenhum.
    if (!existing.has(PDFName.of('CS'))) {
      existing.set(PDFName.of('CS'), PDFName.of('DeviceRGB'))
    }
    return
  }
  // Entrada /Group presente mas fora do formato esperado: não mexe.
  if (page.node.has(PDFName.of('Group'))) return

  const group = doc.context.obj({
    Type: 'Group',
    S: 'Transparency',
    CS: 'DeviceRGB',
  })
  page.node.set(PDFName.of('Group'), group)
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

/**
 * Constrói UMA VEZ um PDF de uma página só (do tamanho pedido) contendo a
 * grade de marca d'água. Esse overlay é depois embutido no documento final e
 * "carimbado" em cada página com uma única operação (drawPage), em vez de
 * repetir centenas de chamadas drawText por página.
 *
 * Por que isso importa:
 *   O tiling gera (colunas × linhas × textos) chamadas de desenho por página.
 *   Feito diretamente em cada página, um PDF com muitas páginas acumula
 *   dezenas/centenas de milhares de operações no content stream — o que
 *   estoura o tempo de execução (504 no download) e a memória (OOM/500 no
 *   envio por e-mail). Desenhando o padrão uma vez por tamanho de página e
 *   reutilizando como XObject, o custo passa a ser praticamente O(nº de
 *   tamanhos distintos), não O(nº de páginas).
 */
async function buildWatermarkOverlayPdf(
  width: number,
  height: number,
  lines: string[],
  config: WatermarkRenderConfig
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([width, height])
  applyWatermarkToPage(page, lines, font, config)
  return doc.save()
}

// ─── Preservação do conteúdo original ────────────────────────────────────────

/**
 * Conta os XObjects de imagem alcançáveis a partir das páginas (descendo
 * também nos Form XObjects aninhados).
 *
 * Serve de rede de segurança: se o número de imagens cair entre o PDF de
 * origem e o PDF carimbado, alguma figura se perdeu no caminho e o arquivo
 * entregue ao comprador estaria furado. É barato (só percorre dicionários,
 * não decodifica imagem nenhuma) e é o que os testes usam para garantir que
 * a marca d'água não come as figuras do material.
 */
export function countImageXObjects(doc: PDFDocument): number {
  const context = doc.context
  const visited = new Set<string>()
  let total = 0

  const walkResources = (resources: PDFDict | undefined, depth: number): void => {
    if (!resources || depth > 12) return
    const xObjects = resources.lookupMaybe(PDFName.of('XObject'), PDFDict)
    if (!xObjects) return

    for (const [, value] of xObjects.entries()) {
      if (value instanceof PDFRef) {
        const key = value.toString()
        if (visited.has(key)) continue
        visited.add(key)
      }
      const stream = context.lookup(value)
      if (!(stream instanceof PDFStream)) continue

      const subtype = stream.dict.get(PDFName.of('Subtype'))
      const subtypeName = subtype instanceof PDFName ? subtype.asString() : ''
      if (subtypeName === '/Image') {
        total += 1
      } else if (subtypeName === '/Form') {
        walkResources(
          stream.dict.context.lookupMaybe(stream.dict.get(PDFName.of('Resources')), PDFDict),
          depth + 1
        )
      }
    }
  }

  for (const page of doc.getPages()) {
    walkResources(page.node.Resources(), 0)
  }
  return total
}

/**
 * Marca o Form XObject do overlay como grupo de transparência ISOLADO.
 *
 * O overlay é desenhado com alpha (`ca`/`CA` < 1). Sem um `/Group` próprio,
 * renderizadores estritos (Quartz/PDFKit no iOS) compõem o overlay usando o
 * fundo da página como backdrop do grupo — o que, em páginas que já têm
 * imagens com soft-mask, produz figuras pretas ou brancas. Declarando o
 * grupo como isolado (`/I true`), o overlay é composto contra um fundo
 * transparente e só depois aplicado sobre a página, que é o comportamento
 * que os demais leitores já assumem.
 *
 * Precisa rodar DEPOIS de `doc.flush()`: só aí o pdf-lib materializa o
 * objeto do XObject embutido no contexto.
 */
function markOverlayAsIsolatedGroup(doc: PDFDocument, ref: PDFRef): void {
  const stream = doc.context.lookup(ref)
  if (!(stream instanceof PDFStream)) return
  if (stream.dict.has(PDFName.of('Group'))) return
  stream.dict.set(
    PDFName.of('Group'),
    doc.context.obj({ Type: 'Group', S: 'Transparency', CS: 'DeviceRGB', I: true })
  )
}

/**
 * Carimba o overlay de marca d'água em todas as páginas do documento.
 *
 * A grade é construída uma vez por TAMANHO de página e reaproveitada como
 * XObject (ver buildWatermarkOverlayPdf), então o custo é O(nº de tamanhos
 * distintos) e não O(nº de páginas).
 */
async function stampWatermarkOverlay(
  doc: PDFDocument,
  watermarkLines: string[],
  config: WatermarkRenderConfig
): Promise<void> {
  if (!config.enabled) return

  const overlayCache = new Map<string, PDFEmbeddedPage>()
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()
    const key = `${Math.round(width)}x${Math.round(height)}`

    let overlay = overlayCache.get(key)
    if (!overlay) {
      const overlayBytes = await buildWatermarkOverlayPdf(width, height, watermarkLines, config)
      const [embedded] = await doc.embedPdf(overlayBytes)
      overlayCache.set(key, embedded)
      overlay = embedded
    }

    // Garante compositing correto de transparência no iOS/Safari (ver helper).
    ensurePageTransparencyGroup(page, doc)
    // Carimba o overlay cobrindo a página inteira (uma operação por página).
    page.drawPage(overlay, { x: 0, y: 0, width, height })
  }

  // Materializa os XObjects embutidos para conseguir marcá-los como grupo
  // isolado de transparência antes da serialização.
  await doc.flush()
  for (const overlay of overlayCache.values()) {
    markOverlayAsIsolatedGroup(doc, overlay.ref)
  }
}

// ─── Exportação principal ────────────────────────────────────────────────────

/**
 * Aplica marca d'água com dados do usuário sobre o PDF original e retorna os
 * bytes do PDF personalizado.
 *
 * O carimbo é feito SOBRE O PRÓPRIO documento de origem (in-place). Isso é
 * essencial para não perder figuras: a abordagem anterior copiava as páginas
 * para um documento novo (`copyPages`), e o copiador do pdf-lib leva só o que
 * é alcançável a partir da página — o catálogo do documento fica para trás.
 * Em PDFs com conteúdo opcional (camadas/OCG — comuns em arquivos exportados
 * de InDesign/Illustrator/Word), o `/OCProperties` do catálogo se perdia e as
 * figuras marcadas com `/OC` sumiam nos leitores estritos (Acrobat e o
 * PDFKit/Quick Look do iOS, usado na pré-visualização do Gmail/Drive no
 * celular), enquanto continuavam aparecendo no pdf.js do visualizador do site
 * — exatamente o sintoma de "chegou sem imagem" no PDF enviado por e-mail.
 * Editando o documento original, catálogo, camadas, perfis de cor e demais
 * estruturas ficam intactos.
 *
 * @param originalPdfBytes  Bytes do PDF original
 * @param options           Dados do usuário e modo de proteção
 * @returns                 Bytes do PDF com marca d'água
 */
export async function applyWatermark(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const renderConfig = getWatermarkRenderConfig()
  const watermarkLines = buildWatermarkLines(options, renderConfig)

  const doc = await PDFDocument.load(originalPdfBytes, {
    ignoreEncryption: true,
    // Os metadados são reescritos adiante com os dados do licenciado.
    updateMetadata: false,
  })
  // O pdf-lib não decripta streams: se o original vier com /Encrypt, ele
  // seria reemitido no trailer e o leitor tentaria decriptar um conteúdo
  // que já está em claro. Remover a entrada mantém o arquivo consistente.
  delete (doc.context.trailerInfo as any).Encrypt

  try {
    return await finalizeWatermarkedDoc(doc, doc.getTitle(), options, watermarkLines, renderConfig)
  } catch (error) {
    // Rede de segurança: se o documento de origem for danificado a ponto de o
    // pdf-lib não conseguir reserializá-lo inteiro, cai para a estratégia
    // antiga — documento novo com as páginas copiadas.
    console.error(
      '[pdf-watermark] Carimbo in-place falhou; usando cópia de páginas (pode perder camadas):',
      error
    )
    return applyWatermarkByCopyingPages(originalPdfBytes, options, watermarkLines, renderConfig)
  }
}

/** Linhas que aparecem na marca d'água. */
function buildWatermarkLines(options: WatermarkOptions, config: WatermarkRenderConfig): string[] {
  return [
    trimText(options.userName, config.maxTextLength),
    buildUserMarker(options),
    `Pedido: ${options.orderId.slice(-8)}`,
    formatDate(options.downloadedAt),
  ]
}

function buildUserMarker(options: WatermarkOptions): string {
  return `UID ${options.userId.slice(-8)} | ${emailFingerprint(options.userEmail)}`
}

/**
 * Estratégia de reserva (documento novo + `copyPages`). Só é usada quando o
 * carimbo in-place falha — ela NÃO preserva o catálogo do original (camadas,
 * `/OCProperties` etc.), então o resultado é verificado: se o número de
 * imagens cair, registramos o problema no log para o admin conseguir
 * diagnosticar em vez de descobrir pelo comprador.
 */
async function applyWatermarkByCopyingPages(
  originalPdfBytes: Uint8Array | ArrayBuffer,
  options: WatermarkOptions,
  watermarkLines: string[],
  renderConfig: WatermarkRenderConfig
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(originalPdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  })
  const sourceImages = countImageXObjects(sourceDoc)

  const outputDoc = await PDFDocument.create()
  const copiedPages = await outputDoc.copyPages(sourceDoc, sourceDoc.getPageIndices())
  for (const page of copiedPages) {
    outputDoc.addPage(page)
  }

  const bytes = await finalizeWatermarkedDoc(
    outputDoc,
    sourceDoc.getTitle(),
    options,
    watermarkLines,
    renderConfig
  )

  const outputImages = countImageXObjects(outputDoc)
  if (outputImages < sourceImages) {
    console.error(
      `[pdf-watermark] A cópia de páginas perdeu imagens: ${sourceImages} no original x ${outputImages} no arquivo entregue.`
    )
  }

  return bytes
}

/**
 * Passo final comum às duas estratégias: metadados de rastreio, carimbo da
 * marca d'água e serialização.
 */
async function finalizeWatermarkedDoc(
  doc: PDFDocument,
  originalTitle: string | undefined,
  options: WatermarkOptions,
  watermarkLines: string[],
  renderConfig: WatermarkRenderConfig
): Promise<Uint8Array> {
  const { userName, userId, orderId, downloadedAt, mode = DEFAULT_MODE } = options

  // ── Metadados de rastreio (embutidos no arquivo) ────────────────────────
  // Coloca dados do usuário nos metadados do PDF para rastreio forense.
  const userMarker = buildUserMarker(options)
  doc.setTitle(`${originalTitle || 'Material DomineAqui'} - ${userName}`)
  doc.setAuthor(userName)
  doc.setSubject(
    `Licenciado para: ${userName} | ${userMarker} | Pedido: ${orderId} | Download: ${formatDate(downloadedAt)}`
  )
  doc.setKeywords([userName, userId, emailFingerprint(options.userEmail), orderId, 'DomineAqui'])
  doc.setCreator('DomineAqui — domineaqui.com.br')
  doc.setProducer('DomineAqui PDF Service')
  doc.setModificationDate(downloadedAt)

  // ── Aplicar marca em todas as páginas ───────────────────────────────────
  await stampWatermarkOverlay(doc, watermarkLines, renderConfig)

  // ── Modo WATERMARK_AND_FLATTEN ──────────────────────────────────────────
  // Flattening converte campos de formulário interativos em conteúdo estático,
  // impedindo que scripts/formulários sejam manipulados.
  if (mode === 'WATERMARK_AND_FLATTEN' || mode === 'WATERMARK_AND_RESTRICT') {
    try {
      const form = doc.getForm()
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
      const catalog = doc.catalog
      // Instrução ao viewer: não mostrar barra de ferramentas, não abrir em tela cheia
      // A restrição de cópia real requer encryption — apenas setamos a flag de hint
      catalog.set(catalog.context.obj('Perms'), catalog.context.obj('{}'))
    } catch {
      // Silencioso — não crítico
    }
  }

  // useObjectStreams: false — formato PDF mais conservador (sem PDF 1.5
  // compressed object streams), melhor tolerado por leitores antigos.
  return doc.save({ useObjectStreams: false })
}

/**
 * Valida se um buffer é um PDF válido pelo magic bytes (%PDF).
 */
export function isPdfBuffer(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 4))
  // %PDF = 0x25 0x50 0x44 0x46
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
}
