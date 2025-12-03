import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')

    const aulaOriginal = await aulasCollection.findOne({
      _id: new ObjectId(params.id)
    })

    if (!aulaOriginal) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    const aulaDuplicada: AulaPostagem = {
      ...aulaOriginal,
      _id: new ObjectId(),
      titulo: `${aulaOriginal.titulo} (Cópia)`,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      comentarios: []
    }

    const result = await aulasCollection.insertOne(aulaDuplicada)

    return NextResponse.json({
      aula: {
        ...aulaDuplicada,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Erro ao duplicar aula:', error)
    return NextResponse.json(
      { error: 'Erro ao duplicar aula' },
      { status: 500 }
    )
  }
}
