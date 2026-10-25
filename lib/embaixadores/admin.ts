import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

/** Sessão de admin ou a resposta de recusa, para as rotas de /api/admin/embaixadores. */
export async function exigirAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return { session: null, recusa: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }
  return { session, recusa: null }
}
