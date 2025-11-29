import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// GET - Listar grupos do usuário (pessoais + gerais)
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('GradeX')
    const groupsCollection = db.collection('groups')

    // Buscar grupos gerais (públicos) + grupos pessoais do usuário
    const groups = await groupsCollection
      .find({
        $or: [
          { type: 'general', isPublic: true },
          { type: 'personal', createdBy: session.userId },
        ],
      })
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    return NextResponse.json({ groups })
  } catch (error: any) {
    console.error('Erro ao buscar grupos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar novo grupo
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { name, description, color, icon, type } = await req.json()

    // Validação
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nome do grupo é obrigatório' }, { status: 400 })
    }

    // Apenas admin pode criar grupos gerais
    if (type === 'general' && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar grupos gerais' },
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db('GradeX')
    const groupsCollection = db.collection('groups')
    const usersCollection = db.collection('users')

    // Buscar nome do usuário
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Criar grupo
    const newGroup = {
      name: name.trim(),
      type: type || 'personal',
      description: description?.trim() || '',
      color: color || '#3B82F6',
      icon: icon || '📁',
      createdBy: session.userId,
      createdByName: user.name,
      isPublic: type === 'general',
      order: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await groupsCollection.insertOne(newGroup)

    return NextResponse.json({
      message: 'Grupo criado com sucesso',
      groupId: result.insertedId,
      group: { ...newGroup, _id: result.insertedId },
    })
  } catch (error: any) {
    console.error('Erro ao criar grupo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
