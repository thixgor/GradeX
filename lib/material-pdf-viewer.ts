import { NextRequest } from 'next/server'
import { Db, ObjectId } from 'mongodb'
import { PDFDocument, PDFPage, PDFName, StandardFonts, degrees, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { TokenPayload } from './auth'
import { getDb } from './mongodb'
import { isPdfBuffer } from './pdf-watermark'
import { emailFingerprint } from './watermark-fingerprint'

export type MaterialPdfAccessResult =
  | {
      ok: true
      db: Db
      material: any
      user: any
      materialId: string
      isAdmin: boolean
      hasAccess: boolean
    }
  | {
      ok: false
      status: number
      error: string
    }

export type PdfViewerMode = 'single' | 'width' | 'continuous'

interface PdfBytesCacheEntry {
  bytes: ArrayBuffer
  expiresAt: number
  sizeBytes: number
}

interface ViewerWatermarkConfig {
  enabled: boolean
  repeated: boolean
  qrEnabled: boolean
  opacity: number
  footerOpacity: number
  angle: number
  minFontSize: number
  maxFontSize: number
  xGap: number
  yGap: number
  lineGap: number
  qrSize: number
  maxTextLength: number
}

const pdfBytesCache = new Map<string, PdfBytesCacheEntry>()
const pdfBytesInflight = new Map<string, Promise<ArrayBuffer>>()

interface RenderedPageCacheEntry {
  bytes: Uint8Array
  totalPages: number
  expiresAt: number
}

// Cache do PDF de página JÁ renderizado (com marca d'água), evitando rodar
// PDFDocument.load + copyPages + o loop de watermark a cada request. A chave é
// o auditToken, que já codifica (usuário + material + página + janela de 5min),
// então o conteúdo é estável dentro do TTL. Esse é o maior ofensor de Active CPU
// do viewer porque a leitura de um PDF dispara muitos renders da mesma página
// (scroll/zoom/virar página) e o Cache-Control privado não cobre cache-misses
// entre instâncias serverless.
const renderedPageCache = new Map<string, RenderedPageCacheEntry>()
const renderedPageInflight = new Map<string, Promise<{ bytes: Uint8Array; totalPages: number }>>()

interface SourceDocCacheEntry {
  doc: PDFDocument
  totalPages: number
  expiresAt: number
}

// Cache do PDFDocument JÁ PARSEADO (documento-fonte), chaveado pelo blobUrl.
// Sem isso, renderizar cada página nova refaz PDFDocument.load() do PDF
// inteiro — para um PDF de 1000 páginas/20MB, virar páginas dispara 1 parse
// completo POR página, o que domina o tempo/CPU do render. Aqui o parse roda
// 1x por instância dentro do TTL e cada página vira só um copyPages.
// O documento-fonte é apenas lido (copyPages/getPageCount), nunca mutado,
// então o reuso entre requests é seguro. A chave é o blobUrl, que muda a cada
// novo upload — invalidando o cache automaticamente, sem servir versão velha.
const sourceDocCache = new Map<string, SourceDocCacheEntry>()
const sourceDocInflight = new Map<string, Promise<{ doc: PDFDocument; totalPages: number }>>()

async function loadSourceDoc(
  originalPdfBytes: ArrayBuffer,
  cacheKey?: string
): Promise<{ doc: PDFDocument; totalPages: number }> {
  const cacheEnabled = envBoolean('PDF_VIEWER_SOURCEDOC_CACHE_ENABLED', true)
  if (!cacheEnabled || !cacheKey) {
    const doc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true })
    return { doc, totalPages: doc.getPageCount() }
  }

  const now = Date.now()
  const cached = sourceDocCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return { doc: cached.doc, totalPages: cached.totalPages }
  }
  if (cached) sourceDocCache.delete(cacheKey)

  const pending = sourceDocInflight.get(cacheKey)
  if (pending) return pending

  const load = (async () => {
    const doc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true })
    const totalPages = doc.getPageCount()
    const ttlMs = envNumber('PDF_VIEWER_SOURCEDOC_CACHE_TTL_MS', 10 * 60 * 1000, 0, 60 * 60 * 1000)
    const maxEntries = Math.floor(envNumber('PDF_VIEWER_SOURCEDOC_CACHE_MAX_ENTRIES', 4, 1, 20))
    if (ttlMs > 0) {
      while (sourceDocCache.size >= maxEntries) {
        const oldestKey = sourceDocCache.keys().next().value
        if (!oldestKey) break
        sourceDocCache.delete(oldestKey)
      }
      sourceDocCache.set(cacheKey, { doc, totalPages, expiresAt: Date.now() + ttlMs })
    }
    return { doc, totalPages }
  })()

  sourceDocInflight.set(cacheKey, load)
  try {
    return await load
  } finally {
    sourceDocInflight.delete(cacheKey)
  }
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

function cloneBytes(bytes: ArrayBuffer): ArrayBuffer {
  return bytes.slice(0)
}

function trimText(value: string | undefined, fallback: string, maxLength: number): string {
  const normalized = (value || fallback).replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 3))}...`
}

function getViewerWatermarkConfig(): ViewerWatermarkConfig {
  return {
    enabled: envBoolean('PDF_VIEWER_WATERMARK_ENABLED', true),
    repeated: envBoolean('PDF_VIEWER_WATERMARK_REPEATED', true),
    qrEnabled: envBoolean('PDF_VIEWER_WATERMARK_QR_ENABLED', false),
    opacity: envNumber('PDF_VIEWER_WATERMARK_OPACITY', 0.085, 0.01, 0.25),
    footerOpacity: envNumber('PDF_VIEWER_WATERMARK_FOOTER_OPACITY', 0.36, 0.05, 0.8),
    angle: envNumber('PDF_VIEWER_WATERMARK_ANGLE', 34, 0, 70),
    minFontSize: envNumber('PDF_VIEWER_WATERMARK_MIN_FONT_SIZE', 8, 5, 18),
    maxFontSize: envNumber('PDF_VIEWER_WATERMARK_MAX_FONT_SIZE', 10, 6, 24),
    xGap: envNumber('PDF_VIEWER_WATERMARK_X_GAP', 150, 90, 520),
    yGap: envNumber('PDF_VIEWER_WATERMARK_Y_GAP', 130, 80, 520),
    lineGap: envNumber('PDF_VIEWER_WATERMARK_LINE_GAP', 3, 0, 12),
    qrSize: envNumber('PDF_VIEWER_WATERMARK_QR_SIZE', 48, 32, 96),
    maxTextLength: envNumber('PDF_VIEWER_WATERMARK_MAX_TEXT_LENGTH', 70, 24, 140),
  }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function formatViewerDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function validateMaterialPdfAccess(
  materialId: string,
  session: TokenPayload,
  options: { requireViewerEnabled?: boolean; requirePdf?: boolean } = {}
): Promise<MaterialPdfAccessResult> {
  const requireViewerEnabled = options.requireViewerEnabled ?? true
  const requirePdf = options.requirePdf ?? true

  if (!materialId || !ObjectId.isValid(materialId)) {
    return { ok: false, status: 400, error: 'ID do material invalido' }
  }

  const db = await getDb()
  const isAdmin = session.role === 'admin'
  const objectId = new ObjectId(materialId)

  const [user, material] = await Promise.all([
    db.collection('users').findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { name: 1, email: 1, accountType: 1, secondaryRole: 1, cpf: 1 } }
    ),
    db.collection('materials').findOne({
      _id: objectId,
      ...(isAdmin ? {} : { isHidden: false }),
    }),
  ])

  if (!material) {
    return { ok: false, status: 404, error: 'Material nao encontrado' }
  }

  if (requirePdf && !material.pdfFile?.blobUrl) {
    return { ok: false, status: 422, error: 'Este material nao possui PDF vinculado' }
  }

  if (requireViewerEnabled && material.pdfViewerEnabled !== true) {
    return { ok: false, status: 403, error: 'O visualizador deste PDF esta desabilitado' }
  }

  let hasAccess = isAdmin
  const userGroups: string[] = []

  if (!isAdmin) {
    if (user?.accountType) userGroups.push(user.accountType)
    if (user?.secondaryRole === 'monitor') userGroups.push('monitor')

    if (material.pricing === 'paid') {
      const baseFilter = { itemId: materialId, itemType: 'material', status: 'completed' }
      const emailRegex = session.email
        ? new RegExp(
            `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
            'i'
          )
        : null
      const byUserId = await db.collection('material_purchases').findOne({
        ...baseFilter,
        userId: session.userId,
      })

      if (byUserId) {
        hasAccess = true
      } else if (emailRegex) {
        const byEmail = await db.collection('material_purchases').findOne({
          ...baseFilter,
          userEmail: { $regex: emailRegex },
        })
        hasAccess = !!byEmail
      }

      if (!hasAccess) {
        const packages = await db.collection('material_packages')
          .find({ materialIds: materialId, isHidden: { $ne: true } })
          .project({ _id: 1 })
          .toArray()
        const packageIds = packages.map((pkg: any) => String(pkg._id))

        if (packageIds.length > 0) {
          const packageFilter = {
            itemType: 'package',
            itemId: { $in: packageIds },
            status: 'completed',
          }
          const packageByUserId = await db.collection('material_purchases').findOne({
            ...packageFilter,
            userId: session.userId,
          })

          if (packageByUserId) {
            hasAccess = true
          } else if (emailRegex) {
            const packageByEmail = await db.collection('material_purchases').findOne({
              ...packageFilter,
              userEmail: { $regex: emailRegex },
            })
            hasAccess = !!packageByEmail
          }
        }
      }
    } else {
      hasAccess =
        !material.allowedGroups?.length ||
        userGroups.some((group) => material.allowedGroups.includes(group))
    }
  }

  if (!hasAccess) {
    return { ok: false, status: 403, error: 'Voce nao tem acesso a este material' }
  }

  return { ok: true, db, material, user, materialId, isAdmin, hasAccess }
}

export async function fetchMaterialPdfBytes(blobUrl: string): Promise<ArrayBuffer> {
  const cacheEnabled = envBoolean('PDF_VIEWER_BLOB_CACHE_ENABLED', true)
  const ttlMs = envNumber('PDF_VIEWER_BLOB_CACHE_TTL_MS', 10 * 60 * 1000, 0, 60 * 60 * 1000)
  const maxEntries = Math.floor(envNumber('PDF_VIEWER_BLOB_CACHE_MAX_ENTRIES', 6, 1, 40))
  const maxCacheBytes = envNumber('PDF_VIEWER_BLOB_CACHE_MAX_MB', 160, 1, 1024) * 1024 * 1024
  const now = Date.now()

  if (cacheEnabled) {
    const cached = pdfBytesCache.get(blobUrl)
    if (cached && cached.expiresAt > now) {
      return cloneBytes(cached.bytes)
    }
    if (cached) pdfBytesCache.delete(blobUrl)

    const pending = pdfBytesInflight.get(blobUrl)
    if (pending) {
      return cloneBytes(await pending)
    }
  }

  const download = (async () => {
    const response = await fetch(blobUrl, {
      headers: {
        ...(process.env.BLOB_READ_WRITE_TOKEN
          ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
          : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Falha ao recuperar PDF do storage: ${response.status}`)
    }

    const bytes = await response.arrayBuffer()
    if (!isPdfBuffer(bytes)) {
      throw new Error('Arquivo recuperado nao e um PDF valido')
    }

    if (cacheEnabled && ttlMs > 0 && bytes.byteLength <= maxCacheBytes) {
      while (pdfBytesCache.size >= maxEntries) {
        const oldestKey = pdfBytesCache.keys().next().value
        if (!oldestKey) break
        pdfBytesCache.delete(oldestKey)
      }
      pdfBytesCache.set(blobUrl, {
        bytes,
        expiresAt: Date.now() + ttlMs,
        sizeBytes: bytes.byteLength,
      })
    }

    return bytes
  })()

  if (cacheEnabled) {
    pdfBytesInflight.set(blobUrl, download)
  }

  try {
    return cloneBytes(await download)
  } finally {
    pdfBytesInflight.delete(blobUrl)
  }
}

export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  return doc.getPageCount()
}

function drawRepeatedWatermark(
  page: PDFPage,
  lines: string[],
  font: any,
  options: {
    materialId: string
    auditToken: string
    config: ViewerWatermarkConfig
    footerLabel: string
  }
) {
  if (!options.config.enabled) return

  const { width, height } = page.getSize()
  const fontSize = Math.max(options.config.minFontSize, Math.min(options.config.maxFontSize, width / 72))
  const color = rgb(0.02, 0.24, 0.17)
  const gold = rgb(0.82, 0.66, 0.32)
  const angle = degrees(options.config.angle)

  if (options.config.repeated) {
    const maxLineWidth = Math.max(...lines.map((line) => font.widthOfTextAtSize(line, fontSize)))
    const xGap = maxLineWidth + options.config.xGap
    const yGap = options.config.yGap
    const diagonal = Math.sqrt(width * width + height * height)
    const cols = Math.ceil(diagonal / xGap) + 2
    const rows = Math.ceil(diagonal / yGap) + 2
    const cx = width / 2
    const cy = height / 2

    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const x = cx + col * xGap - maxLineWidth / 2
        const y = cy + row * yGap

        lines.forEach((line, index) => {
          page.drawText(line, {
            x,
            y: y - index * (fontSize + options.config.lineGap),
            size: fontSize,
            font,
            color: index % 2 === 0 ? color : gold,
            opacity: options.config.opacity,
            rotate: angle,
          })
        })
      }
    }
  } else {
    const centerFontSize = Math.max(10, Math.min(15, width / 48))
    const centerOpacity = Math.min(0.18, options.config.opacity * 1.9)
    const blockWidth = Math.max(...lines.map((line) => font.widthOfTextAtSize(line, centerFontSize)))
    const startY = height / 2 + centerFontSize

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: width / 2 - blockWidth / 2,
        y: startY - index * (centerFontSize + options.config.lineGap + 2),
        size: centerFontSize,
        font,
        color: index % 2 === 0 ? color : gold,
        opacity: centerOpacity,
        rotate: angle,
      })
    })
  }

  const { width: pageWidth } = page.getSize()
  const footerFontSize = 7.5
  const footerText = options.footerLabel
  const footerWidth = font.widthOfTextAtSize(footerText, footerFontSize)
  page.drawText(footerText, {
    x: 22,
    y: 20,
    size: footerFontSize,
    font,
    color,
    opacity: options.config.footerOpacity,
  })
  const auditText = `Material ${options.materialId} | Token ${options.auditToken.slice(0, 10)}`
  const auditWidth = font.widthOfTextAtSize(auditText, 6.5)
  page.drawText(auditText, {
    x: Math.max(22 + footerWidth + 18, pageWidth - auditWidth - 22),
    y: 20,
    size: 6.5,
    font,
    color,
    opacity: Math.max(0.18, options.config.footerOpacity - 0.12),
  })
}

type WatermarkPageInput = {
  pageNumber: number
  userName: string
  userEmail: string
  userId: string
  materialId: string
  materialTitle: string
  viewedAt: Date
  auditToken: string
  // Chave de cache do documento-fonte parseado (use o blobUrl). Opcional:
  // sem ela, o PDF é parseado a cada render (comportamento antigo).
  sourceCacheKey?: string
}

export async function createWatermarkedSinglePagePdf(
  originalPdfBytes: ArrayBuffer,
  input: WatermarkPageInput
): Promise<{ bytes: Uint8Array; totalPages: number }> {
  const cacheEnabled = envBoolean('PDF_VIEWER_PAGE_CACHE_ENABLED', true)

  if (cacheEnabled && input.auditToken) {
    const now = Date.now()
    const cached = renderedPageCache.get(input.auditToken)
    if (cached && cached.expiresAt > now) {
      return { bytes: cached.bytes, totalPages: cached.totalPages }
    }
    if (cached) renderedPageCache.delete(input.auditToken)

    const pending = renderedPageInflight.get(input.auditToken)
    if (pending) return pending
  }

  const render = renderWatermarkedSinglePagePdf(originalPdfBytes, input)

  if (!cacheEnabled || !input.auditToken) {
    return render
  }

  renderedPageInflight.set(input.auditToken, render)
  try {
    const result = await render
    const ttlMs = envNumber('PDF_VIEWER_PAGE_CACHE_TTL_MS', 5 * 60 * 1000, 0, 30 * 60 * 1000)
    const maxEntries = Math.floor(envNumber('PDF_VIEWER_PAGE_CACHE_MAX_ENTRIES', 80, 1, 500))
    if (ttlMs > 0) {
      while (renderedPageCache.size >= maxEntries) {
        const oldestKey = renderedPageCache.keys().next().value
        if (!oldestKey) break
        renderedPageCache.delete(oldestKey)
      }
      renderedPageCache.set(input.auditToken, {
        bytes: result.bytes,
        totalPages: result.totalPages,
        expiresAt: Date.now() + ttlMs,
      })
    }
    return result
  } finally {
    renderedPageInflight.delete(input.auditToken)
  }
}

async function renderWatermarkedSinglePagePdf(
  originalPdfBytes: ArrayBuffer,
  input: WatermarkPageInput
): Promise<{ bytes: Uint8Array; totalPages: number }> {
  const { doc: sourceDoc, totalPages } = await loadSourceDoc(originalPdfBytes, input.sourceCacheKey)
  const safePageNumber = Math.min(Math.max(input.pageNumber, 1), totalPages)

  const outputDoc = await PDFDocument.create()
  const [copiedPage] = await outputDoc.copyPages(sourceDoc, [safePageNumber - 1])
  outputDoc.addPage(copiedPage)

  const font = await outputDoc.embedFont(StandardFonts.HelveticaBold)
  const page = outputDoc.getPages()[0]

  // Declara grupo de transparência DeviceRGB para compositing correto de
  // imagens com soft-mask + marca d'água translúcida no renderizador nativo
  // do iOS/Safari (PDFKit). Sem isso, imagens podem aparecer pretas/brancas.
  if (!page.node.has(PDFName.of('Group'))) {
    page.node.set(
      PDFName.of('Group'),
      outputDoc.context.obj({ Type: 'Group', S: 'Transparency', CS: 'DeviceRGB' })
    )
  }
  const config = getViewerWatermarkConfig()
  const viewedAtLabel = formatViewerDate(input.viewedAt)
  const userMarker = `UID ${input.userId.slice(-8)} | ${emailFingerprint(input.userEmail)}`
  const watermarkLines = [
    trimText(input.userName, 'Usuario DomineAqui', config.maxTextLength),
    userMarker,
    `Visualizado ${viewedAtLabel}`,
  ]

  const qrPayload = JSON.stringify({
    platform: 'DomineAqui',
    userId: input.userId,
    materialId: input.materialId,
    pageNumber: safePageNumber,
    timestamp: input.viewedAt.toISOString(),
    auditToken: input.auditToken,
  })

  let qrImage
  if (config.qrEnabled) {
    try {
      const qrBytes = await QRCode.toBuffer(qrPayload, {
        width: Math.max(96, config.qrSize * 2),
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#0b3d2e', light: '#ffffff' },
      })
      qrImage = await outputDoc.embedPng(qrBytes)
    } catch (error) {
      console.warn('[pdf-viewer] Falha ao gerar QR Code:', error)
    }
  }

  const safeUserName = trimText(input.userName, 'Usuario DomineAqui', 50)
  const safeUserEmail = trimText(input.userEmail, 'email nao informado', 60)
  const footerLabel = `${safeUserName} - ${safeUserEmail} - UID ${input.userId.slice(-8)} - ${viewedAtLabel}`

  drawRepeatedWatermark(page, watermarkLines, font, {
    materialId: input.materialId,
    auditToken: input.auditToken,
    config,
    footerLabel,
  })

  if (qrImage) {
    const { width, height } = page.getSize()
    const size = Math.min(config.qrSize, Math.max(38, width * 0.08))
    page.drawRectangle({
      x: width - size - 22,
      y: 20,
      width: size + 8,
      height: size + 18,
      color: rgb(1, 1, 1),
      opacity: 0.72,
      borderColor: rgb(0.82, 0.66, 0.32),
      borderWidth: 0.5,
    })
    page.drawImage(qrImage, {
      x: width - size - 18,
      y: 34,
      width: size,
      height: size,
      opacity: 0.78,
    })
    page.drawText('auditoria', {
      x: width - size - 14,
      y: 24,
      size: 6,
      font,
      color: rgb(0.02, 0.24, 0.17),
      opacity: 0.68,
    })
  }

  outputDoc.setTitle(`${input.materialTitle} - pagina ${safePageNumber}`)
  outputDoc.setAuthor(input.userName)
  outputDoc.setSubject(`Visualizacao protegida DomineAqui: ${input.userId} / ${input.materialId}`)
  outputDoc.setKeywords([input.userId, input.materialId, input.auditToken, 'DomineAqui'])
  outputDoc.setCreator('DomineAqui PDF Viewer')
  outputDoc.setProducer('DomineAqui Secure Page Service')
  outputDoc.setModificationDate(input.viewedAt)

  return { bytes: await outputDoc.save({ useObjectStreams: true }), totalPages }
}
