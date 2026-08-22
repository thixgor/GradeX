/**
 * Sincronização geral das imagens do acervo: de hosts de terceiros para cá.
 *
 *   node --experimental-strip-types --env-file=.env.local \
 *     scripts/midia/sincronizar-imagens.mjs
 *
 * Sem `--aplicar` o comando é um ensaio: lê tudo, não escreve nada e imprime o
 * relatório do que faria. É o modo padrão de propósito — a primeira execução
 * deve ser uma leitura, não uma migração.
 *
 * ## Como funciona
 *
 * Três fases, nesta ordem, porque cada uma depende do resultado da anterior:
 *
 * 1. **Coletar.** Percorre os documentos de todas as coleções e extrai toda URL
 *    de imagem externa que encontrar — em campo dedicado, dentro de array, em
 *    objeto aninhado ou no meio de um texto longo com `!image[](…)` e `<img>`.
 *    Ver `lib/midia/varredura.ts` para o porquê de ser genérico.
 *
 * 2. **Ingerir.** Baixa cada URL **única** uma vez, confere que é imagem, envia
 *    ao nosso armazenamento com o nome derivado do SHA-256 do conteúdo e guarda
 *    o par `origem → caminho interno` em `media_assets`. A deduplicação acontece
 *    aqui: uma capa reaproveitada em quarenta provas é um download e um arquivo.
 *
 * 3. **Reescrever.** Percorre os documentos de novo e troca as URLs pelos
 *    caminhos internos, com `$set` só nas folhas que mudaram. Cada documento
 *    tocado deixa uma entrada em `media_sync_journal` com os valores anteriores,
 *    o que torna a migração reversível (`--reverter=<lote>`).
 *
 * As três são retomáveis e idempotentes: interromper no meio e rodar de novo
 * continua de onde parou, porque o estado mora no banco, não no processo.
 *
 * ## Opções
 *
 *   --aplicar              grava de verdade (padrão: ensaio)
 *   --colecao=a,b          só estas coleções
 *   --pular-colecao=a,b    exceto estas
 *   --incluir-logs         não pula as coleções de telemetria
 *   --limite=N             no máximo N documentos por coleção (para testar)
 *   --max-imagens=N        para a ingestão depois de N imagens novas
 *   --concorrencia=N       downloads simultâneos (padrão 6)
 *   --somente-imgur        ignora qualquer host que não seja do Imgur
 *   --incluir-host=h1,h2   trata estes hosts como acervo migrável
 *   --tentar-falhas        reprocessa URLs marcadas como falha definitiva
 *   --codigo               também reescreve URLs fixas no código-fonte
 *   --relatorio=arq.json   grava o relatório completo em disco
 *   --reverter=<lote>      desfaz um lote a partir do diário e sai
 *
 * ## Requisitos de ambiente
 *
 *   MONGODB_URI            base a migrar
 *   BLOB_READ_WRITE_TOKEN  credencial de escrita do armazenamento
 */

import { MongoClient } from 'mongodb'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import {
  encontrarImagensExternas,
  substituirUrls,
  HOSTS_DE_IMAGEM,
} from '../../lib/midia/urls.ts'
import { coletarUrls, planejarReescrita } from '../../lib/midia/varredura.ts'
import {
  internalizarUrl,
  falhasConhecidas,
  garantirIndicesDeMidia,
  COLECAO_ASSETS,
  COLECAO_FALHAS,
} from '../../lib/midia/deposito.ts'

const raizDoProjeto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

/* ───────────────────────────── argumentos ───────────────────────────── */

function bandeira(nome) {
  return process.argv.includes(`--${nome}`)
}

function valor(nome, padrao = '') {
  const prefixo = `--${nome}=`
  const achado = process.argv.find((a) => a.startsWith(prefixo))
  return achado ? achado.slice(prefixo.length) : padrao
}

function lista(nome) {
  return valor(nome)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function inteiro(nome, padrao) {
  const n = Number(valor(nome))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : padrao
}

const opcoes = {
  aplicar: bandeira('aplicar'),
  colecoes: lista('colecao'),
  pular: lista('pular-colecao'),
  incluirLogs: bandeira('incluir-logs'),
  limite: inteiro('limite', 0),
  maxImagens: inteiro('max-imagens', 0),
  concorrencia: Math.min(16, inteiro('concorrencia', 6)),
  somenteImgur: bandeira('somente-imgur'),
  hostsExtras: lista('incluir-host'),
  tentarFalhas: bandeira('tentar-falhas'),
  codigo: bandeira('codigo'),
  relatorio: valor('relatorio'),
  reverter: valor('reverter'),
}

const classificacao = {
  hostsExtras: opcoes.hostsExtras,
  somenteHosts: opcoes.somenteImgur ? HOSTS_DE_IMAGEM.filter((h) => h.includes('imgur')) : undefined,
}

/**
 * Coleções de telemetria: crescem para milhões de linhas e nunca guardaram uma
 * imagem. Varrê-las custaria horas de leitura para zero achados, então ficam de
 * fora por padrão — `--incluir-logs` as traz de volta se algum dia guardarem.
 */
const COLECOES_DE_LOG = new Set([
  'activity_events',
  'checkout_events',
  'lead_page_views',
  'download_logs',
  'audit_logs',
  'material_pdf_viewer_logs',
  'material_html_viewer_logs',
  'sessions',
  'pricing_events',
  'admin_audit',
])

/** Nossas próprias coleções de controle: reescrevê-las apagaria o mapa. */
const COLECOES_DA_MIGRACAO = new Set([COLECAO_ASSETS, COLECAO_FALHAS, 'media_sync_journal'])

/* ───────────────────────────── utilidades ───────────────────────────── */

function num(n) {
  return n.toLocaleString('pt-BR')
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function titulo(texto) {
  console.log(`\n${texto}`)
  console.log('─'.repeat(texto.length))
}

/** Executa `tarefa` sobre `itens` com no máximo `n` em voo ao mesmo tempo. */
async function emParalelo(itens, n, tarefa) {
  const fila = itens.slice()
  const trabalhadores = Array.from({ length: Math.min(n, fila.length) }, async () => {
    for (;;) {
      const item = fila.shift()
      if (item === undefined) return
      await tarefa(item)
    }
  })
  await Promise.all(trabalhadores)
}

/* ───────────────────────────── conexão ───────────────────────────── */

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('Defina MONGODB_URI. Ex.: node --env-file=.env.local --experimental-strip-types ...')
  process.exit(1)
}
if (opcoes.aplicar && !process.env.BLOB_READ_WRITE_TOKEN && !opcoes.reverter) {
  console.error('Defina BLOB_READ_WRITE_TOKEN — sem ele não há para onde enviar as imagens.')
  console.error('Pegue em: Vercel → Storage → seu Blob store → .env.local')
  process.exit(1)
}

const cliente = new MongoClient(uri, { serverSelectionTimeoutMS: 15_000 })
await cliente.connect()
const db = cliente.db('gradex')

/* ───────────────────────────── reversão ───────────────────────────── */

if (opcoes.reverter) {
  await reverterLote(opcoes.reverter)
  await cliente.close()
  process.exit(0)
}

async function reverterLote(lote) {
  const diario = db.collection('media_sync_journal')
  const entradas = await diario.find({ lote, revertidoEm: { $exists: false } }).toArray()

  titulo(`Reversão do lote ${lote}`)
  console.log(`Entradas a desfazer: ${num(entradas.length)}`)
  if (entradas.length === 0) return

  if (!opcoes.aplicar) {
    console.log('\nEnsaio: nada foi alterado. Repita com --aplicar para desfazer de verdade.')
    return
  }

  let desfeitas = 0
  for (const entrada of entradas) {
    await db.collection(entrada.colecao).updateOne({ _id: entrada.docId }, { $set: entrada.originais })
    await diario.updateOne({ _id: entrada._id }, { $set: { revertidoEm: new Date() } })
    desfeitas += 1
  }
  console.log(`✔ ${num(desfeitas)} documentos restaurados aos valores anteriores.`)
  console.log('Os arquivos internalizados continuam no armazenamento — nada foi apagado.')
}

/* ───────────────────────── quais coleções varrer ───────────────────────── */

async function colecoesAlvo() {
  const todas = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((nome) => !nome.startsWith('system.'))
    .sort()

  if (opcoes.colecoes.length > 0) {
    const desconhecidas = opcoes.colecoes.filter((c) => !todas.includes(c))
    if (desconhecidas.length > 0) {
      console.error(`Coleções inexistentes: ${desconhecidas.join(', ')}`)
      process.exit(1)
    }
    return opcoes.colecoes
  }

  return todas.filter((nome) => {
    if (COLECOES_DA_MIGRACAO.has(nome)) return false
    if (opcoes.pular.includes(nome)) return false
    if (!opcoes.incluirLogs && COLECOES_DE_LOG.has(nome)) return false
    return true
  })
}

/* ───────────────────────── fase 1: coletar ───────────────────────── */

/**
 * Varre os documentos e devolve o inventário das URLs externas.
 *
 * O que fica em memória é o conjunto de URLs **únicas** — alguns milhares —, e
 * não a lista de documentos que as citam. Guardar os documentos custaria memória
 * proporcional ao acervo inteiro; a fase de reescrita simplesmente varre de
 * novo, e uma segunda leitura sequencial é barata perto de qualquer download.
 */
async function coletar(colecoes) {
  const porUrl = new Map()
  const porColecao = new Map()

  for (const nome of colecoes) {
    const cursor = db.collection(nome).find({}, { batchSize: 200 })
    if (opcoes.limite) cursor.limit(opcoes.limite)

    let documentos = 0
    let comImagem = 0
    let ocorrencias = 0

    for await (const doc of cursor) {
      documentos += 1
      const achados = coletarUrls(doc, classificacao)
      if (achados.length === 0) continue
      comImagem += 1
      ocorrencias += achados.length

      for (const { url, caminho } of achados) {
        const registro = porUrl.get(url)
        if (registro) {
          registro.ocorrencias += 1
          registro.colecoes.add(nome)
        } else {
          porUrl.set(url, {
            ocorrencias: 1,
            colecoes: new Set([nome]),
            exemplo: { colecao: nome, docId: String(doc._id), campo: caminho },
          })
        }
      }
    }

    if (ocorrencias > 0) {
      porColecao.set(nome, { documentos, comImagem, ocorrencias })
    }
    process.stdout.write(`  ${nome}: ${num(documentos)} docs, ${num(ocorrencias)} refs\r`)
  }

  process.stdout.write(' '.repeat(70) + '\r')
  return { porUrl, porColecao }
}

/* ───────────────────────── fase 2: ingerir ───────────────────────── */

async function ingerir(urls) {
  const mapa = new Map()
  const falhas = []
  let novas = 0
  let reaproveitadas = 0
  let bytes = 0
  let processadas = 0

  // URLs já internalizadas numa execução anterior: uma consulta em bloco poupa
  // uma ida ao banco por URL antes de qualquer decisão de rede.
  const procuradas = new Set(urls)
  const conhecidas = await db
    .collection(COLECAO_ASSETS)
    .find({ origens: { $in: urls } }, { projection: { caminho: 1, origens: 1 } })
    .toArray()
  for (const asset of conhecidas) {
    for (const origem of asset.origens || []) {
      if (procuradas.has(origem)) mapa.set(origem, asset.caminho)
    }
  }

  const pendentes = urls.filter((u) => !mapa.has(u))
  const jaFalharam = opcoes.tentarFalhas ? new Map() : await falhasConhecidas(db, pendentes)
  const aBaixar = pendentes.filter((u) => {
    const falha = jaFalharam.get(u)
    if (falha?.definitiva) {
      falhas.push({ url: u, motivo: `${falha.motivo} (já registrada)`, definitiva: true })
      return false
    }
    return true
  })

  const alvo = opcoes.maxImagens ? aBaixar.slice(0, opcoes.maxImagens) : aBaixar

  console.log(`Já internalizadas : ${num(mapa.size)}`)
  console.log(`Falhas conhecidas : ${num(falhas.length)}`)
  console.log(`A baixar          : ${num(alvo.length)}${alvo.length < aBaixar.length ? ` (de ${num(aBaixar.length)}, limitado por --max-imagens)` : ''}`)
  if (alvo.length === 0) return { mapa, falhas, novas, reaproveitadas, bytes }

  await emParalelo(alvo, opcoes.concorrencia, async (url) => {
    const resultado = await internalizarUrl(db, url, {
      simular: !opcoes.aplicar,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      ignorarFalhasConhecidas: opcoes.tentarFalhas,
    })

    processadas += 1
    if (processadas % 10 === 0 || processadas === alvo.length) {
      process.stdout.write(`  ingerindo ${num(processadas)}/${num(alvo.length)}…\r`)
    }

    if (!resultado.ok) {
      falhas.push({ url, motivo: resultado.motivo, definitiva: resultado.definitiva })
      return
    }

    mapa.set(url, resultado.caminho)
    bytes += resultado.bytes
    if (resultado.reaproveitado) reaproveitadas += 1
    else novas += 1
  })

  process.stdout.write(' '.repeat(70) + '\r')
  return { mapa, falhas, novas, reaproveitadas, bytes }
}

/* ───────────────────────── fase 3: reescrever ───────────────────────── */

async function reescrever(colecoes, mapa, lote) {
  const diario = db.collection('media_sync_journal')
  let documentos = 0
  let campos = 0
  const pendentes = new Set()

  for (const nome of colecoes) {
    const cursor = db.collection(nome).find({}, { batchSize: 200 })
    if (opcoes.limite) cursor.limit(opcoes.limite)

    for await (const doc of cursor) {
      const plano = planejarReescrita(doc, mapa, classificacao)
      for (const u of plano.urlsPendentes) pendentes.add(u)
      const caminhos = Object.keys(plano.sets)
      if (caminhos.length === 0) continue

      documentos += 1
      campos += caminhos.length

      if (!opcoes.aplicar) continue

      await db.collection(nome).updateOne({ _id: doc._id }, { $set: plano.sets })
      await diario.insertOne({
        lote,
        colecao: nome,
        docId: doc._id,
        originais: plano.originais,
        novos: plano.sets,
        executadoEm: new Date(),
      })
    }

    process.stdout.write(`  reescrevendo ${nome}…${' '.repeat(20)}\r`)
  }

  process.stdout.write(' '.repeat(70) + '\r')
  return { documentos, campos, pendentes: Array.from(pendentes) }
}

/* ─────────────────── extra: URLs fixas no código-fonte ─────────────────── */

/**
 * Algumas imagens não estão no banco: a logo do PDF, a imagem de compartilhamento
 * do Open Graph, a capa padrão do Manual Clínico. São poucas, mas são as que
 * aparecem em toda página — e ficariam para trás numa migração que só olhasse o
 * Mongo.
 *
 * Testes e documentação ficam de fora: as URLs de lá são exemplos inventados,
 * e trocá-las por caminhos internos tornaria os testes mentirosos.
 */
const DIRETORIOS_DE_CODIGO = ['app', 'components', 'lib', 'hooks', 'context', 'data']
const EXTENSOES_DE_CODIGO = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])
const CAMINHOS_FORA = ['__tests__', 'node_modules', '.next', 'docs']

/**
 * Arquivos onde um caminho relativo **não** serve, e por quê.
 *
 * `/midia/…` funciona em `<img>` e em `next/image` porque o navegador resolve
 * contra a origem da página. Não funciona em dois lugares:
 *
 * - **Open Graph.** A imagem de compartilhamento é lida pelo WhatsApp e pelo
 *   Facebook, que buscam a URL fora do nosso contexto. Caminho relativo ali
 *   apaga a prévia de todo link compartilhado do site.
 * - **`fetch` de servidor.** A logo do PDF é baixada dentro da função, onde não
 *   existe "origem da página" — `fetch('/midia/…')` lança.
 *
 * Estes seguem apontando para o host externo até alguém trocá-los à mão por uma
 * URL absoluta do nosso domínio. O script os pula e diz que pulou, em vez de
 * quebrar a prévia dos links num commit de migração de imagem.
 */
const PRECISA_DE_URL_ABSOLUTA = new Map([
  ['lib/seo.ts', 'imagem de Open Graph — precisa de URL absoluta'],
  ['app/apg/route.ts', 'imagem de Open Graph — precisa de URL absoluta'],
  ['app/api/banco/listas/[id]/pdf/route.ts', 'baixada por fetch no servidor — precisa de URL absoluta'],
])

async function arquivosDeCodigo() {
  const encontrados = []

  async function descer(dir) {
    const entradas = await readdir(dir, { withFileTypes: true })
    for (const entrada of entradas) {
      const completo = path.join(dir, entrada.name)
      if (CAMINHOS_FORA.some((fora) => completo.includes(`${path.sep}${fora}${path.sep}`) || completo.endsWith(`${path.sep}${fora}`))) continue
      if (entrada.isDirectory()) await descer(completo)
      else if (EXTENSOES_DE_CODIGO.has(path.extname(entrada.name))) encontrados.push(completo)
    }
  }

  for (const dir of DIRETORIOS_DE_CODIGO) {
    try {
      await descer(path.join(raizDoProjeto, dir))
    } catch {
      /* diretório opcional */
    }
  }
  return encontrados
}

async function sincronizarCodigo() {
  const arquivos = await arquivosDeCodigo()
  const porArquivo = new Map()
  const urls = new Set()

  const pulados = []

  for (const arquivo of arquivos) {
    const conteudo = await readFile(arquivo, 'utf8')
    const achadas = encontrarImagensExternas(conteudo, classificacao)
    if (achadas.length === 0) continue

    const relativo = path.relative(raizDoProjeto, arquivo)
    const motivo = PRECISA_DE_URL_ABSOLUTA.get(relativo)
    if (motivo) {
      pulados.push({ arquivo: relativo, motivo, urls: achadas })
      continue
    }

    porArquivo.set(arquivo, achadas)
    for (const u of achadas) urls.add(u)
  }

  titulo('Código-fonte')
  console.log(`Arquivos com URL externa: ${num(porArquivo.size)}`)
  console.log(`URLs distintas          : ${num(urls.size)}`)
  if (pulados.length > 0) {
    console.log('\nPulados (caminho relativo não serve aqui — troque à mão por URL absoluta):')
    for (const p of pulados) console.log(`  ${p.arquivo} — ${p.motivo}`)
  }
  if (urls.size === 0) return { arquivos: 0, substituicoes: 0, falhas: [], pulados }

  const { mapa, falhas } = await ingerir(Array.from(urls))

  let tocados = 0
  let substituicoes = 0
  for (const [arquivo, achadas] of porArquivo) {
    const parcial = new Map()
    for (const u of achadas) if (mapa.has(u)) parcial.set(u, mapa.get(u))
    if (parcial.size === 0) continue

    const conteudo = await readFile(arquivo, 'utf8')
    const novo = substituirUrls(conteudo, parcial)
    if (novo === conteudo) continue

    tocados += 1
    substituicoes += parcial.size
    console.log(`  ${opcoes.aplicar ? 'reescrito' : 'reescreveria'}: ${path.relative(raizDoProjeto, arquivo)} (${parcial.size})`)
    if (opcoes.aplicar) await writeFile(arquivo, novo, 'utf8')
  }

  return { arquivos: tocados, substituicoes, falhas, pulados }
}

/* ───────────────────────────── execução ───────────────────────────── */

const lote = new Date().toISOString().replace(/[:.]/g, '-')

console.log('Sincronização de imagens — Domine Aqui')
console.log(`Modo: ${opcoes.aplicar ? 'APLICAR (grava no banco e no armazenamento)' : 'ensaio (nada é gravado)'}`)
console.log(`Lote: ${lote}`)
if (opcoes.somenteImgur) console.log('Escopo: apenas hosts do Imgur')
if (opcoes.hostsExtras.length) console.log(`Hosts extras: ${opcoes.hostsExtras.join(', ')}`)

if (opcoes.aplicar) await garantirIndicesDeMidia(db)

const colecoes = await colecoesAlvo()
titulo('Fase 1 — coletar')
console.log(`Coleções a varrer: ${num(colecoes.length)}`)
const { porUrl, porColecao } = await coletar(colecoes)

const urls = Array.from(porUrl.keys())
const ocorrenciasTotais = Array.from(porUrl.values()).reduce((n, r) => n + r.ocorrencias, 0)

console.log(`URLs externas distintas : ${num(urls.length)}`)
console.log(`Referências no banco    : ${num(ocorrenciasTotais)}`)

const porHost = new Map()
for (const u of urls) {
  let host = '(inválido)'
  try {
    host = new URL(u).hostname
  } catch {
    /* mantém o rótulo */
  }
  porHost.set(host, (porHost.get(host) || 0) + 1)
}
if (porHost.size > 0) {
  console.log('\nPor host:')
  for (const [host, n] of Array.from(porHost).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(6)}  ${host}`)
  }
}
if (porColecao.size > 0) {
  console.log('\nPor coleção:')
  for (const [nome, s] of Array.from(porColecao).sort((a, b) => b[1].ocorrencias - a[1].ocorrencias)) {
    console.log(`  ${String(s.ocorrencias).padStart(6)}  ${nome} (${num(s.comImagem)} de ${num(s.documentos)} docs)`)
  }
}

titulo('Fase 2 — ingerir')
const ingestao = urls.length > 0 ? await ingerir(urls) : { mapa: new Map(), falhas: [], novas: 0, reaproveitadas: 0, bytes: 0 }
console.log(`Novas no armazenamento : ${num(ingestao.novas)} (${mb(ingestao.bytes)})`)
console.log(`Conteúdo repetido      : ${num(ingestao.reaproveitadas)}`)
console.log(`Falhas                 : ${num(ingestao.falhas.length)}`)

if (ingestao.falhas.length > 0) {
  console.log('\nPrimeiras falhas:')
  for (const f of ingestao.falhas.slice(0, 15)) {
    console.log(`  ${f.definitiva ? '✗' : '↻'} ${f.motivo} — ${f.url}`)
  }
  if (ingestao.falhas.length > 15) console.log(`  … e mais ${num(ingestao.falhas.length - 15)}`)
}

titulo('Fase 3 — reescrever')
const reescrita = ingestao.mapa.size > 0
  ? await reescrever(colecoes, ingestao.mapa, lote)
  : { documentos: 0, campos: 0, pendentes: [] }
console.log(`Documentos ${opcoes.aplicar ? 'atualizados' : 'a atualizar'} : ${num(reescrita.documentos)}`)
console.log(`Campos ${opcoes.aplicar ? 'trocados' : 'a trocar'}       : ${num(reescrita.campos)}`)
if (reescrita.pendentes.length > 0) {
  console.log(`URLs sem substituto      : ${num(reescrita.pendentes.length)} (permanecem apontando para a origem)`)
}

const codigo = opcoes.codigo ? await sincronizarCodigo() : null

titulo('Resumo')
if (opcoes.aplicar) {
  console.log(`✔ Lote ${lote} concluído.`)
  console.log(`  Para desfazer: node --experimental-strip-types --env-file=.env.local \\`)
  console.log(`    scripts/midia/sincronizar-imagens.mjs --reverter=${lote} --aplicar`)
} else {
  console.log('Ensaio concluído — nada foi gravado.')
  console.log('Repita com --aplicar quando o relatório acima estiver como você espera.')
}

if (opcoes.relatorio) {
  const destino = path.resolve(raizDoProjeto, opcoes.relatorio)
  await mkdir(path.dirname(destino), { recursive: true })
  await writeFile(
    destino,
    JSON.stringify(
      {
        lote,
        aplicado: opcoes.aplicar,
        geradoEm: new Date().toISOString(),
        colecoes,
        totais: {
          urlsDistintas: urls.length,
          referencias: ocorrenciasTotais,
          novas: ingestao.novas,
          reaproveitadas: ingestao.reaproveitadas,
          bytes: ingestao.bytes,
          documentosReescritos: reescrita.documentos,
          camposReescritos: reescrita.campos,
        },
        porHost: Object.fromEntries(porHost),
        porColecao: Object.fromEntries(porColecao),
        falhas: ingestao.falhas,
        pendentes: reescrita.pendentes,
        urls: Object.fromEntries(
          urls.map((u) => [
            u,
            {
              ocorrencias: porUrl.get(u).ocorrencias,
              colecoes: Array.from(porUrl.get(u).colecoes),
              exemplo: porUrl.get(u).exemplo,
              caminho: ingestao.mapa.get(u) || null,
            },
          ]),
        ),
        codigo,
      },
      null,
      2,
    ),
    'utf8',
  )
  console.log(`\nRelatório gravado em ${path.relative(raizDoProjeto, destino)}`)
}

await cliente.close()
