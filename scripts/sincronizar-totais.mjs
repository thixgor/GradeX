#!/usr/bin/env node
/**
 * Reescreve o `total` de cada categoria em `categorias.ts` com a contagem real,
 * e `TOTAL_FERRAMENTAS` em `index.ts` com o número de ferramentas distintas.
 *
 * Companheiro de `conferir-totais-ferramentas.mjs`: aquele acusa, este corrige.
 * Existem separados de propósito — a conferência serve de guarda em revisão e
 * em integração contínua, e não deve alterar arquivo nenhum.
 *
 * Uso: node --experimental-strip-types --no-warnings scripts/sincronizar-totais.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

const gancho = `
export async function resolve(e, c, n) {
  try { return await n(e, c) } catch (err) {
    if (e.startsWith('.') && !/\\.[a-z]+$/.test(e)) return n(e + '.ts', c)
    throw err
  }
}`
register(`data:text/javascript,${encodeURIComponent(gancho)}`, import.meta.url)

const dir = 'lib/ferramentas-clinicas/conteudo'
const contagem = {}
const vistos = new Set()
for (const arq of readdirSync(dir).filter((f) => f.endsWith('.ts'))) {
  const mod = await import(pathToFileURL(`${dir}/${arq}`).href)
  const lista = Object.values(mod).find((v) => Array.isArray(v) && v[0]?.id)
  for (const f of lista) {
    if (vistos.has(f.id)) continue
    vistos.add(f.id)
    for (const c of f.categorias) contagem[c] = (contagem[c] || 0) + 1
  }
}

const caminhoCategorias = 'lib/ferramentas-clinicas/categorias.ts'
let texto = readFileSync(caminhoCategorias, 'utf8')
const mudancas = []
texto = texto.replace(/id: '([a-z]+)',([\s\S]*?)total: (\d+),/g, (todo, id, meio, atual) => {
  const real = contagem[id] ?? 0
  if (Number(atual) !== real) mudancas.push(`${id}: ${atual} -> ${real}`)
  return `id: '${id}',${meio}total: ${real},`
})
writeFileSync(caminhoCategorias, texto, 'utf8')

const caminhoIndice = 'lib/ferramentas-clinicas/index.ts'
let indice = readFileSync(caminhoIndice, 'utf8')
indice = indice.replace(/export const TOTAL_FERRAMENTAS = \d+/, (m) => {
  const atual = Number(m.match(/\d+/)[0])
  if (atual !== vistos.size) mudancas.push(`TOTAL_FERRAMENTAS: ${atual} -> ${vistos.size}`)
  return `export const TOTAL_FERRAMENTAS = ${vistos.size}`
})
writeFileSync(caminhoIndice, indice, 'utf8')

if (mudancas.length === 0) console.log('nada a sincronizar')
else {
  console.log(`${mudancas.length} ajuste(s):`)
  for (const m of mudancas) console.log(`  - ${m}`)
}
