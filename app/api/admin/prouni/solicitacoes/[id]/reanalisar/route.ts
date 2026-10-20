import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { analisarEmSegundoPlano } from '@/lib/prouni-processar-ia'
import {
  PROUNI_AI_PROCESSING_STALE_MS,
  PROUNI_REQUESTS_COLLECTION,
  serializeProuniRequestForAdmin,
  type ProuniRequest,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// A resposta é imediata; a análise segue no `waitUntil` (ver `lib/prouni-processar-ia.ts`).
export const maxDuration = 300

/**
 * "Reanalisar com IA": roda de novo a análise automática numa solicitação
 * pendente — a que deu "tempo esgotado", a que chegou com a IA desligada, a
 * que o admin quer uma segunda opinião.
 *
 * Só pendente e com os arquivos ainda guardados. A mesma regra do envio vale:
 * aprovou, vira aprovada (com e-mail para a pessoa); reprovou ou falhou, fica
 * na fila com o parecer novo.
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'Solicitação inválida' }, { status: 400 })
  }

  const rl = await checkRateLimit(session.userId, 'prouni_reanalisar', 30, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  try {
    const db = await getDb()
    const agora = new Date()
    // Marca "analisando" de forma condicional: duas abas clicando ao mesmo
    // tempo não disparam duas análises. Um "analisando" vencido (a função
    // morreu) pode ser retomado.
    const r = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
      {
        _id: new ObjectId(params.id),
        status: 'pending',
        'attachments.0': { $exists: true },
        $or: [
          { 'aiReview.outcome': { $ne: 'processing' } },
          { 'aiReview.reviewedAt': { $lt: new Date(agora.getTime() - PROUNI_AI_PROCESSING_STALE_MS) } },
        ],
      } as any,
      { $set: { aiReview: { outcome: 'processing', reviewedAt: agora }, updatedAt: agora } }
    )
    if (r.matchedCount !== 1) {
      return NextResponse.json(
        { error: 'Só dá para reanalisar uma solicitação pendente, com os arquivos guardados e sem análise em andamento.' },
        { status: 409 }
      )
    }

    void analisarEmSegundoPlano(db, params.id, 'admin')

    const atual = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).findOne({ _id: new ObjectId(params.id) } as any)
    return NextResponse.json(
      { success: true, request: atual ? serializeProuniRequestForAdmin(atual) : null },
      { status: 202 }
    )
  } catch (error) {
    console.error('[admin/prouni/reanalisar] erro:', error)
    return NextResponse.json({ error: 'Erro ao reanalisar' }, { status: 500 })
  }
}
