import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { type FonteCarregada, definirFontes, definirLogo } from './marca'

/**
 * Fontes e logo dos PDFs gerados no SERVIDOR (o baralho de flashcards).
 *
 * No navegador, `lib/pdf/marca.ts` busca `/fonts/*.ttf` e `/logo-pdf.png` por
 * `fetch`. Numa função não há origem para um caminho relativo, então aqui os
 * mesmos arquivos são lidos do disco.
 *
 * ## Cada caminho escrito por inteiro, de propósito
 *
 * O rastreio de arquivos do build lê estes `path.join` para decidir o que vai
 * no pacote da função. Com o caminho todo em texto literal, ele leva aquele
 * arquivo e nada mais. A primeira versão montava o caminho com uma variável
 * (`path.join(process.cwd(), 'public', 'fonts', f.file)`), e o rastreio, sem
 * saber qual arquivo seria, levou a pasta `public` INTEIRA: 14.919 arquivos,
 * 434 MB descomprimidos, e a Vercel recusou a função (o teto é 250 MB). Não
 * troque estas linhas por um laço.
 *
 * `outputFileTracingIncludes` em `next.config.js` declara os mesmos arquivos
 * para a rota — redundante com os caminhos literais, e é a garantia caso o
 * rastreio mude.
 *
 * Lidos uma vez por instância. Sem eles o PDF sai do mesmo jeito, em
 * Helvetica e sem logo — pior, mas inteiro.
 */

let preparo: Promise<void> | null = null

const base64 = (bytes: Buffer) => bytes.toString('base64')

export function prepararAssetsDePdfNoServidor(): Promise<void> {
  if (preparo) return preparo
  preparo = (async () => {
    const [fontes, logo] = await Promise.all([
      Promise.all([
        readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf')).then(
          (b): FonteCarregada => ({ file: 'Inter-Regular.ttf', style: 'normal', b64: base64(b) }),
        ),
        readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf')).then(
          (b): FonteCarregada => ({ file: 'Inter-Bold.ttf', style: 'bold', b64: base64(b) }),
        ),
        readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-Italic.ttf')).then(
          (b): FonteCarregada => ({ file: 'Inter-Italic.ttf', style: 'italic', b64: base64(b) }),
        ),
        readFile(path.join(process.cwd(), 'public', 'fonts', 'Inter-BoldItalic.ttf')).then(
          (b): FonteCarregada => ({ file: 'Inter-BoldItalic.ttf', style: 'bolditalic', b64: base64(b) }),
        ),
      ]).catch((): FonteCarregada[] => []),
      readFile(path.join(process.cwd(), 'public', 'logo-pdf.png'))
        .then((bytes) => `data:image/png;base64,${base64(bytes)}`)
        .catch(() => null),
    ])
    definirFontes(fontes)
    definirLogo(logo)
  })()
  return preparo
}
