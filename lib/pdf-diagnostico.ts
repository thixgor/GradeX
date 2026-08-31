/**
 * Inventário de imagens de um PDF — usado para responder, sem achismo, a
 * pergunta que aparece quando um comprador diz "chegou sem imagem": a figura
 * existe no arquivo que está no storage, e sobrevive ao carimbo da marca
 * d'água?
 *
 * A conta é feita sobre a ESTRUTURA do PDF (os XObjects de imagem declarados
 * nos recursos de cada página, inclusive dentro de Form XObjects aninhados).
 * Nenhuma imagem é decodificada, então rodar isso num material de 100MB é
 * barato.
 */

import { PDFDocument, PDFDict, PDFName, PDFNumber, PDFRef, PDFStream } from 'pdf-lib'

export interface PdfImageInfo {
  /** Página (1-based) onde a imagem é declarada. */
  page: number
  /** Nome do recurso (`/Im0`), útil para casar com o conteúdo da página. */
  name: string
  width: number
  height: number
  /** Filtro de compressão (`/DCTDecode`, `/FlateDecode`, …). */
  filter: string
  /** Tem máscara de transparência (o caso que o iOS renderiza errado). */
  hasSoftMask: boolean
  /** Está amarrada a uma camada (conteúdo opcional/OCG). */
  optionalContent: boolean
  /** A imagem está dentro de um Form XObject, não solta na página. */
  nested: boolean
  bytes: number
}

export interface PdfImageReport {
  pageCount: number
  byteLength: number
  totalImages: number
  /** Quantidade de imagens por página, na ordem das páginas. */
  imagesPerPage: number[]
  /** O catálogo declara camadas (`/OCProperties`). */
  hasOptionalContentProperties: boolean
  images: PdfImageInfo[]
}

const MAX_LISTED_IMAGES = 400

function nameOf(dict: PDFDict, key: string): string {
  const value = dict.get(PDFName.of(key))
  return value instanceof PDFName ? value.asString() : value ? String(value) : ''
}

function numberOf(dict: PDFDict, key: string): number {
  const value = dict.context.lookupMaybe(dict.get(PDFName.of(key)), PDFNumber)
  return value ? value.asNumber() : 0
}

/** Inventaria as imagens declaradas nas páginas de um documento já carregado. */
export function inspectPdfImagesInDoc(doc: PDFDocument, byteLength: number): PdfImageReport {
  const context = doc.context
  const pages = doc.getPages()
  const images: PdfImageInfo[] = []
  const imagesPerPage: number[] = []

  const walkResources = (
    resources: PDFDict | undefined,
    pageNumber: number,
    nested: boolean,
    depth: number,
    visited: Set<string>,
    onImage: (info: PdfImageInfo) => void
  ): void => {
    if (!resources || depth > 12) return
    const xObjects = resources.lookupMaybe(PDFName.of('XObject'), PDFDict)
    if (!xObjects) return

    for (const [key, value] of xObjects.entries()) {
      if (value instanceof PDFRef) {
        const ref = value.toString()
        if (visited.has(ref)) continue
        visited.add(ref)
      }
      const stream = context.lookup(value)
      if (!(stream instanceof PDFStream)) continue

      const subtype = nameOf(stream.dict, 'Subtype')
      if (subtype === '/Image') {
        onImage({
          page: pageNumber,
          name: key.asString(),
          width: numberOf(stream.dict, 'Width'),
          height: numberOf(stream.dict, 'Height'),
          filter: nameOf(stream.dict, 'Filter') || '(nenhum)',
          hasSoftMask: stream.dict.has(PDFName.of('SMask')) || stream.dict.has(PDFName.of('Mask')),
          optionalContent: stream.dict.has(PDFName.of('OC')),
          nested,
          bytes: stream.getContentsSize(),
        })
      } else if (subtype === '/Form') {
        walkResources(
          context.lookupMaybe(stream.dict.get(PDFName.of('Resources')), PDFDict),
          pageNumber,
          true,
          depth + 1,
          visited,
          onImage
        )
      }
    }
  }

  pages.forEach((page, index) => {
    // O `visited` é por página: uma figura repetida em várias páginas conta
    // uma vez por página, que é como quem olha o PDF enxerga.
    let pageTotal = 0
    walkResources(page.node.Resources(), index + 1, false, 0, new Set<string>(), (info) => {
      pageTotal += 1
      if (images.length < MAX_LISTED_IMAGES) images.push(info)
    })
    imagesPerPage.push(pageTotal)
  })

  return {
    pageCount: pages.length,
    byteLength,
    totalImages: imagesPerPage.reduce((sum, n) => sum + n, 0),
    imagesPerPage,
    hasOptionalContentProperties: Boolean(
      doc.catalog.lookupMaybe(PDFName.of('OCProperties'), PDFDict)
    ),
    images,
  }
}

/** Inventaria as imagens de um PDF a partir dos bytes. */
export async function inspectPdfImages(bytes: Uint8Array | ArrayBuffer): Promise<PdfImageReport> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
  const byteLength = bytes instanceof ArrayBuffer ? bytes.byteLength : bytes.byteLength
  return inspectPdfImagesInDoc(doc, byteLength)
}

/**
 * Compara o inventário do arquivo de origem com o do arquivo entregue e
 * resume onde (se em algum lugar) as figuras se perderam.
 */
export function compareImageReports(original: PdfImageReport, delivered: PdfImageReport) {
  const paginasComPerda: { pagina: number; original: number; entregue: number }[] = []
  const paginas = Math.max(original.imagesPerPage.length, delivered.imagesPerPage.length)
  for (let index = 0; index < paginas; index += 1) {
    const antes = original.imagesPerPage[index] ?? 0
    const depois = delivered.imagesPerPage[index] ?? 0
    if (depois < antes) paginasComPerda.push({ pagina: index + 1, original: antes, entregue: depois })
  }

  return {
    perdeuImagens: paginasComPerda.length > 0,
    perdeuCamadas: original.hasOptionalContentProperties && !delivered.hasOptionalContentProperties,
    paginasComPerda,
  }
}
