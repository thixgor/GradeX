import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem, AulaComentario } from '@/lib/types'
import {
  secureApiEndpoint,
  isValidObjectId,
  sanitizeHtml,
  validateStringInput
} from '@/lib/api-security'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar ObjectId primeiro
    if (!isValidObjectId(params.id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }

    // Verificar autenticação e rate limit
    const security = await secureApiEndpoint(request, {
      rateLimit: 'WRITE',
      auth: { requireAuth: true }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const session = security.session!
    const body = await request.json()

    // Validar e sanitizar conteúdo
    const contentValidation = validateStringInput(body.conteudo, 'Comentário', {
      required: true,
      minLength: 1,
      maxLength: 5000
    })

    if (!contentValidation.valid) {
      return NextResponse.json(
        { error: contentValidation.error },
        { status: 400 }
      )
    }

    // Sanitizar contra XSS
    const conteudo = sanitizeHtml(contentValidation.value!)

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
      nomeUsuario: sanitizeHtml(usuario.name || usuario.email),
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
