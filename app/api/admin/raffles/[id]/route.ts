import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { ensureUniqueSlug, getEffectiveStatus, getTakenNumbers, RAFFLE_TEMPLATES, sanitizeRaffleText, decodeHtmlEntities } from '@/lib/raffles'
import { audit } from '@/lib/payments/audit'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TEMPLATE_IDS = RAFFLE_TEMPLATES.map(t => t.id) as [string, ...string[]]

const UpdateSchema = z.object({
  name: z.string().min(2).max(140).optional(),
  slug: z.string().max(80).optional(),
  description: z.string().max(4000).nullable().optional(),
  pricePerNumber: z.number().positive().max(100000).optional(),
  totalNumbers: z.number().int().min(2).max(100000).optional(),
  winnersCount: z.number().int().min(1).max(1000).optional(),
  coverImageUrl: z.string().max(1000).nullable().optional(),
  prizeName: z.string().min(1).max(200).optional(),
  prizeDescription: z.string().max(4000).nullable().optional(),
  prizeCategory: z.string().max(80).nullable().optional(),
  prizeImageUrl: z.string().max(1000).nullable().optional(),
  videos: z.array(z.object({ url: z.string().max(1000), caption: z.string().max(160).optional() })).max(8).nullable().optional(),
  template: z.enum(TEMPLATE_IDS).optional(),
  customDesign: z.record(z.any()).nullable().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  status: z.enum(['draft', 'scheduled', 'open', 'closed', 'drawing', 'finished', 'cancelled']).optional(),
  rules: z.string().max(4000).nullable().optional(),
  allowManualDrawWhileOpen: z.boolean().optional(),
  allowDrawUnsoldNumbers: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
})

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = await getDb()
  const raffle = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!raffle) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  const taken = await getTakenNumbers(db, params.id)

  return NextResponse.json({
    raffle: {
      ...raffle,
      name: decodeHtmlEntities(raffle.name),
      prizeName: decodeHtmlEntities(raffle.prizeName),
      prizeCategory: decodeHtmlEntities(raffle.prizeCategory || ''),
      description: decodeHtmlEntities(raffle.description || ''),
      prizeDescription: decodeHtmlEntities(raffle.prizeDescription || ''),
      videos: (raffle.videos || []).map(v => ({ url: v.url, caption: decodeHtmlEntities(v.caption || '') })),
      id: String(raffle._id),
      _id: undefined,
      effectiveStatus: getEffectiveStatus(raffle),
    },
    soldNumbers: taken.sold,
    reservedNumbers: taken.reserved,
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }
  const d = parsed.data

  const db = await getDb()
  const existing = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!existing) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  // Reabrir só é permitido se não houver sorteio finalizado.
  if (d.status && d.status === 'open' && (existing.winners || []).length > 0) {
    return NextResponse.json({ error: 'Não é possível reabrir uma rifa que já teve sorteio.' }, { status: 400 })
  }

  // Reduzir o total de números abaixo do que já foi vendido é proibido.
  if (typeof d.totalNumbers === 'number' && d.totalNumbers !== existing.totalNumbers) {
    const maxSold = await db.collection('raffle_numbers').find({ raffleId: params.id }, { projection: { number: 1 } }).sort({ number: -1 }).limit(1).toArray()
    const highest = maxSold[0]?.number || 0
    if (d.totalNumbers < highest) {
      return NextResponse.json({ error: `Já existem números vendidos/reservados acima de ${d.totalNumbers}.` }, { status: 400 })
    }
  }

  const update: Record<string, any> = { updatedAt: new Date() }
  const stringFields = ['description', 'coverImageUrl', 'prizeDescription', 'prizeImageUrl', 'rules'] as const
  for (const f of stringFields) {
    if (f in d) update[f] = (d as any)[f] ?? undefined
  }
  if (d.name !== undefined) update.name = sanitizeRaffleText(d.name, 140)
  if (d.prizeName !== undefined) update.prizeName = sanitizeRaffleText(d.prizeName, 200)
  if (d.prizeCategory !== undefined) update.prizeCategory = d.prizeCategory ? sanitizeRaffleText(d.prizeCategory, 80) : undefined
  if ('videos' in d) {
    update.videos = (d.videos || [])
      .filter(vd => vd.url && vd.url.trim())
      .map(vd => ({ url: vd.url.trim(), caption: vd.caption ? sanitizeRaffleText(vd.caption, 160) : undefined }))
  }
  if (d.pricePerNumber !== undefined) update.pricePerNumber = d.pricePerNumber
  if (d.totalNumbers !== undefined) update.totalNumbers = d.totalNumbers
  if (d.winnersCount !== undefined) update.winnersCount = d.winnersCount
  if (d.template !== undefined) update.template = d.template
  if (d.customDesign !== undefined) update.customDesign = d.customDesign ?? undefined
  if (d.visibility !== undefined) update.visibility = d.visibility
  if (d.status !== undefined) update.status = d.status
  if (d.allowManualDrawWhileOpen !== undefined) update.allowManualDrawWhileOpen = d.allowManualDrawWhileOpen
  if (d.allowDrawUnsoldNumbers !== undefined) update.allowDrawUnsoldNumbers = d.allowDrawUnsoldNumbers
  if ('startsAt' in d) update.startsAt = d.startsAt ? new Date(d.startsAt) : undefined
  if ('endsAt' in d) update.endsAt = d.endsAt ? new Date(d.endsAt) : undefined

  if (d.slug !== undefined && d.slug !== existing.slug) {
    update.slug = await ensureUniqueSlug(db, d.slug || d.name || existing.name, params.id)
  }

  await db.collection<Raffle>('raffles').updateOne({ _id: new ObjectId(params.id) as any }, { $set: update })

  await audit({
    action: 'raffle_updated',
    actorUserId: session.userId,
    resourceType: 'raffle',
    resourceId: params.id,
    metadata: { fields: Object.keys(update) },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  const db = await getDb()
  const existing = await db.collection<Raffle>('raffles').findOne({ _id: new ObjectId(params.id) as any })
  if (!existing) return NextResponse.json({ error: 'Rifa não encontrada' }, { status: 404 })

  await Promise.all([
    db.collection('raffles').deleteOne({ _id: new ObjectId(params.id) as any }),
    db.collection('raffle_numbers').deleteMany({ raffleId: params.id }),
    db.collection('raffle_participants').deleteMany({ raffleId: params.id }),
    db.collection('raffle_purchases').deleteMany({ raffleId: params.id }),
    db.collection('raffle_winners').deleteMany({ raffleId: params.id }),
  ])

  await audit({
    action: 'raffle_deleted',
    actorUserId: session.userId,
    resourceType: 'raffle',
    resourceId: params.id,
    metadata: { name: existing.name },
  })

  return NextResponse.json({ ok: true })
}
