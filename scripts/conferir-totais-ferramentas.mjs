#!/usr/bin/env node
/**
 * Confere o `total` declarado de cada categoria contra a contagem real.
 *
 * O número aparece no índice antes de o módulo da categoria ser carregado —
 * cada um é um chunk separado —, então ele é escrito à mão em `categorias.ts`
 * e diverge com facilidade. `index.ts` já compara os dois em desenvolvimento,
 * mas só depois de alguém abrir a página; aqui a comparação é feita na linha
 * de comando e falha com código de saída 1.
 *
 * A contagem é por ferramenta distinta e por categoria declarada em cada uma:
 * uma ferramenta que serve a duas categorias conta nas duas, e é justamente
 * essa contagem cruzada que costuma escapar quando se acrescenta conteúdo.
 *
 * Uso: node --experimental-strip-types --no-warnings scripts/conferir-totais-ferramentas.mjs
 */

import { readdirSync, readFileSync } from 'node:fs'
import process from 'node:process'
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
const decl = readFileSync('lib/ferramentas-clinicas/categorias.ts', 'utf8')
const re = /id: '([a-z]+)',(?:[\s\S]*?)total: (\d+),/g
let m
const divergentes = []
while ((m = re.exec(decl))) {
  const real = contagem[m[1]] ?? 0
  if (Number(m[2]) !== real) divergentes.push(`${m[1]}: declarado ${m[2]}, real ${real}`)
}
if (divergentes.length > 0) {
  console.error(`\n${divergentes.length} categoria(s) com total divergente:\n`)
  for (const d of divergentes) console.error(`  - ${d}`)
  console.error('')
  process.exitCode = 1
} else {
  console.log(`totais conferidos | ${vistos.size} ferramentas distintas em 19 categorias`)
}
