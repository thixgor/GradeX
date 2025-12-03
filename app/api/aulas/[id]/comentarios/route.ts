import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem, AulaComentario } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { conteudo } = body

    if (!conteudo || !conteudo.trim()) {
      return NextResponse.json(
        { error: 'Comentário não pode estar vazio' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const aulasCollection = db.collection<AulaPostagem>('aulas_postagens')
    const usersCollection = db.collection('users')

    // Buscar usuário para pegar nome
    const usuario = await usersCollection.findOne({
      _id: new ObjectId(session.userId)
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const novoComentario: AulaComentario = {
      _id: new ObjectId(),
      aulaId: params.id,
      usuarioId: session.userId,
      nomeUsuario: usuario.name || usuario.email,
      isAdmin: session.role === 'admin',
      conteudo,
      criadoEm: new Date()
    }

    const result = await aulasCollection.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $push: { comentarios: novoComentario },
        $set: { atualizadoEm: new Date() }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ comentario: novoComentario })
  } catch (error) {
    console.error('Erro ao criar comentário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}
