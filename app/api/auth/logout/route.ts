import { NextResponse } from 'next/server'
import { getSession, invalidateSessionCache, removeAuthCookie } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getSession().catch(() => null)
    if (session?.userId) {
      invalidateSessionCache(session.userId)
      // Revoga o registro da sessão deste dispositivo (libera vaga no limite).
      if (session.jti) {
        try {
          const db = await getDb()
          await db.collection('sessions').updateOne(
            { jti: session.jti, revokedAt: { $exists: false } },
            { $set: { revokedAt: new Date(), revokedBy: 'user' } }
          )
        } catch (err) {
          console.error('Falha ao revogar sessão no logout:', err)
        }
      }
    }
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
