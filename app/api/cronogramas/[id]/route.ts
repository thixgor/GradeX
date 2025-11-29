import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Obter cronograma específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const cronograma = await db.collection('cronogramas').findOne({
      _id: new ObjectId(params.id),
      usuarioId: session.userId
    })

    if (!cronograma) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      cronograma: {
        ...cronograma,
        _id: cronograma._id?.toString()
      }
    })
  } catch (error) {
    console.error('Erro ao obter cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao obter cronograma' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar cronograma
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const db = await getDb()

    const result = await db.collection('cronogramas').updateOne(
      {
        _id: new ObjectId(params.id),
        usuarioId: session.userId
      },
      {
        $set: {
          ...body,
          dataAtualizacao: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cronograma' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar cronograma (parcialmente)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const db = await getDb()

    const result = await db.collection('cronogramas').updateOne(
      {
        _id: new ObjectId(params.id),
        usuarioId: session.userId
      },
      {
        $set: {
          ...body,
          dataAtualizacao: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar cronograma' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar cronograma
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDb()
    const result = await db.collection('cronogramas').deleteOne({
      _id: new ObjectId(params.id),
      usuarioId: session.userId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Cronograma não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar cronograma:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar cronograma' },
      { status: 500 }
    )
  }
}
