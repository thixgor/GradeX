import { NextRequest, NextResponse } from 'next/server'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { garantirIndicesDoDom } from '@/lib/dom/limites'
import { COLECAO_CONVERSAS } from '@/lib/dom/historico'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * `GET /api/admin/dom/conversas?q=&modo=&alertas=1&antes=<iso>` — as conversas
 * de todos os usuários com o Dom, mais recentes primeiro, 30 por página
 * (`antes` = `atualizadaEm` da última da página anterior). Só a lista: as falas
 * vêm por conversa em `/[id]`, para a página não baixar o acervo inteiro.
 */

const POR_PAGINA = 30

function escaparRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  const s = await secureApiEndpoint(request, { rateLimit: 'ADMIN', auth: { requireAuth: true, allowedRoles: ['admin'] } })
  if (!s.success || s.errorResponse) return s.errorResponse || NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const params = request.nextUrl.searchParams
  const q = (params.get('q') || '').trim().slice(0, 80)
  const modo = params.get('modo')
  const antes = params.get('antes')
  const filtro: Record<string, unknown> = {}
  if (q) {
    const re = { $regex: escaparRegex(q), $options: 'i' }
    filtro.$or = [{ nome: re }, { email: re }, { titulo: re }, { userId: q }]
  }
  if (modo === 'geral' || modo === 'socratico' || modo === 'material') filtro.modo = modo
  if (params.get('alertas') === '1') filtro.alertas = { $gt: 0 }
  if (antes && !Number.isNaN(Date.parse(antes))) filtro.atualizadaEm = { $lt: new Date(antes) }

  const db = await getDb()
  void garantirIndicesDoDom(db)
  const docs = await db
    .collection(COLECAO_CONVERSAS)
    .find(filtro)
    .sort({ atualizadaEm: -1 })
    .limit(POR_PAGINA + 1)
    .project({ falas: { $slice: -1 }, userId: 1, nome: 1, email: 1, modo: 1, titulo: 1, criadaEm: 1, atualizadaEm: 1, totalDeFalas: 1, alertas: 1, rota: 1 })
    .maxTimeMS(4000)
    .toArray()

  const temMais = docs.length > POR_PAGINA
  const conversas = docs.slice(0, POR_PAGINA).map((d) => ({
    id: String(d._id),
    userId: d.userId,
    nome: d.nome || '',
    email: d.email || '',
    modo: d.modo,
    titulo: d.titulo || 'Conversa',
    criadaEm: d.criadaEm,
    atualizadaEm: d.atualizadaEm,
    totalDeFalas: d.totalDeFalas || 0,
    alertas: d.alertas || 0,
    rota: d.rota || '',
    ultima: String(d.falas?.[0]?.texto || '').slice(0, 140),
  }))
  return jsonComprimido(request, { conversas, temMais }, { headers: { 'Cache-Control': 'private, no-store' } })
}
