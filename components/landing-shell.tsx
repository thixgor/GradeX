import LandingPage from '@/components/landing-page'
import type { PrecoDoPlus } from '@/lib/landing/preco-do-plus'

/**
 * A landing, servida por duas rotas: `/` (HTML estático, do cache de borda) e
 * a prévia dinâmica usada quando a landing está desligada no painel.
 *
 * Ela não baixa mais fontes próprias (eram Space Grotesk, Inter e JetBrains
 * Mono): usa as da marca, que o layout raiz já carrega — Newsreader e Source
 * Sans, as mesmas das telas de entrar e do app (ver
 * components/landing/landing-vidro.css). Três arquivos a menos no caminho da
 * primeira pintura da página mais visitada.
 *
 * `initialIsLoggedIn` fica sempre falso: o HTML é o mesmo para todo mundo (é o
 * que permite servi-lo do CDN) e quem está logado é revelado no cliente, pelo
 * `/api/auth/me` que a landing já consultava em toda visita — o cookie de
 * sessão é SameSite=strict e não acompanha uma navegação vinda de fora.
 */
export function LandingShell({ precoPlus = null }: { precoPlus?: PrecoDoPlus | null } = {}) {
  return <LandingPage precoPlus={precoPlus} />
}
