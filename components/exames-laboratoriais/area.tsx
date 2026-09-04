'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Crown, FlaskConical, Loader2, ShieldCheck } from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
} from '@/components/manual-clinico/pacote'
import { TOTAL_DE_MODULOS } from '@/lib/manual-clinico/pacote'
import { usePricingEventState } from '@/components/pricing-events/usePricingEventState'
import type { ResumoDosExames } from '@/app/api/manual-clinico/exames-laboratoriais/route'

/**
 * Portão único da central de Exames Laboratoriais.
 *
 * Toda a árvore `/manual-clinico/exames-laboratoriais` passa por aqui — home,
 * fichas de marcador, painéis, sistemas, padrões, comparações e o Laboratório
 * Virtual. Quem não tem acesso vê sempre a mesma vitrine, e não uma tela
 * diferente por rota.
 *
 * O conteúdo protegido chega como `children` já renderizado no servidor. Isso
 * merece uma ressalva honesta: no App Router, a árvore da página é prop de um
 * componente de cliente, então ela viaja no payload RSC mesmo quando este
 * componente escolhe não exibi-la. Para conteúdo comercialmente sensível, o
 * portão precisa estar na página (como a Histologia faz, via `redirect()`).
 * Aqui a decisão é outra e deliberada: as páginas passam apenas o índice leve e
 * o conteúdo que já é público pelo catálogo da API; o texto profundo de cada
 * ficha só é montado na rota do marcador, que faz a própria verificação no
 * servidor antes de renderizar.
 */
export function AreaDosExames({ children, alvo }: { children: ReactNode; alvo?: string | null }) {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <ConteudoProtegido alvo={alvo}>{children}</ConteudoProtegido>
    </AppShell>
  )
}

export interface PlanoResumo {
  key: string
  label?: string
  price: number
  enabled: boolean
  durationMonths?: number | null
  pricingEventId?: string | null
}

export interface AcessoExames {
  isAuthenticated: boolean
  access: { hasFullAccess: boolean; reason: string; includedPlan: string | null }
  product: {
    isActive: boolean
    currentPrice: number
    price: number
    plans?: PlanoResumo[]
    pricingEventId?: string | null
  }
  resumo?: ResumoDosExames
}

/**
 * Estado de acesso à seção.
 *
 * Quem decide é o servidor: a rota consulta compra ativa, plano Plus+ e admin.
 * Aqui chega só o veredito, e todas as telas da seção compartilham este hook
 * para que a regra não se duplique em lugares que podem discordar.
 */
export function useAcessoExames() {
  const [dados, setDados] = useState<AcessoExames | null>(null)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    let vivo = true
    fetch('/api/manual-clinico/exames-laboratoriais')
      .then((r) => r.json())
      .then((d) => {
        if (!vivo) return
        setDados(d)
        setCarregado(true)
      })
      .catch(() => {
        if (vivo) setCarregado(true)
      })
    return () => {
      vivo = false
    }
  }, [])

  return { dados, carregado }
}

function ConteudoProtegido({ children, alvo }: { children: ReactNode; alvo?: string | null }) {
  const router = useRouter()
  const { loading: carregandoShell } = useAppShell()
  const { dados, carregado } = useAcessoExames()
  const pronto = carregado && !carregandoShell

  if (!pronto) return <EsqueletoDoLaudo />

  if (dados?.access?.hasFullAccess !== true) {
    return (
      <div className="lab lab-superficie min-h-screen">
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto max-w-6xl px-4 pb-4 pt-16 sm:pt-6">
            <button
              onClick={() => router.push('/manual-clinico')}
              className="-m-2 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
            </button>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <VitrineDosExames
            onCheckout={() => router.push('/manual-clinico/checkout')}
            isAuthenticated={dados?.isAuthenticated ?? false}
            planos={dados?.product?.plans ?? []}
            precoAvulso={dados?.product?.currentPrice ?? dados?.product?.price ?? 0}
            produtoAtivo={dados?.product?.isActive ?? false}
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
 * Molde da folha enquanto o veredito de acesso chega.
 *
 * Tem a silhueta do que vai aparecer — cabeçalho de laudo, linhas de resultado
 * e coluna de referência — para que o layout não salte quando o conteúdo
 * entrar. Um spinner centralizado diria menos e faria a espera parecer maior.
 */
function EsqueletoDoLaudo() {
  return (
    <div className="lab lab-superficie min-h-screen" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando os Exames Laboratoriais…</span>
      <div className="container mx-auto max-w-5xl px-4 pb-10 pt-20 sm:pt-10">
        <div className="h-3 w-32 rounded bg-muted" />
        <div className="mt-4 h-8 w-64 rounded bg-muted sm:h-10 sm:w-96" />
        <div className="mt-3 h-3 w-full max-w-xl rounded bg-muted/70" />
        <div className="mt-8 lab-folha">
          <div className="lab-cabecalho">
            <div className="h-2.5 w-28 rounded bg-muted" />
            <div className="mt-3 h-4 w-48 rounded bg-muted" />
          </div>
          <div className="space-y-3 p-5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="h-3 w-40 rounded bg-muted/80" />
                <div className="h-3 w-16 rounded bg-muted/60" />
                <div className="hidden h-3 w-24 rounded bg-muted/40 sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════ Vitrine ═══════════════════════════ */

const RECURSOS = [
  {
    t: 'Cada marcador com a cadeia inteira',
    d: 'Fisiologia, o que o exame mede, por que sobe, por que cai — e, em cada causa, o caminho escrito de doença → mecanismo → alteração do número.',
  },
  {
    t: 'Diferenciais lado a lado',
    d: 'Ferritina alta é sobrecarga ou inflamação? Microcitose é ferro ou talassemia? Tabelas comparativas com a leitura do que separa uma coluna da outra.',
  },
  {
    t: 'Padrões laboratoriais',
    d: 'Hepatocelular, colestático, hemólise, cetoacidose, SIADH, lesão renal aguda — cada um com o mecanismo que produz aquele conjunto e as armadilhas que o imitam.',
  },
  {
    t: 'Laboratório Virtual',
    d: 'Gere exames fictícios por doença ou por painel, com contexto clínico. Modo desafio: você interpreta primeiro e só depois vê a resposta comentada.',
  },
]

export function VitrineDosExames({
  onCheckout,
  isAuthenticated,
  planos,
  precoAvulso,
  produtoAtivo,
  resumo,
  alvo,
}: {
  onCheckout: () => void
  isAuthenticated: boolean
  planos: PlanoResumo[]
  precoAvulso: number
  produtoAtivo: boolean
  resumo?: ResumoDosExames
  alvo?: string | null
}) {
  const habilitados = planos.filter((p) => p.enabled && p.price > 0)
  const maisBarato = habilitados.reduce<PlanoResumo | null>((min, p) => (min == null || p.price < min.price ? p : min), null)
  const precoBase = maisBarato?.price ?? precoAvulso ?? 0
  const eventoId = maisBarato?.pricingEventId ?? null
  const { state: evento } = usePricingEventState(eventoId)

  const pctLote = evento?.activeTier?.discountPercent || 0
  const temLote = !!evento?.activeTier && evento?.isActive !== false && pctLote > 0 && precoBase > 0
  const precoFinal = temLote ? Math.max(0, Math.round(precoBase * (1 - pctLote / 100) * 100) / 100) : precoBase
  const mostrarPreco = produtoAtivo && precoBase > 0

  const vantagens = [
    'Acesso imediato após o pagamento',
    `${resumo?.marcadores ?? 100}+ marcadores com ficha completa`,
    `Os outros ${TOTAL_DE_MODULOS - 1} manuais vêm juntos, sem custo extra`,
    'Nenhuma seção é vendida à parte',
    ...(isAuthenticated ? [] : ['Sem conta? A Serial Key vai por e-mail']),
  ]

  return (
    <>
      {alvo && (
        <p className="mb-5 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Você tentou abrir <span className="font-semibold text-foreground">{alvo}</span>. Esta parte da central é
          privativa — desbloqueie abaixo e você cai direto nela.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <FaixaDoPacote atual="exames" />
          <AvisoJaTenho />

          <div>
            <p className="lab-rubrica">DomineAqui Lab</p>
            <h1 className="mt-1.5 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Uma central de interpretação laboratorial — não uma tabela de valores de referência
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              O objetivo não é você decorar que a ferritina sobe na inflamação. É você entender que a IL-6 eleva a
              hepcidina, que a hepcidina tranca o ferro dentro do macrófago, e que é por isso que a ferritina sobe
              enquanto o ferro sérico cai. Toda a seção é construída assim.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {RECURSOS.map((f) => (
              <div key={f.t} className="rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:border-primary/30">
                <FlaskConical className="mb-2 h-5 w-5 text-primary" />
                <p className="text-sm font-bold">{f.t}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>

          {resumo && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <h3 className="font-heading text-base font-semibold tracking-tight">
                {resumo.marcadores} marcadores, {resumo.padroes} padrões e {resumo.cadeias} cadeias causais escritas
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Cada cadeia é o caminho completo entre a doença e o número: o que ela quebra na fisiologia, o que muda na
                célula e por que o valor se move naquela direção.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {resumo.paineis.slice(0, 12).map((p) => (
                  <li key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs">
                    <span className="font-medium">{p.nome}</span>
                    <span className="font-mono text-[11px] font-bold text-primary">{p.total}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">O que a compra abre</p>
            <h3 className="mt-1.5 font-heading text-lg font-semibold leading-snug tracking-tight">
              Os Exames Laboratoriais são 1 dos {TOTAL_DE_MODULOS} manuais
            </h3>
            <ul className="mt-4 space-y-1.5">
              {vantagens.map((t) => (
                <li key={t} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {t}
                </li>
              ))}
            </ul>
            <button
              onClick={onCheckout}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              {isAuthenticated ? 'Desbloquear o Manual Clínico' : 'Comprar e desbloquear'}
              <ArrowRight className="h-4 w-4" />
            </button>
            <p className="mt-3 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Pix, cartão ou boleto · pagamento processado com
              segurança.
            </p>
          </div>
        </div>
      </div>

      <GradeDoPacote atual="exames" className="mt-14" />

      <OfertaDoPacote
        className="mt-10"
        onCheckout={onCheckout}
        isAuthenticated={isAuthenticated}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        pctLote={pctLote}
        rotuloLote={evento?.activeTier?.label ?? null}
        rotuloPlano={maisBarato?.label ?? null}
        mesesDoPlano={maisBarato?.durationMonths ?? null}
        mostrarPreco={mostrarPreco}
      />

      <PerguntasDoPacote className="mt-14" />

      <FechamentoDoPacote className="mt-10 mb-28 lg:mb-0" onCheckout={onCheckout} precoFinal={precoFinal} mostrarPreco={mostrarPreco} />

      <BarraDoPacote
        onCheckout={onCheckout}
        precoBase={precoBase}
        precoFinal={precoFinal}
        temLote={temLote}
        pctLote={pctLote}
        mesesDoPlano={maisBarato?.durationMonths ?? null}
        mostrarPreco={mostrarPreco}
      />
    </>
  )
}

/** Cabeçalho compartilhado por todas as telas internas da seção. */
export function CabecalhoDaSecao({
  titulo,
  subtitulo,
  voltar = '/manual-clinico/exames-laboratoriais',
  rotuloVoltar = 'Voltar à central',
  acoes,
}: {
  titulo: string
  subtitulo?: string
  voltar?: string
  rotuloVoltar?: string
  acoes?: ReactNode
}) {
  const router = useRouter()
  return (
    <div className="border-b border-border bg-muted/25">
      <div className="container mx-auto max-w-5xl px-4 pb-6 pt-16 sm:pt-6">
        <button
          onClick={() => router.push(voltar)}
          className="-m-2 mb-3 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {rotuloVoltar}
        </button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="lab-rubrica">DomineAqui Lab</p>
            <h1 className="mt-1 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{titulo}</h1>
            {subtitulo && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitulo}</p>}
          </div>
          {acoes}
        </div>
      </div>
    </div>
  )
}

/** Spinner usado nas ilhas de cliente que carregam sob demanda. */
export function Carregando() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  )
}
