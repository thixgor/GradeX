/**
 * Base comum das duas entregas que o admin dispara a partir de um acesso já
 * existente (`material_purchases`):
 *
 *   - avisar que o material está liberado para download (sem anexo);
 *   - baixar o PDF já com a marca d'água daquela pessoa, para entregar por
 *     fora quando for preciso.
 *
 * Ambas precisam da mesma coisa: quem é o dono do acesso (com nome/e-mail
 * atuais do cadastro, que podem ter mudado desde a compra), qual item ele
 * comprou e qual o link dele na plataforma.
 */

import { Db, ObjectId } from 'mongodb'
import { isValidObjectId } from './api-security'
import { getAppUrl } from './serial-keys'

export interface DeliveryTarget {
  purchase: any
  userId: string
  userName: string
  userEmail: string
  /** Identificador do pedido, usado nos metadados da marca d'água. */
  orderId: string
  itemType: 'material' | 'package'
  itemId: string
  itemTitle: string
}

export type DeliveryTargetResult =
  | { ok: true; target: DeliveryTarget }
  | { ok: false; status: number; error: string }

/** Página onde o botão de download aparece para o usuário. */
export function materialItemUrl(itemType: string, itemId: string): string {
  const base = getAppUrl()
  return itemType === 'package'
    ? `${base}/materiais?tab=packages&package=${encodeURIComponent(itemId)}`
    : `${base}/materiais/${encodeURIComponent(itemId)}`
}

/**
 * Resolve o alvo de uma entrega a partir do id da compra/concessão, validando
 * tudo o que as duas rotas precisam antes de agir.
 */
export async function resolvePurchaseTarget(
  db: Db,
  purchaseId: string
): Promise<DeliveryTargetResult> {
  if (!purchaseId || !isValidObjectId(purchaseId)) {
    return { ok: false, status: 400, error: 'purchaseId inválido' }
  }

  const purchase = await db.collection('material_purchases').findOne({
    _id: new ObjectId(purchaseId),
  })
  if (!purchase || purchase.status !== 'completed') {
    return { ok: false, status: 404, error: 'Compra não encontrada' }
  }

  if (!purchase.itemId || !isValidObjectId(String(purchase.itemId))) {
    return { ok: false, status: 422, error: 'Compra sem item associado válido.' }
  }
  if (purchase.itemType !== 'material' && purchase.itemType !== 'package') {
    return { ok: false, status: 422, error: `Tipo de item não suportado: ${purchase.itemType}` }
  }

  // Nome/e-mail vêm do cadastro atual quando ele existe: é para lá que o aviso
  // vai, e é esse o nome que precisa aparecer na marca d'água.
  let userId = purchase.userId ? String(purchase.userId) : ''
  let userName = purchase.userName || ''
  let userEmail = purchase.userEmail || ''
  if (userId && isValidObjectId(userId)) {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, email: 1 } }
    )
    if (user) {
      userName = user.name || userName
      userEmail = user.email || userEmail
    }
  }

  return {
    ok: true,
    target: {
      purchase,
      userId: userId || String(purchase._id),
      userName,
      userEmail,
      orderId:
        purchase.providerPaymentId || purchase.providerOrderId || String(purchase._id),
      itemType: purchase.itemType,
      itemId: String(purchase.itemId),
      itemTitle: purchase.itemTitle || '',
    },
  }
}
