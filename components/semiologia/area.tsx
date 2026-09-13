'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, Lock, Ruler, Stethoscope, Waves } from 'lucide-react'
import { AppShell, useAppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { RodapeDeCreditos } from './creditos'
import { useAcessoSemiologia } from './use-acesso'

/**
 * Portão único do Manual de Semiologia.
 *
 * Toda a árvore `/manual-clinico/semiologia` passa por aqui — home, sinais,
 * beira-leito, ultrassom e comparadores. Quem não tem acesso vê sempre a mesma
 * vitrine, e não uma página de vendas diferente por rota: foi exatamente o
 * problema que o pacote único veio resolver (ver `lib/manual-clinico/pacote.ts`).
 */
export function AreaSemiologia({ children, alvo }: { children: ReactNode; alvo?: string | null }) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ConteudoProtegido alvo={alvo}>{children}</ConteudoProtegido>
    </AppShell>
  )
}

function ConteudoProtegido({ children, alvo }: { children: ReactNode; alvo?: string | null }) {
  const router = useRouter()
  const { user, loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoSemiologia()
  const pronto = carregado && !carregandoShell

  if (!pronto) return <Esqueleto />

  if (dados?.access?.hasFullAccess !== true) {
    return (
      <div className="surface-page min-h-screen">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <Vitrine
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={!!user}
            resumo={dados?.resumo}
            alvo={alvo}
          />
        </div>
      </div>
    )
  }

  // O crédito das fontes licenciadas sai daqui, e não de cada página: as duas
  // autorizações pedem atribuição permanente e explicitamente NÃO repetitiva.
  // Uma vez por rota, no rodapé da seção, é exatamente o que elas descrevem.
  return (
    <>
      {children}
      <RodapeDeCreditos />
    </>
  )
}

function Vitrine({
  onCheckout,
  isAuthenticated,
  resumo,
  alvo,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
  resumo?: {
    sinais: number
    vistas: number
    cenas: number
    estruturas: number
    janelas: number
    comparadores: number
    titulosVistas: string[]
    titulosJanelas: string[]
    titulosSinais: string[]
  }
  alvo?: string | null
}) {
  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manual Clínico</p>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Manual de Semiologia</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          O exame que você faz com a própria mão — e o que se vê pelo otoscópio, pelo oftalmoscópio e pela sonda à
          beira do leito. Sinal por sinal, com o mecanismo escrito, o que muda na conduta e onde ele engana.
        </p>
        {alvo && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Você tentou abrir <span className="font-medium text-foreground">{alvo}</span>.
          </p>
        )}
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icone: Stethoscope, titulo: 'Sinais do exame físico', valor: resumo?.sinais, rotulo: 'fichas aprofundadas' },
          { icone: Eye, titulo: 'Imagem à beira do leito', valor: resumo?.cenas, rotulo: 'cenas normais e alteradas' },
          { icone: Waves, titulo: 'Ultrassom', valor: resumo?.janelas, rotulo: 'janelas de POCUS' },
        ].map(({ icone: Icone, titulo, valor, rotulo }) => (
          <div key={titulo} className="rounded-xl border border-border bg-card p-5">
            <Icone className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <p className="mt-3 text-2xl font-bold">{valor ?? '—'}</p>
            <p className="text-xs text-muted-foreground">{rotulo}</p>
            <p className="mt-2 text-sm font-medium">{titulo}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          O que está dentro
        </h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          {[
            { titulo: 'Sinais', itens: resumo?.titulosSinais },
            { titulo: 'Beira-leito', itens: resumo?.titulosVistas },
            { titulo: 'Ultrassom', itens: resumo?.titulosJanelas },
          ].map(({ titulo, itens }) => (
            <div key={titulo}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {(itens ?? []).slice(0, 8).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          Os comparadores respondem a pergunta que o livro não responde: não &ldquo;o que é edema&rdquo;, mas{' '}
          <strong className="text-foreground">qual edema é qual</strong> — renal, hepático, cardíaco, venoso e
          linfático lado a lado, eixo por eixo. São {resumo?.comparadores ?? '—'} no acervo.
        </p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={onCheckout} size="lg" className="gap-2">
          Liberar o Manual Clínico completo
          <ArrowRight className="h-4 w-4" />
        </Button>
        {!isAuthenticated && (
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/login">Já tenho conta</Link>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        O Manual de Semiologia faz parte do mesmo acesso que libera patologias, exames laboratoriais, farmacologia,
        eletrocardiograma, radiologia, histologia, anatomia e as ferramentas clínicas. Não é vendido à parte.
      </p>
    </div>
  )
}

/** Molde com a silhueta do que vai aparecer, para o layout não saltar. */
function Esqueleto() {
  return (
    <div className="surface-page min-h-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o Manual de Semiologia…</span>
      <div className="container mx-auto max-w-5xl px-4 py-10">
        <div className="h-3 w-36 rounded bg-muted" />
        <div className="mt-5 h-8 w-72 rounded bg-muted" />
        <div className="mt-4 h-3.5 w-full max-w-xl rounded bg-muted/70" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="aspect-square w-full bg-muted/60" />
              <div className="space-y-2 p-4">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
