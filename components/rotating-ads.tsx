'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Anuncio {
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

interface RotatingAdsProps {
  className?: string
  maxHeight?: string
}

export function RotatingAds({ className, maxHeight = '250px' }: RotatingAdsProps) {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedAnuncio, setSelectedAnuncio] = useState<Anuncio | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Fetch anuncios from API
  useEffect(() => {
    async function fetchAnuncios() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/admin/anuncios')
        if (!response.ok) {
          throw new Error('Falha ao carregar anuncios')
        }
        const data = await response.json()
        // Filter active ads and sort by order
        const activeAds = (data.anuncios || data || [])
          .filter((ad: Anuncio) => ad.ativo)
          .sort((a: Anuncio, b: Anuncio) => a.ordem - b.ordem)
        setAnuncios(activeAds)
        setError(null)
      } catch (err) {
        setError('Erro ao carregar anuncios')
        console.error('Error fetching anuncios:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnuncios()
  }, [])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (anuncios.length <= 1) return

    const interval = setInterval(() => {
      goToNext()
    }, 5000)

    return () => clearInterval(interval)
  }, [anuncios.length, currentIndex])

  const goToNext = useCallback(() => {
    if (anuncios.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % anuncios.length)
      setIsTransitioning(false)
    }, 300)
  }, [anuncios.length])

  const goToPrevious = useCallback(() => {
    if (anuncios.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + anuncios.length) % anuncios.length)
      setIsTransitioning(false)
    }, 300)
  }, [anuncios.length])

  const goToIndex = useCallback((index: number) => {
    if (index === currentIndex) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 300)
  }, [currentIndex])

  const handleAdClick = (anuncio: Anuncio) => {
    if (anuncio.tipoAcao === 'link' && anuncio.linkUrl) {
      if (anuncio.linkNovaAba) {
        window.open(anuncio.linkUrl, '_blank', 'noopener,noreferrer')
      } else {
        window.location.href = anuncio.linkUrl
      }
    } else if (anuncio.tipoAcao === 'modal') {
      setSelectedAnuncio(anuncio)
      setModalOpen(true)
    }
  }

  const handleModalButtonClick = () => {
    if (selectedAnuncio?.modalBotaoLink) {
      window.open(selectedAnuncio.modalBotaoLink, '_blank', 'noopener,noreferrer')
    }
    setModalOpen(false)
  }

  // Don't render if loading, error, or no ads
  if (isLoading) {
    return (
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden bg-gradient-to-r from-[#468152]/10 to-[#E2A43E]/10 animate-pulse",
          className
        )}
        style={{ height: maxHeight }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#468152] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error || anuncios.length === 0) {
    return null
  }

  const currentAnuncio = anuncios[currentIndex]

  return (
    <>
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden group bg-gradient-to-r from-[#468152]/5 to-[#E2A43E]/5",
          className
        )}
      >
        {/* Main Ad Image */}
        <div
          className={cn(
            "relative w-full cursor-pointer transition-opacity duration-300 flex items-center justify-center",
            isTransitioning ? "opacity-0" : "opacity-100"
          )}
          style={{ maxHeight }}
          onClick={() => handleAdClick(currentAnuncio)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAnuncio.imagemUrl}
            alt={currentAnuncio.modalTitulo || 'Anuncio'}
            className="w-full h-auto max-h-full object-contain rounded-xl"
            style={{ maxHeight }}
          />

          {/* Gradient overlay for better visibility of controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl pointer-events-none" />
        </div>

        {/* Navigation Arrows - Only show if more than 1 ad */}
        {anuncios.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#468152] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#468152]"
              aria-label="Anuncio anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#468152] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-[#468152]"
              aria-label="Proximo anuncio"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicator Dots */}
        {anuncios.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {anuncios.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  goToIndex(index)
                }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E2A43E] focus:ring-offset-2",
                  index === currentIndex
                    ? "bg-[#E2A43E] w-6"
                    : "bg-white/70 hover:bg-white"
                )}
                aria-label={`Ir para anuncio ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {anuncios.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
            <div
              className="h-full bg-gradient-to-r from-[#468152] to-[#E2A43E] transition-all duration-100"
              style={{
                animation: 'progress 5s linear infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Modal for modal-type ads */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg border-2 border-[#468152]/20 bg-gradient-to-br from-white to-[#468152]/5">
          <DialogHeader className="border-b border-[#468152]/10 pb-4">
            <DialogTitle className="text-xl font-bold text-[#468152]">
              {selectedAnuncio?.modalTitulo || 'Anuncio'}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            {selectedAnuncio?.imagemUrl && (
              <div className="mb-4 rounded-lg overflow-hidden flex items-center justify-center bg-muted/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedAnuncio.imagemUrl}
                  alt={selectedAnuncio.modalTitulo || 'Anuncio'}
                  className="max-w-full max-h-48 w-auto h-auto object-contain rounded-lg"
                />
              </div>
            )}

            <DialogDescription className="text-base text-foreground/80 whitespace-pre-wrap">
              {selectedAnuncio?.modalConteudo || ''}
            </DialogDescription>
          </div>

          <DialogFooter className="border-t border-[#468152]/10 pt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-[#468152]/30 text-[#468152] hover:bg-[#468152]/10"
            >
              Fechar
            </Button>
            {selectedAnuncio?.modalBotaoTexto && (
              <Button
                onClick={handleModalButtonClick}
                className="bg-gradient-to-r from-[#468152] to-[#5a9968] hover:from-[#3d7047] hover:to-[#4d8559] text-white shadow-lg"
              >
                {selectedAnuncio.modalBotaoTexto}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSS for progress bar animation */}
      <style jsx>{`
        @keyframes progress {
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
