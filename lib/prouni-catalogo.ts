import { Db, ObjectId } from 'mongodb'
import {
  getManualClinicoConfig,
  getManualClinicoCurrentPrice,
  MANUAL_CLINICO_PRODUCT_ID,
} from '@/lib/manual-clinico-product'
import type { ProuniItemType } from '@/lib/prouni-fies'

/**
 * O produto por trás de um `(itemType, itemId)`.
 *
 * O benefício PROUNI/FIES alcança quatro coisas que a plataforma nunca tratou
 * junto: material, pacote, Manual Clínico e plano de assinatura. Cada uma mora
 * numa coleção diferente, com nomes de campo diferentes ("title" x "nome",
 * "price" x "preco"). Sem este módulo, cada rota nova repetiria os quatro
 * casos — e a quinta rota esqueceria um deles.
 *
 * A saída é deliberadamente magra: título, preço, capa e para onde levar a
 * pessoa. É o que a página exclusiva e a tela do admin precisam mostrar, e nada
 * além disso vaza para telas públicas.
 */

export interface ProuniProdutoResumo {
  itemType: ProuniItemType
  itemId: string
  title: string
  /** Preço cheio, em reais. Zero quando o item é gratuito ou não tem preço. */
  price: number
  coverImage?: string
  /** Rótulo curto do tipo, para a UI ("Material", "Pacote", "Plano"…). */
  typeLabel: string
  /** Página normal do produto (para onde o botão "voltar" leva). */
  href: string
  /** Item indisponível (oculto/desativado) — a página exclusiva não vende. */
  isUnavailable: boolean
  /** Só para o Manual Clínico: planos com preço, para a tela explicar o alcance. */
  plans?: Array<{ key: string; label: string; price: number }>
}

export async function resolveProuniProduto(
  db: Db,
  itemType: ProuniItemType,
  itemId: string
): Promise<ProuniProdutoResumo | null> {
  const id = String(itemId || '')
  if (!id) return null

  if (itemType === 'material' || itemType === 'package') {
    if (!ObjectId.isValid(id)) return null
    const collection = itemType === 'package' ? 'material_packages' : 'materials'
    const doc = await db.collection(collection).findOne(
      { _id: new ObjectId(id) },
      { projection: { title: 1, price: 1, pricing: 1, coverImage: 1, isHidden: 1, type: 1 } }
    )
    if (!doc) return null
    const ehFlashcard = doc.type === 'flashcard_deck'
    return {
      itemType,
      itemId: id,
      title: doc.title || (itemType === 'package' ? 'Pacote' : 'Material'),
      price: Number(doc.price || 0),
      coverImage: doc.coverImage || undefined,
      typeLabel: itemType === 'package' ? 'Pacote' : ehFlashcard ? 'Flashcards' : 'Material',
      href: itemType === 'package' ? `/pacotes/${id}` : `/materiais/${id}`,
      isUnavailable: doc.isHidden === true,
    }
  }

  if (itemType === 'manual_clinico') {
    // O Manual Clínico é um produto só, com id fixo. Um id diferente aqui é
    // link forjado, não produto novo.
    if (id !== MANUAL_CLINICO_PRODUCT_ID) return null
    const config = await getManualClinicoConfig(db)
    return {
      itemType,
      itemId: id,
      title: config.label || 'Manual Clínico Completo',
      price: getManualClinicoCurrentPrice(config),
      coverImage: (config as any).coverImage || undefined,
      typeLabel: 'Produto',
      href: '/manual-clinico',
      isUnavailable: config.isActive === false,
      plans: (config.plans || [])
        .filter((plan: any) => plan.enabled !== false)
        .map((plan: any) => ({
          key: String(plan.key),
          label: String(plan.label || plan.key),
          price: Number(plan.price || 0),
        })),
    }
  }

  if (itemType === 'plus') {
    const settings = await db.collection('admin_settings').findOne({})
    const plano = (settings?.planos || []).find((p: any) => String(p.tipo) === id)
    if (!plano) return null
    return {
      itemType,
      itemId: id,
      title: plano.nome || 'Assinatura',
      price: Number(plano.preco || 0),
      typeLabel: 'Plano',
      href: '/buy',
      isUnavailable: plano.oculto === true,
    }
  }

  return null
}
