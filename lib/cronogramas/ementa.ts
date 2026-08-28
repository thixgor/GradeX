/**
 * A ementa no banco.
 *
 * Antes ela era um JSON gerado por script e commitado no repositório — o que
 * transformava "corrigir um assunto do 3º período" numa tarefa de
 * desenvolvedor, com edição de markdown, `npm run`, commit e deploy. Agora é
 * conteúdo: o admin importa o mesmo markdown por `/admin/cronogramas` e a
 * mudança vale na hora, sem build.
 *
 * Um documento por (seção, período), com os tópicos inteiros dentro. A leitura
 * é sempre "a ementa DAQUELE período" — nunca um pedaço solto —, então
 * espalhar tópicos em documentos separados só criaria junção sem ninguém
 * pedindo.
 */

import 'server-only'

import type { Db } from 'mongodb'

import { getDb } from '@/lib/mongodb'
import { contarEmenta, isSecaoCurso, type EmentaTopico, type IndiceCurso, type SecaoCurso } from './tipos'
import { SECOES } from './tipos'

export const COLECAO_EMENTAS = 'cronograma_ementas'

export interface DocumentoEmenta {
  secao: SecaoCurso
  periodo: number
  topicos: EmentaTopico[]
  /** Nome dos arquivos que originaram esta importação, para o admin se achar. */
  origem?: string[]
  importadaEm?: Date
  importadaPor?: string
}

let indicesProntos = false

export async function garantirIndicesDaEmenta(db: Db): Promise<void> {
  if (indicesProntos) return
  indicesProntos = true
  await db
    .collection(COLECAO_EMENTAS)
    .createIndex({ secao: 1, periodo: 1 }, { unique: true, name: 'ementa_por_secao_periodo' })
    .catch(() => {})
}

/**
 * Cache de processo, curto.
 *
 * A ementa muda raramente (uma importação de vez em quando) mas é lida em toda
 * abertura da tela de cronogramas, por todo aluno. Trinta segundos deixam uma
 * rajada de navegação custar uma consulta só, e são curtos o bastante para o
 * admin ver a importação refletida quase imediatamente.
 */
const TTL_MS = 30_000
const cache = new Map<string, { em: number; topicos: EmentaTopico[] }>()
let cacheDoIndice: { em: number; indice: IndiceCurso[] } | null = null

/** Esquece o que está em cache. Chamado depois de importar ou remover. */
export function invalidarCacheDaEmenta(): void {
  cache.clear()
  cacheDoIndice = null
}

/** Tópicos de um período. Devolve `[]` quando ninguém importou esse período. */
export async function getEmenta(secao: SecaoCurso, periodo: number): Promise<EmentaTopico[]> {
  if (!isSecaoCurso(secao)) return []

  const chave = `${secao}:${periodo}`
  const guardado = cache.get(chave)
  if (guardado && Date.now() - guardado.em < TTL_MS) return guardado.topicos

  const db = await getDb()
  const doc = await db.collection<DocumentoEmenta>(COLECAO_EMENTAS).findOne(
    { secao, periodo },
    { projection: { topicos: 1 } },
  )

  const topicos = Array.isArray(doc?.topicos) ? doc!.topicos : []
  cache.set(chave, { em: Date.now(), topicos })
  return topicos
}

/**
 * O que existe de ementa importada, por curso — o que o seletor de seção usa
 * para saber quais períodos oferecer.
 *
 * Cursos sem nenhuma importação aparecem com a lista de períodos vazia, em vez
 * de sumirem: o seletor precisa mostrar as quatro seções sempre, e a tela do
 * aluno tem estado vazio próprio para "este período ainda não tem ementa".
 */
export async function getIndiceDeEmentas(): Promise<IndiceCurso[]> {
  if (cacheDoIndice && Date.now() - cacheDoIndice.em < TTL_MS) return cacheDoIndice.indice

  const db = await getDb()
  const docs = await db
    .collection<DocumentoEmenta>(COLECAO_EMENTAS)
    .find({}, { projection: { secao: 1, periodo: 1, topicos: 1 } })
    .toArray()

  const porSecao = new Map<SecaoCurso, IndiceCurso['periodos']>()
  for (const secao of SECOES) porSecao.set(secao.id, [])

  for (const doc of docs) {
    const lista = porSecao.get(doc.secao)
    if (!lista) continue
    const contagem = contarEmenta(doc.topicos ?? [])
    lista.push({
      periodo: doc.periodo,
      topicos: contagem.topicos,
      subtopicos: contagem.subtopicos,
      modulos: contagem.modulos,
      submodulos: contagem.submodulos,
      horas: Math.round(contagem.horas),
    })
  }

  const indice: IndiceCurso[] = SECOES.map(secao => ({
    id: secao.id,
    nome: secao.nome,
    periodos: (porSecao.get(secao.id) ?? []).sort((a, b) => a.periodo - b.periodo),
  }))

  cacheDoIndice = { em: Date.now(), indice }
  return indice
}

/** Períodos com ementa importada, em ordem. */
export async function getPeriodosDisponiveis(secao: SecaoCurso): Promise<number[]> {
  const indice = await getIndiceDeEmentas()
  return indice.find(curso => curso.id === secao)?.periodos.map(p => p.periodo) ?? []
}

/**
 * Resolve nomes legíveis para um punhado de ids da ementa. O admin marca
 * "conteúdo cobrado" por id; quem lê a avaliação precisa do nome, e guardar o
 * nome junto do id criaria uma cópia que envelhece na primeira correção.
 */
export async function resolverNomesDaEmenta(
  secao: SecaoCurso,
  periodo: number,
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {}

  const alvo = new Set(ids)
  const nomes: Record<string, string> = {}
  const topicos = await getEmenta(secao, periodo)

  for (const topico of topicos) {
    if (alvo.has(topico.id)) nomes[topico.id] = topico.nome
    for (const sub of topico.subtopicos) {
      if (alvo.has(sub.id)) nomes[sub.id] = sub.nome
      for (const modulo of sub.modulos) {
        if (alvo.has(modulo.id)) nomes[modulo.id] = modulo.nome
      }
    }
  }

  return nomes
}
