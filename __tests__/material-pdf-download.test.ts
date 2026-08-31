import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchMaterialPdfBytes } from '@/lib/material-pdf-viewer'

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
