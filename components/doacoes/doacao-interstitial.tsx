'use client'

import { useEffect, useState } from 'react'
import { X, SkipForward } from 'lucide-react'
import { DoacaoContent } from './doacao-content'
import { DoacaoForm } from './doacao-form'
import { shouldShowInterstitial, markInterstitialShown } from '@/lib/doacao-interstitial'

type InterstitialContext = 'manual-clinico' | 'exam'

interface DoacaoInterstitialProps {
  context: InterstitialContext
  onClose: () => void
}

export function DoacaoInterstitial({ context, onClose }: DoacaoInterstitialProps) {
  const [visible, setVisible] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Verificar se deve mostrar (localStorage + settings da API)
    async function check() {
      if (!shouldShowInterstitial(context)) {
        onClose()
        return
      }

      try {
        const res = await fetch('/api/doacoes/settings')
        const data = await res.json()
        const flagKey = context === 'manual-clinico'
          ? 'doacaoInterstitialManualClinico'
          : 'doacaoInterstitialExams'

        if (!data[flagKey]) {
          onClose()
          return
        }
      } catch {
        onClose()
        return
      }

      setVisible(true)
      markInterstitialShown(context)
    }
    check()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!mounted || !visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
        style={{ animation: 'fadeIn 0.3s ease' }}
      >
        <div
          className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl relative"
          style={{ animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        >
          {/* Topo da interstitial */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-base">❤️</span>
              <span className="font-medium text-foreground">Apoie o DomineAqui</span>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all border border-border/50 hover:border-border"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Pular
            </button>
          </div>

          {/* Conteúdo */}
          <div className="p-4 sm:p-5">
            <DoacaoContent
              compact={false}
              onDonateClick={() => {
                setVisible(false)
                setFormOpen(true)
              }}
            />
          </div>

          {/* Rodapé com pular */}
          <div className="px-4 pb-4">
            <button
              onClick={handleClose}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors underline underline-offset-2"
            >
              Pular por agora e continuar
            </button>
          </div>
        </div>
      </div>

      {/* Formulário de confirmação de doação */}
      <DoacaoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          onClose()
        }}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
