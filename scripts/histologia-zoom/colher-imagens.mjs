#!/usr/bin/env node
/**
 * Coleta das fotomicrografias avulsas (campo único, não lâmina inteira) que
 * preenchem lacunas do acervo: Wikimedia Commons (CC0 / CC BY / CC BY-SA) e
 * Human Protein Atlas (CC BY-SA 4.0).
 *
 * Ao contrário do HistoViewer e do GTEx, são imagens únicas de 3–14
 * megapixels. O visualizador as abre como uma pirâmide de dois níveis
 * (miniatura de 1280 px + original), então o zoom vai até o pixel real da
 * foto — e a lâmina diz ao aluno que é um campo único.
 *
 * Licenças abertas com crédito: o autor e a licença de cada imagem entram no
 * registro e aparecem na lâmina (`credito`). Exibimos sem modificação, o que
 * também cumpre o ShareAlike das CC BY-SA.
 *
 * Uso: `node scripts/histologia-zoom/colher-imagens.mjs`
 * Saída: `data/histologia-zoom/acervo-imagens.json`
 */

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const API = 'https://commons.wikimedia.org/w/api.php'
const UA = { 'User-Agent': 'DomineAqui-HistologiaZoom/1.0 (curadoria; throdrigf@gmail.com)' }
const SAIDA = path.join(process.cwd(), 'data', 'histologia-zoom', 'acervo-imagens.json')

/**
 * `magn`: ampliação aproximada da foto (da descrição do autor ou estimada pelo
 * campo), usada só no indicador de ampliação do visualizador.
 */
const SELECAO = [
  // Wikimedia Commons — Nephron (CC BY-SA 3.0), H&E. Espécie só quando a legenda
  // a escreve (prostatectomia = humana); a pineal fica "não informada".
  // `magn` é a objetiva: a legenda do Berkshire dá a ampliação total (÷10).
  { id: 'commons-pineal-baixo', arquivo: 'Pineal gland - low mag.jpg', coloracao: 'HE', magn: 4, especie: 'nao-informada' },
  { id: 'commons-pineal-alto', arquivo: 'Pineal gland - high mag.jpg', coloracao: 'HE', magn: 40, especie: 'nao-informada' },
  { id: 'commons-vesicula-seminal-baixo', arquivo: 'Seminal vesicle low mag.jpg', coloracao: 'HE', magn: 4, especie: 'humana' },
  { id: 'commons-vesicula-seminal-medio', arquivo: 'Seminal vesicle intermed mag.jpg', coloracao: 'HE', magn: 10, especie: 'humana' },
  // Wikimedia Commons — Berkshire Community College Bioscience Image Library (CC0)
  { id: 'commons-osso-compacto-100', arquivo: 'Connective Tissue Compact Bone (41068141944).jpg', coloracao: 'unstained', magn: 10, especie: 'humana' },
  { id: 'commons-osso-compacto-200', arquivo: 'Connective Tissue Compact Bone (39978304920).jpg', coloracao: 'unstained', magn: 20, especie: 'humana' },
  { id: 'commons-fibrocartilagem-40', arquivo: 'Connective Tissue Fibrocartilage (27988651538).jpg', coloracao: 'tricromico-azul', magn: 4, especie: 'nao-informada' },
  { id: 'commons-fibrocartilagem-400', arquivo: 'Connective Tissue Fibrocartilage (41140134634).jpg', coloracao: 'tricromico-azul', magn: 40, especie: 'nao-informada' },
  { id: 'commons-areolar-100', arquivo: 'Connective Tissue Loose Aerolar (41743648512).jpg', coloracao: 'distensao', magn: 10, especie: 'nao-informada' },
  { id: 'commons-areolar-200', arquivo: 'Connective Tissue Loose Aerolar (39977987580).jpg', coloracao: 'distensao', magn: 20, especie: 'nao-informada' },
  { id: 'commons-discos-intercalares', arquivo: 'Muscle Tissue Intercalated Discs in Cardiac Muscle (41931906281).jpg', coloracao: 'Iron hematoxylin', magn: 20, especie: 'nao-informada' },
  // Descartada na conferência visual: 'Olfactorisch epitheel varken…' é foto
  // macroscópica da peça, não micrografia. Confira sempre a imagem, não o título.
]

/** Human Protein Atlas: núcleos de microarranjo; anticorpo sem marcação = só hematoxilina. */
const HPA = [
  {
    id: 'hpa-hipocampo-giro-denteado',
    url: 'https://images.proteinatlas.org/48/1985_B_8_6.jpg',
    miniatura: 'https://images.proteinatlas.org/48/1985_B_8_6_medium.jpg',
    pagina: 'https://www.proteinatlas.org/ENSG00000254647-INS/tissue/hippocampus',
    coloracao: 'hematoxilina',
    magn: 20,
    especie: 'humana',
  },
]

async function json(url) {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) throw new Error(`${r.status} em ${url}`)
  return r.json()
}

function dimensoesDoJpeg(buf) {
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null
    if (buf[i + 1] === 0xff) {
      i += 1 // bytes de preenchimento entre marcadores
      continue
    }
    const m = buf[i + 1]
    const t = buf.readUInt16BE(i + 2)
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) {
      return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) }
    }
    i += 2 + t
  }
  return null
}

const limpar = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

function niveis(largura, altura, urlMiniatura, larguraMiniatura, alturaMiniatura, urlOriginal, magn) {
  const lista = []
  if (urlMiniatura && larguraMiniatura < largura) {
    lista.push({
      magn: Number(((magn * larguraMiniatura) / largura).toFixed(4)),
      pasta: urlMiniatura,
      largura: larguraMiniatura,
      altura: alturaMiniatura,
      tileL: larguraMiniatura,
      tileA: alturaMiniatura,
      nx: 1,
      ny: 1,
    })
  }
  lista.push({ magn, pasta: urlOriginal, largura, altura, tileL: largura, tileA: altura, nx: 1, ny: 1 })
  return lista
}

async function principal() {
  const especimes = []
  for (const s of SELECAO) {
    const titulo = `File:${s.arquivo}`
    const d = await json(
      `${API}?action=query&format=json&prop=imageinfo&iiprop=size|url|extmetadata&iiurlwidth=1280&titles=${encodeURIComponent(titulo)}`,
    )
    const ii = Object.values(d.query.pages)[0].imageinfo?.[0]
    if (!ii) {
      console.warn(`[sem imagem] ${titulo}`)
      continue
    }
    const md = ii.extmetadata ?? {}
    // O Commons arredonda miniaturas para tamanhos padrão (https://w.wiki/GHai):
    // pedimos 1280 e medimos o JPEG que vem de fato, sem confiar na API.
    await new Promise((ok) => setTimeout(ok, 1500))
    const rMin = await fetch(ii.thumburl, { headers: UA })
    if (!rMin.ok) throw new Error(`${rMin.status} em ${ii.thumburl}`)
    const dimMin = dimensoesDoJpeg(Buffer.from(await rMin.arrayBuffer())) ?? { largura: ii.thumbwidth, altura: ii.thumbheight }
    const larguraMin = dimMin.largura
    const alturaMin = dimMin.altura
    especimes.push({
      fonte: 'commons',
      formato: 'imagem',
      hvId: 0,
      caixa: 'commons',
      caixas: ['commons'],
      curso: 'Wikimedia Commons',
      nr: '',
      nome: s.arquivo.replace(/\.(jpg|jpeg|png)$/i, ''),
      texto: limpar(md.ImageDescription?.value).slice(0, 400),
      coloracao: s.coloracao,
      objetiva: `~${s.magn}x`,
      aberturaNumerica: null,
      root: s.id,
      miniatura: ii.thumburl,
      miniaturaL: larguraMin,
      miniaturaA: alturaMin,
      especieDeclarada: s.especie,
      credito: {
        autor: limpar(md.Artist?.value) || 'Autor não informado',
        licenca: limpar(md.LicenseShortName?.value),
        urlLicenca: md.LicenseUrl?.value ?? null,
        urlFonte: ii.descriptionurl,
        acervo: 'Wikimedia Commons',
      },
      niveis: niveis(ii.width, ii.height, ii.thumburl, larguraMin, alturaMin, ii.url, s.magn),
    })
    process.stdout.write('.')
  }

  for (const h of HPA) {
    const r = await fetch(h.url, { headers: UA })
    const dim = dimensoesDoJpeg(Buffer.from(await r.arrayBuffer()))
    const rm = await fetch(h.miniatura, { headers: UA })
    const dimMin = dimensoesDoJpeg(Buffer.from(await rm.arrayBuffer()))
    especimes.push({
      fonte: 'hpa',
      formato: 'imagem',
      hvId: 0,
      caixa: 'hpa',
      caixas: ['hpa'],
      curso: 'Human Protein Atlas',
      nr: '',
      nome: 'Hippocampus (tissue microarray core)',
      texto: 'Núcleo de microarranjo de tecido humano normal; anticorpo sem marcação neste tecido — só a contracoloração de hematoxilina.',
      coloracao: h.coloracao,
      objetiva: `~${h.magn}x`,
      aberturaNumerica: null,
      root: h.id,
      miniatura: h.miniatura,
      miniaturaL: dimMin.largura,
      miniaturaA: dimMin.altura,
      especieDeclarada: h.especie,
      credito: {
        autor: 'Human Protein Atlas',
        licenca: 'CC BY-SA 4.0',
        urlLicenca: 'https://creativecommons.org/licenses/by-sa/4.0/',
        urlFonte: h.pagina,
        acervo: 'Human Protein Atlas (proteinatlas.org)',
      },
      niveis: niveis(dim.largura, dim.altura, h.miniatura, dimMin.largura, dimMin.altura, h.url, h.magn),
    })
    process.stdout.write('.')
  }

  await mkdir(path.dirname(SAIDA), { recursive: true })
  await writeFile(SAIDA, JSON.stringify({ coletadoEm: new Date().toISOString().slice(0, 10), especimes }, null, 1) + '\n')
  console.log(`\n${especimes.length} imagens gravadas em ${SAIDA}.`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
