'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { VitrineRadiologia } from '@/components/radiologia/vitrine'
import { useAcessoTomografia } from '@/components/tomografia/use-acesso'

/**
 * Portão único do Manual de Radiologia.
 *
 * Toda a árvore `/manual-clinico/radiologia` passa por aqui — home, atlas de
 * Raio-X, cada incidência, índice da tomografia e cada série. Quem não tem
 * acesso vê sempre a mesma landing de vendas, e não uma vitrine diferente por
 * rota.
 */
export function AreaRadiologia({
  children,
  alvo,
}: {
  children: ReactNode
  /** O que a pessoa tentou abrir, quando veio de um link direto. */
  alvo?: string | null
}) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ConteudoProtegido alvo={alvo}>{children}</ConteudoProtegido>
    </AppShell>
  )
}

function ConteudoProtegido({ children, alvo }: { children: ReactNode; alvo?: string | null }) {
  const router = useRouter()
  const { user, loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoTomografia()
  const pronto = carregado && !carregandoShell

  if (!pronto) return <EsqueletoRadiologia />

  if (dados?.access?.hasFullAccess !== true) {
    return (
      <div className="surface-page min-h-screen">
        <div className="rx-abaixo-flutuantes container mx-auto max-w-6xl px-4 py-8">
          <VitrineRadiologia
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={!!user}
            planos={dados?.product?.plans || []}
            precoAvulso={dados?.product?.currentPrice ?? 0}
            produtoAtivo={dados?.product?.isActive !== false}
            resumo={dados?.resumo}
            alvo={alvo}
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Molde do atlas enquanto o veredito de acesso chega.
 *
 * O spinner centralizado que existia aqui era uma tela preta com uma roda: não
 * dizia o que estava vindo e fazia a espera parecer maior do que é. O molde tem
 * a silhueta do que vai aparecer — cabeçalho de negatoscópio, filme e cartões —
 * então o layout não salta quando o conteúdo entra.
 *
 * Só aparece na primeira visita da sessão: a partir daí o veredito vem do
 * `sessionStorage` e a página nasce pronta (ver `use-acesso`).
 */
function EsqueletoRadiologia() {
  return (
    <div className="rx surface-page min-h-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o Manual de Radiologia…</span>

      <header className="rx-painel rx-grade rx-varredura relative overflow-hidden border-b border-sky-400/15">
        <div className="rx-abaixo-flutuantes container relative mx-auto max-w-6xl px-4 pb-9 pt-8">
          <div className="h-3 w-40 rounded bg-sky-400/10" />
          <div className="mt-5 h-8 w-64 rounded bg-sky-400/15 sm:h-10 sm:w-80" />
          <div className="mt-4 h-3.5 w-full max-w-xl rounded bg-sky-400/10" />
          <div className="mt-2 h-3.5 w-full max-w-md rounded bg-sky-400/10" />
          <div className="mt-6 flex flex-wrap gap-2">
            {[88, 116, 96].map((largura) => (
              <div key={largura} className="h-7 rounded-full bg-sky-400/10" style={{ width: largura }} />
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-9">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                <span aria-hidden className="rx-esqueleto absolute inset-0" />
              </div>
              <div className="space-y-2 p-4">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted/70" />
                <div className="h-3 w-4/5 rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
