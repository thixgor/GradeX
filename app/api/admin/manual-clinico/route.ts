import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { generateSlug } from '@/lib/utils/slug'
import { Patologia } from '@/lib/types/manual-clinico'
import { buildManualClinicoSearchFilter, rankManualClinicoResults } from '@/lib/manual-clinico-search'

export const dynamic = 'force-dynamic'

// GET - Listar patologias (admin, com paginação e filtros)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const area = searchParams.get('area')
    const sistema = searchParams.get('sistema')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = (page - 1) * limit

    const db = await getDb()
    const filter: any = {}

    if (area) filter.areas = area
    if (sistema) filter.sistema = sistema

    const searchTerm = busca?.trim() || ''
    let patologias: any[] = []
    let total = 0

    if (searchTerm) {
      const searchFilter = {
        ...filter,
        ...buildManualClinicoSearchFilter(searchTerm),
      }
      const results = await db.collection<any>('patologias')
        .find(searchFilter)
        .toArray()
      const rankedResults = rankManualClinicoResults(results, searchTerm)

      total = rankedResults.length
      patologias = rankedResults.slice(skip, skip + limit)
    } else {
      const [results, count] = await Promise.all([
        db.collection('patologias')
          .find(filter)
          .sort({ nome: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('patologias').countDocuments(filter)
      ])

      patologias = results
      total = count
    }

    return NextResponse.json({
      patologias,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Erro ao listar patologias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar nova patologia
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const db = await getDb()

    // Gerar slug
    let slug = generateSlug(body.nome)

    // Verificar unicidade do slug
    const existing = await db.collection('patologias').findOne({ slug })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const patologia: Omit<Patologia, '_id'> = {
      nome: body.nome,
      sinonimos: body.sinonimos || [],
      areas: body.areas || [],
      sistema: body.sistema,
      classificacao: body.classificacao || '',
      fisiopatologia: body.fisiopatologia || '',
      diagnostico_semiologico: body.diagnostico_semiologico || '',
      diagnosticos_diferenciais: body.diagnosticos_diferenciais || '',
      gravidade: body.gravidade || '',
      tratamento: body.tratamento || '',
      farmacologia: body.farmacologia || { primeira_linha: [], segunda_linha: [] },
      fluxograma_tratamento: body.fluxograma_tratamento || '',
      cid10: body.cid10 || '',
      slug,
      imagens_mecanismo: body.imagens_mecanismo || [],
      legenda_imagens: body.legenda_imagens || [],
      observacoes_clinicas: body.observacoes_clinicas || '',
      referencias: body.referencias || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Validar campos obrigatórios
    const required = ['nome', 'sistema', 'areas'] as const
    for (const field of required) {
      if (!patologia[field] || (Array.isArray(patologia[field]) && (patologia[field] as any[]).length === 0)) {
        return NextResponse.json(
          { error: `Campo obrigatório ausente: ${field}` },
          { status: 400 }
        )
      }
    }

    const result = await db.collection('patologias').insertOne(patologia)

    return NextResponse.json({
      success: true,
      id: result.insertedId,
      slug: patologia.slug
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar patologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
