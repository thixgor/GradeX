import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { LIMITES_DO_DOM, type StatusDoDom } from '@/lib/dom/config'
import { verificarAcessoAoDom } from '@/lib/dom/acesso'
import { mensagensRestantes } from '@/lib/dom/limites'
import { xpDoAluno } from '@/lib/dom/contexto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * `GET /api/dom/status` — o Dom abre para esta pessoa? Quantas mensagens
 * restam hoje? Nível, liga e sequência para o painel. Pedido só quando o
 * painel do Dom abre (nunca em polling), e é o que decide entre a conversa e
 * a vitrine do plano.
 */
export async function GET() {
  const session = await getSession()
  const semConta: StatusDoDom = { liberado: false, motivo: 'nao-autenticado', primeiroNome: '', plano: '', restantes: 0, limiteDiario: LIMITES_DO_DOM.porDia }
  if (!session?.userId) return NextResponse.json(semConta, { status: 401, headers: { 'Cache-Control': 'private, no-store' } })

  const db = await getDb()
  const [acesso, restantes, xp] = await Promise.all([
    verificarAcessoAoDom(db, session.userId, session.email),
    mensagensRestantes(db, session.userId).catch(() => LIMITES_DO_DOM.porDia),
    xpDoAluno(db, session.userId),
  ])
  const corpo: StatusDoDom = {
    liberado: acesso.liberado,
    motivo: acesso.liberado ? undefined : acesso.motivo === 'suspenso' ? 'suspenso' : 'sem-plano',
    primeiroNome: acesso.usuario?.primeiroNome || '',
    plano: acesso.usuario?.plano || '',
    conta: createHash('sha256').update(`dom:${session.userId}`).digest('hex').slice(0, 12),
    periodo: acesso.usuario?.periodo ?? null,
    xp,
    restantes,
    limiteDiario: LIMITES_DO_DOM.porDia,
    suspensoAte: acesso.usuario?.suspensoAte?.toISOString() || null,
    acessoPorCompraAte: acesso.acessoPorCompraAte?.toISOString() || null,
  }
  return NextResponse.json(corpo, { headers: { 'Cache-Control': 'private, no-store' } })
}
