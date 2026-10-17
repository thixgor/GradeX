import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { origemConfiavel } from '@/lib/monitorias/origem'
import { CORPO_MAX_BYTES } from '@/lib/monitorias/sala/mensagens'
import { EsquemaEnvio } from '@/lib/monitorias/sala/esquemas'
import { verificarTokenDaSala, vinculoDaSessao, type ClaimsDaSala } from '@/lib/monitorias/sala/token'
import { acaoDoAnfitriao, encerrarOuReabrir, enviarSinal, lerSinais, sairDaSala } from '@/lib/monitorias/sala/servidor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Sinalização da sala — a única rota repetida da videoconferência
 * ───────────────────────────────────────────────────────────────
 *  Áudio e vídeo NÃO passam por aqui (vão direto entre os navegadores
 *  ou pelo Cloudflare TURN). Esta rota só apresenta as pessoas: troca
 *  oferta, resposta e candidatos enquanto ninguém está conectado, e
 *  recebe o pulso de presença (30 s) depois que a aula começou.
 *
 *  Por que ela é barata:
 *   • NÃO chama `getSession()` nem o rate limit durável: o token da
 *     sala (assinado, 15 min, uma conexão) e o JWT do cookie são
 *     conferidos só em CPU. A autorização completa acontece em
 *     `…/sala` (entrar e renovar).
 *   • Cada volta é UMA operação no Mongo, com os sinais já filtrados
 *     lá dentro. Sala parada responde 304 sem corpo.
 *   • Envio de sinal é UMA escrita, com o limite por minuto dentro
 *     dela (no próprio documento da sala).
 * ═══════════════════════════════════════════════════════════════
 */

const SEM_CACHE = { 'Cache-Control': 'private, no-store' }

function falha(status: number, mensagem: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: mensagem, ...extra }, { status, headers: SEM_CACHE })
}

/**
 * Primeira barreira, de graça: uma conexão não pergunta mais de 3 vezes por
 * segundo. É por instância (não segura um ataque distribuído), mas o token já
 * restringe quem pode chegar aqui a um participante autorizado, no horário.
 */
const voltas = new Map<string, { n: number; ate: number }>()
function rapidoDemais(cx: string): boolean {
  const agora = Date.now()
  if (voltas.size > 5_000) voltas.clear()
  const v = voltas.get(cx)
  if (!v || v.ate < agora) {
    voltas.set(cx, { n: 1, ate: agora + 1_000 })
    return false
  }
  v.n++
  return v.n > 3
}

/** O token vale e pertence a quem está com o cookie desta sessão. */
async function autenticar(request: NextRequest, salaId: string, token: string | null, toleranciaS?: number): Promise<ClaimsDaSala | null> {
  const claims = await verificarTokenDaSala(token, { toleranciaS })
  if (!claims || claims.sala !== salaId) return null
  const cookie = request.cookies.get('auth-token')?.value
  if (!cookie) {
    // Teste local sem login (lib/dev-auth.ts): não há cookie para conferir.
    return process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_AUTH === 'true' ? claims : null
  }
  const sessao = await verifyToken(cookie)
  if (!sessao || sessao.userId !== claims.uid) return null
  return vinculoDaSessao({ userId: sessao.userId, jti: sessao.jti, iat: typeof sessao.iat === 'number' ? sessao.iat : undefined }) === claims.sj ? claims : null
}

function tokenDoHeader(request: NextRequest): string | null {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null
}

/** GET ?desde=<seq>&pulso=1 — sinais novos para mim + quem está na sala. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const claims = await autenticar(request, params.id, tokenDoHeader(request))
    if (!claims) return falha(401, 'Sua entrada na sala venceu. Entre de novo.', { motivo: 'token' })
    if (rapidoDemais(claims.cx)) return falha(429, 'Calma, só um instante.')
    const busca = request.nextUrl.searchParams
    const desde = Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Number.parseInt(busca.get('desde') || '0', 10) || 0))
    const r = await lerSinais(claims, desde, busca.get('pulso') === '1')
    if (!r.ok) return falha(r.status, r.mensagem, { motivo: r.motivo })
    if (request.headers.get('if-none-match') === r.etag) {
      return new NextResponse(null, { status: 304, headers: { ...SEM_CACHE, ETag: r.etag } })
    }
    return jsonComprimido(request, r.resposta, { headers: { ...SEM_CACHE, ETag: r.etag } })
  } catch (err) {
    console.error('[monitorias/sala] falha ao ler sinais:', err)
    return falha(500, 'Falha momentânea. Tentando de novo.')
  }
}

/**
 * POST — oferta, resposta, candidatos, pedido de reinício, saída,
 * encerrar/reabrir e os controles do anfitrião que valem no servidor
 * (tirar/liberar alguém, permissões dos alunos) — estes só para o monitor. A saída também chega pelo `sendBeacon` da aba que
 * fecha, com o token no corpo (o beacon não envia header).
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!origemConfiavel(request)) return falha(403, 'Origem da requisição não permitida.')
    const texto = await request.text()
    if (texto.length > CORPO_MAX_BYTES) return falha(413, 'Mensagem grande demais.')
    let corpo: unknown
    try {
      corpo = JSON.parse(texto)
    } catch {
      return falha(400, 'Mensagem inválida.')
    }
    const parsed = EsquemaEnvio.safeParse(corpo)
    if (!parsed.success) return falha(400, 'Mensagem inválida.')
    const envio = parsed.data
    const sair = envio.tipo === 'sair'
    const token = tokenDoHeader(request) || (sair ? envio.token || null : null)
    // Quem fecha a aba com o notebook dormindo há uma hora ainda registra a saída.
    const claims = await autenticar(request, params.id, token, sair ? 3_600 : undefined)
    if (!claims) return falha(401, 'Sua entrada na sala venceu. Entre de novo.', { motivo: 'token' })

    if (envio.tipo === 'sair') {
      await sairDaSala(claims, envio.uso)
      return new NextResponse(null, { status: 204, headers: SEM_CACHE })
    }
    if (envio.tipo === 'encerrar' || envio.tipo === 'reabrir') {
      const r = await encerrarOuReabrir(claims, envio.tipo === 'encerrar')
      return r.ok ? NextResponse.json({ ok: true }, { headers: SEM_CACHE }) : falha(r.status, r.mensagem, { motivo: r.motivo })
    }
    if (envio.tipo === 'remover' || envio.tipo === 'readmitir' || envio.tipo === 'permissoes') {
      const r = await acaoDoAnfitriao(claims, envio)
      return r.ok ? NextResponse.json({ ok: true }, { headers: SEM_CACHE }) : falha(r.status, r.mensagem, { motivo: r.motivo })
    }
    const r = await enviarSinal(claims, envio)
    return r.ok ? NextResponse.json({ ok: true }, { status: 202, headers: SEM_CACHE }) : falha(r.status, r.mensagem, { motivo: r.motivo })
  } catch (err) {
    console.error('[monitorias/sala] falha ao gravar sinal:', err)
    return falha(500, 'Falha momentânea. Tentando de novo.')
  }
}
