'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PlatformAd {
  _id: string
  imagemUrl: string
  ativo: boolean
  ordem: number
  tipoAcao: 'link' | 'modal'
  linkUrl?: string
  linkNovaAba?: boolean
  modalTitulo?: string
  modalConteudo?: string
  modalBotaoTexto?: string
  modalBotaoLink?: string
}

const ROTATION_MS = 8000
const DISMISS_STORAGE_KEY = 'domineaqui-platform-ads-dismissed-until'
const DISMISS_MS = 30 * 60 * 1000

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

function getAdDestination(ad: PlatformAd) {
  if (!ad.linkUrl) return ''

  try {
    const url = new URL(ad.linkUrl, window.location.origin)
    if (url.origin === window.location.origin) return url.pathname
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ad.linkUrl
  }
}

function sanitizeModalHtml(html: string) {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html
  }

  const allowedTags = new Set([
    'A',
    'B',
    'BR',
    'EM',
    'I',
    'LI',
    'OL',
    'P',
    'SMALL',
    'SPAN',
    'STRONG',
    'U',
    'UL',
  ])
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  doc
    .querySelectorAll('script, style, iframe, object, embed, form, input, button')
    .forEach((node) => node.remove())

  Array.from(doc.body.querySelectorAll('*')).forEach((element) => {
    if (!allowedTags.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes))
      return
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value

      if (name.startsWith('on') || name === 'style') {
        element.removeAttribute(attribute.name)
        return
      }

      if (element.tagName !== 'A' || !['href', 'target', 'rel'].includes(name)) {
        element.removeAttribute(attribute.name)
        return
      }

      if (name === 'href') {
        try {
          const url = new URL(value, window.location.origin)
          if (!['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
            element.removeAttribute(attribute.name)
          }
        } catch {
          element.removeAttribute(attribute.name)
        }
      }
    })

    if (element.tagName === 'A') {
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noopener noreferrer nofollow')
    }
  })

  return doc.body.innerHTML
}

export function PlatformAds() {
  const pathname = usePathname()
  const [ads, setAds] = useState<PlatformAd[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<PlatformAd | null>(null)

  const hiddenOnRoute = pathname?.includes('/viewer')

  useEffect(() => {
    if (hiddenOnRoute) return

    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0)
      if (dismissedUntil > Date.now()) {
        setDismissed(true)
        return
      }
      localStorage.removeItem(DISMISS_STORAGE_KEY)
    } catch {
      // LocalStorage may be blocked; ads can still render normally.
    }

    let cancelled = false

    async function fetchAds() {
      try {
        const response = await fetch('/api/anuncios', {
          cache: 'no-store',
        })
        if (!response.ok) return

        const data = await response.json()
        if (!cancelled) setAds(normalizeAds(data))
      } catch (error) {
        console.error('Erro ao carregar anuncios globais:', error)
      }
    }

    fetchAds()

    return () => {
      cancelled = true
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
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_MS))
    } catch {
      // Non-critical preference.
    }
  }, [])

  const handleAdClick = useCallback((ad: PlatformAd) => {
    if (ad.tipoAcao === 'link' && ad.linkUrl) {
      if (ad.linkNovaAba ?? true) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = ad.linkUrl
      }
      return
    }

    if (ad.tipoAcao === 'modal') {
      setSelectedAd(ad)
      setModalOpen(true)
    }
  }, [])

  const handleModalButtonClick = useCallback(() => {
    if (selectedAd?.modalBotaoLink) {
      window.open(selectedAd.modalBotaoLink, '_blank', 'noopener,noreferrer')
    }
    setModalOpen(false)
  }, [selectedAd?.modalBotaoLink])

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
            'border-white/60 bg-white/82 dark:border-white/18 dark:bg-slate-950/82',
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
                      Clique para abrir
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
                {currentAd.tipoAcao === 'link' ? (
                  <ExternalLink className="h-3.5 w-3.5" />
                ) : (
                  <MousePointerClick className="h-3.5 w-3.5" />
                )}
                {isLinkAd ? 'Ver agora' : 'Abrir'}
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
              className="absolute right-1.5 top-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/65 text-slate-500 transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:bg-slate-950/55 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white sm:static sm:h-8 sm:w-8 sm:bg-transparent"
              aria-label="Ocultar anuncios por 30 minutos"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="mx-0 flex max-h-[88vh] w-[calc(100vw-24px)] max-w-2xl flex-col overflow-hidden overflow-x-hidden rounded-xl border-slate-200/80 bg-white p-0 text-slate-950 shadow-[0_30px_100px_-32px_rgba(15,23,42,0.75)] dark:border-emerald-300/15 dark:bg-[#07110d] dark:text-slate-50 sm:mx-4 sm:w-full">
          <div className="relative min-w-0 shrink-0 overflow-hidden border-b border-slate-200 bg-[linear-gradient(135deg,rgba(70,129,82,0.12),rgba(255,255,255,0.88)_48%,rgba(226,164,62,0.18))] p-4 dark:border-emerald-300/12 dark:bg-[linear-gradient(135deg,rgba(70,129,82,0.30),rgba(7,17,13,0.98)_52%,rgba(226,164,62,0.16))] sm:p-5">
            <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#E2A43E]/18 blur-3xl dark:bg-[#E2A43E]/12" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#468152]/16 blur-3xl dark:bg-[#468152]/24" />
            <DialogHeader className="relative min-w-0 p-0 pr-7">
              <div className="mb-2 inline-flex max-w-full items-center gap-1 rounded-full border border-[#468152]/25 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#468152] backdrop-blur-xl dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
                <Megaphone className="h-3 w-3" />
                Anuncio da plataforma
              </div>
              <DialogTitle className="break-words text-xl font-black leading-tight text-slate-950 dark:text-white sm:text-2xl">
                {selectedAd?.modalTitulo || 'Anuncio'}
              </DialogTitle>
              <DialogDescription className="break-words text-sm font-medium text-slate-600 dark:text-slate-300">
                Uma oportunidade selecionada para estudantes da DomineAqui.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-white p-4 dark:bg-[#07110d] sm:p-6">
            {selectedAd?.imagemUrl && (
              <div className="mb-5 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-emerald-300/12 dark:bg-[#0d1b15]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAd.imagemUrl}
                  alt={selectedAd.modalTitulo || 'Anuncio'}
                  className="max-h-[240px] w-full max-w-full object-contain sm:max-h-[320px]"
                />
              </div>
            )}
            <div
              className={cn(
                'min-w-0 max-w-none overflow-x-hidden break-words text-sm leading-relaxed text-slate-700 [overflow-wrap:anywhere] dark:text-slate-100 sm:text-base',
                '[&_*]:max-w-full',
                '[&_a]:break-words [&_a]:font-bold [&_a]:text-[#2f6f3f] [&_a]:underline [&_a]:underline-offset-2 [&_a]:[overflow-wrap:anywhere] dark:[&_a]:text-emerald-300',
                '[&_p]:mb-3 [&_p]:break-words [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:[overflow-wrap:anywhere] dark:[&_p]:text-slate-100',
                '[&_strong]:font-black [&_strong]:text-[#2f6f3f] dark:[&_strong]:text-emerald-200',
                '[&_em]:text-slate-700 dark:[&_em]:text-slate-200',
                '[&_ul]:my-4 [&_ul]:rounded-lg [&_ul]:border [&_ul]:border-slate-200 [&_ul]:bg-slate-50 [&_ul]:py-3 [&_ul]:pl-6 [&_ul]:pr-4 dark:[&_ul]:border-emerald-300/12 dark:[&_ul]:bg-white/[0.04] sm:[&_ul]:px-5',
                '[&_ol]:my-4 [&_ol]:rounded-lg [&_ol]:border [&_ol]:border-slate-200 [&_ol]:bg-slate-50 [&_ol]:py-3 [&_ol]:pl-6 [&_ol]:pr-4 dark:[&_ol]:border-emerald-300/12 dark:[&_ol]:bg-white/[0.04] sm:[&_ol]:px-5',
                '[&_li]:my-1 [&_li]:text-slate-700 dark:[&_li]:text-slate-100',
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedModalContent }}
            />
          </div>

          <DialogFooter className="flex-col gap-2 shrink-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-emerald-300/12 dark:bg-[#09150f] sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="w-full rounded-lg border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:bg-white/[0.08] sm:w-auto"
            >
              Fechar
            </Button>
            {selectedAd?.modalBotaoTexto && (
              <Button
                onClick={handleModalButtonClick}
                className="w-full min-w-0 rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] font-black text-white shadow-lg shadow-[#468152]/20 hover:brightness-105 dark:from-emerald-600 dark:to-amber-500 sm:w-auto"
              >
                <span className="min-w-0 truncate">{selectedAd.modalBotaoTexto}</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
