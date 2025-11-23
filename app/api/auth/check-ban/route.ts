import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { ObjectId } from 'mongodb'

// GET - Verificar se usuário está banido
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ banned: false })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')
    const user = await usersCollection.findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ banned: true })
    }

    if (user.banned) {
      return NextResponse.json({
        banned: true,
        banReason: user.banReason,
        banDetails: user.banDetails,
        bannedAt: user.bannedAt
      })
    }

    return NextResponse.json({ banned: false })
  } catch (error) {
    console.error('Check ban error:', error)
    return NextResponse.json({ banned: false })
  }
}
