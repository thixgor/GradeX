import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  getManualClinicoAccess,
  getManualClinicoConfig,
  serializeManualClinicoProduct,
} from '@/lib/manual-clinico-product'
import { COMPARADORES } from '@/lib/semiologia/comparadores'
import { SINAIS } from '@/lib/semiologia/sinais'
import { TOTAIS } from '@/lib/semiologia/catalogo'
import { JANELAS_ULTRASSOM } from '@/lib/semiologia/ultrassom'
import { VISTAS } from '@/lib/semiologia/vistas'

export const dynamic = 'force-dynamic'

/**
 * Resumo do Manual de Semiologia para a vitrine.
 *
 * Calculado do próprio conteúdo, e não escrito à mão, para que os números
 * anunciados nunca desencontrem do que o módulo entrega. Só títulos e totais
 * atravessam a rede — o corpo das fichas é justamente o que está do outro lado
 * do muro.
 */
const RESUMO = {
  ...TOTAIS,
  titulosSinais: SINAIS.map((sinal) => sinal.nome),
  titulosVistas: VISTAS.map((vista) => vista.nome),
  titulosJanelas: JANELAS_ULTRASSOM.map((janela) => janela.nome),
  titulosComparadores: COMPARADORES.map((comparador) => comparador.titulo),
}

/**
 * Verificação de acesso ao Manual de Semiologia.
 *
 * Seção privativa, com a mesma regra dos outros atlas: liberada para quem
 * comprou o Manual Clínico e para contas Plus+ cujo plano inclua o módulo
 * (ambos cobertos por `hasFullAccess`). Não entra na cota de aberturas
 * gratuitas de patologia — o atlas é indivisível, e "três otoscopias grátis"
 * não é uma unidade que signifique alguma coisa.
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
      resumo: RESUMO,
    })
  } catch (error) {
    console.error('Erro ao verificar acesso ao Manual de Semiologia:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
