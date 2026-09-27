#!/usr/bin/env node
/**
 * Consolida `data/histologia-zoom/anotacoes/*.json` (um arquivo por lâmina,
 * fácil de editar e revisar) em `data/histologia-zoom/anotacoes.gerado.json`,
 * importado estaticamente pelo servidor — assim o deploy não depende de ler
 * uma pasta em tempo de execução.
 *
 * Uso: `node scripts/histologia-zoom/consolidar-anotacoes.mjs`
 * O teste `__tests__/histologia-zoom/estruturas.test.ts` falha se o
 * consolidado estiver desatualizado.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const pasta = path.join(process.cwd(), 'data', 'histologia-zoom', 'anotacoes')
const saida = path.join(process.cwd(), 'data', 'histologia-zoom', 'anotacoes.gerado.json')

export function consolidar() {
  const tudo = {}
  for (const nome of readdirSync(pasta).filter((n) => n.endsWith('.json')).sort()) {
    const a = JSON.parse(readFileSync(path.join(pasta, nome), 'utf8'))
    tudo[a.slug] = a
  }
  return tudo
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('consolidar-anotacoes.mjs')) {
  const tudo = consolidar()
  writeFileSync(saida, JSON.stringify(tudo) + '\n')
  const n = Object.values(tudo).reduce((s, a) => s + a.estruturas.length, 0)
  console.log(`${Object.keys(tudo).length} lâminas, ${n} estruturas → ${saida}`)
}
