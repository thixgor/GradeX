import type { Midia } from './esquemas'

/**
 * Resolução de mídia do Manual da Histologia.
 *
 * O acervo tem 2,56 GiB em 9.175 objetos únicos. Nada disso entra no
 * repositório (são ponteiros Git LFS) nem no deploy (`.vercelignore` corta
 * `acervo-fonte/`). Em produção os bytes vivem no Vercel Blob, enviados por
 * `public/Manual-Histologia/scripts/enviar-assets-vercel-blob.mjs`.
 *
 * A chave é sempre o SHA-256 — nunca o caminho do arquivo. É o que faz as 9.500
 * referências colapsarem em 9.175 URLs e o que garante que o mesmo conteúdo
 * nunca seja baixado duas vezes.
 */

/** Caminho do objeto no Blob. Mesmo esquema usado pelo script de envio. */
export function caminhoNoBlob(sha256: string, ext: string): string {
  return `manual-histologia/${sha256.slice(0, 2)}/${sha256}.${ext}`
}

export type EstrategiaDeMidia = 'blob' | 'origem' | 'indisponivel'

/**
 * Estratégia ativa neste ambiente.
 *
 * - `blob`: há `NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE` configurado. É o único modo
 *   aceitável em produção.
 * - `origem`: sem Blob e fora de produção, servimos a partir da URL original do
 *   digitalhistology.org. Serve para desenvolver e revisar sem precisar dos
 *   2,56 GiB na máquina; **não** é aceitável em produção, porque transferiria
 *   nosso tráfego para o servidor de terceiros.
 * - `indisponivel`: produção sem Blob. A interface mostra um aviso honesto em
 *   vez de um quadrado quebrado.
 */
export function estrategiaDeMidia(): EstrategiaDeMidia {
  if (baseDoBlob()) return 'blob'
  if (process.env.NODE_ENV !== 'production') return 'origem'
  return 'indisponivel'
}

function baseDoBlob(): string | null {
  const base = process.env.NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE
  if (!base) return null
  return base.replace(/\/+$/, '')
}

/**
 * URL pública de uma mídia. Devolve `null` quando não há como servir o arquivo
 * — a interface trata isso explicitamente em vez de renderizar `<img src="">`.
 */
export function urlDaMidia(midia: Pick<Midia, 'sha256' | 'ext' | 'urlOrigem'>): string | null {
  const base = baseDoBlob()
  if (base) return `${base}/${caminhoNoBlob(midia.sha256, midia.ext)}`
  if (process.env.NODE_ENV !== 'production') return midia.urlOrigem || null
  return null
}

/**
 * `srcset` responsivo.
 *
 * O Blob serve o arquivo original, sem transformação, e a otimização de imagem
 * da Vercel cobraria por 9.175 originais de até 4 MB. Então não fabricamos
 * variantes que não existem: devolvemos a URL única e deixamos o `sizes` do
 * `<img>` informar ao navegador quanto espaço a imagem vai ocupar. É honesto e
 * é o que o acervo permite. Quando houver um pipeline de derivadas por hash,
 * este é o único ponto a mudar.
 */
export function atributosDeImagem(
  midia: Pick<Midia, 'sha256' | 'ext' | 'urlOrigem' | 'alt' | 'largura' | 'altura'>,
  sizes: string,
) {
  const src = urlDaMidia(midia)
  return {
    src: src ?? undefined,
    alt: midia.alt,
    sizes,
    width: midia.largura,
    height: midia.altura,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }
}

/**
 * Mensagem exibida quando a mídia não pode ser servida. Diz o que está faltando
 * em vez de fingir carregamento eterno.
 */
export const AVISO_MIDIA_INDISPONIVEL =
  'As imagens deste módulo ainda não foram publicadas no CDN. Envie o acervo com ' +
  '`scripts/enviar-assets-vercel-blob.mjs` e configure NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE.'
