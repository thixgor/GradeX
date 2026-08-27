/**
 * Camada de dados das avaliações e das preferências de lembrete.
 *
 * Três coleções, cada uma com uma razão de existir:
 *
 * - `cronograma_avaliacoes` — a avaliação em si, com a config de lembrete
 *   dentro. Elas são de uma SEÇÃO e um PERÍODO, não de um aluno: quem entra
 *   depois na turma vê a mesma agenda sem ninguém precisar copiar nada.
 * - `cronograma_preferencias` — o opt-in do aluno e a seção que ele acompanha.
 *   Fica fora de `users` porque é escrito a cada clique no botão do calendário
 *   e não deveria disputar o documento do usuário com login e cobrança.
 * - `cronograma_lembretes_enviados` — o registro de disparos, com índice único
 *   por (avaliação, aluno, dia). É ele que garante a promessa de "sem spam":
 *   um cron que rode duas vezes, ou um retry, não manda o mesmo lembrete duas
 *   vezes no mesmo dia, porque a segunda inserção esbarra no índice.
 */

import 'server-only'

import { ObjectId, type Db } from 'mongodb'

import { getDb } from '@/lib/mongodb'
import { isDiaValido, isHoraValida } from './brasilia'
import { normalizarConfigLembrete } from './lembretes'
import {
  LEMBRETE_PADRAO,
  TIPOS_AVALIACAO,
  isSecaoCurso,
  normalizarSecao,
  type Avaliacao,
  type PreferenciasCronograma,
  type SecaoCurso,
  type TipoAvaliacao,
} from './tipos'

export const COLECAO_AVALIACOES = 'cronograma_avaliacoes'
export const COLECAO_PREFERENCIAS = 'cronograma_preferencias'
export const COLECAO_ENVIOS = 'cronograma_lembretes_enviados'

let indicesProntos = false

/**
 * Índices criados sob demanda, uma vez por processo.
 *
 * O único que não é performance é `avaliacaoId + userId + dia`: ele é a trava
 * de idempotência do cron, e um envio duplicado é justamente o defeito que o
 * aluno percebe.
 */
export async function garantirIndices(db: Db): Promise<void> {
  if (indicesProntos) return
  indicesProntos = true

  await Promise.allSettled([
    db.collection(COLECAO_AVALIACOES).createIndex({ secao: 1, periodo: 1, data: 1 }),
    db.collection(COLECAO_AVALIACOES).createIndex({ data: 1, publicada: 1 }),
    db.collection(COLECAO_PREFERENCIAS).createIndex({ userId: 1 }, { unique: true }),
    db.collection(COLECAO_PREFERENCIAS).createIndex({ secao: 1, periodo: 1, lembretesAtivos: 1 }),
    db.collection(COLECAO_ENVIOS).createIndex(
      { avaliacaoId: 1, userId: 1, dia: 1 },
      { unique: true, name: 'lembrete_unico_por_dia' },
    ),
    // Disparos são só para auditoria e antiduplicação; noventa dias depois já
    // não existe avaliação que possa reenviar.
    db.collection(COLECAO_ENVIOS).createIndex({ enviadoEm: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }),
  ])
}

// ── Serialização ────────────────────────────────────────────────────────────

export function serializarAvaliacao(doc: any): Avaliacao {
  return {
    _id: doc._id?.toString(),
    secao: doc.secao,
    periodo: doc.periodo,
    titulo: doc.titulo,
    tipo: doc.tipo,
    data: doc.data,
    hora: doc.hora || undefined,
    local: doc.local || undefined,
    conteudo: doc.conteudo || undefined,
    itensEmenta: Array.isArray(doc.itensEmenta) ? doc.itensEmenta : [],
    peso: typeof doc.peso === 'number' ? doc.peso : undefined,
    lembrete: normalizarConfigLembrete(doc.lembrete ?? LEMBRETE_PADRAO),
    publicada: doc.publicada !== false,
    criadaEm: doc.criadaEm instanceof Date ? doc.criadaEm.toISOString() : doc.criadaEm,
    atualizadaEm: doc.atualizadaEm instanceof Date ? doc.atualizadaEm.toISOString() : doc.atualizadaEm,
    criadaPor: doc.criadaPor,
  }
}

// ── Validação de entrada ────────────────────────────────────────────────────

export interface ResultadoValidacao {
  ok: boolean
  erro?: string
  dados?: Omit<Avaliacao, '_id'>
}

const TIPOS = TIPOS_AVALIACAO.map(t => t.id)

/**
 * Valida o corpo vindo do painel.
 *
 * Ao contrário da config de lembrete — que tolera bobagem e cai no padrão —,
 * aqui erro vira recusa: título, seção, período e data são o que dá sentido à
 * avaliação, e salvar uma "prova sem data" só produziria uma linha inútil na
 * agenda de uma turma inteira.
 */
export function validarAvaliacao(bruto: any, parcial = false): ResultadoValidacao {
  const entrada = bruto ?? {}

  const titulo = typeof entrada.titulo === 'string' ? entrada.titulo.trim().slice(0, 140) : ''
  if (!parcial && titulo.length < 2) return { ok: false, erro: 'Dê um título à avaliação.' }

  const secao = normalizarSecao(entrada.secao)
  if (!parcial && !secao) return { ok: false, erro: 'Escolha uma seção válida.' }

  const periodo = Math.round(Number(entrada.periodo))
  if (!parcial && (!Number.isFinite(periodo) || periodo < 1 || periodo > 12)) {
    return { ok: false, erro: 'Escolha um período entre 1 e 12.' }
  }

  if (!parcial && !isDiaValido(entrada.data)) {
    return { ok: false, erro: 'Informe a data no formato AAAA-MM-DD.' }
  }

  const hora = entrada.hora ? String(entrada.hora) : ''
  if (hora && !isHoraValida(hora)) return { ok: false, erro: 'Informe o horário no formato HH:MM.' }

  const tipo: TipoAvaliacao = TIPOS.includes(entrada.tipo) ? entrada.tipo : 'prova'

  const peso = Number(entrada.peso)

  return {
    ok: true,
    dados: {
      titulo,
      secao: (secao ?? 'medicina') as SecaoCurso,
      periodo,
      tipo,
      data: entrada.data,
      hora: hora || undefined,
      local: typeof entrada.local === 'string' ? entrada.local.trim().slice(0, 120) || undefined : undefined,
      conteudo: typeof entrada.conteudo === 'string' ? entrada.conteudo.trim().slice(0, 2000) || undefined : undefined,
      itensEmenta: Array.isArray(entrada.itensEmenta)
        ? entrada.itensEmenta.filter((id: unknown) => typeof id === 'string').slice(0, 200)
        : [],
      peso: Number.isFinite(peso) && peso > 0 ? Math.min(100, peso) : undefined,
      lembrete: normalizarConfigLembrete(entrada.lembrete),
      publicada: entrada.publicada !== false,
    },
  }
}

// ── Consultas ───────────────────────────────────────────────────────────────

export interface FiltroAvaliacoes {
  secao?: SecaoCurso | null
  periodo?: number | null
  /** Só avaliações a partir deste dia ("AAAA-MM-DD"). */
  desde?: string | null
  ate?: string | null
  /** `true` devolve só as publicadas — é o que o aluno pode ver. */
  somentePublicadas?: boolean
  busca?: string | null
  limite?: number
}

export async function listarAvaliacoes(filtro: FiltroAvaliacoes = {}): Promise<Avaliacao[]> {
  const db = await getDb()
  await garantirIndices(db)

  const query: Record<string, any> = {}
  if (filtro.secao && isSecaoCurso(filtro.secao)) query.secao = filtro.secao
  if (filtro.periodo) query.periodo = filtro.periodo
  if (filtro.somentePublicadas) query.publicada = { $ne: false }

  if (filtro.desde || filtro.ate) {
    query.data = {}
    if (filtro.desde) query.data.$gte = filtro.desde
    if (filtro.ate) query.data.$lte = filtro.ate
  }

  if (filtro.busca) {
    const escapado = filtro.busca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { titulo: { $regex: escapado, $options: 'i' } },
      { conteudo: { $regex: escapado, $options: 'i' } },
      { local: { $regex: escapado, $options: 'i' } },
    ]
  }

  const docs = await db
    .collection(COLECAO_AVALIACOES)
    .find(query)
    .sort({ data: 1, hora: 1 })
    .limit(Math.min(500, filtro.limite ?? 300))
    .toArray()

  return docs.map(serializarAvaliacao)
}

export async function getAvaliacao(id: string): Promise<Avaliacao | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const doc = await db.collection(COLECAO_AVALIACOES).findOne({ _id: new ObjectId(id) })
  return doc ? serializarAvaliacao(doc) : null
}

// ── Preferências do aluno ───────────────────────────────────────────────────

/**
 * Preferências do aluno, com um padrão que já é útil.
 *
 * `periodoSugerido` vem do período acadêmico calculado no cadastro
 * (`lib/user-periodo.ts`), então quem nunca abriu a tela cai no próprio
 * período em vez de no 1º — a diferença entre "já está do meu jeito" e
 * "configure antes de usar".
 *
 * A seção não tem equivalente: o cadastro ainda não pergunta o curso, e
 * Medicina é o padrão do site. A primeira escolha do aluno no seletor vira a
 * preferência dele e passa a ser essa resposta.
 */
export async function getPreferencias(
  userId: string,
  padroes: { periodoSugerido?: number | null } = {},
): Promise<PreferenciasCronograma> {
  const db = await getDb()
  await garantirIndices(db)

  const doc = await db.collection(COLECAO_PREFERENCIAS).findOne({ userId })

  const secao = normalizarSecao(doc?.secao) ?? 'medicina'
  const periodoBruto = Number(doc?.periodo ?? padroes.periodoSugerido ?? 1)
  const periodo = Number.isFinite(periodoBruto) ? Math.min(12, Math.max(1, Math.round(periodoBruto))) : 1

  return {
    lembretesAtivos: doc?.lembretesAtivos === true,
    secao,
    periodo,
    // Marca se a seção veio de uma escolha do aluno ou do padrão do site. É o
    // que decide se o seletor mostra o selo "sua" em alguma das seções.
    secaoEscolhida: normalizarSecao(doc?.secao) != null,
    atualizadoEm: doc?.atualizadoEm instanceof Date ? doc.atualizadoEm.toISOString() : doc?.atualizadoEm,
  }
}

export async function salvarPreferencias(
  userId: string,
  mudancas: Partial<Pick<PreferenciasCronograma, 'lembretesAtivos' | 'secao' | 'periodo'>>,
): Promise<PreferenciasCronograma> {
  const db = await getDb()
  await garantirIndices(db)

  const set: Record<string, any> = { atualizadoEm: new Date() }

  if (typeof mudancas.lembretesAtivos === 'boolean') set.lembretesAtivos = mudancas.lembretesAtivos

  const secao = normalizarSecao(mudancas.secao)
  if (secao) set.secao = secao

  if (mudancas.periodo != null) {
    const periodo = Math.round(Number(mudancas.periodo))
    if (Number.isFinite(periodo) && periodo >= 1 && periodo <= 12) set.periodo = periodo
  }

  await db.collection(COLECAO_PREFERENCIAS).updateOne(
    { userId },
    { $set: set, $setOnInsert: { userId, criadoEm: new Date() } },
    { upsert: true },
  )

  return getPreferencias(userId)
}
