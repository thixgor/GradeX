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

/**
 * Endereços que não são material de estudo e sim um caminho para fora da
 * plataforma: mensageiros, redes sociais, "link na bio", agendadores e
 * encurtadores (que escondem qualquer um desses).
 */
const HOSTS_DE_CONTATO = [
  'wa.me', 'wa.link', 'whatsapp.com', 'whatsapp.net', 't.me', 'telegram.me', 'telegram.org', 'telegram.dog', 'signal.me', 'signal.group',
  'm.me', 'messenger.com', 'facebook.com', 'fb.com', 'fb.me', 'instagram.com', 'instagr.am', 'ig.me', 'threads.net', 'tiktok.com',
  'twitter.com', 'x.com', 'linkedin.com', 'lnkd.in', 'snapchat.com', 'discord.gg', 'discord.com', 'discordapp.com', 'skype.com',
  'linktr.ee', 'beacons.ai', 'bio.link', 'linkbio.co', 'campsite.bio', 'taplink.cc', 'lnk.bio', 'about.me', 'carrd.co',
  'calendly.com', 'cal.com', 'bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 'rebrand.ly', 'ow.ly', 'shorturl.at', 'tiny.cc', 't.co',
  'encurtador.com.br', 'l.ead.me', 'rb.gy', 'goo.gl', 'qrco.de', 'abre.ai', 'zap.vc',
]

/** Link de material: https seguro e que não seja contato/rede social disfarçado. */
export function validarLinkDeMaterial(entrada: string): LinkSeguro | null {
  const link = validarLinkExterno(entrada)
  if (!link) return null
  const host = new URL(link.url).hostname.toLowerCase()
  return HOSTS_DE_CONTATO.some((base) => host === base || host.endsWith(`.${base}`)) ? null : link
}

export const AVISO_LINK_DE_MATERIAL =
  'Use um link https de material de estudo (Drive, Notion, YouTube, Canva...). Links de WhatsApp, Telegram, redes sociais, agendadores e encurtadores não são aceitos.'

export const PLATAFORMAS_DE_REUNIAO = 'Google Meet, Zoom, Microsoft Teams, Whereby, Jitsi ou Discord'
