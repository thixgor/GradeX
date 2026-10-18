import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { isCronAuthorized } from '@/lib/cron-auth'
import { executarPasso } from '@/lib/monitorias/resumo/processador'
import { dispararProcessador } from '@/lib/monitorias/resumo/disparo'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Processador do Resumo por IA (interno: só com CRON_SECRET). Responde 202 na
 * hora e dá UM passo (transcrever um trecho ou um passo do resumo) dentro do
 * `waitUntil`. Sobrou trabalho pronto → dispara a si mesmo de novo (uma
 * invocação nova, com o prazo inteiro). Sem trabalho → para; a varredura de
 * hora em hora retoma o que ficou para depois.
 */
export async function POST(request: NextRequest) {
  if (!isCronAuthorized(request)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const origem = new URL(request.url).origin
  const trabalho = executarPasso()
    .then((r) => {
      if (r.resta) dispararProcessador(origem)
    })
    .catch((e) => console.error('[resumo-ia] passo do processador falhou:', (e as Error)?.message))
  try {
    waitUntil(trabalho)
  } catch {
    /* fora da Vercel: segue sozinha */
  }
  return NextResponse.json({ aceito: true }, { status: 202 })
}
