import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id!.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        cpf: user.cpf,
        dateOfBirth: user.dateOfBirth,
        isAfyaMedicineStudent: user.isAfyaMedicineStudent,
        afyaUnit: user.afyaUnit,
        accountType: user.accountType,
        trialExpiresAt: user.trialExpiresAt,
        trialDuration: user.trialDuration,
        secondaryRole: user.secondaryRole,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}
