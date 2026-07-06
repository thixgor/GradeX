import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { SHOP_STATUS_LABELS } from '@/lib/shop'
import { sendShopOrderStatusEmail } from '@/lib/mail'
import type { ShopOrder, ShopOrderStatus, Notification } from '@/lib/types'

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
    const push: any = {}
    let statusChanged = false
    let newStatus: ShopOrderStatus = order.status

    if (body.status && VALID_STATUSES.includes(body.status) && body.status !== order.status) {
      newStatus = body.status
      set.status = newStatus
      push.statusHistory = {
        status: newStatus,
        note: body.note ? String(body.note).slice(0, 500) : undefined,
        at: now,
        byName: session.name,
      }
      statusChanged = true
    } else if (body.note && String(body.note).trim()) {
      // Nota sem mudança de status (atualização de acompanhamento)
      push.statusHistory = {
        status: order.status,
        note: String(body.note).slice(0, 500),
        at: now,
        byName: session.name,
      }
      statusChanged = true
    }

    if (body.tracking && typeof body.tracking === 'object') {
      set.tracking = {
        code: body.tracking.code ? String(body.tracking.code).slice(0, 120) : undefined,
        url: body.tracking.url ? String(body.tracking.url).slice(0, 500) : undefined,
        carrier: body.tracking.carrier ? String(body.tracking.carrier).slice(0, 120) : undefined,
      }
    }

    const updateOp: any = { $set: set }
    if (push.statusHistory) updateOp.$push = { statusHistory: push.statusHistory }
    await db.collection('shop_orders').updateOne({ _id: new ObjectId(id) }, updateOp)

    // Notifica o usuário quando houve atualização relevante
    if (statusChanged) {
      const message = body.note
        ? `Pedido ${order.orderNumber}: ${String(body.note).slice(0, 140)}`
        : `Pedido ${order.orderNumber}: ${SHOP_STATUS_LABELS[newStatus]}`
      const notif: Omit<Notification, '_id'> = {
        userId: order.userId,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        type: 'order_update',
        message,
        read: false,
        createdAt: now,
      }
      await db.collection('notifications').insertOne(notif as any)

      // E-mail (best-effort)
      sendShopOrderStatusEmail({
        to: order.userEmail,
        userName: order.userName,
        orderNumber: order.orderNumber,
        status: newStatus,
        note: body.note ? String(body.note) : undefined,
        tracking: set.tracking || order.tracking,
      }).catch((e) => console.warn('[loja/orders] email falhou:', e))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating shop order:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 })
  }
}
