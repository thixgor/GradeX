'use client'

/**
 * Páginas do leitor de materiais guardadas no aparelho (Cache Storage).
 *
 * ## Por que além do cache HTTP
 *
 * A página marcada vale a semana inteira para a mesma pessoa (ver
 * `lib/material-pdf-leitura.ts`), e o servidor já manda o navegador guardá-la
 * até lá. Só que o cache HTTP é do navegador, não nosso: ele descarta o que
 * quiser quando quiser — no celular, em poucas horas — e cada página
 * descartada volta a ser baixada da função, ao preço mais caro da fatura.
 *
 * O Cache Storage é da origem: só sai daqui quando nós apagamos (ou quando o
 * aparelho fica sem espaço de verdade). Quem estuda o mesmo material vários
 * dias da semana baixa cada página uma vez.
 *
 * ## Regras
 *
 * - Só entra o que o servidor deixou guardar (`max-age`) e só até onde ele
 *   deixou. Vencida, a página é apagada na leitura e na faxina.
 * - A URL leva a chave de leitura (`c`): outra pessoa no mesmo aparelho, ou o
 *   PDF reenviado pelo admin, nunca casa com o que está guardado.
 * - Sair da conta apaga tudo (ver `clearBootstrapCache`).
 * - Teto de entradas: as mais antigas saem primeiro.
 *
 * Tudo aqui falha em silêncio: sem Cache Storage (aba anônima, navegador
 * antigo, cota cheia) o leitor segue pela rede, como antes.
 */

const NOME = 'domineaqui-paginas-v1'
const EXPIRA_EM = 'x-domineaqui-expira-em'
const CONTAGEM = 'x-domineaqui-page-count'

function tetoDeEntradas(): number {
  if (typeof window === 'undefined') return 0
  const estreito = window.matchMedia?.('(max-width: 767px)').matches
  return estreito ? 300 : 700
}

async function abrir(): Promise<Cache | null> {
  try {
    if (typeof caches === 'undefined') return null
    return await caches.open(NOME)
  } catch {
    return null
  }
}

export interface PaginaGuardada {
  bytes: Uint8Array
  pageCount?: number
}

/** A página guardada para esta URL, se ainda estiver na validade. */
export async function lerPaginaGuardada(url: string): Promise<PaginaGuardada | null> {
  const cache = await abrir()
  if (!cache) return null
  try {
    const resposta = await cache.match(url)
    if (!resposta) return null
    const expiraEm = Number(resposta.headers.get(EXPIRA_EM))
    if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) {
      void cache.delete(url)
      return null
    }
    const contagem = Number(resposta.headers.get(CONTAGEM))
    return {
      bytes: new Uint8Array(await resposta.arrayBuffer()),
      pageCount: Number.isFinite(contagem) && contagem > 0 ? contagem : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Até quando o servidor deixou guardar esta resposta, ou `null` se não
 * deixou (`no-store`, sem `max-age`).
 */
export function validadeDaResposta(resposta: Response): number | null {
  const cacheControl = resposta.headers.get('cache-control') || ''
  if (/no-store/i.test(cacheControl)) return null
  const maxAge = Number(/max-age=(\d+)/i.exec(cacheControl)?.[1])
  if (!Number.isFinite(maxAge) || maxAge <= 0) return null
  const geradaEm = Date.parse(resposta.headers.get('date') || '')
  return (Number.isFinite(geradaEm) ? geradaEm : Date.now()) + maxAge * 1000
}

let faxinaAgendada = false

/** Guarda a página. Chamado depois que os bytes já foram lidos da resposta. */
export async function guardarPagina(
  url: string,
  bytes: Uint8Array,
  expiraEm: number,
  pageCount?: number
): Promise<void> {
  if (!(expiraEm > Date.now())) return
  const cache = await abrir()
  if (!cache) return
  try {
    const headers = new Headers({ 'Content-Type': 'application/pdf', [EXPIRA_EM]: String(expiraEm) })
    if (pageCount) headers.set(CONTAGEM, String(pageCount))
    // Cópia: quem chamou continua dono do buffer original.
    await cache.put(url, new Response(bytes.slice(), { headers }))
  } catch {
    // Cota cheia ou modo privado: fica só o que já estava.
    return
  }
  if (!faxinaAgendada) {
    faxinaAgendada = true
    setTimeout(() => {
      void fazerFaxina()
    }, 15_000)
  }
}

/**
 * Apaga as vencidas e, se ainda passar do teto, as mais antigas. `keys()`
 * devolve na ordem de inserção, então as primeiras são as mais velhas.
 */
async function fazerFaxina(): Promise<void> {
  const cache = await abrir()
  if (!cache) return
  try {
    const pedidos = await cache.keys()
    const vivos: Request[] = []
    for (const pedido of pedidos) {
      const resposta = await cache.match(pedido)
      const expiraEm = Number(resposta?.headers.get(EXPIRA_EM))
      if (!Number.isFinite(expiraEm) || expiraEm <= Date.now()) await cache.delete(pedido)
      else vivos.push(pedido)
    }
    const excesso = vivos.length - tetoDeEntradas()
    for (let i = 0; i < excesso; i += 1) await cache.delete(vivos[i])
  } catch {
    // Faxina é otimização: falhar aqui só deixa entradas para a próxima.
  } finally {
    faxinaAgendada = false
  }
}

/** Ao sair da conta: nada do que esta pessoa leu fica no aparelho. */
export async function apagarPaginasGuardadas(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') await caches.delete(NOME)
  } catch {
    // Sem Cache Storage não havia nada guardado.
  }
}
