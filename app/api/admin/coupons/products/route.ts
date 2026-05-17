import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function normalize(value: string) {
  return value.trim()
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const q = normalize(searchParams.get('q') || '')
    if (q.length < 2) return NextResponse.json({ products: [] })

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const db = await getDb()

    const [materials, packages] = await Promise.all([
      db.collection('materials')
        .find({
          $or: [
            { title: regex },
            { description: regex },
            { tags: regex },
          ],
        })
        .project({ title: 1, type: 1, pricing: 1, price: 1, isHidden: 1 })
        .sort({ isHidden: 1, title: 1 })
        .limit(20)
        .toArray(),
      db.collection('material_packages')
        .find({
          $or: [
            { title: regex },
            { description: regex },
            { tags: regex },
          ],
        })
        .project({ title: 1, pricing: 1, price: 1, isHidden: 1 })
        .sort({ isHidden: 1, title: 1 })
        .limit(10)
        .toArray(),
    ])

    const products = [
      ...materials.map((material: any) => ({
        itemType: 'material',
        itemId: String(material._id),
        title: material.title || 'Material',
        kind: material.type === 'flashcard_deck' ? 'flashcard' : 'material',
        typeLabel: material.type === 'flashcard_deck' ? 'Flashcard' : 'Material',
        price: Number(material.price || 0),
        pricing: material.pricing || 'free',
        isHidden: material.isHidden === true,
      })),
      ...packages.map((pkg: any) => ({
        itemType: 'package',
        itemId: String(pkg._id),
        title: pkg.title || 'Pacote',
        kind: 'package',
        typeLabel: 'Pacote',
        price: Number(pkg.price || 0),
        pricing: pkg.pricing || 'free',
        isHidden: pkg.isHidden === true,
      })),
    ]

    return NextResponse.json({ products })
  } catch (error: any) {
    console.error('[admin/coupons/products] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar itens' }, { status: 500 })
  }
}
