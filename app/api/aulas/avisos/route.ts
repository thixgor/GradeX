import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

interface AulaAviso {
  titulo: string
  mensagem: string
  tipo: 'info' | 'warning' | 'success' | 'error'
  criadoEm: Date
  atualizadoEm: Date
  criadoPor: string
  criadoPorNome: string
  ativo: boolean
}

// GET - Retornar o aviso atual (se existir)
export async function GET() {
  try {
    const db = await getDb()
    const avisosCollection = db.collection<AulaAviso>('aulas_avisos')

    // Busca o aviso ativo
    const aviso = await avisosCollection.findOne({ ativo: true })

    return NextResponse.json({
      aviso: aviso || null,
    })
  } catch (error) {
    console.error('Erro ao buscar aviso das aulas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar aviso das aulas' },
      { status: 500 }
    )
  }
}

// POST - Criar/atualizar aviso (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { titulo, mensagem, tipo } = body as {
      titulo?: string
      mensagem?: string
      tipo?: 'info' | 'warning' | 'success' | 'error'
    }

    // Validações
    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      )
    }

    if (!mensagem || typeof mensagem !== 'string' || mensagem.trim().length === 0) {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    const tiposValidos: ('info' | 'warning' | 'success' | 'error')[] = ['info', 'warning', 'success', 'error']
    if (!tipo || !tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Deve ser: info, warning, success ou error' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const avisosCollection = db.collection<AulaAviso>('aulas_avisos')

    const agora = new Date()

    // Desativa todos os avisos existentes
    await avisosCollection.updateMany(
      { ativo: true },
      { $set: { ativo: false, atualizadoEm: agora } }
    )

    // Cria o novo aviso
    const novoAviso: AulaAviso = {
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      tipo,
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: session.userId,
      criadoPorNome: session.name,
      ativo: true,
    }

    const result = await avisosCollection.insertOne(novoAviso)

    return NextResponse.json({
      success: true,
      aviso: {
        _id: result.insertedId,
        ...novoAviso,
      },
    })
  } catch (error) {
    console.error('Erro ao criar/atualizar aviso das aulas:', error)
    return NextResponse.json(
      { error: 'Erro ao criar/atualizar aviso das aulas' },
      { status: 500 }
    )
  }
}

// DELETE - Remover aviso (apenas admin)
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const db = await getDb()
    const avisosCollection = db.collection<AulaAviso>('aulas_avisos')

    // Desativa todos os avisos ativos
    const result = await avisosCollection.updateMany(
      { ativo: true },
      { $set: { ativo: false, atualizadoEm: new Date() } }
    )

    return NextResponse.json({
      success: true,
      message: 'Aviso removido com sucesso',
      modifiedCount: result.modifiedCount,
    })
  } catch (error) {
    console.error('Erro ao remover aviso das aulas:', error)
    return NextResponse.json(
      { error: 'Erro ao remover aviso das aulas' },
      { status: 500 }
    )
  }
}
