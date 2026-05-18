import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'

// Mantém SSR (não rota estática) mas permite cache de browser curto
// para deduplicar polls feitos pelo mesmo usuário em rajada.
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

    // Projection enxuta — não retornamos senha nem campos pesados.
    // Antes este endpoint usava projection `{ password: 0 }` que ainda
    // trazia o documento inteiro do MongoDB (custoso em decks de Mongo
    // com docs grandes). Listar campos explicitamente reduz CPU/IO.
    const user = await usersCollection.findOne(
      { _id: new ObjectId(session.userId) },
      {
        projection: {
          email: 1,
          name: 1,
          role: 1,
          cpf: 1,
          dateOfBirth: 1,
          isAfyaMedicineStudent: 1,
          afyaUnit: 1,
          accountType: 1,
          trialExpiresAt: 1,
          trialDuration: 1,
          secondaryRole: 1,
          emailVerified: 1,
        },
      }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Removida atualização de `lastLoginAt` daqui: este endpoint é
    // chamado em polls e em cada navegação — não representa um login.
    // O carimbo de lastLogin deve ficar em /api/auth/login.

    // Cache curto privado (browser) para deduplicar polls em rajada.
    // Não permitimos shared cache (CDN) porque a resposta é por-usuário.
    const headers = new Headers({
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      'Content-Type': 'application/json',
    })

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
        emailVerified: !!user.emailVerified,
      },
    }, { headers })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuário' },
      { status: 500 }
    )
  }
}
