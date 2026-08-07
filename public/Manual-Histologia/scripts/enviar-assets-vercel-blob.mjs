/**
 * Envia o acervo do Manual da Histologia para o Vercel Blob.
 *
 *   BLOB_READ_WRITE_TOKEN=... node public/Manual-Histologia/scripts/enviar-assets-vercel-blob.mjs
 *
 * Antes de rodar, materialize os binários:
 *
 *   git lfs install && git lfs pull
 *
 * ## Três proteções que este script tem, e por quê
 *
 * 1. **Recusa ponteiros Git LFS.** Num clone sem `git lfs pull`, cada "imagem"
 *    em disco é um arquivo de texto de ~130 bytes. Sem esta checagem o envio
 *    terminaria com sucesso, o mapa seria gravado, e *todas* as lâminas do site
 *    apontariam para arquivos de texto — um erro que só apareceria no navegador
 *    do aluno. O script para no primeiro ponteiro que encontrar.
 *
 * 2. **Confere o SHA-256 antes de enviar.** O hash é a chave da URL pública; um
 *    arquivo corrompido no disco viraria uma URL que promete um conteúdo e
 *    entrega outro. Desative com `HISTOLOGIA_PULAR_HASH=1` se já tiver rodado
 *    `validar-acervo.mjs` e quiser poupar a leitura extra.
 *
 * 3. **Pula o que a interface nunca serve.** Os 19 pacotes H5P (0,46 GiB, 18%
 *    do acervo) existem como prova de origem dos quizzes; as questões e imagens
 *    já foram extraídas deles na ingestão. Enviá-los custaria armazenamento e
 *    banda para nada. Use `HISTOLOGIA_INCLUIR_H5P=1` se quiser um espelho
 *    completo do acervo no CDN.
 *
 * O envio é retomável: o progresso é gravado em `dados/mapa-assets-blob.json` a
 * cada 25 arquivos, e uma segunda execução continua de onde parou.
 *
 * ## Derivadas WebP
 *
 * Se existir `dados/manifesto-derivadas.json` (produzido por
 * `scripts/histologia/recomprimir-acervo.mjs`), o envio usa os arquivos
 * recomprimidos em `derivadas-webp/` no lugar dos originais. O SHA-256 da
 * origem continua sendo a chave — muda só a extensão servida. A conferência de
 * hash é pulada nesse caso: o conteúdo derivado tem outro hash por definição, e
 * a integridade da origem já foi checada na conversão.
 */

import { put } from '@vercel/blob'
import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const raiz = path.resolve(import.meta.dirname, '..')
const arquivoDoMapa = path.join(raiz, 'dados/mapa-assets-blob.json')

const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.error(
    'Defina BLOB_READ_WRITE_TOKEN.\n' +
      'Pegue em: Vercel → Storage → seu Blob store → .env.local',
  )
  process.exit(1)
}

const incluirH5p = process.env.HISTOLOGIA_INCLUIR_H5P === '1'
const pularHash = process.env.HISTOLOGIA_PULAR_HASH === '1'
const concorrencia = Math.max(1, Math.min(12, Number(process.env.HISTOLOGIA_UPLOAD_CONCURRENCY) || 6))

/* ────────────────────────── plano ────────────────────────── */

let derivadas = {}
try {
  derivadas = JSON.parse(await readFile(path.join(raiz, 'dados/manifesto-derivadas.json'), 'utf8'))
} catch {
  /* sem recompressão: envia os originais */
}
const usandoDerivadas = Object.keys(derivadas).length > 0

const plano = (await readFile(path.join(raiz, 'dados/plano-assets-blob.jsonl'), 'utf8'))
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l))
  .filter((item) => incluirH5p || item.tipo !== 'pacote-h5p')
  .map((item) => {
    const d = derivadas[item.sha256]
    if (!d) return item
    return {
      ...item,
      bytes: d.bytes,
      mime: d.mime,
      arquivoLocal: `derivadas-webp/${item.sha256.slice(0, 2)}/${item.sha256}.webp`,
      blobPath: `manual-histologia/${item.sha256.slice(0, 2)}/${item.sha256}.webp`,
    }
  })

const bytesTotais = plano.reduce((n, i) => n + i.bytes, 0)

let mapa = {}
try {
  mapa = JSON.parse(await readFile(arquivoDoMapa, 'utf8'))
} catch {
  /* primeira execução */
}

const pendentes = plano.filter((i) => !mapa[i.sha256])
const bytesPendentes = pendentes.reduce((n, i) => n + i.bytes, 0)

console.log(`Acervo a publicar : ${plano.length.toLocaleString('pt-BR')} arquivos, ${gib(bytesTotais)}`)
if (!incluirH5p) console.log('                    (19 pacotes H5P pulados — a interface não os serve)')
if (usandoDerivadas) console.log(`                    (WebP recomprimido: ${Object.keys(derivadas).length.toLocaleString('pt-BR')} assets)`)
console.log(`Já enviados       : ${(plano.length - pendentes.length).toLocaleString('pt-BR')}`)
console.log(`Faltam            : ${pendentes.length.toLocaleString('pt-BR')} arquivos, ${gib(bytesPendentes)}`)
console.log(`Concorrência      : ${concorrencia}`)
console.log('')

if (pendentes.length === 0) {
  console.log('✔ Nada a fazer. O acervo já está publicado.')
  await imprimirBase()
  process.exit(0)
}

/* ────────────────── proteção contra ponteiro LFS ────────────────── */

const PONTEIRO_LFS = 'version https://git-lfs.github.com/spec/v1'

/**
 * Amostra alguns arquivos antes de começar. Falhar aqui custa segundos; falhar
 * depois de enviar 9.156 ponteiros custa um site inteiro de imagens quebradas
 * e uma limpeza manual no Blob.
 */
async function conferirMaterializacao() {
  const amostra = [pendentes[0], pendentes[Math.floor(pendentes.length / 2)], pendentes.at(-1)]
  for (const item of amostra) {
    const caminho = path.join(raiz, item.arquivoLocal)
    let tamanho
    try {
      tamanho = (await stat(caminho)).size
    } catch {
      console.error(`✘ Arquivo ausente: ${item.arquivoLocal}`)
      process.exit(1)
    }
    if (tamanho !== item.bytes) {
      const cabecalho = (await readFile(caminho)).subarray(0, 60).toString('utf8')
      if (cabecalho.startsWith(PONTEIRO_LFS)) {
        console.error('✘ Os binários do acervo são ponteiros Git LFS, não os arquivos reais.')
        console.error('')
        console.error('  Rode antes:')
        console.error('    git lfs install')
        console.error('    git lfs pull')
        console.error('')
        console.error(`  (${gib(bytesPendentes)} de download)`)
        process.exit(1)
      }
      console.error(`✘ Tamanho divergente em ${item.arquivoLocal}: ${tamanho} ≠ ${item.bytes}`)
      process.exit(1)
    }
  }
}

await conferirMaterializacao()

/* ────────────────────────── envio ────────────────────────── */

function gib(bytes) {
  return `${(bytes / 2 ** 30).toFixed(2)} GiB`
}

async function sha256Do(caminho) {
  const hash = createHash('sha256')
  for await (const bloco of createReadStream(caminho)) hash.update(bloco)
  return hash.digest('hex')
}

async function gravarMapa() {
  await writeFile(arquivoDoMapa, `${JSON.stringify(mapa, null, 2)}\n`, 'utf8')
}

let cursor = 0
let enviados = 0
let bytesEnviados = 0
let falhas = 0
const inicio = Date.now()

async function trabalhador() {
  for (;;) {
    const i = cursor++
    if (i >= pendentes.length) return
    const item = pendentes[i]
    const caminho = path.join(raiz, item.arquivoLocal)

    if (!pularHash && !usandoDerivadas) {
      const hash = await sha256Do(caminho)
      if (hash !== item.sha256) {
        console.error(`✘ Hash divergente, pulando: ${item.arquivoLocal}`)
        falhas++
        continue
      }
    }

    // Três tentativas com espera crescente: rede instável não deveria obrigar a
    // reiniciar um envio de 2 GiB.
    let ultimoErro
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const blob = await put(item.blobPath, createReadStream(caminho), {
          access: 'public',
          addRandomSuffix: false,
          contentType: item.mime,
          // O caminho contém o hash do conteúdo, então o objeto é imutável por
          // construção — pode ser cacheado para sempre.
          cacheControlMaxAge: 31536000,
          token,
        })
        mapa[item.sha256] = {
          url: blob.url,
          pathname: blob.pathname,
          sha256: item.sha256,
          bytes: item.bytes,
          mime: item.mime,
        }
        enviados++
        bytesEnviados += item.bytes
        ultimoErro = undefined
        break
      } catch (erro) {
        ultimoErro = erro
        if (tentativa < 3) await new Promise((r) => setTimeout(r, 1000 * 2 ** tentativa))
      }
    }

    if (ultimoErro) {
      console.error(`✘ Falhou após 3 tentativas: ${item.arquivoLocal} — ${ultimoErro.message}`)
      falhas++
      continue
    }

    if (enviados % 25 === 0) {
      await gravarMapa()
      const decorrido = (Date.now() - inicio) / 1000
      const restantes = pendentes.length - enviados - falhas
      const previsao = enviados > 0 ? (decorrido / enviados) * restantes : 0
      console.log(
        `${enviados.toLocaleString('pt-BR')}/${pendentes.length.toLocaleString('pt-BR')} · ` +
          `${gib(bytesEnviados)} · ${(bytesEnviados / 2 ** 20 / decorrido).toFixed(1)} MB/s · ` +
          `faltam ~${Math.round(previsao / 60)} min`,
      )
    }
  }
}

await Promise.all(Array.from({ length: concorrencia }, trabalhador))
await gravarMapa()

console.log('')
console.log(`Enviados : ${enviados.toLocaleString('pt-BR')} (${gib(bytesEnviados)})`)
if (falhas > 0) {
  console.error(`Falhas   : ${falhas} — rode de novo para retomar só o que faltou.`)
}
console.log(`No mapa  : ${Object.keys(mapa).length.toLocaleString('pt-BR')}/${plano.length.toLocaleString('pt-BR')}`)

await imprimirBase()
if (falhas > 0) process.exit(1)

/**
 * Deriva a base pública a partir de uma URL já enviada. Todas as URLs de um
 * mesmo store compartilham o host, e é esse host que vira
 * `NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE`.
 */
async function imprimirBase() {
  const alguma = Object.values(mapa)[0]
  if (!alguma) return
  const url = new URL(alguma.url)
  const base = `${url.origin}`
  console.log('')
  console.log('Configure no ambiente da Vercel (Production):')
  console.log('')
  console.log(`  NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE=${base}`)
  console.log('')
  console.log('E faça um novo deploy — a variável é lida em tempo de build.')
}
