#!/usr/bin/env node
/**
 * Envia o acervo do Manual de Semiologia para o espelho (Vercel Blob).
 *
 *   BLOB_READ_WRITE_TOKEN=... npm run semiologia:acervo:espelhar
 *
 * ## O que este script faz
 *
 * Lê `lib/semiologia/acervo.gerado.ts`, pega cada mídia que já tem `sha256` e
 * `ext` (ou seja, que passou por `--baixar`), confere que os bytes em
 * `.semiologia/midia/` ainda batem com o hash, e sobe cada arquivo para
 * `semiologia/<2 hex>/<sha256>.<ext>` no Blob — exatamente o caminho que
 * `caminhoNoEspelho` em `lib/semiologia/midia.ts` monta na hora de servir.
 *
 * ## Por que existe um script só para isto
 *
 * `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE` é um interruptor sem meio-termo: assim
 * que é definida, a interface para de servir da origem e passa a montar
 * `${base}/semiologia/xx/<sha>.<ext>` para **toda** mídia hasheada. Definir a
 * variável antes de os arquivos existirem no espelho quebra o acervo inteiro
 * de uma vez — e quebra em produção, na frente do aluno. A ordem certa é a
 * deste script: enviar, conferir que respondeu, e só então configurar a base
 * que ele imprime no fim.
 *
 * ## Duas proteções
 *
 * 1. **Confere o SHA-256 antes de enviar.** O hash é a chave da URL pública;
 *    um arquivo trocado no disco viraria uma URL que promete um conteúdo e
 *    entrega outro.
 * 2. **Confere que o objeto responde depois de enviar.** Um `put` que devolve
 *    200 e um GET que devolve 404 não são a mesma coisa; só o segundo prova
 *    que o aluno vai ver a imagem.
 *
 * O envio é idempotente: o caminho contém o hash, então reenviar o mesmo
 * arquivo sobrescreve com o mesmo conteúdo. Não há mapa de progresso porque o
 * acervo é pequeno (dezenas de arquivos, não milhares) e rodar de novo custa
 * segundos.
 */

import { head, put } from '@vercel/blob'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const raizDoProjeto = path.resolve(scriptDir, '..', '..')
const pastaDeBytes = path.join(raizDoProjeto, '.semiologia', 'midia')

const token = process.env.BLOB_READ_WRITE_TOKEN
const args = process.argv.slice(2)
const apenas = (args.find((a) => a.startsWith('--apenas='))?.slice('--apenas='.length) ?? '').split(',').filter(Boolean)
// Com a base conhecida (a mesma variável que a aplicação lê), o script
// pergunta ao espelho antes de enviar e pula o que já está lá. Sem ela,
// envia tudo — é a primeira leva.
const baseDoEspelho = (process.env.NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE ?? '').replace(/\/$/, '')
if (!token) {
  console.error(
    'Defina BLOB_READ_WRITE_TOKEN.\n' +
      'Pegue em: Vercel → Storage → seu Blob store → .env.local',
  )
  process.exit(1)
}

/**
 * Espelho de `caminhoNoEspelho` em `lib/semiologia/midia.ts`.
 *
 * Repetido aqui, e não importado, porque este script roda em Node puro sem o
 * resolvedor de caminhos do Next — e porque o teste
 * `__tests__/semiologia/direitos.test.ts` compara as duas funções e falha se
 * elas divergirem. Se divergissem em silêncio, o script subiria os arquivos
 * para um caminho e a aplicação os procuraria em outro.
 */
function caminhoNoEspelho(sha256, ext) {
  return `semiologia/${sha256.slice(0, 2)}/${sha256}.${ext}`
}

const MIME = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
}

async function sha256Do(caminho) {
  const hash = createHash('sha256')
  for await (const bloco of createReadStream(caminho)) hash.update(bloco)
  return hash.digest('hex')
}

/* ────────────────────────── plano ────────────────────────── */

const { ACERVO_DE_MIDIA } = await import('../../lib/semiologia/acervo.gerado.ts')

const midias = Object.values(ACERVO_DE_MIDIA ?? {}).flat()
const semHash = midias.filter((m) => !m.sha256 || !m.ext)
const plano = midias
  .filter((m) => m.sha256 && m.ext)
  .map((m) => ({
    id: m.id,
    sha256: m.sha256,
    ext: m.ext,
    mime: MIME[m.ext] ?? 'application/octet-stream',
    arquivoLocal: path.join(pastaDeBytes, m.sha256.slice(0, 2), `${m.sha256}.${m.ext}`),
    blobPath: caminhoNoEspelho(m.sha256, m.ext),
  }))
  // A mesma mídia pode aparecer em mais de uma cena; o objeto no espelho é um só.
  .filter((item, i, todos) => todos.findIndex((o) => o.blobPath === item.blobPath) === i)
  // --apenas=mp3,wav restringe a passagem a algumas extensões (útil com --forcar
  // para corrigir o content-type de um tipo sem reenviar o acervo inteiro).
  .filter((item) => !apenas.length || apenas.includes(item.ext))

console.log(`Mídias no acervo  : ${midias.length}`)
if (semHash.length) {
  console.log(`Sem hash (pulando): ${semHash.length} — rode "npm run semiologia:acervo:gerar" para baixá-las`)
}
console.log(`A enviar          : ${plano.length} arquivo(s)`)
console.log('')

if (!plano.length) {
  console.log('Nada a enviar. O acervo ainda não tem mídia hasheada.')
  process.exit(0)
}

/* ────────────────────────── envio ────────────────────────── */

let enviados = 0
let pulados = 0
let bytesEnviados = 0
const falhas = []
let primeiraUrl

for (const item of plano) {
  const rotulo = `${item.id} → ${item.blobPath}`
  try {
    let tamanho
    try {
      tamanho = (await stat(item.arquivoLocal)).size
    } catch {
      throw new Error(
        `arquivo ausente em ${path.relative(raizDoProjeto, item.arquivoLocal)} — ` +
          'rode "npm run semiologia:acervo:gerar" para baixar os bytes',
      )
    }

    const hash = await sha256Do(item.arquivoLocal)
    if (hash !== item.sha256) throw new Error(`hash divergente no disco: ${hash.slice(0, 12)}… ≠ ${item.sha256.slice(0, 12)}…`)

    // O caminho é o hash do conteúdo: se já existe com o tamanho certo, está
    // pronto. Sem isto, cada leva reenviava o acervo inteiro — uma hora de
    // upload para acrescentar duzentos arquivos.
    if (baseDoEspelho && !args.includes('--forcar')) {
      const jaLa = await head(`${baseDoEspelho}/${item.blobPath}`, { token }).catch(() => null)
      if (jaLa && jaLa.size === tamanho) {
        primeiraUrl ??= jaLa.url
        pulados += 1
        continue
      }
    }

    // Três tentativas com espera crescente: rede instável não deveria obrigar
    // a pessoa a reiniciar o envio à mão.
    let blob
    let ultimoErro
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        blob = await put(item.blobPath, createReadStream(item.arquivoLocal), {
          access: 'public',
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: item.mime,
          // O caminho contém o hash do conteúdo, então o objeto é imutável por
          // construção — pode ser cacheado para sempre.
          cacheControlMaxAge: 31536000,
          token,
        })
        ultimoErro = undefined
        break
      } catch (erro) {
        ultimoErro = erro
        if (tentativa < 3) await new Promise((r) => setTimeout(r, 1000 * 2 ** tentativa))
      }
    }
    if (ultimoErro) throw new Error(`falhou após 3 tentativas — ${ultimoErro.message}`)

    // `put` respondeu; agora o que importa é se o objeto está lá com o
    // tamanho certo. É isto que separa "enviei" de "o aluno vai ver".
    const meta = await head(blob.url, { token })
    if (meta.size !== tamanho) throw new Error(`tamanho no espelho ${meta.size} ≠ ${tamanho} no disco`)

    primeiraUrl ??= blob.url
    enviados += 1
    bytesEnviados += tamanho
    console.log(`  ✓ ${rotulo} (${(tamanho / 1024).toFixed(0)} kB)`)
  } catch (erro) {
    falhas.push(`${rotulo}: ${erro.message}`)
    console.error(`  ✗ ${rotulo}: ${erro.message}`)
  }
}

console.log('')
console.log(`Enviados : ${enviados}/${plano.length} (${(bytesEnviados / 2 ** 20).toFixed(1)} MiB)${pulados ? ` · ${pulados} já estavam no espelho` : ''}`)

if (falhas.length) {
  console.error(`Falhas   : ${falhas.length} — corrija e rode de novo; o que já subiu não precisa subir outra vez.`)
  console.error('')
  console.error('Não configure NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE enquanto houver falha: a variável')
  console.error('liga o espelho para todas as mídias de uma vez, inclusive as que não subiram.')
  process.exit(1)
}

/**
 * Deriva a base pública a partir de uma URL já enviada. Todas as URLs de um
 * mesmo store compartilham a origem, e é essa origem que vira
 * `NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE` — sem barra no fim e sem `/semiologia`,
 * porque `caminhoNoEspelho` acrescenta o resto.
 */
const base = new URL(primeiraUrl).origin
console.log('')
console.log('Configure no ambiente da Vercel (Production):')
console.log('')
console.log(`  NEXT_PUBLIC_SEMIOLOGIA_MIDIA_BASE=${base}`)
console.log('')
console.log('E faça um novo deploy — a variável é lida em tempo de build.')
