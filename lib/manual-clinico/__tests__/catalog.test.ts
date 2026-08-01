import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DRUG_COMPLETENESS_FIELDS,
  PATHOLOGY_COMPLETENESS_FIELDS,
  buildCatalogResponse,
  checkCatalogNames,
  computeCompleteness,
  parseCatalogCheckKind,
  parseCatalogKind,
  parseIncludeCompleteness,
  resolveAdminAccess,
  toCatalogDrug,
  toCatalogPathology,
  validateCatalogCheckNames,
} from '../catalog'

// ── Fixtures ──────────────────────────────────────────────────

const AVC: Record<string, any> = {
  _id: 'id-avc',
  nome: 'Acidente Vascular Cerebral',
  slug: 'acidente-vascular-cerebral',
  sinonimos: ['AVC', 'Derrame', 'AVE'],
  cid10: 'I64',
  sistema: 'Sistema Nervoso Central e Periférico',
  areas: ['Medicina'],
  updatedAt: new Date('2026-01-15T10:00:00.000Z'),
}

const HAS: Record<string, any> = {
  _id: 'id-has',
  nome: 'Hipertensão Arterial Sistêmica',
  slug: 'hipertensao-arterial-sistemica',
  sinonimos: ['HAS', 'pressão alta'],
  cid10: 'I10',
  sistema: 'Sistema Cardiovascular',
  areas: ['Medicina', 'Biomedicina'],
  classificacao: 'Primária',
  fisiopatologia: 'Aumento da resistência vascular periférica.',
  diagnostico_semiologico: 'Geralmente assintomática.',
  diagnosticos_diferenciais: 'Hipertensão do jaleco branco.',
  gravidade: 'Estágio 1',
  tratamento: 'MEV + farmacológico',
  farmacologia: {
    primeira_linha: [{ medicamento: 'Losartana' }],
    segunda_linha: [{ medicamento: 'Hidroclorotiazida' }],
    terceira_linha: [],
  },
  fluxograma_tratamento: 'Confirmar diagnóstico.',
  updatedAt: new Date('2026-02-20T08:30:00.000Z'),
}

const PARACETAMOL: Record<string, any> = {
  _id: 'id-paracetamol',
  nome: 'Paracetamol',
  slug: 'paracetamol',
  sinonimos: ['Acetaminofeno'],
  classe_principal: 'Analgésicos, Anti-inflamatórios e Antitérmicos',
  subclasse: 'Analgésicos não-opioides',
  updatedAt: new Date('2026-03-01T12:00:00.000Z'),
}

// ── normalizeManualContentName aplicada ao catalogo ───────────

test('catalogo expoe normalizedName sem acento e em minusculas', () => {
  const entry = toCatalogPathology(HAS, false)
  assert.equal(entry.name, 'Hipertensão Arterial Sistêmica')
  assert.equal(entry.normalizedName, 'hipertensao arterial sistemica')
})

// ── Serializacao / vazamento de conteudo ──────────────────────

test('entrada de patologia expoe apenas campos de identidade', () => {
  const entry = toCatalogPathology(HAS, true)
  assert.deepEqual(Object.keys(entry).sort(), [
    'cid10',
    'completeness',
    'id',
    'missingFields',
    'name',
    'normalizedName',
    'sistema',
    'slug',
    'status',
    'synonyms',
    'updatedAt',
  ])
})

test('entrada de farmaco expoe apenas campos de identidade', () => {
  const entry = toCatalogDrug(PARACETAMOL, true)
  assert.deepEqual(Object.keys(entry).sort(), [
    'classe',
    'completeness',
    'id',
    'missingFields',
    'name',
    'normalizedName',
    'slug',
    'status',
    'subclasse',
    'synonyms',
    'updatedAt',
  ])
})

test('nenhum valor de conteudo medico vaza na resposta', () => {
  const serialized = JSON.stringify(buildCatalogResponse({
    kind: 'all',
    includeCompleteness: true,
    pathologyDocs: [HAS],
    drugDocs: [PARACETAMOL],
  }))
  // Valores gravados nos campos de conteudo das fixtures. Nomes de
  // campo podem aparecer (missingFields lista campos faltando); o
  // texto clinico em si, nunca.
  for (const leak of [
    'Aumento da resistência vascular periférica.',
    'Geralmente assintomática.',
    'Hipertensão do jaleco branco.',
    'MEV + farmacológico',
    'Confirmar diagnóstico.',
    'Losartana',
    'Hidroclorotiazida',
    'Primária',
  ]) {
    assert.equal(serialized.includes(leak), false, `vazou: ${leak}`)
  }
})

test('status ausente no schema atual vira null, nao quebra', () => {
  assert.equal(toCatalogPathology(HAS, false).status, null)
  assert.equal(toCatalogPathology({ ...HAS, status: 'draft' }, false).status, 'draft')
})

test('updatedAt e serializado em ISO e tolera ausencia', () => {
  assert.equal(toCatalogPathology(HAS, false).updatedAt, '2026-02-20T08:30:00.000Z')
  assert.equal(toCatalogPathology({ ...HAS, updatedAt: undefined }, false).updatedAt, null)
})

test('entrada de farmaco expoe classe e subclasse', () => {
  const entry = toCatalogDrug(PARACETAMOL, false)
  assert.equal(entry.classe, 'Analgésicos, Anti-inflamatórios e Antitérmicos')
  assert.equal(entry.subclasse, 'Analgésicos não-opioides')
  assert.deepEqual(entry.synonyms, ['Acetaminofeno'])
})

// ── Completude ────────────────────────────────────────────────

test('patologia completa nao tem campos faltando', () => {
  const { completeness, missingFields } = computeCompleteness(
    HAS,
    PATHOLOGY_COMPLETENESS_FIELDS,
  )
  assert.deepEqual(missingFields, [])
  assert.equal(completeness, 100)
})

test('patologia incompleta lista os campos que faltam', () => {
  const { completeness, missingFields } = computeCompleteness(
    AVC,
    PATHOLOGY_COMPLETENESS_FIELDS,
  )
  assert.ok(missingFields.includes('fisiopatologia'))
  assert.ok(missingFields.includes('farmacologia.primeira_linha'))
  assert.equal(missingFields.includes('nome'), false)
  assert.ok(completeness > 0 && completeness < 100)
})

test('string em branco e array vazio contam como faltando', () => {
  const doc = { ...HAS, gravidade: '   ', areas: [] }
  const { missingFields } = computeCompleteness(doc, PATHOLOGY_COMPLETENESS_FIELDS)
  assert.ok(missingFields.includes('gravidade'))
  assert.ok(missingFields.includes('areas'))
})

test('calculo_dose so conta quando a calculadora esta habilitada', () => {
  const desabilitada = computeCompleteness(
    { ...PARACETAMOL, calculo_dose: { enabled: false, unidade: 'mg' } },
    DRUG_COMPLETENESS_FIELDS,
  )
  assert.ok(desabilitada.missingFields.includes('calculo_dose'))

  const habilitada = computeCompleteness(
    { ...PARACETAMOL, calculo_dose: { enabled: true, mg_por_kg: 15 } },
    DRUG_COMPLETENESS_FIELDS,
  )
  assert.equal(habilitada.missingFields.includes('calculo_dose'), false)
})

test('includeCompleteness=false omite completeness e missingFields', () => {
  const entry = toCatalogPathology(HAS, false)
  assert.equal('completeness' in entry, false)
  assert.equal('missingFields' in entry, false)
})

// ── Resposta do GET ───────────────────────────────────────────

test('kind=all devolve patologias e farmacos com resumo correto', () => {
  const res = buildCatalogResponse({
    kind: 'all',
    includeCompleteness: true,
    pathologyDocs: [HAS, AVC],
    drugDocs: [PARACETAMOL],
  })
  assert.deepEqual(res.summary, {
    pathologies: 2,
    drugs: 1,
    incompletePathologies: 1,
    incompleteDrugs: 1,
  })
  assert.equal(res.pathologies.length, 2)
  assert.equal(res.drugs.length, 1)
})

test('kind=pathology zera a secao de farmacos', () => {
  const res = buildCatalogResponse({
    kind: 'pathology',
    includeCompleteness: false,
    pathologyDocs: [HAS],
    drugDocs: [],
  })
  assert.equal(res.pathologies.length, 1)
  assert.deepEqual(res.drugs, [])
  assert.equal(res.summary.drugs, 0)
  assert.equal(res.summary.incompleteDrugs, 0)
})

test('kind=drug zera a secao de patologias', () => {
  const res = buildCatalogResponse({
    kind: 'drug',
    includeCompleteness: false,
    pathologyDocs: [],
    drugDocs: [PARACETAMOL],
  })
  assert.deepEqual(res.pathologies, [])
  assert.equal(res.summary.pathologies, 0)
  assert.equal(res.drugs.length, 1)
})

test('resumo continua correto mesmo com includeCompleteness=false', () => {
  const res = buildCatalogResponse({
    kind: 'all',
    includeCompleteness: false,
    pathologyDocs: [HAS, AVC],
    drugDocs: [],
  })
  assert.equal(res.summary.incompletePathologies, 1)
  assert.equal('completeness' in res.pathologies[0], false)
})

test('catalogo vazio devolve a forma esperada', () => {
  const res = buildCatalogResponse({
    kind: 'all',
    includeCompleteness: true,
    pathologyDocs: [],
    drugDocs: [],
  })
  assert.deepEqual(res, {
    summary: { pathologies: 0, drugs: 0, incompletePathologies: 0, incompleteDrugs: 0 },
    pathologies: [],
    drugs: [],
  })
})

// ── check: nome com e sem acento ──────────────────────────────

test('check casa nome sem acento com registro acentuado', () => {
  const res = checkCatalogNames(['Hipertensao Arterial Sistemica'], [HAS, AVC])
  assert.equal(res.existing.length, 1)
  assert.equal(res.missing.length, 0)
  assert.equal(res.existing[0].match.id, 'id-has')
  assert.equal(res.existing[0].match.matchedBy, 'normalizedName')
})

test('check casa nome acentuado exatamente igual ao gravado', () => {
  const res = checkCatalogNames(['Hipertensão Arterial Sistêmica'], [HAS])
  assert.equal(res.existing[0].match.matchedBy, 'name')
})

// ── check: caixa alta/baixa ───────────────────────────────────

test('check ignora maiusculas e minusculas', () => {
  for (const input of [
    'ACIDENTE VASCULAR CEREBRAL',
    'acidente vascular cerebral',
    'AcIdEnTe VaScUlAr CeReBrAl',
  ]) {
    const res = checkCatalogNames([input], [AVC, HAS])
    assert.equal(res.existing.length, 1, input)
    assert.equal(res.existing[0].match.id, 'id-avc')
  }
})

// ── check: espacos duplicados ─────────────────────────────────

test('check tolera espacos duplicados e nas pontas', () => {
  const res = checkCatalogNames(['  Acidente   Vascular  Cerebral  '], [AVC])
  assert.equal(res.existing.length, 1)
  assert.equal(res.existing[0].match.id, 'id-avc')
  assert.equal(res.existing[0].normalizedInput, 'acidente vascular cerebral')
})

test('check preserva o input original na resposta', () => {
  const res = checkCatalogNames(['  Acidente   Vascular  Cerebral  '], [AVC])
  assert.equal(res.existing[0].input, '  Acidente   Vascular  Cerebral  ')
})

// ── check: sinonimo ───────────────────────────────────────────

test('check casa por sinonimo e informa qual sinonimo casou', () => {
  const res = checkCatalogNames(['AVC'], [AVC, HAS])
  assert.equal(res.existing.length, 1)
  assert.equal(res.existing[0].match.matchedBy, 'synonym')
  assert.equal(res.existing[0].match.matchedSynonym, 'AVC')
  assert.equal(res.existing[0].match.id, 'id-avc')
})

test('check casa sinonimo acentuado sem acento', () => {
  const res = checkCatalogNames(['pressao alta'], [HAS, AVC])
  assert.equal(res.existing.length, 1)
  assert.equal(res.existing[0].match.matchedBy, 'synonym')
  assert.equal(res.existing[0].match.matchedSynonym, 'pressão alta')
})

test('match por nome tem prioridade sobre match por sinonimo', () => {
  const res = checkCatalogNames(['Acidente Vascular Cerebral'], [AVC])
  assert.equal(res.existing[0].match.matchedBy, 'name')
  assert.equal(res.existing[0].match.matchedSynonym, undefined)
})

// ── check: slug ───────────────────────────────────────────────

test('check casa por slug', () => {
  const res = checkCatalogNames(['acidente-vascular-cerebral'], [AVC, HAS])
  assert.equal(res.existing.length, 1)
  assert.equal(res.existing[0].match.matchedBy, 'slug')
})

// ── check: ausente ────────────────────────────────────────────

test('check reporta item ausente em missing', () => {
  const res = checkCatalogNames(['Miastenia Gravis'], [AVC, HAS])
  assert.deepEqual(res.existing, [])
  assert.deepEqual(res.ambiguous, [])
  assert.equal(res.missing.length, 1)
  assert.equal(res.missing[0].input, 'Miastenia Gravis')
  assert.equal(res.missing[0].normalizedInput, 'miastenia gravis')
})

test('check contra catalogo vazio devolve tudo em missing', () => {
  const res = checkCatalogNames(['Asma', 'Enxaqueca'], [])
  assert.equal(res.missing.length, 2)
  assert.equal(res.existing.length, 0)
})

// ── check: ambiguidade ────────────────────────────────────────

test('check nao escolhe silenciosamente quando ha dois candidatos', () => {
  const derrameProprio: Record<string, any> = {
    _id: 'id-derrame',
    nome: 'Derrame',
    slug: 'derrame',
    sinonimos: [],
  }
  // "Derrame" e nome de um doc e sinonimo de outro.
  const res = checkCatalogNames(['derrame'], [AVC, derrameProprio])
  assert.equal(res.existing.length, 0)
  assert.equal(res.missing.length, 0)
  assert.equal(res.ambiguous.length, 1)
  assert.equal(res.ambiguous[0].candidates.length, 2)
  const ids = res.ambiguous[0].candidates.map(c => c.id).sort()
  assert.deepEqual(ids, ['id-avc', 'id-derrame'])
})

test('ambiguidade preserva o motivo do match de cada candidato', () => {
  const duplicado: Record<string, any> = {
    _id: 'id-has-2',
    nome: 'Hipertensao Arterial Sistemica',
    slug: 'hipertensao-arterial-sistemica-2',
    sinonimos: [],
  }
  const res = checkCatalogNames(['Hipertensão Arterial Sistêmica'], [HAS, duplicado])
  assert.equal(res.ambiguous.length, 1)
  const byId = Object.fromEntries(
    res.ambiguous[0].candidates.map(c => [c.id, c.matchedBy]),
  )
  assert.equal(byId['id-has'], 'name')
  assert.equal(byId['id-has-2'], 'normalizedName')
})

test('um mesmo doc casando por varios criterios nao vira ambiguidade', () => {
  // "AVC" casa por sinonimo; o slug gerado nao colide com outro doc.
  const res = checkCatalogNames(['AVC'], [AVC])
  assert.equal(res.ambiguous.length, 0)
  assert.equal(res.existing.length, 1)
})

test('check processa varios nomes preservando a ordem de entrada', () => {
  const res = checkCatalogNames(
    ['Acidente Vascular Cerebral', 'Miastenia Gravis', 'HAS'],
    [AVC, HAS],
  )
  assert.equal(res.existing.length, 2)
  assert.equal(res.missing.length, 1)
  assert.equal(res.missing[0].input, 'Miastenia Gravis')
  assert.equal(res.existing[0].input, 'Acidente Vascular Cerebral')
  assert.equal(res.existing[1].match.matchedBy, 'synonym')
})

// ── Validacao de parametros ───────────────────────────────────

test('kind invalido no GET e rejeitado', () => {
  assert.equal(parseCatalogKind('banana'), null)
  assert.equal(parseCatalogKind('pathologies'), null)
  assert.equal(parseCatalogKind('Pathology'), null)
  assert.equal(parseCatalogKind('ALL'), null)
})

test('kind valido no GET e aceito e vazio vira all', () => {
  assert.equal(parseCatalogKind('all'), 'all')
  assert.equal(parseCatalogKind('pathology'), 'pathology')
  assert.equal(parseCatalogKind('drug'), 'drug')
  assert.equal(parseCatalogKind(null), 'all')
  assert.equal(parseCatalogKind(''), 'all')
})

test('kind invalido no check e rejeitado, inclusive "all"', () => {
  assert.equal(parseCatalogCheckKind('all'), null)
  assert.equal(parseCatalogCheckKind('banana'), null)
  assert.equal(parseCatalogCheckKind(undefined), null)
  assert.equal(parseCatalogCheckKind(123), null)
  assert.equal(parseCatalogCheckKind('pathology'), 'pathology')
  assert.equal(parseCatalogCheckKind('drug'), 'drug')
})

test('includeCompleteness aceita apenas true/false', () => {
  assert.equal(parseIncludeCompleteness('true'), true)
  assert.equal(parseIncludeCompleteness('false'), false)
  assert.equal(parseIncludeCompleteness(null), false)
  assert.equal(parseIncludeCompleteness(''), false)
  assert.equal(parseIncludeCompleteness('1'), null)
  assert.equal(parseIncludeCompleteness('sim'), null)
})

test('names invalido e rejeitado com mensagem', () => {
  assert.equal(validateCatalogCheckNames(undefined).ok, false)
  assert.equal(validateCatalogCheckNames('Asma').ok, false)
  assert.equal(validateCatalogCheckNames([]).ok, false)
  assert.equal(validateCatalogCheckNames(['Asma', 42]).ok, false)
  assert.equal(validateCatalogCheckNames(['Asma', '   ']).ok, false)
  assert.equal(validateCatalogCheckNames(new Array(501).fill('Asma')).ok, false)
})

test('names valido e aceito', () => {
  const res = validateCatalogCheckNames(['Asma', 'Enxaqueca'])
  assert.equal(res.ok, true)
  if (res.ok) assert.deepEqual(res.names, ['Asma', 'Enxaqueca'])
})

// ── Autenticacao ──────────────────────────────────────────────

test('usuario nao autenticado e barrado', () => {
  const semSessao = resolveAdminAccess(null)
  assert.equal(semSessao.allowed, false)
  assert.equal(semSessao.status, 403)
  assert.equal(semSessao.error, 'Acesso negado')

  assert.equal(resolveAdminAccess(undefined).allowed, false)
})

test('usuario autenticado sem role admin e barrado', () => {
  const comum = resolveAdminAccess({ role: 'user' })
  assert.equal(comum.allowed, false)
  assert.equal(comum.status, 403)

  assert.equal(resolveAdminAccess({}).allowed, false)
})

test('admin e liberado', () => {
  const admin = resolveAdminAccess({ role: 'admin' })
  assert.equal(admin.allowed, true)
  assert.equal(admin.status, 200)
})
