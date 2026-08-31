import { afterEach, describe, expect, it } from 'vitest'
import {
  PDFDocument,
  PDFDict,
  PDFName,
  PDFOperator,
  PDFOperatorNames,
  PDFRef,
  PDFStream,
  PDFString,
  rgb,
} from 'pdf-lib'

import {
  applyWatermark,
  applyWatermarkByCopyingPages,
  countImageXObjects,
  countImageXObjectsPerPage,
} from '@/lib/pdf-watermark'

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

/**
 * Material de verdade: capa com figura opaca e, depois dela, várias páginas
 * com figura em camada — que é onde o comprador dizia que "sumiu a imagem"
 * enquanto a página 1 chegava certa.
 */
async function buildMultiPageMaterial(pageCount = 5): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const image = await embedSampleImage(doc)

  const ocgRef = doc.context.register(
    doc.context.obj({ Type: 'OCG', Name: PDFString.of('Figuras') })
  )
  doc.catalog.set(
    PDFName.of('OCProperties'),
    doc.context.obj({ OCGs: [ocgRef], D: { Order: [ocgRef], ON: [ocgRef] } })
  )

  for (let index = 0; index < pageCount; index += 1) {
    const page = doc.addPage([595, 842])
    page.drawText(`Prancha ${index + 1}`, { x: 60, y: 760, size: 12 })

    // A capa (página 1) traz a figura solta; as demais, dentro da camada.
    if (index === 0) {
      page.drawImage(image, { x: 60, y: 420, width: 400, height: 280 })
      continue
    }
    page.node.Resources()!.set(PDFName.of('Properties'), doc.context.obj({ MC0: ocgRef }))
    page.pushOperators(
      PDFOperator.of(PDFOperatorNames.BeginMarkedContentSequence, [
        PDFName.of('OC'),
        PDFName.of('MC0'),
      ])
    )
    page.drawImage(image, { x: 60, y: 420, width: 400, height: 280 })
    page.pushOperators(PDFOperator.of(PDFOperatorNames.EndMarkedContent))
  }

  return doc.save()
}

/**
 * Estados gráficos com alpha (`ca`/`CA`) alcançáveis a partir das páginas —
 * inclusive dentro dos Form XObjects, que é onde mora o overlay da marca.
 */
function alphaStatesInPages(doc: PDFDocument): number {
  const walk = (resources: PDFDict | undefined, depth: number): number => {
    if (!resources || depth > 8) return 0
    let total = 0

    const extGState = resources.lookupMaybe(PDFName.of('ExtGState'), PDFDict)
    if (extGState) {
      for (const [, value] of extGState.entries()) {
        const state = doc.context.lookupMaybe(value, PDFDict)
        if (state?.has(PDFName.of('ca')) || state?.has(PDFName.of('CA'))) total += 1
      }
    }

    const xObjects = resources.lookupMaybe(PDFName.of('XObject'), PDFDict)
    if (xObjects) {
      for (const [, value] of xObjects.entries()) {
        const stream = doc.context.lookup(value)
        if (!(stream instanceof PDFStream)) continue
        if (stream.dict.get(PDFName.of('Subtype')) !== PDFName.of('Form')) continue
        total += walk(
          doc.context.lookupMaybe(stream.dict.get(PDFName.of('Resources')), PDFDict),
          depth + 1
        )
      }
    }

    return total
  }

  return doc.getPages().reduce((total, page) => total + walk(page.node.Resources(), 0), 0)
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
  afterEach(() => {
    delete process.env.PDF_WATERMARK_TRANSPARENCY
  })

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

  it('mantém a figura de TODAS as páginas, não só da capa', async () => {
    // O sintoma relatado: a página 1 chegava com a imagem e todas as outras
    // vinham só com o texto. Conferir o total esconderia isso — a conta é
    // página a página.
    const original = await buildMultiPageMaterial(5)
    const stamped = await applyWatermark(original, IDENTITY)

    const sourceDoc = await PDFDocument.load(original)
    const stampedDoc = await PDFDocument.load(stamped)

    expect(countImageXObjectsPerPage(stampedDoc)).toEqual(countImageXObjectsPerPage(sourceDoc))
    expect(countImageXObjectsPerPage(stampedDoc)).toEqual([1, 1, 1, 1, 1])
    expect(hasOptionalContentProperties(stampedDoc)).toBe(true)
  })

  it('não introduz transparência no arquivo entregue', async () => {
    // Alpha no carimbo obriga o leitor a compor a página como grupo de
    // transparência — e é aí que Acrobat e o PDFKit do iOS erram nas figuras
    // com máscara (SMask) e entregam a página sem a imagem. Marca chapada, nada
    // para o leitor compor errado.
    const stampedDoc = await PDFDocument.load(await applyWatermark(await buildMultiPageMaterial(3), IDENTITY))

    expect(alphaStatesInPages(stampedDoc)).toBe(0)
    // E a página continua com o compositing que o autor definiu: sem /Group
    // inventado por nós.
    for (const page of stampedDoc.getPages()) {
      expect(page.node.has(PDFName.of('Group'))).toBe(false)
    }
  })

  it('no modo translúcido, declara grupo de transparência com espaço de cor', async () => {
    // O carimbo com alpha continua disponível por env — e aí o /Group volta a
    // ser necessário para o iOS compor as imagens com soft-mask corretamente.
    process.env.PDF_WATERMARK_TRANSPARENCY = '1'

    const doc = await PDFDocument.load(await buildPdfWithImage())
    const page = doc.getPages()[0]
    page.node.set(PDFName.of('Group'), doc.context.obj({ Type: 'Group', S: 'Transparency' }))

    const stamped = await applyWatermark(await doc.save(), IDENTITY)
    const stampedDoc = await PDFDocument.load(stamped)
    const group = stampedDoc.getPages()[0].node.lookupMaybe(PDFName.of('Group'), PDFDict)

    expect(group?.lookup(PDFName.of('S'))).toBe(PDFName.of('Transparency'))
    expect(group?.lookup(PDFName.of('CS'))).toBe(PDFName.of('DeviceRGB'))
    expect(alphaStatesInPages(stampedDoc)).toBeGreaterThan(0)
  })

  it('não reemite a flag de criptografia do original no arquivo entregue', async () => {
    const doc = await PDFDocument.load(await buildPdfWithImage())
    doc.context.trailerInfo.Encrypt = doc.context.register(doc.context.obj({ Filter: 'Standard' }))
    const stamped = await applyWatermark(await doc.save(), IDENTITY)

    const stampedDoc = await PDFDocument.load(stamped, { ignoreEncryption: true })
    expect(stampedDoc.isEncrypted).toBe(false)
  })
})

describe('applyWatermarkByCopyingPages (estratégia de reserva)', () => {
  const LINES = ['Thiago Rodrigues', 'UID a7b8c9d0', 'Pedido: cc34d142', '31/08/2026 08:15']
  const CONFIG = {
    enabled: true,
    translucent: false,
    opacity: 0.1,
    fontSize: 9,
    repeatGap: 210,
    xGap: 180,
    angle: 38,
    lineGap: 3,
    maxTextLength: 64,
  }

  it('preserva camadas e figuras de todas as páginas', async () => {
    // Esta é a estratégia usada quando o carimbo in-place falha. Ela monta um
    // documento novo, e era ela que deixava o `/OCProperties` para trás — com
    // o catálogo sem as camadas, a figura de cada página some no Acrobat e na
    // pré-visualização do iOS, sobrando só o texto.
    const original = await buildMultiPageMaterial(4)
    const stamped = await applyWatermarkByCopyingPages(original, IDENTITY, LINES, CONFIG as any)

    const sourceDoc = await PDFDocument.load(original)
    const stampedDoc = await PDFDocument.load(stamped)

    expect(countImageXObjectsPerPage(stampedDoc)).toEqual(countImageXObjectsPerPage(sourceDoc))
    expect(hasOptionalContentProperties(stampedDoc)).toBe(true)
    expect(declaredLayerNames(stampedDoc)).toEqual(['Figuras'])
  })

  it('a camada citada pelo conteúdo é a mesma listada no catálogo', async () => {
    // Copiar páginas e catálogo com copiadores diferentes duplicaria o OCG: o
    // catálogo declararia uma camada que o conteúdo não usa, e a figura sumiria
    // do mesmo jeito.
    const stampedDoc = await PDFDocument.load(
      await applyWatermarkByCopyingPages(await buildMultiPageMaterial(3), IDENTITY, LINES, CONFIG as any)
    )

    const ocProperties = stampedDoc.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict)!
    const declared = (ocProperties.get(PDFName.of('OCGs')) as any).asArray().map(String)
    const usedByPages = stampedDoc.getPages().flatMap((page) => {
      const properties = page.node.Resources()?.lookupMaybe(PDFName.of('Properties'), PDFDict)
      return properties ? properties.entries().map(([, value]) => String(value)) : []
    })

    expect(usedByPages.length).toBeGreaterThan(0)
    for (const ref of usedByPages) expect(declared).toContain(ref)
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
