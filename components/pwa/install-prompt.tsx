'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Share, Plus, X, Check } from 'lucide-react'
import { useInstalarApp, type ResultadoInstalacao } from '@/hooks/use-instalar-app'
import {
  CHAVE_DISPENSA,
  ehAndroid,
  ehAparelhoSamsung,
  foiDispensadoRecentemente,
  type PlataformaInstalacao,
} from '@/lib/pwa/instalacao'

// Chave usada pela versão anterior (só iPhone). Continua sendo respeitada para
// não ressuscitar o convite para quem já tinha fechado.
const CHAVE_DISPENSA_ANTIGA = 'ios-install-dismissed-at'

// Publica a própria altura como variável CSS global, para que outros elementos
// flutuantes (ex.: o botão "Voltar") subam e não fiquem tampados por este
// banner enquanto ele estiver na tela.
const VAR_ALTURA = '--gx-install-prompt-h'

// Tempo até a faixa aparecer. Curto o bastante para pegar a primeira visita,
// longo o bastante para não competir com a primeira pintura.
const ATRASO_MS = 1500
// Quanto esperamos pelo diálogo nativo antes de cair no passo a passo manual.
// O `beforeinstallprompt` costuma chegar em menos de 1s; se passou disso, ou o
// app já está instalado ou aquele navegador não vai disparar o evento.
const ESPERA_PROMPT_NATIVO_MS = 4000

// Telas onde a faixa atrapalha mais do que ajuda. `/auth` porque ela sobe por
// cima do botão de entrar/cadastrar, e `/exam` porque ninguém quer um convite
// aparecendo no meio de uma prova cronometrada.
const ROTAS_BLOQUEADAS = ['/auth', '/exam']

function rotaBloqueada(pathname: string | null): boolean {
  if (!pathname) return false
  // Em /instalar a faixa seria eco: a página inteira já é o convite, com botão
  // maior e passo a passo completo.
  if (pathname === '/instalar') return true
  // O leitor de PDF tem barra de controles fixa no rodapé, no mesmo lugar.
  if (pathname.includes('/viewer')) return true
  return ROTAS_BLOQUEADAS.some(
    (prefixo) => pathname === prefixo || pathname.startsWith(`${prefixo}/`),
  )
}

function dispensar() {
  try {
    localStorage.setItem(CHAVE_DISPENSA, String(Date.now()))
  } catch {
    /* modo privado / storage bloqueado: só não persiste */
  }
}

function jaDispensado(): boolean {
  if (foiDispensadoRecentemente()) return true
  try {
    const antigo = localStorage.getItem(CHAVE_DISPENSA_ANTIGA)
    if (!antigo) return false
    // A regra antiga era 14 dias; mantemos o silêncio dela pelo mesmo prazo.
    return Date.now() - Number(antigo) < 14 * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

/**
 * Convite para instalar o DomineAqui como app.
 *
 * Antes só existia para iPhone — quem abria num Samsung nunca via que dá para
 * ter o app na tela de início. Agora a faixa cobre os dois mundos, e cada um
 * com o que a plataforma realmente oferece:
 *
 *  • Android (Chrome, Samsung Internet 8+, Edge, Opera): botão "Instalar" que
 *    abre o diálogo NATIVO do sistema — um toque, sem passo a passo.
 *  • Samsung Internet antigo / Firefox Android: passo a passo do menu certo,
 *    porque ali não existe diálogo para chamar.
 *  • iPhone no Safari: Compartilhar → Adicionar à Tela de Início, como antes.
 *
 * Aparece uma vez, é fechável e some por 21 dias — nunca vira incômodo.
 */
export function InstallPrompt() {
  const {
    pronto,
    plataforma,
    instrucoes,
    podeInstalarAgora,
    aguardandoPromptNativo,
    jaInstalado,
    instalar,
  } = useInstalarApp()
  const pathname = usePathname()
  const [visivel, setVisivel] = useState(false)
  const [entrou, setEntrou] = useState(false)
  const [esperaEsgotada, setEsperaEsgotada] = useState(false)
  const raizRef = useRef<HTMLDivElement>(null)

  // Cronômetro da espera pelo diálogo nativo (ver ESPERA_PROMPT_NATIVO_MS).
  useEffect(() => {
    const t = setTimeout(() => setEsperaEsgotada(true), ESPERA_PROMPT_NATIVO_MS)
    return () => clearTimeout(t)
  }, [])

  const ehMobile = ehAndroid(plataforma) || plataforma === 'ios-safari'
  // Enquanto o diálogo nativo ainda pode chegar, não mostramos o passo a passo:
  // seria ensinar um caminho pior do que o botão que está prestes a existir.
  const deveMostrar =
    pronto &&
    ehMobile &&
    !jaInstalado &&
    !rotaBloqueada(pathname) &&
    (podeInstalarAgora || !aguardandoPromptNativo || esperaEsgotada)

  useEffect(() => {
    // Cobre também a navegação PARA uma rota bloqueada (ou a instalação feita
    // no meio da sessão pelo menu do navegador): a faixa sai de cena na hora.
    if (!deveMostrar) {
      setVisivel(false)
      setEntrou(false)
      return
    }
    if (jaDispensado()) return
    const t = setTimeout(() => {
      setVisivel(true)
      requestAnimationFrame(() => setEntrou(true))
    }, ATRASO_MS)
    return () => clearTimeout(t)
  }, [deveMostrar])

  useEffect(() => {
    if (!visivel || !raizRef.current) return
    const el = raizRef.current
    const publicar = () => {
      document.documentElement.style.setProperty(VAR_ALTURA, `${el.offsetHeight}px`)
    }
    publicar()
    const observador = new ResizeObserver(publicar)
    observador.observe(el)
    return () => {
      observador.disconnect()
      document.documentElement.style.setProperty(VAR_ALTURA, '0px')
    }
  }, [visivel])

  if (!visivel) return null

  const fechar = () => {
    dispensar()
    setEntrou(false)
    setTimeout(() => setVisivel(false), 250)
  }

  return (
    <div
      ref={raizRef}
      role="dialog"
      aria-label="Instalar o app na tela de início"
      className="fixed inset-x-0 bottom-0 z-[100] px-3 pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className={
          'pointer-events-auto mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md ' +
          'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out ' +
          (entrou
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100')
        }
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {podeInstalarAgora ? (
            <Download className="h-5 w-5" strokeWidth={2.5} />
          ) : (
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {podeInstalarAgora ? (
            <ConviteComBotao instalar={instalar} onFeito={() => setVisivel(false)} />
          ) : (
            <ConviteComPassos plataforma={plataforma} passos={instrucoes.passos} />
          )}
        </div>

        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

/** Caminho bom: o navegador entrega o diálogo nativo e basta um toque. */
function ConviteComBotao({
  instalar,
  onFeito,
}: {
  instalar: () => Promise<ResultadoInstalacao>
  onFeito: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const [recusado, setRecusado] = useState(false)

  const aoClicar = async () => {
    setOcupado(true)
    const resultado = await instalar()
    setOcupado(false)
    if (resultado === 'instalado') {
      onFeito()
      return
    }
    // "Agora não" no diálogo do sistema: silencia igual ao X, para o convite
    // não voltar na próxima página.
    dispensar()
    setRecusado(true)
    setTimeout(onFeito, 1200)
  }

  if (recusado) {
    return (
      <p className="text-sm text-muted-foreground">
        Tudo bem — quando quiser, é só abrir{' '}
        <Link href="/instalar" className="font-medium text-primary underline">
          domineaqui.com.br/instalar
        </Link>
        .
      </p>
    )
  }

  return (
    <>
      <p className="text-sm font-semibold text-foreground">
        Instale o app do DomineAqui
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Abre em tela cheia, direto da sua tela de início. Sem loja de apps e sem
        ocupar espaço.
      </p>
      <button
        type="button"
        onClick={aoClicar}
        disabled={ocupado}
        className="mt-2.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground transition active:scale-95 disabled:opacity-60"
      >
        {ocupado ? (
          'Abrindo…'
        ) : (
          <>
            <Download className="h-3.5 w-3.5" strokeWidth={2.6} />
            Instalar agora
          </>
        )}
      </button>
    </>
  )
}

/** Sem diálogo nativo: ensinamos o caminho exato daquele navegador. */
function ConviteComPassos({
  plataforma,
  passos,
}: {
  plataforma: PlataformaInstalacao
  passos: string[]
}) {
  const [aparelho, setAparelho] = useState('seu celular')

  useEffect(() => {
    if (ehAparelhoSamsung(navigator.userAgent || '')) setAparelho('seu Samsung')
    else if (ehAndroid(plataforma)) setAparelho('seu Android')
    else setAparelho('seu iPhone')
  }, [plataforma])

  // O iPhone tem um caminho curto o bastante para caber numa frase — e a frase
  // com o ícone do Compartilhar desenhado é mais fácil de seguir que uma lista.
  if (plataforma === 'ios-safari') {
    return (
      <>
        <p className="text-sm font-semibold text-foreground">
          Instale o DomineAqui no {aparelho}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Toque em{' '}
          <Share
            className="inline-block h-3.5 w-3.5 -translate-y-px align-middle text-primary"
            strokeWidth={2.2}
            aria-label="ícone Compartilhar"
          />{' '}
          <span className="font-medium text-foreground">Compartilhar</span> e depois
          em{' '}
          <span className="font-medium text-foreground">Adicionar à Tela de Início</span>
          . Rápido, sem app store.
        </p>
      </>
    )
  }

  return (
    <>
      <p className="text-sm font-semibold text-foreground">
        Instale o DomineAqui no {aparelho}
      </p>
      <ol className="mt-1.5 space-y-1">
        {passos.map((passo, i) => (
          <li
            key={i}
            className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
          >
            <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" strokeWidth={3} />
            <span>{passo}</span>
          </li>
        ))}
      </ol>
    </>
  )
}
