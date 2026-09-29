import type OpenSeadragon from 'openseadragon'

import type { PiramideDaLamina } from './tipos'

type OSD = typeof OpenSeadragon

interface NivelResolvido {
  largura: number
  altura: number
  tileL: number
  tileA: number
  nx: number
  ny: number
  url: (x: number, y: number) => string
}

/**
 * Tolerância para aceitar a miniatura como nível-base. Algumas miniaturas do
 * acervo foram recortadas de outra forma que o scan; com proporção diferente,
 * ela apareceria deslocada sob os tiles.
 */
const TOLERANCIA_DE_PROPORCAO = 0.03

/**
 * Níveis da pirâmide na ordem do OpenSeadragon (do menor para o maior).
 *
 * ## Por que a pirâmide não é uma DZI comum
 *
 * O HistoViewer não usa potências de 2: os níveis são 0,125×, 0,25×… 10×, 20×,
 * 40×, 60×, com tamanho de tile próprio por nível (50 a 400 px) e o conteúdo
 * ancorado no canto superior esquerdo de um grid com padding preto. Três
 * decisões tornam isso correto sem esticar nada:
 *
 * 1. `getLevelScale` é a largura *real* do nível sobre a do topo — assim a
 *    dimensão escalada que o OpenSeadragon calcula coincide com o conteúdo.
 * 2. `getTileWidth/Height` por nível.
 * 3. O `getTileBounds` padrão já recorta o tile de borda na dimensão escalada
 *    e usa só a parte útil da imagem como origem (`isSource`). O padding preto
 *    nunca é desenhado, e nada é deformado.
 *
 * A miniatura entra como nível 0 (um único tile): a lâmina inteira aparece
 * instantaneamente, antes de qualquer tile, inclusive nos scans enormes cujo
 * menor nível ainda exigiria dezenas de requisições.
 */
export function niveisResolvidos(p: PiramideDaLamina): NivelResolvido[] {
  const topo = p.niveis[p.niveis.length - 1]
  const lista: NivelResolvido[] = []

  const m = p.miniatura
  const menor = p.niveis[0]
  const dzi = p.formato === 'dzi'
  const imagem = p.formato === 'imagem'
  const aperio = p.formato === 'aperio'
  const proporcaoOk =
    !dzi &&
    !imagem &&
    !aperio &&
    m.largura > 0 &&
    m.altura > 0 &&
    Math.abs(m.largura / m.altura / (topo.largura / topo.altura) - 1) < TOLERANCIA_DE_PROPORCAO
  if (proporcaoOk && m.largura < menor.largura) {
    lista.push({
      largura: m.largura,
      altura: Math.round((topo.altura * m.largura) / topo.largura),
      tileL: m.largura,
      tileA: m.altura,
      nx: 1,
      ny: 1,
      url: () => m.url,
    })
  }

  for (const n of p.niveis) {
    lista.push({
      largura: n.largura,
      altura: n.altura,
      tileL: n.tileL,
      tileA: n.tileA,
      nx: n.nx,
      ny: n.ny,
      url: imagem
        ? () => n.pasta
        : aperio
        ? // ImageServer da Aperio: <svs>?<esq>+<topo>+<larg>+<alt>+<redução>+<qualidade>, com
          // esquerda/topo em pixels do nível. O tile de borda volta com fundo branco
          // até o tamanho pedido; o getTileBounds do OpenSeadragon usa só a parte útil.
          (x, y) => `${p.base}?${x * n.tileL}+${y * n.tileA}+${n.tileL}+${n.tileA}+${n.reducao ?? 1}+90`
        : dzi
        ? (x, y) => `${p.base}${n.pasta}${x}_${y}.${p.extensao ?? 'jpeg'}`
        : (x, y) => `${p.base}${n.pasta}${y * n.nx + x}.jpg`,
    })
  }
  return lista
}

/**
 * Ajuste mutável lido pela fonte a cada quadro. O visualizador atualiza
 * `fator` conforme o zoom (ver `lib/histologia-zoom/nitidez.ts`) sem recriar a
 * fonte nem reabrir a lâmina.
 */
export interface AjusteDeNitidez {
  fator: number
}

export function criarFonteDeTiles(
  OSD: OSD,
  p: PiramideDaLamina,
  ajuste: AjusteDeNitidez = { fator: 1 },
): OpenSeadragon.TileSource {
  const topo = p.niveis[p.niveis.length - 1]
  const niveis = niveisResolvidos(p)

  const opcoes = {
    width: topo.largura,
    height: topo.altura,
    tileSize: 256,
    // DZI: cada tile traz 1 px dos vizinhos; o getTileBounds padrão do
    // OpenSeadragon já desconta isso (é assim que ele lê qualquer DZI).
    tileOverlap: p.sobreposicao ?? 0,
    minLevel: 0,
    maxLevel: niveis.length - 1,
    getLevelScale(level: number) {
      const n = niveis[level]
      return n ? n.largura / topo.largura : 0
    },
    getNumTiles(level: number) {
      const n = niveis[level]
      return new OSD.Point(n?.nx ?? 0, n?.ny ?? 0)
    },
    getTileWidth(level: number) {
      return niveis[level]?.tileL ?? 256
    },
    getTileHeight(level: number) {
      return niveis[level]?.tileA ?? 256
    },
    getTileUrl(level: number, x: number, y: number) {
      return niveis[level].url(x, y)
    },
    // Só a escolha de nível usa esta razão no OpenSeadragon (opacidade e
    // prioridade de carga); posição e desenho dos tiles vêm de getTileBounds.
    getPixelRatio(this: OpenSeadragon.TileSource, level: number) {
      const base = OSD.TileSource.prototype.getPixelRatio.call(this, level) as unknown as OpenSeadragon.Point
      return new OSD.Point(base.x * ajuste.fator, base.y * ajuste.fator)
    },
    tileExists(level: number, x: number, y: number) {
      const n = niveis[level]
      return !!n && x >= 0 && y >= 0 && x < n.nx && y < n.ny
    },
  }

  // O construtor aceita um objeto e o mescla na instância (`$.extend(true, this, options)`),
  // então os métodos acima substituem os do protótipo só nesta fonte.
  return new OSD.TileSource(opcoes as unknown as OpenSeadragon.TileSourceOptions)
}
