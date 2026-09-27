import type { Qualidade, ZoomDigital } from './nitidez'
import type { CorDeSeta } from './setas'

/**
 * Ajustes de imagem e de navegação do visualizador.
 *
 * Tudo aqui é conveniência de quem está olhando — lembrado no navegador
 * (`localStorage`), nunca no servidor. Ler e gravar sempre dentro de
 * try/catch: janela anônima, armazenamento bloqueado e prévia de miniatura
 * devolvem exceção, e o visualizador tem de abrir igual.
 */

export type Luz = 'neutra' | 'halogena' | 'fria'

export interface AjustesDeImagem {
  brilho: number // %, 100 = original
  contraste: number // %
  saturacao: number // %
  matiz: number // graus
  nitidez: number // 0–100 (realce de bordas por contraste local simulado)
  cinza: boolean
  inverter: boolean
  luz: Luz
}

/**
 * O que fica fixo no centro da ocular. A retícula e a seta da ocular são
 * alternativas, como nos microscópios de verdade: uma ocular tem uma ou outra.
 */
export type Indicador = 'nenhum' | 'reticula' | 'ponteiro'

export interface AjustesDeOcular {
  ativa: boolean
  /** Diâmetro do campo, em % do menor lado do palco. */
  diametro: number
  /** Escurecimento radial dentro do campo (0–100). */
  vinheta: number
  indicador: Indicador
  /** Direção da seta da ocular, em graus (0 = apontando para a direita). */
  anguloDoPonteiro: number
  corDoPonteiro: CorDeSeta
}

export interface AjustesDeSetas {
  /** Comprimento das setas cravadas, em pixels de tela. */
  tamanho: number
  /** Cor das próximas setas. */
  cor: CorDeSeta
  /** Mostrar os rótulos junto das setas. */
  rotulos: boolean
}

export interface PreferenciasDeNavegacao {
  /** Fator de zoom por "clique" da roda (1,1 = suave, 2 = agressivo). */
  zoomPorRolagem: number
  /** Duração das animações de zoom/movimento, em segundos. */
  animacao: number
  /** Em telas de toque, fora da tela cheia: um dedo rola a página ou move a lâmina? */
  umDedo: 'pagina' | 'lamina'
  minimapa: boolean
  duploCliqueAmplia: boolean
  /** Quanto esticamento de pixel é tolerado antes de exigir o nível mais fino. */
  qualidade: Qualidade
  /** Até onde o zoom pode ir além da resolução real do scan. */
  zoomDigital: ZoomDigital
}

export interface Preferencias {
  imagem: AjustesDeImagem
  ocular: AjustesDeOcular
  setas: AjustesDeSetas
  navegacao: PreferenciasDeNavegacao
}

export const IMAGEM_ORIGINAL: AjustesDeImagem = {
  brilho: 100,
  contraste: 100,
  saturacao: 100,
  matiz: 0,
  nitidez: 0,
  cinza: false,
  inverter: false,
  luz: 'neutra',
}

export const PADRAO: Preferencias = {
  imagem: IMAGEM_ORIGINAL,
  ocular: {
    ativa: false,
    diametro: 92,
    vinheta: 35,
    indicador: 'nenhum',
    anguloDoPonteiro: 20,
    corDoPonteiro: 'preta',
  },
  setas: { tamanho: 64, cor: 'preta', rotulos: true },
  navegacao: {
    zoomPorRolagem: 1.25,
    animacao: 0.9,
    umDedo: 'pagina',
    minimapa: true,
    duploCliqueAmplia: true,
    qualidade: 'maxima',
    zoomDigital: 'padrao',
  },
}

/** Predefinições de imagem — atalhos para o que se faz no microscópio de verdade. */
export const PREDEFINICOES: Array<{ id: string; nome: string; descricao: string; imagem: Partial<AjustesDeImagem> }> = [
  { id: 'original', nome: 'Original', descricao: 'Como foi digitalizada.', imagem: IMAGEM_ORIGINAL },
  {
    id: 'nucleos',
    nome: 'Realçar núcleos',
    descricao: 'Mais contraste e saturação: hematoxilina salta do fundo.',
    imagem: { contraste: 130, saturacao: 140, brilho: 102 },
  },
  {
    id: 'desbotada',
    nome: 'Lâmina desbotada',
    descricao: 'Recupera coloração fraca de scans antigos.',
    imagem: { contraste: 145, saturacao: 170, brilho: 96 },
  },
  {
    id: 'estrutura',
    nome: 'Só estrutura',
    descricao: 'Tons de cinza com contraste: forma sem distração de cor.',
    imagem: { cinza: true, contraste: 135, saturacao: 100 },
  },
  {
    id: 'campo-escuro',
    nome: 'Campo escuro',
    descricao: 'Inverte a imagem: fibras e bordas brilham sobre fundo preto.',
    imagem: { inverter: true, contraste: 115 },
  },
  {
    id: 'halogena',
    nome: 'Lâmpada halógena',
    descricao: 'Luz quente de microscópio de bancada.',
    imagem: { luz: 'halogena', brilho: 104 },
  },
]

export function filtroCss(a: AjustesDeImagem): string {
  const partes: string[] = []
  if (a.brilho !== 100) partes.push(`brightness(${a.brilho / 100})`)
  // A "nitidez" é aproximada por contraste adicional — CSS não tem convolução, e
  // filtro SVG em elemento HTML falha no Safari. O rótulo da interface diz "realce".
  const contraste = a.contraste + a.nitidez * 0.35
  if (contraste !== 100) partes.push(`contrast(${contraste / 100})`)
  if (a.saturacao !== 100) partes.push(`saturate(${a.saturacao / 100})`)
  if (a.matiz !== 0) partes.push(`hue-rotate(${a.matiz}deg)`)
  if (a.cinza) partes.push('grayscale(1)')
  if (a.inverter) partes.push('invert(1)')
  return partes.length ? partes.join(' ') : 'none'
}

export function imagemAlterada(a: AjustesDeImagem): boolean {
  return filtroCss(a) !== 'none' || a.luz !== 'neutra'
}

/** Cor da camada de luz, aplicada com `mix-blend-mode: multiply`. */
export const COR_DA_LUZ: Record<Luz, string | null> = {
  neutra: null,
  halogena: 'rgba(255, 214, 150, 0.32)',
  fria: 'rgba(190, 215, 255, 0.28)',
}

const CHAVE = 'histologia-zoom:preferencias:v1'

export function carregarPreferencias(): Preferencias {
  try {
    const bruto = window.localStorage.getItem(CHAVE)
    if (!bruto) return PADRAO
    const salvo = JSON.parse(bruto) as Partial<Preferencias>
    const ocular = { ...PADRAO.ocular, ...(salvo.ocular ?? {}) } as AjustesDeOcular & { reticula?: boolean }
    // Formato antigo: `reticula: boolean`, antes de a seta da ocular existir.
    if (salvo.ocular && !('indicador' in salvo.ocular)) {
      ocular.indicador = ocular.reticula ? 'reticula' : 'nenhum'
    }
    delete ocular.reticula
    return {
      imagem: { ...PADRAO.imagem, ...(salvo.imagem ?? {}) },
      ocular,
      setas: { ...PADRAO.setas, ...(salvo.setas ?? {}) },
      navegacao: { ...PADRAO.navegacao, ...(salvo.navegacao ?? {}) },
    }
  } catch {
    return PADRAO
  }
}

export function salvarPreferencias(p: Preferencias): void {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    // Armazenamento indisponível: os ajustes valem só nesta visita.
  }
}

// ─── Marcadores ─────────────────────────────────────────────────────────────

export interface Marcador {
  id: string
  nome: string
  /** Centro e zoom no sistema de coordenadas do viewport do OpenSeadragon. */
  x: number
  y: number
  z: number
  criadoEm: number
}

const chaveDosMarcadores = (slug: string) => `histologia-zoom:marcadores:${slug}`

export function carregarMarcadores(slug: string): Marcador[] {
  try {
    const bruto = window.localStorage.getItem(chaveDosMarcadores(slug))
    const lista = bruto ? (JSON.parse(bruto) as Marcador[]) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

export function salvarMarcadores(slug: string, lista: Marcador[]): void {
  try {
    window.localStorage.setItem(chaveDosMarcadores(slug), JSON.stringify(lista))
  } catch {
    // idem
  }
}

// ─── Posição na URL ─────────────────────────────────────────────────────────

export interface Posicao {
  x: number
  y: number
  z: number
  r: number
}

/** `?v=x,y,z,r` — compacto o bastante para caber num QR code legível. */
export function codificarPosicao(p: Posicao): string {
  const f = (n: number, casas: number) => Number(n.toFixed(casas)).toString()
  return [f(p.x, 4), f(p.y, 4), f(p.z, 2), f(p.r, 0)].join(',')
}

export function decodificarPosicao(v: string | null): Posicao | null {
  if (!v) return null
  const partes = v.split(',').map(Number)
  if (partes.length < 3 || partes.some((n) => !Number.isFinite(n))) return null
  const [x, y, z, r = 0] = partes
  if (z <= 0) return null
  return { x, y, z, r: ((r % 360) + 360) % 360 }
}
