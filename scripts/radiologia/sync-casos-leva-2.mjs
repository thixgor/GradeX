#!/usr/bin/env node

/**
 * Espelha as radiografias da segunda leva de casos (Radiopaedia, termo
 * conjunto de 18/09/2026) e gera o manifesto que `lib/radiologia/casos-raio-x.ts`
 * consome.
 *
 * Diferente da galeria do Radiology Masterclass, aqui cada imagem é um único
 * quadro (não há versão anotada): o app mostra a radiografia inteira e a lista
 * de alterações faz o papel das setas.
 *
 * Curadoria: `scripts/radiologia/casos-leva-2.json` — por caso, a categoria,
 * o slug e as imagens (URL da galeria do Radiopaedia, página do caso e autor).
 *
 * Uso:
 *   node scripts/radiologia/sync-casos-leva-2.mjs --download
 *   node scripts/radiologia/sync-casos-leva-2.mjs --verify
 */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../..', import.meta.url))
const OUTPUT = join(ROOT, 'public', 'img', 'radiologia', 'casos-raio-x', 'v2')
const CURADORIA = join(ROOT, 'scripts', 'radiologia', 'casos-leva-2.json')
const MANIFEST = join(ROOT, 'data', 'radiologia', 'casos-raio-x-leva-2.json')
const LICENCA = 'CC BY-NC-SA 3.0 · termo conjunto DomineAqui (18/09/2026)'

const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex')

function dimensoes(buffer) {
  if (buffer.subarray(1, 4).toString('ascii') === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error('Formato de imagem não reconhecido')
  let offset = 2
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue }
    const marker = buffer[offset + 1]
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
    }
    const length = buffer.readUInt16BE(offset + 2)
    offset += 2 + length
  }
  throw new Error('Dimensões JPEG não encontradas')
}

async function baixar(url) {
  for (let tentativa = 1; tentativa <= 4; tentativa += 1) {
    const resposta = await fetch(url, { headers: { 'user-agent': 'DomineAqui educational asset mirror (termo conjunto 2026-09-18; contato: throdrigf@gmail.com)' } })
    if (resposta.ok) return Buffer.from(await resposta.arrayBuffer())
    if (resposta.status === 429 || resposta.status >= 500) { await new Promise((r) => setTimeout(r, 1500 * tentativa)); continue }
    throw new Error(`${resposta.status} ao baixar ${url}`)
  }
  throw new Error(`Falha persistente ao baixar ${url}`)
}

async function sincronizar() {
  const curadoria = JSON.parse(await readFile(CURADORIA, 'utf8'))
  const anterior = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : { casos: [] }
  const jaBaixadas = new Map(anterior.casos.flatMap((c) => c.imagens.map((i) => [i.urlOrigem, i])))
  const manifest = { version: 1, generatedAt: new Date().toISOString(), casos: [] }
  let novas = 0
  for (const caso of curadoria) {
    const imagens = []
    for (const [k, origem] of caso.imagens.entries()) {
      const indice = k + 1
      const output = join(OUTPUT, caso.categoria, caso.slug, `${String(indice).padStart(2, '0')}.jpg`)
      const arquivo = `/${relative(join(ROOT, 'public'), output).replaceAll('\\', '/')}`
      const antiga = jaBaixadas.get(origem.url)
      let bytes
      if (antiga && existsSync(join(ROOT, 'public', antiga.arquivo.slice(1)))) {
        bytes = await readFile(join(ROOT, 'public', antiga.arquivo.slice(1)))
        if (antiga.arquivo !== arquivo) { await mkdir(dirname(output), { recursive: true }); await writeFile(output, bytes) }
      } else {
        bytes = await baixar(origem.url)
        await mkdir(dirname(output), { recursive: true })
        await writeFile(output, bytes)
        novas += 1
      }
      const { width, height } = dimensoes(bytes)
      imagens.push({
        indice,
        titulo: origem.titulo,
        propria: Boolean(origem.propria),
        arquivo,
        urlOrigem: origem.url,
        urlDoCaso: origem.urlDoCaso,
        autoria: origem.autoria,
        licenca: LICENCA,
        largura: width,
        altura: height,
        bytes: bytes.length,
        sha256: sha256(bytes),
      })
    }
    manifest.casos.push({ categoria: caso.categoria, slug: caso.slug, imagens })
    console.log(`${caso.categoria}/${caso.slug}: ${imagens.length} imagem(ns)`)
  }
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  const total = manifest.casos.reduce((n, c) => n + c.imagens.length, 0)
  console.log(`Manifesto: ${relative(ROOT, MANIFEST)} (${manifest.casos.length} casos, ${total} imagens, ${novas} baixadas agora)`)
}

async function verificar() {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
  let total = 0
  for (const caso of manifest.casos) {
    for (const imagem of caso.imagens) {
      const arquivo = join(ROOT, 'public', imagem.arquivo.replace(/^\//, ''))
      const info = await stat(arquivo)
      const bytes = await readFile(arquivo)
      if (info.size !== imagem.bytes || sha256(bytes) !== imagem.sha256) throw new Error(`Falha de integridade: ${imagem.arquivo}`)
      const { width, height } = dimensoes(bytes)
      if (width !== imagem.largura || height !== imagem.altura) throw new Error(`Dimensões divergentes: ${imagem.arquivo}`)
      total += 1
    }
  }
  console.log(`${total} imagens íntegras; arquivos locais conferem com o manifesto.`)
}

const modo = process.argv[2]
if (modo === '--download') await sincronizar()
else if (modo === '--verify') await verificar()
else { console.error('Uso: --download | --verify'); process.exit(1) }
