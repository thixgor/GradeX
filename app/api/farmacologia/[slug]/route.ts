import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'

function excerpt(value: unknown, max = 420) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length <= max ? text : `${text.slice(0, max).trim()}...`
}

function buildMedicamentoPreview(med: any) {
  return {
    _id: med._id,
    nome: med.nome,
    sinonimos: med.sinonimos || [],
    classe_principal: med.classe_principal,
    subclasse: med.subclasse || '',
    slug: med.slug,
    tipo_farmaco: med.tipo_farmaco || '',
    preview: excerpt(med.classificacao || med.principais_funcoes || med.mecanismo_acao_compacto, 520),
  }
}

// GET - Medicamento por slug (gate premium do Manual Clínico)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const [db, session] = await Promise.all([getDb(), getSession()])

    const medicamento = await db.collection('medicamentos').findOne({ slug })
    if (!medicamento) {
      return NextResponse.json({ error: 'Medicamento não encontrado' }, { status: 404 })
    }

    const [config, access] = await Promise.all([
      getManualClinicoConfig(db),
      getManualClinicoAccess(db, session, undefined, 'farmacologia'),
    ])

    const unlocked = access.hasFullAccess
    const payload = unlocked ? medicamento : buildMedicamentoPreview(medicamento)

    return NextResponse.json({
      ...payload,
      isPremiumLocked: !unlocked,
      accessStatus: unlocked ? 'premium_unlocked' : (!session?.userId ? 'login_required' : 'locked'),
      product: serializeManualClinicoProduct(config),
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
      },
    })
  } catch (error) {
    console.error('Erro ao buscar medicamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
