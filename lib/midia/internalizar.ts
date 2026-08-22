/**
 * Internalização no momento da escrita.
 *
 * A migração em massa (`scripts/midia/sincronizar-imagens.mjs`) resolve o
 * passado. Este módulo resolve o futuro: quando um admin cola um link do Imgur
 * no editor de questão ou num TXT de importação, a imagem é trazida para o
 * nosso armazenamento antes de o documento ser gravado, e o que vai para o banco
 * já é o caminho interno.
 *
 * Sem isso, cada semana de uso normal recriaria parte do problema, e a migração
 * viraria uma tarefa recorrente em vez de um conserto.
 *
 * ## Três decisões que fazem isso ser seguro numa rota de escrita
 *
 * 1. **Nunca falha o salvamento.** Imagem que não baixa fica com a URL original.
 *    O admin perder o trabalho porque o Imgur devolveu 503 seria um remédio pior
 *    que a doença — e a varredura noturna pega o que sobrou.
 *
 * 2. **Tem orçamento de tempo.** Uma importação de TXT pode trazer 300 questões
 *    com imagem. Baixar todas dentro do request estouraria o limite da função,
 *    então o relógio corre: passado o orçamento, o resto fica para a varredura.
 *
 * 3. **Deduplica dentro do lote.** As questões de uma mesma prova costumam
 *    repetir a mesma figura; o mapa é montado uma vez para o lote inteiro.
 */

import 'server-only'
import type { Db } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { encontrarImagensExternas, substituirUrls } from './urls.ts'
import { coletarUrls } from './varredura.ts'
import { internalizarUrl } from './deposito.ts'

/** Orçamento padrão dentro de um request. Sobra folga no limite de 30s da função. */
const ORCAMENTO_PADRAO_MS = 12_000

/** Downloads simultâneos. Baixo de propósito: é o Imgur que dita o ritmo. */
const CONCORRENCIA = 4

export interface OpcoesDeInternalizacao {
  /** Tempo máximo gasto baixando imagens, em milissegundos. */
  orcamentoMs?: number
  /** Conexão já aberta. Ausente, o módulo abre a sua. */
  db?: Db
}

/**
 * `false` quando não há para onde enviar — em desenvolvimento sem token do
 * Blob, por exemplo. Aí a escrita segue com a URL original e nada quebra.
 *
 * O token é o do store PÚBLICO dedicado a `/midia` — `BLOB_READ_WRITE_TOKEN_MIDIA`
 * — e não o `BLOB_READ_WRITE_TOKEN` genérico, que aponta para o store PRIVADO
 * dos PDFs de materiais. Os dois nunca podem ser confundidos: um PDF de
 * material não pode ganhar URL pública, e uma imagem do acervo perde o sentido
 * se exigir autenticação para carregar numa página comum.
 */
export function internalizacaoDisponivel(): boolean {
  if (process.env.MIDIA_INTERNALIZAR_NA_ESCRITA === '0') return false
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN_MIDIA)
}

/** Token do store público de imagens. `undefined` se a internalização estiver desligada. */
export function tokenDoStoreDeMidia(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN_MIDIA
}

async function emParalelo<T>(itens: T[], n: number, tarefa: (item: T) => Promise<void>): Promise<void> {
  const fila = itens.slice()
  await Promise.all(
    Array.from({ length: Math.min(n, fila.length) }, async () => {
      for (;;) {
        const item = fila.shift()
        if (item === undefined) return
        await tarefa(item)
      }
    }),
  )
}

/**
 * Mapa `URL externa → caminho interno` para todas as URLs presentes nos textos.
 *
 * URLs que não puderam ser internalizadas simplesmente não entram no mapa, e
 * `substituirUrls` as deixa como estão.
 */
export async function mapearInternalizacao(
  textos: (string | null | undefined)[],
  opcoes: OpcoesDeInternalizacao = {},
): Promise<Map<string, string>> {
  const mapa = new Map<string, string>()
  if (!internalizacaoDisponivel()) return mapa

  const urls = new Set<string>()
  for (const texto of textos) {
    if (typeof texto !== 'string') continue
    for (const url of encontrarImagensExternas(texto)) urls.add(url)
  }
  if (urls.size === 0) return mapa

  const db = opcoes.db ?? (await getDb())
  const limite = Date.now() + (opcoes.orcamentoMs ?? ORCAMENTO_PADRAO_MS)

  await emParalelo(Array.from(urls), CONCORRENCIA, async (url) => {
    if (Date.now() > limite) return
    try {
      // Uma tentativa só: dentro de um request, insistir custa o orçamento das
      // imagens seguintes. A varredura noturna tem paciência; esta rota não.
      const resultado = await internalizarUrl(db, url, {
        tentativas: 1,
        timeoutMs: 8_000,
        token: tokenDoStoreDeMidia(),
      })
      if (resultado.ok) mapa.set(url, resultado.caminho)
    } catch (erro) {
      console.warn('[midia] falha ao internalizar na escrita:', url, erro)
    }
  })

  return mapa
}

/** Versão de um texto com as imagens externas já apontando para cá. */
export async function internalizarTexto(
  texto: string | null | undefined,
  opcoes: OpcoesDeInternalizacao = {},
): Promise<string | null | undefined> {
  if (typeof texto !== 'string' || !texto.includes('http')) return texto
  const mapa = await mapearInternalizacao([texto], opcoes)
  return mapa.size === 0 ? texto : substituirUrls(texto, mapa)
}

/**
 * Internaliza um lote de textos de uma vez.
 *
 * Devolve os textos na mesma ordem em que entraram — é o formato que serve
 * tanto para um punhado de campos de uma questão quanto para as centenas de
 * enunciados de uma importação.
 */
export async function internalizarLote(
  textos: (string | null | undefined)[],
  opcoes: OpcoesDeInternalizacao = {},
): Promise<(string | null | undefined)[]> {
  const mapa = await mapearInternalizacao(textos, opcoes)
  if (mapa.size === 0) return textos
  return textos.map((t) => (typeof t === 'string' ? substituirUrls(t, mapa) : t))
}

/**
 * Troca as imagens externas de um objeto inteiro, em qualquer profundidade.
 *
 * É a forma que as rotas de escrita usam: em vez de listar campo a campo — e
 * esquecer o `alternativas[].texto` na primeira vez que alguém colar um embed
 * lá dentro —, entrega-se o objeto e ele volta com os caminhos internos no
 * lugar. Devolve uma cópia; o original não é tocado.
 */
export async function internalizarObjeto<T>(valor: T, opcoes: OpcoesDeInternalizacao = {}): Promise<T> {
  if (!internalizacaoDisponivel()) return valor

  const urls = coletarUrls(valor).map((a) => a.url)
  if (urls.length === 0) return valor

  const mapa = await mapearInternalizacao(Array.from(new Set(urls)), opcoes)
  if (mapa.size === 0) return valor

  const trocar = (no: unknown): unknown => {
    if (typeof no === 'string') return substituirUrls(no, mapa)
    if (Array.isArray(no)) return no.map(trocar)
    if (no !== null && typeof no === 'object' && Object.getPrototypeOf(no) === Object.prototype) {
      return Object.fromEntries(Object.entries(no as Record<string, unknown>).map(([k, v]) => [k, trocar(v)]))
    }
    return no
  }

  return trocar(valor) as T
}
