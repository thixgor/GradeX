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

    const users = await usersCollection
      .find({
        banned: { $ne: true },
        lastLoginAt: { $gte: onlineSince },
      })
      .project({ name: 1, email: 1, lastLoginAt: 1 })
      .sort({ lastLoginAt: -1 })
      .toArray()

    return NextResponse.json({
      users: users.map((u) => ({
        id: u._id?.toString(),
        name: u.name,
        email: u.email,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : undefined,
      })),
    })
  } catch (error) {
    console.error('Get online users list error:', error)
    return NextResponse.json({ error: 'Erro ao buscar lista de usuários online' }, { status: 500 })
  }
}
