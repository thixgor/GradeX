import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

/**
 * Resposta 400 das rotas de checkout quando o corpo não passa no schema.
 *
 * Antes, cada rota respondia do seu jeito — algumas sem dizer o campo — e nada
 * ia para o log. Quando alguém mandava print de "Dados inválidos", não havia
 * como saber, nem pela tela nem pela Vercel, se o problema era do formulário
 * (nosso) ou de um dado digitado. Agora o log registra os CAMINHOS dos campos
 * recusados (nunca os valores: CPF, e-mail e token não vão para o log) e a
 * resposta traz o mesmo `details` que o checkout transforma em mensagem.
 */
export function invalidCheckoutPayload(route: string, error: ZodError): NextResponse {
  const campos = Array.from(new Set(error.issues.map(i => i.path.join('.') || '(corpo)')))
  console.warn(`[${route}] corpo recusado pela validação`, { campos })
  return NextResponse.json({ error: 'Dados inválidos', details: error.flatten() }, { status: 400 })
}
