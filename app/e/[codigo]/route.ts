import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { diaEmBrasilia } from '@/lib/fuso-brasilia'
import { embaixadorAtivoPorCodigo, registrarClique } from '@/lib/embaixadores/servidor'
import { COOKIE_DO_EMBAIXADOR, DIAS_DO_COOKIE, destinoSeguro, normalizarCodigo } from '@/lib/embaixadores/regras'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * O link de divulgação: `domineaqui.com.br/e/CODIGO`.
 *
 * Grava o cookie da indicação (último clique vence, por 60 dias), conta a
 * visita e redireciona — para o convite do embaixador ou, com `?para=/caminho`,
 * para qualquer página interna. A resposta é um 307 sem corpo: não custa
 * transferência.
 *
 * As prévias de link do WhatsApp, Instagram e afins também abrem o endereço;
 * elas recebem o redirecionamento mas não entram na conta de visitas.
 */
const ROBO = /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|discord|slack|twitter|linkedin|embedly|preview|headless|lighthouse/i

export async function GET(request: NextRequest, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo: bruto } = await params
  const codigo = normalizarCodigo(bruto)
  const destino = new URL(destinoSeguro(request.nextUrl.searchParams.get('para'), codigo), request.url)

  try {
    const db = await getDb()
    const embaixador = await embaixadorAtivoPorCodigo(db, codigo)
    // Código que não existe (ou embaixador que saiu do programa): a pessoa
    // ainda quer conhecer o site, então vai para a página inicial.
    if (!embaixador?._id) return semCache(NextResponse.redirect(new URL('/', request.url), 307))

    const resposta = semCache(NextResponse.redirect(destino, 307))
    resposta.cookies.set(COOKIE_DO_EMBAIXADOR, embaixador.codigo, {
      maxAge: DIAS_DO_COOKIE * 86_400,
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    const agente = request.headers.get('user-agent') || ''
    if (agente && !ROBO.test(agente)) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconhecido'
      const limite = await checkRateLimit(ip, 'embaixador_clique', 20, 60_000)
      if (limite.success) {
        const novo = request.cookies.get(COOKIE_DO_EMBAIXADOR)?.value !== embaixador.codigo
        await registrarClique(db, String(embaixador._id), diaEmBrasilia(), novo).catch((erro) =>
          console.error('[embaixadores] falha ao contar clique:', erro),
        )
      }
    }
    return resposta
  } catch (erro) {
    console.error('[embaixadores] link:', erro)
    return semCache(NextResponse.redirect(destino, 307))
  }
}

function semCache(resposta: NextResponse) {
  resposta.headers.set('Cache-Control', 'private, no-store')
  resposta.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return resposta
}
