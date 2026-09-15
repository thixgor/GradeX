/**
 * Regras de ONDE e QUANDO o anúncio aparece.
 *
 * Vivem fora do componente público porque o painel do admin precisa das mesmas
 * respostas para explicar "por que não estou vendo o anúncio?" — a pergunta que
 * a tela não sabia responder. Duas cópias das mesmas regras divergiriam na
 * primeira rota nova, e o diagnóstico passaria a mentir.
 */

/** Chave do "ocultar por 30 minutos" no navegador de quem vê o anúncio. */
export const ANUNCIO_DISMISS_STORAGE_KEY = 'domineaqui-platform-ads-dismissed-until'

/** Quanto tempo o "x" silencia os anúncios. */
export const ANUNCIO_DISMISS_MS = 30 * 60 * 1000

/** Rotas exatas sem anúncio. Fluxo de compra: nada compete com o checkout. */
export const AD_HIDDEN_EXACT_PATHS = new Set(['/buy', '/buy/checkout', '/materiais/checkout'])

/** Prefixos sem anúncio — a rota e tudo abaixo dela. */
export const AD_HIDDEN_PREFIXES = ['/admin', '/auth', '/exam', '/exams', '/forms', '/lead']

/** Lista legível para o painel do admin. */
export const ANUNCIO_ROTAS_SEM_EXIBICAO: Array<{ rota: string; motivo: string }> = [
  { rota: '/admin/*', motivo: 'Painel administrativo — inclusive esta tela' },
  { rota: '/auth/*', motivo: 'Login e cadastro' },
  { rota: '/exams/*, /exam/*', motivo: 'Resolucao de prova' },
  { rota: '/forms/*, /lead/*', motivo: 'Formularios e captacao' },
  { rota: '/buy, /buy/checkout, /materiais/checkout', motivo: 'Fluxo de pagamento' },
  { rota: '*/viewer*', motivo: 'Leitor de PDF' },
  { rota: '/materiais/<id>, /pacotes/<id>', motivo: 'Pagina de venda do proprio material' },
]

function isSingleNestedRoute(pathname: string, basePath: string) {
  if (!pathname.startsWith(`${basePath}/`)) return false

  const rest = pathname.slice(basePath.length + 1)
  return rest.length > 0 && !rest.includes('/')
}

export function shouldHideAdsOnRoute(pathname?: string | null) {
  if (!pathname) return false

  const normalizedPath = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')

  return (
    normalizedPath.includes('/viewer') ||
    AD_HIDDEN_EXACT_PATHS.has(normalizedPath) ||
    AD_HIDDEN_PREFIXES.some(
      (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
    ) ||
    isSingleNestedRoute(normalizedPath, '/materiais') ||
    isSingleNestedRoute(normalizedPath, '/pacotes')
  )
}

/**
 * Até quando os anúncios estão ocultos NESTE navegador (epoch ms), ou 0.
 *
 * Também limpa o registro vencido: um valor no passado só atrapalha quem for
 * ler depois.
 */
export function lerOcultacaoDeAnuncios(): number {
  if (typeof window === 'undefined') return 0

  try {
    const valor = Number(localStorage.getItem(ANUNCIO_DISMISS_STORAGE_KEY) || 0)
    if (!Number.isFinite(valor) || valor <= Date.now()) {
      localStorage.removeItem(ANUNCIO_DISMISS_STORAGE_KEY)
      return 0
    }
    return valor
  } catch {
    // Navegador com armazenamento bloqueado: nada oculto.
    return 0
  }
}

/** Remove a ocultação — o "voltar a ver agora" do painel. */
export function limparOcultacaoDeAnuncios() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(ANUNCIO_DISMISS_STORAGE_KEY)
  } catch {
    // Sem armazenamento não havia ocultação para remover.
  }
}

/**
 * O anúncio passa pela segmentação de período?
 *
 * Sem períodos marcados, vale para todo mundo. Com períodos, só para quem está
 * em um deles — e "não sei o período" (visitante anônimo ou cadastro antigo sem
 * período definido) conta como não. É o filtro que mais explica um anúncio
 * ativo que "sumiu" para o próprio admin.
 */
export function anuncioVisivelParaPeriodo(
  periodos: unknown,
  periodoDoUsuario: number | null,
): boolean {
  const lista = Array.isArray(periodos) ? periodos.filter((p) => typeof p === 'number') : []
  if (lista.length === 0) return true
  return periodoDoUsuario !== null && lista.includes(periodoDoUsuario)
}
