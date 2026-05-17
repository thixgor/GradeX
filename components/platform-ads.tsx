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
        const response = await fetch('/api/admin/anuncios?status=active', {
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
        <DialogContent className="max-w-2xl overflow-hidden border-white/40 bg-white/90 p-0 shadow-[0_30px_100px_-32px_rgba(15,23,42,0.75)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/92">
          <div className="relative overflow-hidden border-b border-white/35 bg-[linear-gradient(135deg,rgba(70,129,82,0.18),rgba(255,255,255,0.34)_46%,rgba(226,164,62,0.22))] p-5 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(70,129,82,0.22),rgba(15,23,42,0.35)_48%,rgba(226,164,62,0.16))]">
            <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-[#E2A43E]/25 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#468152]/20 blur-3xl" />
            <DialogHeader className="relative pr-7">
              <div className="mb-2 inline-flex w-fit items-center gap-1 rounded-full border border-[#468152]/25 bg-white/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#468152] backdrop-blur-xl dark:border-white/15 dark:bg-white/10 dark:text-emerald-200">
                <Megaphone className="h-3 w-3" />
                Anuncio da plataforma
              </div>
              <DialogTitle className="text-xl font-black leading-tight sm:text-2xl">
                {selectedAd?.modalTitulo || 'Anuncio'}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Uma oportunidade selecionada para estudantes da DomineAqui.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-5 sm:p-6">
            {selectedAd?.imagemUrl && (
              <div className="mb-5 overflow-hidden rounded-xl border border-white/50 bg-white/70 p-2 shadow-inner dark:border-white/10 dark:bg-slate-900/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAd.imagemUrl}
                  alt={selectedAd.modalTitulo || 'Anuncio'}
                  className="max-h-[320px] w-full object-contain"
                />
              </div>
            )}
            <div
              className={cn(
                'prose prose-sm max-w-none text-foreground dark:prose-invert sm:prose-base',
                '[&_a]:font-bold [&_a]:text-[#468152] dark:[&_a]:text-emerald-300',
                '[&_p]:leading-relaxed [&_strong]:text-[#468152] dark:[&_strong]:text-emerald-200',
                '[&_ul]:rounded-lg [&_ul]:bg-muted/35 [&_ul]:py-3 [&_li]:my-1',
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedModalContent }}
            />
          </div>

          <DialogFooter className="border-t border-white/35 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-lg">
              Fechar
            </Button>
            {selectedAd?.modalBotaoTexto && (
              <Button
                onClick={handleModalButtonClick}
                className="rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] font-black text-white shadow-lg shadow-[#468152]/20 hover:brightness-105"
              >
                {selectedAd.modalBotaoTexto}
                <ArrowRight className="ml-2 h-4 w-4" />
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
