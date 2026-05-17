'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Megaphone,
  MousePointerClick,
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
        className="fixed bottom-3 left-1/2 z-[35] w-[min(430px,calc(100vw-104px))] -translate-x-1/2 print:hidden sm:bottom-4 sm:w-[min(460px,calc(100vw-2rem))]"
        aria-label="Anuncio da plataforma"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative overflow-hidden rounded-xl border border-white/45 bg-white/68 text-slate-900 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/68 dark:text-white">
          {ads.length > 1 && !paused && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-black/10 dark:bg-white/10">
              <div
                key={currentAd._id}
                className="h-full bg-gradient-to-r from-[#468152] via-[#E2A43E] to-[#CE5929]"
                style={{ animation: `platform-ad-progress ${ROTATION_MS}ms linear infinite` }}
              />
            </div>
          )}

          <div className="flex min-h-[58px] items-center gap-2 p-2">
            <button
              type="button"
              onClick={() => handleAdClick(currentAd)}
              className="group/ad flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left outline-none transition hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[#468152] dark:hover:bg-white/[0.06]"
            >
              <span className="relative flex h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-white/40 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentAd.imagemUrl}
                  alt={getAdTitle(currentAd)}
                  className="h-full w-full object-cover transition duration-300 group-hover/ad:scale-105"
                  loading="lazy"
                />
              </span>

              <span className="min-w-0 flex-1 py-0.5">
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#468152] dark:text-emerald-300">
                  <Megaphone className="h-3 w-3" />
                  Publicidade
                </span>
                <span className="mt-0.5 block truncate text-xs font-semibold leading-snug sm:text-sm">
                  {getAdTitle(currentAd)}
                </span>
              </span>

              <span className="hidden shrink-0 items-center gap-1 rounded-lg border border-[#468152]/20 bg-[#468152]/10 px-2 py-1 text-[11px] font-bold text-[#468152] dark:text-emerald-200 sm:inline-flex">
                {currentAd.tipoAcao === 'link' ? (
                  <ExternalLink className="h-3 w-3" />
                ) : (
                  <MousePointerClick className="h-3 w-3" />
                )}
                Abrir
              </span>
            </button>

            {ads.length > 1 && (
              <div className="hidden items-center gap-1 sm:flex">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-black/[0.05] hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#468152] dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
              aria-label="Ocultar anuncios por 30 minutos"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg overflow-hidden border-white/35 bg-white/85 p-0 shadow-2xl backdrop-blur-2xl dark:border-white/15 dark:bg-slate-950/88">
          <div className="border-b border-border/50 p-5">
            <DialogHeader>
              <DialogTitle className="text-lg">{selectedAd?.modalTitulo || 'Anuncio'}</DialogTitle>
              <DialogDescription>Conteudo patrocinado da plataforma</DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 p-5">
            {selectedAd?.imagemUrl && (
              <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAd.imagemUrl}
                  alt={selectedAd.modalTitulo || 'Anuncio'}
                  className="max-h-52 w-full object-contain"
                />
              </div>
            )}
            <div
              className={cn(
                'prose prose-sm max-w-none text-foreground dark:prose-invert',
                '[&_a]:font-semibold [&_a]:text-[#468152] dark:[&_a]:text-emerald-300',
              )}
              dangerouslySetInnerHTML={{ __html: sanitizedModalContent }}
            />
          </div>

          <DialogFooter className="border-t border-border/50 p-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            {selectedAd?.modalBotaoTexto && (
              <Button onClick={handleModalButtonClick} className="bg-[#468152] text-white hover:bg-[#3b7045]">
                {selectedAd.modalBotaoTexto}
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
      `}</style>
    </>
  )
}
