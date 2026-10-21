import { revalidatePath } from 'next/cache'

/**
 * Invalidação das rotas públicas cujo <head> é montado a partir do documento
 * do material/pacote.
 *
 * As páginas de catálogo não são renderizadas por requisição: `/materiais/[id]`
 * (`revalidate = 86400`) e `/flashcards/d/[slug]` (`revalidate = 3600`)
 * declaram `dynamic = 'force-static'`, e `/pacotes/[id]` é gerada sob demanda e
 * mantida no Full Route Cache. O `generateMetadata` do layout roda junto com
 * esse HTML, então o preço que aparece na `description` e em
 * `product:price:amount` fica congelado no cache. Sem invalidar explicitamente,
 * uma alteração de preço no /admin/materiais só chega aos metatags na próxima
 * revalidação (até um dia — ou nunca, no caso do pacote), e os crawlers
 * continuam lendo o valor antigo.
 */

type MaterialLike = {
  _id?: unknown
  linkedDeckSlug?: unknown
}

function toId(value: unknown): string {
  const id = value == null ? '' : String(value).trim()
  // Só ids simples viram caminho — evita que um valor inesperado no banco
  // monte um path com barras ou querystring.
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : ''
}

/**
 * Caminhos públicos que expõem os metatags de um material. O leitor de PDF
 * (`/materiais/[id]/viewer`) também é casco guardado por um dia, com o título
 * do material na aba: sai do cache junto com a página do catálogo.
 */
export function materialMetadataPaths(material: MaterialLike | null | undefined): string[] {
  const paths: string[] = []
  const id = toId(material?._id)
  if (id) paths.push(`/materiais/${id}`, `/materiais/${id}/viewer`)
  const deckSlug = toId(material?.linkedDeckSlug)
  if (deckSlug) paths.push(`/flashcards/d/${deckSlug}`)
  return paths
}

/** Caminhos públicos que expõem os metatags de um pacote. */
export function packageMetadataPaths(packageId: unknown): string[] {
  const id = toId(packageId)
  return id ? [`/pacotes/${id}`] : []
}

/**
 * Caminho público da patologia (`/manual-clinico/[slug]`, guardado por um dia).
 * Recebe os slugs de antes e de depois: renomear muda o slug, e os dois
 * endereços precisam sair do cache.
 */
export function patologiaMetadataPaths(...slugs: unknown[]): string[] {
  return Array.from(new Set(slugs.map(toId).filter(Boolean))).map((slug) => `/manual-clinico/${slug}`)
}

/** Caminho da aula (`/aulas/[id]`), cujo título no <head> vem do banco. */
export function aulaMetadataPaths(aulaId: unknown): string[] {
  const id = toId(aulaId)
  return id ? [`/aulas/${id}`] : []
}

/**
 * Revalida os caminhos informados. Uma falha aqui não pode derrubar a escrita
 * que já foi persistida — no pior caso o metatag continua servindo o cache
 * antigo até o `revalidate` natural da rota.
 */
export function revalidateMetadataPaths(paths: string[]): void {
  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch (error) {
      console.error(`Falha ao revalidar ${path}:`, error)
    }
  }
}
