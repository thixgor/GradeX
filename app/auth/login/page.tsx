import LoginView from './login-view'

/**
 * A tela de entrar é renderizada no servidor, com `?redirect=` e `?mode=` já
 * resolvidos.
 *
 * Antes o componente lia os dois com `useSearchParams()`. Esse hook, numa
 * página sem fronteira de Suspense própria, faz o Next desistir de renderizar
 * a rota no servidor: o HTML entregue era só o spinner de tela cheia do
 * `loading.tsx` da raiz, e o formulário nascia depois — quando o navegador
 * terminasse de baixar e executar o JS da página. Lendo os parâmetros aqui,
 * onde eles são simplesmente um argumento da função, o formulário chega
 * pronto, já no modo certo (entrar ou criar conta).
 *
 * Ler `searchParams` torna a rota dinâmica, e é o que ela precisa ser: o
 * conteúdo depende da query, então não haveria o que guardar em cache.
 */
export const dynamic = 'force-dynamic'

// Só permite redirecionamentos internos (evita open-redirect via ?redirect=).
// Sem um "?redirect=" explícito, o destino padrão é direto o dashboard — ir
// para "/" faria essa rota re-renderizar a landing page por um instante antes
// do desvio para o dashboard, causando um flash visível da landing (com o
// rodapé) logo após o login.
function safeInternalPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/dashboard'
  return target
}

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  return (
    <LoginView
      redirectTo={safeInternalPath(first(searchParams?.redirect))}
      initialMode={first(searchParams?.mode)}
    />
  )
}
