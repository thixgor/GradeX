import { NextResponse } from 'next/server'
import { getSession, invalidateSessionCache, removeAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getSession().catch(() => null)
    if (session?.userId) invalidateSessionCache(session.userId)
    await removeAuthCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer logout' },
      { status: 500 }
    )
  }
}
