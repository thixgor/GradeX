import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Rotas públicas (não precisam de autenticação)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/politica-de-privacidade',
  '/termos-de-servico',
  '/buy',
]

// Prefixos públicos
const publicPrefixes = [
  '/lead/',
  '/api/auth/',
  '/api/webhooks/mercadopago',
  '/api/payments/public-key',
  '/api/donations/checkout',
  '/api/cron/',
  '/api/leads/',
  '/api/study-playlists',
  '/api/stripe/', // stubs 410 — detectar tráfego residual; remover após 2026-08-09
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
  return publicPrefixes.some(prefix => pathname.startsWith(prefix))
}

function isAdminRoute(pathname: string): boolean {
  return adminPrefixes.some(prefix => pathname.startsWith(prefix))
}

// Secret para JWT - deve ser o mesmo do auth.ts
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this'
)

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
    pathname.endsWith('.svg')
  ) {
    return response
  }

  // Rotas públicas: permitir acesso sem autenticação
  if (isPublicRoute(pathname)) {
    return response
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // API routes retornam 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }
    // Pages redirecionam para login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verificar JWT na Edge (leve, sem consulta ao DB)
  try {
    const { payload } = await jwtVerify(token, secret)

    // Verificar rotas admin
    if (isAdminRoute(pathname)) {
      if (payload.role !== 'admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Acesso negado' },
            { status: 403 }
          )
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Adicionar dados do usuário nos headers para uso nos server components
    response.headers.set('x-user-id', payload.userId as string)
    response.headers.set('x-user-role', payload.role as string)

    return response
  } catch {
    // Token inválido ou expirado
    if (pathname.startsWith('/api/')) {
      // API routes: retornar 401 JSON em vez de redirecionar (evita 404)
      const res = NextResponse.json(
        { error: 'Token expirado ou inválido' },
        { status: 401 }
      )
      res.cookies.delete('auth-token')
      return res
    }
    // Pages: redirecionar para login preservando a URL de retorno
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(loginUrl)
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
     */
    '/((?!_next/static|_next/image|favicon\\.ico|favicon\\.jpg|img/).*)',
  ],
}
