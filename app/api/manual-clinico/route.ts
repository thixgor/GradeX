import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET - Busca pública de patologias
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')
    const area = searchParams.get('area')
    const sistema = searchParams.get('sistema')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    const db = await getDb()
    const filter: any = {}

    if (busca && busca.trim()) {
      // Usar full-text search do MongoDB
      filter.$text = { $search: busca.trim() }
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

    let query = db.collection('patologias').find(filter, { projection })

    // Se houver busca textual, ordenar por relevância
    if (busca && busca.trim()) {
      query = db.collection('patologias').find(
        { ...filter },
        { projection: { ...projection, score: { $meta: 'textScore' } } }
      ).sort({ score: { $meta: 'textScore' } })
    } else {
      query = query.sort({ nome: 1 })
    }

    const [patologias, total] = await Promise.all([
      query.skip(skip).limit(limit).toArray(),
      db.collection('patologias').countDocuments(filter)
    ])

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
