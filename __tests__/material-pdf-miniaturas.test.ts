import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PDFDocument, StandardFonts } from 'pdf-lib'

import {
  createWatermarkedSinglePagePdf,
  extractRawSinglePagePdf,
} from '@/lib/material-pdf-viewer'

/**
 * As miniaturas do painel lateral são desenhadas com 150 px de largura e, até
 * aqui, pediam a MESMA coisa que a página de leitura: o PDF marcado com nome,
 * e-mail, horário e QR de auditoria de quem pediu. A 150 px nada disso é
 * legível — mas cada quadradinho pagava o parse, a composição da marca, a
 * geração do QR e uma resposta única por pessoa, que nenhum cache reaproveita.
 * Foi o que colocou a transferência de Blob em 72,8 GB para 1,46 GB guardados.
 *
 * Estes testes fixam as três propriedades de que o conserto depende:
 *   1. a miniatura mostra a MESMA página que a leitura mostraria;
 *   2. ela não leva marca d'água — é idêntica para todo mundo, e é isso que
 *      a torna guardável;
 *   3. ela usa o caminho barato (derivada) e não toca no documento completo.
 */

async function pdfDeTeste(paginas: number) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= paginas; i += 1) {
    const altura = alturaDaPagina(i)
    const page = doc.addPage([300, altura])
    page.drawText(`PAGINA ${i}`, { x: 40, y: altura / 2, size: 24, font })
  }
  const bytes = await doc.save({ useObjectStreams: false })
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** Altura exclusiva da página `i` — é por ela que a página é reconhecida. */
function alturaDaPagina(i: number) {
  return 400 + i
}

/** Qual página do documento original é esta, lida pela altura. */
async function paginaDe(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  expect(doc.getPageCount()).toBe(1)
  return Math.round(doc.getPage(0).getSize().height) - 400
}

let contador = 0
function entradaDeLeitura(pageNumber: number, userEmail = 'aluno@exemplo.com') {
  contador += 1
  return {
    pageNumber,
    userName: 'Aluno de Teste',
    userEmail,
    userId: '64b7f1c2a9d4e5f60718293a',
    materialId: '64b7f1c2a9d4e5f60718293b',
    materialTitle: 'Material de Teste',
    viewedAt: new Date('2026-09-17T12:00:00Z'),
    auditToken: `teste-miniatura-${contador}`,
  }
}

describe('miniaturas do visualizador de materiais', () => {
  beforeEach(() => {
    // Os caches em memória atravessam testes dentro do mesmo processo.
    process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED = '0'
    process.env.PDF_VIEWER_PAGE_CACHE_ENABLED = '0'
  })

  afterEach(() => {
    delete process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED
    delete process.env.PDF_VIEWER_PAGE_CACHE_ENABLED
  })

  it('a miniatura mostra a mesma página que a leitura mostraria', async () => {
    const original = await pdfDeTeste(12)

    const leitura = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 12, loadFull: async () => original },
      entradaDeLeitura(7)
    )
    const miniatura = await extractRawSinglePagePdf(
      { knownTotalPages: 12, loadFull: async () => original },
      { pageNumber: 7 }
    )

    expect(await paginaDe(leitura.bytes)).toBe(7)
    expect(await paginaDe(miniatura.bytes)).toBe(7)
    expect(miniatura.totalPages).toBe(12)
  })

  it('a miniatura não leva marca d\'água: é igual para pessoas diferentes', async () => {
    const original = await pdfDeTeste(5)

    // Duas pessoas distintas pedindo a MESMA página.
    const leituraA = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      entradaDeLeitura(3, 'ana@exemplo.com')
    )
    const leituraB = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      entradaDeLeitura(3, 'bruno@exemplo.com')
    )
    const miniaturaA = await extractRawSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      { pageNumber: 3 }
    )
    const miniaturaB = await extractRawSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      { pageNumber: 3 }
    )

    // A leitura CONTINUA carimbada por pessoa — é o que segura a antipirataria.
    expect(Buffer.from(leituraA.bytes).equals(Buffer.from(leituraB.bytes))).toBe(false)

    // A miniatura não depende de quem pediu. É exatamente essa propriedade que
    // permite guardá-la no navegador por um dia em vez de refazer a rodada.
    expect(Buffer.from(miniaturaA.bytes).equals(Buffer.from(miniaturaB.bytes))).toBe(true)

    // E, sem a marca, o e-mail de quem pediu não sai na resposta.
    const cru = Buffer.from(miniaturaA.bytes).toString('latin1')
    expect(cru).not.toContain('ana@exemplo.com')
    expect(cru).not.toContain('bruno@exemplo.com')
  })

  it('a miniatura usa a derivada e não baixa o documento completo', async () => {
    const original = await pdfDeTeste(30)

    // Primeiro, produz a derivada da página 9 pelo caminho caro.
    let derivada: Uint8Array | null = null
    await extractRawSinglePagePdf(
      {
        knownTotalPages: 30,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (_pagina, bytes) => {
          derivada = bytes
        },
      },
      { pageNumber: 9 }
    )
    expect(derivada).not.toBeNull()

    // Agora, com a derivada em mãos, o documento completo não pode ser tocado.
    let baixouDocumentoCompleto = false
    const barata = await extractRawSinglePagePdf(
      {
        knownTotalPages: 30,
        loadSlice: async () => {
          const bytes = derivada!
          return bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as ArrayBuffer
        },
        loadFull: async () => {
          baixouDocumentoCompleto = true
          return original
        },
      },
      { pageNumber: 9 }
    )

    expect(baixouDocumentoCompleto).toBe(false)
    expect(await paginaDe(barata.bytes)).toBe(9)
  })

  it('a miniatura é mais leve que a página de leitura', async () => {
    const original = await pdfDeTeste(4)

    const leitura = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 4, loadFull: async () => original },
      entradaDeLeitura(2)
    )
    const miniatura = await extractRawSinglePagePdf(
      { knownTotalPages: 4, loadFull: async () => original },
      { pageNumber: 2 }
    )

    // A marca d'água acrescenta fonte embutida, texto e o QR de auditoria.
    // Nada disso é visível a 150 px, e tudo isso era transferido por miniatura.
    expect(miniatura.bytes.byteLength).toBeLessThan(leitura.bytes.byteLength)
  })
})
