import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'
import {
  describePdfDownloadFailure,
  downloadPdfResponse,
  PdfDownloadTransferError,
} from '@/lib/material-download-client'
import { pdfBytesToStream } from '@/lib/pdf-response'

/**
 * Um download que morre no meio ainda começa com %PDF e ainda abre — só que
 * sem os objetos do fim do arquivo, onde costumam estar as imagens. Sem esta
 * checagem, o comprador receberia o material com figuras faltando e nenhum
 * erro apareceria em lugar nenhum.
 */

const PDF_BODY = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n')

function respondWith(headers: Record<string, string>, body: Uint8Array = PDF_BODY) {
  return new Response(body.slice().buffer as ArrayBuffer, { status: 200, headers })
}

let counter = 0
function uniqueUrl() {
  counter += 1
  return `https://blob.exemplo/material-${counter}.pdf`
}

describe('fetchMaterialPdfBytes', () => {
  beforeEach(() => {
    // O cache é por URL e vive no módulo — desligamos para isolar os casos.
    process.env.PDF_VIEWER_BLOB_CACHE_ENABLED = '0'
  })

  afterEach(() => {
    delete process.env.PDF_VIEWER_BLOB_CACHE_ENABLED
    vi.unstubAllGlobals()
  })

  it('entrega o arquivo quando ele chega inteiro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      respondWith({ 'content-length': String(PDF_BODY.byteLength) })
    ))

    const bytes = await fetchMaterialPdfBytes(uniqueUrl())
    expect(bytes.byteLength).toBe(PDF_BODY.byteLength)
  })

  it('recusa um download truncado em vez de entregar PDF pela metade', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      respondWith({ 'content-length': String(PDF_BODY.byteLength * 3) })
    ))

    await expect(fetchMaterialPdfBytes(uniqueUrl())).rejects.toThrow(/incompleto/i)
  })

  it('não confunde resposta comprimida com download truncado', async () => {
    // Aqui o content-length é do conteúdo comprimido: comparar com o tamanho
    // já descomprimido daria falso positivo e derrubaria toda entrega.
    vi.stubGlobal('fetch', vi.fn(async () =>
      respondWith({ 'content-length': '12', 'content-encoding': 'gzip' })
    ))

    const bytes = await fetchMaterialPdfBytes(uniqueUrl())
    expect(bytes.byteLength).toBe(PDF_BODY.byteLength)
  })

  it('rejeita arquivo que não é PDF', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      respondWith({ 'content-length': '5' }, new TextEncoder().encode('<html'))
    ))

    await expect(fetchMaterialPdfBytes(uniqueUrl())).rejects.toThrow(/nao e um PDF valido/i)
  })
})

/**
 * A entrega do arquivo ao navegador.
 *
 * O sintoma que originou estes testes foi um `POST /api/materiais/download`
 * registrado no console como "200 (OK) net::ERR_FAILED": a borda da Vercel
 * corta o corpo de uma função que responde de uma vez acima de ~4,5 MB, e o
 * corte acontece depois de os cabeçalhos já terem saído. Daí as duas metades
 * da correção — o servidor entrega em pedaços, e o cliente confere se o que
 * chegou está inteiro antes de salvar.
 */
describe('pdfBytesToStream', () => {
  it('entrega o arquivo inteiro, em pedaços', async () => {
    const bytes = new Uint8Array(1000).map((_, i) => i % 251)
    const stream = pdfBytesToStream(bytes, 256)

    const chunks: Uint8Array[] = []
    const reader = stream.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }

    // Um pedaço só significaria resposta "de uma vez" — exatamente o que a
    // borda corta.
    expect(chunks.length).toBe(4)
    expect(chunks.every(c => c.byteLength <= 256)).toBe(true)

    const recebido = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0))
    let offset = 0
    for (const chunk of chunks) {
      recebido.set(chunk, offset)
      offset += chunk.byteLength
    }
    expect(Array.from(recebido)).toEqual(Array.from(bytes))
  })

  it('fecha sem emitir nada quando não há bytes', async () => {
    const reader = pdfBytesToStream(new Uint8Array(0)).getReader()
    expect((await reader.read()).done).toBe(true)
  })
})

describe('downloadPdfResponse', () => {
  const PDF = new TextEncoder().encode('%PDF-1.7\nconteudo\n%%EOF\n')

  function pdfResponse(body: Uint8Array, contentLength: number) {
    return new Response(body.slice().buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(contentLength),
        'Content-Disposition': 'attachment; filename="material.pdf"',
      },
    })
  }

  // O salvamento toca no DOM; aqui só precisamos que ele não exploda.
  function stubDom() {
    const anchor: any = { click: vi.fn(), remove: vi.fn() }
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:teste', revokeObjectURL: () => {} })
    vi.stubGlobal('document', {
      createElement: () => anchor,
      body: { appendChild: () => {} },
    })
    vi.stubGlobal('window', { setTimeout: () => 0 })
    return anchor
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('salva o arquivo quando o corpo chega inteiro', async () => {
    const anchor = stubDom()

    await downloadPdfResponse(pdfResponse(PDF, PDF.byteLength), 'fallback.pdf')

    expect(anchor.click).toHaveBeenCalled()
    // O nome vem do Content-Disposition, não do fallback.
    expect(anchor.download).toBe('material.pdf')
  })

  it('recusa um corpo cortado no meio em vez de salvar um PDF quebrado', async () => {
    const anchor = stubDom()

    await expect(
      downloadPdfResponse(pdfResponse(PDF, PDF.byteLength * 4), 'fallback.pdf')
    ).rejects.toBeInstanceOf(PdfDownloadTransferError)

    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('não confunde resposta comprimida com corpo cortado', async () => {
    // Content-Length menor que o corpo é o caso da resposta comprimida no
    // caminho: comparar por excesso derrubaria toda entrega.
    const anchor = stubDom()

    await downloadPdfResponse(pdfResponse(PDF, 4), 'fallback.pdf')

    expect(anchor.click).toHaveBeenCalled()
  })
})

describe('describePdfDownloadFailure', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não culpa a internet do aluno quando ele está online', () => {
    vi.stubGlobal('navigator', { onLine: true })
    const mensagem = describePdfDownloadFailure(new TypeError('Failed to fetch'))
    expect(mensagem).toMatch(/interrompido/i)
    expect(mensagem).not.toMatch(/sem conexão/i)
  })

  it('avisa da falta de rede quando o aparelho está offline', () => {
    vi.stubGlobal('navigator', { onLine: false })
    expect(describePdfDownloadFailure(new TypeError('Failed to fetch'))).toMatch(/sem conexão/i)
  })
})
