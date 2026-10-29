import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { Db } from 'mongodb'
import type { NextRequest } from 'next/server'
import { getClientIp } from '@/lib/sessions'

/**
 * O lado secreto do chamado de visitante: desafio de uso único, chave de
 * acompanhamento e as identidades com hash. Só servidor (usa `node:crypto` e o
 * segredo do app).
 *
 * ## Por que um desafio, e não só rate limit
 *
 * Rate limit por IP para um robô com mil IPs é uma cerca baixa. O desafio
 * obriga cada envio a começar por um GET que só o formulário faz, e a esperar
 * alguns segundos antes do POST: quem dispara direto contra a API sem passar
 * pela página não tem desafio; quem reaproveita um desafio é barrado pelo
 * registro de uso único; quem envia em menos de 3 s não é gente digitando.
 * Junto com o honeypot, o reCAPTCHA, o limite por e-mail e o teto global,
 * fica caro abusar — e barato para quem só quer ajuda.
 *
 * ## Por que a chave é derivada, e não sorteada
 *
 * O visitante acompanha o chamado por um link com chave. Sorteá-la exigiria
 * guardá-la em claro (para pôr no e-mail de cada resposta) ou perdê-la (e o
 * e-mail não teria link). HMAC(segredo, id) dá os dois: ninguém adivinha sem o
 * segredo, e o servidor recalcula quando precisa, sem guardar nada.
 */

const VERSAO_DA_CHAVE = 'suporte-visitante:v1:'
const VERSAO_DO_DESAFIO = 'suporte-desafio:v1:'

/** Tempo mínimo entre abrir o formulário e enviar. Robô não espera; gente digita. */
export const DESAFIO_IDADE_MIN_MS = 3_000
/** Depois disso o desafio vence — a página pede outro sem a pessoa perceber. */
export const DESAFIO_IDADE_MAX_MS = 2 * 60 * 60 * 1000

function segredo(): string {
  const valor = process.env.JWT_SECRET
  if (!valor || valor.length < 16) {
    throw new Error('JWT_SECRET ausente: o suporte de visitante não pode assinar chaves.')
  }
  return valor
}

function hmac(texto: string): Buffer {
  return createHmac('sha256', segredo()).update(texto).digest()
}

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

// ── Chave de acompanhamento ───────────────────────────────────────────────

export function chaveDoTicketDeVisitante(ticketId: string): string {
  return hmac(`${VERSAO_DA_CHAVE}${ticketId}`).toString('base64url').slice(0, 32)
}

export function chaveConfere(ticketId: string, chave: unknown): boolean {
  if (typeof chave !== 'string' || chave.length !== 32) return false
  try {
    return iguais(chaveDoTicketDeVisitante(ticketId), chave)
  } catch {
    return false
  }
}

export function linkDoTicketDeVisitante(ticketId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://domineaqui.com.br'
  return `${base}/suporte/ticket/${ticketId}?chave=${chaveDoTicketDeVisitante(ticketId)}`
}

// ── Desafio de uso único ──────────────────────────────────────────────────

export function emitirDesafio(agora = Date.now()): string {
  const corpo = `${agora.toString(36)}.${randomBytes(12).toString('base64url')}`
  const assinatura = hmac(`${VERSAO_DO_DESAFIO}${corpo}`).toString('base64url').slice(0, 27)
  return `${corpo}.${assinatura}`
}

export type DesafioLido =
  | { ok: true; nonce: string; emitidoEm: number }
  | { ok: false; motivo: 'formato' | 'assinatura' | 'cedo' | 'vencido' }

/** Confere assinatura e idade. O uso único é com `consumirDesafio`, no banco. */
export function lerDesafio(token: unknown, agora = Date.now()): DesafioLido {
  if (typeof token !== 'string' || token.length > 120) return { ok: false, motivo: 'formato' }
  const partes = token.split('.')
  if (partes.length !== 3) return { ok: false, motivo: 'formato' }
  const [tempo, nonce, assinatura] = partes
  if (!/^[0-9a-z]{6,12}$/.test(tempo) || !/^[A-Za-z0-9_-]{16}$/.test(nonce)) {
    return { ok: false, motivo: 'formato' }
  }

  let esperada: string
  try {
    esperada = hmac(`${VERSAO_DO_DESAFIO}${tempo}.${nonce}`).toString('base64url').slice(0, 27)
  } catch {
    return { ok: false, motivo: 'assinatura' }
  }
  if (!iguais(esperada, assinatura)) return { ok: false, motivo: 'assinatura' }

  const emitidoEm = parseInt(tempo, 36)
  const idade = agora - emitidoEm
  if (idade < DESAFIO_IDADE_MIN_MS) return { ok: false, motivo: 'cedo' }
  if (idade > DESAFIO_IDADE_MAX_MS) return { ok: false, motivo: 'vencido' }
  return { ok: true, nonce, emitidoEm }
}

let indicesGarantidos = false

/** Índices do suporte de visitante — uma vez por instância, não por requisição. */
export async function garantirIndicesDoVisitante(db: Db): Promise<void> {
  if (indicesGarantidos) return
  try {
    await Promise.all([
      db.collection('suporte_desafios').createIndex({ nonce: 1 }, { unique: true }),
      db.collection('suporte_desafios').createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 }),
      db.collection('tickets').createIndex(
        { visitanteEmailHash: 1, createdAt: -1 },
        { partialFilterExpression: { origem: 'visitante' } },
      ),
    ])
    indicesGarantidos = true
  } catch (err) {
    console.error('[suporte-visitante] falha ao garantir índices:', err)
  }
}

/**
 * Gasta o desafio. `false` = já usado (reenvio, replay de um robô). O registro
 * some sozinho pelo TTL quando o desafio venceria de qualquer forma.
 */
export async function consumirDesafio(db: Db, nonce: string, emitidoEm: number): Promise<boolean> {
  try {
    await db.collection('suporte_desafios').insertOne({
      nonce,
      expiraEm: new Date(emitidoEm + DESAFIO_IDADE_MAX_MS),
    })
    return true
  } catch (err: any) {
    if (err?.code === 11000) return false
    throw err
  }
}

// ── Identidades com hash ──────────────────────────────────────────────────

/**
 * IP e e-mail viram hash com o segredo antes de servir de chave de limite ou
 * de busca: o painel e os logs não guardam o IP de ninguém, e a chave de rate
 * limit não expõe e-mails.
 */
export function hashDe(tipo: 'ip' | 'email', valor: string): string {
  return createHash('sha256').update(`${tipo}:${valor}:${segredo()}`).digest('hex').slice(0, 32)
}

export function ipDaRequisicao(request: NextRequest): string {
  return getClientIp(request)
}

/**
 * A requisição veio do próprio site? Navegador manda `Origin` em todo POST e
 * PATCH de `fetch`; um formulário de outro domínio ou um script preguiçoso não
 * manda o nosso. Não é a defesa principal (dá para forjar fora do navegador),
 * mas corta o grosso do lixo antes de qualquer trabalho.
 */
export function origemConfere(request: NextRequest): boolean {
  const origem = request.headers.get('origin')
  if (!origem) return false
  try {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    return new URL(origem).host === host
  } catch {
    return false
  }
}

/**
 * Lê o corpo JSON com teto de tamanho, sem confiar no `Content-Length` (que o
 * cliente escolhe). Corpo gigante não chega a virar objeto na memória.
 */
export async function lerJsonLimitado(
  request: NextRequest,
  maxBytes: number,
): Promise<{ ok: true; corpo: Record<string, unknown> } | { ok: false; status: number; erro: string }> {
  const declarado = Number(request.headers.get('content-length') || 0)
  if (declarado > maxBytes) return { ok: false, status: 413, erro: 'Mensagem grande demais.' }
  if (!(request.headers.get('content-type') || '').includes('application/json')) {
    return { ok: false, status: 415, erro: 'Formato inválido.' }
  }

  const leitor = request.body?.getReader()
  if (!leitor) return { ok: false, status: 400, erro: 'Corpo vazio.' }
  const pedacos: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await leitor.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await leitor.cancel().catch(() => {})
      return { ok: false, status: 413, erro: 'Mensagem grande demais.' }
    }
    pedacos.push(value)
  }

  try {
    const texto = Buffer.concat(pedacos.map((p) => Buffer.from(p))).toString('utf8')
    const corpo = JSON.parse(texto)
    if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
      return { ok: false, status: 400, erro: 'Formato inválido.' }
    }
    return { ok: true, corpo: corpo as Record<string, unknown> }
  } catch {
    return { ok: false, status: 400, erro: 'Formato inválido.' }
  }
}
