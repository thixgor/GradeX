'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calculator,
  Loader2,
  Search,
  Sigma,
  Sparkles,
  AlertTriangle,
  Star,
  X,
} from 'lucide-react'
import {
  CATEGORIAS,
  CATEGORIA_POR_ID,
  TOTAL_FERRAMENTAS,
  buscar,
  carregarTodas,
  type Ferramenta,
} from '@/lib/ferramentas-clinicas'
import { ICONES, ICONE_PADRAO, tema } from '@/components/ferramentas-clinicas/tema'
import { useFavoritos } from '@/components/ferramentas-clinicas/use-favoritos'

export default function FerramentasClinicasPage() {
  return (
    <AppShell allowGuest showHeader={false} guestNotice={false}>
      <Conteudo />
    </AppShell>
  )
}

function Conteudo() {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [todas, setTodas] = useState<Ferramenta[] | null>(null)
  const [carregando, setCarregando] = useState(false)
  const { favoritos, pronto: favoritosProntos } = useFavoritos()

  // O catálogo completo só é baixado quando a busca começa a valer a pena.
  // Antes disso, a página inicial não custa nenhum dos 15 chunks de conteúdo.
  useEffect(() => {
    if (busca.trim().length < 2 || todas || carregando) return
    setCarregando(true)
    carregarTodas()
      .then(setTodas)
      .finally(() => setCarregando(false))
  }, [busca, todas, carregando])

  const resultados = useMemo(() => (todas ? buscar(todas, busca) : []), [todas, busca])
  const buscando = busca.trim().length >= 2

  return (
    <div className="surface-page min-h-screen">
      {/* ══════════════════════════ HERO ══════════════════════════ */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-muted/30" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.2]"
          aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            color: 'rgb(148 163 184 / 0.16)',
            maskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 65% at 50% 0%, black, transparent)',
          }}
        />

        {/* `pt-16` no celular: os botões flutuantes do AppShell ocupam os 52px
            do topo quando o cabeçalho da casca está oculto, e sem essa folga o
            botão de voltar fica embaixo do botão de menu. */}
        <div className="container relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pt-8">
          <button
            onClick={() => router.push('/manual-clinico')}
            className="-m-2 mb-4 inline-flex items-center gap-1.5 rounded-lg p-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao Manual Clínico
          </button>

          <div className="max-w-3xl">
            <p className="editorial-mark mb-3">Manual Clínico · Calculadoras e escores</p>
            <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              Ferramentas Clínicas
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {TOTAL_FERRAMENTAS} calculadoras e escores que respondem em tempo real, com a conta aberta. Cada
              uma traz a fórmula, a interpretação do resultado, o fundamento fisiológico por trás dela, as
              armadilhas que fazem o número mentir e a referência de onde veio.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                {TOTAL_FERRAMENTAS} ferramentas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <Calculator className="h-3.5 w-3.5 text-primary" /> {CATEGORIAS.length} áreas
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <Sigma className="h-3.5 w-3.5 text-primary" /> Fórmula visível
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5 text-primary" /> Referenciadas
              </span>
              {favoritosProntos && favoritos.length > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" /> {favoritos.length} favorita{favoritos.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="mt-6 max-w-xl">
              <div className="group relative flex items-center overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors focus-within:border-primary/50">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-primary" />
                <Input
                  placeholder="Buscar (winter, anion gap, CHA2DS2, MELD, Holliday...)"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="h-14 border-0 bg-transparent pl-12 pr-12 text-base ring-0 placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="Buscar ferramenta clínica"
                />
                {busca && (
                  <button
                    onClick={() => setBusca('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-muted p-1 text-muted-foreground transition-colors hover:bg-muted-foreground/20 hover:text-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {buscando ? (
          <ResultadosBusca termo={busca} resultados={resultados} carregando={carregando && !todas} />
        ) : (
          <>
            <Favoritos />
            <Grade />
            <ComoFunciona />
            <Aviso />
          </>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────── Favoritos ────────────────────────── */

/**
 * As ferramentas que a pessoa marcou com a estrela.
 *
 * Some por completo quando não há nenhuma: uma seção vazia com texto
 * explicando o que ela seria só empurra o índice para baixo. A estrela nos
 * painéis é descoberta no uso, que é onde ela faz sentido.
 */
function Favoritos() {
  const { favoritos, pronto, remover, limpar } = useFavoritos()
  const [confirmando, setConfirmando] = useState(false)

  // A confirmação se desarma sozinha: um "Confirmar" pendurado na tela vira
  // armadilha para o toque seguinte.
  useEffect(() => {
    if (!confirmando) return
    const timer = setTimeout(() => setConfirmando(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmando])

  if (!pronto || favoritos.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="editorial-mark mb-2 flex items-center gap-1.5">
            <Star className="h-3 w-3 fill-current text-amber-500" /> Favoritos
          </p>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {favoritos.length} ferramenta{favoritos.length !== 1 ? 's' : ''} à mão
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Salvas neste aparelho, sem precisar de conta. Toque na estrela de qualquer ferramenta para tirar ou
            colocar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!confirmando) return setConfirmando(true)
            limpar()
            setConfirmando(false)
          }}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
            confirmando
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground'
          }`}
        >
          {confirmando ? 'Confirmar e apagar' : 'Limpar favoritos'}
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {favoritos.map((fav, i) => {
          const categoria = CATEGORIA_POR_ID[fav.categoria]
          const t = tema(categoria?.cor ?? 'azul')
          const Icone = ICONES[categoria?.icone ?? 'padrao'] || ICONE_PADRAO
          return (
            <div
              key={fav.id}
              style={{ animationDelay: `${Math.min(i, 9) * 25}ms` }}
              className={`group relative animate-fade-in-up rounded-xl border border-border bg-card p-4 opacity-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.hoverBorder}`}
            >
              {/* O link cobre o cartão inteiro e o botão de remover fica acima
                  dele. Um <button> dentro de um <a> seria HTML inválido. */}
              <Link
                href={`/manual-clinico/ferramentas/${fav.categoria}?f=${fav.id}`}
                prefetch={false}
                className="absolute inset-0 z-10 rounded-xl"
                aria-label={`Abrir ${fav.nome}`}
              />
              <div className="flex items-start gap-3">
                <div className={`shrink-0 rounded-lg border ${t.border} ${t.bg} p-2`}>
                  <Icone className={`h-4 w-4 ${t.text}`} />
                </div>
                <div className="min-w-0 flex-1 pr-7">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h3 className="text-sm font-bold leading-snug">{fav.nome}</h3>
                    {fav.sigla && (
                      <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${t.bg} ${t.text}`}>
                        {fav.sigla}
                      </span>
                    )}
                  </div>
                  {fav.resumo && (
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{fav.resumo}</p>
                  )}
                  <p className="mt-2 text-[11px] font-medium text-muted-foreground/60">{categoria?.nome ?? 'Ferramentas Clínicas'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => remover(fav.id)}
                aria-label={`Remover ${fav.nome} dos favoritos`}
                title="Remover dos favoritos"
                className="absolute right-1.5 top-1.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/40 transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ────────────────────────── Grade de categorias ────────────────────────── */

function Grade() {
  return (
    <section>
      <div className="mb-5">
        <p className="editorial-mark mb-2">Índice</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">Escolha a área</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Uma ferramenta pode aparecer em mais de uma área — o ânion gap serve à gasometria e à nefrologia,
          o SOFA à infectologia e à terapia intensiva.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map((c, i) => {
          const t = tema(c.cor)
          const Icone = ICONES[c.icone] || ICONE_PADRAO
          return (
            <Link
              key={c.id}
              href={`/manual-clinico/ferramentas/${c.id}`}
              prefetch={false}
              style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              className={`group relative flex animate-fade-in-up flex-col overflow-hidden rounded-xl border border-border bg-card p-4 opacity-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${t.hoverBorder}`}
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${t.grad}`} aria-hidden />
              <div className="relative flex items-start gap-3">
                <div className={`shrink-0 rounded-xl border ${t.border} ${t.bg} p-2.5`}>
                  <Icone className={`h-5 w-5 ${t.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold leading-snug">{c.nome}</h3>
                  <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground/80">{c.subtitulo}</p>
                </div>
              </div>
              <p className="relative mt-3 flex-1 text-[12.5px] leading-relaxed text-muted-foreground line-clamp-4">{c.descricao}</p>
              <div className="relative mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/60">
                  {c.total} ferramenta{c.total !== 1 ? 's' : ''}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${t.text}`}>
                  Abrir <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/* ────────────────────────── Busca ────────────────────────── */

function ResultadosBusca({
  termo,
  resultados,
  carregando,
}: {
  termo: string
  resultados: ReturnType<typeof buscar>
  carregando: boolean
}) {
  if (carregando) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando o catálogo…
      </div>
    )
  }
  if (resultados.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Search className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhuma ferramenta para &ldquo;{termo}&rdquo;. Tente o nome do escore, a sigla ou o parâmetro que quer calcular.
        </p>
      </div>
    )
  }
  return (
    <div>
      <p className="mb-5 text-sm text-muted-foreground">
        {resultados.length} ferramenta{resultados.length !== 1 ? 's' : ''} para &ldquo;{termo}&rdquo;
      </p>
      <div className="grid gap-2.5">
        {resultados.map(({ ferramenta }) => {
          const categoria = CATEGORIAS.find((c) => c.id === ferramenta.categorias[0])
          const t = tema(categoria?.cor ?? 'azul')
          const Icone = ICONES[categoria?.icone ?? 'padrao'] || ICONE_PADRAO
          return (
            <Link
              key={ferramenta.id}
              href={`/manual-clinico/ferramentas/${ferramenta.categorias[0]}?f=${ferramenta.id}`}
              prefetch={false}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className={`mt-0.5 shrink-0 rounded-lg ${t.bg} p-2`}>
                <Icone className={`h-4 w-4 ${t.text}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="font-semibold leading-snug transition-colors group-hover:text-primary">{ferramenta.nome}</p>
                  {ferramenta.sigla && (
                    <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${t.bg} ${t.text}`}>{ferramenta.sigla}</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{ferramenta.resumo}</p>
                <p className="mt-1.5 text-[11px] font-medium text-muted-foreground/60">{categoria?.nome}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────── Como funciona ────────────────────────── */

const PASSOS = [
  {
    icon: Calculator,
    t: 'Calcula enquanto você digita',
    d: 'Não há botão de calcular. O resultado responde a cada tecla, o que transforma a ferramenta em algo mais útil do que conferência de conta: dá para perguntar "e se o bicarbonato fosse 12?" e ver a resposta.',
  },
  {
    icon: Sigma,
    t: 'A conta fica aberta',
    d: 'Cada resultado mostra os valores intermediários, não só o número final. A fórmula aparece do lado, em texto — para conferir, para aprender e para reproduzir no papel.',
  },
  {
    icon: AlertTriangle,
    t: 'Diz quando o número mente',
    d: 'Toda ferramenta traz as armadilhas de aplicação: o que invalida o cálculo, qual população não foi estudada, que erro sistemático esperar. É a parte que as calculadoras costumam omitir.',
  },
  {
    icon: BookOpen,
    t: 'Referência para cada uma',
    d: 'O artigo de derivação, a validação relevante e a diretriz vigente. Quando o consenso mudou, o texto conta o que mudou e por quê.',
  },
]

function ComoFunciona() {
  return (
    <section className="mt-12">
      <div className="mb-5">
        <p className="editorial-mark mb-2">Como usar</p>
        <h2 className="font-heading text-xl font-semibold tracking-tight">O que cada ferramenta entrega</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {PASSOS.map((p) => (
          <div key={p.t} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
            <p.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="text-sm font-bold">{p.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Aviso() {
  return (
    <section className="mt-12 border-t border-border pt-8">
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-5">
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Antes de usar qualquer número desta seção</p>
            <p>
              Escores e calculadoras descrevem <strong className="font-semibold text-foreground">probabilidades em populações</strong>,
              não destinos individuais. Um escore de alto risco não condena e um de baixo risco não autoriza a alta —
              os dois entram na decisão ao lado da história, do exame e do contexto.
            </p>
            <p>
              Cada ferramenta foi derivada numa população específica, com um desfecho específico. Aplicá-la fora
              disso muda o significado do resultado, e é por isso que cada uma traz suas armadilhas escritas.
            </p>
            <p>
              Material educacional. Confira sempre a dose na bula, o protocolo do seu serviço e a diretriz vigente
              antes de qualquer conduta.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
