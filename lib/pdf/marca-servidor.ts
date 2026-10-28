import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { ARQUIVOS_DE_FONTE, CAMINHO_DO_LOGO, definirFontes, definirLogo } from './marca'

/**
 * Fontes e logo dos PDFs gerados no SERVIDOR (o baralho de flashcards).
 *
 * No navegador, `lib/pdf/marca.ts` busca `/fonts/*.ttf` e `/logo-pdf.png` por
 * `fetch`. Numa função não há origem para um caminho relativo, então aqui os
 * mesmos arquivos são lidos do disco — e precisam estar no pacote da função:
 * `outputFileTracingIncludes` em `next.config.js` os declara para a rota do
 * PDF (o rastreio não segue um `readFile` com caminho montado em execução).
 *
 * Lidos uma vez por instância. Sem eles o PDF sai do mesmo jeito, em
 * Helvetica e sem logo — pior, mas inteiro.
 */

let preparo: Promise<void> | null = null

export function prepararAssetsDePdfNoServidor(): Promise<void> {
  if (preparo) return preparo
  preparo = (async () => {
    const publico = path.join(process.cwd(), 'public')
    const [fontes, logo] = await Promise.all([
      Promise.all(
        ARQUIVOS_DE_FONTE.map(async (f) => ({
          ...f,
          b64: (await readFile(path.join(publico, 'fonts', f.file))).toString('base64'),
        })),
      ).catch(() => []),
      readFile(path.join(publico, CAMINHO_DO_LOGO))
        .then((bytes) => `data:image/png;base64,${bytes.toString('base64')}`)
        .catch(() => null),
    ])
    definirFontes(fontes)
    definirLogo(logo)
  })()
  return preparo
}
