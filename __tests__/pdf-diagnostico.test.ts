import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'

import { compareImageReports, inspectPdfImages } from '@/lib/pdf-diagnostico'
import { applyWatermark } from '@/lib/pdf-watermark'

/**
 * O diagnóstico é o que separa os dois "chegou sem imagem" possíveis: figura
 * que nunca esteve no arquivo de origem e figura que se perdeu na entrega.
 * Se ele contar errado, o admin vai atrás do problema errado.
 */

// PNG 2x2 com canal alfa — vira imagem com máscara de transparência, que é o
// tipo que o renderizador do iOS erra quando a página não declara grupo.
const PNG_RGBA_2X2 =
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP4z8DwH4gbGEAEiAMAQFkG+xM9tW8AAAAASUVORK5CYII='

async function buildPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const comFigura = doc.addPage([595, 842])
  comFigura.drawImage(await doc.embedPng(Buffer.from(PNG_RGBA_2X2, 'base64')), {
    x: 60,
    y: 420,
    width: 400,
    height: 280,
  })
  const soTexto = doc.addPage([595, 842])
  soTexto.drawText('Pagina sem figura', { x: 60, y: 760, size: 12 })
  return doc.save()
}

describe('inspectPdfImages', () => {
  it('diz em que página cada figura está', async () => {
    const relatorio = await inspectPdfImages(await buildPdf())

    expect(relatorio.pageCount).toBe(2)
    expect(relatorio.imagesPerPage).toEqual([1, 0])
    expect(relatorio.totalImages).toBe(1)
    expect(relatorio.images[0]).toMatchObject({ page: 1, width: 2, height: 2, hasSoftMask: true })
  })

  it('não acusa perda quando o carimbo preserva as figuras', async () => {
    const original = await buildPdf()
    const entregue = await applyWatermark(original, {
      userName: 'Thiago Rodrigues',
      userEmail: 'comprador@exemplo.com',
      userId: '64b7f0c2a1d4e5f6a7b8c9d0',
      orderId: 'cc34d142aa01',
      downloadedAt: new Date('2026-08-31T11:45:00Z'),
    })

    const veredito = compareImageReports(
      await inspectPdfImages(original),
      await inspectPdfImages(entregue)
    )
    expect(veredito).toEqual({ perdeuImagens: false, perdeuCamadas: false, paginasComPerda: [] })
  })
})

describe('compareImageReports', () => {
  it('aponta a página exata em que a figura se perdeu', () => {
    const relatorio = (imagensPorPagina: number[]) => ({
      pageCount: imagensPorPagina.length,
      byteLength: 1000,
      totalImages: imagensPorPagina.reduce((soma, n) => soma + n, 0),
      imagesPerPage: imagensPorPagina,
      hasOptionalContentProperties: true,
      images: [],
    })

    const veredito = compareImageReports(relatorio([1, 2, 1]), {
      ...relatorio([1, 0, 1]),
      hasOptionalContentProperties: false,
    })

    expect(veredito.perdeuImagens).toBe(true)
    expect(veredito.perdeuCamadas).toBe(true)
    expect(veredito.paginasComPerda).toEqual([{ pagina: 2, original: 2, entregue: 0 }])
  })
})
