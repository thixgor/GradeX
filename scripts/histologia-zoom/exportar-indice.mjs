#!/usr/bin/env node
/**
 * Exporta `data/histologia-zoom/indice-de-laminas.json`: slug → fonte de tiles,
 * dimensões e órgão. É o que a ferramenta de curadoria (`recorte.py --slug`)
 * usa para abrir uma lâmina pelo mesmo endereço que o site.
 *
 * Empacota o repositório TypeScript com esbuild (que lê os `paths` do
 * tsconfig, então `@/…` resolve igual ao Next) e o importa.
 *
 * Uso: `node scripts/histologia-zoom/exportar-indice.mjs`
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'

const raiz = process.cwd()
const tmp = mkdtempSync(path.join(os.tmpdir(), 'hz-indice-'))
const saidaJs = path.join(tmp, 'repositorio.mjs')

await build({
  entryPoints: [path.join(raiz, 'lib', 'histologia-zoom', 'repositorio.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: saidaJs,
  alias: { 'server-only': path.join(raiz, 'node_modules', 'server-only', 'empty.js') },
  logLevel: 'error',
})

const { LAMINAS } = await import(pathToFileURL(saidaJs).href)
rmSync(tmp, { recursive: true, force: true })

const indice = {}
for (const l of LAMINAS) {
  const p = l.piramide
  const fonte =
    p.formato === 'dzi'
      ? `dzi:${p.base.replace(/_files\/$/, '.dzi')}`
      : p.formato === 'imagem'
        ? `img:${p.niveis[p.niveis.length - 1].pasta}`
        : `hv:${p.base.split('/imgsets/')[1]}`
  indice[l.slug] = {
    fonte,
    orgao: l.orgao,
    sistema: l.sistema,
    titulo: l.subtitulo ? `${l.titulo} — ${l.subtitulo}` : l.titulo,
    coloracao: l.coloracao,
    especie: l.especie,
    largura: l.largura,
    altura: l.altura,
    alturaViewport: Number((l.altura / l.largura).toFixed(4)),
  }
}
const saida = path.join(raiz, 'data', 'histologia-zoom', 'indice-de-laminas.json')
writeFileSync(saida, JSON.stringify(indice, null, 1) + '\n')
console.log(`${Object.keys(indice).length} lâminas → ${saida}`)
