'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Botão "Voltar" global do app mobile (iPhone).
 *
 * No iOS instalado na tela de início (standalone) NÃO existe a barra do Safari,
 * então não há botão de voltar nenhum: se a pessoa entra numa página que não
 * tem saída própria, ela fica presa e precisa fechar e reabrir o app. Este
 * componente resolve isso com um único controle presente em todas as páginas.
 *
 * O ponto crítico é o fallback: `router.back()` sozinho não resolve nada quando
 * o app abriu direto naquela página (histórico vazio) — que é justamente o caso
 * em que a pessoa fica travada. Por isso, quando não há histórico (ou quando o
 * voltar não sai do lugar), navegamos para o ancestral real mais próximo da
 * rota atual, caindo em /dashboard como último recurso.
 */

// Rotas estáticas reais do app (geradas a partir de app/**/page.tsx). Usadas
// para escolher um destino de fallback que com certeza existe — subir na URL
// "no chute" pode cair numa rota dinâmica que não tem página (404).
const KNOWN_ROUTES = new Set<string>([
  '/',
  '/admin',
  '/admin/analytics',
  '/admin/anuncios',
  '/admin/aulas',
  '/admin/aulas/criar',
  '/admin/aulas/topicos',
  '/admin/avaliacoes',
  '/admin/banco-questoes',
  '/admin/banco-questoes/extrair',
  '/admin/banco-questoes/hierarquia',
  '/admin/banco-questoes/importar',
  '/admin/banco-questoes/questoes',
  '/admin/banco-questoes/relatos',
  '/admin/coupons',
  '/admin/doacoes',
  '/admin/emails',
  '/admin/equipe',
  '/admin/exams',
  '/admin/exams/create',
  '/admin/farmacologia',
  '/admin/farmacologia/importar',
  '/admin/flashcards/manual',
  '/admin/flashcards/manual/pastas',
  '/admin/flashcards/themes',
  '/admin/forms',
  '/admin/forum-topics',
  '/admin/games',
  '/admin/keys',
  '/admin/leads',
  '/admin/leads/new',
  '/admin/loja',
  '/admin/manual-clinico',
  '/admin/manual-clinico/importar',
  '/admin/manual-clinico/novo',
  '/admin/materiais',
  '/admin/pricing-events',
  '/admin/proctoring',
  '/admin/receita',
  '/admin/rifas',
  '/admin/rifas/new',
  '/admin/settings',
  '/admin/stats',
  '/admin/study-playlists',
  '/admin/tickets',
  '/admin/users',
  '/amostra',
  '/ativar',
  '/aulas',
  '/aulas/gerenciar',
  '/aulas/gerenciar/aulas',
  '/aulas/gerenciar/aulas/criar',
  '/aulas/gerenciar/estrutura',
  '/auth/forgot-password',
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/verify',
  '/banco-questoes',
  '/banco-questoes/historico',
  '/banco-questoes/listas',
  '/buy',
  '/buy/checkout',
  '/compra/aprovada',
  '/comprar',
  '/cronogramas',
  '/cronogramas/criar',
  '/dashboard',
  '/equipe',
  '/exams/create-personal',
  '/flashcards',
  '/flashcards/ia',
  '/forum',
  '/forum/new',
  '/games',
  '/games/crossword',
  '/games/error-hunt',
  '/games/hangman',
  '/loja/checkout',
  '/manual-clinico',
  '/manual-clinico/anatomia-3d',
  '/manual-clinico/checkout',
  '/manual-clinico/eletrocardiograma',
  '/manual-clinico/farmacologia',
  '/mapa-mental',
  '/materiais',
  '/materiais/checkout',
  '/politica-de-privacidade',
  '/profile',
  '/provas',
  '/rifas',
  '/termos-de-servico',
])

const HOME = '/dashboard'

// Contador de telas abertas nesta aba/sessão do app.
const SCREENS_KEY = 'gx:screens'

/**
 * Sobe na hierarquia da URL até achar uma rota que existe de verdade.
 * Ex.: /flashcards/d/algum-slug/editar → /flashcards
 *      /banco-questoes/listas/abc123   → /banco-questoes/listas
 */
function fallbackRouteFor(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  for (let i = segments.length - 1; i > 0; i--) {
    const candidate = '/' + segments.slice(0, i).join('/')
    if (KNOWN_ROUTES.has(candidate)) return candidate
  }
  return HOME
}

// iPhone/iPad — no iOS 13+ o iPad se anuncia como "MacIntel" com toque.
function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPod|iPad/.test(ua)) return true
  return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1
}

/**
 * Páginas onde o botão não deve aparecer — todas já têm uma saída própria (ou
 * não deveriam ter uma saída acidental) bem no canto onde o nosso ficaria:
 *  - landing e dashboard: são o destino do "voltar", não a origem;
 *  - prova em andamento: sair sem querer no meio de uma prova (com proctoring)
 *    é pior do que o problema que estamos resolvendo — a tela já tem sua
 *    própria saída controlada;
 *  - leitor de PDF: já tem um "Voltar" dedicado na barra fixa do rodapé;
 *  - deck de flashcards em estudo: barra inferior própria ocupa a tela toda;
 *  - editor de mapa mental: tela cheia com gestos de toque (pan/zoom) e um
 *    "Voltar" próprio no canto — nosso botão só atrapalharia o gesto.
 */
function isHiddenRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/dashboard') return true
  if (/^\/exam\/[^/]+$/.test(pathname)) return true
  if (pathname.includes('/viewer')) return true
  if (/^\/flashcards\/d\/[^/]+$/.test(pathname)) return true
  if (/^\/mapa-mental\/[^/]+$/.test(pathname)) return true
  return false
}

export function MobileBackButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [isIos, setIsIos] = useState(false)
  // Profundidade da entrada atual DENTRO do app. `history.length` não serve:
  // ele conta entradas de outros sites (e até o about:blank de uma aba nova),
  // então voltar por ele pode jogar a pessoa para fora do app. Carimbamos a
  // profundidade no próprio `history.state`, que sobrevive a reload e à
  // restauração de sessão do PWA e volta correta ao navegar para trás.
  const depth = useRef(0)
  const stampedOnce = useRef(false)
  // Quantas telas o app já tinha aberto nesta aba ANTES desta montagem. Cobre a
  // recarga completa de página (que zera o carimbo acima mas não apaga o
  // histórico real do navegador).
  const priorScreens = useRef(0)

  useEffect(() => {
    setIsIos(isIosDevice())
  }, [])

  useEffect(() => {
    const state = window.history.state as (Record<string, unknown> & { __gxDepth?: number }) | null
    // Entrada já carimbada = chegamos aqui por voltar/avançar; só reaproveita.
    if (state && typeof state.__gxDepth === 'number') {
      depth.current = state.__gxDepth
      return
    }
    const next = stampedOnce.current ? depth.current + 1 : 0
    if (!stampedOnce.current) {
      try {
        priorScreens.current = Number(sessionStorage.getItem(SCREENS_KEY)) || 0
      } catch {
        priorScreens.current = 0
      }
    }
    stampedOnce.current = true
    depth.current = next
    try {
      // Espalha o state existente para preservar os campos internos do Next.
      window.history.replaceState({ ...(state || {}), __gxDepth: next }, '')
    } catch {
      /* alguns navegadores limitam replaceState; o fallback abaixo cobre */
    }
    try {
      sessionStorage.setItem(SCREENS_KEY, String(priorScreens.current + next + 1))
    } catch {
      /* modo privado antigo do iOS pode bloquear — não é crítico */
    }
  }, [pathname])

  const goBack = useCallback(() => {
    const from = window.location.pathname
    const fallback = fallbackRouteFor(from)

    // Sem nenhuma entrada anterior dentro do app (abriu direto nesta página,
    // que é exatamente quando a pessoa fica presa): voltar não existe, então
    // levamos para a seção de onde a página faz parte.
    if (depth.current <= 0 && priorScreens.current <= 0) {
      router.push(fallback)
      return
    }

    router.back()
    // Rede de segurança: se o voltar não saiu do lugar (entrada repetida,
    // histórico truncado pela restauração do PWA), ainda assim tiramos a
    // pessoa da tela — é para isso que este botão existe.
    window.setTimeout(() => {
      if (window.location.pathname === from) router.push(fallback)
    }, 600)
  }, [router])

  if (!isIos) return null
  if (!pathname || isHiddenRoute(pathname)) return null

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Voltar"
      // Círculo discreto no canto inferior esquerdo — mesma linguagem visual
      // do FAB de ações (canto inferior direito), então os dois convivem sem
      // se atropelar. Nunca fica "pendurado" no meio do conteúdo: um ícone
      // pequeno inteiramente dentro da tela, sem texto, sem cortar borda.
      // O deslocamento soma a safe-area (indicador de home) e, quando
      // presente, a altura do banner de instalação do PWA — para nunca ficar
      // tampado por ele. `bottom` (não padding) para não espremer o ícone
      // dentro da altura fixa do círculo.
      style={{
        bottom:
          'calc(1.25rem + env(safe-area-inset-bottom) + var(--gx-install-prompt-h, 0px))',
      }}
      className={cn(
        'fixed left-4 z-30 lg:hidden',
        'flex h-11 w-11 items-center justify-center rounded-full',
        'border border-border/70 bg-card/90 backdrop-blur-xl',
        'text-foreground/80 shadow-lg shadow-black/10 dark:shadow-black/40',
        'transition-[bottom,transform] duration-200 ease-out active:scale-90',
      )}
    >
      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
