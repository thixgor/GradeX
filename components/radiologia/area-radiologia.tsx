'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { PaywallTomografia } from '@/components/tomografia/paywall'
import { useAcessoTomografia } from '@/components/tomografia/use-acesso'

export function AreaRadiologia({ children }: { children: ReactNode }) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ConteudoProtegido>{children}</ConteudoProtegido>
    </AppShell>
  )
}

function ConteudoProtegido({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoTomografia()
  const pronto = carregado && !carregandoShell

  if (!pronto) {
    return (
      <div className="surface-page flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (dados?.access?.hasFullAccess !== true) {
    return (
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <PaywallTomografia
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={!!user}
            planos={dados?.product?.plans || []}
            precoAvulso={dados?.product?.currentPrice ?? 0}
            produtoAtivo={dados?.product?.isActive !== false}
            resumo={dados?.resumo}
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
