import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PDFDict, PDFDocument, PDFName, StandardFonts } from 'pdf-lib'

import * as leitor from '@/lib/material-pdf-viewer'
import { createWatermarkedSinglePagePdf } from '@/lib/material-pdf-viewer'

/**
 * O leitor de materiais entrega cada página como um PDF de uma página, marcado
 * com nome, e-mail, UID e horário de quem pediu. É o que torna rastreável uma
 * página vazada.
 *
 * As miniaturas do painel lateral já tiveram caminho próprio, que devolvia a
 * página NUA: o PDF inteiro da página, em resolução total, sem marca e sem
 * log. Quem tinha acesso podia pedir `/thumb?page=1…N` e baixar o livro limpo.
 * Hoje a miniatura sai marcada e com log pelo mesmo caminho da leitura, só que
 * com as imagens em resolução de painel (ver `lib/material-pdf-leitura.ts`).
 *
 * Estes testes fixam o que não pode voltar atrás:
 *   1. não existe mais caminho que entregue a página sem marca;
 *   2. a página marcada identifica quem pediu;
 *   3. a derivada continua evitando o download do documento completo;
 *   4. a marca continua enxuta (ela chegou a somar ~82 KB por página).
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

function recursos(doc: PDFDocument, tipo: 'Font' | 'ExtGState') {
  const res = doc.getPage(0).node.Resources()
  const dict = res?.lookup(PDFName.of(tipo)) as PDFDict | undefined
  return dict ? dict.keys().length : 0
}

describe('páginas do visualizador de materiais', () => {
  beforeEach(() => {
    // Os caches em memória atravessam testes dentro do mesmo processo.
    process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED = '0'
    process.env.PDF_VIEWER_PAGE_CACHE_ENABLED = '0'
  })

  afterEach(() => {
    delete process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED
    delete process.env.PDF_VIEWER_PAGE_CACHE_ENABLED
  })

  it('não existe mais caminho que entregue a página sem marca d\'água', () => {
    expect((leitor as Record<string, unknown>).extractRawSinglePagePdf).toBeUndefined()
  })

  it('entrega a página pedida', async () => {
    const original = await pdfDeTeste(12)
    const pagina = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 12, loadFull: async () => original },
      entradaDeLeitura(7)
    )
    expect(await paginaDe(pagina.bytes)).toBe(7)
    expect(pagina.totalPages).toBe(12)
  })

  it('a página marcada identifica quem pediu', async () => {
    const original = await pdfDeTeste(5)
    const ana = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      { ...entradaDeLeitura(3, 'ana@exemplo.com'), userId: '64b7f1c2a9d4e5f6071829aa' }
    )
    const bruno = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 5, loadFull: async () => original },
      { ...entradaDeLeitura(3, 'bruno@exemplo.com'), userId: '64b7f1c2a9d4e5f6071829bb' }
    )

    expect(Buffer.from(ana.bytes).equals(Buffer.from(bruno.bytes))).toBe(false)
    const docAna = await PDFDocument.load(ana.bytes)
    const docBruno = await PDFDocument.load(bruno.bytes)
    expect(docAna.getKeywords()).toContain('64b7f1c2a9d4e5f6071829aa')
    expect(docBruno.getKeywords()).toContain('64b7f1c2a9d4e5f6071829bb')
    // A marca é desenhada: há texto e transparência na página.
    expect(recursos(docAna, 'Font')).toBeGreaterThan(0)
    expect(recursos(docAna, 'ExtGState')).toBeGreaterThan(0)
  })

  it('usa a derivada e não baixa o documento completo', async () => {
    const original = await pdfDeTeste(30)

    // Primeiro, produz a derivada da página 9 pelo caminho caro.
    let derivada: Uint8Array | null = null
    await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 30,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (_pagina, bytes) => {
          derivada = bytes
        },
      },
      entradaDeLeitura(9)
    )
    expect(derivada).not.toBeNull()

    // A derivada é a página nua; ela fica no servidor e nunca é a resposta.
    // Com ela em mãos, o documento completo não pode ser tocado.
    let baixouDocumentoCompleto = false
    const barata = await createWatermarkedSinglePagePdf(
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
      entradaDeLeitura(9)
    )

    expect(baixouDocumentoCompleto).toBe(false)
    expect(await paginaDe(barata.bytes)).toBe(9)
    expect(Buffer.from(barata.bytes).equals(Buffer.from(derivada!))).toBe(false)
  })

  it('a marca continua enxuta', async () => {
    const original = await pdfDeTeste(4)
    const pagina = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 4, loadFull: async () => original },
      entradaDeLeitura(2)
    )
    let nua: Uint8Array | null = null
    await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 4,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (_p, bytes) => {
          nua = bytes
        },
      },
      entradaDeLeitura(2)
    )

    // O pdf-lib cria um ExtGState e uma chave de fonte novos a cada
    // `drawText` que recebe `opacity`/`font`. A grade da marca faz centenas
    // de chamadas: eram 821 ExtGState e ~82 KB a mais por página.
    const doc = await PDFDocument.load(pagina.bytes)
    expect(recursos(doc, 'ExtGState')).toBeLessThanOrEqual(4)
    expect(recursos(doc, 'Font')).toBeLessThanOrEqual(4)
    expect(pagina.bytes.byteLength - nua!.byteLength).toBeLessThan(15 * 1024)
  })
})
