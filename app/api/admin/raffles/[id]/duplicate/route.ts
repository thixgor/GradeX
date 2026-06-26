import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { ensureUniqueSlug, decodeHtmlEntities } from '@/lib/raffles'
import { audit } from '@/lib/payments/audit'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Duplica uma rifa como rascunho (sem números vendidos nem ganhadores). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = await getDb()
  const source = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!source) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  const now = new Date()
  const name = `${decodeHtmlEntities(source.name)} (cópia)`
  const slug = await ensureUniqueSlug(db, name)

  const { _id, ...rest } = source
  const doc: Omit<Raffle, '_id'> = {
    ...rest,
    name,
    prizeName: decodeHtmlEntities(source.prizeName),
    prizeCategory: source.prizeCategory ? decodeHtmlEntities(source.prizeCategory) : undefined,
    slug,
    status: 'draft',
    visibility: source.visibility,
    winners: [],
    soldCount: 0,
    drawAt: undefined,
    drawnBy: undefined,
    createdBy: session.userId,
    createdByName: session.name,
    createdAt: now,
    updatedAt: now,
  }

  const res = await db.collection<Raffle>('raffles').insertOne(doc as any)

  await audit({
    action: 'raffle_created',
    actorUserId: session.userId,
    resourceType: 'raffle',
    resourceId: res.insertedId.toString(),
    metadata: { duplicatedFrom: params.id },
  })

  return NextResponse.json({ id: res.insertedId.toString(), slug }, { status: 201 })
}
