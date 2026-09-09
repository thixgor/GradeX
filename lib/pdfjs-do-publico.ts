/**
 * O plano B para trazer o pdf.js: a cópia estável em `public/`.
 *
 * O caminho normal é `import('pdfjs-dist')`, que o webpack empacota num arquivo
 * com hash no nome — `/_next/static/chunks/9980-8f3a….js`. Esse nome é a força
 * e a fraqueza dele: cacheável para sempre, mas VÁLIDO SÓ NAQUELE DEPLOY. Se a
 * página aberta é de uma versão anterior, ou se a cópia local daquele arquivo
 * ficou ruim no aparelho, o navegador responde com "Loading chunk 9980 failed"
 * e o leitor inteiro para — não há uma página sequer para mostrar sem o pdf.js.
 *
 * Este módulo dá uma segunda porta para o mesmo pacote:
 *
 *   `/pdf.min.mjs` — mesmo arquivo, servido de `public/`, sem hash no nome.
 *
 * O que muda por não ter hash:
 *
 * - o endereço não morre a cada deploy, então uma aba antiga continua achando
 *   o arquivo (é o caso do aplicativo instalado no iPad, aberto por dias);
 * - o service worker não o guarda (ele só faz cache-first de `/_next/static/`,
 *   `/fonts/`, `/img/` e `/ldpg-mnclinico-assets/`), e a Vercel o entrega com
 *   revalidação, então não existe cópia local imortal para dar errado;
 * - e quando ainda assim der, dá para pedir de novo furando qualquer cache,
 *   acrescentando um parâmetro ao endereço (ver `urlComContornoDeCache`).
 *
 * O arquivo em `public/` é o mesmo byte a byte que o de `node_modules` — isso
 * é verificado em `__tests__/pdfjs-arquivos-publicos.test.ts`, junto com o
 * worker, porque biblioteca e worker de versões diferentes se recusam a
 * conversar ("The API version does not match the Worker version").
 *
 * Por que o import está isolado num arquivo só dele: `webpackIgnore` é um
 * comentário mágico, e comentário mágico é frágil por natureza. Deixando-o
 * sozinho aqui, fica óbvio o que ele faz e por quê — e se algum dia o webpack
 * deixar de respeitá-lo, quebra só o plano B, com o caminho normal intacto.
 */

/** Endereço da cópia estável. Serve também para o teste conferir o arquivo. */
export const CAMINHO_PUBLICO_DO_PDFJS = '/pdf.min.mjs'

/** Endereço do worker. Mesmo pacote, mesma versão, mesma pasta. */
export const CAMINHO_PUBLICO_DO_WORKER = '/pdf.worker.min.mjs'

/**
 * Acrescenta um parâmetro descartável ao endereço, para o navegador ter de ir
 * ao servidor em vez de reaproveitar o que ele guardou.
 *
 * Existe para o caso em que a cópia local é o problema — resposta cortada pela
 * metade, gravada antes de a conexão cair. Sem trocar o endereço, todo pedido
 * seguinte é respondido pela mesma cópia ruim, e nem recarregar a página
 * resolve: recarga revalida o documento, não os arquivos que ele pede.
 */
export function urlComContornoDeCache(url: string, agora: number): string {
  const separador = url.includes('?') ? '&' : '?'
  return `${url}${separador}recarga=${agora}`
}

/**
 * Importa o pdf.js pela cópia estável, sem passar pelo empacotador.
 *
 * `webpackIgnore: true` é o que faz o webpack deixar este `import()` em paz —
 * sem ele, o empacotador tentaria resolver o endereço em tempo de build (e não
 * conseguiria, porque é um caminho do servidor, não um módulo do projeto).
 */
export async function importarPdfJsDoPublico(
  url: string = CAMINHO_PUBLICO_DO_PDFJS,
): Promise<typeof import('pdfjs-dist')> {
  const modulo = await import(/* webpackIgnore: true */ url)
  return modulo as typeof import('pdfjs-dist')
}
