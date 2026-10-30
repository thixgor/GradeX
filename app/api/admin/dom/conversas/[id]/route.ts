import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { COLECAO_CONVERSAS } from '@/lib/dom/historico'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** `GET /api/admin/dom/conversas/<id>` — uma conversa inteira (até as últimas 40 falas). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await secureApiEndpoint(request, { rateLimit: 'ADMIN', auth: { requireAuth: true, allowedRoles: ['admin'] } })
  if (!s.success || s.errorResponse) return s.errorResponse || NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { id } = await params
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'Conversa inválida' }, { status: 400 })
  const db = await getDb()
  const d = await db.collection(COLECAO_CONVERSAS).findOne({ _id: new ObjectId(id) })
  if (!d) return NextResponse.json({ error: 'Conversa não encontrada (pode ter saído: cada pessoa guarda só as 25 mais recentes)' }, { status: 404 })
  return jsonComprimido(
    request,
    {
      id: String(d._id),
      userId: d.userId,
      nome: d.nome || '',
      email: d.email || '',
      modo: d.modo,
      titulo: d.titulo || 'Conversa',
      criadaEm: d.criadaEm,
      atualizadaEm: d.atualizadaEm,
      totalDeFalas: d.totalDeFalas || 0,
      rota: d.rota || '',
      materialId: d.materialId || '',
      falas: (d.falas || []).map((f: any) => ({ papel: f.papel, texto: f.texto, em: f.em, motor: f.motor, alerta: f.alerta })),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
