import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  ensureProuniIndexes,
  serializeProuniRequestForAdmin,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Fila de análise. Ordena por mais antiga primeiro entre as pendentes. */
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const params = request.nextUrl.searchParams
    const status = params.get('status') || 'pending'
    const q = (params.get('q') || '').trim().slice(0, 80)
    const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
    const perPage = 20

    const db = await getDb()
    void ensureProuniIndexes(db)

    const filtro: Record<string, any> = {}
    if (status !== 'all') filtro.status = status
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filtro.$or = [
        { userName: regex },
        { userEmail: regex },
        { itemTitle: regex },
        { 'applicant.fullName': regex },
        { 'applicant.email': regex },
        // CPF é procurado pelos dígitos: o admin cola "123.456.789-00" e a
        // busca precisa achar o registro, que guarda só os números.
        { 'applicant.cpf': q.replace(/\D/g, '') || regex },
      ]
    }

    const collection = db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION)
    const [solicitacoes, total, contagens] = await Promise.all([
      collection
        .find(filtro as any)
        .sort(status === 'pending' ? { createdAt: 1 } : { updatedAt: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .toArray(),
      collection.countDocuments(filtro as any),
      collection.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]).toArray(),
    ])

    const resumo = contagens.reduce((acc: Record<string, number>, linha: any) => {
      acc[String(linha._id)] = Number(linha.total || 0)
      return acc
    }, {})

    return NextResponse.json({
      requests: solicitacoes.map(serializeProuniRequestForAdmin),
      total,
      page,
      perPage,
      counts: {
        pending: resumo.pending || 0,
        approved: resumo.approved || 0,
        rejected: resumo.rejected || 0,
        cancelled: resumo.cancelled || 0,
      },
    })
  } catch (error) {
    console.error('[admin/prouni/solicitacoes] GET erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar solicitações' }, { status: 500 })
  }
}
