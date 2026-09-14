import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { PDFDict, PDFDocument, PDFName, StandardFonts } from 'pdf-lib'

import {
  createWatermarkedSinglePagePdf,
  type FontePdfDaPagina,
} from '@/lib/material-pdf-viewer'
import { caminhoDaDerivada, fonteDoPdf } from '@/lib/material-pdf-pages'

/**
 * As derivadas de página existem para o visualizador parar de baixar o PDF
 * inteiro do Blob a cada página pedida — eram 63 GB de transferência para 1 GB
 * guardado. O risco da troca não é de custo, é de conteúdo: se a página vinda
 * da derivada não for a mesma que vinha do documento completo, o aluno recebe
 * a página errada de um material que comprou.
 *
 * Estes testes fixam as duas propriedades que sustentam o conserto:
 *   1. o caminho barato (derivada) devolve a MESMA página que o caro;
 *   2. o caminho barato não toca no documento completo.
 */

/**
 * PDF de teste com N páginas, cada uma com uma ALTURA própria.
 *
 * A altura é o identificador em vez de um texto desenhado: pdf-lib comprime os
 * fluxos de conteúdo, então procurar o rótulo nos bytes crus não acha nada. A
 * geometria da página, essa, o pdf-lib lê de volta sem ambiguidade — e é
 * exatamente o que precisa ser preservado entre o caminho caro e o barato.
 */
async function pdfDeTeste(paginas: number, largura = 300) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (let i = 1; i <= paginas; i += 1) {
    const altura = alturaDaPagina(i)
    const page = doc.addPage([largura, altura])
    page.drawText(`PAGINA ${i}`, { x: 40, y: altura / 2, size: 24, font })
  }
  const bytes = await doc.save({ useObjectStreams: false })
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** Altura exclusiva da página `i`. */
function alturaDaPagina(i: number) {
  return 400 + i
}

/** Qual página do documento original é esta, lida pela altura. */
async function paginaDe(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  expect(doc.getPageCount()).toBe(1)
  return Math.round(doc.getPage(0).getSize().height) - 400
}

/**
 * PNG 1×1 válido, em base64. Serve de recheio para o caso que mais importa
 * aqui: material escaneado é uma imagem por página, e o que não pode quebrar é
 * justamente a referência à imagem.
 */
const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

/** PDF de uma página contendo uma imagem embutida. */
async function pdfComImagem() {
  const doc = await PDFDocument.create()
  const png = await doc.embedPng(Buffer.from(PNG_1X1, 'base64'))
  const page = doc.addPage([300, 401])
  page.drawImage(png, { x: 10, y: 10, width: 200, height: 200 })
  const bytes = await doc.save({ useObjectStreams: false })
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

/** Quantos XObjects a página declara — as imagens vivem aqui. */
async function contarImagens(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const recursos = doc.getPage(0).node.Resources()
  const xobjects = recursos?.lookupMaybe(PDFName.of('XObject'), PDFDict)
  if (!xobjects) return 0
  let imagens = 0
  for (const chave of xobjects.keys()) {
    const stream: any = xobjects.lookup(chave)
    const subtipo = stream?.dict?.get(PDFName.of('Subtype'))
    if (String(subtipo) === '/Image') imagens += 1
  }
  return imagens
}

let contador = 0
function entradaDeRender(pageNumber: number) {
  contador += 1
  return {
    pageNumber,
    userName: 'Aluno de Teste',
    userEmail: 'aluno@exemplo.com',
    userId: '64b7f1c2a9d4e5f60718293a',
    materialId: '64b7f1c2a9d4e5f60718293b',
    materialTitle: 'Material de Teste',
    viewedAt: new Date('2026-09-14T12:00:00Z'),
    // Único por render: o cache de página em memória é chaveado por ele, e
    // reaproveitá-lo faria um caso devolver o resultado do anterior.
    auditToken: `teste-${contador}`,
  }
}

describe('derivadas de página do visualizador', () => {
  beforeEach(() => {
    // Os caches em memória atravessam testes dentro do mesmo processo.
    process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED = '0'
    process.env.PDF_VIEWER_PAGE_CACHE_ENABLED = '0'
  })

  afterEach(() => {
    delete process.env.PDF_VIEWER_SOURCEDOC_CACHE_ENABLED
    delete process.env.PDF_VIEWER_PAGE_CACHE_ENABLED
  })

  it('a página vinda da derivada é a mesma que vinha do documento completo', async () => {
    const original = await pdfDeTeste(8)
    let derivada: Uint8Array | null = null

    // ── Primeira leitura: sem derivada, baixa o documento inteiro ──────────
    const caro = await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 8,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (_pagina, bytes) => {
          derivada = bytes
        },
      },
      entradaDeRender(5)
    )

    expect(caro.totalPages).toBe(8)
    expect(derivada).not.toBeNull()
    expect(await paginaDe(caro.bytes)).toBe(5)

    // ── Segunda leitura: usa a derivada e NUNCA abre o documento ───────────
    const barato = await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 8,
        loadSlice: async () => {
          const d = derivada as unknown as Uint8Array
          return d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) as ArrayBuffer
        },
        loadFull: async () => {
          throw new Error('o documento completo nao devia ter sido baixado')
        },
      },
      entradaDeRender(5)
    )

    expect(barato.totalPages).toBe(8)
    expect(await paginaDe(barato.bytes)).toBe(5)

    // Mesma página física nos dois caminhos.
    const docCaro = await PDFDocument.load(caro.bytes, { ignoreEncryption: true })
    const docBarato = await PDFDocument.load(barato.bytes, { ignoreEncryption: true })
    expect(docBarato.getPage(0).getSize()).toEqual(docCaro.getPage(0).getSize())
  })

  /**
   * O caminho da derivada faz a página dar uma volta a mais: ela é salva e
   * recarregada antes de receber a marca d'água. Materiais escaneados são
   * imagem pura, e o comentário em renderWatermarkedSinglePagePdf avisa que
   * copyPages sobre PDFs com figuras em estruturas indiretas é justamente onde
   * as referências de XObject costumam se perder. Este caso existe para que
   * essa volta a mais nunca passe despercebida.
   */
  it('a imagem embutida sobrevive nos dois caminhos', async () => {
    const original = await pdfComImagem()
    const pdfSemImagem = await pdfDeTeste(1)
    let derivada: Uint8Array | null = null

    const caro = await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 1,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (_pagina, bytes) => {
          derivada = bytes
        },
      },
      entradaDeRender(1)
    )

    const barato = await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 1,
        loadSlice: async () => {
          const d = derivada as unknown as Uint8Array
          return d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) as ArrayBuffer
        },
        loadFull: async () => {
          throw new Error('o documento completo nao devia ter sido baixado')
        },
      },
      entradaDeRender(1)
    )

    expect(await contarImagens(caro.bytes)).toBe(1)
    expect(await contarImagens(barato.bytes)).toBe(1)

    // O contador precisa saber dizer "nenhuma", senão os dois expects acima
    // passariam mesmo com a imagem perdida.
    const semImagem = await createWatermarkedSinglePagePdf(
      { knownTotalPages: 1, loadFull: async () => pdfSemImagem },
      entradaDeRender(1)
    )
    expect(await contarImagens(semImagem.bytes)).toBe(0)
    expect(await paginaDe(barato.bytes)).toBe(await paginaDe(caro.bytes))
  })

  it('sem total de páginas conhecido, ignora a derivada e usa o documento', async () => {
    const original = await pdfDeTeste(3)
    let pediuDerivada = false

    const resultado = await createWatermarkedSinglePagePdf(
      {
        // `pageCount` ainda não gravado no Mongo — é a primeira abertura do
        // material. O total faz parte da resposta, e só o documento o informa.
        knownTotalPages: 0,
        loadSlice: async () => {
          pediuDerivada = true
          return null
        },
        loadFull: async () => original,
      },
      entradaDeRender(2)
    )

    expect(pediuDerivada).toBe(false)
    expect(resultado.totalPages).toBe(3)
    expect(await paginaDe(resultado.bytes)).toBe(2)
  })

  it('não guarda derivada quando a página pedida foi ajustada', async () => {
    const original = await pdfDeTeste(2)
    const guardadas: number[] = []

    // Página 9 num documento de 2: o render devolve a última, mas guardar esse
    // conteúdo sob a chave da página 9 serviria a página errada depois.
    const resultado = await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 0,
        loadFull: async () => original,
        onSliceReady: (pagina) => {
          guardadas.push(pagina)
        },
      },
      entradaDeRender(9)
    )

    expect(resultado.totalPages).toBe(2)
    expect(await paginaDe(resultado.bytes)).toBe(2)
    expect(guardadas).toEqual([])
  })

  it('guarda a derivada sob o número da página pedida', async () => {
    const original = await pdfDeTeste(4)
    const guardadas: number[] = []

    await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 4,
        loadSlice: async () => null,
        loadFull: async () => original,
        onSliceReady: (pagina) => {
          guardadas.push(pagina)
        },
      },
      entradaDeRender(3)
    )

    expect(guardadas).toEqual([3])
  })

  it('aceita o ArrayBuffer cru, como antes da fonte preguiçosa', async () => {
    const original = await pdfDeTeste(6)
    const resultado = await createWatermarkedSinglePagePdf(original, entradaDeRender(4))

    expect(resultado.totalPages).toBe(6)
    expect(await paginaDe(resultado.bytes)).toBe(4)
  })

  it('a fonte preguiçosa só é consultada uma vez por render', async () => {
    const original = await pdfDeTeste(5)
    let chamadas = 0

    await createWatermarkedSinglePagePdf(
      {
        knownTotalPages: 5,
        loadSlice: async () => null,
        loadFull: async () => {
          chamadas += 1
          return original
        },
      },
      entradaDeRender(1)
    )

    expect(chamadas).toBe(1)
  })
})

describe('identidade do PDF-fonte', () => {
  const base = {
    blobUrl: 'https://store.blob.vercel-storage.com/material-originals/abc/livro.pdf',
    sizeBytes: 1024,
    uploadedAt: new Date('2026-09-01T10:00:00Z'),
  }

  it('sem PDF vinculado não há fonte', () => {
    expect(fonteDoPdf(null)).toBeNull()
    expect(fonteDoPdf({})).toBeNull()
  })

  it('o mesmo arquivo dá sempre a mesma chave', () => {
    const a = fonteDoPdf(base)!
    const b = fonteDoPdf({ ...base })!
    expect(a.versao).toBe(b.versao)
    expect(caminhoDaDerivada(a, 7)).toBe(caminhoDaDerivada(b, 7))
  })

  /**
   * O upload grava com `addRandomSuffix: false`: reenviar um arquivo de mesmo
   * nome produz a MESMA blobUrl com conteúdo novo. Se a chave da derivada
   * dependesse só da URL, o material novo serviria as páginas do antigo.
   */
  it('reenvio com o mesmo nome muda a chave', () => {
    const antigo = fonteDoPdf(base)!
    const novo = fonteDoPdf({ ...base, uploadedAt: new Date('2026-09-14T10:00:00Z') })!
    expect(novo.blobUrl).toBe(antigo.blobUrl)
    expect(novo.versao).not.toBe(antigo.versao)
    expect(caminhoDaDerivada(novo, 7)).not.toBe(caminhoDaDerivada(antigo, 7))
  })

  it('tamanho diferente também muda a chave', () => {
    const antigo = fonteDoPdf(base)!
    const novo = fonteDoPdf({ ...base, sizeBytes: 2048 })!
    expect(novo.versao).not.toBe(antigo.versao)
  })

  it('cada página tem o seu próprio caminho, sob o prefixo das derivadas', () => {
    const fonte = fonteDoPdf(base)!
    const p1 = caminhoDaDerivada(fonte, 1)
    const p2 = caminhoDaDerivada(fonte, 2)
    expect(p1).not.toBe(p2)
    expect(p1).toMatch(/^material-paginas\/[0-9a-f]{2}\/[0-9a-f]{64}\.pdf$/)
    // O caminho não pode carregar o id do material nem a numeração da página.
    expect(p1).not.toContain(base.blobUrl)
    expect(p1).not.toContain('abc')
  })

  it('uma data de upload inválida não envenena a chave', () => {
    const fonte = fonteDoPdf({ ...base, uploadedAt: 'nao-e-data' })
    expect(fonte).not.toBeNull()
    expect(fonte!.versao).toMatch(/^[0-9a-f]{16}$/)
  })
})

/** O tipo é exportado para a rota montar a fonte — fixa o contrato. */
const _contrato: FontePdfDaPagina = { loadFull: async () => new ArrayBuffer(0) }
void _contrato
