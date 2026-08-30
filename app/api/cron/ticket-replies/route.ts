import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { isCronAuthorized } from '@/lib/cron-auth'
import { varrerRespostasPendentes } from '@/lib/tickets-avisos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Entrega as respostas de suporte que a trava de rajada segurou.
 *
 * Quando o atendente escreve várias mensagens seguidas, só a primeira sai por
 * e-mail na hora — as outras ficam marcadas no ticket (`pendingEmailSince`).
 * Esta rotina recolhe essas dívidas alguns minutos depois e manda tudo num
 * e-mail só. É ela que sustenta a promessa do sistema: uma resposta do suporte
 * nunca fica só no chat, mesmo que seja a última do atendimento e o admin não
 * escreva mais nada.
 *
 * A consulta é barata de propósito — índice em `pendingEmailSince` e, na
 * imensa maioria das execuções, zero documentos.
 *
 * Autenticação: `x-vercel-cron`, `Authorization: Bearer ${CRON_SECRET}`,
 * `x-cron-secret` ou `?secret=` (ver lib/cron-auth).
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()
    const stats = await varrerRespostasPendentes(db)
    return NextResponse.json({ ok: true, ...stats })
  } catch (error) {
    console.error('[cron/ticket-replies] falha na varredura:', error)
    return NextResponse.json({ error: 'Erro na varredura de respostas' }, { status: 500 })
  }
}
