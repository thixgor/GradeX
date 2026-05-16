type SearchablePatologia = {
  nome?: string
  sinonimos?: string[]
  cid10?: string
  sistema?: string
  areas?: string[]
}

const SEARCH_FIELDS = [
  'nome',
  'sinonimos',
  'cid10',
  'sistema',
  'areas',
  'classificacao',
  'fisiopatologia',
  'diagnostico_semiologico',
  'diagnosticos_diferenciais',
  'tratamento',
  'observacoes_clinicas',
  'referencias',
]

const IGNORED_TOKENS = new Set([
  'a',
  'as',
  'cid',
  'cid10',
  'da',
  'das',
  'de',
  'do',
  'dos',
  'e',
  'em',
  'na',
  'nas',
  'no',
  'nos',
  'o',
  'os',
])

const ACCENT_CLASSES: Record<string, string> = {
  a: 'aàáâãäåāăąǎª',
  c: 'cçćĉċč',
  e: 'eèéêëēĕėęě',
  i: 'iìíîïĩīĭįı',
  n: 'nñńņň',
  o: 'oòóôõöøōŏőº',
  u: 'uùúûüũūŭůűų',
  y: 'yýÿŷ',
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function compactText(value: unknown) {
  return normalizeText(value).replace(/\s+/g, '')
}

export function getManualSearchTokens(searchTerm: string) {
  const normalized = normalizeText(searchTerm)
  if (!normalized) return []

  return Array.from(new Set(
    normalized
      .split(' ')
      .map(token => token.replace(/^cid(?=[a-z]?\d)/, ''))
      .filter(token => token.length > 1 && !IGNORED_TOKENS.has(token))
      .slice(0, 8)
  ))
}

export function buildAccentInsensitivePattern(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  let pattern = ''
  let previousWasSpace = false

  for (const char of normalized) {
    if (/\s/.test(char)) {
      if (!previousWasSpace) pattern += '\\s+'
      previousWasSpace = true
      continue
    }

    previousWasSpace = false
    const lower = char.toLowerCase()

    if (ACCENT_CLASSES[lower]) {
      pattern += `[${ACCENT_CLASSES[lower]}]`
      continue
    }

    pattern += escapeRegex(char)
  }

  return pattern
}

function regexCondition(pattern: string) {
  return { $regex: pattern, $options: 'i' }
}

function fieldOr(pattern: string) {
  const regex = regexCondition(pattern)
  return {
    $or: SEARCH_FIELDS.map(field => ({ [field]: regex })),
  }
}

export function buildManualClinicoSearchFilter(searchTerm: string) {
  const trimmed = searchTerm.trim()
  if (!trimmed) return {}

  const tokens = getManualSearchTokens(trimmed)

  if (tokens.length > 0) {
    return {
      $and: tokens.map(token => fieldOr(buildAccentInsensitivePattern(token))),
    }
  }

  return fieldOr(buildAccentInsensitivePattern(trimmed))
}

function includesWholePhrase(value: string, query: string) {
  return value === query || value.startsWith(`${query} `) || value.endsWith(` ${query}`) || value.includes(` ${query} `)
}

function fieldScore(value: unknown, query: string, queryCompact: string, tokens: string[]) {
  const normalized = normalizeText(value)
  if (!normalized) return 0

  const compact = normalized.replace(/\s+/g, '')
  let score = 0

  if (normalized === query) score += 100000
  else if (compact === queryCompact) score += 98000
  else if (normalized.startsWith(query)) score += 70000
  else if (includesWholePhrase(normalized, query)) score += 52000
  else if (normalized.includes(query)) score += 42000

  const matchedTokens = tokens.filter(token => normalized.includes(token))
  if (tokens.length > 0 && matchedTokens.length === tokens.length) {
    score += 18000 + Math.max(0, 4000 - Math.abs(normalized.length - query.length))
  } else {
    score += matchedTokens.length * 1500
  }

  return score
}

export function scoreManualClinicoResult(patologia: SearchablePatologia, searchTerm: string) {
  const query = normalizeText(searchTerm)
  if (!query) return 0

  const tokens = getManualSearchTokens(searchTerm)
  const queryCompact = compactText(searchTerm)
  let score = 0

  score += fieldScore(patologia.cid10, query, queryCompact, tokens) * 1.1
  score += fieldScore(patologia.nome, query, queryCompact, tokens)

  for (const sinonimo of patologia.sinonimos || []) {
    score = Math.max(score, fieldScore(sinonimo, query, queryCompact, tokens) * 0.82)
  }

  score += fieldScore(patologia.sistema, query, queryCompact, tokens) * 0.28
  for (const area of patologia.areas || []) {
    score += fieldScore(area, query, queryCompact, tokens) * 0.2
  }

  return score
}

export function rankManualClinicoResults<T extends SearchablePatologia>(results: T[], searchTerm: string) {
  return [...results].sort((a, b) => {
    const scoreDiff = scoreManualClinicoResult(b, searchTerm) - scoreManualClinicoResult(a, searchTerm)
    if (scoreDiff !== 0) return scoreDiff

    const aName = normalizeText(a.nome)
    const bName = normalizeText(b.nome)
    return aName.localeCompare(bName, 'pt-BR')
  })
}
