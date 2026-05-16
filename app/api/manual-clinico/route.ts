import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { buildManualClinicoSearchFilter, rankManualClinicoResults } from '@/lib/manual-clinico-search'

export const dynamic = 'force-dynamic'

// GET - Busca pública de patologias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const area = searchParams.get('area')
    const sistema = searchParams.get('sistema')
    const exportAll = searchParams.get('export') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    if (exportAll) {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
    }

    const db = await getDb()
    const filter: any = {}

    // Export mode: return all pathologies with full data (for PDF generation)
    if (exportAll) {
      const patologias = await db
        .collection('patologias')
        .find(filter)
        .sort({ sistema: 1, nome: 1 })
        .toArray()
      return NextResponse.json({ patologias, total: patologias.length })
    }

    if (area) {
      const areas = area.split(',').filter(Boolean)
      if (areas.length > 0) filter.areas = { $in: areas }
    }
    if (sistema) filter.sistema = sistema

    const projection = {
      nome: 1,
      sinonimos: 1,
      areas: 1,
      sistema: 1,
      cid10: 1,
      slug: 1,
      gravidade: 1,
    }

    const searchTerm = busca?.trim() || ''
    let patologias: any[] = []
    let total = 0

    if (searchTerm) {
      const searchFilter = {
        ...filter,
        ...buildManualClinicoSearchFilter(searchTerm),
      }
      const results = await db.collection<any>('patologias')
        .find(searchFilter, { projection })
        .toArray()
      const rankedResults = rankManualClinicoResults(results, searchTerm)

      total = rankedResults.length
      patologias = rankedResults.slice(skip, skip + limit)
    } else {
      // No search term — just list with filters
      const [results, count] = await Promise.all([
        db.collection('patologias')
          .find(filter, { projection })
          .sort({ nome: 1 })
          .skip(skip).limit(limit).toArray(),
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
    console.error('Erro ao buscar patologias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
