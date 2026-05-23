'use client'

import { useRouter } from 'next/navigation'
import { Crown, FileText, ListChecks, BookOpenCheck, Layers, Lock } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PremiumPdfCtaModalProps {
  open: boolean
  onClose: () => void
}

const BENEFITS = [
  { icon: <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />, label: 'PDF da prova em branco' },
  { icon: <ListChecks className="h-4 w-4 text-amber-600 dark:text-amber-400" />, label: 'Gabarito completo' },
  { icon: <BookOpenCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />, label: 'Resposta comentada' },
  { icon: <Layers className="h-4 w-4 text-violet-600 dark:text-violet-400" />, label: 'Pacote com todas as provas do grupo' },
]

export function PremiumPdfCtaModal({ open, onClose }: PremiumPdfCtaModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
            Download exclusivo para assinantes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            Baixar os PDFs das provas é um recurso dos planos{' '}
            <span className="font-semibold text-foreground">Premium</span> e{' '}
            <span className="font-semibold text-foreground">Essential</span>. Faça upgrade para liberar:
          </p>

          <div className="space-y-2">
            {BENEFITS.map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5"
              >
                <div className="flex-shrink-0">{b.icon}</div>
                <span className="text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 flex-shrink-0" />
            Seu plano atual não inclui o download de provas em PDF.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Agora não
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-500/90 hover:to-orange-500/90"
            onClick={() => { onClose(); router.push('/buy') }}
          >
            <Crown className="h-4 w-4 mr-1.5" />
            Ver planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
