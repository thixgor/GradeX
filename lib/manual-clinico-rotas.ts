/**
 * Quais caminhos de `/manual-clinico/...` são a página de uma patologia.
 *
 * Vive fora do `middleware.ts` por dois motivos: o middleware roda no Edge e
 * não é importável por um teste, e esta é uma fronteira de acesso — errar para
 * mais aqui abriria uma seção do Manual a quem não pagou. O teste
 * (`__tests__/manual-clinico/rotas-publicas.test.ts`) prende a lista.
 */

/**
 * Segmentos de `/manual-clinico/...` (e de `/api/manual-clinico/...`) que são
 * seções próprias do Manual, e não slugs de patologia.
 *
 * Cada uma tem o próprio portão — as Ferramentas, a Radiologia e a Histologia
 * decidem dentro dos seus handlers e layouts — e o checkout depende justamente
 * de NÃO ser público: é a ausência dele na lista de rotas abertas que leva o
 * visitante sem conta para `/comprar`, a venda por Serial Key.
 */
export const MANUAL_CLINICO_SECOES = new Set([
  'checkout',
  'eletrocardiograma',
  'exames-laboratoriais',
  'farmacologia',
  'ferramentas',
  'histologia',
  'histopatologia',
  'pdf-watermark',
  'product',
  'radiologia',
  'subscription',
  'tomografia',
])

/**
 * `/manual-clinico/<slug>` (a página) ou `/api/manual-clinico/<slug>` (a rota
 * que a alimenta) — e nada mais fundo do que isso.
 */
export function isManualClinicoPatologia(pathname: string): boolean {
  const match = /^\/(?:api\/)?manual-clinico\/([a-z0-9][a-z0-9-]*)$/.exec(pathname)
  if (!match) return false
  return !MANUAL_CLINICO_SECOES.has(match[1])
}
