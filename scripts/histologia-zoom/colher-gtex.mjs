#!/usr/bin/env node
/**
 * Coleta das lâminas do GTEx (Genotype-Tissue Expression Project, NIH) para a
 * Histologia com Zoom.
 *
 * O GTEx publica lâminas inteiras de tecido humano normal (doadores pós-morte),
 * em H&E, digitalizadas a 20× (~0,5 µm/pixel) e servidas como Deep Zoom (DZI)
 * com `Access-Control-Allow-Origin: *` — o mesmo formato que o visualizador
 * lê. Aqui entram só as peças que preenchem lacunas do acervo do HistoViewer
 * (cerebelo, íleo, vagina…) ou dão a versão humana de um órgão que lá é animal
 * ou de espécie não informada.
 *
 * A seleção é manual e está em `SELECAO`: cada amostra foi escolhida pela nota
 * do patologista do GTEx ("clean specimens", "no abnormalities", "excellent
 * lymphoid patches") e conferida visualmente.
 *
 * Direitos: ver `lib/histologia-zoom/fonte.ts` (`FONTES_DO_ACERVO.gtex`).
 *
 * Uso: `node scripts/histologia-zoom/colher-gtex.mjs`
 * Saída: `data/histologia-zoom/acervo-dzi.json`
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const API = 'https://gtexportal.org/api/v2/histology/image'
const DZI = 'https://gtexportal.org/openslide/gtexhip/'
const SAIDA = path.join(process.cwd(), 'data', 'histologia-zoom', 'acervo-dzi.json')
/** Objetiva de digitalização das lâminas do GTEx (Aperio, 20×). */
const MAGN_DO_SCAN = 20

const SELECAO = [
  'GTEX-ZUA1-2926', // Cerebelo — "good Purkinje cells"
  'GTEX-1128S-2726', // Córtex cerebral
  'GTEX-145MO-3126', // Hipófise: adeno + neuro-hipófise
  'GTEX-ZQUD-1326', // Artéria tibial — sem aterose
  'GTEX-ZT9X-2126', // Nervo tibial
  'GTEX-ZYFG-2026', // Íleo terminal — placas linfoides
  'GTEX-RU1J-1426', // Vagina
  'GTEX-Y3I4-1926', // Glândula salivar menor + mucosa
  'GTEX-R55E-2026', // Medula renal (e junção corticomedular)
  'GTEX-1GMR3-0826', // Omento (tecido adiposo visceral)
  'GTEX-WEY5-0426', // Ventrículo esquerdo
  'GTEX-Y114-2526', // Músculo esquelético
  'GTEX-PSDG-0226', // Pele exposta ao sol (perna)
]

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

function niveisDzi(largura, altura, tile) {
  const maximo = Math.ceil(Math.log2(Math.max(largura, altura)))
  const niveis = []
  for (let nivel = 0; nivel <= maximo; nivel++) {
    const escala = 2 ** (maximo - nivel)
    const w = Math.ceil(largura / escala)
    const h = Math.ceil(altura / escala)
    // Níveis minúsculos não ajudam e custam requisições.
    if (w < 128 && h < 128) continue
    niveis.push({
      magn: Number(((MAGN_DO_SCAN * w) / largura).toFixed(4)),
      pasta: `${nivel}/`,
      largura: w,
      altura: h,
      tileL: tile,
      tileA: tile,
      nx: Math.ceil(w / tile),
      ny: Math.ceil(h / tile),
    })
  }
  return niveis
}

async function principal() {
  const q = SELECAO.map((id) => `tissueSampleId=${encodeURIComponent(id)}`).join('&')
  const meta = (await json(`${API}?${q}&itemsPerPage=250`)).data
  const especimes = []
  for (const id of SELECAO) {
    const m = meta.find((x) => x.tissueSampleId === id)
    if (!m) {
      console.warn(`[sem metadados] ${id}`)
      continue
    }
    const base = `${DZI}${m.subjectId}/${m.histologyImageId}`
    const xml = await texto(`${base}.dzi`)
    const atr = (nome) => Number((xml.match(new RegExp(`${nome}="(\\d+)"`)) ?? [])[1])
    const largura = atr('Width')
    const altura = atr('Height')
    const tile = atr('TileSize')
    const overlap = atr('Overlap')
    const formato = (xml.match(/Format="(\w+)"/) ?? [])[1] ?? 'jpeg'
    const niveis = niveisDzi(largura, altura, tile)
    // Miniatura: o maior nível que cabe num tile só.
    const unico = [...niveis].reverse().find((n) => n.nx === 1 && n.ny === 1) ?? niveis[0]
    especimes.push({
      fonte: 'gtex',
      formato: 'dzi',
      extensao: formato,
      sobreposicao: overlap,
      base: `${base}_files/`,
      hvId: 0,
      caixa: 'gtex',
      caixas: ['gtex'],
      curso: 'GTEx',
      nr: '',
      nome: m.tissueSiteDetail,
      texto: m.pathologyNotes ?? '',
      coloracao: 'HE',
      objetiva: '20x',
      aberturaNumerica: null,
      root: id,
      miniatura: `${base}_files/${unico.pasta}0_0.${formato}`,
      miniaturaL: unico.largura,
      miniaturaA: unico.altura,
      doador: { idade: m.ageBracket ?? null, sexo: m.sex ?? null },
      niveis,
    })
    process.stdout.write('.')
  }
  await mkdir(path.dirname(SAIDA), { recursive: true })
  await writeFile(
    SAIDA,
    JSON.stringify({ fonte: 'https://gtexportal.org', coletadoEm: new Date().toISOString().slice(0, 10), especimes }, null, 1) + '\n',
  )
  console.log(`\n${especimes.length} lâminas do GTEx gravadas em ${SAIDA}.`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
