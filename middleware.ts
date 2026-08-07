import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import {
  ADMIN_GATE_COOKIE,
  ADMIN_GATE_ERROR_CODE,
  ADMIN_GATE_PAGE,
  adminGateCookieOptions,
  issueAdminGateToken,
  requiresAdminGate,
  shouldRefreshAdminGate,
  verifyAdminGateToken,
} from '@/lib/admin-gate'

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/politica-de-privacidade',
  '/termos-de-servico',
  '/buy',
  '/comprar',
  '/ativar',
  '/materiais',
  '/materiais/checkout',
  '/api/materiais/cart/preview',
  // Validação de cupom no checkout de visitante (Serial Key). A rota trata
  // convidado internamente e revalida no checkout autoritativo.
  '/api/coupons/validate',
  '/flashcards',
  '/ldpg-mnclinico',
  '/prescricao-real-no-sus',
  '/ecorj-ebook',
  // Landing page dos Cadernos de APG servida direto do public/ (bundle
  // autocontido). A dinâmica interna (seleção de período, ?periodo=) e o
  // preço/avaliações são preenchidos pelas rotas públicas /api/materiais/[id]
  // e /api/reviews. Visitante sem login precisa abrir sem redirect.
  '/apg',
  // Amostra pública: 10 questões comentadas + 1 patologia, sem login. A rota da
  // API valida rate limit por IP internamente.
  '/amostra',
  '/api/amostra',
  '/manual-clinico',
  '/manual-clinico/farmacologia',
  // Manual de Tomografia: a página é pública para exibir a vitrine de vendas a
  // quem não assina; o atlas em si é privativo e quem decide é o handler
  // /api/manual-clinico/tomografia. As séries (/tomografia/<slug>) entram pela
  // regex em isPublicRoute, com a mesma lógica.
  '/manual-clinico/tomografia',
  // Manual do Eletrocardiograma: página pública que exibe o paywall a visitantes;
  // o acesso ao simulador é validado no handler /api/manual-clinico/eletrocardiograma.
  '/manual-clinico/eletrocardiograma',
  // Manual da Histologia: público *por obrigação de licença*. O acervo é
  // CC BY-NC-SA e a cláusula NãoComercial impede colocá-lo atrás de login ou
  // assinatura. As subrotas entram pela regex em isPublicRoute; quem decide se
  // o módulo existe é o portão em lib/histologia/licenca.ts, não o middleware.
  '/manual-clinico/histologia',
  // Landing page lê settings publicamente (videoEmbedUrl, landingPageEnabled,
  // etc). A própria rota faz checagem de admin internamente para PUT.
  '/api/admin/settings',
  '/api/display-settings',
  // Loja física: listagem de produtos e config pública de entrega são leitura
  // pública (o catálogo aparece na página pública /materiais). As mutações em
  // /api/loja/produtos e /api/loja/settings validam admin internamente.
  '/api/loja/produtos',
  '/api/loja/settings/public',
  // Avaliações (prova social) são leitura pública nas páginas de material,
  // deck e pacote — visitantes precisam ver as notas e comentários. A rota
  // GET não exige login; POST/PATCH/DELETE continuam validando a sessão
  // internamente no handler (retornam 401 para quem não está logado).
  '/api/reviews',
  // Vitrine agregada de avaliações (todos os materiais/decks visíveis) que
  // alimenta a esteira de prova social da landing. Só GET, sem dado de sessão.
  '/api/reviews/showcase',
  // Depoimentos em vídeo da landing (prova social) — precisam aparecer para
  // visitante deslogado. Só GET é exposto por essa rota; o CRUD de admin vive
  // em /api/admin/testimonials, que já exige sessão de admin internamente.
  '/api/testimonials',
]

// Prefixos públicos
const publicPrefixes = [
  '/lead/',
  '/api/auth/',
  '/api/webhooks/mercadopago',
  '/api/payments/public-key',
  '/api/payments/orders',
  // Compra avulsa com Serial Key (funciona sem login). As rotas validam
  // internamente (rate limit, token, sessão para ativar).
  '/api/serial-keys/checkout',
  '/api/serial-keys/purchase',
  '/api/serial-keys/activate',
  '/compra/aprovada',
  '/compra',
  '/api/plans',
  '/api/anuncios',
  '/api/cron/',
  '/api/leads/',
  '/api/study-playlists',
  '/api/stripe/', // stubs 410 — detectar tráfego residual; remover após 2026-08-09
  '/api/pricing-events/', // estado público do lote dinâmico
  '/rifas',
  '/rifas/',
  '/api/raffles', // listagem e checkout públicos (rotas validam visibilidade internamente)
  '/api/raffles/',
  '/_next/',
  '/img/',
  '/favicon',
]

// Rotas que exigem role admin. `/admin` (a home do painel) precisa entrar
// explicitamente: `'/admin'.startsWith('/admin/')` é false, e sem isso a home
// do painel só era protegida pela checagem no cliente.
const adminPrefixes = ['/admin/', '/api/admin/']

function isPublicRoute(pathname: string): boolean {
  if (publicRoutes.includes(pathname)) return true
  if (/^\/materiais\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  // Viewer do PDF e suas rotas de acesso/página ficam públicos para permitir
  // prévia a visitante (sem login). As próprias rotas internamente exigem que
  // o admin tenha liberado uma prévia — sem isso, seguem retornando 403 — e
  // aplicam rate limit agressivo por IP para essa nova superfície sem conta.
  if (/^\/materiais\/[a-fA-F0-9]{24}\/viewer$/.test(pathname)) return true
  if (/^\/api\/materiais\/[a-fA-F0-9]{24}\/pdf-viewer\/access$/.test(pathname)) return true
  if (/^\/api\/materiais\/[a-fA-F0-9]{24}\/pdf-viewer\/page$/.test(pathname)) return true
  if (/^\/pacotes\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  // Formulários públicos: a página e o GET/submit são acessíveis sem login por
  // padrão. Formulários com "Exigir Login" ou "Entregar Material" validam a
  // sessão internamente (page + /api/forms/[id]/submit) e retornam o portão de
  // login ou 401 LOGIN_REQUIRED quando necessário.
  if (/^\/forms\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/forms\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/forms\/[a-fA-F0-9]{24}\/submit$/.test(pathname)) return true
  // Loja física: página do produto e leitura de um produto (público).
  if (/^\/loja\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/loja\/produtos\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/flashcards\/d\/[^/]+$/.test(pathname)) return true
  // Mapas mentais compartilhados (público/não listado/com senha) podem ser
  // abertos por visitantes via link. As rotas validam o acesso internamente.
  if (/^\/mapa-mental\/[^/]+$/.test(pathname)) return true
  if (/^\/api\/mindmaps\/[^/]+$/.test(pathname)) return true
  if (/^\/api\/mindmaps\/[^/]+\/unlock$/.test(pathname)) return true
  // Séries do Manual de Tomografia (/manual-clinico/tomografia/<slug>).
  if (/^\/manual-clinico\/tomografia\/[a-z0-9-]+$/.test(pathname)) return true

  // Todo o Manual da Histologia — inclusive o currículo, que tem até seis
  // segmentos de profundidade — e as rotas de dados que ele consome.
  if (/^\/manual-clinico\/histologia(\/[a-z0-9-]+)*$/.test(pathname)) return true
  if (/^\/api\/manual-clinico\/histologia\//.test(pathname)) return true
  if (/^\/api\/mindmaps\/[^/]+\/version$/.test(pathname)) return true
  if (
    pathname === '/api/mindmaps' ||
    pathname === '/api/materiais' ||
    pathname === '/api/materiais/folders' ||
    pathname === '/api/materiais/packages' ||
    pathname === '/api/flashcards/manual/store' ||
    pathname === '/api/flashcards/manual/folders' ||
    pathname === '/api/manual-clinico' ||
    pathname === '/api/manual-clinico/product' ||
    pathname === '/api/manual-clinico/eletrocardiograma' ||
    pathname === '/api/manual-clinico/tomografia' ||
    pathname === '/api/farmacologia'
  ) return true
  if (/^\/api\/materiais\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/materiais\/packages\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  // Avaliações agregadas de um pacote (prova social pública para visitantes).
  if (/^\/api\/materiais\/packages\/[a-fA-F0-9]{24}\/reviews$/.test(pathname)) return true
  if (/^\/api\/flashcards\/manual\/[^/]+$/.test(pathname)) return true
  return publicPrefixes.some(prefix => pathname.startsWith(prefix))
}

function isAdminRoute(pathname: string): boolean {
  if (pathname === '/admin' || pathname === '/api/admin') return true
  return adminPrefixes.some(prefix => pathname.startsWith(prefix))
}

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

// Secret para JWT - deve ser o mesmo do auth.ts
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

function isDevAuthBypass(): boolean {
  // Edge-safe: only env checks. Never true in production builds.
  if (process.env.NODE_ENV === 'production') return false
  const flag = process.env.DEV_BYPASS_AUTH
  return flag === 'true' || flag === '1'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Skip para assets estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/img/') ||
    // Service worker da PWA (public/sw.js). Precisa ser servido como JS puro;
    // sem isso o middleware trataria como rota protegida e redirecionaria o
    // visitante sem cookie para /auth/login, quebrando o registro do worker.
    pathname === '/sw.js' ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt') ||
    pathname.endsWith('.webmanifest') ||
    // Worker do pdf.js (public/pdf.worker.min.mjs). Sem isso, o middleware
    // tratava o worker como rota protegida e redirecionava visitante (sem
    // cookie) para /auth/login — o browser recebia HTML no lugar do módulo
    // JS e o viewer quebrava com erro de MIME type para quem não tem login.
    pathname.endsWith('.mjs') ||
    pathname.endsWith('.wasm')
  ) {
    return response
  }

  // ══════════ Portão de licença do Manual da Histologia ══════════
  //
  // O bloqueio vive aqui, e não só no layout da rota, por uma razão concreta:
  // as páginas do módulo são pré-renderizadas, e `notFound()` dentro de uma
  // página estática faz o servidor devolver **200** com o corpo do not-found.
  // Verificado em `next start`. Para um portão jurídico isso não serve — 200 é
  // convite à indexação. O middleware roda antes do roteamento e devolve um 404
  // de verdade.
  //
  // O layout mantém o `notFound()` como segunda barreira, para o caso de alguém
  // acrescentar uma rota fora do padrão de caminho tratado aqui.
  //
  // Ver docs/adr/0001-licenca-manual-histologia.md.
  if (
    (pathname === '/manual-clinico/histologia' ||
      pathname.startsWith('/manual-clinico/histologia/') ||
      pathname.startsWith('/api/manual-clinico/histologia/')) &&
    !histologiaHabilitada()
  ) {
    return new NextResponse(null, {
      status: 404,
      headers: { 'X-Robots-Tag': 'noindex, nofollow' },
    })
  }

  // Checkout de item único do catálogo, visitante: /comprar é quem vende sem
  // conta. A página já fazia esse desvio, mas só depois de montar e consultar
  // /api/auth/me — o visitante via o checkout errado piscar antes de ser levado
  // ao certo. Resolvido aqui, antes de qualquer byte de HTML sair.
  // O carrinho (?cart=1) NÃO entra: ele trata visitante na própria página, com
  // formulário de comprador, e continua público.
  if (
    pathname === '/materiais/checkout' &&
    !isDevAuthBypass() &&
    !request.cookies.get('auth-token')?.value
  ) {
    const params = request.nextUrl.searchParams
    const id = params.get('id')
    const type = params.get('type')
    if (params.get('cart') !== '1' && id && type) {
      const comprarUrl = new URL('/comprar', request.url)
      // Aqui não dá para separar flashcard de material — isso depende do
      // documento, que o Edge não consulta. Mandar 'material' é seguro:
      // resolveSerialKeyProduct reclassifica pelo próprio item
      // (materialType === 'flashcard_deck' ou linkedDeckSlug), ignorando o
      // productType que vem do cliente.
      comprarUrl.searchParams.set('productType', type === 'package' ? 'package' : 'material')
      comprarUrl.searchParams.set('productId', id)
      comprarUrl.searchParams.set('itemType', type)
      return withNoIndex(NextResponse.redirect(comprarUrl))
    }
  }

  // Rotas públicas: permitir acesso sem autenticação.
  // Exceção: algumas entradas da lista pública são públicas só na leitura
  // (ex.: GET /api/admin/settings alimenta a landing, GET /api/display-settings,
  // GET /api/loja/produtos). A escrita nelas é administrativa e precisa passar
  // pela autenticação e pelo código do painel logo abaixo.
  const isWriteMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  if (isPublicRoute(pathname) && !(isWriteMethod && requiresAdminGate(pathname, request.method))) {
    return response
  }

  // ── Local UI testing without login ────────────────────────────
  // .env.local → DEV_BYPASS_AUTH=true  (ignored when NODE_ENV=production)
  // Injects mock user headers so pages/APIs that read x-user-* still work.
  if (isDevAuthBypass()) {
    response.headers.set('x-user-id', '000000000000000000000001')
    response.headers.set('x-user-role', 'admin')
    response.headers.set('x-dev-bypass-auth', '1')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // API routes retornam 401
    if (pathname.startsWith('/api/')) {
      return withNoIndex(NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      ))
    }
    // Checkout do Manual sem login → manda pra compra sem login (/comprar), que
    // vende o Manual por Serial Key (nome/email/telefone), em vez de obrigar a
    // criar conta. Preserva o plano escolhido (?plan= → ?planKey=).
    if (pathname === '/manual-clinico/checkout') {
      const comprarUrl = new URL('/comprar', request.url)
      comprarUrl.searchParams.set('productType', 'manual_clinico')
      const plan = request.nextUrl.searchParams.get('plan')
      if (plan) comprarUrl.searchParams.set('planKey', plan)
      return withNoIndex(NextResponse.redirect(comprarUrl))
    }
    // Plano Plus+ sem login → mesma ideia: /comprar vende o plano por Serial
    // Key. Sem isto o visitante batia no login, que é justamente o passo que a
    // compra sem conta existe para evitar.
    if (pathname === '/buy/checkout') {
      const comprarUrl = new URL('/comprar', request.url)
      comprarUrl.searchParams.set('productType', 'plus')
      const plan = request.nextUrl.searchParams.get('plan')
      if (plan) comprarUrl.searchParams.set('productId', plan)
      return withNoIndex(NextResponse.redirect(comprarUrl))
    }
    // Demais páginas protegidas redirecionam para login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    return withNoIndex(NextResponse.redirect(loginUrl))
  }

  // Verificar JWT na Edge (leve, sem consulta ao DB)
  try {
    const { payload } = await jwtVerify(token, secret)

    // Verificar rotas admin
    if (isAdminRoute(pathname)) {
      if (payload.role !== 'admin') {
        if (pathname.startsWith('/api/')) {
          return withNoIndex(NextResponse.json(
            { error: 'Acesso negado' },
            { status: 403 }
          ))
        }
        return withNoIndex(NextResponse.redirect(new URL('/dashboard', request.url)))
      }
    }

    // Segunda camada: código de segurança do painel.
    // Só é cobrado de quem já é admin — usuário comum nunca vê essa tela, e as
    // rotas adjacentes seguem funcionando normalmente para ele.
    if (payload.role === 'admin' && requiresAdminGate(pathname, request.method)) {
      const gate = await verifyAdminGateToken(
        request.cookies.get(ADMIN_GATE_COOKIE)?.value,
        { userId: payload.userId as string, sessionJti: (payload.jti as string) || '' }
      )

      if (!gate.valid) {
        if (pathname.startsWith('/api/')) {
          const res = withNoIndex(NextResponse.json(
            {
              error: 'Código de segurança do painel obrigatório',
              code: ADMIN_GATE_ERROR_CODE,
            },
            { status: 403 }
          ))
          res.cookies.delete(ADMIN_GATE_COOKIE)
          return res
        }
        const gateUrl = new URL(ADMIN_GATE_PAGE, request.url)
        gateUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
        const res = withNoIndex(NextResponse.redirect(gateUrl))
        res.cookies.delete(ADMIN_GATE_COOKIE)
        return res
      }

      // Renovação deslizante: enquanto o painel estiver em uso o código não é
      // pedido de novo; parado além da janela de inatividade, tranca sozinho.
      if (shouldRefreshAdminGate(gate.payload)) {
        const renewed = await issueAdminGateToken({
          userId: payload.userId as string,
          sessionJti: (payload.jti as string) || '',
          absoluteExpiresAt: gate.payload.abs,
        })
        response.cookies.set(
          ADMIN_GATE_COOKIE,
          renewed.token,
          adminGateCookieOptions(renewed.expiresAt - Math.floor(Date.now() / 1000))
        )
      }
    }

    // Adicionar dados do usuário nos headers para uso nos server components
    response.headers.set('x-user-id', payload.userId as string)
    response.headers.set('x-user-role', payload.role as string)
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')

    return response
  } catch {
    // Token inválido ou expirado
    if (pathname.startsWith('/api/')) {
      // API routes: retornar 401 JSON em vez de redirecionar (evita 404)
      const res = withNoIndex(NextResponse.json(
        { error: 'Token expirado ou inválido' },
        { status: 401 }
      ))
      res.cookies.delete('auth-token')
      res.cookies.delete(ADMIN_GATE_COOKIE)
      return res
    }
    // Pages: redirecionar para login preservando a URL de retorno
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    const res = withNoIndex(NextResponse.redirect(loginUrl))
    res.cookies.delete('auth-token')
    res.cookies.delete(ADMIN_GATE_COOKIE)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.jpg
     * - public folder files (img/)
     * - landing pages served directly from public/
     * - séries de imagens do Manual de Tomografia (TC_*): são centenas de
     *   requisições de imagem por série, e passar cada uma pelo middleware só
     *   adicionaria latência a um asset estático já público.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.jpg|img/|TC_ABDOME/|TC_CRANIO/|TC_TORAX/|logo_manual_tomografia|ldpg-mnclinico).*)',
  ],
}
