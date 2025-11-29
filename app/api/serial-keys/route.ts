import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { SerialKey, SerialKeyType } from '@/lib/types'

export const dynamic = 'force-dynamic'

// Função para gerar uma serial key aleatória no formato XXXX-XXXX-XXXX-XXXX
function generateSerialKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = 4
  const segmentLength = 4

  const parts: string[] = []
  for (let i = 0; i < segments; i++) {
    let segment = ''
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    parts.push(segment)
  }

  return parts.join('-')
}

// GET - Listar todas as serial keys (apenas admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>('serial_keys')

    const keys = await keysCollection
      .find({})
      .sort({ generatedAt: -1 })
      .toArray()

    return NextResponse.json({ keys })
  } catch (error) {
    console.error('Get serial keys error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar serial keys' },
      { status: 500 }
    )
  }
}

// POST - Gerar uma nova serial key (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { type, customDurationDays, customDurationHours, customDurationMinutes } = body as {
      type: SerialKeyType
      customDurationDays?: number
      customDurationHours?: number
      customDurationMinutes?: number
    }

    if (!type || !['trial', 'premium', 'custom'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de key inválido. Use "trial", "premium" ou "custom"' },
        { status: 400 }
      )
    }

    // Validar campos de duração personalizada
    if (type === 'custom') {
      const days = customDurationDays || 0
      const hours = customDurationHours || 0
      const minutes = customDurationMinutes || 0

      if (days === 0 && hours === 0 && minutes === 0) {
        return NextResponse.json(
          { error: 'Para tipo "custom", especifique ao menos dias, horas ou minutos' },
          { status: 400 }
        )
      }
    }

    const db = await getDb()
    const keysCollection = db.collection<SerialKey>('serial_keys')

    // Gerar uma key única
    let key = generateSerialKey()
    let exists = await keysCollection.findOne({ key })

    // Se já existir, gerar outra (muito improvável)
    while (exists) {
      key = generateSerialKey()
      exists = await keysCollection.findOne({ key })
    }

    const newKey: SerialKey = {
      key,
      type,
      used: false,
      generatedBy: session.userId,
      generatedByName: session.name,
      generatedAt: new Date(),
    }

    // Adicionar campos de duração personalizada se for custom
    if (type === 'custom') {
      newKey.customDurationDays = customDurationDays || 0
      newKey.customDurationHours = customDurationHours || 0
      newKey.customDurationMinutes = customDurationMinutes || 0
    }

    await keysCollection.insertOne(newKey as any)

    return NextResponse.json({
      message: 'Serial key gerada com sucesso',
      key: newKey
    })
  } catch (error) {
    console.error('Generate serial key error:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar serial key' },
      { status: 500 }
    )
  }
}
