import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { RESUMO_DA_SEMIOLOGIA } from '@/lib/semiologia/resumo'

export const dynamic = 'force-dynamic'

/**
 * Verificação de acesso ao Manual de Semiologia.
 *
 * Seção privativa, com a mesma regra dos outros atlas: liberada para quem
 * comprou o Manual Clínico e para contas Plus+ cujo plano inclua o módulo
 * (ambos cobertos por `hasFullAccess`). Não entra na cota de aberturas
 * gratuitas de patologia — o atlas é indivisível, e "três otoscopias grátis"
 * não é uma unidade que signifique alguma coisa.
 *
 * O `resumo` que acompanha o veredito é o mesmo que a landing usa, e é só
 * título e contagem: calculado do próprio conteúdo (ver
 * `lib/semiologia/resumo.ts`) para que os números anunciados nunca
 * desencontrem do que o módulo entrega. O corpo das fichas é justamente o que
 * está do outro lado do muro e nunca atravessa daqui.
 */
export async function GET() {
  try {
    const [db, session] = await Promise.all([getDb(), getSession()])
    const config = await getManualClinicoConfig(db)
    const access = await getManualClinicoAccess(db, session, config, 'semiologia')

    return NextResponse.json({
      isAuthenticated: !!session?.userId,
      access: {
        hasFullAccess: access.hasFullAccess,
        reason: access.reason,
        includedPlan: access.includedPlan ?? null,
      },
      product: serializeManualClinicoProduct(config),
      resumo: RESUMO_DA_SEMIOLOGIA,
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao Manual de Semiologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
