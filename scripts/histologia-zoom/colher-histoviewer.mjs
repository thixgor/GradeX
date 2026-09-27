#!/usr/bin/env node
/**
 * Coleta do catálogo do HistoViewer (Aarhus University) para a Histologia com Zoom.
 *
 * O que sai daqui é **só o índice**: nome, coloração, objetiva e a pirâmide de
 * tiles de cada espécime. Nenhum pixel é copiado — os tiles continuam no
 * servidor de origem, que os serve com `Access-Control-Allow-Origin: *`, e o
 * visualizador os busca de lá (ver `lib/histologia-zoom/fonte.ts`).
 *
 * ## De onde vem cada coisa
 *
 * - `ajax/getslideboxes.php` → as caixas de lâminas (cursos);
 * - `ajax/getslidebox.php?table1=<caixa>` → os espécimes de cada caixa;
 * - `index.php?table=<caixa>&mysqlid=<id>` → a página do visualizador antigo,
 *   que embute o XML da pirâmide (`<tile magn="60">…</tile>` por nível). Não há
 *   endpoint público para esse XML: ele só existe dentro do HTML.
 *
 * O mesmo espécime aparece em mais de uma caixa (Histologia I e II
 * compartilham dezenas). A chave de deduplicação é a pasta de imagens (`root`),
 * que é o que de fato identifica o scan.
 *
 * Uso: `node scripts/histologia-zoom/colher-histoviewer.mjs`
 * Saída: `data/histologia-zoom/acervo-histoviewer.json`
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const HOST = 'https://histoviewer.biomed.au.dk'
const SAIDA = path.join(process.cwd(), 'data', 'histologia-zoom', 'acervo-histoviewer.json')
/** A caixa "Obsolete scans" é escondida pelo próprio HistoViewer. */
const CAIXAS_IGNORADAS = new Set(['auold'])
const CONCORRENCIA = 6

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'DomineAqui-HistologiaZoom/1.0' } })
  if (!r.ok) throw new Error(`${r.status} em ${url}`)
  return r.json()
}

async function texto(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'DomineAqui-HistologiaZoom/1.0' } })
  if (!r.ok) throw new Error(`${r.status} em ${url}`)
  return r.text()
}

function niveisDoXml(html) {
  const m = html.match(/\$\.parseXML\("([\s\S]*?)"\);/)
  if (!m) return null
  const xml = JSON.parse(`"${m[1]}"`)
  const niveis = []
  for (const bloco of xml.matchAll(/<tile magn="([\d.]+)">([\s\S]*?)<\/tile>/g)) {
    const campo = (nome) => {
      const c = bloco[2].match(new RegExp(`<${nome}>([^<]*)</${nome}>`))
      return c ? c[1].trim() : ''
    }
    niveis.push({
      magn: Number(bloco[1]),
      pasta: campo('file'),
      largura: Number(campo('width')),
      altura: Number(campo('height')),
      tileL: Number(campo('tilewidth')),
      tileA: Number(campo('tileheight')),
      nx: Number(campo('ntilesx')),
      ny: Number(campo('ntilesy')),
    })
  }
  // Do menor para o maior: é a ordem de níveis que o OpenSeadragon espera.
  niveis.sort((a, b) => a.largura - b.largura)
  return niveis.filter((n) => n.largura > 0 && n.nx > 0 && n.ny > 0)
}

/**
 * Níveis que o gerador do HistoViewer costuma produzir, com a pasta de cada um.
 *
 * O XML embutido na página nem sempre declara a pirâmide inteira: dezenas de
 * scans enormes (até 180 mil px de largura) declaram só 40× e 60×, e o
 * visualizador antigo abria direto na objetiva forte. As pastas menores, porém,
 * existem no servidor. Sem elas, ver a lâmina inteira exigiria baixar dezenas de
 * milhares de tiles de 40× — então sondamos e completamos.
 */
const NIVEIS_CANDIDATOS = [
  [0.125, '0125x'],
  [0.25, '025x'],
  [0.5, '05x'],
  [1, '1x'],
  [2, '2x'],
  [4, '4x'],
  [5, '5x'],
  [10, '10x'],
  [20, '20x'],
]

/** Largura × altura de um JPEG, lidas do marcador SOF — sem dependência de imagem. */
function dimensoesDoJpeg(buf) {
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null
    const marcador = buf[i + 1]
    const tamanho = buf.readUInt16BE(i + 2)
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) }
    }
    i += 2 + tamanho
  }
  return null
}

async function sondarTile(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'DomineAqui-HistologiaZoom/1.0' } })
  if (!r.ok) return null
  const tipo = r.headers.get('content-type') ?? ''
  if (!tipo.includes('jpeg')) return null
  return dimensoesDoJpeg(Buffer.from(await r.arrayBuffer()))
}

async function completarPiramide(root, niveis) {
  const declarados = new Set(niveis.map((n) => n.magn))
  // A referência é o menor nível declarado: os derivados vêm dele por escala
  // linear, que é como o gerador os produziu (ver praep100, praep11…).
  const ref = niveis[0]
  const extras = []
  for (const [magn, pasta] of NIVEIS_CANDIDATOS) {
    if (magn >= ref.magn || declarados.has(magn)) continue
    const tile = await sondarTile(`${HOST}/imgsets/${root}${pasta}/tile_0.jpg`)
    if (!tile) continue
    const largura = Math.ceil((ref.largura * magn) / ref.magn)
    const altura = Math.ceil((ref.altura * magn) / ref.magn)
    extras.push({
      magn,
      pasta: `${pasta}/tile_`,
      largura,
      altura,
      tileL: tile.largura,
      tileA: tile.altura,
      nx: Math.ceil(largura / tile.largura),
      ny: Math.ceil(altura / tile.altura),
      inferido: true,
    })
  }
  return [...extras, ...niveis].sort((a, b) => a.largura - b.largura)
}

async function emLotes(itens, fn) {
  const saida = []
  let i = 0
  async function trabalhador() {
    while (i < itens.length) {
      const atual = itens[i++]
      saida.push(await fn(atual))
    }
  }
  await Promise.all(Array.from({ length: CONCORRENCIA }, trabalhador))
  return saida
}

async function principal() {
  const caixas = (await json(`${HOST}/Histo/ajax/getslideboxes.php`)).filter(
    (c) => !CAIXAS_IGNORADAS.has(c.table),
  )

  const porRoot = new Map()
  for (const caixa of caixas) {
    const especimes = await json(`${HOST}/Histo/ajax/getslidebox.php?table1=${caixa.table}`)
    for (const e of especimes) {
      if (!e.available) continue
      const existente = porRoot.get(e.root)
      if (existente) {
        if (!existente.caixas.includes(caixa.table)) existente.caixas.push(caixa.table)
        continue
      }
      porRoot.set(e.root, {
        hvId: e.id,
        caixa: caixa.table,
        caixas: [caixa.table],
        curso: caixa.course,
        nr: String(e.nr ?? '').trim(),
        nome: String(e.name ?? '').trim(),
        texto: String(e.text ?? '').trim(),
        coloracao: String(e.stain ?? '').trim(),
        objetiva: String(e.lens ?? '').trim(),
        aberturaNumerica: e.numap ? Number(e.numap) : null,
        root: e.root,
        miniatura: e.thumb,
        miniaturaL: e.thumbsizex,
        miniaturaA: e.thumbsizey,
      })
    }
  }

  const especimes = [...porRoot.values()]
  let falhas = 0
  const resultado = await emLotes(especimes, async (e) => {
    try {
      const html = await texto(
        `${HOST}/Histo/index.php?frameid=frame1&table=${e.caixa}&mysqlid=${e.hvId}`,
      )
      const declarados = niveisDoXml(html)
      if (!declarados || declarados.length === 0) throw new Error('sem pirâmide')
      const niveis = await completarPiramide(e.root, declarados)
      // O banco declara o tamanho de *exibição* da miniatura; o arquivo pode ter
      // o dobro (telas retina). O visualizador usa a miniatura como nível-base
      // da pirâmide, então precisa dos pixels reais — medidos no próprio JPEG.
      const real = await sondarTile(`${HOST}/imgsets/${e.root}${e.miniatura}`)
      if (real) {
        e.miniaturaL = real.largura
        e.miniaturaA = real.altura
      }
      process.stdout.write(niveis.length > declarados.length ? '+' : '.')
      return { ...e, niveis }
    } catch (erro) {
      falhas++
      console.warn(`\n[falha] ${e.caixa}/${e.hvId} ${e.nome}: ${erro.message}`)
      return null
    }
  })

  const validos = resultado.filter(Boolean).sort((a, b) => a.root.localeCompare(b.root))
  await mkdir(path.dirname(SAIDA), { recursive: true })
  await writeFile(
    SAIDA,
    JSON.stringify(
      {
        fonte: HOST,
        coletadoEm: new Date().toISOString().slice(0, 10),
        caixas: caixas.map((c) => ({ id: c.table, curso: c.course, origem: c.source })),
        especimes: validos,
      },
      null,
      1,
    ) + '\n',
  )
  console.log(`\n${validos.length} espécimes gravados em ${SAIDA} (${falhas} falhas).`)
}

principal().catch((erro) => {
  console.error(erro)
  process.exit(1)
})
