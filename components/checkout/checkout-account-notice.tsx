'use client'

import { AlertTriangle, Mail, UserCheck } from 'lucide-react'
import { useAuthUser } from '@/hooks/use-auth-user'

/**
 * Diz, no checkout, para QUAL conta o material vai.
 *
 * Existem dois caminhos de compra no site — o checkout logado, que vincula o
 * acesso à conta da sessão, e /comprar, que vende sem conta e manda a Serial Key
 * por e-mail. Sem essa indicação, quem tem mais de uma conta (ou está logado
 * numa e comprando pensando na outra) só descobre o destino depois de pagar.
 *
 * `variant="account"` — checkout logado: mostra nome e e-mail da sessão.
 * `variant="serial-key"` — /comprar: o destino é o e-mail digitado no formulário,
 * e quem já está logado é avisado de que essa compra NÃO cai direto na conta.
 */

const BOX = 'rounded-2xl border p-3.5 text-sm'

export function CheckoutAccountNotice({
  variant = 'account',
  tone = 'light',
  className = '',
}: {
  variant?: 'account' | 'serial-key'
  /** `dark` para os checkouts de fundo escuro (Manual Clínico). */
  tone?: 'light' | 'dark'
  className?: string
}) {
  const { user, loading } = useAuthUser()

  const skin = tone === 'dark'
    ? {
        box: 'border-white/10 bg-white/[0.06] text-white',
        muted: 'text-white/55',
        strong: 'text-white',
        icon: 'text-emerald-300',
        warnBox: 'border-amber-300/30 bg-amber-300/10 text-amber-100',
        warnIcon: 'text-amber-300',
        link: 'text-emerald-300 hover:text-emerald-200',
      }
    : {
        box: 'border-border bg-muted/40 text-foreground',
        muted: 'text-muted-foreground',
        strong: 'text-foreground',
        icon: 'text-emerald-600 dark:text-emerald-400',
        warnBox: 'border-amber-500/30 bg-amber-400/10 text-foreground',
        warnIcon: 'text-amber-600 dark:text-amber-400',
        link: 'text-primary hover:underline',
      }

  if (loading) {
    return <div className={`${BOX} ${skin.box} h-[62px] animate-pulse ${className}`} aria-hidden />
  }

  // ── /comprar: o acesso segue para o e-mail digitado, não para uma conta ──
  if (variant === 'serial-key') {
    if (user) {
      // Já está logado e mesmo assim caiu na compra sem conta (link salvo,
      // botão de voltar). Avisar é melhor do que redirecionar por conta própria
      // e jogar fora um formulário que ele talvez já tenha preenchido.
      return (
        <div className={`${BOX} ${skin.warnBox} ${className}`}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${skin.warnIcon}`} />
            <div className="min-w-0">
              <p className="font-bold">Esta compra não vai direto para a sua conta</p>
              <p className={`mt-1 text-xs leading-relaxed ${skin.muted}`}>
                Você está logado como <strong className={skin.strong}>{user.email}</strong>, mas esta é a
                compra sem conta: a Serial Key chega por e-mail e você ativa depois. Para o acesso já entrar
                na conta, use o checkout normal.
              </p>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className={`${BOX} ${skin.box} ${className}`}>
        <div className="flex items-start gap-2.5">
          <Mail className={`mt-0.5 h-4 w-4 shrink-0 ${skin.icon}`} />
          <div className="min-w-0">
            <p className="font-bold">O acesso vai para o e-mail que você digitar</p>
            <p className={`mt-1 text-xs leading-relaxed ${skin.muted}`}>
              A Serial Key é enviada para esse endereço — confira antes de pagar. Não é preciso criar conta
              agora; dá para ativar quando quiser.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Checkout logado ──
  if (!user) return null

  return (
    <div className={`${BOX} ${skin.box} ${className}`}>
      <div className="flex items-start gap-2.5">
        <UserCheck className={`mt-0.5 h-4 w-4 shrink-0 ${skin.icon}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wider ${skin.muted}`}>
            O acesso vai para esta conta
          </p>
          <p className={`mt-0.5 truncate font-bold ${skin.strong}`}>{user.name || user.email}</p>
          {user.name ? <p className={`truncate text-xs ${skin.muted}`}>{user.email}</p> : null}
          <a
            href={`/auth/login?redirect=${encodeURIComponent(
              typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search
            )}`}
            className={`mt-1.5 inline-block text-xs font-semibold ${skin.link}`}
          >
            Não é esta conta? Entrar com outra
          </a>
        </div>
      </div>
    </div>
  )
}

export default CheckoutAccountNotice
