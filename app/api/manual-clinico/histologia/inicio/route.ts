import { NextResponse } from 'next/server'

import { acessoDaVitrine, verificarAcessoAHistologia } from '@/lib/histologia/acesso'
import { dadosDoInicio } from '@/lib/histologia/inicio'
import type { RespostaDoInicio } from '@/lib/histologia/inicio-tipos'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { respostaDoAcervo } from '@/lib/histologia/resposta'
import { montarVitrine } from '@/lib/histologia/vitrine'

/**
 * A home do Manual da Histologia, para quem tem sessão.
 *
 * A página `/manual-clinico/histologia` é um casco estático; quem decide o que
 * ela mostra é esta rota, com o mesmo portão de sempre
 * (`verificarAcessoAHistologia`): o catálogo para quem assina, a vitrine — com
 * o motivo e o preço — para quem não assina. Nunca os dois na mesma resposta.
 *
 * O visitante sem sessão nem chega aqui: o middleware reescreve a home para a
 * vitrine estática (`/manual-clinico/histologia/vitrine`).
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!histologiaHabilitada()) {
    return new NextResponse(null, { status: 404 })
  }

  const acesso = await verificarAcessoAHistologia()
  const resposta: RespostaDoInicio = acesso.liberado
    ? { liberado: true, catalogo: await dadosDoInicio() }
    : { liberado: false, acesso: acessoDaVitrine(acesso), vitrine: await montarVitrine() }

  return respostaDoAcervo(request, resposta)
}
