import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoListaUsuario } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    // Buscar listas do usuário
    const listas = await db.collection<BancoListaUsuario>('banco_listas_usuario')
      .aggregate([
        { $match: { userId: new ObjectId(session.userId) } },
        {
          $addFields: {
            totalQuestoes: { $size: '$questaoIds' }
          }
        },
        { $sort: { updatedAt: -1 } }
      ])
      .toArray()

    return NextResponse.json({ listas })
  } catch (error) {
    console.error('Erro ao buscar listas:', error)
    return NextResponse.json({ error: 'Erro ao buscar listas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    const body = await request.json()
    const nome = String(body.nome || '').slice(0, 100).trim()

    if (!nome) {
      return NextResponse.json({ error: 'Nome da lista é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe uma lista com esse nome para o usuário
    const existente = await db.collection('banco_listas_usuario').findOne({
      userId: new ObjectId(session.userId),
      nome: nome
    })

    if (existente) {
      return NextResponse.json({ error: 'Já existe uma lista com esse nome' }, { status: 400 })
    }

    const novaLista: Omit<BancoListaUsuario, '_id'> = {
      userId: new ObjectId(session.userId),
      nome: nome,
      questaoIds: body.questaoIds?.map((id: string) => new ObjectId(id)) || [],
      modoResposta: body.modoResposta || 'imediato',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('banco_listas_usuario').insertOne(novaLista)

    return NextResponse.json({
      sucesso: true,
      lista: { ...novaLista, _id: result.insertedId }
    })
  } catch (error) {
    console.error('Erro ao criar lista:', error)
    return NextResponse.json({ error: 'Erro ao criar lista' }, { status: 500 })
  }
}
