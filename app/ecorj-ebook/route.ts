import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

let cachedHtml: string | null = null
function loadHtml(): string {
  if (!cachedHtml) {
    cachedHtml = readFileSync(join(process.cwd(), 'public', 'O Estado da Arte da Ecocardiografia Atual.html'), 'utf8')
  }
  return cachedHtml
}

export async function GET() {
  return new Response(loadHtml(), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
