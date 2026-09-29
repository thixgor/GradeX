#!/usr/bin/env node
/**
 * Coleta o índice do Virtual Pathology Slide Library (University of Leeds).
 *
 * Uso: node scripts/histopatologia-zoom/colher-leeds.mjs [--sem-cache]
 *
 * Percorre a busca avançada por sistema de órgão, só H&E, e grava em
 * `data/histopatologia-zoom/acervo-leeds.json` um registro por caso:
 * sexo/idade, dados clínicos, diagnóstico, comentário e as lâminas (caminho
 * no servidor de imagens). Os tiles não são baixados — o visualizador lê
 * direto de images.virtualpathology.leeds.ac.uk (CORS `*`).
 *
 * As dimensões de cada lâmina (largura, altura, objetiva) só existem na
 * página do visualizador de Leeds; `--medir <caminho>` ou a curadoria as
 * buscam sob demanda (ver `medirLamina`).
 */

import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(RAIZ, 'node_modules', '.cache', 'hp-leeds')
const SAIDA = join(RAIZ, 'data', 'histopatologia-zoom', 'acervo-leeds.json')
const SITE = 'https://www.virtualpathology.leeds.ac.uk'
const semCache = process.argv.includes('--sem-cache')

export const SISTEMAS_LEEDS = {
  sy1: 'Breast',
  sy2: 'Cardiac',
  sy3: 'Central Nervous System',
  sy6: 'Endocrine system',
  sy7: 'Eye, ear, nose and throat (ENT)',
  sy8: 'Female Genital Tract',
  sy9: 'Gastrointestinal Tract (lower)',
  sy10: 'Gastrointestinal Tract (upper)',
  sy19: 'Haematology',
  sy11: 'Head and Neck',
  sy12: 'Infectious disease',
  sy13: 'Liver and Biliary Tract',
  sy14: 'Lymph Nodes, Spleen, Thymus',
  sy15: 'Male Genital Tract',
  sy16: 'Paediatric Pathology',
  sy17: 'Pancreas',
  sy18: 'Peripheral Nervous System and Muscle',
  sy20: 'Renal Pathology',
  sy21: 'Respiratory Tract',
  sy22: 'Skin',
  sy23: 'Soft Tissue and Bone',
  sy24: 'Urinary Tract',
  sy25: 'Vascular',
  sy26: 'Unknown',
}

mkdirSync(CACHE, { recursive: true })

async function buscar(sistema) {
  const arquivo = join(CACHE, `${sistema}.html`)
  if (!semCache && existsSync(arquivo)) return readFileSync(arquivo, 'utf8')
  const corpo = new URLSearchParams({
    what: 'Diagnosis',
    clinical_details: '',
    diagnosis: '',
    system: sistema,
    stain_type: 's1',
  })
  for (let tentativa = 1; ; tentativa++) {
    try {
      const r = await fetch(`${SITE}/slides/library/advanced.php`, {
        method: 'POST',
        body: corpo,
        headers: { 'User-Agent': 'DomineAqui-catalogo/1.0 (autorizado)' },
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const html = await r.text()
      writeFileSync(arquivo, html)
      return html
    } catch (e) {
      if (tentativa >= 3) throw e
      await new Promise((ok) => setTimeout(ok, 3000 * tentativa))
    }
  }
}

const limpar = (s) =>
  s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()

function casos(html, sistema) {
  const blocos = html.split('<div class="gradBoxCaseContainer">').slice(1)
  const saida = []
  for (const b of blocos) {
    const ps = [...b.split('<!--  XML button -->')[0].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => limpar(m[1]))
    const [paciente = '', clinica = ''] = ps
    const diag = b.match(/Diagnosis:<br \/>\s*<strong>([\s\S]*?)<\/strong>/)
    const coment = b.match(/Comment:<br \/>([\s\S]*?)<br \/><br \/>/)
    const colecao = b.match(/Collection: <a[^>]*>([^<]*)<\/a>/)
    const laminas = []
    for (const m of b.matchAll(/<a\s+href="\.\.\/\.\.\/slides\/library\/view\.php\?path=([^"]+)"[^>]*>\s*<h3 class="slideText[^"]*">([\s\S]*?)<\/h3>/g)) {
      laminas.push({ caminho: decodeURIComponent(m[1]), rotulo: limpar(m[2]) })
    }
    if (!laminas.length) continue
    const sexo = /female/i.test(paciente) ? 'F' : /male/i.test(paciente) ? 'M' : null
    const idade = paciente.match(/(\d+)\s*years?/i)
    saida.push({
      sistema,
      sexo,
      idade: idade ? Number(idade[1]) : null,
      clinica: clinica || null,
      diagnostico: diag ? limpar(diag[1]) : null,
      comentario: coment ? limpar(coment[1]) || null : null,
      colecao: colecao ? limpar(colecao[1]) : null,
      laminas,
    })
  }
  return saida
}

async function principal() {
  const todos = []
  for (const [id, nome] of Object.entries(SISTEMAS_LEEDS)) {
    const html = await buscar(id)
    const lista = casos(html, id)
    const declarado = html.match(/produced (\d+) cases/)
    console.log(`${id.padEnd(5)} ${nome.padEnd(40)} ${String(lista.length).padStart(5)} casos (declarado ${declarado?.[1] ?? '?'})`)
    todos.push(...lista)
  }
  // Um caso pode aparecer em mais de um sistema; a chave é o conjunto de lâminas.
  const vistos = new Map()
  for (const c of todos) {
    const chave = c.laminas.map((l) => l.caminho).sort().join('|')
    const anterior = vistos.get(chave)
    if (anterior) {
      if (!anterior.sistemas.includes(c.sistema)) anterior.sistemas.push(c.sistema)
    } else vistos.set(chave, { ...c, sistemas: [c.sistema] })
  }
  const lista = [...vistos.values()].map(({ sistema: _s, ...c }) => c)
  mkdirSync(dirname(SAIDA), { recursive: true })
  writeFileSync(
    SAIDA,
    JSON.stringify({ fonte: `${SITE}/slides/library/`, coletadoEm: new Date().toISOString().slice(0, 10), casos: lista }) + '\n',
  )
  console.log(`\n${lista.length} casos únicos, ${lista.reduce((s, c) => s + c.laminas.length, 0)} lâminas → ${SAIDA}`)
}

principal().catch((e) => {
  console.error(e)
  process.exit(1)
})
