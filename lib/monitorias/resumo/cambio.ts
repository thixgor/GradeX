import 'server-only'

/**
 * Câmbio do dólar para o preço do Resumo por IA: PTAX de venda do Banco
 * Central (API pública Olinda, sem chave e sem custo), a mais recente dos
 * últimos 10 dias (fim de semana e feriado não têm boletim). Cache de 6 h por
 * instância: o preço não precisa da cotação do minuto, e a página do checkout
 * não pode esperar o BCB a cada visita.
 *
 * Falhou (BCB fora, formato inesperado, valor absurdo) → câmbio manual do
 * painel. O painel mostra qual foi usado e de quando.
 */

import { memoizarPorTempo } from '@/lib/cache-de-servidor'
import type { ConfigResumo } from './tipos'

export interface Cambio {
  brlPorUsd: number
  fonte: 'ptax' | 'manual'
  /** Dia do boletim PTAX ("AAAA-MM-DD"); null no manual. */
  data: string | null
}

const OLINDA = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata'

function mmddaaaa(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${z(d.getUTCMonth() + 1)}-${z(d.getUTCDate())}-${d.getUTCFullYear()}`
}

async function buscarPtax(agora: Date): Promise<Cambio | null> {
  const inicio = new Date(agora.getTime() - 10 * 86_400_000)
  const url =
    `${OLINDA}/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)` +
    `?@dataInicial='${mmddaaaa(inicio)}'&@dataFinalCotacao='${mmddaaaa(agora)}'&$format=json`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(6_000), cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!r.ok) return null
    const dados = (await r.json()) as { value?: Array<{ cotacaoVenda?: unknown; dataHoraCotacao?: unknown }> }
    const linhas = Array.isArray(dados?.value) ? dados.value : []
    for (let i = linhas.length - 1; i >= 0; i--) {
      const venda = Number(linhas[i]?.cotacaoVenda)
      // Faixa de sanidade: fora dela é dado quebrado, não câmbio.
      if (Number.isFinite(venda) && venda > 2 && venda < 20) {
        const quando = typeof linhas[i]?.dataHoraCotacao === 'string' ? String(linhas[i].dataHoraCotacao).slice(0, 10) : null
        return { brlPorUsd: venda, fonte: 'ptax', data: quando }
      }
    }
    return null
  } catch {
    return null
  }
}

/** Câmbio a usar agora (PTAX com cache de 6 h, ou o manual do painel). */
export async function cambioAtual(config: ConfigResumo, agora = new Date()): Promise<Cambio> {
  const manual: Cambio = { brlPorUsd: config.cambio.manualBrlPorUsd, fonte: 'manual', data: null }
  if (config.cambio.fonte === 'manual') return manual
  try {
    const ptax = await memoizarPorTempo('resumo-ia:ptax', 6 * 3600_000, async () => {
      const r = await buscarPtax(agora)
      // Sem PTAX não guarda em cache por 6 h: tenta de novo na próxima.
      if (!r) throw new Error('ptax indisponível')
      return r
    })
    return ptax
  } catch {
    return manual
  }
}
