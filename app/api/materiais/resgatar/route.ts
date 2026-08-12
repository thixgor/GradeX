import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { audit } from '@/lib/payments/audit'
import { isPlusAccount, PLUS_LABEL } from '@/lib/account-tier'
import { checkPlusDownloadAllowance, recordPlusDownload } from '@/lib/plus-guard'
import { PLUS_CLAIM_REVOKED_STATUS } from '@/lib/plus-claims'
import type { MaterialPurchase, User } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Resgate de um material/pacote pela assinatura Plus+.
 *
 * O Plus+ inclui todo o acervo, mas o acesso **não** é implícito: o assinante
 * precisa resgatar cada item. Três motivos:
 *
 *  1. **Intenção explícita.** "Meus materiais" passa a refletir o que a pessoa
 *     realmente quis, não os milhares de itens do catálogo.
 *  2. **Ponto único de contabilização.** O resgate é o momento em que o acervo
 *     sai da plataforma para a conta — é exatamente ali que o Plus+ Guard
 *     precisa contar, e não em cada abertura de leitor depois.
 *  3. **Auditoria de reembolso.** Fica registrado o que foi levado e quando,
 *     com data de resgate própria.
 *
 * O registro criado é um `material_purchases` com `price: 0` e
 * `source: 'plus'` — reaproveita todo o caminho de acesso já existente
 * (leitor, download, "Meus materiais") sem duplicar lógica.
 *
 * O resgate vale enquanto a assinatura valer: quando o Plus+ cai, o registro é
 * suspenso (`status: 'plus_revoked'`) e volta na renovação — ver
 * `lib/plus-claims`. Compra avulsa é vitalícia e não passa por aqui.
 */
const Schema = z.object({
  itemType: z.enum(['material', 'package']),
  itemId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'materiais_resgatar', 40, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um instante.' }, { status: 429 })
  }

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const { itemType, itemId } = parsed.data

  if (!ObjectId.isValid(itemId)) {
    return NextResponse.json({ error: 'itemId inválido' }, { status: 400 })
  }

  const db = await getDb()

  const user = await db.collection<User>('users').findOne(
    { _id: new ObjectId(session.userId) as any },
    { projection: { accountType: 1, name: 1, email: 1, premiumExpiresAt: 1, plusDownloadsBlocked: 1 } },
  )
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  if (!isPlusAccount(user.accountType)) {
    return NextResponse.json(
      { error: `O resgate sem custo é exclusivo de assinantes ${PLUS_LABEL}.`, requiresPlus: true },
      { status: 403 },
    )
  }

  // Assinatura vencida ainda carrega o cargo até o cron rebaixar — não pode
  // resgatar nesse intervalo.
  if (user.premiumExpiresAt && new Date(user.premiumExpiresAt) <= new Date()) {
    return NextResponse.json(
      { error: 'Sua assinatura expirou. Renove para continuar resgatando materiais.', requiresPlus: true },
      { status: 403 },
    )
  }

  const collection = itemType === 'package' ? 'material_packages' : 'materials'
  const item = await db.collection(collection).findOne({ _id: new ObjectId(itemId) })
  if (!item) return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
  if (item.isHidden) {
    return NextResponse.json({ error: 'Item indisponível' }, { status: 404 })
  }

  // Idempotente: resgatar de novo (ou já ter comprado) não duplica registro.
  const existing = await db.collection<MaterialPurchase>('material_purchases').findOne({
    userId: session.userId,
    itemType,
    itemId,
    status: { $in: ['completed', PLUS_CLAIM_REVOKED_STATUS] },
  } as any)
  if (existing?.status === 'completed') {
    return NextResponse.json({
      success: true,
      alreadyOwned: true,
      message: 'Você já tem este item na sua conta.',
    })
  }

  // Resgate de uma assinatura anterior, suspenso quando ela caiu. A renovação
  // já devolve tudo automaticamente; este caminho cobre o registro que tenha
  // escapado. Reativa sem consumir cota: o conteúdo já saiu da plataforma uma
  // vez, não é uma extração nova.
  if (existing) {
    await db.collection<MaterialPurchase>('material_purchases').updateOne(
      { _id: existing._id as any },
      {
        $set: { status: 'completed', plusRestoredAt: new Date() },
        $unset: { plusRevokedAt: '', plusRevokedReason: '' },
      } as any,
    )
    return NextResponse.json({
      success: true,
      claimed: true,
      restored: true,
      message: `Resgate reativado com o ${PLUS_LABEL}. O item voltou para Meus materiais.`,
    })
  }

  // O resgate é o evento que o Plus+ Guard contabiliza — é aqui que o acervo
  // sai da plataforma para a conta. Baixar depois o que já é seu não consome
  // cota de novo.
  const allowance = await checkPlusDownloadAllowance({ userId: session.userId, user, db })
  if (!allowance.allowed) {
    return NextResponse.json(
      {
        error: allowance.message || 'Limite de resgates atingido.',
        reason: allowance.reason,
        retryAt: allowance.retryAt,
      },
      { status: 429 },
    )
  }

  const now = new Date()
  const purchase: Omit<MaterialPurchase, '_id'> = {
    userId: session.userId,
    userName: user.name || session.name || '',
    userEmail: user.email || session.email || '',
    itemType,
    itemId,
    itemTitle: item.title || (itemType === 'package' ? 'Pacote' : 'Material'),
    price: 0,
    status: 'completed',
    source: 'plus',
    claimedAt: now,
    purchasedAt: now,
  }

  await db.collection<MaterialPurchase>('material_purchases').insertOne(purchase as any)
  await db.collection(collection).updateOne({ _id: new ObjectId(itemId) }, { $inc: { downloadCount: 1 } })

  recordPlusDownload({
    userId: session.userId,
    userEmail: purchase.userEmail,
    userName: purchase.userName,
    accountType: user.accountType,
    kind: itemType === 'package' ? 'material' : 'material',
    resourceId: itemId,
    resourceTitle: purchase.itemTitle,
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
    db,
  }).catch(() => {})

  await audit({
    action: 'material_unlocked',
    actorUserId: session.userId,
    targetUserId: session.userId,
    resourceType: itemType,
    resourceId: itemId,
    metadata: { via: 'plus_claim', price: 0 },
  })

  return NextResponse.json({
    success: true,
    claimed: true,
    remaining: allowance.remaining,
    message: `Resgatado com o ${PLUS_LABEL}. O item já está em Meus materiais.`,
  })
}
