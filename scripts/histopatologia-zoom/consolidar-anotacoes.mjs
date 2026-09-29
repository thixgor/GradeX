#!/usr/bin/env node
/**
 * Consolida `data/histopatologia-zoom/anotacoes/*.json` (um arquivo por
 * lâmina) em `data/histopatologia-zoom/anotacoes.gerado.json`, importado
 * estaticamente pelo servidor.
 *
 * Uso: `node scripts/histopatologia-zoom/consolidar-anotacoes.mjs`
 * O teste `__tests__/histopatologia-zoom/conteudo.test.ts` falha se o
 * consolidado estiver desatualizado.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const pasta = path.join(process.cwd(), 'data', 'histopatologia-zoom', 'anotacoes')
const saida = path.join(process.cwd(), 'data', 'histopatologia-zoom', 'anotacoes.gerado.json')

export function consolidar() {
  const tudo = {}
  for (const nome of readdirSync(pasta).filter((n) => n.endsWith('.json')).sort()) {
    const a = JSON.parse(readFileSync(path.join(pasta, nome), 'utf8'))
    tudo[a.slug] = a
  }
  return tudo
}

if (process.argv[1].endsWith('consolidar-anotacoes.mjs')) {
  const tudo = consolidar()
  writeFileSync(saida, JSON.stringify(tudo) + '\n')
  const n = Object.values(tudo).reduce((s, a) => s + a.marcacoes.length, 0)
  console.log(`${Object.keys(tudo).length} lâminas, ${n} marcações → ${saida}`)
}
