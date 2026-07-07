import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import type { PhysicalProduct, PhysicalLinkMode } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sanitizeImages(input: any): string[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((u) => typeof u === 'string' && u.trim().length > 0)
    .map((u) => String(u).trim())
    .slice(0, 12)
}

function sanitizeLinkMode(v: any): PhysicalLinkMode {
  return v === 'addon' || v === 'material' ? v : 'standalone'
}

function sanitizeVersions(input: any) {
  if (!Array.isArray(input)) return undefined
  const versions = input
    .filter((v) => v && String(v.name || '').trim())
    .slice(0, 20)
    .map((v, i) => {
      const priceNum = Number(v.price)
      const addonNum = Number(v.addonSurcharge)
      return {
        id: v.id ? String(v.id) : `ver-${Date.now()}-${i}`,
        name: String(v.name).trim().slice(0, 120),
        price: v.price !== undefined && v.price !== null && v.price !== '' && !isNaN(priceNum) && priceNum >= 0
          ? Math.round(priceNum * 100) / 100
          : undefined,
        addonSurcharge: v.addonSurcharge !== undefined && v.addonSurcharge !== null && v.addonSurcharge !== '' && !isNaN(addonNum) && addonNum >= 0
          ? Math.round(addonNum * 100) / 100
          : undefined,
        details: v.details ? String(v.details).slice(0, 1000) : undefined,
      }
    })
  return versions.length > 0 ? versions : undefined
}

function buildProductDoc(body: any, session: { userId: string; name: string }) {
  const linkMode = sanitizeLinkMode(body.linkMode)
  const trackStock = body.trackStock === true
  const madeToOrder = body.madeToOrder === true
  return {
    title: String(body.title || '').trim(),
    description: body.description ? String(body.description) : '',
    slug: body.slug ? String(body.slug).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') : undefined,
    images: sanitizeImages(body.images),
    price: Math.max(0, Number(body.price) || 0),
    compareAtPrice: body.compareAtPrice ? Math.max(0, Number(body.compareAtPrice)) : undefined,
    linkMode,
    linkedMaterialId: (linkMode === 'addon' || linkMode === 'material') && body.linkedTarget !== 'package' && body.linkedMaterialId
      ? String(body.linkedMaterialId)
      : undefined,
    linkedPackageId: (linkMode === 'addon' || linkMode === 'material') && body.linkedTarget === 'package' && body.linkedPackageId
      ? String(body.linkedPackageId)
      : undefined,
    addonSurcharge: linkMode === 'addon' ? Math.max(0, Number(body.addonSurcharge) || 0) : undefined,
    versions: sanitizeVersions(body.versions),
    pageCount: body.pageCount !== undefined && body.pageCount !== null && body.pageCount !== '' && Number(body.pageCount) > 0
      ? Math.floor(Number(body.pageCount))
      : undefined,
    madeToOrder,
    productionDays: madeToOrder ? Math.max(0, Number(body.productionDays) || 0) : undefined,
    trackStock,
    stock: trackStock ? Math.max(0, Math.floor(Number(body.stock) || 0)) : undefined,
    tags: Array.isArray(body.tags) ? body.tags.map((t: any) => String(t)).slice(0, 30) : [],
    allowedGroups: Array.isArray(body.allowedGroups) ? body.allowedGroups : [],
    isHidden: body.isHidden === true,
    isFeatured: body.isFeatured === true,
    order: Number(body.order) || 0,
  }
}

// GET - Lista produtos. Público (só visíveis) a menos que ?admin=1 e admin logado.
export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const wantAdmin = searchParams.get('admin') === '1'
    const linkedMaterialId = searchParams.get('linkedMaterialId')
    const linkedMaterialIds = searchParams.get('linkedMaterialIds')
    const linkedPackageIds = searchParams.get('linkedPackageIds')

    const filter: any = {}
    if (!(wantAdmin && session?.role === 'admin')) {
      filter.isHidden = { $ne: true }
    }
    const parseIds = (v: string | null) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 100) : [])
    const matIds = parseIds(linkedMaterialIds)
    const pkgIds = parseIds(linkedPackageIds)
    if (matIds.length > 0 || pkgIds.length > 0) {
      const or: any[] = []
      if (matIds.length > 0) or.push({ linkedMaterialId: { $in: matIds } })
      if (pkgIds.length > 0) or.push({ linkedPackageId: { $in: pkgIds } })
      filter.$or = or
    } else if (linkedMaterialId) {
      filter.linkedMaterialId = linkedMaterialId
    }

    const products = await db
      .collection<PhysicalProduct>('physical_products')
      .find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .toArray()

    const serialized = products.map((p) => ({ ...p, _id: String(p._id) }))
    return NextResponse.json({ products: serialized })
  } catch (error) {
    console.error('Error fetching physical products:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}

// POST - Criar produto (admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const db = await getDb()
    const body = await request.json()
    if (!body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })
    }

    const now = new Date()
    const doc = {
      ...buildProductDoc(body, session),
      salesCount: 0,
      viewCount: 0,
      createdBy: session.userId,
      createdByName: session.name,
      createdAt: now,
      updatedAt: now,
    }
    const result = await db.collection('physical_products').insertOne(doc as any)
    return NextResponse.json({ _id: String(result.insertedId), ...doc }, { status: 201 })
  } catch (error) {
    console.error('Error creating physical product:', error)
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 })
  }
}

// PUT - Atualizar produto (admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const db = await getDb()
    const body = await request.json()
    const { _id } = body
    if (!_id || !ObjectId.isValid(String(_id))) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const updates = { ...buildProductDoc(body, session), updatedAt: new Date() }
    await db.collection('physical_products').updateOne(
      { _id: new ObjectId(String(_id)) },
      { $set: updates }
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating physical product:', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

// DELETE - Remover produto (admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await db.collection('physical_products').deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting physical product:', error)
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 })
  }
}
