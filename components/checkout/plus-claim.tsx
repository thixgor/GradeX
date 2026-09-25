'use client'

import Link from 'next/link'
import { Crown, LogIn } from 'lucide-react'
import { PLUS_LABEL } from '@/lib/account-tier'

/**
 * Resgate pelo Plus+ dentro dos checkouts.
 *
 * O Plus+ inclui o acervo de materiais e pacotes, mas o acesso só existe
 * depois do resgate (POST /api/materiais/resgatar — ver o comentário da rota).
 * Quem é assinante e cai num checkout não deveria nem ver o formulário de
 * pagamento: o servidor recusa a cobrança de qualquer forma, e a pessoa ficava
 * presa entre um "pagar" que não passa e um item que ela não sabia que podia
 * levar de graça.
 */

export type PlusClaimItemType = 'material' | 'package'

export interface PlusClaimResult {
  ok: boolean
  message: string
  /** A recusa pede assinar/renovar (assinatura vencida ou área fora do plano). */
  requiresUpgrade?: boolean
}

/** Chama a rota de resgate e traduz a resposta para a tela. */
export async function resgatarComPlus(itemType: PlusClaimItemType, itemId: string): Promise<PlusClaimResult> {
  try {
    const res = await fetch('/api/materiais/resgatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemType, itemId }),
    })
    const data = await res.json().catch(() => ({} as any))
    if (!res.ok) {
      return {
        ok: false,
        message: data?.error || 'Não foi possível resgatar agora. Tente novamente.',
        requiresUpgrade: Boolean(data?.requiresPlus || data?.requiresUpgrade),
      }
    }
    return { ok: true, message: data?.message || `Resgatado com o ${PLUS_LABEL}.` }
  } catch {
    return { ok: false, message: 'Não foi possível resgatar agora. Verifique sua conexão e tente novamente.' }
  }
}

/**
 * Compra sem login (/comprar e o carrinho de visitante): o e-mail digitado é
 * de uma conta Plus+ que tem o item incluso. Avisa antes do pagamento e leva
 * para o login, voltando direto ao checkout — que, logado, vira a tela de
 * resgate.
 *
 * Não trava a compra: a compra avulsa é vitalícia, e o resgate vale enquanto a
 * assinatura valer. Quem quiser o item para sempre ainda pode pagar.
 */
export function PlusAccountNotice({
  email,
  loginRedirect,
  itemCount = 1,
  tone = 'light',
  className = '',
}: {
  email: string
  /** Para onde o login devolve — o checkout logado do mesmo item/carrinho. */
  loginRedirect: string
  itemCount?: number
  tone?: 'light' | 'dark'
  className?: string
}) {
  const skin = tone === 'dark'
    ? {
        box: 'border-amber-300/35 bg-amber-300/10 text-white',
        title: 'text-amber-100',
        muted: 'text-white/65',
        strong: 'text-white',
        icon: 'text-amber-300',
        button: 'bg-amber-300 text-amber-950 hover:bg-amber-200',
      }
    : {
        box: 'border-amber-500/35 bg-amber-500/10 text-foreground',
        title: 'text-foreground',
        muted: 'text-muted-foreground',
        strong: 'text-foreground',
        icon: 'text-amber-600 dark:text-amber-400',
        button: 'bg-amber-500 text-amber-950 hover:bg-amber-400',
      }

  const what = itemCount === 1 ? 'Este item já está incluso' : 'Estes itens já estão inclusos'

  return (
    <div className={`rounded-2xl border p-3.5 text-sm ${skin.box} ${className}`} role="status">
      <div className="flex items-start gap-2.5">
        <Crown className={`mt-0.5 h-4 w-4 shrink-0 ${skin.icon}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={`font-bold ${skin.title}`}>Essa conta já é {PLUS_LABEL}</p>
          <p className={`mt-1 text-xs leading-relaxed ${skin.muted}`}>
            {what} na assinatura de <strong className={skin.strong}>{email}</strong>. Não precisa pagar: entre
            na conta e resgate sem custo — o acesso cai na hora em Meus materiais.
          </p>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(loginRedirect)}`}
            className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold transition ${skin.button}`}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Entrar e resgatar com o {PLUS_LABEL}
          </Link>
          <p className={`mt-2 text-[11px] leading-relaxed ${skin.muted}`}>
            Prefere comprar mesmo assim? Pode seguir abaixo: a compra avulsa é sua para sempre, enquanto o
            resgate vale enquanto a assinatura estiver ativa.
          </p>
        </div>
      </div>
    </div>
  )
}
