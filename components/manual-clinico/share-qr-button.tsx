'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, QrCode, X, Download } from 'lucide-react'

interface ShareQRButtonProps {
  url: string
  title?: string
  /** Size variant of the trigger button */
  variant?: 'inline' | 'full'
}

export function ShareQRButton({ url, title, variant = 'inline' }: ShareQRButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const svg = document.getElementById('share-qr-svg-large')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = `qrcode-${(title || 'compartilhar').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ver QR Code"
        title="Ver QR Code"
        className={
          variant === 'full'
            ? 'relative group/qr shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95'
            : 'relative group/qr shrink-0 flex items-center justify-center h-9 w-9 rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95'
        }
      >
        <div className="p-0.5 rounded-md bg-white">
          <QRCodeSVG
            value={url}
            size={22}
            level="M"
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <span className="pointer-events-none absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary shadow-md shadow-primary/50 opacity-0 group-hover/qr:opacity-100 transition-opacity" />
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
              onClick={() => setOpen(false)}
            >
              {/* Glass backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.12] bg-white/[0.06] backdrop-blur-2xl shadow-2xl shadow-black/50"
              >
                {/* Ambient gradient glow */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/10" />
                <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />

                <div className="relative p-5 sm:p-7">
                  {/* Close */}
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    className="absolute top-3 right-3 flex items-center justify-center h-8 w-8 rounded-full border border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white transition-all active:scale-95 backdrop-blur-md"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4 pr-10">
                    <div className="flex items-center justify-center h-8 w-8 rounded-xl border border-white/[0.1] bg-white/[0.06] text-primary">
                      <QrCode className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                        QR Code
                      </div>
                      {title && (
                        <div className="text-sm font-semibold text-white truncate">
                          {title}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR container */}
                  <div className="relative mx-auto w-fit">
                    <div className="relative rounded-2xl bg-white p-4 sm:p-5 shadow-2xl shadow-black/40 ring-1 ring-white/20">
                      <QRCodeSVG
                        id="share-qr-svg-large"
                        value={url}
                        size={220}
                        level="H"
                        bgColor="#ffffff"
                        fgColor="#0a0a0a"
                        marginSize={0}
                      />
                    </div>
                    {/* Corner accents */}
                    <span className="pointer-events-none absolute -top-1 -left-1 h-4 w-4 border-t-2 border-l-2 border-primary/70 rounded-tl-lg" />
                    <span className="pointer-events-none absolute -top-1 -right-1 h-4 w-4 border-t-2 border-r-2 border-primary/70 rounded-tr-lg" />
                    <span className="pointer-events-none absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-primary/70 rounded-bl-lg" />
                    <span className="pointer-events-none absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-primary/70 rounded-br-lg" />
                  </div>

                  {/* URL */}
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2 backdrop-blur-sm">
                    <span className="text-xs text-white/60 truncate flex-1">{url}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopy}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] backdrop-blur-md ${
                        copied
                          ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                          : 'border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.12] text-white'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Copiar link
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.12] text-white px-3 py-2.5 text-sm font-medium transition-all active:scale-[0.98] backdrop-blur-md"
                    >
                      <Download className="h-4 w-4" /> Baixar
                    </button>
                  </div>

                  <p className="mt-4 text-center text-[11px] text-white/50">
                    Aponte a câmera do celular para acessar
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
