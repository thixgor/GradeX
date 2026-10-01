import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'

/**
 * A cadeia de derivadas no Blob: bruta → leitura → miniatura.
 *
 * O que importa aqui é a migração sem custo: uma página lida antes desta
 * mudança só tem a bruta no store, e a primeira leitura depois dela precisa
 * montar a enxuta A PARTIR DA BRUTA — nunca do documento inteiro, que era o
 * gasto que as derivadas existem para evitar.
 */

const store = vi.hoisted(() => new Map<string, Uint8Array>())

vi.mock('@vercel/blob', () => ({
  get: async (caminho: string) => {
    const bytes = store.get(caminho)
    if (!bytes) return null
    return {
      statusCode: 200,
      stream: new Response(Buffer.from(bytes)).body,
      blob: { size: bytes.byteLength },
    }
  },
  put: async (caminho: string, corpo: Buffer) => {
    store.set(caminho, new Uint8Array(corpo))
    return { pathname: caminho }
  },
}))

const {
  buscarPaginaEnxuta,
  caminhoDaDerivada,
  fonteDoPdf,
  gravarDerivadasDaBruta,
} = await import('@/lib/material-pdf-pages')

const fonte = fonteDoPdf({
  blobUrl: 'https://blob.exemplo/material.pdf',
  sizeBytes: 999,
  uploadedAt: new Date('2026-09-01T12:00:00Z'),
})!

/** Página escaneada a 600 DPI: a bruta é gorda, a enxuta não. */
async function paginaEscaneada(): Promise<Uint8Array> {
  const jpeg = await sharp({
    create: { width: 4960, height: 7016, channels: 3, background: { r: 240, g: 236, b: 226 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="4960" height="7016">${Array.from(
            { length: 40 },
            (_, i) => `<text x="200" y="${200 + i * 160}" font-size="90">Linha ${i} do material</text>`
          ).join('')}</svg>`
        ),
      },
    ])
    .jpeg({ quality: 90 })
    .toBuffer()
  const doc = await PDFDocument.create()
  const imagem = await doc.embedJpg(jpeg)
  doc.addPage([595.28, 841.89]).drawImage(imagem, { x: 0, y: 0, width: 595.28, height: 841.89 })
  return doc.save({ useObjectStreams: false })
}

let bruta: Uint8Array

beforeEach(async () => {
  store.clear()
  bruta ??= await paginaEscaneada()
})

afterEach(() => {
  delete process.env.PDF_VIEWER_IMAGEM_DPI
})

describe('derivadas enxutas', { timeout: 60_000 }, () => {
  it('sem nada no store, devolve null (só o documento completo resolve)', async () => {
    expect(await buscarPaginaEnxuta(fonte, 3, 'leitura')).toBeNull()
    expect(await buscarPaginaEnxuta(fonte, 3, 'miniatura')).toBeNull()
  })

  it('página lida antes da mudança: monta a de leitura a partir da bruta e grava', async () => {
    store.set(caminhoDaDerivada(fonte, 3, 'bruta'), bruta)

    const leitura = await buscarPaginaEnxuta(fonte, 3, 'leitura')
    expect(leitura).not.toBeNull()
    expect(leitura!.byteLength).toBeLessThan(bruta.byteLength / 2)
    expect(store.has(caminhoDaDerivada(fonte, 3, 'leitura'))).toBe(true)

    // Da segunda vez, vem pronta do store.
    const deNovo = await buscarPaginaEnxuta(fonte, 3, 'leitura')
    const comoBytes = (x: ArrayBuffer | Uint8Array) => Buffer.from(x instanceof Uint8Array ? x : new Uint8Array(x))
    expect(comoBytes(deNovo!).equals(comoBytes(leitura!))).toBe(true)
  })

  it('a miniatura sai da de leitura, e é bem menor que ela', async () => {
    store.set(caminhoDaDerivada(fonte, 5, 'bruta'), bruta)
    const miniatura = await buscarPaginaEnxuta(fonte, 5, 'miniatura')
    const leitura = store.get(caminhoDaDerivada(fonte, 5, 'leitura'))
    expect(leitura).toBeDefined()
    expect(miniatura!.byteLength).toBeLessThan(leitura!.byteLength / 4)
    expect(store.has(caminhoDaDerivada(fonte, 5, 'miniatura'))).toBe(true)
  })

  it('página recém-extraída do documento completo grava bruta e leitura', async () => {
    const leitura = await gravarDerivadasDaBruta(fonte, 7, bruta, 'leitura')
    expect(store.get(caminhoDaDerivada(fonte, 7, 'bruta'))).toEqual(bruta)
    expect(store.get(caminhoDaDerivada(fonte, 7, 'leitura'))).toEqual(leitura)
    expect(store.has(caminhoDaDerivada(fonte, 7, 'miniatura'))).toBe(false)
  })

  it('pedida pela miniatura, grava as três', async () => {
    const miniatura = await gravarDerivadasDaBruta(fonte, 8, bruta, 'miniatura')
    expect(store.has(caminhoDaDerivada(fonte, 8, 'bruta'))).toBe(true)
    expect(store.has(caminhoDaDerivada(fonte, 8, 'leitura'))).toBe(true)
    expect(store.get(caminhoDaDerivada(fonte, 8, 'miniatura'))).toEqual(miniatura)
  })

  it('cada variante tem o seu caminho, e mudar o perfil gera caminho novo', () => {
    const bruta1 = caminhoDaDerivada(fonte, 1, 'bruta')
    const leitura1 = caminhoDaDerivada(fonte, 1, 'leitura')
    const miniatura1 = caminhoDaDerivada(fonte, 1, 'miniatura')
    expect(new Set([bruta1, leitura1, miniatura1]).size).toBe(3)
    // A bruta mantém o caminho de sempre: as que já existem continuam valendo.
    expect(bruta1).toBe(caminhoDaDerivada(fonte, 1))
    process.env.PDF_VIEWER_IMAGEM_DPI = '200'
    expect(caminhoDaDerivada(fonte, 1, 'leitura')).not.toBe(leitura1)
    expect(caminhoDaDerivada(fonte, 1, 'bruta')).toBe(bruta1)
  })
})
