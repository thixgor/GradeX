import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro, lerJson, naoEncontrado } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { ENTRADAS_POR_HORA, RENOVACOES_POR_HORA } from '@/lib/monitorias/sala/regras'
import { EsquemaAcaoDaSala } from '@/lib/monitorias/sala/esquemas'
import { verificarTokenDaSala } from '@/lib/monitorias/sala/token'
import { entrarNaSala, estadoDoSaguao, renovarNaSala, type Recusa } from '@/lib/monitorias/sala/servidor'

export const dynamic = 'force-dynamic'

function respostaDaRecusa(r: Recusa): NextResponse {
  return NextResponse.json(
    { error: r.mensagem, motivo: r.motivo, abreEm: r.abreEm ?? null, fechaEm: r.fechaEm ?? null },
    { status: r.status, headers: { 'Cache-Control': 'private, no-store' } },
  )
}

/**
 * GET — o saguão: se a sala está aberta, quem já está nela e o plano B. Pedido
 * uma vez ao abrir a tela (e de novo só quando a sala abre ou a pessoa volta).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 30, windowMs: 60_000 } }, async ({ sessao }) => {
    const estado = await estadoDoSaguao(params.id, sessao.userId, new Date())
    if (!estado) return naoEncontrado()
    return ok(estado)
  })
}

/**
 * POST {acao:'entrar'} — autoriza, registra a conexão e devolve o token da sala,
 * os servidores ICE (STUN + TURN temporário, se ligado) e quem está na sala.
 * POST {acao:'renovar', uso?} — reconfere tudo e troca o token (a cada ~10 min).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: 'WRITE' }, async ({ sessao }) => {
    const parsed = EsquemaAcaoDaSala.safeParse(await lerJson(request))
    if (!parsed.success) return erro(400, 'Ação inválida.')
    const agora = new Date()
    const sessaoDaSala = { userId: sessao.userId, jti: sessao.jti, iat: typeof sessao.iat === 'number' ? sessao.iat : undefined }

    if (parsed.data.acao === 'entrar') {
      // Recarregar a página é entrar de novo; 20 por hora cobre quem tem rede ruim
      // e segura quem tentasse trocar de época sem parar.
      const lim = await checkRateLimit(`mon-sala-entrar:${sessao.userId}`, 'monitorias_sala_entrar', ENTRADAS_POR_HORA, 3_600_000)
      if (!lim.success) return erro(429, 'Muitas entradas seguidas na sala. Aguarde alguns minutos.')
      const r = await entrarNaSala(params.id, sessaoDaSala, agora)
      if ('ok' in r && r.ok === false) return respostaDaRecusa(r)
      return ok(r)
    }

    const lim = await checkRateLimit(`mon-sala-renovar:${sessao.userId}`, 'monitorias_sala_renovar', RENOVACOES_POR_HORA, 3_600_000)
    if (!lim.success) return erro(429, 'Muitas renovações seguidas. Aguarde alguns minutos.')
    const claims = await verificarTokenDaSala(request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''))
    const r = await renovarNaSala(params.id, sessaoDaSala, claims, parsed.data.uso, agora)
    if ('ok' in r && r.ok === false) return respostaDaRecusa(r)
    return ok(r)
  })
}
