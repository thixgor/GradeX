import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Os ebooks em HTML de `public/` levam as imagens embutidas, em base64, no
 * manifesto do bundler. O bundler exporta tudo em PNG e no tamanho original, e
 * as três páginas chegaram a 8-11 MB, sendo 2,7 MB só de um logo exibido a
 * 32 px. `/apg` sai por função, então cada byte a mais ali é Fast Origin
 * Transfer.
 *
 * Este teste pega o ebook reexportado e publicado sem passar por
 * `scripts/ebooks/otimizar-imagens.py`.
 */

const EBOOKS = [
  'Cadernos-APGs.html',
  'Prescrição Real no SUS.html',
  'O Estado da Arte da Ecocardiografia Atual.html',
]

const COMO_CORRIGIR = 'rode `python3 scripts/ebooks/otimizar-imagens.py`'
// Mesmo limiar do script: abaixo disso ele não mexe na imagem.
const LIMIAR = 60 * 1024

type Entrada = { mime: string; compressed?: boolean; data: string }

function manifesto(arquivo: string): Record<string, Entrada> {
  const html = readFileSync(resolve(__dirname, '../public', arquivo), 'utf8')
  const achado = html.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/)
  expect(achado, `${arquivo} sem manifesto do bundler`).toBeTruthy()
  return JSON.parse(achado![1])
}

describe.each(EBOOKS)('%s', (arquivo) => {
  it('não leva PNG nem JPEG pesado embutido', () => {
    for (const [uuid, entrada] of Object.entries(manifesto(arquivo))) {
      if (!['image/png', 'image/jpeg'].includes(entrada.mime)) continue
      const bytes = Buffer.from(entrada.data, 'base64').length
      expect(bytes, `${uuid} (${entrada.mime}, ${bytes >> 10} KB): ${COMO_CORRIGIR}`).toBeLessThan(LIMIAR)
    }
  })

  it('só embute WebP de verdade quando diz que é WebP', () => {
    for (const [uuid, entrada] of Object.entries(manifesto(arquivo))) {
      if (entrada.mime !== 'image/webp') continue
      const bytes = Buffer.from(entrada.data, 'base64')
      expect(bytes.subarray(0, 4).toString('ascii'), uuid).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString('ascii'), uuid).toBe('WEBP')
    }
  })

  it('fica abaixo de 3 MB', () => {
    const tamanho = readFileSync(resolve(__dirname, '../public', arquivo)).length
    expect(tamanho, COMO_CORRIGIR).toBeLessThan(3 * 1024 * 1024)
  })
})
