'use client'

import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Link de material complementar: antes de sair do site, avisa que a
 * plataforma não hospeda nem se responsabiliza pelo conteúdo do link.
 */
export function LinkExternoSeguro({ url, dominio, children }: { url: string; dominio: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="text-left">
        {children}
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAberto(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">Você está saindo do DomineAqui</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Este material está em <strong className="text-foreground">{dominio}</strong>, indicado pelo monitor. A plataforma não
                    hospeda, não revisa e não se responsabiliza por conteúdo acessado por link externo.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAberto(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    window.open(url, '_blank', 'noopener,noreferrer')
                    setAberto(false)
                  }}
                >
                  Abrir link <ExternalLink className="ml-1.5 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
