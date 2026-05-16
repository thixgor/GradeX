'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const COPYRIGHT_TERMS_URL =
  'https://drive.google.com/file/d/1YjgRZZV_cQQkLdD7SrNGbCdSrzn13sKo/view?usp=sharing'

interface PdfDownloadTermsModalProps {
  open: boolean
  materialTitle: string
  loading?: boolean
  onClose: () => void
  onAccept: () => void
}

export function PdfDownloadTermsModal({
  open,
  materialTitle,
  loading = false,
  onClose,
  onAccept,
}: PdfDownloadTermsModalProps) {
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (open) setAccepted(false)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden border-amber-500/25">
        <DialogHeader className="border-b border-border/60 bg-amber-500/10">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Termos de download individual</DialogTitle>
              <DialogDescription>
                Antes de baixar este PDF, confirme que o uso será pessoal e individual.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5 text-sm text-muted-foreground">
          <p>
            O material <span className="font-semibold text-foreground">{materialTitle}</span> é protegido por
            Copyright e direitos autorais. A distribuição, compartilhamento, revenda, publicação,
            disponibilização em grupos, plataformas ou qualquer repasse a terceiros não é autorizada.
          </p>
          <p>
            O download é liberado somente para uso individual do titular da conta, nos termos da Lei 9.610/1998.
          </p>
          <a
            href={COPYRIGHT_TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            Acessar arquivo de termos de Copyright
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="text-xs">
            Documento assinado digitalmente em 16/05/2026 às 15:43:51-0300 via gov.br.
          </p>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
            <Checkbox
              checked={accepted}
              onCheckedChange={setAccepted}
              className="mt-0.5"
            />
            <span className="text-sm leading-relaxed">
              Li e aceito os termos de download, declarando que a distribuição será individual e somente
              individual, exclusivamente para meu uso pessoal.
            </span>
          </label>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" onClick={onAccept} disabled={!accepted || loading}>
            {loading ? 'Preparando...' : 'Aceitar e baixar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
