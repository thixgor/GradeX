import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { audit } from '@/lib/payments/audit'
import { apagarAnexos } from '@/lib/prouni-anexos'
import { PROUNI_REQUESTS_COLLECTION, type ProuniRequest } from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Faxina em lote dos comprovantes já analisados.
 *
 * Apagar um por um funciona, mas ninguém faz isso com 300 solicitações — e o
 * resultado previsível seria o Blob guardando documento pessoal de gente
 * analisada meses atrás, pago mês a mês. Aqui o admin escolhe a idade mínima e
 * limpa a fila inteira de uma vez.
 *
 * Nunca alcança solicitação PENDENTE: apagar o comprovante de quem ainda não
 * foi analisado destruiria a única base da decisão.
 */

const Schema = z.object({
  /** Só apaga anexos de solicitações analisadas há pelo menos N dias. */
  olderThanDays: z.number().int().min(0).max(365).default(0),
  /** Teto por execução — a rota é serverless, não um job de horas. */
  limit: z.number().int().min(1).max(100).default(50),
})

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = {}
  }
  const parsed = Schema.safeParse(body || {})
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { olderThanDays, limit } = parsed.data

  try {
    const db = await getDb()
    const corte = new Date(Date.now() - olderThanDays * 86_400_000)

    const alvos = await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION)
      .find({
        status: { $in: ['approved', 'rejected', 'cancelled'] },
        reviewedAt: { $lte: corte },
        'attachments.0': { $exists: true },
      } as any)
      .sort({ reviewedAt: 1 })
      .limit(limit)
      .toArray()

    let arquivos = 0
    const agora = new Date()
    for (const solicitacao of alvos) {
      const { apagados } = await apagarAnexos((solicitacao.attachments || []).map((f) => f.blobUrl))
      arquivos += apagados
      await db.collection<ProuniRequest>(PROUNI_REQUESTS_COLLECTION).updateOne(
        { _id: solicitacao._id as any },
        {
          $set: {
            attachments: [],
            attachmentsPurgedAt: agora,
            attachmentsPurgedBy: session.userId,
            updatedAt: agora,
          },
        } as any
      )
    }

    await audit({
      action: 'prouni_attachments_purged',
      actorUserId: session.userId,
      resourceType: 'prouni_request',
      resourceId: 'bulk',
      metadata: { requests: alvos.length, files: arquivos, olderThanDays },
    })

    return NextResponse.json({ success: true, requests: alvos.length, files: arquivos })
  } catch (error) {
    console.error('[admin/prouni/limpeza] erro:', error)
    return NextResponse.json({ error: 'Erro ao limpar anexos' }, { status: 500 })
  }
}
