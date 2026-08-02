import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { generateSlug } from '@/lib/utils/slug'
import {
  Medicamento,
  Contraindicacao,
  DoseCalculo,
  DoseCheck,
  TIPOS_FARMACO,
  CLASSES_MEDICAMENTOS_NAMES,
  normalizeClasse,
} from '@/lib/types/farmacologia'

export const dynamic = 'force-dynamic'

interface ParseError {
  field: string
  message: string
}

interface ParsedMedicamento {
  data: Partial<Medicamento>
  errors: ParseError[]
  warnings: string[]
}

const splitList = (text: string): string[] =>
  (text || '')
    .split(/[\n;]/)
    .map(s => s.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)

function parseContraindicacoes(text: string): Contraindicacao[] {
  if (!text.trim()) return []
  const out: Contraindicacao[] = []
  // Blocos separados por --- ou por nova ocorrência de "Condição:"
  const blocos = text.split(/\n\s*-{3,}\s*\n|(?=\bCondi(?:ç|c)(?:ã|a)o:\s)/i)

  for (const bloco of blocos) {
    if (!bloco.trim()) continue
    let condicao = ''
    let motivo = ''
    for (const raw of bloco.split('\n')) {
      const line = raw.trim()
      if (/^Condi(ç|c)(ã|a)o:/i.test(line)) condicao = line.replace(/^Condi(ç|c)(ã|a)o:/i, '').trim()
      else if (/^Motivo:/i.test(line) || /^Porqu(ê|e):/i.test(line) || /^Por que:/i.test(line)) {
        motivo = line.replace(/^(Motivo|Porqu(ê|e)|Por que):/i, '').trim()
      }
    }
    // Fallback: linha única "condição | motivo" ou "condição - motivo"
    if (!condicao) {
      const single = bloco.trim().split('\n')[0].trim()
      const m = single.split(/\s*[|—]\s*|\s+-\s+/)
      if (m.length >= 2) {
        condicao = m[0].trim()
        motivo = m.slice(1).join(' - ').trim()
      } else if (single) {
        condicao = single
      }
    }
    if (condicao) out.push({ condicao, motivo })
  }
  return out
}

function parseNumberOrNull(value: string): number | null {
  if (value == null) return null
  const cleaned = String(value).replace(',', '.').replace(/[^0-9.\-]/g, '').trim()
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function emptyDoseCalculo(): DoseCalculo {
  return {
    enabled: false,
    unidade: 'mg',
    via: '',
    mg_por_kg: null,
    dose_fixa: null,
    dose_min: null,
    dose_max: null,
    frequencia: '',
    ajuste_idoso_pct: null,
    fator_masculino: null,
    fator_feminino: null,
    observacao_calculo: '',
    checks: [],
  }
}

function parseDoseCalculo(text: string): DoseCalculo {
  const dose = emptyDoseCalculo()
  if (!text.trim()) return dose

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    // Check: <label> | contraindica  (ou | seguro)
    const checkMatch = line.match(/^Check:\s*(.+)$/i)
    if (checkMatch) {
      const body = checkMatch[1]
      const parts = body.split('|').map(s => s.trim())
      const label = parts[0]
      if (!label) continue
      const flag = (parts[1] || '').toLowerCase()
      const contraindica = /contraindic|contra-indic|contra|risco|evitar|nao|não/.test(flag)
      const motivo = parts[2] ? parts[2].trim() : ''
      const check: DoseCheck = { label, contraindica }
      if (motivo) check.motivo = motivo
      dose.checks.push(check)
      continue
    }

    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = normalizeClasse(line.slice(0, idx))
    const val = line.slice(idx + 1).trim()

    switch (key) {
      case 'unidade': dose.unidade = val || 'mg'; break
      case 'via': dose.via = val; break
      case 'dose por kg':
      case 'mg por kg':
      case 'mg/kg':
        dose.mg_por_kg = parseNumberOrNull(val); break
      case 'dose fixa': dose.dose_fixa = parseNumberOrNull(val); break
      case 'dose minima':
      case 'dose min':
        dose.dose_min = parseNumberOrNull(val); break
      case 'dose maxima':
      case 'dose max':
        dose.dose_max = parseNumberOrNull(val); break
      case 'frequencia': dose.frequencia = val; break
      case 'ajuste idoso (%)':
      case 'ajuste idoso':
        dose.ajuste_idoso_pct = parseNumberOrNull(val); break
      case 'fator masculino': dose.fator_masculino = parseNumberOrNull(val); break
      case 'fator feminino': dose.fator_feminino = parseNumberOrNull(val); break
      case 'observacao':
      case 'observacao calculo':
      case 'obs':
        dose.observacao_calculo = val; break
      default: break
    }
  }

  dose.enabled = dose.mg_por_kg != null || dose.dose_fixa != null
  return dose
}

function parseMedicamentoText(text: string): ParsedMedicamento {
  const errors: ParseError[] = []
  const warnings: string[] = []
  const data: Partial<Medicamento> = {}

  const fieldMap: Record<string, string> = {
    'NOME': 'nome',
    'SINONIMOS': 'sinonimos',
    'SINÔNIMOS': 'sinonimos',
    'NOMES_COMERCIAIS': 'nomes_comerciais',
    'NOMES COMERCIAIS': 'nomes_comerciais',
    'NOME_COMERCIAL': 'nomes_comerciais',
    'CLASSE': 'classe_principal',
    'CLASSE_PRINCIPAL': 'classe_principal',
    'SUBCLASSE': 'subclasse',
    'CLASSIFICACAO': 'classificacao',
    'CLASSIFICAÇÃO': 'classificacao',
    'TIPO': 'tipo_farmaco',
    'TIPO_FARMACO': 'tipo_farmaco',
    'PRINCIPAIS_FUNCOES': 'principais_funcoes',
    'PRINCIPAIS FUNÇÕES': 'principais_funcoes',
    'FUNCOES': 'principais_funcoes',
    'MECANISMO_COMPACTO': 'mecanismo_acao_compacto',
    'MECANISMO DE AÇÃO COMPACTO': 'mecanismo_acao_compacto',
    'MECANISMO_DETALHADO': 'mecanismo_acao_detalhado',
    'MECANISMO DE AÇÃO DETALHADO': 'mecanismo_acao_detalhado',
    'METABOLISMO': 'metabolismo',
    'EXCRECAO': 'excrecao',
    'EXCREÇÃO': 'excrecao',
    'EFEITOS_COLATERAIS': 'efeitos_colaterais',
    'EFEITOS COLATERAIS': 'efeitos_colaterais',
    'EFEITOS_ADVERSOS': 'efeitos_adversos',
    'EFEITOS ADVERSOS': 'efeitos_adversos',
    'CONTRAINDICACOES': 'contraindicacoes',
    'CONTRAINDICAÇÕES': 'contraindicacoes',
    'INTERACOES': 'interacoes_medicamentosas',
    'INTERACOES_MEDICAMENTOSAS': 'interacoes_medicamentosas',
    'INTERAÇÕES MEDICAMENTOSAS': 'interacoes_medicamentosas',
    'INTERAÇÕES': 'interacoes_medicamentosas',
    'POSOLOGIA': 'posologia',
    'CALCULO_DOSE': 'calculo_dose',
    'CÁLCULO DE DOSE': 'calculo_dose',
    'CALCULADORA': 'calculo_dose',
    'FLUXOGRAMA_USO': 'fluxograma_uso',
    'FLUXOGRAMA': 'fluxograma_uso',
    'FLUXOGRAMA DE USO': 'fluxograma_uso',
    'OBSERVACOES_CLINICAS': 'observacoes_clinicas',
    'OBSERVAÇÕES CLÍNICAS': 'observacoes_clinicas',
    'REFERENCIAS': 'referencias',
    'REFERÊNCIAS': 'referencias',
  }

  const sectionRegex = /(?:##\s*([A-ZÀ-ÚÇ0-9_\-%() /]+?)\s*:|^\[([A-ZÀ-ÚÇ0-9_\-%() /]+)\])\s*/gm
  const matches: { key: string; startIndex: number; matchStart: number }[] = []
  let match: RegExpExecArray | null
  while ((match = sectionRegex.exec(text)) !== null) {
    const key = (match[1] || match[2]).trim().toUpperCase()
    matches.push({ key, startIndex: match.index + match[0].length, matchStart: match.index })
  }

  const rawData: Record<string, string> = {}
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startIndex
    const end = i + 1 < matches.length ? matches[i + 1].matchStart : text.length
    const content = text.substring(start, end).trim()
    const mapped = fieldMap[matches[i].key]
    if (mapped) rawData[mapped] = content
    else warnings.push(`Campo desconhecido ignorado: ${matches[i].key}`)
  }

  data.nome = rawData.nome || ''
  data.sinonimos = rawData.sinonimos
    ? rawData.sinonimos.split(/[;,]/).map(s => s.trim()).filter(Boolean)
    : []
  data.nomes_comerciais = rawData.nomes_comerciais || ''

  // Classe (validação flexível: casa com a taxonomia ignorando acentos)
  data.classe_principal = ''
  if (rawData.classe_principal) {
    const inputNorm = normalizeClasse(rawData.classe_principal)
    const matched = CLASSES_MEDICAMENTOS_NAMES.find(c => normalizeClasse(c) === inputNorm)
    data.classe_principal = matched || rawData.classe_principal.trim()
    if (!matched) warnings.push(`Classe "${rawData.classe_principal.trim()}" não está na taxonomia padrão (será criada como classe personalizada).`)
  }

  data.subclasse = rawData.subclasse?.trim() || ''
  data.classificacao = rawData.classificacao || ''

  // Tipo do fármaco
  data.tipo_farmaco = ''
  if (rawData.tipo_farmaco) {
    const inputNorm = normalizeClasse(rawData.tipo_farmaco)
    const matched = TIPOS_FARMACO.find(t => normalizeClasse(t) === inputNorm)
    data.tipo_farmaco = (matched || rawData.tipo_farmaco.trim()) as any
  }

  data.principais_funcoes = rawData.principais_funcoes || ''
  data.mecanismo_acao_compacto = rawData.mecanismo_acao_compacto || ''
  data.mecanismo_acao_detalhado = rawData.mecanismo_acao_detalhado || ''
  data.metabolismo = rawData.metabolismo || ''
  data.excrecao = rawData.excrecao || ''
  data.efeitos_colaterais = splitList(rawData.efeitos_colaterais || '')
  data.efeitos_adversos = splitList(rawData.efeitos_adversos || '')
  data.contraindicacoes = parseContraindicacoes(rawData.contraindicacoes || '')
  data.interacoes_medicamentosas = rawData.interacoes_medicamentosas || ''
  data.posologia = rawData.posologia || ''
  data.calculo_dose = parseDoseCalculo(rawData.calculo_dose || '')
  data.fluxograma_uso = rawData.fluxograma_uso || ''
  data.observacoes_clinicas = rawData.observacoes_clinicas || ''
  data.referencias = rawData.referencias || ''

  // Validação de campos obrigatórios
  if (!data.nome) errors.push({ field: 'nome', message: 'Nome é obrigatório' })
  if (!data.classe_principal) errors.push({ field: 'classe', message: 'Classe principal é obrigatória (##CLASSE:)' })

  return { data, errors, warnings }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { texto, confirmar } = body

    if (!texto || typeof texto !== 'string') {
      return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 })
    }

    const blocos = texto
      .split(/---\s*NOVO[_ ]FARMACO\s*---/i)
      .map(b => b.trim())
      .filter(Boolean)
    const resultados = blocos.map(parseMedicamentoText)

    const db = await getDb()

    if (!confirmar) {
      const seenSlugs = new Set<string>()
      const medicamentos = []
      for (let i = 0; i < resultados.length; i++) {
        const r = resultados[i]
        let duplicado = false
        let duplicadoMsg = ''
        if (r.errors.length === 0 && r.data.nome) {
          const slug = generateSlug(r.data.nome)
          if (seenSlugs.has(slug)) {
            duplicado = true
            duplicadoMsg = `Já existe "${r.data.nome}" nesta mesma importação.`
          } else {
            const existing = await db.collection('medicamentos').findOne({ slug })
            if (existing) {
              duplicado = true
              duplicadoMsg = `Já existe um fármaco com o nome "${r.data.nome}" no banco de dados.`
            }
          }
          seenSlugs.add(slug)
        }
        medicamentos.push({
          index: i,
          nome: r.data.nome || `Fármaco ${i + 1}`,
          data: r.data,
          errors: r.errors,
          warnings: r.warnings,
          duplicado,
          duplicadoMsg,
          valid: r.errors.length === 0 && !duplicado,
        })
      }
      return NextResponse.json({ preview: true, medicamentos })
    }

    const salvas: { nome: string; slug: string }[] = []
    const erros: { nome: string; errors: ParseError[] }[] = []
    const duplicados: { nome: string }[] = []

    for (const resultado of resultados) {
      if (resultado.errors.length > 0) {
        erros.push({ nome: resultado.data.nome || 'Sem nome', errors: resultado.errors })
        continue
      }

      const slug = generateSlug(resultado.data.nome!)
      const existing = await db.collection('medicamentos').findOne({ slug })
      if (existing) {
        duplicados.push({ nome: resultado.data.nome! })
        continue
      }

      const { _id: _ignored, ...rest } = resultado.data
      const medicamento = {
        ...rest,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection('medicamentos').insertOne(medicamento as any)
      salvas.push({ nome: medicamento.nome!, slug })
    }

    return NextResponse.json({
      success: true,
      salvas,
      erros,
      duplicados,
      totalSalvas: salvas.length,
      totalErros: erros.length,
      totalDuplicados: duplicados.length,
    })
  } catch (error) {
    console.error('Erro ao importar medicamentos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
