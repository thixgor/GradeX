import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

let cachedHtml: string | null = null
function loadHtml(): string {
  if (!cachedHtml) {
    cachedHtml = readFileSync(join(process.cwd(), 'public', 'Prescrição Real no SUS.html'), 'utf8')
  }
  return cachedHtml
}

export async function GET() {
  return new Response(loadHtml(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // `s-maxage` de um ano, não de uma hora.
      //
      // Esta página é um HTML de ~10 MB lido do disco e devolvido pela função.
      // Com `s-maxage=3600` cada região da borda voltava à origem de hora em
      // hora para buscar de novo os mesmos 10 MB — 24 vezes por dia, vezes o
      // número de regiões com tráfego. Era parte dos 10,49 GB de Fast Origin
      // Transfer de agosto (US$ 3,72), gastos em bytes idênticos.
      //
      // Um ano é seguro porque o conteúdo só muda em deploy, e cada deploy da
      // Vercel tem chave de cache própria: a borda parte fria. `max-age=0`
      // mantém o navegador reconferindo — mas com a borda, não com a origem.
      'cache-control': 'public, max-age=0, s-maxage=31536000, stale-while-revalidate=86400',
    },
  })
}
