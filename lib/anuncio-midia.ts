/**
 * Mídia do anúncio (imagem ou vídeo) e o anúncio que mora DENTRO da página.
 *
 * Até aqui todo anúncio era o banner flutuante do rodapé. Este módulo traz o
 * segundo formato — a peça que entra no fluxo do conteúdo, no topo ou no fim da
 * página — e a mídia que os dois usam: a arte do anúncio na página e o vídeo
 * (ou imagem) que aparece dentro do modal.
 *
 * É compartilhado entre a API, o painel do admin e a exibição pública, pelo
 * mesmo motivo de `lib/anuncio-destinos.ts`: a regra que decide onde a peça
 * aparece não pode ter duas cópias, senão o diagnóstico do admin mente.
 */

import { isValidImageUrl } from '@/lib/anuncio-destinos'

/** Onde o anúncio aparece. Ausente = `flutuante` (os anúncios antigos). */
export type AnuncioExibicao = 'flutuante' | 'pagina'

/** Lugar da peça na página: logo abaixo do cabeçalho ou no fim do conteúdo. */
export type AnuncioPosicao = 'topo' | 'rodape'

export type AnuncioMidiaTipo = 'imagem' | 'video'

export interface AnuncioMidia {
  tipo: AnuncioMidiaTipo
  /** Imagem (WebP na maioria dos casos) ou vídeo MP4 (H.264 + AAC). */
  url: string
  /** Quadro do vídeo mostrado antes de tocar. Só vídeo. */
  posterUrl?: string
  /** Dimensões reais do arquivo: reservam o espaço exato na tela (sem salto de layout). */
  largura: number
  altura: number
  /** Segundos. Só vídeo. */
  duracao?: number
  /** Tamanho final, depois da otimização. Informativo para o admin. */
  bytes?: number
}

export const ANUNCIO_POSICAO_LABEL: Record<AnuncioPosicao, string> = {
  topo: 'Topo da página',
  rodape: 'Fim da página',
}

/** Marcador de "todas as páginas" na lista de páginas do anúncio. */
export const TODAS_AS_PAGINAS = '*'

/**
 * Atalhos do seletor de páginas. Cada caminho vale para ele mesmo e para tudo
 * abaixo dele: `/manual-clinico` cobre também `/manual-clinico/farmacologia`.
 */
export const ANUNCIO_PAGINAS_ATALHOS: Array<{ caminho: string; rotulo: string }> = [
  { caminho: '/dashboard', rotulo: 'Dashboard' },
  { caminho: '/manual-clinico', rotulo: 'Manual clínico (todas as seções)' },
  { caminho: '/materiais', rotulo: 'Materiais' },
  { caminho: '/flashcards', rotulo: 'Flashcards' },
  { caminho: '/banco-questoes', rotulo: 'Banco de questões' },
  { caminho: '/provas', rotulo: 'Provas' },
  { caminho: '/aulas', rotulo: 'Aulas' },
  { caminho: '/cronogramas', rotulo: 'Cronogramas' },
  { caminho: '/mapa-mental', rotulo: 'Mapa mental' },
  { caminho: '/anatomia', rotulo: 'Anatomia' },
  { caminho: '/monitorias', rotulo: 'Monitorias' },
  { caminho: '/forum', rotulo: 'Fórum' },
  { caminho: '/games', rotulo: 'Games' },
  { caminho: '/profile', rotulo: 'Perfil' },
  { caminho: '/', rotulo: 'Página inicial (só ela)' },
]

/** Proporções de referência. Qualquer outra é aceita e exibida como veio. */
export const ANUNCIO_PROPORCOES: Array<{ rotulo: string; valor: number }> = [
  { rotulo: '16:9', valor: 16 / 9 },
  { rotulo: '4:5', valor: 4 / 5 },
  { rotulo: '9:16', valor: 9 / 16 },
  { rotulo: '4:1', valor: 4 },
  { rotulo: '1:1', valor: 1 },
  { rotulo: '3:1', valor: 3 },
]

/**
 * "16:9", "4:5"... ou a proporção livre ("1,42:1") quando nenhuma das de
 * referência está a menos de 4% de distância.
 */
export function rotuloDaProporcao(largura: number, altura: number): string {
  if (!(largura > 0) || !(altura > 0)) return '—'
  const razao = largura / altura
  let melhor = ANUNCIO_PROPORCOES[0]
  for (const p of ANUNCIO_PROPORCOES) {
    if (Math.abs(Math.log(razao / p.valor)) < Math.abs(Math.log(razao / melhor.valor))) melhor = p
  }
  if (Math.abs(razao / melhor.valor - 1) <= 0.04) return melhor.rotulo
  return `${razao.toFixed(2).replace('.', ',')}:1`
}

/** Normaliza um caminho digitado: sem query, sem hash, sem barra no fim. */
export function normalizarCaminho(valor: string): string | null {
  let caminho = valor.trim()
  if (caminho === TODAS_AS_PAGINAS) return caminho
  if (!caminho.startsWith('/') || caminho.startsWith('//') || caminho.startsWith('/\\')) return null
  caminho = caminho.split(/[?#]/)[0]
  if (caminho.length > 1) caminho = caminho.replace(/\/+$/, '')
  if (!/^\/[\w\-./\[\]~%]*$/.test(caminho)) return null
  return caminho.slice(0, 200) || '/'
}

/** Lista de páginas válida: sem repetição, no máximo 40, `*` engole o resto. */
export function sanitizarPaginas(valor: unknown): string[] {
  if (!Array.isArray(valor)) return []
  const set = new Set<string>()
  for (const item of valor) {
    if (typeof item !== 'string') continue
    const caminho = normalizarCaminho(item)
    if (caminho) set.add(caminho)
  }
  if (set.has(TODAS_AS_PAGINAS)) return [TODAS_AS_PAGINAS]
  return Array.from(set).slice(0, 40)
}

/**
 * A página atual está entre as escolhidas?
 *
 * `/` só vale para a própria página inicial — como prefixo casaria com o site
 * inteiro, e quem marca "página inicial" não quer dizer "todas".
 */
export function anuncioCasaComPagina(paginas: unknown, pathname: string | null | undefined): boolean {
  if (!pathname || !Array.isArray(paginas) || paginas.length === 0) return false
  const atual = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
  return paginas.some((p) => {
    if (typeof p !== 'string') return false
    if (p === TODAS_AS_PAGINAS) return true
    if (p === '/') return atual === '/'
    return atual === p || atual.startsWith(`${p}/`)
  })
}

/**
 * Valida a mídia vinda do formulário. Devolve `undefined` para "sem mídia" e
 * `null` para mídia inválida — a rota distingue os dois para responder 400.
 */
export function sanitizarMidia(valor: unknown): AnuncioMidia | undefined | null {
  if (valor === undefined || valor === null || valor === '') return undefined
  if (typeof valor !== 'object') return null
  const m = valor as Record<string, unknown>

  const tipo = m.tipo === 'imagem' || m.tipo === 'video' ? m.tipo : null
  const url = typeof m.url === 'string' ? m.url.trim() : ''
  const largura = Math.round(Number(m.largura))
  const altura = Math.round(Number(m.altura))
  if (!tipo || !url || !isValidImageUrl(url)) return null
  if (!(largura > 0 && largura <= 10_000 && altura > 0 && altura <= 10_000)) return null

  const midia: AnuncioMidia = { tipo, url, largura, altura }

  if (tipo === 'video') {
    const poster = typeof m.posterUrl === 'string' ? m.posterUrl.trim() : ''
    if (poster) {
      if (!isValidImageUrl(poster)) return null
      midia.posterUrl = poster
    }
    const duracao = Number(m.duracao)
    if (Number.isFinite(duracao) && duracao > 0) midia.duracao = Math.round(duracao * 10) / 10
  }

  const bytes = Math.round(Number(m.bytes))
  if (Number.isFinite(bytes) && bytes > 0) midia.bytes = bytes

  return midia
}

/** A imagem que representa a mídia numa lista (a própria imagem ou o pôster). */
export function capaDaMidia(midia: AnuncioMidia | null | undefined): string {
  if (!midia) return ''
  return midia.tipo === 'imagem' ? midia.url : midia.posterUrl || ''
}

/** Todas as URLs de arquivo de uma mídia (para limpeza no Blob). */
export function urlsDaMidia(midia: AnuncioMidia | null | undefined): string[] {
  if (!midia) return []
  return [midia.url, midia.posterUrl].filter((u): u is string => !!u)
}

/** "2,4 MB", "820 KB". */
export function formatarBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}
