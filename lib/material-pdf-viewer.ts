import { NextRequest } from 'next/server'
import { Db, ObjectId } from 'mongodb'
import { PDFDocument, PDFPage, StandardFonts, degrees, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { TokenPayload } from './auth'
import { getDb } from './mongodb'
import { isPdfBuffer } from './pdf-watermark'

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
      const byUserId = await db.collection('material_purchases').findOne({
        ...baseFilter,
        userId: session.userId,
      })

      if (byUserId) {
        hasAccess = true
      } else if (session.email) {
        const emailRegex = new RegExp(
          `^${session.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
          'i'
        )
        const byEmail = await db.collection('material_purchases').findOne({
          ...baseFilter,
          userEmail: { $regex: emailRegex },
        })
        hasAccess = !!byEmail
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
  const response = await fetch(blobUrl, {
    headers: {
      'Cache-Control': 'no-store',
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

  return bytes
}

export async function getPdfPageCount(pdfBytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  return doc.getPageCount()
}

function drawRepeatedWatermark(
  page: PDFPage,
  lines: string[],
  font: any,
  options: { materialId: string; qrPng?: Uint8Array; auditToken: string }
) {
  const { width, height } = page.getSize()
  const fontSize = Math.max(8, Math.min(12, width / 65))
  const color = rgb(0.02, 0.24, 0.17)
  const gold = rgb(0.82, 0.66, 0.32)
  const angle = degrees(38)
  const maxLineWidth = Math.max(...lines.map((line) => font.widthOfTextAtSize(line, fontSize)))
  const xGap = maxLineWidth + 110
  const yGap = 118
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
          y: y - index * (fontSize + 4),
          size: fontSize,
          font,
          color: index % 2 === 0 ? color : gold,
          opacity: 0.095,
          rotate: angle,
        })
      })
    }
  }

  page.drawText(`DomineAqui protegido | Material ${options.materialId} | Token ${options.auditToken.slice(0, 12)}`, {
    x: 22,
    y: 18,
    size: 7,
    font,
    color,
    opacity: 0.34,
  })
}

export async function createWatermarkedSinglePagePdf(
  originalPdfBytes: ArrayBuffer,
  input: {
    pageNumber: number
    userName: string
    userEmail: string
    userId: string
    materialId: string
    materialTitle: string
    viewedAt: Date
    auditToken: string
  }
): Promise<{ bytes: Uint8Array; totalPages: number }> {
  const sourceDoc = await PDFDocument.load(originalPdfBytes, { ignoreEncryption: true })
  const totalPages = sourceDoc.getPageCount()
  const safePageNumber = Math.min(Math.max(input.pageNumber, 1), totalPages)

  const outputDoc = await PDFDocument.create()
  const [copiedPage] = await outputDoc.copyPages(sourceDoc, [safePageNumber - 1])
  outputDoc.addPage(copiedPage)

  const font = await outputDoc.embedFont(StandardFonts.HelveticaBold)
  const page = outputDoc.getPages()[0]
  const viewedAtLabel = formatViewerDate(input.viewedAt)
  const watermarkLines = [
    input.userName || 'Usuario DomineAqui',
    input.userEmail || 'email nao informado',
    `User ID: ${input.userId}`,
    `Material ID: ${input.materialId}`,
    viewedAtLabel,
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
  try {
    const dataUrl = await QRCode.toDataURL(qrPayload, {
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0b3d2e', light: '#ffffff' },
    })
    const qrBytes = Buffer.from(dataUrl.split(',')[1], 'base64')
    qrImage = await outputDoc.embedPng(qrBytes)
  } catch (error) {
    console.warn('[pdf-viewer] Falha ao gerar QR Code:', error)
  }

  drawRepeatedWatermark(page, watermarkLines, font, {
    materialId: input.materialId,
    auditToken: input.auditToken,
  })

  if (qrImage) {
    const { width, height } = page.getSize()
    const size = Math.min(54, Math.max(42, width * 0.08))
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

  return { bytes: await outputDoc.save(), totalPages }
}
