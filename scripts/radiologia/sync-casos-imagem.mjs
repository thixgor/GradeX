#!/usr/bin/env node

/**
 * Casos de imagem com apontamentos (TC e Raio-X) — envia ao Vercel Blob os
 * cortes já curados por `curar-casos-imagem.py` e gera o manifesto v2 que
 * `lib/radiologia/casos-tc.ts` e `lib/radiologia/casos-rx.ts` consomem.
 *
 * Os cortes não vão para o repositório: ficam em `.radiologia/<mod>/<slug>/`
 * localmente e no Blob em `radiologia/<mod>/<slug>/s<série>-<n>.jpg`. As setas
 * viajam no manifesto com o corte renumerado para a pilha amostrada.
 *
 * Uso:
 *   node scripts/radiologia/sync-casos-imagem.mjs              # só o manifesto
 *   BLOB_READ_WRITE_TOKEN=... node scripts/radiologia/sync-casos-imagem.mjs --enviar
 */

import { head, put } from '@vercel/blob'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CURADORIA = join(ROOT, 'scripts', 'radiologia', 'casos-imagem.json')
const CACHE = join(ROOT, '.radiologia')
const MANIFEST = join(ROOT, 'data', 'radiologia', 'casos-imagem.json')
const BASE = 'https://fsyr6dn1vkygglkd.public.blob.vercel-storage.com'
const LICENCA = 'CC BY-NC-SA 3.0 · termo conjunto DomineAqui (18/09/2026)'
const enviar = process.argv.includes('--enviar')
const token = process.env.BLOB_READ_WRITE_TOKEN
if (enviar && !token) { console.error('Defina BLOB_READ_WRITE_TOKEN para --enviar.'); process.exit(1) }

async function emLotes(itens, tamanho, fn) {
  for (let i = 0; i < itens.length; i += tamanho) await Promise.all(itens.slice(i, i + tamanho).map(fn))
}

const curadoria = JSON.parse(await readFile(CURADORIA, 'utf8'))
const manifest = { version: 2, generatedAt: new Date().toISOString(), licenca: LICENCA, casos: [] }
let enviadas = 0
let faltando = 0

for (const caso of curadoria) {
  const series = []
  for (const [k, serie] of caso.series.entries()) {
    const prefixo = `radiologia/${caso.modalidade}/${caso.slug}/s${k}-`
    const indice = new Map(serie.fatias.map((f, n) => [f.abs, n]))
    await emLotes(serie.fatias.map((_, n) => n), 8, async (n) => {
      const local = join(CACHE, caso.modalidade, caso.slug, `s${k}-${n + 1}.jpg`)
      if (!existsSync(local)) { faltando += 1; return }
      if (!enviar) return
      const chave = `${prefixo}${n + 1}.jpg`
      if (await head(`${BASE}/${chave}`, { token }).catch(() => null)) return
      await put(chave, await readFile(local), { access: 'public', token, addRandomSuffix: false, allowOverwrite: true, contentType: 'image/jpeg' })
      enviadas += 1
    })
    series.push({
      perspectiva: serie.perspectiva,
      largura: serie.largura,
      altura: serie.altura,
      totalFatias: serie.fatias.length,
      prefixo,
      anotacoes: serie.anotacoes.map((a) => ({
        // O Radiopaedia às vezes grava espaços não separáveis no rótulo.
        rotulo: a.rotulo.replace(/\s+/g, ' ').trim(),
        pontos: a.pontos.map(([abs, x, y, rot]) => [indice.get(abs), x, y, rot]),
      })),
    })
  }
  manifest.casos.push({
    slug: caso.slug,
    modalidade: caso.modalidade,
    categoria: caso.categoria,
    urlDoCaso: `https://radiopaedia.org/cases/${caso.casoRadiopaedia}`,
    autoria: caso.autoria,
    series,
  })
}

await mkdir(dirname(MANIFEST), { recursive: true })
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`)
console.log(`Manifesto com ${manifest.casos.length} casos${enviar ? `; ${enviadas} cortes enviados ao Blob` : ''}${faltando ? `; ${faltando} cortes sem arquivo local` : ''}.`)
