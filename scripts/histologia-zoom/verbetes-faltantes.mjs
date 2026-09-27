#!/usr/bin/env node
/** Lista os ids de estrutura usados nas anotações que ainda não têm verbete no glossário. */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const raiz = process.cwd()
const pasta = path.join(raiz, 'lib/histologia-zoom/estruturas/glossario')
const ids = new Set()
for (const f of readdirSync(pasta)) {
  for (const m of readFileSync(path.join(pasta, f), 'utf8').matchAll(/^ {4}id: '([a-z0-9-]+)'/gm)) ids.add(m[1])
}
const faltam = new Map()
const dir = path.join(raiz, 'data/histologia-zoom/anotacoes')
for (const f of readdirSync(dir)) {
  const a = JSON.parse(readFileSync(path.join(dir, f), 'utf8'))
  for (const e of a.estruturas) if (!ids.has(e.estrutura)) faltam.set(e.estrutura, [...(faltam.get(e.estrutura) ?? []), a.slug])
}
for (const [id, slugs] of faltam) console.log(id.padEnd(40), slugs.join(' '))
console.log(`${faltam.size} verbetes faltando; ${ids.size} no glossário.`)
