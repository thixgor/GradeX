import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET /api/flashcards/manual/users/search?q=email-or-name
// Permite procurar usuários para compartilhar (campo restrito: retorna apenas
// nome, email mascarado e ID). Limite de 8 resultados.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    if (q.length < 3) return NextResponse.json({ users: [] })

    const db = await getDb()
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const users = await db.collection('users')
      .find({
        _id: { $ne: undefined },
        $or: [
          { email: { $regex: escaped, $options: 'i' } },
          { name: { $regex: escaped, $options: 'i' } },
        ],
        banned: { $ne: true },
      })
      .project({ name: 1, email: 1 })
      .limit(8)
      .toArray()

    const result = users
      .filter((u: any) => String(u._id) !== session.userId)
      .map((u: any) => ({
        _id: String(u._id),
        name: u.name || 'Usuário',
        emailMasked: maskEmail(u.email || ''),
      }))
    return NextResponse.json({ users: result })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 })
  }
}

function maskEmail(email: string): string {
  if (!email.includes('@')) return ''
  const [user, domain] = email.split('@')
  const visible = user.slice(0, Math.max(1, Math.min(3, user.length)))
  return `${visible}${user.length > 3 ? '***' : ''}@${domain}`
}
