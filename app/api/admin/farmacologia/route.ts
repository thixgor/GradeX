import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { generateSlug } from '@/lib/utils/slug'
import { Medicamento } from '@/lib/types/farmacologia'

export const dynamic = 'force-dynamic'

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET - Listar medicamentos (admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const busca = searchParams.get('busca')?.trim() || ''
    const classe = searchParams.get('classe')
    const subclasse = searchParams.get('subclasse')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000)
    const skip = (page - 1) * limit

    const db = await getDb()
    const filter: any = {}
    if (classe) filter.classe_principal = classe
    if (subclasse) filter.subclasse = subclasse
    if (busca) {
      const rx = new RegExp(escapeRegex(busca), 'i')
      filter.$or = [
        { nome: rx },
        { sinonimos: rx },
        { classe_principal: rx },
        { subclasse: rx },
      ]
    }

    const [medicamentos, total] = await Promise.all([
      db.collection('medicamentos')
        .find(filter)
        .sort({ classe_principal: 1, subclasse: 1, nome: 1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('medicamentos').countDocuments(filter),
    ])

    return NextResponse.json({
      medicamentos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Erro ao listar medicamentos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo medicamento
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const db = await getDb()

    if (!body.nome) return NextResponse.json({ error: 'Campo obrigatório ausente: nome' }, { status: 400 })
    if (!body.classe_principal) return NextResponse.json({ error: 'Campo obrigatório ausente: classe_principal' }, { status: 400 })

    let slug = generateSlug(body.nome)
    const existing = await db.collection('medicamentos').findOne({ slug })
    if (existing) slug = `${slug}-${Date.now()}`

    const medicamento: Omit<Medicamento, '_id'> = {
      nome: body.nome,
      sinonimos: body.sinonimos || [],
      classe_principal: body.classe_principal,
      subclasse: body.subclasse || '',
      slug,
      nomes_comerciais: body.nomes_comerciais || '',
      classificacao: body.classificacao || '',
      tipo_farmaco: body.tipo_farmaco || '',
      principais_funcoes: body.principais_funcoes || '',
      mecanismo_acao_compacto: body.mecanismo_acao_compacto || '',
      mecanismo_acao_detalhado: body.mecanismo_acao_detalhado || '',
      metabolismo: body.metabolismo || '',
      excrecao: body.excrecao || '',
      efeitos_colaterais: body.efeitos_colaterais || [],
      efeitos_adversos: body.efeitos_adversos || [],
      contraindicacoes: body.contraindicacoes || [],
      interacoes_medicamentosas: body.interacoes_medicamentosas || '',
      posologia: body.posologia || '',
      calculo_dose: body.calculo_dose || {
        enabled: false, unidade: 'mg', via: '', mg_por_kg: null, dose_fixa: null,
        dose_min: null, dose_max: null, frequencia: '', ajuste_idoso_pct: null,
        fator_masculino: null, fator_feminino: null, observacao_calculo: '', checks: [],
      },
      fluxograma_uso: body.fluxograma_uso || '',
      observacoes_clinicas: body.observacoes_clinicas || '',
      referencias: body.referencias || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('medicamentos').insertOne(medicamento as any)

    return NextResponse.json({ success: true, id: result.insertedId, slug }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar medicamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
