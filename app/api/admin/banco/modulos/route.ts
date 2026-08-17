import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoModulo, BancoModuloComContagem } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const periodoId = searchParams.get('periodoId')

    const db = await getDb()

    const pipeline: any[] = []

    if (periodoId) {
      pipeline.push({
        $match: { periodoId: new ObjectId(periodoId) }
      })
    }

    pipeline.push(
      {
        $lookup: {
          from: 'banco_questoes',
          localField: '_id',
          foreignField: 'moduloId',
          as: 'questoes'
        }
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: '_id',
          foreignField: 'moduloId',
          as: 'topicos'
        }
      },
      {
        $lookup: {
          from: 'banco_periodos',
          localField: 'periodoId',
          foreignField: '_id',
          as: 'periodo'
        }
      },
      {
        $addFields: {
          totalQuestoes: { $size: '$questoes' },
          totalTopicos: { $size: '$topicos' },
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] }
        }
      },
      {
        $project: {
          questoes: 0,
          topicos: 0,
          periodo: 0
        }
      },
      { $sort: { ordem: 1 } }
    )

    const modulos = await db.collection<BancoModulo>('banco_modulos')
      .aggregate<BancoModuloComContagem>(pipeline)
      .toArray()

    return NextResponse.json({ modulos })
  } catch (error) {
    console.error('Erro ao buscar módulos:', error)
    return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    /*
     * Período deixou de ser exigido — e deixou de existir no produto.
     *
     * Módulo é o topo da hierarquia agora. O campo continua sendo gravado
     * quando vier no corpo, para que módulos antigos não percam o vínculo que
     * já tinham, mas nada mais depende dele. Ver lib/banco/hierarquia.ts.
     */
    const db = await getDb()
    const periodoId = body.periodoId ? new ObjectId(String(body.periodoId)) : undefined

    // Gerar código
    const codigo = body.codigo || body.nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Duplicidade agora é global: sem período acima, dois módulos com o mesmo
    // nome são o mesmo módulo — era exatamente essa colisão silenciosa que o
    // nível de período escondia.
    const existente = await db.collection('banco_modulos').findOne({
      $or: [
        { nome: body.nome.trim() },
        { codigo }
      ]
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe um módulo com esse nome' }, { status: 400 })
    }

    // Obter próxima ordem
    const ultimoModulo = await db.collection('banco_modulos')
      .findOne({}, { sort: { ordem: -1 } })
    const ordem = body.ordem ?? ((ultimoModulo?.ordem ?? 0) + 1)

    const novoModulo: Omit<BancoModulo, '_id'> & { periodoId?: ObjectId } = {
      ...(periodoId ? { periodoId } : {}),
      nome: body.nome.trim(),
      codigo,
      ordem,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any

    const result = await db.collection('banco_modulos').insertOne(novoModulo)

    return NextResponse.json({
      sucesso: true,
      modulo: { ...novoModulo, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar módulo:', error)
    return NextResponse.json({ error: 'Erro ao criar módulo' }, { status: 500 })
  }
}
