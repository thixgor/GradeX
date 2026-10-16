import 'server-only'

/**
 * O token da sala: curto (15 min), com escopo de UMA sala, UMA conexão e UMA
 * época, e preso à sessão do cookie que o pediu.
 *
 * ## Por que um token e não o cookie direto
 *
 * As rotas de sinal são as únicas chamadas repetidas da sala. Com o token, a
 * autorização delas é só CPU (assinatura + comparação), sem `getSession` e sem
 * ler reserva e assento a cada volta. O servidor reconfere tudo na entrada e na
 * renovação (a cada ~10 min), que é onde reembolso, banimento e fim do horário
 * passam a valer.
 *
 * ## O que impede o mau uso
 *
 * - `aud` próprio e segredo derivado com separação de domínio: um token de sessão
 *   não vale como token de sala, nem o contrário.
 * - `sj` (hash do `jti` da sessão): token copiado para outro navegador não serve.
 * - `cx` + `ep`: a rota de sinal só grava se forem a conexão e a época ATUAIS do
 *   participante na sala; aba antiga ou aparelho substituído recebe 409.
 * - O token vive só na memória da aba (nunca em localStorage) e vai no header
 *   `Authorization`, que um site de fora não consegue anexar (sem CSRF).
 */

import { createHash, createHmac } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import type { PapelNaSala } from '../tipos'

const AUD = 'monitorias-sala'
const SEGREDO_DE_DESENVOLVIMENTO = 'your-secret-key-change-this'

export interface ClaimsDaSala {
  /** Id da reserva. */
  sala: string
  uid: string
  /** Id opaco do participante na sala (não revela o userId aos outros). */
  pid: string
  papel: PapelNaSala
  /** Conexão (aba/aparelho) a que o token pertence. */
  cx: string
  /** Época do participante quando o token saiu. */
  ep: number
  /** Vínculo com a sessão do cookie. */
  sj: string
}

let segredoCache: Uint8Array | null = null

function segredo(): Uint8Array {
  if (segredoCache) return segredoCache
  const proprio = process.env.MONITORIAS_SALA_SECRET
  if (proprio && proprio.length >= 32) {
    segredoCache = new TextEncoder().encode(proprio)
    return segredoCache
  }
  const base = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : SEGREDO_DE_DESENVOLVIMENTO)
  if (!base) throw new Error('JWT_SECRET (ou MONITORIAS_SALA_SECRET) é obrigatório para a sala de aula.')
  // Sem segredo novo para configurar: deriva do JWT_SECRET com rótulo próprio.
  segredoCache = new Uint8Array(createHash('sha256').update(`monitorias-sala:v1:${base}`).digest())
  return segredoCache
}

/** Id opaco e estável do participante NESTA sala: 16 caracteres base64url. */
export function pidDe(reservaId: string, userId: string): string {
  return createHmac('sha256', segredo()).update(`${reservaId}:${userId}`).digest('base64url').slice(0, 16)
}

/** Hash curto que prende o token à sessão do cookie (jti; login antigo usa iat). */
export function vinculoDaSessao(sessao: { userId: string; jti?: string; iat?: number }): string {
  const base = sessao.jti || `iat:${sessao.iat ?? 0}:${sessao.userId}`
  return createHash('sha256').update(base).digest('hex').slice(0, 16)
}

export async function emitirTokenDaSala(c: ClaimsDaSala, expiraEm: Date): Promise<string> {
  return new SignJWT({ ...c })
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(AUD)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiraEm.getTime() / 1000))
    .sign(segredo())
}

const ehTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max

/**
 * Confere o token. `toleranciaS` só para a saída pelo beacon: quem fecha a aba
 * com o notebook acordando depois de horas ainda consegue registrar a saída.
 */
export async function verificarTokenDaSala(token: string | null | undefined, opcoes: { toleranciaS?: number } = {}): Promise<ClaimsDaSala | null> {
  if (!token || token.length > 2_000) return null
  try {
    const { payload } = await jwtVerify(token, segredo(), { audience: AUD, algorithms: ['HS256'], clockTolerance: opcoes.toleranciaS ?? 5 })
    const p = payload as Record<string, unknown>
    if (!ehTexto(p.sala, 24) || !ehTexto(p.uid, 24) || !ehTexto(p.pid, 16) || !ehTexto(p.cx, 32) || !ehTexto(p.sj, 16)) return null
    if (p.papel !== 'monitor' && p.papel !== 'aluno') return null
    if (!Number.isInteger(p.ep) || (p.ep as number) < 1) return null
    return { sala: p.sala, uid: p.uid, pid: p.pid, papel: p.papel, cx: p.cx, ep: p.ep as number, sj: p.sj }
  } catch {
    return null
  }
}

/** Para os testes: o segredo pode mudar entre casos. */
export function _esquecerSegredo(): void {
  segredoCache = null
}
