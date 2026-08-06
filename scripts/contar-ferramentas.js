#!/usr/bin/env node
/**
 * Conta as ferramentas clínicas reais e sincroniza os totais declarados.
 *
 * O índice das Ferramentas Clínicas mostra quantas ferramentas cada categoria
 * tem antes de carregar o módulo pesado correspondente — os números precisam,
 * portanto, viver em `categorias.ts`. Este script os recalcula a partir do
 * próprio conteúdo e reescreve os arquivos, para que a promessa da tela nunca
 * se descole do catálogo.
 *
 * Uso: node scripts/contar-ferramentas.js [--check]
 *   --check  apenas confere e sai com código 1 se houver divergência
 */

const fs = require('fs')
const path = require('path')

const RAIZ = path.join(__dirname, '..', 'lib', 'ferramentas-clinicas')
const DIR_CONTEUDO = path.join(RAIZ, 'conteudo')
const ARQ_CATEGORIAS = path.join(RAIZ, 'categorias.ts')
const ARQ_INDEX = path.join(RAIZ, 'index.ts')

const apenasConferir = process.argv.includes('--check')

/** Cada objeto `Ferramenta` tem exatamente um campo `categorias: [...]`. */
const REGEX_CATEGORIAS = /categorias:\s*\[([^\]]*)\]/g

const contagem = new Map()
const idsVistos = new Set()
let totalOcorrencias = 0

for (const arquivo of fs.readdirSync(DIR_CONTEUDO).filter((f) => f.endsWith('.ts'))) {
  const texto = fs.readFileSync(path.join(DIR_CONTEUDO, arquivo), 'utf8')

  // Ids das ferramentas: a linha `id: '...'` que precede `nome:` no mesmo objeto.
  for (const m of texto.matchAll(/id:\s*'([a-z0-9-]+)',\s*\n\s*nome:/g)) idsVistos.add(m[1])

  for (const m of texto.matchAll(REGEX_CATEGORIAS)) {
    totalOcorrencias++
    for (const c of m[1].matchAll(/'([a-z]+)'/g)) {
      contagem.set(c[1], (contagem.get(c[1]) ?? 0) + 1)
    }
  }
}

const totalDistintas = idsVistos.size

let categorias = fs.readFileSync(ARQ_CATEGORIAS, 'utf8')
let index = fs.readFileSync(ARQ_INDEX, 'utf8')
const divergencias = []

categorias = categorias.replace(
  /id:\s*'([a-z]+)',([\s\S]*?)total:\s*(\d+),/g,
  (bloco, id, meio, totalAtual) => {
    const real = contagem.get(id) ?? 0
    if (Number(totalAtual) !== real) divergencias.push(`${id}: declarado ${totalAtual}, real ${real}`)
    return `id: '${id}',${meio}total: ${real},`
  },
)

const totalAtualIndex = /export const TOTAL_FERRAMENTAS = (\d+)/.exec(index)
if (totalAtualIndex && Number(totalAtualIndex[1]) !== totalDistintas) {
  divergencias.push(`TOTAL_FERRAMENTAS: declarado ${totalAtualIndex[1]}, real ${totalDistintas}`)
}
index = index.replace(/export const TOTAL_FERRAMENTAS = \d+/, `export const TOTAL_FERRAMENTAS = ${totalDistintas}`)

console.log(`Ferramentas distintas: ${totalDistintas}`)
console.log(`Aparições em categorias: ${totalOcorrencias} objetos, ${[...contagem.values()].reduce((a, b) => a + b, 0)} vínculos`)
for (const [id, n] of [...contagem.entries()].sort()) console.log(`  ${id.padEnd(20)} ${n}`)

if (apenasConferir) {
  if (divergencias.length) {
    console.error('\nDivergências encontradas:\n' + divergencias.map((d) => '  ' + d).join('\n'))
    process.exit(1)
  }
  console.log('\nTotais sincronizados.')
  process.exit(0)
}

fs.writeFileSync(ARQ_CATEGORIAS, categorias)
fs.writeFileSync(ARQ_INDEX, index)
console.log(divergencias.length ? `\nAtualizados ${divergencias.length} total(is).` : '\nNada a atualizar.')
