import 'server-only'

/**
 * Envelope comum das rotas de monitoria: limite de requisições (durável),
 * sessão, e-mail verificado quando pedido, e tradução de `ErroMonitoria` em
 * resposta JSON. Erro inesperado vira 500 genérico (o detalhe fica no log).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { secureApiEndpoint, type RateLimitType } from '@/lib/api-security'
import type { TokenPayload } from '@/lib/auth'
import { ErroMonitoria } from './reservas'
import { origemConfiavel } from './origem'

export { origemConfiavel }

export interface ContextoRota {
  sessao: TokenPayload
  ip: string
}

export async function rotaAutenticada(
  request: NextRequest,
  opcoes: { limite?: RateLimitType | { limit: number; windowMs: number }; admin?: boolean; emailVerificado?: boolean },
  fn: (ctx: ContextoRota) => Promise<Response>,
): Promise<Response> {
  if (!origemConfiavel(request)) {
    return NextResponse.json({ error: 'Origem da requisição não permitida.' }, { status: 403 })
  }
  const seg = await secureApiEndpoint(request, {
    rateLimit: opcoes.limite ?? 'READ',
    auth: {
      requireAuth: true,
      allowedRoles: opcoes.admin ? ['admin'] : undefined,
      requireEmailVerified: opcoes.emailVerificado,
    },
  })
  if (!seg.success || !seg.session) return seg.errorResponse || NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    return await fn({ sessao: seg.session, ip: seg.ip })
  } catch (err) {
    return respostaDeErro(err)
  }
}

export async function rotaPublica(
  request: NextRequest,
  limite: RateLimitType | { limit: number; windowMs: number },
  fn: (ip: string) => Promise<Response>,
): Promise<Response> {
  const seg = await secureApiEndpoint(request, { rateLimit: limite })
  if (!seg.success) return seg.errorResponse!
  try {
    return await fn(seg.ip)
  } catch (err) {
    return respostaDeErro(err)
  }
}

export function respostaDeErro(err: unknown): Response {
  if (err instanceof ErroMonitoria) return NextResponse.json({ error: err.message }, { status: err.status })
  console.error('[monitorias] erro inesperado:', err)
  return NextResponse.json({ error: 'Algo deu errado. Tente de novo em instantes.' }, { status: 500 })
}

export function ok(dados: unknown, status = 200): Response {
  return NextResponse.json(dados, { status, headers: { 'Cache-Control': 'private, no-store' } })
}
