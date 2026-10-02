#!/usr/bin/env node

/**
 * Casos de TC — baixa as pilhas de cortes escolhidas no Radiopaedia (termo
 * conjunto de 18/09/2026), espelha no Vercel Blob e gera o manifesto que o app
 * consome.
 *
 * Diferente do Raio-X, uma TC é uma pilha: cada caso traz dezenas de cortes
 * contíguos em torno dos achados, e as setas dos autores (corte, x, y, rotação)
 * viajam no manifesto — o visualizador as redesenha em português.
 *
 * Os cortes não vão para o repositório (seriam ~120 MB): ficam em
 * `.radiologia/tc/` localmente e no Blob em `radiologia/tc/<slug>/<n>.jpg`.
 *
 * Uso:
 *   node scripts/radiologia/sync-casos-tc.mjs              # baixa + manifesto
 *   BLOB_READ_WRITE_TOKEN=... node scripts/radiologia/sync-casos-tc.mjs --enviar
 */

import { head, put } from '@vercel/blob'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const CURADORIA = join(ROOT, 'scripts', 'radiologia', 'casos-tc.json')
const CACHE = join(ROOT, '.radiologia', 'tc')
const MANIFEST = join(ROOT, 'data', 'radiologia', 'casos-tc.json')
const LICENCA = 'CC BY-NC-SA 3.0 · termo conjunto DomineAqui (18/09/2026)'
const enviar = process.argv.includes('--enviar')
const token = process.env.BLOB_READ_WRITE_TOKEN

async function baixar(url) {
  for (let tentativa = 1; tentativa <= 4; tentativa += 1) {
    const resposta = await fetch(url, { headers: { 'user-agent': 'DomineAqui educational asset mirror (termo conjunto 2026-09-18; contato: throdrigf@gmail.com)' } })
    if (resposta.ok) return Buffer.from(await resposta.arrayBuffer())
    if (resposta.status === 429 || resposta.status >= 500) { await new Promise((r) => setTimeout(r, 1500 * tentativa)); continue }
    throw new Error(`${resposta.status} ao baixar ${url}`)
  }
  throw new Error(`Falha persistente ao baixar ${url}`)
}

async function emLotes(itens, tamanho, fn) {
  for (let i = 0; i < itens.length; i += tamanho) await Promise.all(itens.slice(i, i + tamanho).map(fn))
}

const curadoria = JSON.parse(await readFile(CURADORIA, 'utf8'))
if (enviar && !token) { console.error('Defina BLOB_READ_WRITE_TOKEN para --enviar.'); process.exit(1) }

const manifest = { version: 1, generatedAt: new Date().toISOString(), licenca: LICENCA, casos: [] }
let baixadas = 0
let enviadas = 0
for (const caso of curadoria) {
  const pasta = join(CACHE, caso.slug)
  await mkdir(pasta, { recursive: true })
  const indiceDoAbsoluto = new Map(caso.fatias.map((f, k) => [f.abs, k]))
  await emLotes(caso.fatias.map((f, k) => ({ ...f, k })), 8, async (fatia) => {
    const arquivo = join(pasta, `${fatia.k + 1}.jpg`)
    if (!existsSync(arquivo)) { await writeFile(arquivo, await baixar(fatia.url)); baixadas += 1 }
    if (enviar) {
      const chave = `radiologia/tc/${caso.slug}/${fatia.k + 1}.jpg`
      try { await head(chave, { token }); return } catch {}
      await put(chave, await readFile(arquivo), { access: 'public', token, addRandomSuffix: false, allowOverwrite: true, contentType: 'image/jpeg' })
      enviadas += 1
    }
  })
  manifest.casos.push({
    slug: caso.slug,
    categoria: caso.categoria,
    urlDoCaso: `https://radiopaedia.org/cases/${caso.casoRadiopaedia}`,
    autoria: caso.autoria,
    perspectiva: caso.perspectiva,
    largura: caso.largura,
    altura: caso.altura,
    totalFatias: caso.fatias.length,
    anotacoes: caso.anotacoes.map((a) => ({
      rotulo: a.rotulo,
      pontos: a.pontos.map(([abs, x, y, rot]) => [indiceDoAbsoluto.get(abs), x, y, rot]),
    })),
  })
  console.log(`${caso.slug}: ${caso.fatias.length} cortes, ${caso.anotacoes.length} setas`)
}
await mkdir(dirname(MANIFEST), { recursive: true })
await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 1)}\n`)
console.log(`Manifesto com ${manifest.casos.length} casos; ${baixadas} cortes baixados agora${enviar ? `, ${enviadas} enviados ao Blob` : ''}.`)
