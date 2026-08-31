import { describe, expect, it } from 'vitest'
import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFOperator,
  PDFOperatorNames,
  PDFRef,
  PDFString,
  rgb,
} from 'pdf-lib'

import { applyWatermark, countImageXObjects } from '@/lib/pdf-watermark'

/**
 * O que estes testes protegem: o PDF que chega ao comprador tem que ser o
 * mesmo material que o admin subiu — com a marca d'água por cima e NADA a
 * menos. O jeito de perder figura aqui não é apagar a imagem: é reconstruir o
 * documento e deixar para trás o catálogo do original. Em PDF com camadas
 * (conteúdo opcional/OCG — o que sai de InDesign, Illustrator e Word), a
 * figura vive dentro de um `/OC`; sem o `/OCProperties` do catálogo, leitores
 * estritos (Acrobat, PDFKit do iOS — a pré-visualização do Gmail/Drive no
 * celular) escondem a figura, enquanto o pdf.js do visualizador do site
 * continua mostrando. Era exatamente esse o "chegou sem imagem".
 */

const IDENTITY = {
  userName: 'Thiago Rodrigues',
  userEmail: 'comprador@exemplo.com',
  userId: '64b7f0c2a1d4e5f6a7b8c9d0',
  orderId: 'cc34d142aa01',
  downloadedAt: new Date('2026-08-31T11:15:00Z'),
}

// PNG 2x2 opaco — suficiente para virar um XObject de imagem de verdade.
const PNG_2X2_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVQI12P8z8DAwMDAxMDAwMDAAAANHQEDoJHYtwAAAABJRU5ErkJggg=='

async function embedSampleImage(doc: PDFDocument) {
  return doc.embedPng(Buffer.from(PNG_2X2_BASE64, 'base64'))
}

/** PDF simples: um texto e uma figura solta na página. */
async function buildPdfWithImage(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  page.drawText('Corte esquematico da transicao esofagogastrica', { x: 60, y: 760, size: 12 })
  page.drawImage(await embedSampleImage(doc), { x: 60, y: 420, width: 400, height: 280 })
  return doc.save()
}

/**
 * PDF com a figura dentro de uma camada (conteúdo opcional). Reproduz a
 * estrutura que os exportadores de diagramação geram: um OCG declarado no
 * catálogo, referenciado nos `/Properties` da página e envolvendo a imagem
 * num bloco `/OC /MC0 BDC ... EMC`.
 */
async function buildPdfWithImageInOptionalContent(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  page.drawText('Corte esquematico da transicao esofagogastrica', { x: 60, y: 760, size: 12 })

  const ocgRef = doc.context.register(
    doc.context.obj({ Type: 'OCG', Name: PDFString.of('Figuras') })
  )
  doc.catalog.set(
    PDFName.of('OCProperties'),
    doc.context.obj({ OCGs: [ocgRef], D: { Order: [ocgRef], ON: [ocgRef] } })
  )

  const resources = page.node.Resources()!
  resources.set(PDFName.of('Properties'), doc.context.obj({ MC0: ocgRef }))

  page.pushOperators(
    PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
      PDFName.of('OC'),
      PDFName.of('MC0'),
    ])
  )
  page.drawImage(await embedSampleImage(doc), { x: 60, y: 420, width: 400, height: 280 })
  page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))

  return doc.save()
}

function hasOptionalContentProperties(doc: PDFDocument): boolean {
  return Boolean(doc.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict))
}

/** Nomes das camadas declaradas no catálogo (o que o leitor consegue exibir). */
function declaredLayerNames(doc: PDFDocument): string[] {
  const ocProperties = doc.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict)
  const ocgs = ocProperties?.lookup(PDFName.of('OCGs'))
  const refs: PDFRef[] = (ocgs as any)?.asArray?.() ?? []
  return refs
    .map((ref) => doc.context.lookupMaybe(ref, PDFDict)?.lookup(PDFName.of('Name')))
    .map((name) => (name instanceof PDFString ? name.decodeText() : ''))
    .filter(Boolean)
}

describe('applyWatermark', () => {
  it('mantém as figuras de um PDF com camadas (conteúdo opcional)', async () => {
    const original = await buildPdfWithImageInOptionalContent()
    const stamped = await applyWatermark(original, IDENTITY)

    const sourceDoc = await PDFDocument.load(original)
    const stampedDoc = await PDFDocument.load(stamped)

    // A imagem continua no arquivo...
    expect(countImageXObjects(stampedDoc)).toBe(countImageXObjects(sourceDoc))
    // ...e a camada que a torna visível continua declarada no catálogo.
    expect(hasOptionalContentProperties(stampedDoc)).toBe(true)
    expect(declaredLayerNames(stampedDoc)).toEqual(['Figuras'])
  })

  it('mantém as figuras e as páginas de um PDF comum', async () => {
    const original = await buildPdfWithImage()
    const stamped = await applyWatermark(original, IDENTITY)

    const sourceDoc = await PDFDocument.load(original)
    const stampedDoc = await PDFDocument.load(stamped)

    expect(countImageXObjects(stampedDoc)).toBe(1)
    expect(countImageXObjects(stampedDoc)).toBe(countImageXObjects(sourceDoc))
    expect(stampedDoc.getPageCount()).toBe(sourceDoc.getPageCount())
  })

  it('carimba os dados do licenciado nos metadados de rastreio', async () => {
    const stamped = await applyWatermark(await buildPdfWithImage(), IDENTITY)
    const stampedDoc = await PDFDocument.load(stamped)

    expect(stampedDoc.getTitle()).toContain(IDENTITY.userName)
    expect(stampedDoc.getSubject()).toContain(IDENTITY.orderId)
    // O e-mail nunca vai em claro no arquivo — só a impressão digital dele.
    expect(stampedDoc.getSubject()).not.toContain(IDENTITY.userEmail)
  })

  it('declara grupo de transparência com espaço de cor em toda página carimbada', async () => {
    // Sem /Group (ou com um /Group sem /CS), o renderizador nativo do iOS —
    // o que a pré-visualização do Gmail/Drive usa — compõe errado as imagens
    // com soft-mask sob a marca d'água translúcida e mostra a figura preta ou
    // branca. É o mesmo "sumiu a imagem" visto pelo comprador.
    const doc = await PDFDocument.load(await buildPdfWithImage())
    const page = doc.getPages()[0]
    page.node.set(PDFName.of('Group'), doc.context.obj({ Type: 'Group', S: 'Transparency' }))

    const stamped = await applyWatermark(await doc.save(), IDENTITY)
    const stampedPage = (await PDFDocument.load(stamped)).getPages()[0]
    const group = stampedPage.node.lookupMaybe(PDFName.of('Group'), PDFDict)

    expect(group?.lookup(PDFName.of('S'))).toBe(PDFName.of('Transparency'))
    expect(group?.lookup(PDFName.of('CS'))).toBe(PDFName.of('DeviceRGB'))
  })

  it('não reemite a flag de criptografia do original no arquivo entregue', async () => {
    const doc = await PDFDocument.load(await buildPdfWithImage())
    doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard' }))
    const stamped = await applyWatermark(await doc.save(), IDENTITY)

    const stampedDoc = await PDFDocument.load(stamped, { ignoreEncryption: true })
    expect(stampedDoc.isEncrypted).toBe(false)
  })
})

describe('countImageXObjects', () => {
  it('conta imagens dentro de Form XObjects aninhados', async () => {
    const inner = await PDFDocument.create()
    const innerPage = inner.addPage([200, 200])
    innerPage.drawRectangle({ x: 0, y: 0, width: 200, height: 200, color: rgb(1, 1, 1) })
    innerPage.drawImage(await embedSampleImage(inner), { x: 10, y: 10, width: 180, height: 180 })

    const outer = await PDFDocument.create()
    const [embedded] = await outer.embedPdf(await inner.save())
    outer.addPage([595, 842]).drawPage(embedded, { x: 60, y: 400, width: 200, height: 200 })

    // A imagem só existe dentro do Form XObject da página embutida.
    const reloaded = await PDFDocument.load(await outer.save())
    expect(countImageXObjects(reloaded)).toBe(1)
  })
})
