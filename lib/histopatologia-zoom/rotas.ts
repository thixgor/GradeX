/**
 * Rotas da Histopatologia com Zoom. Sem dependências, para servir ao cliente.
 *
 * Hierarquia: catálogo → doença → lâmina (→ comparação com o normal).
 */
export const BASE_PATOZOOM = '/manual-clinico/histologia/histopatologia/zoom'

export function rotaDaDoencaZoom(doenca: string): string {
  return `${BASE_PATOZOOM}/${doenca}`
}

export function rotaDaLaminaPatologica(doenca: string, slug: string): string {
  return `${BASE_PATOZOOM}/${doenca}/${slug}`
}

export function rotaDaComparacao(doenca: string, slug: string, normal?: string): string {
  return `${BASE_PATOZOOM}/${doenca}/${slug}/comparar${normal ? `?normal=${encodeURIComponent(normal)}` : ''}`
}
