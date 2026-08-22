/**
 * Ingestão de uma imagem externa para o armazenamento próprio.
 *
 * Baixa a URL, confere que é mesmo imagem, calcula o SHA-256 do conteúdo, envia
 * ao Vercel Blob num caminho derivado desse hash e registra o resultado em
 * `media_assets`. Devolve o caminho canônico (`/midia/<aa>/<sha>.<ext>`) que vai
 * substituir a URL original no banco.
 *
 * ## Por que recebe o `Db` por parâmetro
 *
 * Este módulo é usado por dois mundos: as rotas do admin (que já têm conexão
 * aberta via `lib/mongodb.ts`) e o script de migração, que roda fora do Next,
 * com `--experimental-strip-types` e sem o alias `@/`. Injetar a conexão é o que
 * permite o mesmo código servir aos dois — e mantém o módulo testável sem
 * levantar Mongo.
 *
 * ## Deduplicação em dois níveis
 *
 * 1. **Por origem.** A mesma URL do Imgur aparece em dezenas de documentos (a
 *    capa de um grupo é reaproveitada em todas as provas dele). A primeira
 *    consulta é por `origens`, e ela evita o download inteiro.
 * 2. **Por conteúdo.** Duas URLs diferentes podem servir os mesmos bytes — o
 *    admin subiu a mesma figura duas vezes no Imgur. O nome do arquivo é o hash,
 *    então o segundo envio cai no mesmo caminho e as duas origens passam a
 *    apontar para um arquivo só.
 *
 * ## Falhas são memória, não exceção
 *
 * Parte do acervo do Imgur já não existe — o serviço apagou o que era anônimo e
 * antigo. Essas URLs vão para `media_sync_falhas` com o motivo e a contagem de
 * tentativas, para que a próxima execução do script não gaste rede tentando de
 * novo o que já falhou de forma definitiva (404, imagem removida). O documento
 * original fica intocado: uma imagem quebrada apontando para o Imgur continua
 * quebrada, mas nada some do banco por conta da migração.
 */

import { put } from '@vercel/blob'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import type { Db } from 'mongodb'
import {
  caminhoCanonico,
  caminhoNoBlob,
  ehContentTypeDeImagem,
  extensaoPara,
} from './urls.ts'

export const COLECAO_ASSETS = 'media_assets'
export const COLECAO_FALHAS = 'media_sync_falhas'

/** Um arquivo internalizado, endereçado pelo hash do próprio conteúdo. */
export interface AssetDeMidia {
  sha256: string
  /** Caminho público gravado no banco e renderizado no site. */
  caminho: string
  /** Caminho dentro do store de blobs (o mesmo, sem a barra inicial). */
  caminhoBlob: string
  /** URL absoluta devolvida pelo fornecedor no envio. Só para diagnóstico. */
  urlBlob: string
  contentType: string
  bytes: number
  /** Toda URL externa que resolveu para estes bytes. */
  origens: string[]
  criadoEm: Date
  atualizadoEm: Date
}

export interface FalhaDeMidia {
  url: string
  motivo: string
  definitiva: boolean
  tentativas: number
  primeiraTentativaEm: Date
  ultimaTentativaEm: Date
}

/**
 * O único ponto do sistema que conhece o fornecedor de armazenamento.
 *
 * Recebe o caminho (derivado do hash), os bytes e o tipo, e devolve a URL
 * absoluta onde o arquivo passou a morar. Trocar de fornecedor — S3, R2, um
 * disco nosso — é escrever outra função com esta assinatura: o resto do sistema
 * fala em `/midia/<aa>/<sha>.<ext>` e não sabe quem serve.
 */
export type Armazenador = (
  caminhoNoStore: string,
  bytes: Buffer,
  contentType: string,
) => Promise<{ url: string }>

/** Implementação padrão: Vercel Blob. */
function armazenadorPadrao(token?: string): Armazenador {
  return (caminhoNoStore, bytes, contentType) =>
    put(caminhoNoStore, bytes, {
      access: 'public',
      addRandomSuffix: false,
      // O nome é o hash do conteúdo: reenviar os mesmos bytes no mesmo caminho é
      // um no-op semântico. Sem isto o SDK recusa o segundo envio de uma imagem
      // que dois documentos compartilham e a migração para no meio.
      allowOverwrite: true,
      contentType,
      cacheControlMaxAge: 31_536_000,
      ...(token ? { token } : {}),
    })
}

export interface OpcoesDeIngestao {
  /** Teto por arquivo. Acima disso a URL vira falha definitiva. */
  tamanhoMaximoBytes?: number
  /** Tentativas de download antes de desistir (só para erros transitórios). */
  tentativas?: number
  /** Timeout de cada tentativa, em milissegundos. */
  timeoutMs?: number
  /** Não grava nada: só diz o que aconteceria. Usado pelo `--dry-run`. */
  simular?: boolean
  /** Token do Blob. Ausente, o SDK lê `BLOB_READ_WRITE_TOKEN` do ambiente. */
  token?: string
  /** Substitui o fornecedor de armazenamento. Padrão: Vercel Blob. */
  armazenar?: Armazenador
  /**
   * Tenta de novo o que já falhou de forma definitiva (404, imagem removida).
   * Vale a pena quando a origem pode ter voltado; no dia a dia, não.
   */
  ignorarFalhasConhecidas?: boolean
}

export type ResultadoDaIngestao =
  | { ok: true; caminho: string; sha256: string; bytes: number; reaproveitado: boolean }
  | { ok: false; motivo: string; definitiva: boolean }

const TAMANHO_MAXIMO_PADRAO = 25 * 1024 * 1024
const TIMEOUT_PADRAO = 20_000
const TENTATIVAS_PADRAO = 3

/**
 * Um `User-Agent` de navegador.
 *
 * O Imgur devolve 429 e às vezes 403 para clientes que se identificam como
 * script. Como estamos baixando o nosso próprio acervo, e um por vez, imitar o
 * navegador é o que faz a migração terminar em vez de morrer na metade.
 */
const AGENTE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

/**
 * O Imgur não devolve 404 para imagem apagada: ele redireciona para um PNG de
 * aviso e responde 200. Sem esta checagem, cada imagem perdida viraria um asset
 * legítimo e a página trocaria a figura clínica pelo mascote triste do Imgur —
 * em silêncio, para sempre, porque o caminho passaria a ser interno.
 */
function ehPlaceholderDoImgur(urlFinal: string): boolean {
  try {
    return /\/removed\.(png|gif|jpg)$/i.test(new URL(urlFinal).pathname)
  } catch {
    return false
  }
}

function espera(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface Baixado {
  bytes: Buffer
  contentType: string
}

async function baixar(
  url: string,
  timeoutMs: number,
  tamanhoMaximoBytes: number,
): Promise<{ ok: true; dados: Baixado } | { ok: false; motivo: string; definitiva: boolean }> {
  const controlador = new AbortController()
  const relogio = setTimeout(() => controlador.abort(), timeoutMs)

  try {
    const resposta = await fetch(url, {
      signal: controlador.signal,
      redirect: 'follow',
      headers: { 'User-Agent': AGENTE, Accept: 'image/*,*/*;q=0.8' },
    })

    if (!resposta.ok) {
      const definitiva = resposta.status === 404 || resposta.status === 410 || resposta.status === 403
      return { ok: false, motivo: `HTTP ${resposta.status}`, definitiva }
    }

    if (ehPlaceholderDoImgur(resposta.url || url)) {
      return { ok: false, motivo: 'imagem removida na origem (placeholder do Imgur)', definitiva: true }
    }

    const contentType = resposta.headers.get('content-type') || ''
    if (!ehContentTypeDeImagem(contentType)) {
      return { ok: false, motivo: `content-type nao e imagem: ${contentType || 'ausente'}`, definitiva: true }
    }

    const declarado = Number(resposta.headers.get('content-length') || 0)
    if (declarado > tamanhoMaximoBytes) {
      return { ok: false, motivo: `arquivo de ${declarado} bytes acima do teto`, definitiva: true }
    }

    const buffer = Buffer.from(await resposta.arrayBuffer())
    if (buffer.byteLength === 0) {
      return { ok: false, motivo: 'resposta vazia', definitiva: false }
    }
    if (buffer.byteLength > tamanhoMaximoBytes) {
      return { ok: false, motivo: `arquivo de ${buffer.byteLength} bytes acima do teto`, definitiva: true }
    }

    return { ok: true, dados: { bytes: buffer, contentType: contentType.split(';')[0].trim() } }
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro)
    // Abort, DNS, reset de conexão: pode ser a rede, não a imagem.
    return { ok: false, motivo: mensagem, definitiva: false }
  } finally {
    clearTimeout(relogio)
  }
}

/** Caminho já internalizado para esta URL, ou `null` se ela nunca foi ingerida. */
export async function caminhoJaInternalizado(db: Db, url: string): Promise<string | null> {
  const doc = await db
    .collection<AssetDeMidia>(COLECAO_ASSETS)
    .findOne({ origens: url }, { projection: { caminho: 1 } })
  return doc?.caminho ?? null
}

/** Falhas já registradas para as URLs pedidas, por URL. */
export async function falhasConhecidas(db: Db, urls: string[]): Promise<Map<string, FalhaDeMidia>> {
  if (urls.length === 0) return new Map()
  const docs = await db
    .collection<FalhaDeMidia>(COLECAO_FALHAS)
    .find({ url: { $in: urls } })
    .toArray()
  return new Map(docs.map((d) => [d.url, d]))
}

async function registrarFalha(db: Db, url: string, motivo: string, definitiva: boolean): Promise<void> {
  const agora = new Date()
  await db.collection<FalhaDeMidia>(COLECAO_FALHAS).updateOne(
    { url },
    {
      $set: { motivo, definitiva, ultimaTentativaEm: agora },
      $setOnInsert: { url, primeiraTentativaEm: agora },
      $inc: { tentativas: 1 },
    },
    { upsert: true },
  )
}

/**
 * Traz uma URL externa para o armazenamento próprio e devolve o caminho interno.
 *
 * Idempotente: chamar duas vezes com a mesma URL não baixa duas vezes nem cria
 * dois arquivos. Nunca lança por causa da imagem — o erro vira
 * `{ ok: false }` para que uma figura perdida não derrube a migração inteira
 * nem o salvamento de uma questão.
 */
export async function internalizarUrl(
  db: Db,
  url: string,
  opcoes: OpcoesDeIngestao = {},
): Promise<ResultadoDaIngestao> {
  const tamanhoMaximoBytes = opcoes.tamanhoMaximoBytes ?? TAMANHO_MAXIMO_PADRAO
  const tentativas = Math.max(1, opcoes.tentativas ?? TENTATIVAS_PADRAO)
  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_PADRAO

  const jaTem = await caminhoJaInternalizado(db, url)
  if (jaTem) return { ok: true, caminho: jaTem, sha256: '', bytes: 0, reaproveitado: true }

  // Imagem que o Imgur já apagou não volta. Sem esta consulta, toda edição de
  // uma questão com figura morta esperaria o timeout do download de novo — e a
  // varredura noturna gastaria o orçamento inteiro relendo o cemitério.
  if (!opcoes.ignorarFalhasConhecidas) {
    const falha = await db
      .collection<FalhaDeMidia>(COLECAO_FALHAS)
      .findOne({ url, definitiva: true }, { projection: { motivo: 1 } })
    if (falha) return { ok: false, motivo: falha.motivo, definitiva: true }
  }

  let ultimoMotivo = 'falha desconhecida'
  let ultimaDefinitiva = false

  for (let tentativa = 1; tentativa <= tentativas; tentativa += 1) {
    const baixa = await baixar(url, timeoutMs, tamanhoMaximoBytes)

    if (!baixa.ok) {
      ultimoMotivo = baixa.motivo
      ultimaDefinitiva = baixa.definitiva
      if (baixa.definitiva) break
      if (tentativa < tentativas) await espera(500 * 2 ** (tentativa - 1))
      continue
    }

    const { bytes, contentType } = baixa.dados
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const extensao = extensaoPara(contentType, url)
    const caminho = caminhoCanonico(sha256, extensao)
    const pathBlob = caminhoNoBlob(sha256, extensao)

    if (opcoes.simular) {
      return { ok: true, caminho, sha256, bytes: bytes.byteLength, reaproveitado: false }
    }

    const colecao = db.collection<AssetDeMidia>(COLECAO_ASSETS)
    const mesmoConteudo = await colecao.findOne({ sha256 }, { projection: { caminho: 1 } })

    let urlBlob = ''
    if (!mesmoConteudo) {
      const armazenar = opcoes.armazenar ?? armazenadorPadrao(opcoes.token)
      try {
        const enviado = await armazenar(pathBlob, bytes, contentType)
        urlBlob = enviado.url
      } catch (erro) {
        // Store fora do ar, token expirado, cota estourada: é problema nosso, não
        // da imagem. Vira falha transitória — a URL original continua no
        // documento e a próxima execução tenta de novo — em vez de derrubar a
        // migração inteira no meio ou o salvamento de uma questão.
        const motivo = erro instanceof Error ? erro.message : String(erro)
        if (!opcoes.simular) await registrarFalha(db, url, `envio ao armazenamento: ${motivo}`, false)
        return { ok: false, motivo: `envio ao armazenamento: ${motivo}`, definitiva: false }
      }
    }

    const agora = new Date()
    await colecao.updateOne(
      { sha256 },
      {
        $setOnInsert: {
          sha256,
          caminho,
          caminhoBlob: pathBlob,
          urlBlob,
          contentType,
          bytes: bytes.byteLength,
          criadoEm: agora,
        },
        $set: { atualizadoEm: agora },
        $addToSet: { origens: url },
      },
      { upsert: true },
    )

    // Um sucesso apaga o histórico de falha: a imagem voltou.
    await db.collection(COLECAO_FALHAS).deleteOne({ url })

    return {
      ok: true,
      caminho: mesmoConteudo?.caminho ?? caminho,
      sha256,
      bytes: bytes.byteLength,
      reaproveitado: Boolean(mesmoConteudo),
    }
  }

  if (!opcoes.simular) await registrarFalha(db, url, ultimoMotivo, ultimaDefinitiva)
  return { ok: false, motivo: ultimoMotivo, definitiva: ultimaDefinitiva }
}

/** Índices que sustentam as consultas acima. Idempotente. */
export async function garantirIndicesDeMidia(db: Db): Promise<void> {
  await Promise.all([
    db.collection(COLECAO_ASSETS).createIndex({ sha256: 1 }, { unique: true }),
    db.collection(COLECAO_ASSETS).createIndex({ origens: 1 }),
    db.collection(COLECAO_ASSETS).createIndex({ caminho: 1 }, { unique: true }),
    db.collection(COLECAO_FALHAS).createIndex({ url: 1 }, { unique: true }),
  ])
}
