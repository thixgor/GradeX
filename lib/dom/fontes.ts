/**
 * Fontes das respostas de saúde — sempre clicáveis, sempre de verdade.
 *
 * Modelo de linguagem inventa URL com facilidade. Por isso o Dom nunca manda
 * link pronto: ele manda o QUE buscar e ONDE (`{ titulo, busca, base }`), e o
 * servidor monta a URL de busca da base escolhida, já filtrada para o que é
 * recente (PubMed dos últimos 5 anos, Google Acadêmico dos últimos 3). Um link
 * de busca nunca dá 404 e sempre abre a literatura mais nova sobre o assunto.
 *
 * Quando a resposta foi feita com a busca do Google ligada, as páginas que o
 * Gemini realmente consultou (`groundingMetadata`) entram primeiro — essas
 * são citação direta. Só passam endereços https dos domínios conhecidos.
 */

import type { BaseDeReferencia, FonteDoDom } from './config'

export interface ReferenciaDoModelo {
  titulo?: unknown
  busca?: unknown
  base?: unknown
}

const BASES: BaseDeReferencia[] = ['pubmed', 'scielo', 'diretriz', 'livro']

function textoLimpo(v: unknown, teto: number): string {
  return typeof v === 'string' ? v.replace(/[\u0000-\u001f<>"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, teto) : ''
}

export function urlDeBusca(base: BaseDeReferencia, busca: string, agora = new Date()): { url: string; detalhe: string } {
  const q = encodeURIComponent(busca)
  switch (base) {
    case 'pubmed':
      return { url: `https://pubmed.ncbi.nlm.nih.gov/?term=${q}&filter=datesearch.y_5&sort=relevance`, detalhe: 'PubMed · últimos 5 anos' }
    case 'scielo':
      return { url: `https://search.scielo.org/?q=${q}&lang=pt`, detalhe: 'SciELO · em português' }
    case 'diretriz': {
      const desde = agora.getFullYear() - 3
      return { url: `https://scholar.google.com/scholar?q=${encodeURIComponent(`diretriz ${busca}`)}&as_ylo=${desde}`, detalhe: `Diretrizes · desde ${desde}` }
    }
    case 'livro':
      return { url: `https://books.google.com/books?q=${q}`, detalhe: 'Livros-texto' }
  }
}

/** Domínios aceitos nas citações da busca do Google. */
const DOMINIOS_DA_WEB = /^https:\/\/([a-z0-9-]+\.)*(vertexaisearch\.cloud\.google\.com|ncbi\.nlm\.nih\.gov|nih\.gov|who\.int|paho\.org|gov\.br|scielo\.(br|org)|cochranelibrary\.com|nejm\.org|thelancet\.com|bmj\.com|jamanetwork\.com|msdmanuals\.com|cdc\.gov|uptodate\.com|medscape\.com|nature\.com|sciencedirect\.com|springer\.com|wiley\.com|org\.br|edu\.br|ufrj\.br|usp\.br)(\/|$)/i

export function fontesDaBusca(dados: any, teto = 3): FonteDoDom[] {
  const pedacos: any[] = dados?.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  const saida: FonteDoDom[] = []
  const vistos = new Set<string>()
  for (const p of pedacos) {
    const url = textoLimpo(p?.web?.uri, 600)
    const titulo = textoLimpo(p?.web?.title, 90) || 'Fonte consultada'
    if (!url || !DOMINIOS_DA_WEB.test(url) || vistos.has(titulo)) continue
    vistos.add(titulo)
    saida.push({ titulo, url, origem: 'web', detalhe: 'Consultada agora' })
    if (saida.length >= teto) break
  }
  return saida
}

export function fontesDasReferencias(refs: unknown, teto = 3, agora = new Date()): FonteDoDom[] {
  if (!Array.isArray(refs)) return []
  const saida: FonteDoDom[] = []
  for (const r of refs as ReferenciaDoModelo[]) {
    const base = BASES.includes(r?.base as BaseDeReferencia) ? (r.base as BaseDeReferencia) : 'pubmed'
    const busca = textoLimpo(r?.busca, 120)
    const titulo = textoLimpo(r?.titulo, 90)
    if (!busca || !titulo) continue
    const { url, detalhe } = urlDeBusca(base, busca, agora)
    saida.push({ titulo, url, origem: base, detalhe })
    if (saida.length >= teto) break
  }
  return saida
}
