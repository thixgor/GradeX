'use client'

import { useRouter } from 'next/navigation'
import { Crown, FileText, ListChecks, BookOpenCheck, Package2, X, Sparkles, Play } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface PremiumPdfCtaModalProps {
  open: boolean
  onClose: () => void
  onTakeExam?: () => void
}

const BENEFITS = [
  { icon: FileText,     label: 'Prova em branco',    color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { icon: ListChecks,   label: 'Só o gabarito',       color: 'text-amber-500',   bg: 'bg-amber-500/10'   },
  { icon: BookOpenCheck, label: 'Gabarito comentado', color: 'text-blue-500',    bg: 'bg-blue-500/10'    },
  { icon: Package2,     label: 'Pacote do grupo',     color: 'text-violet-500',  bg: 'bg-violet-500/10'  },
]

export function PremiumPdfCtaModal({ open, onClose, onTakeExam }: PremiumPdfCtaModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="p-0 overflow-hidden border-0 shadow-2xl w-[calc(100vw-2rem)] max-w-sm rounded-2xl">

        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-500 px-5 pt-5 pb-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Decorative glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.25)_0%,_transparent_60%)] pointer-events-none" />

          <div className="relative flex flex-col items-center text-center gap-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
              <Crown className="h-6 w-6 text-white drop-shadow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="h-2.5 w-2.5" />
                Recurso exclusivo
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">
                Download de PDF
              </h2>
              <p className="text-white/80 text-xs mt-0.5">
                Disponível nos planos <strong className="text-white">Plus+</strong> e <strong className="text-white">Plus+</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pt-4 pb-5 space-y-4">

          {/* Clarification banner */}
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
            <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-snug">
              <strong>Fazer a prova é gratuito!</strong> O plano Plus+ é necessário apenas para <strong>baixar o PDF</strong>.
            </p>
          </div>

          {/* Benefits 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {BENEFITS.map(({ icon: Icon, label, color, bg }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-border/40 bg-muted/30 px-3 py-2.5"
              >
                <div className={`flex-shrink-0 p-1.5 rounded-lg ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <span className="text-xs font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); router.push('/buy') }}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all duration-150"
          >
            <Crown className="h-4 w-4" />
            Ver planos Premium
          </button>

          {/* Take exam instead (only shown when triggered from a specific exam) */}
          {onTakeExam && (
            <button
              onClick={() => { onClose(); onTakeExam() }}
              className="w-full h-10 rounded-xl border border-border bg-muted/40 hover:bg-muted/70 active:scale-[0.98] text-foreground font-medium text-sm flex items-center justify-center gap-2 transition-all duration-150"
            >
              <Play className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Continuar e fazer a prova (sem PDF)
            </button>
          )}

          {/* Dismiss */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5"
          >
            Agora não
          </button>
        </div>

      </DialogContent>
    </Dialog>
  )
}
