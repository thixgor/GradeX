import { describe, expect, it } from 'vitest'
import { brotliDecompressSync, gunzipSync } from 'node:zlib'
import { randomBytes } from 'node:crypto'

import { codificacaoAceita, corpoComprimido, jsonComprimido } from '@/lib/resposta-comprimida'

/**
 * A compressão dentro da função é o que reduz o Fast Origin Transfer de JSON
 * e de PDF de texto. O que não pode acontecer: mandar comprimido para quem não
 * pediu, mandar um corpo maior que o original, ou errar o Content-Length.
 */

const cabecalhos = (accept?: string) => new Headers(accept === undefined ? {} : { 'accept-encoding': accept })
const textoRepetitivo = new TextEncoder().encode('<< /Type /Page /Parent 2 0 R >>\n'.repeat(400))

describe('codificacaoAceita', () => {
  it.each([
    ['gzip, deflate, br, zstd', 'br'],
    ['gzip, deflate', 'gzip'],
    ['br;q=0, gzip', 'gzip'],
    ['gzip;q=0', null],
    ['identity', null],
    [undefined, null],
  ])('%s → %s', (accept, esperado) => {
    expect(codificacaoAceita(cabecalhos(accept))).toBe(esperado)
  })
})

describe('corpoComprimido', () => {
  it('comprime com brotli quando aceito, com Content-Length do corpo comprimido', () => {
    const { corpo, cabecalhos: h } = corpoComprimido(cabecalhos('gzip, br'), textoRepetitivo)
    expect(h['Content-Encoding']).toBe('br')
    expect(h.Vary).toBe('Accept-Encoding')
    expect(Number(h['Content-Length'])).toBe(corpo.byteLength)
    expect(Buffer.from(brotliDecompressSync(corpo)).equals(Buffer.from(textoRepetitivo))).toBe(true)
  })

  it('cai para gzip quando brotli não é aceito', () => {
    const { corpo, cabecalhos: h } = corpoComprimido(cabecalhos('gzip'), textoRepetitivo)
    expect(h['Content-Encoding']).toBe('gzip')
    expect(Buffer.from(gunzipSync(corpo)).equals(Buffer.from(textoRepetitivo))).toBe(true)
  })

  it('não comprime o que não encolhe (JPEG, ruído)', () => {
    const ruido = new Uint8Array(randomBytes(64 * 1024))
    const { corpo, cabecalhos: h } = corpoComprimido(cabecalhos('br, gzip'), ruido)
    expect(h['Content-Encoding']).toBeUndefined()
    expect(corpo).toBe(ruido)
    expect(h['Content-Length']).toBe(String(ruido.byteLength))
  })

  it('não comprime corpo pequeno nem para quem não pediu', () => {
    const pequeno = new TextEncoder().encode('{"ok":true}')
    expect(corpoComprimido(cabecalhos('br'), pequeno).cabecalhos['Content-Encoding']).toBeUndefined()
    expect(corpoComprimido(cabecalhos(), textoRepetitivo).cabecalhos['Content-Encoding']).toBeUndefined()
  })
})

describe('jsonComprimido', () => {
  it('devolve o mesmo JSON, comprimido, com o status e os cabeçalhos pedidos', async () => {
    const dados = { materiais: Array.from({ length: 200 }, (_, i) => ({ _id: `m${i}`, titulo: 'Resumo de fisiologia' })) }
    const resposta = jsonComprimido({ headers: cabecalhos('gzip') }, dados, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
    expect(resposta.status).toBe(201)
    expect(resposta.headers.get('cache-control')).toBe('no-store')
    expect(resposta.headers.get('content-type')).toContain('application/json')
    expect(resposta.headers.get('content-encoding')).toBe('gzip')
    const corpo = Buffer.from(await resposta.arrayBuffer())
    expect(JSON.parse(gunzipSync(corpo).toString('utf8'))).toEqual(dados)
  })
})
