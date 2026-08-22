import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoConfig,
  getManualClinicoCurrentPrice,
  MANUAL_CLINICO_PRODUCT_ID,
} from '@/lib/manual-clinico-product'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Busca de produtos que podem receber desconto PROUNI/FIES.
 *
 * Espelha `/api/admin/coupons/products`, com uma diferença que importa: aqui os
 * PLANOS de assinatura entram na lista. O benefício foi pedido também para
 * assinatura, e planos não vivem numa coleção — são um array dentro de
 * `admin_settings` —, então quem busca por "Plus" precisa achá-los.
 */

function escapar(valor: string) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const q = (request.nextUrl.searchParams.get('q') || '').trim()
    if (q.length < 2) return NextResponse.json({ products: [] })

    const regex = new RegExp(escapar(q), 'i')
    const db = await getDb()

    const [materiais, pacotes, manualConfig, settings] = await Promise.all([
      db.collection('materials')
        .find({ $or: [{ title: regex }, { description: regex }, { tags: regex }] })
        .project({ title: 1, type: 1, pricing: 1, price: 1, isHidden: 1 })
        .sort({ isHidden: 1, title: 1 })
        .limit(20)
        .toArray(),
      db.collection('material_packages')
        .find({ $or: [{ title: regex }, { description: regex }, { tags: regex }] })
        .project({ title: 1, pricing: 1, price: 1, isHidden: 1 })
        .sort({ isHidden: 1, title: 1 })
        .limit(10)
        .toArray(),
      getManualClinicoConfig(db),
      db.collection('admin_settings').findOne({}),
    ])

    const manualCasa = [manualConfig.label, 'Manual Clinico', 'Manual Clínico', 'Patologias']
      .some((valor) => regex.test(String(valor || '')))

    const planos = (settings?.planos || [])
      .filter((plano: any) => regex.test(String(plano?.nome || '')) || regex.test(String(plano?.periodo || '')) || regex.test(String(plano?.tipo || '')))
      .slice(0, 10)
      .map((plano: any) => ({
        itemType: 'plus',
        itemId: String(plano.tipo),
        title: plano.nome || 'Plano',
        typeLabel: 'Plano',
        price: Number(plano.preco || 0),
        isHidden: plano.oculto === true,
        // Planos recorrentes são cobrados por assinatura no Mercado Pago
        // (preapproval), onde o valor combinado vale para TODAS as cobranças
        // futuras. Um benefício de uso único não cabe ali: descontar uma vez
        // significaria descontar para sempre. A tela avisa o admin em vez de
        // deixá-lo configurar um desconto que nunca apareceria na fatura.
        recurring: [1, 3, 12].includes(Number(plano.durationMonths)),
      }))

    const products = [
      ...(manualCasa
        ? [{
            itemType: 'manual_clinico',
            itemId: MANUAL_CLINICO_PRODUCT_ID,
            title: manualConfig.label,
            typeLabel: 'Produto',
            price: getManualClinicoCurrentPrice(manualConfig),
            isHidden: manualConfig.isActive === false,
          }]
        : []),
      ...planos,
      ...materiais.map((material: any) => ({
        itemType: 'material',
        itemId: String(material._id),
        title: material.title || 'Material',
        typeLabel: material.type === 'flashcard_deck' ? 'Flashcards' : 'Material',
        price: Number(material.price || 0),
        isHidden: material.isHidden === true,
      })),
      ...pacotes.map((pacote: any) => ({
        itemType: 'package',
        itemId: String(pacote._id),
        title: pacote.title || 'Pacote',
        typeLabel: 'Pacote',
        price: Number(pacote.price || 0),
        isHidden: pacote.isHidden === true,
      })),
    ]

    return NextResponse.json({ products })
  } catch (error) {
    console.error('[admin/prouni/produtos] erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 })
  }
}
