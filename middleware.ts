import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

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
  // Amostra pública: 10 questões comentadas + 1 patologia, sem login. A rota da
  // API valida rate limit por IP internamente.
  '/amostra',
  '/api/amostra',
  '/manual-clinico',
  '/manual-clinico/farmacologia',
  // Manual do Eletrocardiograma: página pública que exibe o paywall a visitantes;
  // o acesso ao simulador é validado no handler /api/manual-clinico/eletrocardiograma.
  '/manual-clinico/eletrocardiograma',
  // Landing page lê settings publicamente (videoEmbedUrl, landingPageEnabled,
  // etc). A própria rota faz checagem de admin internamente para PUT.
  '/api/admin/settings',
  '/api/display-settings',
  '/api/doacoes/settings',
  // Loja física: listagem de produtos e config pública de entrega são leitura
  // pública (o catálogo aparece na página pública /materiais). As mutações em
  // /api/loja/produtos e /api/loja/settings validam admin internamente.
  '/api/loja/produtos',
  '/api/loja/settings/public',
]

// Prefixos públicos
const publicPrefixes = [
  '/lead/',
  '/api/auth/',
  '/api/webhooks/mercadopago',
  '/api/payments/public-key',
  '/api/donations/checkout',
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
  '/doar',
  '/doar/',
]

// Rotas que exigem role admin
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
  // Loja física: página do produto e leitura de um produto (público).
  if (/^\/loja\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/loja\/produtos\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/flashcards\/d\/[^/]+$/.test(pathname)) return true
  // Mapas mentais compartilhados (público/não listado/com senha) podem ser
  // abertos por visitantes via link. As rotas validam o acesso internamente.
  if (/^\/mapa-mental\/[^/]+$/.test(pathname)) return true
  if (/^\/api\/mindmaps\/[^/]+$/.test(pathname)) return true
  if (/^\/api\/mindmaps\/[^/]+\/unlock$/.test(pathname)) return true
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
    pathname === '/api/farmacologia'
  ) return true
  if (/^\/api\/materiais\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/materiais\/packages\/[a-fA-F0-9]{24}$/.test(pathname)) return true
  if (/^\/api\/flashcards\/manual\/[^/]+$/.test(pathname)) return true
  return publicPrefixes.some(prefix => pathname.startsWith(prefix))
}

function isAdminRoute(pathname: string): boolean {
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

  // Rotas públicas: permitir acesso sem autenticação
  if (isPublicRoute(pathname)) {
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
    // Pages redirecionam para login
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
      return res
    }
    // Pages: redirecionar para login preservando a URL de retorno
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
    const res = withNoIndex(NextResponse.redirect(loginUrl))
    res.cookies.delete('auth-token')
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
     */
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.jpg|img/|ldpg-mnclinico).*)',
  ],
}
