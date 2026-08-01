// ─────────────────────────────────────────────────────────────
// Catalogo do Manual Clinico — logica pura (sem acesso ao banco).
//
// Este modulo NAO importa lib/mongodb: as rotas fazem a leitura e
// passam os documentos brutos para as funcoes daqui. Isso mantem a
// logica testavel sem MONGODB_URI e garante que a serializacao seja
// explicita — nenhum campo de conteudo medico e copiado para a
// resposta por espalhamento acidental de objeto.
// ─────────────────────────────────────────────────────────────

import { normalizeManualContentName } from './normalize'
import { generateSlug } from '../utils/slug'

export type CatalogKind = 'all' | 'pathology' | 'drug'
export type CatalogCheckKind = 'pathology' | 'drug'

export const CATALOG_KINDS: CatalogKind[] = ['all', 'pathology', 'drug']
export const CATALOG_CHECK_KINDS: CatalogCheckKind[] = ['pathology', 'drug']

/** Como um nome consultado casou com um documento existente. */
export type CatalogMatchedBy = 'name' | 'normalizedName' | 'slug' | 'synonym'

// ── Campos considerados no calculo de completude ──────────────
// Patologias: os 13 campos marcados como obrigatorios em
// docs/IMPORTAÇÃO_PATOLOGIAS.md.
export const PATHOLOGY_COMPLETENESS_FIELDS = [
  'nome',
  'areas',
  'sistema',
  'cid10',
  'classificacao',
  'fisiopatologia',
  'diagnostico_semiologico',
  'diagnosticos_diferenciais',
  'gravidade',
  'tratamento',
  'farmacologia.primeira_linha',
  'farmacologia.segunda_linha',
  'fluxograma_tratamento',
] as const

// Farmacos: os 2 obrigatorios + os recomendados de
// docs/IMPORTACAO_FARMACOLOGIA.md.
export const DRUG_COMPLETENESS_FIELDS = [
  'nome',
  'classe_principal',
  'subclasse',
  'tipo_farmaco',
  'nomes_comerciais',
  'classificacao',
  'principais_funcoes',
  'mecanismo_acao_compacto',
  'mecanismo_acao_detalhado',
  'metabolismo',
  'excrecao',
  'efeitos_colaterais',
  'efeitos_adversos',
  'contraindicacoes',
  'interacoes_medicamentosas',
  'posologia',
  'calculo_dose',
  'fluxograma_uso',
  'observacoes_clinicas',
  'referencias',
] as const

export interface CatalogCompleteness {
  completeness: number
  missingFields: string[]
}

interface CatalogEntryBase {
  id: string
  name: string
  normalizedName: string
  slug: string
  synonyms: string[]
  status: string | null
  updatedAt: string | null
  completeness?: number
  missingFields?: string[]
}

export interface CatalogPathologyEntry extends CatalogEntryBase {
  cid10: string | null
  sistema: string | null
}

export interface CatalogDrugEntry extends CatalogEntryBase {
  classe: string | null
  subclasse: string | null
}

export interface CatalogSummary {
  pathologies: number
  drugs: number
  // null quando includeCompleteness=false: a rota nao le os campos de
  // conteudo nesse modo, entao nao teria como contar sem mentir.
  incompletePathologies: number | null
  incompleteDrugs: number | null
}

export interface CatalogResponse {
  summary: CatalogSummary
  pathologies: CatalogPathologyEntry[]
  drugs: CatalogDrugEntry[]
}

// ── Helpers ───────────────────────────────────────────────────

/** Le um caminho pontilhado ("farmacologia.primeira_linha") de um doc. */
function readPath(doc: Record<string, any>, path: string): unknown {
  return path.split('.').reduce<any>(
    (acc, key) => (acc == null ? undefined : acc[key]),
    doc,
  )
}

/**
 * Um campo conta como preenchido quando tem conteudo util: string
 * nao vazia apos trim, array com ao menos um item, numero finito.
 * `calculo_dose` e um caso a parte — so conta quando a calculadora
 * esta de fato habilitada.
 */
export function isFieldFilled(value: unknown, field?: string): boolean {
  if (field === 'calculo_dose') {
    return !!value && typeof value === 'object' && (value as any).enabled === true
  }
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (typeof value === 'boolean') return true
  // Antes do caso generico: Object.keys(new Date()) e [], o que faria
  // uma data valida contar como campo vazio.
  if (value instanceof Date) return !Number.isNaN(value.getTime())
  if (typeof value === 'object') return Object.keys(value as object).length > 0
  return false
}

/** Percentual de campos preenchidos + a lista dos que faltam. */
export function computeCompleteness(
  doc: Record<string, any>,
  fields: readonly string[],
): CatalogCompleteness {
  const missingFields = fields.filter(
    field => !isFieldFilled(readPath(doc, field), field),
  )
  const filled = fields.length - missingFields.length
  const completeness = fields.length === 0
    ? 100
    : Math.round((filled / fields.length) * 100)
  return { completeness, missingFields: [...missingFields] }
}

function toStringOrNull(value: unknown): string | null {
  if (value == null) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

function toIsoOrNull(value: unknown): string | null {
  if (value == null) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString()
  }
  // Nao passar por String(): `new Date(String(1700000000000))` e
  // Invalid Date, enquanto `new Date(1700000000000)` e valido.
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map(item => String(item ?? '').trim())
    .filter(item => item.length > 0)
}

// ── Serializacao ──────────────────────────────────────────────
// Campos montados um a um de proposito: a rota e de catalogo e nao
// pode devolver fisiopatologia, tratamento, posologia etc.

export function toCatalogPathology(
  doc: Record<string, any>,
  includeCompleteness: boolean,
): CatalogPathologyEntry {
  const name = String(doc.nome ?? '')
  const entry: CatalogPathologyEntry = {
    id: String(doc._id ?? ''),
    name,
    normalizedName: normalizeManualContentName(name),
    slug: String(doc.slug ?? ''),
    synonyms: toStringList(doc.sinonimos),
    cid10: toStringOrNull(doc.cid10),
    sistema: toStringOrNull(doc.sistema),
    status: toStringOrNull(doc.status),
    updatedAt: toIsoOrNull(doc.updatedAt),
  }
  if (includeCompleteness) {
    const { completeness, missingFields } = computeCompleteness(
      doc,
      PATHOLOGY_COMPLETENESS_FIELDS,
    )
    entry.completeness = completeness
    entry.missingFields = missingFields
  }
  return entry
}

export function toCatalogDrug(
  doc: Record<string, any>,
  includeCompleteness: boolean,
): CatalogDrugEntry {
  const name = String(doc.nome ?? '')
  const entry: CatalogDrugEntry = {
    id: String(doc._id ?? ''),
    name,
    normalizedName: normalizeManualContentName(name),
    slug: String(doc.slug ?? ''),
    synonyms: toStringList(doc.sinonimos),
    classe: toStringOrNull(doc.classe_principal),
    subclasse: toStringOrNull(doc.subclasse),
    status: toStringOrNull(doc.status),
    updatedAt: toIsoOrNull(doc.updatedAt),
  }
  if (includeCompleteness) {
    const { completeness, missingFields } = computeCompleteness(
      doc,
      DRUG_COMPLETENESS_FIELDS,
    )
    entry.completeness = completeness
    entry.missingFields = missingFields
  }
  return entry
}

// ── Ordenacao ─────────────────────────────────────────────────
// Feita aqui, e nao com .sort() no Mongo, de proposito: nao existe
// indice em `patologias.nome`, e o indice composto de `medicamentos`
// so e criado no ramo de desenvolvimento de lib/mongodb.ts. Sem
// indice e sem limit, o Mongo faz um blocking sort em memoria com
// teto de 32 MB e derruba a query quando a colecao cresce. Os
// documentos ja estao todos em memoria do processo aqui, entao
// ordenar em JS custa praticamente nada e remove esse risco.

/** Ordena por chaves ja calculadas (decorate-sort-undecorate). */
function sortByKeys<T>(entries: T[], keysOf: (entry: T) => string[]): T[] {
  return entries
    .map(entry => ({ entry, keys: keysOf(entry) }))
    .sort((a, b) => {
      for (let i = 0; i < a.keys.length; i++) {
        if (a.keys[i] < b.keys[i]) return -1
        if (a.keys[i] > b.keys[i]) return 1
      }
      return 0
    })
    .map(item => item.entry)
}

/** Patologias por nome (sem acento/caixa), id como desempate estavel. */
export function sortCatalogPathologies(
  entries: CatalogPathologyEntry[],
): CatalogPathologyEntry[] {
  return sortByKeys(entries, entry => [entry.normalizedName, entry.id])
}

/** Farmacos por classe, subclasse e nome — mesma ordem do painel. */
export function sortCatalogDrugs(entries: CatalogDrugEntry[]): CatalogDrugEntry[] {
  return sortByKeys(entries, entry => [
    normalizeManualContentName(entry.classe),
    normalizeManualContentName(entry.subclasse),
    entry.normalizedName,
    entry.id,
  ])
}

export function buildCatalogResponse(options: {
  kind: CatalogKind
  includeCompleteness: boolean
  pathologyDocs: Record<string, any>[]
  drugDocs: Record<string, any>[]
}): CatalogResponse {
  const { kind, includeCompleteness, pathologyDocs, drugDocs } = options
  const wantsPathologies = kind === 'all' || kind === 'pathology'
  const wantsDrugs = kind === 'all' || kind === 'drug'

  // A completude e calculada uma unica vez por documento, dentro de
  // toCatalogX, e os contadores do resumo saem dai — nada de um
  // segundo passe recalculando tudo.
  const pathologies = wantsPathologies
    ? sortCatalogPathologies(
        pathologyDocs.map(doc => toCatalogPathology(doc, includeCompleteness)),
      )
    : []
  const drugs = wantsDrugs
    ? sortCatalogDrugs(drugDocs.map(doc => toCatalogDrug(doc, includeCompleteness)))
    : []

  const countIncomplete = (
    entries: CatalogEntryBase[],
    wanted: boolean,
  ): number | null => {
    if (!includeCompleteness) return null
    if (!wanted) return 0
    return entries.filter(entry => (entry.missingFields?.length ?? 0) > 0).length
  }

  return {
    summary: {
      pathologies: wantsPathologies ? pathologyDocs.length : 0,
      drugs: wantsDrugs ? drugDocs.length : 0,
      incompletePathologies: countIncomplete(pathologies, wantsPathologies),
      incompleteDrugs: countIncomplete(drugs, wantsDrugs),
    },
    pathologies,
    drugs,
  }
}

// ── Verificacao de nomes (POST .../catalog/check) ─────────────

export interface CatalogCheckCandidate {
  id: string
  name: string
  slug: string
  matchedBy: CatalogMatchedBy
  /** Preenchido apenas quando matchedBy === 'synonym'. */
  matchedSynonym?: string
}

export interface CatalogCheckExisting {
  input: string
  normalizedInput: string
  match: CatalogCheckCandidate
}

export interface CatalogCheckMissing {
  input: string
  normalizedInput: string
}

export interface CatalogCheckAmbiguous {
  input: string
  normalizedInput: string
  candidates: CatalogCheckCandidate[]
}

export interface CatalogCheckResult {
  existing: CatalogCheckExisting[]
  missing: CatalogCheckMissing[]
  ambiguous: CatalogCheckAmbiguous[]
}

/** Documento com as chaves de comparacao ja normalizadas uma vez. */
interface IndexedCatalogDoc {
  key: string
  id: string
  name: string
  slug: string
  trimmedName: string
  normalizedName: string
  synonyms: { raw: string; normalized: string }[]
}

export interface CatalogNameIndex {
  docs: IndexedCatalogDoc[]
  byTrimmedName: Map<string, IndexedCatalogDoc[]>
  byNormalizedName: Map<string, IndexedCatalogDoc[]>
  bySlug: Map<string, IndexedCatalogDoc[]>
  byNormalizedSynonym: Map<string, IndexedCatalogDoc[]>
}

function pushTo(
  map: Map<string, IndexedCatalogDoc[]>,
  key: string,
  doc: IndexedCatalogDoc,
): void {
  if (!key) return
  const bucket = map.get(key)
  if (bucket) bucket.push(doc)
  else map.set(key, [doc])
}

/**
 * Normaliza cada documento UMA vez e monta os indices de busca.
 *
 * Sem isso, casar N nomes contra M documentos renormalizaria o nome e
 * os sinonimos de cada documento N vezes (O(N x M) normalizacoes).
 * Com os indices, cada nome consultado vira lookup O(1).
 */
export function buildCatalogNameIndex(
  docs: Record<string, any>[],
): CatalogNameIndex {
  const index: CatalogNameIndex = {
    docs: [],
    byTrimmedName: new Map(),
    byNormalizedName: new Map(),
    bySlug: new Map(),
    byNormalizedSynonym: new Map(),
  }

  for (const doc of docs) {
    const id = String(doc._id ?? '')
    const name = String(doc.nome ?? '')
    const slug = String(doc.slug ?? '')
    const indexed: IndexedCatalogDoc = {
      key: id || `${slug}|${name}`,
      id,
      name,
      slug,
      trimmedName: name.trim(),
      normalizedName: normalizeManualContentName(name),
      synonyms: toStringList(doc.sinonimos).map(raw => ({
        raw,
        normalized: normalizeManualContentName(raw),
      })),
    }

    index.docs.push(indexed)
    pushTo(index.byTrimmedName, indexed.trimmedName, indexed)
    pushTo(index.byNormalizedName, indexed.normalizedName, indexed)
    pushTo(index.bySlug, indexed.slug, indexed)
    for (const synonym of indexed.synonyms) {
      pushTo(index.byNormalizedSynonym, synonym.normalized, indexed)
    }
  }

  return index
}

/**
 * Motivo pelo qual um documento ja identificado como candidato casou.
 * A prioridade e por documento: nome original > nome normalizado >
 * slug > sinonimo. Comparacoes O(1) sobre valores pre-normalizados.
 */
function resolveMatchedBy(
  trimmedInput: string,
  normalizedInput: string,
  slugInput: string,
  doc: IndexedCatalogDoc,
): CatalogCheckCandidate | null {
  const base = { id: doc.id, name: doc.name, slug: doc.slug }

  if (doc.trimmedName.length > 0 && doc.trimmedName === trimmedInput) {
    return { ...base, matchedBy: 'name' }
  }
  if (normalizedInput.length > 0 && doc.normalizedName === normalizedInput) {
    return { ...base, matchedBy: 'normalizedName' }
  }
  if (doc.slug.length > 0 && slugInput.length > 0 && doc.slug === slugInput) {
    return { ...base, matchedBy: 'slug' }
  }
  for (const synonym of doc.synonyms) {
    if (normalizedInput.length > 0 && synonym.normalized === normalizedInput) {
      return { ...base, matchedBy: 'synonym', matchedSynonym: synonym.raw }
    }
  }
  return null
}

/**
 * Classifica cada nome consultado em existing / missing / ambiguous.
 *
 * Quando mais de um documento distinto casa com o mesmo nome, o
 * resultado vai para `ambiguous` com todos os candidatos — nunca se
 * escolhe um silenciosamente.
 *
 * Aceita um indice ja pronto (buildCatalogNameIndex) para quem for
 * consultar varias vezes a mesma lista de documentos.
 */
export function checkCatalogNames(
  names: string[],
  docsOrIndex: Record<string, any>[] | CatalogNameIndex,
): CatalogCheckResult {
  const index = Array.isArray(docsOrIndex)
    ? buildCatalogNameIndex(docsOrIndex)
    : docsOrIndex
  const result: CatalogCheckResult = { existing: [], missing: [], ambiguous: [] }

  for (const rawInput of names) {
    const trimmedInput = rawInput.trim()
    const normalizedInput = normalizeManualContentName(rawInput)
    const slugInput = generateSlug(rawInput)

    // Só os documentos que algum indice apontou entram na avaliacao.
    const hits = new Map<string, IndexedCatalogDoc>()
    const collect = (bucket: IndexedCatalogDoc[] | undefined) => {
      if (!bucket) return
      for (const doc of bucket) if (!hits.has(doc.key)) hits.set(doc.key, doc)
    }
    collect(index.byTrimmedName.get(trimmedInput))
    collect(index.byNormalizedName.get(normalizedInput))
    collect(index.bySlug.get(slugInput))
    collect(index.byNormalizedSynonym.get(normalizedInput))

    const candidates: CatalogCheckCandidate[] = []
    for (const doc of hits.values()) {
      const candidate = resolveMatchedBy(
        trimmedInput,
        normalizedInput,
        slugInput,
        doc,
      )
      if (candidate) candidates.push(candidate)
    }

    if (candidates.length === 0) {
      result.missing.push({ input: rawInput, normalizedInput })
    } else if (candidates.length === 1) {
      result.existing.push({
        input: rawInput,
        normalizedInput,
        match: candidates[0],
      })
    } else {
      result.ambiguous.push({ input: rawInput, normalizedInput, candidates })
    }
  }

  return result
}

// ── Validacao de entrada ──────────────────────────────────────

export function parseCatalogKind(value: string | null): CatalogKind | null {
  if (value == null || value === '') return 'all'
  return CATALOG_KINDS.includes(value as CatalogKind)
    ? (value as CatalogKind)
    : null
}

export function parseCatalogCheckKind(value: unknown): CatalogCheckKind | null {
  return typeof value === 'string' &&
    CATALOG_CHECK_KINDS.includes(value as CatalogCheckKind)
    ? (value as CatalogCheckKind)
    : null
}

/** `includeCompleteness` aceita apenas "true"/"false"; default false. */
export function parseIncludeCompleteness(value: string | null): boolean | null {
  if (value == null || value === '') return false
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

export const CATALOG_CHECK_MAX_NAMES = 500

export type CatalogNamesValidation =
  | { ok: true; names: string[] }
  | { ok: false; error: string }

export function validateCatalogCheckNames(value: unknown): CatalogNamesValidation {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'Campo "names" deve ser um array de strings.' }
  }
  if (value.length === 0) {
    return { ok: false, error: 'Campo "names" nao pode ser vazio.' }
  }
  if (value.length > CATALOG_CHECK_MAX_NAMES) {
    return {
      ok: false,
      error: `Maximo de ${CATALOG_CHECK_MAX_NAMES} nomes por consulta.`,
    }
  }
  if (value.some(name => typeof name !== 'string')) {
    return { ok: false, error: 'Campo "names" deve conter apenas strings.' }
  }
  if (value.some(name => (name as string).trim().length === 0)) {
    return { ok: false, error: 'Campo "names" nao pode conter nomes vazios.' }
  }
  return { ok: true, names: value as string[] }
}

// ── Autorizacao ───────────────────────────────────────────────

export interface AdminAccessDecision {
  allowed: boolean
  status: number
  error?: string
}

/**
 * Mesma politica das demais rotas de /api/admin: sessao ausente ou
 * role diferente de "admin" devolve 403 "Acesso negado". O
 * middleware ja barra requisicao sem token antes de chegar aqui.
 */
export function resolveAdminAccess(
  session: { role?: string } | null | undefined,
): AdminAccessDecision {
  if (!session || session.role !== 'admin') {
    return { allowed: false, status: 403, error: 'Acesso negado' }
  }
  return { allowed: true, status: 200 }
}
