/**
 * Links externos que o monitor põe no anúncio (materiais complementares) e o
 * link da reunião. A plataforma não hospeda nem se responsabiliza pelo que
 * está do outro lado — mas garante que o link é um link de verdade: https,
 * sem credenciais embutidas, sem IP cru, sem `javascript:`.
 */

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

export interface LinkSeguro {
  url: string
  dominio: string
}

export function validarLinkExterno(entrada: string): LinkSeguro | null {
  const texto = String(entrada || '').trim()
  if (!texto || texto.length > 500) return null
  let url: URL
  try {
    url = new URL(texto)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null
  if (url.username || url.password) return null
  const host = url.hostname.toLowerCase()
  if (!host.includes('.') || IPV4.test(host) || host.startsWith('[')) return null
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null
  return { url: url.toString(), dominio: host.replace(/^www\./, '') }
}

/** Plataformas de reunião aceitas no link da aula. */
const HOSTS_REUNIAO = [
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'teams.live.com',
  'whereby.com',
  'meet.jit.si',
  'discord.gg',
  'discord.com',
]

export function validarLinkDeReuniao(entrada: string): LinkSeguro | null {
  const link = validarLinkExterno(entrada)
  if (!link) return null
  const host = new URL(link.url).hostname.toLowerCase()
  const permitido = HOSTS_REUNIAO.some((base) => host === base || host.endsWith(`.${base}`))
  return permitido ? link : null
}

export const PLATAFORMAS_DE_REUNIAO = 'Google Meet, Zoom, Microsoft Teams, Whereby, Jitsi ou Discord'
