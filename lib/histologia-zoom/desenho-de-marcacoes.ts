import type OpenSeadragon from 'openseadragon'

import type { Marca, MarcacaoNaLamina, Ponto } from './estruturas/tipos'
import { anguloNaTela, caminhoDaSeta } from './setas'

/**
 * Desenho das marcações de estrutura sobre o palco.
 *
 * Um SVG do tamanho do palco, sem eventos de ponteiro, redesenhado a cada
 * quadro do OpenSeadragon a partir das coordenadas de viewport da marcação.
 * Recalcular a cada quadro (em vez de um overlay escalado) mantém a espessura
 * da linha e o tamanho da seta constantes em qualquer zoom — a marcação nunca
 * engrossa a ponto de cobrir o que aponta.
 *
 * Estilo: contorno fino ciano com halo escuro e preenchimento quase
 * transparente (8 %) — o tecido por baixo continua legível; seta amarela com
 * borda preta, que se destaca tanto em eosina quanto em hematoxilina.
 */

const COR = '#22d3ee'
const SETA = { preenchimento: '#facc15', contorno: '#0b0b0b' }
const COMPRIMENTO_DA_SETA = 58

type Viewer = OpenSeadragon.Viewer

function paraTela(viewer: Viewer, OSD: typeof OpenSeadragon, p: Ponto, espelhado: boolean, largura: number): [number, number] {
  const px = viewer.viewport.pixelFromPoint(new OSD.Point(p[0], p[1]), true)
  return [espelhado ? largura - px.x : px.x, px.y]
}

function pontosDaElipse(m: Extract<Marca, { tipo: 'elipse' }>): Ponto[] {
  const n = 48
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2
    return [m.centro[0] + Math.cos(t) * m.raios[0], m.centro[1] + Math.sin(t) * m.raios[1]]
  })
}

const FONTE_DO_ROTULO = 'system-ui, sans-serif'
const FOLGA_DO_ROTULO = 8
const ALTURA_DA_LINHA = 15

let contextoDeMedida: CanvasRenderingContext2D | null | undefined

/** Largura do texto em px, na mesma fonte do rótulo (estimativa se não houver canvas). */
export function medirTexto(t: string): number {
  if (contextoDeMedida === undefined) {
    contextoDeMedida = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
    if (contextoDeMedida) contextoDeMedida.font = `600 12px ${FONTE_DO_ROTULO}`
  }
  return contextoDeMedida ? contextoDeMedida.measureText(t).width : t.length * 7.2
}

/** Quebra por palavras para caber em `maximo` px; palavra maior que a linha é partida. */
export function quebrarEmLinhas(texto: string, maximo: number, medir = medirTexto): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra
    if (medir(tentativa) <= maximo) {
      atual = tentativa
      continue
    }
    if (atual) linhas.push(atual)
    atual = palavra
    while (medir(atual) > maximo && atual.length > 1) {
      let corte = atual.length - 1
      while (corte > 1 && medir(atual.slice(0, corte) + '-') > maximo) corte--
      linhas.push(atual.slice(0, corte) + '-')
      atual = atual.slice(corte)
    }
  }
  if (atual) linhas.push(atual)
  return linhas.length ? linhas : ['']
}

function escaparXml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function desenharMarcacao(
  svg: SVGSVGElement,
  viewer: Viewer,
  OSD: typeof OpenSeadragon,
  marcacao: (MarcacaoNaLamina & { nome: string }) | null,
): void {
  if (!marcacao) {
    if (svg.childElementCount) svg.innerHTML = ''
    return
  }
  const largura = svg.clientWidth
  const espelhado = viewer.viewport.getFlip()
  const rotacao = viewer.viewport.getRotation(true)
  const partes: string[] = []
  let ancora: [number, number] | null = null

  for (const m of marcacao.marcas) {
    if (m.tipo === 'seta') {
      const [x, y] = paraTela(viewer, OSD, m.ponta, espelhado, largura)
      const a = anguloNaTela(m.angulo, rotacao, espelhado)
      partes.push(
        `<path d="${caminhoDaSeta(COMPRIMENTO_DA_SETA)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(1)})" fill="${SETA.preenchimento}" stroke="${SETA.contorno}" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke"/>`,
      )
      const rad = (a * Math.PI) / 180
      const cauda: [number, number] = [x - Math.cos(rad) * COMPRIMENTO_DA_SETA, y - Math.sin(rad) * COMPRIMENTO_DA_SETA]
      if (!ancora || cauda[1] < ancora[1]) ancora = cauda
      continue
    }
    const pontos = m.tipo === 'contorno' ? m.pontos : pontosDaElipse(m)
    const tela = pontos.map((p) => paraTela(viewer, OSD, p, espelhado, largura))
    const d = `M ${tela.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')} Z`
    partes.push(`<path d="${d}" fill="none" stroke="rgba(0,0,0,0.6)" stroke-width="5" stroke-linejoin="round"/>`)
    partes.push(`<path d="${d}" fill="rgba(34,211,238,0.08)" stroke="${COR}" stroke-width="2.2" stroke-linejoin="round"/>`)
    const topo = tela.reduce((a, b) => (b[1] < a[1] ? b : a))
    if (!ancora || topo[1] < ancora[1]) ancora = topo
  }

  // Sem nome, sem rótulo: no quiz a seta não pode entregar a resposta.
  if (ancora && marcacao.nome) {
    // Rótulo com quebra de linha: mede o texto real e nunca deixa as letras
    // saírem da caixa, nem a caixa sair da tela (celular incluído).
    const maximo = Math.max(120, Math.min(280, largura - 8)) - 2 * FOLGA_DO_ROTULO
    const linhas = quebrarEmLinhas(marcacao.nome, maximo)
    const w = Math.ceil(Math.max(...linhas.map(medirTexto))) + 2 * FOLGA_DO_ROTULO
    const h = linhas.length * ALTURA_DA_LINHA + 8
    const x = Math.max(4, Math.min(largura - w - 4, ancora[0] - w / 2))
    const y = Math.max(4, ancora[1] - h - 8)
    const tspans = linhas
      .map((l, i) => `<tspan x="${w / 2}" y="${(4 + ALTURA_DA_LINHA * (i + 1) - 4).toFixed(1)}">${escaparXml(l)}</tspan>`)
      .join('')
    partes.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><rect width="${w}" height="${h}" rx="6" fill="rgba(0,0,0,0.8)"/><text text-anchor="middle" font-family="${FONTE_DO_ROTULO}" font-size="12" font-weight="600" fill="#fff">${tspans}</text></g>`,
    )
  }
  svg.innerHTML = partes.join('')
}

/** Região a enquadrar: a `vista` declarada ou o envelope das marcas, com folga. */
/**
 * Quantas paradas a marcação tem ao ser percorrida: setas soltas em pontos
 * distantes (três nós de Ranvier, dois motoneurônios) são vistas uma a uma,
 * na ampliação em que a estrutura aparece; o resto é enquadrado de uma vez.
 */
export function paradasDaMarcacao(m: MarcacaoNaLamina): number {
  return m.marcas.length > 1 && m.marcas.every((k) => k.tipo === 'seta') ? m.marcas.length : 1
}

/**
 * Menor campo que o enquadramento mostra, em pixels reais da imagem. Abaixo
 * disso a tela ampliaria a imagem além da resolução do scan e a estrutura
 * apareceria borrada — acontecia nas fotomicrografias e lâminas pequenas.
 */
export const CAMPO_MINIMO_EM_PIXELS = 700

/** Garante o campo mínimo (em fração da largura da lâmina), mantendo o centro. */
function comCampoMinimo(v: [number, number, number, number], larguraDaLamina?: number): [number, number, number, number] {
  if (!larguraDaLamina) return v
  const minimo = CAMPO_MINIMO_EM_PIXELS / larguraDaLamina
  const [x0, y0, x1, y1] = v
  const lado = Math.max(x1 - x0, y1 - y0)
  if (lado >= minimo) return v
  const cx = (x0 + x1) / 2
  const cy = (y0 + y1) / 2
  const f = minimo / Math.max(lado, 1e-9)
  const mw = ((x1 - x0) * f) / 2
  const mh = ((y1 - y0) * f) / 2
  return [cx - mw, cy - mh, cx + mw, cy + mh]
}

export function vistaDaMarcacao(
  m: MarcacaoNaLamina,
  parada = 0,
  larguraDaLamina?: number,
): [number, number, number, number] {
  return comCampoMinimo(vistaBruta(m, parada), larguraDaLamina)
}

function vistaBruta(m: MarcacaoNaLamina, parada: number): [number, number, number, number] {
  const n = paradasDaMarcacao(m)
  if (n > 1) {
    const alvo = m.marcas[((parada % n) + n) % n]
    const [cx, cy] = alvo.tipo === 'seta' ? alvo.ponta : [0, 0]
    // Mesmo tamanho de campo que a vista declarada, quando houver; senão, um campo justo.
    const meia = m.vista ? Math.max(m.vista[2] - m.vista[0], m.vista[3] - m.vista[1]) / 2 : 0.006
    return [cx - meia, cy - meia, cx + meia, cy + meia]
  }
  const pts: Ponto[] = m.marcas.flatMap((k) =>
    k.tipo === 'seta' ? [k.ponta] : k.tipo === 'contorno' ? k.pontos : pontosDaElipse(k),
  )
  let x0 = Math.min(...pts.map((p) => p[0]))
  let x1 = Math.max(...pts.map((p) => p[0]))
  let y0 = Math.min(...pts.map((p) => p[1]))
  let y1 = Math.max(...pts.map((p) => p[1]))
  if (m.vista) {
    // A vista declarada define o aumento; o centro é o das próprias marcas,
    // para a estrutura nunca ficar na borda (sob a barra de ferramentas).
    const [vx0, vy0, vx1, vy1] = m.vista
    const w = vx1 - vx0
    const h = vy1 - vy0
    if (x1 - x0 <= w && y1 - y0 <= h) {
      const cx = (x0 + x1) / 2
      const cy = (y0 + y1) / 2
      return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]
    }
    return m.vista
  }
  const folga = Math.max((x1 - x0) * 0.35, (y1 - y0) * 0.35, 0.0025)
  x0 -= folga
  x1 += folga
  y0 -= folga
  y1 += folga
  return [x0, y0, x1, y1]
}
