'use client'

import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Megaphone,
  MousePointerClick,
  Sparkles,
  X,
} from 'lucide-react'
import { AnuncioModal, sanitizeModalHtml } from '@/components/anuncio-modal'
import { cn } from '@/lib/utils'
import { toInternalPath, type AnuncioDestinoTipo } from '@/lib/anuncio-destinos'
import {
  ANUNCIO_DISMISS_MS,
  ANUNCIO_DISMISS_STORAGE_KEY,
  lerOcultacaoDeAnuncios,
  shouldHideAdsOnRoute,
} from '@/lib/anuncio-exibicao'

export interface PlatformAdDestino {
  tipo?: AnuncioDestinoTipo
  rotulo?: string
  refId?: string
}

export interface PlatformAd {
  _id: string
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  titulo?: string
  ctaTexto?: string
  destino?: PlatformAdDestino
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
  modalBotaoDestino?: PlatformAdDestino
}

const ROTATION_MS = 8000

function normalizeAds(payload: unknown): PlatformAd[] {
  const raw = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { anuncios?: unknown })?.anuncios)
      ? (payload as { anuncios: unknown[] }).anuncios
      : []

  return raw
    .filter((ad): ad is PlatformAd => {
      const candidate = ad as Partial<PlatformAd>
      return (
        typeof candidate._id === 'string' &&
        typeof candidate.imagemUrl === 'string' &&
        candidate.imagemUrl.trim().length > 0 &&
        candidate.ativo === true &&
        (candidate.tipoAcao === 'link' || candidate.tipoAcao === 'modal')
      )
    })
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
}

function getAdTitle(ad: PlatformAd) {
  // A chamada escrita no admin vem primeiro: "Restam 8 vagas" convence mais que
  // o nome do domínio, que era o único título possível antes.
  if (ad.titulo?.trim()) return ad.titulo.trim()
  if (ad.destino?.rotulo?.trim()) return ad.destino.rotulo.trim()
  if (ad.modalTitulo?.trim()) return ad.modalTitulo.trim()

  if (ad.linkUrl) {
    try {
      const url = new URL(ad.linkUrl, window.location.origin)
      return url.hostname.replace(/^www\./, '') || 'Ver anuncio'
    } catch {
      return 'Ver anuncio'
    }
  }

  return 'Anuncio'
}

const DESTINO_ETIQUETA: Record<AnuncioDestinoTipo, string> = {
  material: 'Material',
  pacote: 'Pacote',
  produto: 'Produto',
  aula: 'Aula',
  rifa: 'Rifa',
  pagina: 'Na plataforma',
  externo: '',
}

function getAdDestination(ad: PlatformAd) {
  if (!ad.linkUrl) return ''

  const etiqueta = ad.destino?.tipo ? DESTINO_ETIQUETA[ad.destino.tipo] : ''
  if (etiqueta && ad.destino?.rotulo && ad.destino.rotulo.trim() !== getAdTitle(ad)) {
    return `${etiqueta} · ${ad.destino.rotulo}`
  }
  if (etiqueta && !ad.destino?.rotulo) return etiqueta

  try {
    const url = new URL(ad.linkUrl, window.location.origin)
    if (url.origin === window.location.origin) return url.pathname
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ad.linkUrl
  }
}

export function PlatformAds() {
  const pathname = usePathname()
  const router = useRouter()
  const [ads, setAds] = useState<PlatformAd[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<PlatformAd | null>(null)

  const hiddenOnRoute = shouldHideAdsOnRoute(pathname)

  /**
   * Respeita o "ocultar por 30 minutos" — e volta sozinho quando o prazo passa.
   *
   * Antes, ocultar uma vez desligava o componente pelo resto da sessão: o
   * estado `dismissed` não tinha quem o desfizesse e a busca dos anúncios nem
   * chegava a rodar. Quem clicasse no "x" e continuasse navegando (o normal num
   * app de página única) não via mais anúncio nenhum até recarregar a página.
   */
  useEffect(() => {
    if (hiddenOnRoute) return

    const dismissedUntil = lerOcultacaoDeAnuncios()
    setDismissed(dismissedUntil > 0)

    // O prazo acaba dentro da própria sessão: o temporizador traz a peça de
    // volta sem depender de um recarregamento.
    let timer: number | undefined
    if (dismissedUntil > 0) {
      timer = window.setTimeout(() => setDismissed(false), dismissedUntil - Date.now() + 500)
    }

    let cancelled = false

    // A busca acontece mesmo com os anúncios ocultos: quando o prazo vence, o
    // conteúdo já está em mãos e a peça aparece na hora, sem novo fetch.
    async function fetchAds() {
      try {
        const response = await fetch('/api/anuncios', {
          cache: 'no-store',
        })
        if (!response.ok) {
          console.error('Anuncios: resposta', response.status, 'de /api/anuncios')
          return
        }

        const data = await response.json()
        if (!cancelled) setAds(normalizeAds(data))
      } catch (error) {
        console.error('Erro ao carregar anuncios globais:', error)
      }
    }

    fetchAds()

    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [hiddenOnRoute])

  useEffect(() => {
    if (ads.length <= 1 || paused || modalOpen) return

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % ads.length)
    }, ROTATION_MS)

    return () => window.clearInterval(interval)
  }, [ads.length, modalOpen, paused])

  useEffect(() => {
    if (currentIndex >= ads.length) setCurrentIndex(0)
  }, [ads.length, currentIndex])

  const currentAd = ads[currentIndex]
  const isLinkAd = currentAd?.tipoAcao === 'link'
  const adTitle = currentAd ? getAdTitle(currentAd) : ''
  const adDestination = currentAd ? getAdDestination(currentAd) : ''
  const isInternalAd =
    typeof window !== 'undefined' && !!currentAd?.linkUrl
      ? !!toInternalPath(currentAd.linkUrl, window.location.origin)
      : false
  const ctaLabel = currentAd?.ctaTexto?.trim() || (isLinkAd ? 'Ver agora' : 'Abrir')
  const sanitizedModalContent = useMemo(
    () => sanitizeModalHtml(selectedAd?.modalConteudo || ''),
    [selectedAd?.modalConteudo],
  )

  const goTo = useCallback(
    (direction: 'previous' | 'next') => {
      if (ads.length <= 1) return
      setCurrentIndex((current) =>
        direction === 'next'
          ? (current + 1) % ads.length
          : (current - 1 + ads.length) % ads.length,
      )
    },
    [ads.length],
  )

  const handleDismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(ANUNCIO_DISMISS_STORAGE_KEY, String(Date.now() + ANUNCIO_DISMISS_MS))
    } catch {
      // Non-critical preference.
    }
  }, [])

  /**
   * Abre o destino do anúncio.
   *
   * Destino DENTRO da plataforma navega com o router: abrir uma aba nova para
   * ir de `/dashboard` a `/materiais/x` custa o carregamento inteiro do app e,
   * no PWA instalado, ainda joga a pessoa para fora, no navegador. Só o que sai
   * do domínio é que ganha aba nova.
   */
  const openDestination = useCallback(
    (url?: string, novaAba?: boolean) => {
      if (!url) return

      const interno = toInternalPath(url, window.location.origin)
      if (interno) {
        router.push(interno)
        return
      }

      if (novaAba ?? true) {
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = url
      }
    },
    [router],
  )

  const handleAdClick = useCallback(
    (ad: PlatformAd) => {
      if (ad.tipoAcao === 'link' && ad.linkUrl) {
        openDestination(ad.linkUrl, ad.linkNovaAba)
        return
      }

      if (ad.tipoAcao === 'modal') {
        setSelectedAd(ad)
        setModalOpen(true)
      }
    },
    [openDestination],
  )

  const handleModalButtonClick = useCallback(() => {
    openDestination(selectedAd?.modalBotaoLink)
    setModalOpen(false)
  }, [openDestination, selectedAd?.modalBotaoLink])

  /** Link escrito no corpo do modal: mesmo tratamento do botão. */
  const handleModalContentClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const anchor = (event.target as HTMLElement | null)?.closest('a')
      if (!anchor) return

      const interno = toInternalPath(anchor.getAttribute('href') || '', window.location.origin)
      if (!interno) return

      event.preventDefault()
      setModalOpen(false)
      router.push(interno)
    },
    [router],
  )

  if (hiddenOnRoute || dismissed || !currentAd || ads.length === 0) {
    return null
  }

  return (
    <>
      <aside
        className="fixed bottom-20 left-1/2 z-[45] w-[min(720px,calc(100vw-24px))] -translate-x-1/2 print:hidden sm:bottom-5"
        aria-label="Anuncio da plataforma"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className={cn(
            'group relative overflow-hidden rounded-xl border text-slate-950 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.72)] backdrop-blur-2xl transition duration-300 dark:text-white',
            'border-white/60 bg-white/80 dark:border-white/18 dark:bg-slate-950/80',
            isLinkAd && 'shadow-[#468152]/25 ring-1 ring-[#E2A43E]/35',
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(70,129,82,0.16),rgba(255,255,255,0.18)_42%,rgba(226,164,62,0.24))] dark:bg-[linear-gradient(135deg,rgba(70,129,82,0.20),rgba(15,23,42,0.22)_44%,rgba(226,164,62,0.16))]"
          />
          {isLinkAd && (
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-xl border border-[#E2A43E]/45 opacity-80"
              style={{ animation: 'platform-ad-attention 2400ms ease-in-out infinite' }}
            />
          )}

          {ads.length > 1 && !paused && (
            <div className="absolute inset-x-0 top-0 z-10 h-1 bg-black/10 dark:bg-white/10">
              <div
                key={currentAd._id}
                className="h-full bg-gradient-to-r from-[#468152] via-[#E2A43E] to-[#CE5929]"
                style={{ animation: `platform-ad-progress ${ROTATION_MS}ms linear infinite` }}
              />
            </div>
          )}

          <div className="relative flex min-h-[104px] items-stretch gap-2 p-2.5 sm:min-h-[116px] sm:gap-3 sm:p-3">
            <button
              type="button"
              onClick={() => handleAdClick(currentAd)}
              className="group/ad grid min-w-0 flex-1 grid-cols-[112px_minmax(0,1fr)] items-center gap-3 rounded-lg text-left outline-none transition hover:bg-black/[0.035] focus-visible:ring-2 focus-visible:ring-[#468152] dark:hover:bg-white/[0.06] sm:grid-cols-[190px_minmax(0,1fr)_auto]"
            >
              <span className="relative flex h-full min-h-[84px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/55 bg-white/80 p-1.5 shadow-inner dark:border-white/10 dark:bg-slate-900/80 sm:min-h-[92px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAd.imagemUrl}
                  alt={adTitle}
                  className="max-h-full max-w-full object-contain transition duration-300 group-hover/ad:scale-[1.025]"
                  loading="lazy"
                />
              </span>

              <span className="flex min-w-0 flex-col justify-center py-1">
                <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#468152]/25 bg-[#468152]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#468152] dark:text-emerald-200">
                    {isLinkAd ? <Sparkles className="h-3 w-3" /> : <Megaphone className="h-3 w-3" />}
                    {isLinkAd ? 'Destaque' : 'Publicidade'}
                  </span>
                  {isLinkAd && (
                    <span className="hidden rounded-full bg-[#E2A43E]/18 px-2 py-0.5 text-[10px] font-bold text-[#9A6817] dark:text-amber-200 sm:inline-flex">
                      {isInternalAd ? 'Abre aqui mesmo' : 'Abre em nova aba'}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-sm font-black leading-tight sm:text-base">
                  {adTitle}
                </span>
                {adDestination && (
                  <span className="mt-1 hidden truncate text-xs font-semibold text-slate-600 dark:text-slate-300 sm:block">
                    {adDestination}
                  </span>
                )}
              </span>

              <span
                className={cn(
                  'hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black text-white shadow-lg transition group-hover/ad:translate-x-0.5 sm:inline-flex',
                  isLinkAd
                    ? 'bg-gradient-to-r from-[#CE5929] via-[#E2A43E] to-[#468152] shadow-[#CE5929]/25'
                    : 'bg-[#468152] shadow-[#468152]/20',
                )}
              >
                {isLinkAd && !isInternalAd ? (
                  <ExternalLink className="h-3.5 w-3.5" />
                ) : (
                  <MousePointerClick className="h-3.5 w-3.5" />
                )}
                {ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </button>

            {ads.length > 1 && (
              <div className="hidden items-center gap-1 lg:flex">
                <button
                  type="button"
                  onClick={() => goTo('previous')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-black/[0.05] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Anuncio anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo('next')}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-black/[0.05] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white"
                  aria-label="Proximo anuncio"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="absolute right-1 top-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/65 text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:bg-slate-950/55 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white sm:static sm:h-8 sm:w-8 sm:bg-transparent"
              aria-label="Ocultar anuncios por 30 minutos"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <AnuncioModal
        ad={selectedAd}
        html={sanitizedModalContent}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAcao={handleModalButtonClick}
        onLinkNoTexto={handleModalContentClick}
      />

      <style jsx>{`
        @keyframes platform-ad-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        @keyframes platform-ad-attention {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(226, 164, 62, 0.28);
            opacity: 0.72;
          }
          50% {
            box-shadow: 0 0 0 7px rgba(226, 164, 62, 0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
