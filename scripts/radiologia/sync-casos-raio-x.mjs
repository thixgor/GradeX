#!/usr/bin/env node

/**
 * Espelha os sprites autorizados da galeria de tórax do Radiology Masterclass.
 *
 * Cada arquivo contém duas metades de igual largura: filme limpo à esquerda e
 * filme anotado à direita. O aplicativo mantém o sprite intacto e escolhe a
 * metade com `background-position`, preservando pixel a pixel o material
 * autorizado e evitando dois downloads por caso.
 *
 * Uso:
 *   node scripts/radiologia/sync-casos-raio-x.mjs --download
 *   node scripts/radiologia/sync-casos-raio-x.mjs --verify
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUTPUT = join(ROOT, 'public', 'img', 'radiologia', 'casos-raio-x', 'v1')
const MANIFEST = join(ROOT, 'data', 'radiologia', 'casos-raio-x-assets.json')
const BASE = 'https://www.radiologymasterclass.co.uk'

export const PAGINAS = [
  // Doenças cardiovasculares
  ['cardiovascular', 'cardiomegalia', '/gallery/chest/cardiac_disease/cardiomegaly'],
  ['cardiovascular', 'redistribuicao-vascular', '/gallery/chest/cardiac_disease/upper_zone_prominence'],
  ['cardiovascular', 'edema-intersticial', '/gallery/chest/cardiac_disease/kerley_b_lines'],
  ['cardiovascular', 'edema-alveolar', '/gallery/chest/cardiac_disease/pulmonary_oedema'],
  ['cardiovascular', 'derrame-pleural', '/gallery/chest/cardiac_disease/pleural_effusion'],
  ['cardiovascular', 'derrame-pericardico', '/gallery/chest/cardiac_disease/pericardial_effusion'],
  ['cardiovascular', 'calcificacoes-cardiacas', '/gallery/chest/cardiac_disease/cardiac_calcification'],
  ['cardiovascular', 'cardiopatias-congenitas', '/gallery/chest/cardiac_disease/congenital_heart_disease'],
  ['cardiovascular', 'marcapassos', '/gallery/chest/cardiac_disease/pacemakers'],
  ['cardiovascular', 'artefatos-cirurgia-cardiaca', '/gallery/chest/cardiac_disease/surgical_artifacts'],
  ['cardiovascular', 'outros-artefatos-cardiacos', '/gallery/chest/cardiac_disease/artifacts'],

  // Variantes anatômicas
  ['variantes', 'dextrocardia', '/gallery/chest/variants/dextocardia_x-ray'],
  ['variantes', 'arco-aortico-direito', '/gallery/chest/variants/right_aortic_arch'],
  ['variantes', 'fissura-azigos', '/gallery/chest/variants/azygos_fissure_x-ray'],
  ['variantes', 'fissura-acessoria', '/gallery/chest/variants/accessory_fissure'],
  ['variantes', 'costela-cervical', '/gallery/chest/variants/cervical_rib'],
  ['variantes', 'variantes-costais', '/gallery/chest/variants/bifid_rib'],
  ['variantes', 'calcificacao-costocondral', '/gallery/chest/variants/costochondral_calcification'],
  ['variantes', 'pectus-excavatum', '/gallery/chest/variants/pectus_excavatum'],
  ['variantes', 'escoliose', '/gallery/chest/variants/scoliosis'],

  // Vias aéreas e colapso
  ['vias-aereas', 'fibrose-pos-radioterapia', '/gallery/chest/airways/airways_b'],
  ['vias-aereas', 'pneumonectomia', '/gallery/chest/airways/airways_c'],
  ['vias-aereas', 'grande-derrame-pleural', '/gallery/chest/airways/airways_d'],
  ['vias-aereas', 'derrame-e-colapso', '/gallery/chest/airways/airways_e'],
  ['vias-aereas', 'colapso-lobo-inferior-direito', '/gallery/chest/airways/airways_g'],
  ['vias-aereas', 'colapso-lobo-inferior-esquerdo', '/gallery/chest/airways/airways_h'],
  ['vias-aereas', 'colapso-lobo-superior-direito', '/gallery/chest/airways/airways_i'],
  ['vias-aereas', 'paralisia-frenica', '/gallery/chest/airways/airways_j'],
  ['vias-aereas', 'colapso-lobo-superior-esquerdo', '/gallery/chest/airways/airways_k'],

  // Dispositivos e artefatos
  ['dispositivos', 'pneumocistose-e-piercing', '/gallery/chest/chestdev/chestdev_b'],
  ['dispositivos', 'cateter-jugular-tunelizado', '/gallery/chest/chestdev/chestdev_c'],
  ['dispositivos', 'port-a-cath', '/gallery/chest/chestdev/chestdev_d'],
  ['dispositivos', 'cateter-tunelizado', '/gallery/chest/chestdev/chestdev_e'],
  ['dispositivos', 'stent-esofagico', '/gallery/chest/chestdev/chestdev_f'],
  ['dispositivos', 'tubo-endotraqueal-mal-posicionado', '/gallery/chest/chestdev/chestdev_g'],
  ['dispositivos', 'artefatos-de-cirurgia-cardiaca', '/gallery/chest/chestdev/chestdev_h'],
  ['dispositivos', 'protese-valvar-mitral', '/gallery/chest/chestdev/chestdev_i'],
  ['dispositivos', 'marcapasso-ocultando-massa', '/gallery/chest/chestdev/chestdev_j'],
  ['dispositivos', 'marcapasso-com-massa-pulmonar', '/gallery/chest/chestdev/chestdev_k'],
  ['dispositivos', 'eletrodo-de-marcapasso-fraturado', '/gallery/chest/chestdev/chestdev_l'],

  // Pneumotórax
  ['pneumotorax', 'pneumotorax-hipertensivo', '/gallery/chest/pneumothorax/pneumothorax_b'],
  ['pneumotorax', 'tamanho-do-pneumotorax', '/gallery/chest/pneumothorax/pneumothorax_c'],
  ['pneumotorax', 'pneumotorax-sutil', '/gallery/chest/pneumothorax/pneumothorax_d'],
  ['pneumotorax', 'grande-pneumotorax-tensao-inicial', '/gallery/chest/pneumothorax/pneumothorax_e'],
  ['pneumotorax', 'dreno-toracico', '/gallery/chest/pneumothorax/pneumothorax_f'],
  ['pneumotorax', 'enfisema-subcutaneo', '/gallery/chest/pneumothorax/pneumothorax_g'],
  ['pneumotorax', 'pneumotorax-iatrogenico', '/gallery/chest/pneumothorax/pneumothorax_h'],
  ['pneumotorax', 'pneumotorax-bilateral-na-dpoc', '/gallery/chest/pneumothorax/pneumothorax_j'],
  ['pneumotorax', 'pseudopneumotorax-bolha', '/gallery/chest/pneumothorax/pneumothorax_l'],

  // Câncer de pulmão
  ['cancer-pulmao', 'massa-versus-consolidacao', '/gallery/chest/lung_cancer/mass_consolidation'],
  ['cancer-pulmao', 'massa-hilar-e-derrame', '/gallery/chest/lung_cancer/hilar_mass'],
  ['cancer-pulmao', 'massa-cavitada', '/gallery/chest/lung_cancer/cavitated_lung_mass'],
  ['cancer-pulmao', 'colapso-lobar-sinal-s-dourado', '/gallery/chest/lung_cancer/lobar_collapse'],
  ['cancer-pulmao', 'paralisia-do-nervo-frenico', '/gallery/chest/lung_cancer/phrenic_nerve_palsy'],
  ['cancer-pulmao', 'destruicao-ossea', '/gallery/chest/lung_cancer/bone_disease'],
  ['cancer-pulmao', 'resposta-a-radioterapia', '/gallery/chest/lung_cancer/lung_cancer_radiotherapy'],
  ['cancer-pulmao', 'progressao-da-doenca', '/gallery/chest/lung_cancer/lung_cancer_progression'],
  ['cancer-pulmao', 'metastases-do-pulmao', '/gallery/chest/lung_cancer/lung_cancer_mets'],
  ['cancer-pulmao', 'metastases-para-o-pulmao', '/gallery/chest/lung_cancer/lung_cancer_metastases'],
  ['cancer-pulmao', 'armadilha-massa-retrocardiaca', '/gallery/chest/lung_cancer/lung_cancer_xray_pitfall_1'],
  ['cancer-pulmao', 'armadilha-massa-subdiafragmatica', '/gallery/chest/lung_cancer/lung_cancer_xray_pitfall_2'],

  // Mediastino e hilos
  ['mediastino', 'massa-mediastinal-anterior', '/gallery/chest/mediastinum_hilum/anterior_mediastinum'],
  ['mediastino', 'massa-mediastinal-superior', '/gallery/chest/mediastinum_hilum/mediastinal_mass'],
  ['mediastino', 'massa-mediastinal-posterior', '/gallery/chest/mediastinum_hilum/retrocardiac_mass'],
  ['mediastino', 'aumento-hilar-unilateral', '/gallery/chest/mediastinum_hilum/unilateral_hilar_enlargement'],
  ['mediastino', 'aumento-hilar-bilateral', '/gallery/chest/mediastinum_hilum/bilateral_hilar_enlargement'],
  ['mediastino', 'fibrose-pos-radioterapia-mediastinal', '/gallery/chest/mediastinum_hilum/radiation_fibrosis'],
  ['mediastino', 'aumento-da-aorta', '/gallery/chest/mediastinum_hilum/thoracic_aneurysm'],
  ['mediastino', 'desenrolamento-da-aorta', '/gallery/chest/mediastinum_hilum/unfolded_aorta'],
  ['mediastino', 'coarctacao-da-aorta', '/gallery/chest/mediastinum_hilum/coarctation'],
  ['mediastino', 'hernia-hiatal', '/gallery/chest/mediastinum_hilum/hiatus_hernia'],
  ['mediastino', 'pneumomediastino', '/gallery/chest/mediastinum_hilum/pneumomediastinum'],
]

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')
const limparUrl = (valor) => valor.replaceAll('&amp;', '&').replace(/^['"]|['"]$/g, '')

function imagensDaPagina(html) {
  const mapa = new Map()
  const regra = /a\.imageswap_(\d+)\s*\{[^}]*?background-image\s*:\s*url\(([^)]+)\)/gis
  for (const match of html.matchAll(regra)) mapa.set(Number(match[1]), limparUrl(match[2]))
  return [...mapa.entries()].sort(([a], [b]) => a - b).map(([, url]) => new URL(url, BASE).href)
}

function dimensoes(buffer) {
  // JPEG: percorre segmentos até um marcador SOF. PNG também é aceito por
  // segurança, embora o acervo atual use JPEG.
  if (buffer.subarray(1, 4).toString('ascii') === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('Formato de imagem não reconhecido')
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue }
    const marker = buffer[offset + 1]
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    const length = buffer.readUInt16BE(offset + 2)
    offset += 2 + length
  }
  throw new Error('Dimensões JPEG não encontradas')
}

async function baixar(url) {
  const resposta = await fetch(url, { headers: { 'user-agent': 'GradeX educational asset mirror (authorized)' } })
  if (!resposta.ok) throw new Error(`${resposta.status} ao baixar ${url}`)
  return Buffer.from(await resposta.arrayBuffer())
}

async function sincronizar() {
  const manifest = { version: 1, generatedAt: new Date().toISOString(), pages: [] }
  for (const [category, slug, path] of PAGINAS) {
    const sourcePage = new URL(path, BASE).href
    const html = (await baixar(sourcePage)).toString('utf8')
    const urls = imagensDaPagina(html)
    if (!urls.length) throw new Error(`Nenhum sprite encontrado em ${sourcePage}`)
    const images = []
    for (const [index, url] of urls.entries()) {
      const bytes = await baixar(url)
      const { width, height } = dimensoes(bytes)
      if (width % 2 !== 0) throw new Error(`Sprite sem duas metades iguais: ${url} (${width}px)`)
      const suffix = extname(new URL(url).pathname) || '.jpg'
      const filename = `${String(index + 1).padStart(2, '0')}-${basename(new URL(url).pathname, suffix)
        .toLowerCase().replace(/[^a-z0-9]+/g, '-')}${suffix.toLowerCase()}`
      const output = join(OUTPUT, category, slug, filename)
      await mkdir(dirname(output), { recursive: true })
      await writeFile(output, bytes)
      images.push({
        index: index + 1,
        file: `/${relative(join(ROOT, 'public'), output).replaceAll('\\', '/')}`,
        sourceUrl: url,
        spriteWidth: width,
        frameWidth: width / 2,
        height,
        bytes: bytes.length,
        sha256: sha256(bytes),
      })
    }
    manifest.pages.push({ category, slug, sourcePage, images })
    console.log(`${category}/${slug}: ${images.length} imagem(ns)`)
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`Manifesto: ${relative(ROOT, MANIFEST)} (${manifest.pages.reduce((n, p) => n + p.images.length, 0)} imagens)`)
}

async function verificar() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
  let total = 0
  for (const page of manifest.pages) {
    for (const image of page.images) {
      const arquivo = join(ROOT, 'public', image.file.replace(/^\//, '').replaceAll('/', '\\'))
      const info = await stat(arquivo)
      const bytes = await readFile(arquivo)
      if (info.size !== image.bytes || sha256(bytes) !== image.sha256) throw new Error(`Falha de integridade: ${image.file}`)
      const { width, height } = dimensoes(bytes)
      if (width !== image.spriteWidth || height !== image.height || width / 2 !== image.frameWidth) throw new Error(`Dimensões divergentes: ${image.file}`)
      total += 1
    }
  }
  console.log(`${total} sprites íntegros; arquivos locais conferem com o manifesto.`)
}

const mode = process.argv[2]
if (mode === '--download') await sincronizar()
else if (mode === '--verify') await verificar()
else throw new Error('Use --download ou --verify')
