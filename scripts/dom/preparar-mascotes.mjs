#!/usr/bin/env node
/**
 * Prepara os desenhos do Dom (e a marca DomineAqui AI) para o site.
 *
 *   node scripts/dom/preparar-mascotes.mjs
 *
 * Os originais em `img/dom/` saíram de um vetorizador: um `<g>` por cor, cada
 * um com UM `<path>` que junta todas as ilhas daquela cor, coordenadas com
 * duas casas e nenhuma noção de "olho", "cauda" ou "celular". São 2,4 MB.
 *
 * O que este script faz, sem dependência nenhuma:
 *
 * 1. **Enxuga.** Coordenada inteira (o desenho tem 1254 unidades e aparece com
 *    no máximo ~420 px: o erro fica abaixo de meio pixel), comandos relativos
 *    (números curtos), sem os `<g>` vazios, sem `opacity="1.00"`, sem as ilhas
 *    de menos de alguns pixels quadrados (ruído do vetorizador).
 * 2. **Separa em partes.** Cada ilha (sub-caminho que começa num `M`) vai para
 *    a parte cujo polígono contém o centro da sua caixa — a cauda e o braço do
 *    celular viram camadas próprias, que o componente anima como `div`s
 *    compostas pela GPU (girar a cauda não redesenha as outras 500 formas).
 *    Ilhas de uma mesma cor e mesma parte continuam no mesmo `<path>`, então
 *    os furos (que dependem do sentido do traço dentro do mesmo elemento)
 *    seguem funcionando.
 *
 * Saída em `public/dom/v1/`: um SVG por desenho com `<g data-parte="…">`. O
 * componente (`components/dom/dom-mascote.tsx`) baixa o arquivo uma vez e
 * põe cada parte no seu próprio `<svg>`. Mudou o desenho? Gere numa pasta
 * `v2/` — o cache de `/dom/*` é imutável.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ORIGEM = join(RAIZ, 'img', 'dom')
const DESTINO = join(RAIZ, 'public', 'dom', 'v1')

/**
 * Partes de cada desenho (coordenadas do viewBox original). A ordem é a ordem
 * de pintura: o que vem antes fica atrás. `resto` recebe o que não caiu em
 * polígono nenhum.
 */
const DESENHOS = [
  {
    entrada: 'dom.svg',
    saida: 'dom.svg',
    viewBox: [150, 0, 954, 1254],
    areaMinima: 6,
    partes: [
      // A cauda sai por trás da perna esquerda (do observador).
      { nome: 'cauda', poligono: [[205, 925], [345, 925], [360, 968], [425, 968], [430, 1065], [395, 1130], [205, 1130]] },
      { nome: 'resto' },
      // Mão e celular (o tablet escuro). O punho listrado fica no corpo.
      { nome: 'celular', poligono: [[880, 600], [1090, 600], [1090, 760], [1010, 935], [860, 950], [770, 930]] },
    ],
  },
  {
    entrada: 'dom-socrates.svg',
    saida: 'dom-socrates.svg',
    viewBox: [150, 0, 954, 1254],
    areaMinima: 8,
    opacidadeMinima: 0.2,
    partes: [
      // Só a cauda: o manto vermelho passa por trás do celular de bronze e
      // não se deixa separar dele sem buraco.
      { nome: 'cauda', poligono: [[205, 925], [330, 925], [345, 1000], [420, 1000], [425, 1070], [390, 1135], [205, 1135]] },
      { nome: 'resto' },
    ],
  },
  {
    entrada: 'domineaqui-ai.svg',
    saida: 'domineaqui-ai.svg',
    viewBox: [298, 312, 905, 350],
    areaMinima: 3,
    partes: [
      // O selo hexagonal (com a cruz e a rede) separado do letreiro, para o
      // componente poder animar um sem o outro.
      { nome: 'selo', poligono: [[290, 320], [640, 320], [640, 720], [290, 720]] },
      { nome: 'resto' },
    ],
  },
]

// ── leitura ────────────────────────────────────────────────────────────────

function lerCamadas(svg) {
  const camadas = []
  const re = /<path\s+fill="(#[0-9a-fA-F]{6})"(?:\s+opacity="([\d.]+)")?\s+d="([^"]+)"/g
  let m
  while ((m = re.exec(svg))) camadas.push({ cor: m[1].toLowerCase(), opacidade: m[2] ? Number(m[2]) : 1, d: m[3] })
  return camadas
}

/** `M x y C … Z M …` → lista de ilhas, cada uma uma lista de comandos absolutos. */
function ilhasDe(d) {
  const tokens = d.match(/[MCLZ]|-?\d*\.?\d+(?:e-?\d+)?/g) || []
  const ilhas = []
  let atual = null
  let cmd = null
  for (let i = 0; i < tokens.length; ) {
    const t = tokens[i]
    if (/[MCLZ]/.test(t)) {
      cmd = t
      i++
      if (cmd === 'Z') {
        atual?.push({ c: 'Z', p: [] })
        continue
      }
      if (cmd === 'M') {
        atual = []
        ilhas.push(atual)
      }
    }
    const n = cmd === 'C' ? 6 : 2
    const p = tokens.slice(i, i + n).map(Number)
    i += n
    if (p.length < n || p.some((x) => Number.isNaN(x))) break
    atual.push({ c: cmd, p })
    if (cmd === 'M') cmd = 'L' // pares soltos depois de M são L
  }
  return ilhas
}

function caixa(ilha) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const { p } of ilha) {
    for (let k = 0; k < p.length; k += 2) {
      if (p[k] < x0) x0 = p[k]
      if (p[k] > x1) x1 = p[k]
      if (p[k + 1] < y0) y0 = p[k + 1]
      if (p[k + 1] > y1) y1 = p[k + 1]
    }
  }
  return { x0, y0, x1, y1, area: (x1 - x0) * (y1 - y0), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

function dentro([x, y], poligono) {
  let sim = false
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i]
    const [xj, yj] = poligono[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) sim = !sim
  }
  return sim
}

/**
 * A ilha pertence à parte quando o centro cai no polígono E a caixa inteira
 * cabe na caixa do polígono (com folga). Sem a segunda condição, a ilha preta
 * da jaqueta — uma só, do ombro à barra — ia junto com o celular.
 */
function cabe(bb, poligono, folga = 18) {
  if (!dentro([bb.cx, bb.cy], poligono)) return false
  const xs = poligono.map((p) => p[0])
  const ys = poligono.map((p) => p[1])
  return (
    bb.x0 >= Math.min(...xs) - folga &&
    bb.x1 <= Math.max(...xs) + folga &&
    bb.y0 >= Math.min(...ys) - folga &&
    bb.y1 <= Math.max(...ys) + folga
  )
}

// ── escrita ────────────────────────────────────────────────────────────────

/** Ilha em comandos relativos com inteiros (deltas dos pontos já arredondados: sem deriva). */
function escrever(ilha) {
  let out = ''
  let px = 0, py = 0
  let ultimo = ''
  const num = (v) => String(v)
  const junta = (lista) => lista.map(num).join(' ').replace(/ -/g, '-')
  for (const { c, p } of ilha) {
    if (c === 'Z') {
      out += 'z'
      ultimo = 'z'
      continue
    }
    const r = p.map(Math.round)
    if (c === 'M') {
      out += 'M' + junta(r)
      px = r[0]
      py = r[1]
      ultimo = 'M'
      continue
    }
    if (c === 'L') {
      const dx = r[0] - px, dy = r[1] - py
      if (dx === 0 && dy === 0) continue
      const corpo = junta([dx, dy])
      out += (ultimo === 'l' ? (corpo.startsWith('-') ? '' : ' ') : 'l') + corpo
      px = r[0]
      py = r[1]
      ultimo = 'l'
      continue
    }
    // C
    const rel = [r[0] - px, r[1] - py, r[2] - px, r[3] - py, r[4] - px, r[5] - py]
    if (rel.every((v) => v === 0)) continue
    const corpo = junta(rel)
    out += (ultimo === 'c' ? (corpo.startsWith('-') ? '' : ' ') : 'c') + corpo
    px = r[4]
    py = r[5]
    ultimo = 'c'
  }
  return out
}

function processar(desenho) {
  const svg = readFileSync(join(ORIGEM, desenho.entrada), 'utf8')
  const camadas = lerCamadas(svg)
  const porParte = new Map(desenho.partes.map((p) => [p.nome, []]))
  let ilhasTotal = 0
  let ilhasDescartadas = 0

  for (const camada of camadas) {
    if (camada.opacidade < (desenho.opacidadeMinima ?? 0)) continue
    const grupos = new Map()
    for (const ilha of ilhasDe(camada.d)) {
      ilhasTotal++
      const bb = caixa(ilha)
      if (bb.area < desenho.areaMinima) {
        ilhasDescartadas++
        continue
      }
      const parte = desenho.partes.find((p) => p.poligono && cabe(bb, p.poligono))?.nome || 'resto'
      if (!grupos.has(parte)) grupos.set(parte, [])
      grupos.get(parte).push(escrever(ilha))
    }
    for (const [parte, ds] of grupos) {
      const op = camada.opacidade < 0.995 ? ` opacity="${camada.opacidade.toFixed(2).replace(/0$/, '')}"` : ''
      porParte.get(parte).push(`<path fill="${camada.cor}"${op} d="${ds.join('')}"/>`)
    }
  }

  const [x, y, w, h] = desenho.viewBox
  const corpo = desenho.partes
    .map((p) => `<g data-parte="${p.nome}">${porParte.get(p.nome).join('')}</g>`)
    .join('\n')
  const saida = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">\n${corpo}\n</svg>\n`
  mkdirSync(DESTINO, { recursive: true })
  writeFileSync(join(DESTINO, desenho.saida), saida)
  const resumo = desenho.partes.map((p) => `${p.nome}: ${porParte.get(p.nome).length}`).join(', ')
  console.log(
    `${desenho.saida}: ${(svg.length / 1024).toFixed(0)} KB → ${(saida.length / 1024).toFixed(0)} KB · ` +
      `${ilhasTotal - ilhasDescartadas}/${ilhasTotal} ilhas · ${resumo}`,
  )
}

for (const desenho of DESENHOS) processar(desenho)

// Rostinho do Dom (avatar das respostas): recorte da cabeça em WebP pequeno.
// Imagem fora do next/image vai no tamanho em que aparece (CLAUDE.md).
try {
  const { default: sharp } = await import('sharp')
  const svg = readFileSync(join(DESTINO, 'dom.svg'), 'utf8').replace(/viewBox="[^"]+"/, 'viewBox="300 40 640 640"')
  await sharp(Buffer.from(svg), { density: 30 }).resize(128, 128).webp({ quality: 82 }).toFile(join(DESTINO, 'dom-rosto.webp'))
  console.log('dom-rosto.webp: 128 px')
  // Prévia do corpo inteiro: aparece na hora enquanto o SVG (~60 KB comprimido)
  // baixa e é montado em camadas. 2× o maior tamanho comum do mascote.
  const inteiro = readFileSync(join(DESTINO, 'dom.svg'), 'utf8')
  await sharp(Buffer.from(inteiro), { density: 40 }).resize(240).webp({ quality: 60, alphaQuality: 70, effort: 6 }).toFile(join(DESTINO, 'dom-previa.webp'))
  console.log('dom-previa.webp: 240 px')
} catch (erro) {
  console.warn('dom-rosto.webp não gerado (sharp indisponível):', erro instanceof Error ? erro.message : erro)
}
