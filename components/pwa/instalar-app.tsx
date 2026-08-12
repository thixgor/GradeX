'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import {
  Apple,
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Chrome,
  Copy,
  Download,
  Flame,
  Home,
  Loader2,
  Maximize2,
  Monitor,
  PartyPopper,
  RefreshCw,
  Smartphone,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useFluxoInstalacao } from '@/hooks/use-fluxo-instalacao'
import {
  ABAS,
  BENEFICIOS,
  CHAMADA,
  DUVIDAS,
  ENDERECO_CURTO,
  SELO,
  URL_CURTA,
  ehAbaDoAparelho,
} from '@/lib/pwa/conteudo'
import { ehIos, type PlataformaInstalacao } from '@/lib/pwa/instalacao'
import { cn } from '@/lib/utils'

/* =================== APARÊNCIA =================== */

/**
 * Onde este componente está sendo desenhado.
 *
 * A landing tem paleta própria (`da-*`, âmbar sobre verde-escuro, tipografia
 * display) e o resto do app usa os tokens do design system. É a única coisa que
 * muda entre os dois lugares — o conteúdo, os estados e o comportamento são
 * literalmente o mesmo código.
 */
export type AparenciaInstalacao = 'app' | 'landing'

interface Pele {
  cartao: string
  cartaoSuave: string
  fonteTitulo: string
  fonteMono: string
  titulo: string
  texto: string
  destaque: string
  selo: string
  botao: string
  botaoSecundario: string
  raioBotao: string
  chipAtivo: string
  chipInativo: string
  bolha: string
  linha: string
  sucesso: string
  aviso: string
  marcador: string
}

const PELES: Record<AparenciaInstalacao, Pele> = {
  app: {
    cartao: 'rounded-2xl border border-border bg-card/60 backdrop-blur-sm',
    cartaoSuave: 'rounded-2xl border border-border bg-card/40',
    fonteTitulo: '',
    fonteMono: 'font-mono',
    titulo: 'font-bold tracking-tight',
    texto: 'text-muted-foreground',
    destaque: 'text-primary',
    selo: 'border-primary/30 bg-primary/10 text-primary',
    botao:
      'bg-primary text-primary-foreground shadow-lg hover:brightness-110 focus-visible:outline-primary',
    botaoSecundario:
      'border border-border bg-transparent text-foreground hover:bg-muted focus-visible:outline-primary',
    raioBotao: 'rounded-xl',
    chipAtivo: 'border-primary bg-primary text-primary-foreground',
    chipInativo:
      'border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40',
    bolha: 'bg-primary/10 text-primary',
    linha: 'bg-border',
    sucesso:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    aviso:
      'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    marcador: 'text-primary',
  },
  landing: {
    cartao: 'rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-ground/40',
    cartaoSuave:
      'rounded-2xl border border-[color:var(--da-neutral-line)] bg-da-panel/30',
    fonteTitulo: 'font-da-display',
    fonteMono: 'font-da-mono',
    titulo: 'font-da-display font-semibold tracking-tighter',
    texto: 'text-da-muted',
    destaque: 'text-da-amber',
    selo: 'border-da-amber/40 bg-da-amber/10 text-da-amber font-da-mono',
    botao:
      'bg-da-amber text-[#0B1F1A] hover:shadow-[0_0_34px_-6px_rgba(232,118,58,.7)] focus-visible:outline-da-amber',
    botaoSecundario:
      'border border-[color:var(--da-neutral-line)] bg-transparent text-da-paper hover:border-da-amber/50 focus-visible:outline-da-amber',
    raioBotao: 'rounded-full',
    chipAtivo: 'border-da-amber bg-da-amber text-[#0B1F1A]',
    chipInativo:
      'border-[color:var(--da-neutral-line)] bg-da-panel/40 text-da-muted hover:text-da-paper hover:border-da-amber/40',
    bolha: 'bg-da-amber/12 text-da-amber',
    linha: 'bg-[color:var(--da-neutral-line)]',
    sucesso: 'border-da-amber/50 bg-da-amber/10 text-da-amber',
    aviso: 'border-da-amber/40 bg-da-amber/8 text-da-amber',
    marcador: 'text-da-amber',
  },
}

const ICONES_ABA: Record<(typeof ABAS)[number]['icone'], LucideIcon> = {
  samsung: Smartphone,
  chrome: Chrome,
  firefox: Flame,
  apple: Apple,
  monitor: Monitor,
}

const ICONES_BENEFICIO: Record<(typeof BENEFICIOS)[number]['icone'], LucideIcon> = {
  casa: Home,
  tela: Maximize2,
  atalho: Zap,
  atualiza: RefreshCw,
}

/* =================== COMPONENTE =================== */

export interface InstalarAppProps {
  /**
   * Endereço absoluto que o QR code carrega e que o botão copia. O padrão é o
   * atalho curto (`/app`), que redireciona para cá — é o que a pessoa vai ditar
   * para um colega depois.
   */
  urlDaPagina?: string
  aparencia?: AparenciaInstalacao
  className?: string
}

/**
 * A experiência de instalar o DomineAqui como app — a única que existe.
 *
 * Antes havia duas: a seção `#app` da landing (que só sabia falar de iPhone,
 * capturava o `beforeinstallprompt` tarde demais e nunca oferecia o botão
 * nativo a quem chegava de um Galaxy) e a página `/instalar` (completa, mas
 * escondida atrás de um link que a landing não dava). Quem entrava pela home —
 * a maioria — via a pior das duas.
 *
 * Agora as duas rotas renderizam este componente. A `aparencia` troca a paleta;
 * nada mais. O cérebro está em `useFluxoInstalacao`, o texto em
 * `lib/pwa/conteudo.ts` e a detecção de plataforma em `lib/pwa/instalacao.ts`.
 */
export function InstalarApp({
  urlDaPagina = URL_CURTA,
  aparencia = 'app',
  className,
}: InstalarAppProps) {
  const pele = PELES[aparencia]
  const fluxo = useFluxoInstalacao()
  const Titulo = aparencia === 'landing' ? 'h2' : 'h1'

  return (
    <div className={cn('mx-auto w-full max-w-5xl', className)}>
      {/* ── Chamada ───────────────────────────────────────────────────── */}
      <header className="text-center">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide',
            pele.selo,
          )}
        >
          {SELO}
        </span>

        <Titulo
          className={cn(
            'mt-4 text-3xl leading-[1.08] sm:text-4xl md:text-5xl',
            pele.titulo,
          )}
        >
          {fluxo.titulo}
        </Titulo>

        <p
          className={cn(
            'mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base',
            pele.texto,
          )}
        >
          {CHAMADA}
        </p>
      </header>

      {/* ── Ação + passo a passo, lado a lado no desktop ───────────────── */}
      {/* `min-w-0` nos filhos: sem isso o tamanho mínimo automático do item de
          grade vira o min-content do cartão, e o passo a passo empurra a página
          inteira para fora da tela no celular. */}
      <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PainelDeAcao fluxo={fluxo} pele={pele} />
        <PassoAPasso fluxo={fluxo} pele={pele} />
      </div>

      {/* ── O que muda ao instalar ─────────────────────────────────────── */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2">
        {BENEFICIOS.map((beneficio) => {
          const Icone = ICONES_BENEFICIO[beneficio.icone]
          return (
            <div
              key={beneficio.titulo}
              className={cn('flex items-start gap-3 p-4', pele.cartaoSuave)}
            >
              <span
                className={cn(
                  'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                  pele.bolha,
                )}
              >
                <Icone className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold', pele.fonteTitulo)}>
                  {beneficio.titulo}
                </p>
                <p className={cn('mt-1 text-sm leading-relaxed', pele.texto)}>
                  {beneficio.texto}
                </p>
              </div>
            </div>
          )
        })}
      </section>

      <Compartilhar
        urlDaPagina={urlDaPagina}
        plataforma={fluxo.plataforma}
        pele={pele}
      />

      <Duvidas pele={pele} />
    </div>
  )
}

/* =================== PAINEL DE AÇÃO =================== */

/**
 * O que a pessoa deve fazer AGORA — um estado por vez, nunca dois convites
 * competindo. É a diferença entre "tem um botão e também uma lista, qual eu
 * uso?" e "clique aqui".
 */
function PainelDeAcao({
  fluxo,
  pele,
}: {
  fluxo: ReturnType<typeof useFluxoInstalacao>
  pele: Pele
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 min-h-[13rem] flex-col justify-center p-6 sm:p-7',
        pele.cartao,
      )}
      aria-live="polite"
    >
      {fluxo.estado === 'detectando' && (
        <div className="flex items-center gap-3">
          <Loader2
            className={cn('h-5 w-5 motion-safe:animate-spin', pele.marcador)}
            aria-hidden
          />
          <p className={cn('text-sm', pele.texto)}>
            Vendo como o seu navegador instala…
          </p>
        </div>
      )}

      {fluxo.estado === 'instalado' && (
        <div>
          <p
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold',
              pele.sucesso,
            )}
          >
            <PartyPopper className="h-4 w-4" aria-hidden />
            Pronto — você já está no app instalado.
          </p>
          <p className={cn('mt-3 text-sm leading-relaxed', pele.texto)}>
            Nada mais a fazer aqui. O ícone já está na sua tela de início e o app
            se atualiza sozinho.
          </p>
          <Link
            href="/dashboard"
            className={cn(
              'mt-4 inline-flex h-11 items-center gap-2 px-6 text-sm font-bold transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              pele.raioBotao,
              pele.botao,
            )}
          >
            Ir para o Dashboard
            <ArrowRight className="h-4 w-4" strokeWidth={2.6} aria-hidden />
          </Link>
        </div>
      )}

      {fluxo.estado === 'um-toque' && (
        <div>
          <p className={cn('text-lg', pele.titulo)}>Um toque e acabou</p>
          <p className={cn('mt-1.5 text-sm leading-relaxed', pele.texto)}>
            O seu navegador instala sozinho, pelo diálogo do próprio sistema. Sem
            loja de apps, sem download.
          </p>
          <button
            type="button"
            onClick={fluxo.instalar}
            disabled={fluxo.abrindoDialogo}
            className={cn(
              'mt-4 inline-flex h-12 items-center gap-2 px-7 text-sm font-bold transition active:scale-95 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              pele.raioBotao,
              pele.botao,
            )}
          >
            {fluxo.abrindoDialogo ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
            ) : (
              <Download className="h-4 w-4" strokeWidth={2.6} aria-hidden />
            )}
            {fluxo.abrindoDialogo ? 'Abrindo…' : 'Instalar agora'}
          </button>
          <p className={cn('mt-2.5 text-xs leading-relaxed', pele.texto)}>
            {fluxo.recusou
              ? 'Sem problema — o passo a passo desta página instala do mesmo jeito.'
              : 'O próprio sistema confirma a instalação.'}
          </p>
        </div>
      )}

      {fluxo.estado === 'passo-a-passo' && (
        <div>
          {/* Sem o nome do navegador na frase: os rótulos ("Chrome no Android",
              "iPhone e iPad") não cabem numa concordância só, e "3 toques" seria
              mentira em quem está no computador. */}
          <p className={cn('text-lg', pele.titulo)}>
            São 3 passos, no menu do navegador
          </p>
          <p className={cn('mt-1.5 text-sm leading-relaxed', pele.texto)}>
            Este navegador não abre o diálogo de instalação sozinho — quem coloca
            o ícone na sua tela é o menu dele.
            {fluxo.detectado ? ' Já deixamos aberto o caminho do seu.' : ''}
          </p>
          <p
            className={cn(
              'mt-4 inline-flex items-center gap-2 text-sm font-semibold',
              pele.marcador,
            )}
          >
            {/* No celular os cartões ficam empilhados e o passo a passo está
                abaixo; no desktop, ao lado. A seta segue o olho. */}
            <ArrowRight
              className="hidden h-4 w-4 lg:inline-block"
              strokeWidth={2.6}
              aria-hidden
            />
            <ArrowDown
              className="h-4 w-4 lg:hidden"
              strokeWidth={2.6}
              aria-hidden
            />
            Siga o passo a passo
          </p>
        </div>
      )}
    </section>
  )
}

/* =================== PASSO A PASSO =================== */

function PassoAPasso({
  fluxo,
  pele,
}: {
  fluxo: ReturnType<typeof useFluxoInstalacao>
  pele: Pele
}) {
  const idBase = useId()
  const listaRef = useRef<HTMLDivElement>(null)

  // Setas navegam entre abas, como manda o padrão de tablist. Sem isto, quem
  // usa teclado precisa dar Tab em cada uma das cinco para chegar na sua.
  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    const passo =
      evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0
    if (!passo) return
    evento.preventDefault()
    const atual = ABAS.findIndex((aba) => aba.id === fluxo.aba)
    const proxima = ABAS[(atual + passo + ABAS.length) % ABAS.length]
    fluxo.escolherAba(proxima.id)
    listaRef.current
      ?.querySelector<HTMLButtonElement>(`[data-aba="${proxima.id}"]`)
      ?.focus()
  }

  return (
    <section className={cn('min-w-0 p-6 sm:p-7', pele.cartao)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className={cn('text-lg', pele.titulo)}>Passo a passo</h3>
        {fluxo.detectado && (
          <p className={cn('text-xs', pele.texto, pele.fonteMono)}>
            detectamos: {fluxo.detectado}
          </p>
        )}
      </div>
      <p className={cn('mt-1 text-sm leading-relaxed', pele.texto)}>
        Abrimos na aba do seu aparelho. Troque se estiver instalando em outro —
        no celular de alguém, ou no computador.
      </p>

      {/* As abas quebram linha em vez de rolar na horizontal. Rolagem lateral
          escondia "iPhone e iPad" e "Computador" atrás da borda do cartão, sem
          nenhuma pista de que havia mais — e é justamente quem está no iPhone
          que precisava achar a sua. */}
      <div
        ref={listaRef}
        role="tablist"
        aria-label="Navegador para instalar"
        onKeyDown={aoTeclar}
        className="mt-4 flex flex-wrap gap-2"
      >
        {ABAS.map(({ id, rotulo, icone }) => {
          const Icone = ICONES_ABA[icone]
          const ativa = fluxo.aba === id
          const doAparelho = ehAbaDoAparelho(id, fluxo.plataforma)
          return (
            <button
              key={id}
              type="button"
              role="tab"
              data-aba={id}
              id={`${idBase}-aba-${id}`}
              aria-selected={ativa}
              aria-controls={`${idBase}-painel`}
              tabIndex={ativa ? 0 : -1}
              onClick={() => fluxo.escolherAba(id)}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-3.5 sm:text-xs',
                ativa ? pele.chipAtivo : pele.chipInativo,
              )}
            >
              <Icone className="h-3.5 w-3.5" aria-hidden />
              {rotulo}
              {doAparelho && (
                <span
                  className={cn(
                    'ml-0.5 h-1.5 w-1.5 rounded-full',
                    ativa ? 'bg-current opacity-70' : 'bg-current',
                  )}
                  // O ponto é decoração; quem usa leitor de tela recebe a frase.
                  aria-hidden
                />
              )}
              {doAparelho && <span className="sr-only">(seu aparelho)</span>}
            </button>
          )
        })}
      </div>

      <ol
        role="tabpanel"
        id={`${idBase}-painel`}
        aria-labelledby={`${idBase}-aba-${fluxo.aba}`}
        className="mt-4 space-y-3"
      >
        {fluxo.instrucoesDaAba.passos.map((passo, i) => (
          <li key={passo} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                pele.bolha,
                pele.fonteMono,
              )}
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed">{passo}</span>
          </li>
        ))}
      </ol>

      {fluxo.instrucoesDaAba.alternativa && (
        <p
          className={cn(
            'mt-4 rounded-lg border p-3 text-xs leading-relaxed',
            pele.aviso,
          )}
        >
          {fluxo.instrucoesDaAba.alternativa}
        </p>
      )}

      {ehIos(fluxo.aba) && (
        <p className={cn('mt-3 text-xs leading-relaxed', pele.texto)}>
          O ícone Compartilhar é o quadrado com uma seta para cima, na barra do
          Safari.
        </p>
      )}
    </section>
  )
}

/* =================== COMPARTILHAR =================== */

/**
 * Instalar no aparelho certo.
 *
 * No computador, o QR resolve o salto para o celular. No celular, o que resolve
 * é o endereço curto: é assim que o app se espalha no grupo da turma.
 */
function Compartilhar({
  urlDaPagina,
  plataforma,
  pele,
}: {
  urlDaPagina: string
  plataforma: PlataformaInstalacao
  pele: Pele
}) {
  const [copiado, setCopiado] = useState(false)
  const mostrarQr = plataforma === 'desktop' || plataforma === 'desconhecida'

  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(t)
  }, [copiado])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlDaPagina)
      setCopiado(true)
    } catch {
      /* clipboard bloqueado (http, permissão): o endereço está escrito na tela */
    }
  }

  return (
    <section
      className={cn(
        'mt-5 flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left',
        pele.cartao,
      )}
    >
      {mostrarQr && (
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={urlDaPagina} size={112} level="M" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className={cn('text-base', pele.titulo)}>
          {mostrarQr ? 'Instalar no celular' : 'Mandar para alguém'}
        </h3>
        <p className={cn('mt-1 text-sm leading-relaxed', pele.texto)}>
          {mostrarQr
            ? 'Aponte a câmera do seu celular para o código: esta mesma página abre lá, já no passo a passo do aparelho.'
            : 'Este endereço abre esta página em qualquer aparelho, já no passo a passo certo. Vale para o grupo da turma.'}
        </p>

        <button
          type="button"
          onClick={copiar}
          className={cn(
            'mt-3 inline-flex h-10 items-center gap-2 px-4 text-xs font-semibold transition active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            pele.raioBotao,
            pele.botaoSecundario,
            pele.fonteMono,
          )}
        >
          {copiado ? (
            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden />
          )}
          {copiado ? 'Endereço copiado' : ENDERECO_CURTO}
        </button>
      </div>
    </section>
  )
}

/* =================== DÚVIDAS =================== */

function Duvidas({ pele }: { pele: Pele }) {
  return (
    <section className="mt-5">
      <h3 className={cn('text-lg', pele.titulo)}>Antes que você pergunte</h3>
      <div className={cn('mt-3 overflow-hidden', pele.cartao)}>
        {DUVIDAS.map((duvida, i) => (
          <details key={duvida.pergunta} className="group">
            {i > 0 && <div className={cn('h-px', pele.linha)} aria-hidden />}
            <summary
              className={cn(
                'flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2',
                pele.fonteTitulo,
              )}
            >
              {duvida.pergunta}
              <ChevronDown
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-transform group-open:rotate-180',
                  pele.marcador,
                )}
                aria-hidden
              />
            </summary>
            <p className={cn('px-4 pb-4 text-sm leading-relaxed', pele.texto)}>
              {duvida.resposta}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
