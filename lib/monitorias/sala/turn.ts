import 'server-only'

/**
 * Cloudflare Realtime TURN: credenciais temporárias geradas pelo nosso servidor.
 *
 * Por que existe: uma parte das conexões (rede corporativa ou de universidade,
 * alguns NATs de operadora) não fecha direto entre os navegadores. A Vercel não
 * retransmite UDP, então o relé tem de ser outro serviço. A Cloudflare cobra só
 * a saída (US$ 0,05/GB, primeiros 1.000 GB/mês grátis) e não pede servidor para
 * manter. O navegador recebe um usuário/senha que vence quando a sala fecha.
 *
 * Tudo aqui falha FECHADO para o custo e ABERTO para a aula: se a Cloudflare não
 * responder em 3 s, a sala segue só com STUN (conexão direta), sem travar a entrada.
 *
 * Variáveis: `CLOUDFLARE_TURN_KEY_ID` e `CLOUDFLARE_TURN_API_TOKEN` (painel da
 * Cloudflare → Realtime → TURN). Sem elas, o TURN fica "sem credenciais" no admin.
 */

const BASE = 'https://rtc.live.cloudflare.com/v1/turn/keys'
const TEMPO_MAXIMO_MS = 3_000

export interface ServidorIce {
  urls: string | string[]
  username?: string
  credential?: string
}

/** STUN gratuito da Cloudflare (mesmo operador do TURN: um terceiro só). */
export const STUN_PADRAO: ServidorIce = { urls: ['stun:stun.cloudflare.com:3478'] }

export function turnConfigurado(): boolean {
  return !!(process.env.CLOUDFLARE_TURN_KEY_ID && process.env.CLOUDFLARE_TURN_API_TOKEN)
}

/**
 * A porta 53 aparece na resposta, mas navegadores costumam esperar o tempo todo
 * por ela antes de desistir: só atrasa a coleta de candidatos.
 */
function semPorta53(urls: string | string[]): string[] {
  return (Array.isArray(urls) ? urls : [urls]).filter((u) => typeof u === 'string' && !/:53(\?|$)/.test(u))
}

export async function gerarCredenciaisTurn(ttlSegundos: number): Promise<{ servidores: ServidorIce[]; usuario: string | null } | null> {
  const chave = process.env.CLOUDFLARE_TURN_KEY_ID
  const token = process.env.CLOUDFLARE_TURN_API_TOKEN
  if (!chave || !token) return null
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(chave)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ttl: Math.round(ttlSegundos) }),
      signal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[monitorias/sala] TURN recusado pela Cloudflare:', res.status)
      return null
    }
    const corpo = (await res.json()) as { iceServers?: ServidorIce[] | ServidorIce }
    const lista = Array.isArray(corpo.iceServers) ? corpo.iceServers : corpo.iceServers ? [corpo.iceServers] : []
    const servidores: ServidorIce[] = []
    let usuario: string | null = null
    for (const s of lista) {
      const urls = semPorta53(s.urls)
      if (!urls.length) continue
      const ehTurn = urls.some((u) => u.startsWith('turn'))
      if (ehTurn && (!s.username || !s.credential)) continue
      if (ehTurn) usuario = s.username || null
      servidores.push({ urls, ...(ehTurn ? { username: s.username, credential: s.credential } : {}) })
    }
    return servidores.some((s) => s.username) ? { servidores, usuario } : null
  } catch (err) {
    console.warn('[monitorias/sala] TURN indisponível; seguindo só com STUN:', (err as Error)?.name)
    return null
  }
}

/** "Cortar agora" no admin: revoga credenciais já entregues (melhor esforço). */
export async function revogarCredencialTurn(usuario: string): Promise<boolean> {
  const chave = process.env.CLOUDFLARE_TURN_KEY_ID
  const token = process.env.CLOUDFLARE_TURN_API_TOKEN
  if (!chave || !token || !usuario) return false
  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(chave)}/credentials/${encodeURIComponent(usuario)}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(TEMPO_MAXIMO_MS),
      cache: 'no-store',
    })
    return res.ok
  } catch {
    return false
  }
}
