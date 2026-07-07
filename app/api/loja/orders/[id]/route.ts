import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { SHOP_STATUS_LABELS } from '@/lib/shop'
import { sendShopOrderStatusEmail } from '@/lib/mail'
import type { ShopOrder, ShopOrderStatus, ShippingAddress, Notification } from '@/lib/types'

function s(v: any, max: number): string | undefined {
  if (v === undefined || v === null) return undefined
  const str = String(v).trim()
  return str ? str.slice(0, max) : undefined
}

/** Sanitiza um endereço de entrega vindo do admin (todos os campos opcionais no PATCH). */
function sanitizeAddress(input: any, current?: ShippingAddress): ShippingAddress | undefined {
  if (!input || typeof input !== 'object') return undefined
  const base: any = { ...(current || {}) }
  const fields: (keyof ShippingAddress)[] = ['name', 'phone', 'cep', 'street', 'number', 'complement', 'district', 'city', 'uf']
  for (const f of fields) {
    if (f in input) {
      const val = f === 'uf' ? s(input[f], 2)?.toUpperCase() : s(input[f], 160)
      base[f] = val ?? ''
    }
  }
  return base as ShippingAddress
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const VALID_STATUSES: ShopOrderStatus[] = [
  'awaiting_payment', 'paid', 'in_production', 'ready', 'shipped',
  'out_for_delivery', 'delivered', 'cancelled', 'refunded',
]

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const { id } = params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 404 })

    const db = await getDb()
    const order = await db.collection<ShopOrder>('shop_orders').findOne({ _id: new ObjectId(id) })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    if (order.userId !== session.userId && session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    return NextResponse.json({ order: { ...order, _id: String(order._id) } })
  } catch (error) {
    console.error('Error fetching shop order:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

// PATCH - Admin atualiza status / rastreio de um pedido físico
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const { id } = params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 404 })

    const db = await getDb()
    const order = await db.collection<ShopOrder>('shop_orders').findOne({ _id: new ObjectId(id) })
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })

    const body = await request.json()
    const now = new Date()
    const set: any = { updatedAt: now }
    const note = s(body.note, 500)
    const notifyCustomer = body.notifyCustomer !== false // default: notifica
    const updateSummary: string[] = []
    let statusChanged = false
    let newStatus: ShopOrderStatus = order.status

    // Status
    if (body.status && VALID_STATUSES.includes(body.status) && body.status !== order.status) {
      newStatus = body.status
      set.status = newStatus
      statusChanged = true
      updateSummary.push('Status')
    }

    // Rastreio
    if (body.tracking && typeof body.tracking === 'object') {
      const tracking = {
        code: s(body.tracking.code, 120),
        url: s(body.tracking.url, 500),
        carrier: s(body.tracking.carrier, 120),
      }
      const prev = order.tracking || {}
      if (tracking.code !== prev.code || tracking.url !== prev.url || tracking.carrier !== prev.carrier) {
        set.tracking = tracking
        updateSummary.push('Rastreamento')
      }
    }

    // Endereço de entrega (somente pedidos de envio)
    if (order.deliveryType === 'shipping' && body.shippingAddress && typeof body.shippingAddress === 'object') {
      const addr = sanitizeAddress(body.shippingAddress, order.shippingAddress)
      if (addr && JSON.stringify(addr) !== JSON.stringify(order.shippingAddress || {})) {
        set.shippingAddress = addr
        updateSummary.push('Endereço de entrega')
      }
    }

    // Nome do método de entrega
    if ('deliveryMethodName' in body) {
      const dm = s(body.deliveryMethodName, 120)
      if (dm !== order.deliveryMethodName) {
        set.deliveryMethodName = dm
        updateSummary.push('Método de entrega')
      }
    }

    // Nome do ponto de retirada
    if ('pickupPointName' in body) {
      const pp = s(body.pickupPointName, 160)
      if (pp !== order.pickupPointName) {
        set.pickupPointName = pp
        updateSummary.push('Ponto de retirada')
      }
    }

    // Previsão de entrega (aceita ISO/date ou null para limpar)
    if ('estimatedDeliveryDate' in body) {
      const raw = body.estimatedDeliveryDate
      const parsed = raw ? new Date(raw) : null
      const valid = parsed && !isNaN(parsed.getTime()) ? parsed : null
      const prevTime = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).getTime() : null
      if ((valid ? valid.getTime() : null) !== prevTime) {
        set.estimatedDeliveryDate = valid
        updateSummary.push('Previsão de entrega')
      }
    }

    const changed = updateSummary.length > 0 || !!note
    if (!changed) {
      return NextResponse.json({ success: true, changed: false })
    }

    // Registra na timeline
    const historyNote = note || (updateSummary.length ? `Informações atualizadas: ${updateSummary.join(', ')}` : undefined)
    const updateOp: any = {
      $set: set,
      $push: {
        statusHistory: {
          status: newStatus,
          note: historyNote,
          at: now,
          byName: session.name,
        },
      },
    }
    await db.collection('shop_orders').updateOne({ _id: new ObjectId(id) }, updateOp)

    // Notificação in-app
    const notifMessage = statusChanged
      ? `Pedido ${order.orderNumber}: ${SHOP_STATUS_LABELS[newStatus]}`
      : note
        ? `Pedido ${order.orderNumber}: ${note.slice(0, 140)}`
        : `Pedido ${order.orderNumber}: informações atualizadas`
    const notif: Omit<Notification, '_id'> = {
      userId: order.userId,
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      type: 'order_update',
      message: notifMessage,
      read: false,
      createdAt: now,
    }
    await db.collection('notifications').insertOne(notif as any)

    // E-mail ao cliente (best-effort) — toda atualização chega ao e-mail.
    if (notifyCustomer && order.userEmail) {
      sendShopOrderStatusEmail({
        to: order.userEmail,
        userName: order.userName,
        orderNumber: order.orderNumber,
        status: newStatus,
        statusChanged,
        note,
        updateSummary,
        tracking: set.tracking || order.tracking,
      }).catch((e) => console.warn('[loja/orders] email falhou:', e))
    }

    return NextResponse.json({ success: true, changed: true })
  } catch (error) {
    console.error('Error updating shop order:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}
