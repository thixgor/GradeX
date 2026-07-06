import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { PhysicalProduct } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 404 })
    }
    const db = await getDb()
    const product = await db
      .collection<PhysicalProduct>('physical_products')
      .findOne({ _id: new ObjectId(id) })
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const session = await getSession()
    if (product.isHidden && session?.role !== 'admin') {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    // Incrementa visualização (não bloqueia a resposta)
    db.collection('physical_products')
      .updateOne({ _id: new ObjectId(id) }, { $inc: { viewCount: 1 } })
      .catch(() => {})

    // Resolve título do material vinculado (se houver) para exibir na página
    let linkedMaterialTitle: string | undefined
    if (product.linkedMaterialId && ObjectId.isValid(product.linkedMaterialId)) {
      const mat = await db
        .collection('materials')
        .findOne({ _id: new ObjectId(product.linkedMaterialId) }, { projection: { title: 1 } })
      linkedMaterialTitle = mat?.title
    }

    return NextResponse.json({
      product: { ...product, _id: String(product._id) },
      linkedMaterialTitle,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}
