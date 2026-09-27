/**
 * Rotas da Histologia com Zoom. Sem dependências, para servir ao cliente.
 *
 * Hierarquia: catálogo → sistema → lâmina. A URL da lâmina carrega o sistema
 * porque é isso que o aluno lê no link compartilhado ("…/zoom/nervoso/
 * medula-espinal-tionina") — e o QR code impresso continua legível.
 */
export const BASE_ZOOM = '/manual-clinico/histologia/zoom'

export function rotaDoSistema(sistema: string): string {
  return `${BASE_ZOOM}/${sistema}`
}

export function rotaDaLaminaZoom(sistema: string, slug: string): string {
  return `${BASE_ZOOM}/${sistema}/${slug}`
}

export function rotaDoOrgao(sistema: string, orgao: string): string {
  return `${BASE_ZOOM}/${sistema}#${orgao}`
}
