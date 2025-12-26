import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const usersCollection = db.collection<User>('users')

    const onlineThresholdMs = 10 * 60 * 1000
    const onlineSince = new Date(Date.now() - onlineThresholdMs)

    const count = await usersCollection.countDocuments({
      banned: { $ne: true },
      lastLoginAt: { $gte: onlineSince },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Get online users count error:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários online' }, { status: 500 })
  }
}
