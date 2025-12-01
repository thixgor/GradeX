import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { StripeSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Obter configurações de Stripe
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const db = await getDb()
    const settingsCollection = db.collection<StripeSettings>('stripe_settings')

    const settings = await settingsCollection.findOne({})

    if (!settings) {
      return NextResponse.json({
        monthly: '',
        quarterly: '',
        'semi-annual': '',
        annual: '',
        lifetime: ''
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get stripe settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao obter configurações' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar configurações de Stripe
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const body = await request.json()
    const { monthly, quarterly, 'semi-annual': semiAnnual, annual, lifetime } = body

    // Validar que todos os campos foram fornecidos
    if (!monthly || !quarterly || !semiAnnual || !annual || !lifetime) {
      return NextResponse.json(
        { error: 'Todos os price IDs são obrigatórios' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const settingsCollection = db.collection<StripeSettings>('stripe_settings')

    const updateData: StripeSettings = {
      monthly,
      quarterly,
      'semi-annual': semiAnnual,
      annual,
      lifetime,
      updatedAt: new Date(),
      updatedBy: session.userId
    }

    // Atualizar ou inserir
    await settingsCollection.updateOne(
      {},
      { $set: updateData },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Configurações de Stripe atualizadas com sucesso',
      settings: updateData
    })
  } catch (error) {
    console.error('Update stripe settings error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
