/**
 * Classificação das URLs de capa (provas, grupos, materiais).
 *
 * Separado de `components/cover-image.tsx` porque é lógica pura de string: sem
 * React, testável em Node, e legível ao lado de `next.config.js` — que é o
 * arquivo com quem esta lista precisa concordar.
 *
 * A concordância importa: `next/image` **lança em tempo de render** quando o
 * host não está em `images.remotePatterns`. Um host a mais aqui do que lá não
 * dá imagem quebrada, dá página em branco. O teste em
 * `__tests__/cover-image-hosts.test.ts` lê o `next.config.js` e falha se as
 * duas listas divergirem.
 */

/** Hosts exatos liberados no otimizador. Espelha `images.remotePatterns`. */
export const OPTIMIZABLE_HOSTS = ['i.imgur.com', 'digitalhistology.org'] as const

/** Sufixos de host liberados (o CDN de blobs usa um subdomínio por store). */
export const OPTIMIZABLE_HOST_SUFFIXES = ['.public.blob.vercel-storage.com'] as const

function isOptimizableHost(hostname: string): boolean {
  if (OPTIMIZABLE_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) return true
  return (OPTIMIZABLE_HOSTS as readonly string[]).includes(hostname)
}

/**
 * Capas antigas foram salvas como `http://` — o normalizador da API aceita os
 * dois esquemas. Numa página HTTPS o navegador bloqueia conteúdo misto e a capa
 * simplesmente não aparece; o otimizador também recusaria o host. Os hosts que
 * usamos falam HTTPS há anos, então promover o esquema conserta a imagem em vez
 * de escondê-la.
 */
export function normalizeCoverSrc(src: string): string {
  if (!src.startsWith('http://')) return src
  try {
    const url = new URL(src)
    if (url.hostname === 'localhost') return src
    if (!isOptimizableHost(url.hostname)) return src
    url.protocol = 'https:'
    return url.toString()
  } catch {
    return src
  }
}

/** `true` quando a URL pode ir para `/_next/image` sem derrubar o render. */
export function canUseNextImage(src: string): boolean {
  // Caminho relativo (`/uploads/...`, `/img/...`) é servido por nós mesmos.
  if (src.startsWith('/') && !src.startsWith('//')) return true

  try {
    const url = new URL(src)
    if (url.protocol === 'http:') return url.hostname === 'localhost'
    if (url.protocol !== 'https:') return false
    return isOptimizableHost(url.hostname)
  } catch {
    return false
  }
}
