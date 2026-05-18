import { NextRequest, NextResponse } from 'next/server'

// Edge runtime: muito mais barato no Vercel que serverless (Fluid Active CPU
// não é contabilizado da mesma forma; latência também cai). Não fazemos
// nenhum processamento Node-only aqui, apenas proxy de bytes.
export const runtime = 'edge'

// Whitelist de hosts permitidos — evita usar este endpoint como open proxy
// (segurança) e como vetor de tráfego/CPU não autorizado.
const ALLOWED_HOSTS = new Set<string>([
  'i.imgur.com',
  'imgur.com',
])

function isAllowedHost(host: string): boolean {
  // Aceita também subdomínios *.public.blob.vercel-storage.com (CDN de blobs)
  if (host.endsWith('.public.blob.vercel-storage.com')) return true
  return ALLOWED_HOSTS.has(host)
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:') {
    // Imagens upstream devem ser sempre HTTPS — bloqueia http e schemes
    // exóticos que poderiam ser usados em SSRF.
    return NextResponse.json({ error: 'Only HTTPS upstream allowed' }, { status: 400 })
  }

  if (!isAllowedHost(parsed.host)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  // Suporte a If-None-Match / If-Modified-Since para 304 cache hit.
  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; GradeX-PDF/1.0)',
    'Accept': 'image/*,*/*',
  }
  const inm = request.headers.get('if-none-match')
  if (inm) upstreamHeaders['If-None-Match'] = inm
  const ims = request.headers.get('if-modified-since')
  if (ims) upstreamHeaders['If-Modified-Since'] = ims

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    // A Edge Network da Vercel cacheia respostas com base no
    // Cache-Control que devolvemos abaixo, então uma segunda chamada
    // do mesmo URL nem chega aqui dentro do TTL.
    const response = await fetch(url, {
      signal: controller.signal,
      headers: upstreamHeaders,
    })
    clearTimeout(timeout)

    if (response.status === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream returned ${response.status}` }, { status: 502 })
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const etag = response.headers.get('etag') || undefined
    const lastModified = response.headers.get('last-modified') || undefined

    // 30 dias + immutable: o URL é um asset estático no upstream; ele
    // raramente muda. Browsers e a CDN Edge da Vercel servem direto sem
    // tocar nesta função.
    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
      'Access-Control-Allow-Origin': '*',
    }
    if (etag) headers['ETag'] = etag
    if (lastModified) headers['Last-Modified'] = lastModified

    // Passa o body como stream — não alocamos arrayBuffer aqui
    // (importante para uso de memória + CPU).
    return new NextResponse(response.body, { status: 200, headers })
  } catch (err) {
    clearTimeout(timeout)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch image: ${message}` }, { status: 502 })
  }
}
