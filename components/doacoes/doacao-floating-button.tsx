'use client'

import { useState } from 'react'
import { Heart, X, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { DoacaoContent } from './doacao-content'
import { DoacaoForm } from './doacao-form'
import { DoacaoRanking } from './doacao-ranking'

export function DoacaoFloatingButton() {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Apoiar com doação Pix"
        className={`
          fixed bottom-5 right-5 z-40
          flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-3
          rounded-full
          bg-gradient-to-br from-[#153D1F] to-[#1e4d2a]
          border border-emerald-500/30
          text-white shadow-xl shadow-emerald-900/40
          hover:shadow-emerald-700/50 hover:border-emerald-400/50
          transition-all duration-300 hover:scale-105 active:scale-95
          doacao-float-idle
          backdrop-blur-sm
        `}
        style={{ boxShadow: '0 0 20px 2px rgba(70,129,82,0.25), 0 8px 32px rgba(0,0,0,0.3)' }}
      >
        <Heart className="h-5 w-5 text-rose-400 fill-rose-400 flex-shrink-0 doacao-heart" />
        <span className="hidden sm:inline text-sm font-semibold text-emerald-100 whitespace-nowrap">Apoiar</span>
      </button>

      {/* Modal de doação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 bg-transparent border-0 shadow-none">
          <div className="bg-background rounded-2xl overflow-hidden border border-border shadow-2xl">
            {/* Fechar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="text-lg">❤️</span>
                <h2 className="font-bold text-sm sm:text-base">Apoiar o DomineAqui</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {/* Conteúdo principal */}
              <DoacaoContent
                compact={false}
                onDonateClick={() => {
                  setOpen(false)
                  setTimeout(() => setFormOpen(true), 150)
                }}
              />

              {/* Ranking */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-border/60" />
                  <span className="text-xs text-muted-foreground font-medium px-2">Ranking de Doadores</span>
                  <div className="h-px flex-1 bg-border/60" />
                </div>
                <DoacaoRanking />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulário de confirmação */}
      <DoacaoForm open={formOpen} onClose={() => setFormOpen(false)} />
    </>
  )
}
