import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb()
    
    // Verificar autenticação
    const authRes = await fetch('http://localhost:3000/api/auth/me', {
      headers: req.headers
    })
    
    if (!authRes.ok) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const userData = await authRes.json()
    if (userData.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem deletar tópicos' },
        { status: 403 }
      )
    }

    const result = await db.collection('forumTopics').deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Tópico não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tópico deletado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao deletar tópico:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar tópico' },
      { status: 500 }
    )
  }
}
