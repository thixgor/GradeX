import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Settings } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Buscar configurações
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')

    // Buscar configuração (só deve existir uma)
    let settings = await settingsCollection.findOne({})

    // Se não existir, criar uma vazia
    if (!settings) {
      const newSettings: Settings = {
        updatedAt: new Date()
      }
      const result = await settingsCollection.insertOne(newSettings)
      settings = {
        _id: result.insertedId,
        ...newSettings
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configurações
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { geminiApiKey } = body

    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')

    // Buscar configuração existente
    const existing = await settingsCollection.findOne({})

    const updateData: Partial<Settings> = {
      updatedAt: new Date(),
      updatedBy: session.userId
    }

    // Apenas atualizar geminiApiKey se foi fornecido
    if (geminiApiKey !== undefined) {
      updateData.geminiApiKey = geminiApiKey
    }

    if (existing) {
      // Atualizar existente
      await settingsCollection.updateOne(
        { _id: existing._id },
        { $set: updateData }
      )
    } else {
      // Criar novo
      await settingsCollection.insertOne({
        ...updateData,
        updatedAt: new Date()
      } as Settings)
    }

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso'
    })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
