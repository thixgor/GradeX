import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { currentPagePath, touchPresence } from '@/lib/presence/server'
import { PRESENCE_HEADER } from '@/lib/presence/shared'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * ═══════════════════════════════════════════════════════════════
 *  Ping de presença — a rota mais barata do projeto, de propósito
 * ───────────────────────────────────────────────────────────────
 *  Ela existe para UM caso só: a pessoa está no site, acordada, mas
 *  parada numa leitura — nenhuma requisição sai do browser e, sem
 *  isso, ela sumiria da contagem de online. Quem está clicando não
 *  passa por aqui: as próprias chamadas de API já carimbam a sessão.
 *
 *  Por que ela é barata:
 *   • NÃO chama `getSession()` — só valida o JWT do cookie (jose,
 *     puro CPU, sem rede). Ficariam de fora dois `findOne` no Mongo
 *     (usuário + estado da sessão) que não mudam nada aqui.
 *   • Faz no máximo UM `updateOne` por índice único (`jti`), e ainda
 *     assim só quando o carimbo anterior tem mais de 45s.
 *   • Responde 204 sem corpo.
 *
 *  Segurança: o único efeito possível é mover `lastActiveAt` para
 *  agora numa sessão não revogada do próprio portador do cookie.
 *  Sessão revogada não casa com o filtro — o ping não ressuscita
 *  ninguém que o admin (ou o limite de aparelhos) derrubou.
 * ═══════════════════════════════════════════════════════════════
 */
export async function POST() {
  try {
    const token = (await cookies()).get('auth-token')
    if (!token?.value) return anon()

    const payload = await verifyToken(token.value)
    // Login legado (anterior ao registro de sessões) não tem `jti`: não há
    // o que carimbar. Responde 'anon' para a aba desistir de tentar.
    if (!payload?.jti) return anon()

    // O `Referer` deste próprio ping é a página em que a pessoa está parada —
    // o dado que faltava para o painel dizer o que ela está fazendo. Vem junto
    // com a requisição; não custa nada a mais.
    const path = await currentPagePath()

    const db = await getDb()
    await touchPresence(db, payload.jti, path)

    return new NextResponse(null, { status: 204, headers: { [PRESENCE_HEADER]: 'ok' } })
  } catch (error) {
    console.error('[presence] falha ao carimbar presença:', error)
    // Presença é best-effort: um erro aqui nunca pode virar ruído na tela
    // do aluno nem fazer a aba reagir de alguma forma.
    return new NextResponse(null, { status: 204, headers: { [PRESENCE_HEADER]: 'ok' } })
  }
}

function anon() {
  return new NextResponse(null, { status: 204, headers: { [PRESENCE_HEADER]: 'anon' } })
}
