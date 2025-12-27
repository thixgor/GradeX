import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ForumSettings, ForumPostCreationFreezeMode } from '@/lib/types'

export const dynamic = 'force-dynamic'

const DEFAULT_SETTINGS: ForumSettings = {
  postCreationFreezeMode: 'off',
  updatedAt: new Date(),
}

export async function GET() {
  try {
    const db = await getDb()
    const settingsCollection = db.collection<ForumSettings>('forum_settings')

    const settings = await settingsCollection.findOne({})

    return NextResponse.json({
      settings: settings || DEFAULT_SETTINGS,
    })
  } catch (error) {
    console.error('Get forum settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações do fórum' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json()
    const { postCreationFreezeMode } = body as {
      postCreationFreezeMode?: ForumPostCreationFreezeMode
    }

    const allowedModes: ForumPostCreationFreezeMode[] = [
      'off',
      'pause_all',
      'pause_all_except_admins',
      'pause_all_except_common_users',
      'pause_only_free_common',
      'pause_only_free_common_and_monitors',
      'pause_only_free_common_and_premium_common',
    ]

    if (!postCreationFreezeMode || !allowedModes.includes(postCreationFreezeMode)) {
      return NextResponse.json(
        { error: 'Modo de paralisação inválido' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const settingsCollection = db.collection<ForumSettings>('forum_settings')

    const update: Partial<ForumSettings> = {
      postCreationFreezeMode,
      updatedAt: new Date(),
      updatedBy: session.userId,
    }

    await settingsCollection.updateOne({}, { $set: update }, { upsert: true })

    const updated = await settingsCollection.findOne({})

    return NextResponse.json({
      success: true,
      settings: updated || { ...DEFAULT_SETTINGS, ...update },
    })
  } catch (error) {
    console.error('Update forum settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações do fórum' },
      { status: 500 }
    )
  }
}
