/**
 * Construção de rotas da Histopatologia.
 *
 * Módulo minúsculo e **sem nenhuma dependência**, pela mesma razão que
 * `lib/histologia/rotas.ts`: estas funções são usadas em componentes de cliente
 * e em componentes de servidor. Se morassem em `seo.ts` — que alcança
 * `@/lib/seo` e, por ele, o driver do MongoDB — cada ilha de cliente que
 * montasse uma URL arrastaria o MongoDB para o bundle do navegador.
 */

/** Raiz do Manual da Histologia (normal). A Histopatologia vive dentro dela. */
export const BASE_HISTOLOGIA = '/manual-clinico/histologia'

export const BASE = `${BASE_HISTOLOGIA}/histopatologia`

export function rotaDoAtlas(): string {
  return `${BASE}/atlas`
}

export function rotaDoWebPathUtah(): string {
  return `${BASE}/webpath-utah`
}

export function rotaDoCapituloWebPathUtah(id: string): string {
  return `${rotaDoWebPathUtah()}/${encodeURIComponent(id)}`
}

/** Página de inventário de uma entrada catalogada (não é doença canônica). */
export function rotaDaEntradaCatalogada(id: string): string {
  return `${BASE}/atlas/${encodeURIComponent(id)}`
}

export function rotaDaDoenca(slug: string): string {
  return `${BASE}/doencas/${slug}`
}

export function rotaDoSistema(id: string): string {
  return `${BASE}/sistemas/${id}`
}

export function rotaDosMecanismos(): string {
  return `${BASE}/mecanismos`
}

export function rotaDoMecanismo(id: string): string {
  return `${BASE}/mecanismos/${id}`
}

/**
 * Comparador normal × patológico. O primeiro segmento é sempre o slug da
 * doença; o restante é o caminho da lâmina normal no currículo de Histologia,
 * preservado inteiro para que o comparador saiba abrir os dois lados.
 */
export function rotaDeComparacao(slugDaDoenca: string, caminhoNormal: string[] | string): string {
  const normal = Array.isArray(caminhoNormal) ? caminhoNormal.join('/') : caminhoNormal
  return `${BASE}/comparar/${slugDaDoenca}/${normal}`
}

export function rotaDosCreditos(): string {
  return `${BASE}/creditos`
}

/** Rota de uma página do Manual da Histologia normal. */
export function rotaNormal(caminho: string[] | string): string {
  const partes = Array.isArray(caminho) ? caminho.join('/') : caminho
  return `${BASE_HISTOLOGIA}/${partes}`
}
