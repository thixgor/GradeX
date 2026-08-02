import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { generateSlug } from '@/lib/utils/slug'
import { Patologia, AREAS_SAUDE, SISTEMAS_FISIOLOGICOS } from '@/lib/types/manual-clinico'

export const dynamic = 'force-dynamic'

interface ParseError {
  line?: number
  field: string
  message: string
}

interface ParsedPatologia {
  data: Partial<Patologia>
  errors: ParseError[]
  warnings: string[]
}

function parseFarmacos(text: string): { medicamento: string; classe: string; mecanismo_acao: string; dose_usual: string; efeitos_colaterais: string[]; contraindicacoes: string[] }[] {
  if (!text.trim()) return []

  const farmacos: any[] = []
  const blocos = text.split(/\n\s*-{3,}\s*\n|(?=\bMedicamento:\s)/i)

  for (const bloco of blocos) {
    if (!bloco.trim()) continue
    const farmaco: any = {
      medicamento: '',
      classe: '',
      mecanismo_acao: '',
      dose_usual: '',
      efeitos_colaterais: [],
      contraindicacoes: []
    }

    const lines = bloco.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('Medicamento:')) farmaco.medicamento = trimmed.replace('Medicamento:', '').trim()
      else if (trimmed.startsWith('Classe:')) farmaco.classe = trimmed.replace('Classe:', '').trim()
      else if (trimmed.startsWith('Mecanismo de Ação:') || trimmed.startsWith('Mecanismo:')) farmaco.mecanismo_acao = trimmed.replace(/Mecanismo( de Ação)?:/, '').trim()
      else if (trimmed.startsWith('Dose Usual:') || trimmed.startsWith('Dose:')) farmaco.dose_usual = trimmed.replace(/Dose( Usual)?:/, '').trim()
      else if (trimmed.startsWith('Efeitos Colaterais:') || trimmed.startsWith('Efeitos:')) {
        farmaco.efeitos_colaterais = trimmed.replace(/Efeitos( Colaterais)?:/, '').trim().split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
      }
      else if (trimmed.startsWith('Contraindicações:') || trimmed.startsWith('Contraindicacoes:')) {
        farmaco.contraindicacoes = trimmed.replace(/Contraindica(ç|c)(õ|o)es:/, '').trim().split(/[;,]/).map((s: string) => s.trim()).filter(Boolean)
      }
    }

    if (farmaco.medicamento) farmacos.push(farmaco)
  }

  return farmacos
}

function parsePatologiaText(text: string): ParsedPatologia {
  const errors: ParseError[] = []
  const warnings: string[] = []
  const data: Partial<Patologia> = {}

  const fieldMap: Record<string, string> = {
    'NOME': 'nome',
    'SINONIMOS': 'sinonimos',
    'SINÔNIMOS': 'sinonimos',
    'AREAS': 'areas',
    'ÁREAS': 'areas',
    'SISTEMA': 'sistema',
    'CLASSIFICACAO': 'classificacao',
    'CLASSIFICAÇÃO': 'classificacao',
    'FISIOPATOLOGIA': 'fisiopatologia',
    'DIAGNOSTICO_SEMIOLOGICO': 'diagnostico_semiologico',
    'DIAGNÓSTICO SEMIOLÓGICO': 'diagnostico_semiologico',
    'DIAGNOSTICOS_DIFERENCIAIS': 'diagnosticos_diferenciais',
    'DIAGNÓSTICOS DIFERENCIAIS': 'diagnosticos_diferenciais',
    'GRAVIDADE': 'gravidade',
    'TRATAMENTO': 'tratamento',
    'FARMACOLOGIA_PRIMEIRA_LINHA': 'farmacologia_primeira_linha',
    'FARMACOLOGIA_SEGUNDA_LINHA': 'farmacologia_segunda_linha',
    'FARMACOLOGIA_TERCEIRA_LINHA': 'farmacologia_terceira_linha',
    'FLUXOGRAMA_TRATAMENTO': 'fluxograma_tratamento',
    'FLUXOGRAMA': 'fluxograma_tratamento',
    'CID10': 'cid10',
    'CID-10': 'cid10',
    'IMAGENS': 'imagens_mecanismo',
    'IMAGENS_MECANISMO': 'imagens_mecanismo',
    'LEGENDA_IMAGENS': 'legenda_imagens',
    'LEGENDAS': 'legenda_imagens',
    'OBSERVACOES_CLINICAS': 'observacoes_clinicas',
    'OBSERVAÇÕES CLÍNICAS': 'observacoes_clinicas',
    'REFERENCIAS': 'referencias',
    'REFERÊNCIAS': 'referencias',
  }

  // Parse sections delimited by ##CAMPO: or [CAMPO]
  const sectionRegex = /(?:##\s*([A-ZÀ-ÚÇ0-9_\- ]+)\s*:|^\[([A-ZÀ-ÚÇ0-9_\- ]+)\])\s*/gm
  const sections: { key: string; content: string }[] = []
  let match: RegExpExecArray | null
  const matches: { key: string; startIndex: number; matchStart: number }[] = []

  while ((match = sectionRegex.exec(text)) !== null) {
    const key = (match[1] || match[2]).trim().toUpperCase()
    matches.push({ key, startIndex: match.index + match[0].length, matchStart: match.index })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].startIndex
    const end = i + 1 < matches.length ? matches[i + 1].matchStart : text.length
    sections.push({
      key: matches[i].key,
      content: text.substring(start, end).trim()
    })
  }

  // Processar cada seção
  const rawData: Record<string, string> = {}
  for (const section of sections) {
    const mapped = fieldMap[section.key]
    if (mapped) {
      rawData[mapped] = section.content
    } else {
      warnings.push(`Campo desconhecido ignorado: ${section.key}`)
    }
  }

  // Montar patologia
  data.nome = rawData.nome || ''
  data.sinonimos = rawData.sinonimos ? rawData.sinonimos.split(/[;,]/).map(s => s.trim()).filter(Boolean) : []
  // Match areas with accent-insensitive comparison
  if (rawData.areas) {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    data.areas = rawData.areas.split(/[;,]/).map(s => s.trim()).filter(Boolean).map(input => {
      const inputNorm = normalize(input)
      return AREAS_SAUDE.find(a => normalize(a) === inputNorm) || input
    }).filter(a => AREAS_SAUDE.includes(a as any)) as any[]
  } else {
    data.areas = []
  }
  // Match sistema with accent-insensitive comparison
  data.sistema = '' as any
  if (rawData.sistema) {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    const inputNorm = normalize(rawData.sistema)
    const matched = SISTEMAS_FISIOLOGICOS.find(s => normalize(s) === inputNorm)
    data.sistema = (matched || rawData.sistema) as any
  }
  data.classificacao = rawData.classificacao || ''
  data.fisiopatologia = rawData.fisiopatologia || ''
  data.diagnostico_semiologico = rawData.diagnostico_semiologico || ''
  data.diagnosticos_diferenciais = rawData.diagnosticos_diferenciais || ''
  data.gravidade = rawData.gravidade || ''
  data.tratamento = rawData.tratamento || ''
  data.fluxograma_tratamento = rawData.fluxograma_tratamento || ''
  data.cid10 = rawData.cid10 || ''
  data.observacoes_clinicas = rawData.observacoes_clinicas || ''
  data.referencias = rawData.referencias || ''

  // Farmacologia
  data.farmacologia = {
    primeira_linha: parseFarmacos(rawData.farmacologia_primeira_linha || ''),
    segunda_linha: parseFarmacos(rawData.farmacologia_segunda_linha || ''),
    terceira_linha: parseFarmacos(rawData.farmacologia_terceira_linha || ''),
  }

  // Imagens
  data.imagens_mecanismo = rawData.imagens_mecanismo
    ? rawData.imagens_mecanismo.split(/[\n;,]/).map(s => s.trim()).filter(Boolean)
    : []
  data.legenda_imagens = rawData.legenda_imagens
    ? rawData.legenda_imagens.split(/[\n;]/).map(s => s.trim()).filter(Boolean)
    : []

  // Validar campos obrigatórios
  if (!data.nome) errors.push({ field: 'nome', message: 'Nome é obrigatório' })
  if (!data.areas || data.areas.length === 0) errors.push({ field: 'areas', message: 'Pelo menos uma área de saúde é obrigatória' })
  if (!data.sistema) errors.push({ field: 'sistema', message: 'Sistema fisiológico é obrigatório' })
  else if (!SISTEMAS_FISIOLOGICOS.includes(data.sistema as any)) {
    errors.push({ field: 'sistema', message: `Sistema inválido: "${data.sistema}". Use um dos sistemas válidos.` })
  }

  return { data, errors, warnings }
}

// POST - Importar patologias por texto
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

    // Separar múltiplas patologias
    const blocos = texto.split('---NOVA_PATOLOGIA---').map(b => b.trim()).filter(Boolean)
    const resultados = blocos.map(bloco => parsePatologiaText(bloco))

    const db = await getDb()

    // Se não é para confirmar, retorna preview (já sinalizando duplicatas)
    if (!confirmar) {
      const seenSlugs = new Set<string>()
      const patologias = []
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
            const existing = await db.collection('patologias').findOne({ slug })
            if (existing) {
              duplicado = true
              duplicadoMsg = `Já existe uma patologia com o nome "${r.data.nome}" no banco de dados.`
            }
          }
          seenSlugs.add(slug)
        }
        patologias.push({
          index: i,
          nome: r.data.nome || `Patologia ${i + 1}`,
          data: r.data,
          errors: r.errors,
          warnings: r.warnings,
          duplicado,
          duplicadoMsg,
          valid: r.errors.length === 0 && !duplicado
        })
      }
      return NextResponse.json({ preview: true, patologias })
    }

    // Confirmar importação — salvar apenas as válidas e não-duplicadas
    const salvas: { nome: string; slug: string }[] = []
    const erros: { nome: string; errors: ParseError[] }[] = []
    const duplicados: { nome: string }[] = []

    for (const resultado of resultados) {
      if (resultado.errors.length > 0) {
        erros.push({ nome: resultado.data.nome || 'Sem nome', errors: resultado.errors })
        continue
      }

      const slug = generateSlug(resultado.data.nome!)
      const existing = await db.collection('patologias').findOne({ slug })
      if (existing) {
        duplicados.push({ nome: resultado.data.nome! })
        continue
      }

      // Strip _id (tipo string no schema de API) para o driver do Mongo criar um ObjectId
      const { _id: _ignored, ...rest } = resultado.data
      const patologia = {
        ...rest,
        slug,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection('patologias').insertOne(patologia)
      salvas.push({ nome: patologia.nome!, slug })
    }

    return NextResponse.json({
      success: true,
      salvas,
      erros,
      duplicados,
      totalSalvas: salvas.length,
      totalErros: erros.length,
      totalDuplicados: duplicados.length
    })
  } catch (error) {
    console.error('Erro ao importar patologias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
