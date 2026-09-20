'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell, useAppShell } from '@/components/app-shell'
import { ROTAS } from '@/lib/semiologia/rotas'
import { BuscaGlobal } from './busca-global'
import { RodapeDeCreditos } from './rodape-creditos'
import { useAcessoSemiologia, type PlanoResumo, type ResumoSemiologia } from './use-acesso'
import { VitrineSemiologia } from './vitrine'

/**
 * Portão único do Manual de Semiologia.
 *
 * Toda a árvore `/manual-clinico/semiologia` passa por aqui — home, sinais,
 * beira-leito, ultrassom e comparadores. Quem não tem acesso vê sempre a mesma
 * vitrine, e não uma página de vendas diferente por rota: foi exatamente o
 * problema que o pacote único veio resolver (ver `lib/manual-clinico/pacote.ts`).
 *
 * Aqui só chega quem tem sessão: o visitante sem conta é reescrito pelo
 * middleware para `/manual-clinico/semiologia/vitrine` antes de qualquer
 * página do módulo ser montada. A razão está em `VitrineSozinha`, logo abaixo.
 */
export function AreaSemiologia({
  children,
  alvo,
  busca = true,
}: {
  children: ReactNode
  alvo?: string | null
  /** A barra de busca no topo. A home desliga porque tem a sua própria, no hero. */
  busca?: boolean
}) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ConteudoProtegido alvo={alvo} busca={busca}>
        {children}
      </ConteudoProtegido>
    </AppShell>
  )
}

/**
 * A landing sozinha, sem o conteúdo do módulo atrás dela.
 *
 * É o que `/manual-clinico/semiologia/vitrine` renderiza para quem chega sem
 * sessão, e a diferença para `AreaSemiologia` não é estética: ali o conteúdo
 * das páginas é `children` de um componente de cliente, e **children de
 * componente de cliente são renderizados no servidor e viajam no payload
 * mesmo quando o cliente decide não desenhá-los**. Um portão só no cliente
 * esconde a ficha da tela e a entrega no HTML.
 *
 * Por isso o visitante sem conta é desviado para cá pelo middleware antes de
 * qualquer página do módulo ser montada: aqui não existe `children` para
 * vazar. Quem tem sessão segue pelo caminho normal — o veredito continua
 * sendo do servidor, e o acervo nunca foi pré-renderizado para anônimo.
 */
export function VitrineSozinha({
  alvo,
  resumo,
  planos,
  precoAvulso,
  produtoAtivo,
}: {
  alvo?: string | null
  /** Vem pronto do servidor: a landing nasce com os números, sem piscar molde. */
  resumo?: ResumoSemiologia
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
}) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <div className="surface-page min-h-screen">
        <div className="abaixo-dos-flutuantes container mx-auto max-w-6xl px-4 py-8">
          <VitrineComRota
            alvo={alvo}
            resumo={resumo}
            planos={planos}
            precoAvulso={precoAvulso}
            produtoAtivo={produtoAtivo}
          />
        </div>
      </div>
    </AppShell>
  )
}

/**
 * A vitrine com o botão de compra ligado ao roteador.
 *
 * `isAuthenticated` é falso por construção: só chega aqui quem foi reescrito
 * pelo middleware por **não** ter sessão.
 */
function VitrineComRota(props: {
  alvo?: string | null
  resumo?: ResumoSemiologia
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
}) {
  const router = useRouter()
  return (
    <VitrineSemiologia
      onCheckout={() => router.push('/manual-clinico/checkout')}
      isAuthenticated={false}
      {...props}
    />
  )
}

function ConteudoProtegido({ children, alvo, busca }: { children: ReactNode; alvo?: string | null; busca: boolean }) {
  const { loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoSemiologia()
  const pronto = carregado && !carregandoShell

  if (!pronto) return <Esqueleto />

  if (dados?.access?.hasFullAccess !== true) return <PainelDeVendas alvo={alvo} />

  // O crédito das fontes licenciadas sai daqui, e não de cada página: as duas
  // autorizações pedem atribuição permanente e explicitamente NÃO repetitiva.
  // Uma vez por rota, no rodapé da seção, é exatamente o que elas descrevem.
  return (
    <>
      {busca && <BarraDeBusca />}
      {children}
      <RodapeDeCreditos />
    </>
  )
}

/** A landing propriamente dita, com o veredito e os preços do servidor. */
function PainelDeVendas({ alvo }: { alvo?: string | null }) {
  const router = useRouter()
  const { user } = useAppShell()
  const { dados, carregado } = useAcessoSemiologia()

  if (!carregado) return <Esqueleto />

  return (
    <div className="surface-page min-h-screen">
      {/* `abaixo-dos-flutuantes`: sem cabeçalho, o AppShell solta o botão do
          menu e os toggles de tema em `top-3`. Sem a folga o selo do pacote e
          o H1 nasciam debaixo deles no celular e no tablet. */}
      <div className="abaixo-dos-flutuantes container mx-auto max-w-6xl px-4 py-8">
        <VitrineSemiologia
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

/**
 * A busca em toda rota interna do módulo.
 *
 * Fica acima do conteúdo, e não dentro de cada página, porque é a mesma
 * caixa em todas — e porque o atalho "/" que ela registra só existe onde ela
 * está montada. A home não a usa: lá a busca é o hero.
 */
function BarraDeBusca() {
  return (
    // Abaixo de `lg`, o AppShell sem cabeçalho põe o botão do menu e os
    // toggles de tema flutuando em `top-3`; a barra desce para não ficar
    // debaixo deles. Em desktop, o menu está na lateral e o topo é livre.
    <div className="surface-page border-b border-border/60 pt-16 lg:pt-0">
      <div className="container mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={ROTAS.raiz} className="hidden shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground sm:block">
          Semiologia
        </Link>
        <div className="min-w-0 flex-1 sm:max-w-xl">
          {/* Curto de propósito: o texto longo que estava aqui era cortado no
              meio da palavra em qualquer celular, e a etiqueta "Semiologia" ao
              lado já diz o escopo em tela larga. */}
          <BuscaGlobal placeholder="Buscar sinal, cena ou janela…" />
        </div>
      </div>
    </div>
  )
}

/** Molde com a silhueta do que vai aparecer, para o layout não saltar. */
function Esqueleto() {
  return (
    <div className="surface-page min-h-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando o Manual de Semiologia…</span>
      <div className="abaixo-dos-flutuantes container mx-auto max-w-6xl px-4 py-8">
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
