import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    if (q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const db = await getDb()

    const users = await db
      .collection('users')
      .find({
        $or: [
          { name:  { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
        ],
      })
      .project({ _id: 1, name: 1, email: 1, accountType: 1 })
      .sort({ name: 1 })
      .limit(20)
      .toArray()

    return NextResponse.json({
      users: users.map((u: any) => ({
        id:          u._id.toString(),
        name:        u.name  || '',
        email:       u.email || '',
        accountType: u.accountType || '',
      })),
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}
