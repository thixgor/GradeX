import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { audit } from '@/lib/payments/audit'
import { resolveProuniProduto } from '@/lib/prouni-catalogo'
import {
  ensureProuniIndexes,
  serializeProuniBenefit,
  PROUNI_BENEFITS_COLLECTION,
  PROUNI_REQUESTS_COLLECTION,
  type ProuniBenefit,
  type ProuniItemType,
} from '@/lib/prouni-fies'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ofertas PROUNI/FIES por produto (admin).
 *
 * Uma oferta por produto — daí o upsert em vez de create/update separados: o
 * admin pensa "este material dá 40% para bolsista", não "quero criar o registro
 * 7". O índice único em `(itemType, itemId)` sustenta isso no banco.
 *
 * Configurar é OPCIONAL, e é isso que mantém a feature invisível onde não foi
 * pedida: produto sem registro aqui não mostra chamativo, não abre página
 * exclusiva e não aceita solicitação.
 */

const BenefitSchema = z.object({
  itemType: z.enum(['material', 'package', 'manual_clinico', 'plus']),
  itemId: z.string().min(1).max(80),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  stackWithTier: z.boolean().default(false),
  allowedManualPlans: z.array(z.enum(['semestral', 'anual', 'vitalicio'])).max(3).optional(),
  grantValidityDays: z.number().int().positive().max(365).nullable().optional(),
  instructions: z.string().max(600).optional(),
  isActive: z.boolean().default(true),
}).superRefine((data, ctx) => {
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentual máximo é 100%.' })
  }
})

async function exigirAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET() {
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const db = await getDb()
    void ensureProuniIndexes(db)

    const beneficios = await db.collection<ProuniBenefit>(PROUNI_BENEFITS_COLLECTION)
      .find({})
      .sort({ updatedAt: -1 })
      .limit(300)
      .toArray()

    // O produto é resolvido na leitura (e não gravado junto) para o título na
    // tela nunca ficar defasado do catálogo. `null` significa produto apagado —
    // a tela mostra a oferta órfã para o admin poder removê-la.
    const enriquecidos = await Promise.all(
      beneficios.map(async (benefit) => ({
        ...serializeProuniBenefit(benefit),
        product: await resolveProuniProduto(db, benefit.itemType, benefit.itemId),
        pendingCount: await db.collection(PROUNI_REQUESTS_COLLECTION).countDocuments({
          itemType: benefit.itemType,
          itemId: benefit.itemId,
          status: 'pending',
        }),
      }))
    )

    return NextResponse.json({ benefits: enriquecidos })
  } catch (error) {
    console.error('[admin/prouni/beneficios] GET erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar descontos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = BenefitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Dados inválidos' },
      { status: 400 }
    )
  }
  const data = parsed.data

  try {
    const db = await getDb()
    void ensureProuniIndexes(db)

    const itemType = data.itemType as ProuniItemType
    const produto = await resolveProuniProduto(db, itemType, data.itemId)
    if (!produto) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    const agora = new Date()
    await db.collection<ProuniBenefit>(PROUNI_BENEFITS_COLLECTION).updateOne(
      { itemType, itemId: data.itemId },
      {
        $set: {
          itemTitle: produto.title,
          discountType: data.discountType,
          discountValue: data.discountValue,
          stackWithTier: data.stackWithTier === true,
          allowedManualPlans: itemType === 'manual_clinico' ? (data.allowedManualPlans || []) : [],
          grantValidityDays: data.grantValidityDays ?? null,
          instructions: (data.instructions || '').trim(),
          isActive: data.isActive !== false,
          updatedAt: agora,
        },
        $setOnInsert: {
          itemType,
          itemId: data.itemId,
          createdBy: session.userId,
          createdByName: session.name || '',
          createdAt: agora,
        },
      } as any,
      { upsert: true }
    )

    const salvo = await db.collection<ProuniBenefit>(PROUNI_BENEFITS_COLLECTION).findOne({
      itemType,
      itemId: data.itemId,
    })

    await audit({
      action: 'prouni_benefit_updated',
      actorUserId: session.userId,
      resourceType: 'prouni_benefit',
      resourceId: `${itemType}:${data.itemId}`,
      metadata: {
        discountType: data.discountType,
        discountValue: data.discountValue,
        stackWithTier: data.stackWithTier === true,
        isActive: data.isActive !== false,
      },
    })

    return NextResponse.json({
      success: true,
      benefit: salvo ? { ...serializeProuniBenefit(salvo), product: produto } : null,
    })
  } catch (error) {
    console.error('[admin/prouni/beneficios] POST erro:', error)
    return NextResponse.json({ error: 'Erro ao salvar desconto' }, { status: 500 })
  }
}

/**
 * Remove a oferta. As concessões já aprovadas continuam valendo — elas têm
 * fotografia própria das condições, e cancelar desconto de quem já foi
 * analisado e aprovado exigiria um ato explícito, não um efeito colateral de
 * apagar a campanha.
 */
export async function DELETE(request: NextRequest) {
  const session = await exigirAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id') || ''
  if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'id inválido' }, { status: 400 })

  try {
    const db = await getDb()
    const removido = await db.collection<ProuniBenefit>(PROUNI_BENEFITS_COLLECTION).findOneAndDelete({
      _id: new ObjectId(id) as any,
    })
    if (!removido) return NextResponse.json({ error: 'Desconto não encontrado' }, { status: 404 })

    await audit({
      action: 'prouni_benefit_deleted',
      actorUserId: session.userId,
      resourceType: 'prouni_benefit',
      resourceId: `${removido.itemType}:${removido.itemId}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/prouni/beneficios] DELETE erro:', error)
    return NextResponse.json({ error: 'Erro ao remover desconto' }, { status: 500 })
  }
}
