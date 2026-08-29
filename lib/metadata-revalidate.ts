import { revalidatePath } from 'next/cache'

/**
 * Invalidação das rotas públicas cujo <head> é montado a partir do documento
 * do material/pacote.
 *
 * As páginas de catálogo não são renderizadas por requisição: `/materiais/[id]`
 * e `/flashcards/d/[slug]` declaram `dynamic = 'force-static'` com
 * `revalidate = 3600`, e `/pacotes/[id]` é gerada sob demanda e mantida no Full
 * Route Cache. O `generateMetadata` do layout roda junto com esse HTML, então o
 * preço que aparece na `description` e em `product:price:amount` fica congelado
 * no cache. Sem invalidar explicitamente, uma alteração de preço no
 * /admin/materiais só chega aos metatags na próxima revalidação (até 1h — ou
 * nunca, no caso do pacote), e os crawlers continuam lendo o valor antigo.
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

/** Caminhos públicos que expõem os metatags de um material. */
export function materialMetadataPaths(material: MaterialLike | null | undefined): string[] {
  const paths: string[] = []
  const id = toId(material?._id)
  if (id) paths.push(`/materiais/${id}`)
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
