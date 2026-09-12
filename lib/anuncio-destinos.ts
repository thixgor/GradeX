/**
 * Destinos de um anúncio: para onde a peça leva e como isso é validado.
 *
 * O módulo é compartilhado entre a API (`app/api/admin/anuncios`) e a tela do
 * admin para que a validação do formulário e a do servidor nunca divirjam — o
 * sintoma clássico disso é o formulário aprovar um link que a API recusa
 * depois, com uma mensagem que ninguém consegue relacionar ao campo errado.
 *
 * A regra central é a do destino INTERNO: quando o anúncio aponta para um
 * material, um produto ou uma área da plataforma, o clique tem de navegar
 * dentro do app (`router.push`), nunca abrir uma aba nova. Sair do app para
 * voltar ao mesmo app custa o carregamento inteiro e, no PWA instalado, joga a
 * pessoa no navegador.
 */

export const ANUNCIO_DESTINO_TIPOS = [
  'material',
  'pacote',
  'produto',
  'aula',
  'rifa',
  'pagina',
  'externo',
] as const

export type AnuncioDestinoTipo = (typeof ANUNCIO_DESTINO_TIPOS)[number]

export interface AnuncioDestino {
  tipo: AnuncioDestinoTipo
  /** Nome legível do item escolhido, usado como título do banner. */
  rotulo?: string
  /** Id do documento de origem, quando o destino veio do banco. */
  refId?: string
}

export const ANUNCIO_DESTINO_LABEL: Record<AnuncioDestinoTipo, string> = {
  material: 'Material',
  pacote: 'Pacote',
  produto: 'Produto da loja',
  aula: 'Aula',
  rifa: 'Rifa',
  pagina: 'Parte do site',
  externo: 'Link externo',
}

/**
 * Caminho interno da aplicação.
 *
 * `//host` e `/\host` começam com barra mas o navegador os resolve como
 * endereço ABSOLUTO (protocolo relativo) — aceitá-los transformaria o campo de
 * destino interno em redirecionamento aberto para qualquer domínio.
 */
export function isInternalPath(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed.startsWith('/')) return false
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return false
  return true
}

/** URL de imagem: caminho interno ou http(s). */
export function isValidImageUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return isInternalPath(trimmed)

  try {
    const url = new URL(trimmed)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** URL de navegação: caminho interno, http(s), mailto ou tel. */
export function isValidNavigationUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('/')) return isInternalPath(trimmed)

  try {
    const url = new URL(trimmed)
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
  } catch {
    return false
  }
}

/**
 * Decide se um destino deve ser aberto dentro do app.
 *
 * Além do caminho interno óbvio, cobre a URL absoluta que aponta para o próprio
 * site (colada da barra de endereços, caso mais comum de anúncio que "sai do
 * app sem precisar"): ela vira caminho relativo em `toInternalPath`.
 */
export function isSameOriginUrl(value: string, origin: string): boolean {
  const trimmed = value.trim()
  if (isInternalPath(trimmed)) return true
  if (!origin) return false

  try {
    return new URL(trimmed, origin).origin === new URL(origin).origin
  } catch {
    return false
  }
}

/** Converte um destino do próprio site em caminho relativo; devolve null se for externo. */
export function toInternalPath(value: string, origin: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (isInternalPath(trimmed)) return trimmed
  if (!origin) return null

  try {
    const url = new URL(trimmed, origin)
    if (url.origin !== new URL(origin).origin) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

/** Tipo provável de um destino, para quando o admin cola a URL em vez de escolher na busca. */
export function inferDestinoTipo(href: string): AnuncioDestinoTipo {
  const trimmed = href.trim()
  if (!isInternalPath(trimmed)) return 'externo'

  const path = trimmed.split(/[?#]/)[0]
  if (path.startsWith('/materiais/')) return 'material'
  if (path.startsWith('/pacotes/')) return 'pacote'
  if (path.startsWith('/loja/')) return 'produto'
  if (path.startsWith('/aulas/')) return 'aula'
  if (path.startsWith('/rifas/')) return 'rifa'
  return 'pagina'
}

function shortText(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const clean = value.replace(/\s+/g, ' ').trim().slice(0, max)
  return clean || undefined
}

/**
 * Normaliza o destino vindo do cliente. Devolve `undefined` quando não há nada
 * aproveitável — o campo é opcional e um objeto vazio no banco só atrapalha.
 */
export function sanitizeDestino(value: unknown, href?: string): AnuncioDestino | undefined {
  const raw = (value ?? {}) as Partial<AnuncioDestino>
  const tipo = ANUNCIO_DESTINO_TIPOS.includes(raw.tipo as AnuncioDestinoTipo)
    ? (raw.tipo as AnuncioDestinoTipo)
    : href
      ? inferDestinoTipo(href)
      : undefined

  if (!tipo) return undefined

  const rotulo = shortText(raw.rotulo, 120)
  const refId = shortText(raw.refId, 64)

  return {
    tipo,
    ...(rotulo ? { rotulo } : {}),
    ...(refId ? { refId } : {}),
  }
}
