import 'server-only'

/**
 * Dispara o processador do Resumo por IA sem ninguém esperar: um POST à rota
 * interna (protegida por CRON_SECRET), que responde 202 na hora e trabalha
 * dentro do `waitUntil` da própria invocação. Quem dispara só espera o 202.
 */

import { waitUntil } from '@vercel/functions'

export function dispararProcessador(origem: string): void {
  const segredo = (process.env.CRON_SECRET || '').trim()
  const url = `${origem.replace(/\/$/, '')}/api/interno/monitorias/resumos`
  const envio = fetch(url, {
    method: 'POST',
    headers: segredo ? { Authorization: `Bearer ${segredo}` } : { 'x-vercel-cron': '1' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  })
    .then((r) => {
      if (r.status !== 202) console.warn('[resumo-ia] processador respondeu', r.status)
    })
    .catch(() => console.warn('[resumo-ia] não foi possível disparar o processador (a varredura retoma)'))
  try {
    waitUntil(envio)
  } catch {
    /* fora da Vercel: a promessa segue sozinha */
  }
}
