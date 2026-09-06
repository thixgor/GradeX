import { headers } from 'next/headers'
import { normalizarCaminho } from './atividade'

/**
 * Em que página a pessoa está, deduzido dos cabeçalhos da requisição atual.
 *
 * É de graça: são cabeçalhos que já chegaram junto com a requisição que ia
 * carimbar a sessão de qualquer jeito. Duas fontes, nesta ordem:
 *
 *  • `next-url` — a navegação do App Router manda o destino aqui. É o valor
 *    mais fiel: diz para onde a pessoa ACABOU de ir.
 *  • `referer`  — em toda chamada de API feita de dentro de uma página (e no
 *    próprio ping de presença) o navegador manda a URL da página. É o que
 *    cobre quem está parado numa tela fazendo requisições.
 *
 * Prefetch é descartado de propósito: o Next busca o destino de um link só
 * porque ele apareceu na tela, e contar isso mostraria o admin uma página
 * que a pessoa nunca abriu.
 */
export async function currentPagePath(): Promise<string> {
  try {
    const h = await headers()
    if (h.get('next-router-prefetch') || h.get('purpose') === 'prefetch') return ''

    const nextUrl = normalizarCaminho(h.get('next-url'))
    if (nextUrl) return nextUrl

    return normalizarCaminho(h.get('referer'))
  } catch {
    // Fora de um escopo de requisição (job, teste): simplesmente não há página.
    return ''
  }
}
