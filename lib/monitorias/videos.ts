/**
 * Vídeos de demonstração: só YouTube e Instagram, e só o ID.
 *
 * Guardar a URL crua e jogá-la num `<iframe src>` deixaria qualquer um
 * embutir qualquer página no anúncio (phishing com cara de DomineAqui). Aqui a
 * URL é desmontada, o ID passa por uma regex estrita e o `src` do iframe é
 * remontado por nós a partir do ID — o host nunca vem do usuário.
 */

import type { VideoAnuncio } from './tipos'

const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/
const ID_INSTAGRAM = /^[A-Za-z0-9_-]{5,40}$/

const HOSTS_YOUTUBE = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])
const HOSTS_INSTAGRAM = new Set(['instagram.com', 'www.instagram.com'])

export function interpretarUrlDeVideo(entrada: string): VideoAnuncio | null {
  let url: URL
  try {
    url = new URL(String(entrada || '').trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.username || url.password || url.port) return null
  const host = url.hostname.toLowerCase()
  const partes = url.pathname.split('/').filter(Boolean)

  if (HOSTS_YOUTUBE.has(host)) {
    let id: string | null = null
    if (host.endsWith('youtu.be')) id = partes[0] || null
    else if (partes[0] === 'watch') id = url.searchParams.get('v')
    else if (partes[0] === 'shorts' || partes[0] === 'embed' || partes[0] === 'live') id = partes[1] || null
    return id && ID_YOUTUBE.test(id) ? { provider: 'youtube', id } : null
  }

  if (HOSTS_INSTAGRAM.has(host)) {
    const tipo = partes[0] === 'reel' || partes[0] === 'reels' ? 'reel' : partes[0] === 'p' ? 'p' : null
    const id = partes[1] || null
    return tipo && id && ID_INSTAGRAM.test(id) ? { provider: 'instagram', id, tipo } : null
  }

  return null
}

/** Revalida um vídeo que já veio no formato {provider, id} (ex.: do banco ou do cliente). */
export function videoValido(video: unknown): video is VideoAnuncio {
  if (!video || typeof video !== 'object') return false
  const v = video as VideoAnuncio
  if (v.provider === 'youtube') return ID_YOUTUBE.test(v.id)
  if (v.provider === 'instagram') return ID_INSTAGRAM.test(v.id) && (v.tipo === 'p' || v.tipo === 'reel')
  return false
}

export function urlDeEmbed(video: VideoAnuncio): string {
  if (video.provider === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?rel=0&modestbranding=1&autoplay=1`
  }
  return `https://www.instagram.com/${video.tipo === 'reel' ? 'reel' : 'p'}/${encodeURIComponent(video.id)}/embed`
}

export function urlDeMiniatura(video: VideoAnuncio): string | null {
  if (video.provider === 'youtube') return `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`
  return null
}

export function urlOriginal(video: VideoAnuncio): string {
  if (video.provider === 'youtube') return `https://www.youtube.com/watch?v=${encodeURIComponent(video.id)}`
  return `https://www.instagram.com/${video.tipo === 'reel' ? 'reel' : 'p'}/${encodeURIComponent(video.id)}/`
}
