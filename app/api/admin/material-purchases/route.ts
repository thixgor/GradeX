import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

/**
 * GET - Mapa de propriedade de materiais por usuário (somente admin).
 *
 * Usado pela central de e-mails para filtrar destinatários que compraram
 * (ou não compraram) determinados materiais. Compras de pacotes são
 * resolvidas para os materiais que elas contêm, de forma que um usuário
 * que comprou um pacote conte como dono de todos os materiais incluídos.
 *
 * Retorno:
 *   {
 *     ownership: {
 *       byUserId: { [userId]: string[] },        // materialIds
 *       byEmail:  { [emailLowerCase]: string[] }, // materialIds
 *     }
 *   }
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()

    const purchases = await db
      .collection('material_purchases')
      .find({ status: 'completed', itemType: { $in: ['material', 'package'] } })
      .project({ userId: 1, userEmail: 1, itemType: 1, itemId: 1 })
      .toArray()

    // Resolver pacotes -> materialIds (uma consulta só, em lote)
    const packageIds = [
      ...new Set(
        purchases
          .filter((p: any) => p.itemType === 'package' && p.itemId)
          .map((p: any) => String(p.itemId))
      ),
    ]

    const packageMaterialMap = new Map<string, string[]>()
    if (packageIds.length > 0) {
      const packageObjectIds = packageIds
        .map((id) => {
          try {
            return new ObjectId(id)
          } catch {
            return null
          }
        })
        .filter(Boolean) as ObjectId[]

      if (packageObjectIds.length > 0) {
        const packages = await db
          .collection('material_packages')
          .find({ _id: { $in: packageObjectIds } })
          .project({ materialIds: 1 })
          .toArray()
        for (const pkg of packages) {
          packageMaterialMap.set(
            String(pkg._id),
            Array.isArray(pkg.materialIds) ? pkg.materialIds.map(String) : []
          )
        }
      }
    }

    const byUserId: Record<string, Set<string>> = {}
    const byEmail: Record<string, Set<string>> = {}

    const addMaterial = (target: Record<string, Set<string>>, key: string, materialId: string) => {
      if (!key || !materialId) return
      if (!target[key]) target[key] = new Set<string>()
      target[key].add(materialId)
    }

    for (const purchase of purchases) {
      const materialIds: string[] =
        purchase.itemType === 'package'
          ? packageMaterialMap.get(String(purchase.itemId)) || []
          : purchase.itemId
            ? [String(purchase.itemId)]
            : []

      if (materialIds.length === 0) continue

      const userId = purchase.userId ? String(purchase.userId) : ''
      const email = purchase.userEmail ? String(purchase.userEmail).toLowerCase().trim() : ''

      for (const materialId of materialIds) {
        if (userId) addMaterial(byUserId, userId, materialId)
        if (email) addMaterial(byEmail, email, materialId)
      }
    }

    const serialize = (map: Record<string, Set<string>>) => {
      const out: Record<string, string[]> = {}
      for (const [key, set] of Object.entries(map)) {
        out[key] = Array.from(set)
      }
      return out
    }

    return NextResponse.json({
      ownership: {
        byUserId: serialize(byUserId),
        byEmail: serialize(byEmail),
      },
    })
  } catch (error) {
    console.error('Admin material-purchases map error:', error)
    return NextResponse.json({ error: 'Erro ao carregar compras de materiais' }, { status: 500 })
  }
}
