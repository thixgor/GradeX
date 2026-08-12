'use client'

import { useEffect, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Check,
  Chrome,
  Download,
  Flame,
  Monitor,
  Smartphone,
  Apple,
  PartyPopper,
} from 'lucide-react'
import { useInstalarApp } from '@/hooks/use-instalar-app'
import {
  ehAndroid,
  ehAparelhoSamsung,
  ehIos,
  instrucoesDe,
  type PlataformaInstalacao,
} from '@/lib/pwa/instalacao'
import { cn } from '@/lib/utils'

/** Abas do passo a passo. Cobrem 99% de quem abre esta página no Brasil. */
const ABAS: Array<{
  id: PlataformaInstalacao
  rotulo: string
  icone: typeof Chrome
}> = [
  { id: 'android-samsung', rotulo: 'Samsung Internet', icone: Smartphone },
  { id: 'android-chromium', rotulo: 'Chrome (Android)', icone: Chrome },
  { id: 'android-firefox', rotulo: 'Firefox (Android)', icone: Flame },
  { id: 'ios-safari', rotulo: 'iPhone e iPad', icone: Apple },
  { id: 'desktop', rotulo: 'Computador', icone: Monitor },
]

/** Qual aba abre por padrão, dado o aparelho de quem chegou. */
function abaInicial(plataforma: PlataformaInstalacao): PlataformaInstalacao {
  if (plataforma === 'android-outro') return 'android-chromium'
  if (plataforma === 'ios-outro-navegador') return 'ios-safari'
  if (ABAS.some((aba) => aba.id === plataforma)) return plataforma
  return 'android-samsung'
}

export function InstalarApp({ urlDaPagina }: { urlDaPagina: string }) {
  const { pronto, plataforma, podeInstalarAgora, jaInstalado, instalar } =
    useInstalarApp()
  const [aba, setAba] = useState<PlataformaInstalacao>('android-samsung')
  const [tocouNaAba, setTocouNaAba] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [recusou, setRecusou] = useState(false)
  const [ehSamsung, setEhSamsung] = useState(false)

  // Enquanto a pessoa não escolher uma aba, ela acompanha o aparelho detectado.
  useEffect(() => {
    if (!pronto || tocouNaAba) return
    setAba(abaInicial(plataforma))
  }, [pronto, plataforma, tocouNaAba])

  useEffect(() => {
    setEhSamsung(ehAparelhoSamsung(navigator.userAgent || ''))
  }, [])

  const instrucoes = useMemo(() => instrucoesDe(aba), [aba])

  const aoInstalar = async () => {
    setOcupado(true)
    const resultado = await instalar()
    setOcupado(false)
    if (resultado === 'recusado') setRecusou(true)
  }

  const nomeDoAparelho = ehSamsung
    ? 'no seu Samsung'
    : ehAndroid(plataforma)
      ? 'no seu Android'
      : ehIos(plataforma)
        ? 'no seu iPhone'
        : 'no seu celular'

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* ── Chamada principal ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card/60 p-6 text-center backdrop-blur-sm sm:p-10">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
          Grátis · sem app store
        </span>

        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
          O DomineAqui {pronto ? nomeDoAparelho : 'no seu celular'}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Instale a plataforma como app: ícone na tela de início, abertura em
          tela cheia e atalhos para Provas, Questões, Flashcards e Cronograma no
          toque longo. Ocupa menos de 1 MB.
        </p>

        {jaInstalado ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <PartyPopper className="h-4 w-4" />
            Pronto — você já está usando o app instalado.
          </p>
        ) : podeInstalarAgora ? (
          <div className="mt-6">
            <button
              type="button"
              onClick={aoInstalar}
              disabled={ocupado}
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-primary-foreground shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              <Download className="h-4 w-4" strokeWidth={2.6} />
              {ocupado ? 'Abrindo…' : 'Instalar agora'}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              {recusou
                ? 'Sem problema — o passo a passo abaixo instala do mesmo jeito.'
                : 'Um toque. O próprio sistema confirma a instalação.'}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-xs text-muted-foreground">
            {pronto
              ? 'Siga o passo a passo do seu navegador, logo abaixo.'
              : 'Detectando seu aparelho…'}
          </p>
        )}
      </section>

      {/* ── Passo a passo por navegador ───────────────────────────────── */}
      <section className="mt-8">
        <h2 className="text-lg font-bold">Passo a passo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha o navegador que você usa. Se estiver num Samsung, quase sempre
          é o Samsung Internet.
        </p>

        <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {ABAS.map(({ id, rotulo, icone: Icone }) => {
            const ativa = aba === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setAba(id)
                  setTocouNaAba(true)
                }}
                aria-pressed={ativa}
                className={cn(
                  'inline-flex h-9 flex-shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition',
                  ativa
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                <Icone className="h-3.5 w-3.5" />
                {rotulo}
              </button>
            )
          })}
        </div>

        <ol className="mt-4 space-y-3 rounded-2xl border border-border bg-card/60 p-5">
          {instrucoes.passos.map((passo, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-foreground/90">
                {passo}
              </span>
            </li>
          ))}
          {instrucoes.alternativa && (
            <li className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
              {instrucoes.alternativa}
            </li>
          )}
        </ol>
      </section>

      {/* ── QR para saltar do computador para o celular ───────────────── */}
      {pronto && plataforma === 'desktop' && (
        <section className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 p-6 text-center sm:flex-row sm:text-left">
          <div className="rounded-xl bg-white p-3">
            <QRCodeSVG value={urlDaPagina} size={116} level="M" />
          </div>
          <div>
            <h2 className="text-base font-bold">Instalar no celular</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Aponte a câmera do seu Samsung (ou iPhone) para o código. Esta
              mesma página abre no celular, já com o passo a passo do aparelho.
            </p>
          </div>
        </section>
      )}

      {/* ── O que muda ao instalar ────────────────────────────────────── */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          'Ícone na tela de início, igual a qualquer outro app.',
          'Abre em tela cheia, sem a barra de endereço roubando espaço.',
          'Toque longo no ícone: Provas, Questões, Flashcards e Cronograma.',
          'Atualiza sozinho — nunca existe "versão velha" para baixar.',
        ].map((item) => (
          <div
            key={item}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-card/40 p-4"
          >
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" strokeWidth={3} />
            <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
