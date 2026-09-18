#!/usr/bin/env node
/**
 * Acrescenta uma frase ao final do `fundamento` de uma ferramenta.
 *
 * O `fundamento` é uma string, não uma lista, e no catálogo aparece sempre
 * na forma `fundamento:` numa linha e o literal na seguinte. O texto novo
 * entra antes da aspa de fechamento, de modo que o campo continua sendo uma
 * única string e nenhum delimitador é tocado.
 *
 * Uso: node scripts/ampliar-fundamento.mjs <arquivo.json>
 * JSON: { "<arquivo-alvo>": { "<id-da-ferramenta>": "frase a acrescentar" } }
 *
 * Como em `inserir-conduta.mjs`, qualquer ambiguidade aborta a ferramenta e
 * nada é escrito para ela — o catálogo tem ferramentas com mais de um
 * `fundamento` à vista se o recorte escorregar para a seguinte.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const arquivoDeEntrada = process.argv[2]
if (!arquivoDeEntrada) {
  console.error('uso: node scripts/ampliar-fundamento.mjs <arquivo.json>')
  process.exit(1)
}

const plano = JSON.parse(readFileSync(arquivoDeEntrada, 'utf8'))
let ampliadas = 0
const recusadas = []

for (const [caminho, porFerramenta] of Object.entries(plano)) {
  const linhas = readFileSync(caminho, 'utf8').split('\n')
  let mexeu = false

  for (const [id, frase] of Object.entries(porFerramenta)) {
    const inicio = linhas.findIndex((l) => l.trim() === `id: '${id}',`)
    if (inicio === -1) {
      recusadas.push(`${id}: id não encontrado em ${caminho}`)
      continue
    }
    let fim = linhas.length
    for (let i = inicio + 1; i < linhas.length; i += 1) {
      if (/^\s*id: '[a-z0-9-]+',$/.test(linhas[i])) {
        fim = i
        break
      }
    }

    const cabecalhos = []
    for (let i = inicio; i < fim; i += 1) {
      if (/^\s*fundamento:\s*$/.test(linhas[i])) cabecalhos.push(i)
    }
    if (cabecalhos.length !== 1) {
      recusadas.push(`${id}: ${cabecalhos.length} linhas 'fundamento:' — edição manual`)
      continue
    }

    const alvo = cabecalhos[0] + 1
    if (!/^\s*'.*',$/.test(linhas[alvo])) {
      recusadas.push(`${id}: literal de fundamento não está na linha seguinte — edição manual`)
      continue
    }

    const escapada = frase.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    linhas[alvo] = linhas[alvo].replace(/',$/, ` ${escapada}',`)
    ampliadas += 1
    mexeu = true
  }

  if (mexeu) writeFileSync(caminho, linhas.join('\n'), 'utf8')
}

console.log(`fundamentos ampliados: ${ampliadas}`)
if (recusadas.length > 0) {
  console.log('recusadas (nada foi escrito para estas):')
  for (const r of recusadas) console.log(`  - ${r}`)
}
