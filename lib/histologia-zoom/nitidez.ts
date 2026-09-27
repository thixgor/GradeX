import { niveisResolvidos } from './fonte-de-tiles'
import type { PiramideDaLamina } from './tipos'

/**
 * Nitidez: que nível da pirâmide desenhar, e o que buscar antes de precisar.
 *
 * ## O problema que isto resolve
 *
 * O OpenSeadragon decide a opacidade de cada nível pela razão entre pixels da
 * tela e pixels do nível: o nível começa a aparecer quando cada pixel dele
 * ocupa 0,5 pixel de tela e só fica totalmente opaco em 1,0
 * (`levelOpacity = (razão − 0,5) / 0,5`). Numa pirâmide de potências de 2 isso
 * é ótimo. Na do acervo, não: 181 das 184 lâminas têm saltos maiores que 2,2×
 * entre níveis, e 22 chegam a 5–6× (2× → 10×, 10× → 60×). Com a regra padrão, o
 * nível grosso era esticado até 5× antes de o fino ficar opaco — o borrão
 * que aparecia ao dar zoom.
 *
 * ## A correção
 *
 * A cada quadro, `fatorDeNitidez` acha o nível mais grosso que ainda tem
 * resolução suficiente para a tela (razão ≤ `limite`) e devolve o fator que
 * multiplica as razões de pixel da fonte de modo que esse nível fique com
 * razão aparente 1 — totalmente opaco e carregado. O nível mais grosso,
 * esticado, deixa de ser o que se vê. Só a escolha de nível muda: posição e
 * desenho dos tiles não usam essa razão.
 *
 * O custo é banda: numa transição de salto 5×, o nível fino é baixado mais
 * cedo. É a troca pedida — qualidade antes de economia —, e a preferência
 * "Economia de dados" relaxa o limite para quem precisa.
 */

export type Qualidade = 'maxima' | 'equilibrada' | 'economia'
export type ZoomDigital = 'sem-perda' | 'padrao' | 'livre'

/**
 * Esticamento máximo tolerado, em pixels de tela (reais, com densidade) por
 * pixel do nível exibido, enquanto houver nível mais fino disponível.
 */
export const LIMITE_POR_QUALIDADE: Record<Qualidade, number> = {
  maxima: 1,
  equilibrada: 1.5,
  economia: 2.2,
}

/** Quanto um nível pode ser reduzido para ser exibido no lugar de um mais grosso esticado. */
export const REDUCAO_MAXIMA = 5

/** Escala de cada nível (largura do nível ÷ largura do topo), na ordem do OpenSeadragon. */
export function escalasDosNiveis(p: PiramideDaLamina): number[] {
  const topo = p.niveis[p.niveis.length - 1]
  return niveisResolvidos(p).map((n) => n.largura / topo.largura)
}

/**
 * Fator para as razões de pixel da fonte de tiles.
 *
 * @param escalas escala de cada nível, crescente
 * @param pixelsDeTelaPorPixelDoTopo pixels físicos de tela por pixel do nível
 *   mais alto (zoom da imagem × densidade de pixels)
 * @param limite esticamento tolerado (ver `LIMITE_POR_QUALIDADE`)
 */
export function fatorDeNitidez(escalas: number[], pixelsDeTelaPorPixelDoTopo: number, limite: number): number {
  if (!escalas.length || !(pixelsDeTelaPorPixelDoTopo > 0)) return 1
  for (const escala of escalas) {
    const razao = pixelsDeTelaPorPixelDoTopo / escala
    if (razao <= limite) {
      // Leve folga (2 %) para o nível não oscilar na borda da opacidade. O teto
      // de 5 cobre os saltos de 5× do acervo (2× → 10×); acima disso — lâminas
      // com só dois níveis reais, vistas bem de longe — exigir o nível fino
      // custaria centenas de tiles para uma vista do tamanho de uma miniatura.
      return Math.min(REDUCAO_MAXIMA, Math.max(0.5, 1.02 / razao))
    }
  }
  // Além do topo: nenhum nível é suficiente, é zoom digital. Regra padrão.
  return 1
}

/** `maxZoomPixelRatio` do OpenSeadragon (pixels CSS por pixel do topo). */
export function razaoMaximaDeZoom(zoom: ZoomDigital, densidade: number): number {
  if (zoom === 'sem-perda') return 1 / Math.max(1, densidade)
  if (zoom === 'livre') return 4
  return 1
}

// ─── Pré-carga ────────────────────────────────────────────────────────────

export interface RetanguloNoTopo {
  x: number
  y: number
  largura: number
  altura: number
}

/**
 * URLs dos tiles de um nível que cobrem um retângulo (em pixels do topo), com
 * margem proporcional para pequenos deslocamentos.
 */
export function tilesDoRetangulo(
  p: PiramideDaLamina,
  indiceDoNivel: number,
  r: RetanguloNoTopo,
  margem = 0.15,
  limite = 48,
): string[] {
  const niveis = niveisResolvidos(p)
  const nivel = niveis[indiceDoNivel]
  if (!nivel) return []
  const topo = p.niveis[p.niveis.length - 1]
  const s = nivel.largura / topo.largura
  const mx = r.largura * margem
  const my = r.altura * margem
  const x0 = Math.max(0, Math.floor(((r.x - mx) * s) / nivel.tileL))
  const y0 = Math.max(0, Math.floor(((r.y - my) * s) / nivel.tileA))
  const x1 = Math.min(nivel.nx - 1, Math.floor(((r.x + r.largura + mx) * s) / nivel.tileL))
  const y1 = Math.min(nivel.ny - 1, Math.floor(((r.y + r.altura + my) * s) / nivel.tileA))
  if (x1 < x0 || y1 < y0) return []

  // Do centro para as bordas: se a fila for cortada, o que sobra é o que se vê.
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const lista: Array<[number, number, number]> = []
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) lista.push([x, y, (x - cx) ** 2 + (y - cy) ** 2])
  lista.sort((a, b) => a[2] - b[2])
  return lista.slice(0, limite).map(([x, y]) => nivel.url(x, y))
}

/** Índice do primeiro nível mais fino que o necessário para a tela agora. */
export function proximoNivel(escalas: number[], pixelsDeTelaPorPixelDoTopo: number, limite: number): number | null {
  for (let i = 0; i < escalas.length; i++) {
    if (pixelsDeTelaPorPixelDoTopo / escalas[i] <= limite) return i + 1 < escalas.length ? i + 1 : null
  }
  return null
}

/**
 * Busca tiles em segundo plano, com prioridade baixa e poucas conexões — as
 * outras ficam para o OpenSeadragon. A imagem vai para o cache HTTP do
 * navegador com o mesmo modo CORS que o visualizador usa, então o pedido
 * definitivo sai do cache.
 */
export class PreCarregador {
  private fila: string[] = []
  private emVoo = 0
  private vistos = new Set<string>()

  constructor(private readonly concorrencia = 2) {}

  agendar(urls: string[]) {
    this.fila = urls.filter((u) => !this.vistos.has(u))
    this.bombear()
  }

  cancelar() {
    this.fila = []
  }

  private bombear() {
    while (this.emVoo < this.concorrencia && this.fila.length) {
      const url = this.fila.shift()!
      if (this.vistos.has(url)) continue
      this.vistos.add(url)
      if (this.vistos.size > 6000) this.vistos.clear()
      this.emVoo++
      const img = new Image()
      img.crossOrigin = 'anonymous'
      ;(img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'low'
      img.decoding = 'async'
      const fim = () => {
        this.emVoo--
        this.bombear()
      }
      img.onload = fim
      img.onerror = fim
      img.src = url
    }
  }
}

/** Quantos tiles decodificados manter em memória, conforme o aparelho. */
export function tamanhoDoCache(): number {
  if (typeof navigator === 'undefined') return 600
  const memoria = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const toque = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  if (memoria && memoria >= 8) return toque ? 700 : 1200
  if (memoria && memoria <= 2) return 250
  return toque ? 400 : 800
}
