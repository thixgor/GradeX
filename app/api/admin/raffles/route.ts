import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ensureUniqueSlug, getEffectiveStatus, RAFFLE_TEMPLATES, sanitizeRaffleText, decodeHtmlEntities } from '@/lib/raffles'
import type { Raffle } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TEMPLATE_IDS = RAFFLE_TEMPLATES.map(t => t.id) as [string, ...string[]]

const CustomDesignSchema = z.object({
  primaryColor: z.string().max(40).optional(),
  secondaryColor: z.string().max(40).optional(),
  cardStyle: z.enum(['glass', 'solid', 'outline']).optional(),
  gridStyle: z.enum(['rounded', 'square', 'pill']).optional(),
  background: z.string().max(200).optional(),
  highlightText: z.string().max(120).optional(),
}).optional()

const VideoSchema = z.object({
  url: z.string().max(1000),
  caption: z.string().max(160).optional(),
})

const RaffleInputSchema = z.object({
  name: z.string().min(2).max(140),
  slug: z.string().max(80).optional(),
  description: z.string().max(4000).optional(),
  pricePerNumber: z.number().positive().max(100000),
  totalNumbers: z.number().int().min(2).max(100000),
  winnersCount: z.number().int().min(1).max(1000).default(1),
  coverImageUrl: z.string().max(1000).optional(),
  prizeName: z.string().min(1).max(200),
  prizeDescription: z.string().max(4000).optional(),
  prizeCategory: z.string().max(80).optional(),
  prizeImageUrl: z.string().max(1000).optional(),
  videos: z.array(VideoSchema).max(8).optional(),
  template: z.enum(TEMPLATE_IDS).default('premium-dark'),
  customDesign: CustomDesignSchema,
  visibility: z.enum(['public', 'unlisted', 'private']).default('public'),
  status: z.enum(['draft', 'scheduled', 'open', 'closed', 'drawing', 'finished', 'cancelled']).default('draft'),
  rules: z.string().max(4000).optional(),
  allowManualDrawWhileOpen: z.boolean().optional(),
  allowDrawUnsoldNumbers: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')?.trim()
  const visibilityFilter = searchParams.get('visibility')?.trim()
  const categoryFilter = searchParams.get('category')?.trim()

  const db = await getDb()
  const query: Record<string, any> = {}
  if (statusFilter) query.status = statusFilter
  if (visibilityFilter) query.visibility = visibilityFilter
  if (categoryFilter) query.prizeCategory = categoryFilter

  const raffles = await db
    .collection<Raffle>('raffles')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray()

  const data = raffles.map(r => ({
    id: String(r._id),
    name: decodeHtmlEntities(r.name),
    slug: r.slug,
    prizeName: decodeHtmlEntities(r.prizeName),
    prizeCategory: decodeHtmlEntities(r.prizeCategory || ''),
    coverImageUrl: r.coverImageUrl || '',
    pricePerNumber: r.pricePerNumber,
    totalNumbers: r.totalNumbers,
    winnersCount: r.winnersCount,
    soldCount: r.soldCount || 0,
    status: r.status,
    effectiveStatus: getEffectiveStatus(r),
    visibility: r.visibility,
    template: r.template,
    startsAt: r.startsAt || null,
    endsAt: r.endsAt || null,
    winnersDrawn: (r.winners || []).length,
    createdAt: r.createdAt,
  }))

  return NextResponse.json({ raffles: data })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = RaffleInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 })
  }
  const d = parsed.data

  if (d.winnersCount > d.totalNumbers) {
    return NextResponse.json({ error: 'Número de ganhadores não pode exceder o total de números.' }, { status: 400 })
  }

  const db = await getDb()
  const slug = await ensureUniqueSlug(db, d.slug || d.name)

  const now = new Date()
  const doc: Omit<Raffle, '_id'> = {
    name: sanitizeRaffleText(d.name, 140),
    slug,
    description: d.description,
    pricePerNumber: d.pricePerNumber,
    totalNumbers: d.totalNumbers,
    winnersCount: d.winnersCount,
    coverImageUrl: d.coverImageUrl,
    prizeName: sanitizeRaffleText(d.prizeName, 200),
    prizeDescription: d.prizeDescription,
    prizeCategory: d.prizeCategory ? sanitizeRaffleText(d.prizeCategory, 80) : undefined,
    prizeImageUrl: d.prizeImageUrl,
    videos: (d.videos || [])
      .filter(vd => vd.url && vd.url.trim())
      .map(vd => ({ url: vd.url.trim(), caption: vd.caption ? sanitizeRaffleText(vd.caption, 160) : undefined })),
    template: d.template as any,
    customDesign: d.customDesign,
    visibility: d.visibility,
    status: d.status,
    rules: d.rules,
    allowManualDrawWhileOpen: d.allowManualDrawWhileOpen || false,
    allowDrawUnsoldNumbers: d.allowDrawUnsoldNumbers || false,
    startsAt: d.startsAt ? new Date(d.startsAt) : undefined,
    endsAt: d.endsAt ? new Date(d.endsAt) : undefined,
    createdBy: session.userId,
    createdByName: session.name,
    createdAt: now,
    updatedAt: now,
    winners: [],
    soldCount: 0,
  }

  const res = await db.collection<Raffle>('raffles').insertOne(doc as any)

  return NextResponse.json({ id: res.insertedId.toString(), slug }, { status: 201 })
}
