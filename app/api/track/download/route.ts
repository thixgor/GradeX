import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * Fire-and-forget download tracking.
 * Called from the client after a PDF is generated/downloaded.
 * Lightweight — no validation beyond auth, no blocking.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ ok: true }) // don't error, just skip
    }

    const body = await request.json()
    const { type, resourceId, resourceTitle } = body

    if (!type) {
      return NextResponse.json({ ok: true })
    }

    const db = await getDb()
    await db.collection('download_logs').insertOne({
      // `session.userId` — o payload do token não tem `id`, então a versão
      // anterior gravava `undefined` em todo registro e o ranking de downloads
      // por usuário nunca conseguia agrupar nada.
      userId: session.userId,
      userName: session.name || '',
      userEmail: session.email || '',
      type, // 'exam_pdf' | 'gabarito_pdf' | 'exam_answers_pdf' | 'group_pdf' | 'manual_completo_pdf' | 'patologia_pdf' | 'student_answers_pdf' | 'annotations_pdf'
      resourceId: resourceId || '',
      resourceTitle: resourceTitle || '',
      downloadedAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail — tracking is best-effort
    return NextResponse.json({ ok: true })
  }
}
