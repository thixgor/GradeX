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
 * - `blob`: há `NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE` configurado — um CDN nosso,
 *   endereçado por hash. É o modo mais robusto.
 * - `origem`: as imagens vêm do próprio digitalhistology.org, que já as publica
 *   sob CC BY-NC-SA. Sempre ativo fora de produção (permite desenvolver e
 *   revisar sem baixar os 2,56 GiB); em produção exige o opt-in explícito
 *   `NEXT_PUBLIC_HISTOLOGIA_MIDIA_ORIGEM=1`, porque a decisão tem consequência:
 *   o tráfego dos nossos alunos passa a bater no servidor de terceiros, e uma
 *   mudança de URL do lado deles quebra o atlas inteiro.
 * - `indisponivel`: produção sem CDN e sem o opt-in. A interface mostra um
 *   aviso honesto em vez de um quadrado quebrado.
 */
export function estrategiaDeMidia(): EstrategiaDeMidia {
  if (baseDoBlob()) return 'blob'
  if (servirDaOrigem()) return 'origem'
  return 'indisponivel'
}

function baseDoBlob(): string | null {
  const base = process.env.NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE
  if (!base) return null
  return base.replace(/\/+$/, '')
}

function servirDaOrigem(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.NEXT_PUBLIC_HISTOLOGIA_MIDIA_ORIGEM === '1'
}

/**
 * URL pública de uma mídia. Devolve `null` quando não há como servir o arquivo
 * — a interface trata isso explicitamente em vez de renderizar `<img src="">`.
 *
 * A ordem importa: havendo CDN próprio, ele sempre vence. A origem é o plano B,
 * nunca o preferido.
 */
export function urlDaMidia(midia: Pick<Midia, 'sha256' | 'ext' | 'urlOrigem'>): string | null {
  const base = baseDoBlob()
  if (base) return `${base}/${caminhoNoBlob(midia.sha256, midia.ext)}`
  if (servirDaOrigem()) return midia.urlOrigem || null
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
  'As imagens deste módulo ainda não foram publicadas. Configure ' +
  'NEXT_PUBLIC_HISTOLOGIA_MIDIA_ORIGEM=1 para servi-las da fonte original, ou ' +
  'publique o acervo num CDN e defina NEXT_PUBLIC_HISTOLOGIA_BLOB_BASE.'

/**
 * Aviso exibido nos créditos quando as imagens vêm do servidor de origem.
 * O aluno merece saber de onde o byte está vindo, e a atribuição fica mais
 * forte — não mais fraca — quando dizemos que o arquivo é literalmente deles.
 */
export const NOTA_MIDIA_DA_ORIGEM =
  'As imagens são carregadas diretamente dos servidores do Digital Histology ' +
  '(Virginia Commonwealth University), que as publica sob CC BY-NC-SA 4.0.'
