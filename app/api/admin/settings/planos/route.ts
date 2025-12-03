import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { PlanConfig } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET - Obter planos (público para /buy, mas retorna todos)
export async function GET() {
  try {
    const db = await getDb()
    const settings = await db.collection('admin_settings').findOne({})

    const defaultBeneficios = [
      '400 Questões Pessoais por dia',
      '500 Flashcards por dia',
      'Cronogramas ilimitados',
      'Forum de materiais e discussão premium',
      'Aulas ao vivo e vídeo-aulas pós-aula',
      'Acesso a grupo de WhatsApp'
    ]

    if (!settings || !settings.planos) {
      // Retornar planos padrão
      const defaultPlans: PlanConfig[] = [
        {
          tipo: 'mensal',
          nome: 'DomineAqui PREMIUM',
          periodo: 'Plano Mensal',
          preco: 24.90,
          precoOriginal: 29.90,
          beneficios: defaultBeneficios,
          oculto: false,
          ordem: 1,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        },
        {
          tipo: 'trimestral',
          nome: 'DomineAqui PREMIUM',
          periodo: 'Plano Trimestral',
          preco: 59.90,
          precoOriginal: 74.70,
          beneficios: defaultBeneficios,
          oculto: false,
          ordem: 2,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        },
        {
          tipo: 'semestral',
          nome: 'DomineAqui PREMIUM',
          periodo: 'Plano Semestral',
          preco: 99.90,
          precoOriginal: 149.40,
          beneficios: defaultBeneficios,
          oculto: false,
          ordem: 3,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        },
        {
          tipo: 'anual',
          nome: 'DomineAqui PREMIUM',
          periodo: 'Plano Anual',
          preco: 149.90,
          precoOriginal: 298.80,
          beneficios: defaultBeneficios,
          oculto: false,
          ordem: 4,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        },
        {
          tipo: 'vitalicio',
          nome: 'DomineAqui PREMIUM',
          periodo: 'Plano Vitalício',
          preco: 299.90,
          precoOriginal: undefined,
          beneficios: defaultBeneficios,
          oculto: false,
          ordem: 5,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        }
      ]
      return NextResponse.json({ planos: defaultPlans })
    }

    // Se há planos salvos, garantir que tenham benefícios
    const planosComBeneficios = settings.planos.map((p: PlanConfig) => ({
      ...p,
      beneficios: p.beneficios && p.beneficios.length > 0 ? p.beneficios : defaultBeneficios
    }))

    return NextResponse.json({ planos: planosComBeneficios })
  } catch (error) {
    console.error('Erro ao obter planos:', error)
    return NextResponse.json(
      { error: 'Erro ao obter planos' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar planos (apenas admin)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { planos } = body

    if (!Array.isArray(planos)) {
      return NextResponse.json(
        { error: 'Planos deve ser um array' },
        { status: 400 }
      )
    }

    const db = await getDb()
    
    // Validar e processar planos
    const processedPlanos = planos.map((plan: any) => ({
      tipo: plan.tipo,
      nome: plan.nome,
      periodo: plan.periodo,
      preco: parseFloat(plan.preco),
      precoOriginal: plan.precoOriginal ? parseFloat(plan.precoOriginal) : undefined,
      descricao: plan.descricao,
      beneficios: plan.beneficios,
      oculto: plan.oculto || false,
      ordem: plan.ordem || 0,
      criadoEm: plan.criadoEm ? new Date(plan.criadoEm) : new Date(),
      atualizadoEm: new Date()
    }))

    const result = await db.collection('admin_settings').updateOne(
      {},
      { 
        $set: { 
          planos: processedPlanos,
          atualizadoEm: new Date()
        } 
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Planos atualizados com sucesso',
      planos: processedPlanos
    })
  } catch (error) {
    console.error('Erro ao atualizar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar planos' },
      { status: 500 }
    )
  }
}
