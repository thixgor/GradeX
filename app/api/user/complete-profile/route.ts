import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cpf, dateOfBirth, isAfyaMedicineStudent, afyaUnit } = body

    if (!cpf || !dateOfBirth) {
      return NextResponse.json(
        { error: 'CPF e data de nascimento são obrigatórios' },
        { status: 400 }
      )
    }

    if (isAfyaMedicineStudent && !afyaUnit) {
      return NextResponse.json(
        { error: 'Unidade Afya é obrigatória para estudantes de Medicina da Afya' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    // Verifica se o CPF já existe em outro usuário
    const existingUserWithCPF = await usersCollection.findOne({
      cpf,
      _id: { $ne: new ObjectId(session.userId) }
    })

    if (existingUserWithCPF) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      )
    }

    // Atualiza o usuário
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          cpf,
          dateOfBirth: new Date(dateOfBirth),
          isAfyaMedicineStudent: isAfyaMedicineStudent || false,
          afyaUnit: isAfyaMedicineStudent ? afyaUnit : undefined,
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    })
  } catch (error) {
    console.error('Complete profile error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    )
  }
}
