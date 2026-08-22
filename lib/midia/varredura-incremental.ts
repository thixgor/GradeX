/**
 * Varredura contínua: a rede de segurança que mantém o acervo internalizado.
 *
 * A migração em massa é um evento; as rotas de escrita cobrem o banco de
 * questões. Falta o meio-termo — a capa de prova que um admin colou do Imgur na
 * tela de grupos, a figura que entrou pelo editor de patologias, a imagem do
 * prêmio de um sorteio. São dezenas de superfícies de escrita, e pendurar um
 * gancho em cada uma seria garantir que a próxima nasce sem.
 *
 * Então em vez de vigiar as escritas, esta rotina reexamina o acervo: percorre
 * as coleções pouco a pouco, encontra o que ficou apontando para fora e traz
 * para cá. Roda de madrugada, com teto de tempo e de imagens por execução.
 *
 * ## Por que é incremental, e como retoma
 *
 * Uma passada completa não cabe nos 300 segundos de uma função. O estado
 * — em que coleção parou e em qual `_id` — mora em `media_sync_estado`, então
 * cada execução continua de onde a anterior parou e o acervo inteiro é coberto
 * ao longo de alguns dias. Ordenar por `_id` dá um caminho estável e um ponto de
 * retomada exato sem precisar de índice novo.
 *
 * Documento que já está internalizado sai barato: `coletarUrls` não acha nada e
 * nenhuma escrita acontece.
 */

import 'server-only'
import type { Db } from 'mongodb'
import { coletarUrls, planejarReescrita } from './varredura.ts'
import { internalizarUrl, falhasConhecidas, COLECAO_ASSETS, COLECAO_FALHAS } from './deposito.ts'

const COLECAO_ESTADO = 'media_sync_estado'
const COLECAO_DIARIO = 'media_sync_journal'
const CHAVE_DO_ESTADO = 'varredura'

/** Telemetria: cresce sem parar e nunca guardou imagem. Ver o script de migração. */
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
])

const COLECOES_DA_MIGRACAO = new Set([COLECAO_ASSETS, COLECAO_FALHAS, COLECAO_DIARIO, COLECAO_ESTADO])

export interface OpcoesDaVarredura {
  /** Teto de tempo da execução. A rotina para no primeiro documento depois disso. */
  orcamentoMs?: number
  /** Teto de imagens novas baixadas nesta execução. */
  maxImagens?: number
  /** Teto de documentos lidos nesta execução. */
  maxDocumentos?: number
}

export interface ResumoDaVarredura {
  colecaoInicial: string | null
  colecaoFinal: string | null
  documentosLidos: number
  documentosAtualizados: number
  camposTrocados: number
  imagensNovas: number
  falhas: number
  voltaCompleta: boolean
  encerradaPor: 'tempo' | 'imagens' | 'documentos' | 'fim-da-volta'
  duracaoMs: number
}

interface Estado {
  colecao: string | null
  ultimoId: unknown
  voltas: number
}

async function lerEstado(db: Db): Promise<Estado> {
  const doc = await db.collection(COLECAO_ESTADO).findOne({ _id: CHAVE_DO_ESTADO as never })
  return {
    colecao: (doc?.colecao as string) ?? null,
    ultimoId: doc?.ultimoId ?? null,
    voltas: Number(doc?.voltas) || 0,
  }
}

async function gravarEstado(db: Db, estado: Estado): Promise<void> {
  await db.collection(COLECAO_ESTADO).updateOne(
    { _id: CHAVE_DO_ESTADO as never },
    { $set: { ...estado, atualizadoEm: new Date() } },
    { upsert: true },
  )
}

async function colecoesElegiveis(db: Db): Promise<string[]> {
  const nomes = (await db.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name)
  return nomes
    .filter((n) => !n.startsWith('system.'))
    .filter((n) => !COLECOES_DA_MIGRACAO.has(n))
    .filter((n) => !COLECOES_DE_LOG.has(n))
    .sort()
}

/**
 * Uma passada limitada de varredura. Devolve o que fez — a rota de cron
 * transforma isso em log e em resposta JSON.
 */
export async function varrerUmPouco(db: Db, opcoes: OpcoesDaVarredura = {}): Promise<ResumoDaVarredura> {
  const comecou = Date.now()
  const limiteTempo = comecou + (opcoes.orcamentoMs ?? 240_000)
  const maxImagens = opcoes.maxImagens ?? 120
  const maxDocumentos = opcoes.maxDocumentos ?? 20_000

  const colecoes = await colecoesElegiveis(db)
  const estado = await lerEstado(db)

  const resumo: ResumoDaVarredura = {
    colecaoInicial: estado.colecao,
    colecaoFinal: estado.colecao,
    documentosLidos: 0,
    documentosAtualizados: 0,
    camposTrocados: 0,
    imagensNovas: 0,
    falhas: 0,
    voltaCompleta: false,
    encerradaPor: 'fim-da-volta',
    duracaoMs: 0,
  }

  if (colecoes.length === 0) {
    resumo.duracaoMs = Date.now() - comecou
    return resumo
  }

  // Uma coleção que sumiu (ou foi renomeada) entre duas execuções não pode
  // travar a varredura no lugar: nesse caso recomeça do início da lista.
  let indice = estado.colecao ? colecoes.indexOf(estado.colecao) : 0
  if (indice === -1) indice = 0
  let ultimoId = estado.colecao === colecoes[indice] ? estado.ultimoId : null

  // O mapa vive só nesta execução: é o que evita baixar duas vezes a mesma capa
  // citada por dois documentos vizinhos.
  const mapa = new Map<string, string>()
  const lote = new Date().toISOString().replace(/[:.]/g, '-')
  const diario = db.collection(COLECAO_DIARIO)

  let motivo: ResumoDaVarredura['encerradaPor'] = 'fim-da-volta'

  for (; indice < colecoes.length; indice += 1) {
    const nome = colecoes[indice]
    resumo.colecaoFinal = nome

    const filtro = ultimoId === null ? {} : { _id: { $gt: ultimoId } }
    const cursor = db.collection(nome).find(filtro as never, { batchSize: 100 }).sort({ _id: 1 })

    let terminouAColecao = true

    for await (const doc of cursor) {
      if (Date.now() > limiteTempo) {
        motivo = 'tempo'
      } else if (resumo.imagensNovas >= maxImagens) {
        motivo = 'imagens'
      } else if (resumo.documentosLidos >= maxDocumentos) {
        motivo = 'documentos'
      }

      if (motivo !== 'fim-da-volta') {
        terminouAColecao = false
        break
      }

      resumo.documentosLidos += 1
      ultimoId = doc._id

      const achados = coletarUrls(doc)
      if (achados.length === 0) continue

      const desconhecidas = Array.from(new Set(achados.map((a) => a.url))).filter((u) => !mapa.has(u))
      if (desconhecidas.length > 0) {
        const falhas = await falhasConhecidas(db, desconhecidas)
        for (const url of desconhecidas) {
          if (falhas.get(url)?.definitiva) {
            resumo.falhas += 1
            continue
          }
          const resultado = await internalizarUrl(db, url, { tentativas: 2 })
          if (resultado.ok) {
            mapa.set(url, resultado.caminho)
            if (!resultado.reaproveitado) resumo.imagensNovas += 1
          } else {
            resumo.falhas += 1
          }
        }
      }

      const plano = planejarReescrita(doc, mapa)
      const campos = Object.keys(plano.sets)
      if (campos.length === 0) continue

      await db.collection(nome).updateOne({ _id: doc._id }, { $set: plano.sets })
      await diario.insertOne({
        lote,
        origem: 'cron',
        colecao: nome,
        docId: doc._id,
        originais: plano.originais,
        novos: plano.sets,
        executadoEm: new Date(),
      })

      resumo.documentosAtualizados += 1
      resumo.camposTrocados += campos.length
    }

    await cursor.close()

    if (!terminouAColecao) break

    // Coleção inteira lida: a próxima começa do zero.
    ultimoId = null
  }

  if (indice >= colecoes.length) {
    resumo.voltaCompleta = true
    await gravarEstado(db, { colecao: colecoes[0], ultimoId: null, voltas: estado.voltas + 1 })
  } else {
    await gravarEstado(db, { colecao: colecoes[indice], ultimoId, voltas: estado.voltas })
  }

  resumo.encerradaPor = motivo
  resumo.duracaoMs = Date.now() - comecou
  return resumo
}
