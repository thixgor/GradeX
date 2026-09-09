import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  CAMINHO_PUBLICO_DO_PDFJS,
  CAMINHO_PUBLICO_DO_WORKER,
  urlComContornoDeCache,
} from '@/lib/pdfjs-do-publico'

/**
 * O leitor de PDF tem duas portas para o mesmo pacote: o pedaço que o webpack
 * empacota e a cópia estável em `public/`. Este teste guarda a segunda.
 *
 * O que ele impede é uma falha silenciosa e cara de achar: `pdfjs-dist` sobe de
 * versão no `package.json`, o arquivo de `public/` fica para trás, e biblioteca
 * e worker de versões diferentes se recusam a conversar — "The API version does
 * not match the Worker version". Só quebra para quem cair no plano B, que é
 * justamente quem já está com problema.
 *
 * Se este teste falhar, o conserto é copiar os dois arquivos de novo:
 *
 *   cp node_modules/pdfjs-dist/build/pdf.min.mjs public/pdf.min.mjs
 *   cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
 */

const RAIZ = path.resolve(__dirname, '..')

function digest(caminho: string): string {
  return createHash('sha256').update(readFileSync(caminho)).digest('hex')
}

const PARES = [
  {
    nome: 'biblioteca',
    publico: CAMINHO_PUBLICO_DO_PDFJS,
    origem: 'node_modules/pdfjs-dist/build/pdf.min.mjs',
  },
  {
    nome: 'worker',
    publico: CAMINHO_PUBLICO_DO_WORKER,
    origem: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  },
]

describe('cópias do pdf.js em public/', () => {
  for (const { nome, publico, origem } of PARES) {
    it(`a ${nome} em public/ é a mesma que o projeto instalou`, () => {
      const doProjeto = path.join(RAIZ, origem)
      const emPublic = path.join(RAIZ, 'public', publico.replace(/^\//, ''))
      expect(digest(emPublic)).toBe(digest(doProjeto))
    })
  }

  it('os dois caminhos terminam em .mjs — o middleware libera por essa extensão', () => {
    // middleware.ts deixa passar `pathname.endsWith('.mjs')` sem exigir login.
    // Sem isso, quem não tem cookie recebe o HTML de /auth/login no lugar do
    // módulo, e o erro que aparece é de MIME type.
    for (const { publico } of PARES) {
      expect(publico.endsWith('.mjs')).toBe(true)
      expect(publico.startsWith('/')).toBe(true)
    }
  })
})

describe('urlComContornoDeCache', () => {
  it('acrescenta o parâmetro que obriga a ir ao servidor', () => {
    expect(urlComContornoDeCache('/pdf.min.mjs', 1700000000000)).toBe(
      '/pdf.min.mjs?recarga=1700000000000',
    )
  })

  it('respeita um endereço que já tem parâmetro', () => {
    expect(urlComContornoDeCache('/pdf.min.mjs?a=1', 42)).toBe('/pdf.min.mjs?a=1&recarga=42')
  })

  it('endereços de instantes diferentes não se confundem', () => {
    // É o ponto todo: mesma URL = mesma cópia guardada = mesmo erro.
    const primeiro = urlComContornoDeCache(CAMINHO_PUBLICO_DO_PDFJS, 1)
    const segundo = urlComContornoDeCache(CAMINHO_PUBLICO_DO_PDFJS, 2)
    expect(primeiro).not.toBe(segundo)
  })
})
