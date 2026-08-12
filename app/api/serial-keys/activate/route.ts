import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { SerialKey, User, AccountType } from '@/lib/types'
import { ObjectId } from 'mongodb'
import {
  SERIAL_KEYS_COLLECTION,
  normalizeSerialKey,
  grantSerialKeyProduct,
  markSerialKeyActivated,
  serializeSerialKeyForActivation,
  logSerialKeySecurity,
  maskSerialKey,
} from '@/lib/serial-keys'
import { PLUS_TIER, isPlusAccount } from '@/lib/account-tier'
import { restorePlusClaims } from '@/lib/plus-claims'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET — consulta pública (sem login) de uma serial key pelo token ou pela key,
 * para a página de ativação exibir o produto e o status. Nunca concede acesso
 * nem revela a key inteira.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'serial_key_lookup', 40, 60_000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const keyParam = searchParams.get('key')
  const db = await getDb()
  const col = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)

  let serial: SerialKey | null = null
  if (token) {
    serial = await col.findOne({ activationToken: token })
  } else if (keyParam) {
    serial = await col.findOne({ key: normalizeSerialKey(keyParam) })
  }

  if (!serial) {
    return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
  }
  if (!serial.grant) {
    // Keys legadas (sem `grant`, ex.: geradas manualmente pelo admin em
    // /admin/keys): apenas informa que existe e se já foi usada. Keys com
    // `grant` (compras E concessões avulsas como entrega de material por
    // formulário) sempre passam pelo fluxo universal abaixo.
    return NextResponse.json({
      found: true,
      legacy: true,
      alreadyActivated: !!serial.used,
      productType: serial.type,
    })
  }
  return NextResponse.json({ found: true, legacy: false, ...serializeSerialKeyForActivation(serial) })
}

/**
 * POST — ativa uma serial key na conta autenticada.
 * Suporta keys de compra (produto avulso) e keys legadas de administrador.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  const rl = await checkRateLimit(ip, 'serial_key_activate', 15, 60_000)
  if (!rl.success) {
    await logSerialKeySecurity({ kind: 'rate_limited', ip, userAgent, detail: 'activate' })
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns instantes.' }, { status: 429 })
  }

  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado', requiresAuth: true }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { key, token } = body as { key?: string; token?: string }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>(SERIAL_KEYS_COLLECTION)
    const usersCollection = db.collection<User>('users')

    let serialKey: SerialKey | null = null
    if (token && typeof token === 'string') {
      serialKey = await keysCollection.findOne({ activationToken: token })
    } else if (key && typeof key === 'string') {
      serialKey = await keysCollection.findOne({ key: normalizeSerialKey(key) })
    } else {
      return NextResponse.json({ error: 'Serial key inválida' }, { status: 400 })
    }

    if (!serialKey) {
      await logSerialKeySecurity({
        kind: 'invalid_key', ip, userAgent, userId: session.userId, email: session.email,
        keyMasked: key ? maskSerialKey(key) : undefined, detail: 'not_found',
      })
      return NextResponse.json({ error: 'Serial key não encontrada' }, { status: 404 })
    }

    // ── Fluxo universal (compras E concessões avulsas, ex.: prêmio de form) ──
    // Qualquer key com `grant` configurado (independente de `origin`) usa a
    // concessão exata de produto abaixo. Só cai no fluxo legado quem não tem
    // `grant` (keys manuais antigas de /admin/keys).
    if (serialKey.grant) {
      if (serialKey.status === 'cancelled') {
        return NextResponse.json({ error: 'Esta serial key foi cancelada. Fale com o suporte.' }, { status: 400 })
      }
      if (serialKey.paymentStatus !== 'approved') {
        return NextResponse.json({ error: 'O pagamento desta compra ainda não foi aprovado.' }, { status: 400 })
      }
      // Idempotência: se já foi ativada, só permite pelo mesmo dono.
      if (serialKey.status === 'activated' || serialKey.used) {
        if (serialKey.activatedByUserId === session.userId) {
          return NextResponse.json({
            message: 'Produto já ativado nesta conta.',
            alreadyActivated: true,
            productType: serialKey.productType,
            productTitle: serialKey.productTitle,
            redirectTo: '/dashboard',
          })
        }
        await logSerialKeySecurity({
          kind: 'activation_blocked', ip, userAgent, userId: session.userId, email: session.email,
          keyMasked: maskSerialKey(serialKey.key), detail: 'already_activated_other_account',
        })
        return NextResponse.json({ error: 'Esta serial key já foi ativada em outra conta.' }, { status: 409 })
      }

      // Ativação restrita ao e-mail da compra (materiais com envio automático de
      // PDF): só ativa em uma conta cujo e-mail seja igual ao do comprador.
      if (serialKey.restrictActivationToBuyerEmail && serialKey.buyerEmail) {
        const sessionEmail = String(session.email || '').trim().toLowerCase()
        const buyerEmail = String(serialKey.buyerEmail).trim().toLowerCase()
        if (!sessionEmail || sessionEmail !== buyerEmail) {
          await logSerialKeySecurity({
            kind: 'activation_blocked', ip, userAgent, userId: session.userId, email: session.email,
            keyMasked: maskSerialKey(serialKey.key), detail: 'email_mismatch_restricted',
          })
          return NextResponse.json({
            error: 'Esta compra é restrita ao e-mail usado no pagamento. Entre com a conta desse e-mail (ou crie uma com ele) para ativar.',
          }, { status: 403 })
        }
      }

      // Concede exatamente o produto comprado.
      const grantResult = await grantSerialKeyProduct(db, serialKey, {
        userId: session.userId,
        name: session.name,
        email: session.email,
      })
      await markSerialKeyActivated(db, serialKey._id as any, {
        userId: session.userId,
        name: session.name,
        email: session.email,
      })

      return NextResponse.json({
        message: 'Serial key ativada com sucesso',
        productType: serialKey.productType,
        productTitle: serialKey.productTitle,
        productLabel: grantResult.productLabel,
        redirectTo: grantResult.redirectTo,
      })
    }

    // ── Fluxo legado (keys de administrador) ───────────────────────────────
    if (serialKey.used) {
      return NextResponse.json({ error: 'Esta serial key já foi utilizada' }, { status: 400 })
    }

    let accountType: AccountType
    let trialExpiresAt: Date | undefined
    let durationInMs = 0

    if (serialKey.type === 'plus' || serialKey.type === 'premium') {
      // Keys legadas ('premium') concedem o cargo canônico atual.
      accountType = PLUS_TIER
      trialExpiresAt = undefined
    } else if (serialKey.type === 'trial') {
      accountType = 'trial'
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + 7)
      trialExpiresAt = expirationDate
      durationInMs = 7 * 24 * 60 * 60 * 1000
    } else {
      accountType = 'trial'
      const days = serialKey.customDurationDays || 0
      const hours = serialKey.customDurationHours || 0
      const minutes = serialKey.customDurationMinutes || 0
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + days)
      expirationDate.setHours(expirationDate.getHours() + hours)
      expirationDate.setMinutes(expirationDate.getMinutes() + minutes)
      trialExpiresAt = expirationDate
      durationInMs = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60) * 1000
    }

    const quotasByAccountType: Record<string, number> = { gratuito: 3, trial: 10, premium: 20 }
    const newQuota = quotasByAccountType[accountType] || 3

    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          accountType,
          trialExpiresAt,
          trialDuration: serialKey.type === 'custom' ? Math.ceil(durationInMs / (24 * 60 * 60 * 1000)) : 7,
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: newQuota,
          lastDailyReset: new Date(),
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Key legada que concede Plus+: devolve os resgates suspensos de uma
    // assinatura anterior.
    if (isPlusAccount(accountType)) {
      await restorePlusClaims(session.userId, 'serial_key_activated', db).catch(err =>
        console.error('[serial-keys] restaurar resgates Plus+ falhou:', err)
      )
    }

    await keysCollection.updateOne(
      { key: serialKey.key },
      { $set: { used: true, usedBy: session.userId, usedByName: session.name, usedAt: new Date() } }
    )

    return NextResponse.json({
      message: 'Serial key ativada com sucesso',
      accountType,
      trialExpiresAt,
      keyType: serialKey.type,
      customDuration: serialKey.type === 'custom' ? {
        days: serialKey.customDurationDays,
        hours: serialKey.customDurationHours,
        minutes: serialKey.customDurationMinutes,
      } : undefined,
    })
  } catch (error) {
    console.error('Activate serial key error:', error)
    return NextResponse.json({ error: 'Erro ao ativar serial key' }, { status: 500 })
  }
}
