'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FlaskConical, Loader2 } from 'lucide-react'

import { AppShell, useAppShell } from '@/components/app-shell'
import {
  AvisoJaTenho,
  BarraDoPacote,
  FaixaDoPacote,
  FechamentoDoPacote,
  GradeDoPacote,
  OfertaDoPacote,
  PerguntasDoPacote,
  CartaoDoPacote,
} from '@/components/manual-clinico/pacote'
import { HeroiDoModulo } from '@/components/manual-clinico/casco/heroi-do-modulo'
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
        <div className="container mx-auto max-w-6xl px-4 pb-8">
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
      <div className="container mx-auto max-w-5xl px-4 pb-10 pt-6">
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


  return (
    <>
      {/* O herói é o mesmo de todas as portas do Manual (HeroiDoModulo). */}
      <HeroiDoModulo
        porta="exames"
        titulo={<>Leia o laudo entendendo o porquê de cada número.</>}
        promessa={
          alvo ? (
            <>
              <strong className="font-semibold" style={{ color: 'var(--ck-texto)' }}>{alvo}</strong> faz parte dos
              Exames Laboratoriais — desbloqueie e você cai direto nele.
            </>
          ) : (
            <>
              A IL-6 eleva a hepcidina, a hepcidina tranca o ferro no macrófago — e é por isso que a ferritina sobe
              enquanto o ferro cai. Cada marcador explicado assim, da doença até o número.
            </>
          )
        }
        numeros={
          resumo
            ? [
                { v: resumo.marcadores, r: 'marcadores com ficha' },
                { v: resumo.padroes, r: 'padrões de laudo' },
                { v: resumo.cadeias, r: 'cadeias causais' },
              ]
            : []
        }
        acoes={
          <>
            <button onClick={onCheckout} className="ck-cta">
              Quero os {TOTAL_DE_MODULOS} manuais
            </button>
            <a href="#acervo" className="ck-botao">Ver o que tem dentro</a>
          </>
        }
      >
        <FaixaDoPacote atual="exames" className="mt-2" />
      </HeroiDoModulo>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-8">
        <div id="acervo" className="ck-escopo scroll-mt-24 space-y-6">
          <AvisoJaTenho />

          <div className="grid gap-3 sm:grid-cols-2">
            {RECURSOS.map((f) => (
              <div key={f.t} className="ck-vidro p-4">
                <FlaskConical className="mb-2 h-5 w-5" style={{ color: 'var(--ck-verde)' }} />
                <p className="text-sm font-bold" style={{ color: 'var(--ck-texto)' }}>{f.t}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>{f.d}</p>
              </div>
            ))}
          </div>

          {resumo && (
            <div className="ck-vidro p-5 sm:p-6">
              <h3 className="font-heading text-base font-semibold tracking-tight" style={{ color: 'var(--ck-texto)' }}>
                {resumo.marcadores} marcadores, {resumo.padroes} padrões e {resumo.cadeias} cadeias causais escritas
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--ck-texto-2)' }}>
                Cada cadeia é o caminho completo entre a doença e o número: o que ela quebra na fisiologia, o que muda na
                célula e por que o valor se move naquela direção.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {resumo.paineis.slice(0, 12).map((p) => (
                  <li key={p.id} className="ck-chip" data-tom="neutro">
                    <span>{p.nome}</span>
                    <span className="tabular-nums" style={{ color: 'var(--ck-texto-3)' }}>{p.total}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-20">
          <CartaoDoPacote
            atual="exames"
            titulo={<>Os Exames Laboratoriais são 1 dos {TOTAL_DE_MODULOS} manuais</>}
            onCheckout={onCheckout}
            isAuthenticated={isAuthenticated}
          />
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
