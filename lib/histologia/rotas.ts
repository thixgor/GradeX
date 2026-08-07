/**
 * Construção de rotas do Manual da Histologia.
 *
 * Módulo minúsculo e **sem nenhuma dependência**, de propósito.
 *
 * Estas duas funções são usadas tanto no servidor quanto em componentes de
 * cliente. Se morassem em `seo.ts` — que importa `@/lib/seo`, que por sua vez
 * alcança o driver do MongoDB — cada componente de cliente que quisesse montar
 * uma URL arrastaria o MongoDB para o bundle do navegador. Foi exatamente isso
 * que o primeiro `next build` acusou.
 */

export const BASE = '/manual-clinico/histologia'

export function rotaDaPagina(caminho: string[] | string): string {
  const partes = Array.isArray(caminho) ? caminho.join('/') : caminho
  return `${BASE}/${partes}`
}
