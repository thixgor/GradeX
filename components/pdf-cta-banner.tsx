'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Printer, ArrowRight, X } from 'lucide-react'
import { canDownloadExamPdf } from '@/lib/tier-limits'
import { QUEST_LABEL, ROTA_ASSINATURA } from '@/lib/account-tier'
import { useRotuloDoAcervo } from '@/hooks/use-rotulo-do-acervo'
import { cn } from '@/lib/utils'

interface PdfCtaBannerProps {
  accountType?: string | null
  isAdmin?: boolean
  className?: string
  /** Versão de uma linha só, para caber dentro de um cartão já cheio (pré-início da prova). */
  compact?: boolean
}

const DISMISS_STORAGE_KEY = 'domineaqui-pdf-cta-banner-dismissed-until'
const DISMISS_MS = 24 * 60 * 60 * 1000

/**
 * O anúncio fixo do Quest+, para quem está navegando as provas sem assinar.
 *
 * Existe ao lado de `PremiumPdfCtaModal` (não no lugar dele): o modal reage a
 * um clique em "baixar PDF" — alguém que já decidiu o que quer. Este banner
 * aparece sem que a pessoa peça nada, em duas telas onde ela ainda está
 * decidindo se vai baixar prova: a lista de provas (`/provas`) e a tela de
 * início de uma prova específica (`/exam/[id]`, antes de começar). O texto por
 * isso não reage a nenhum clique — é o convite, não a resposta a um pedido.
 *
 * Fica fora do fluxo de resposta da prova de propósito: só aparece nas telas
 * onde a pessoa ainda não começou a responder. `PlatformAds`
 * (`components/platform-ads.tsx`) esconde os anúncios genéricos da plataforma
 * inteira em `/exam` para não distrair quem está no meio da prova — este
 * banner respeita a mesma regra ficando apenas na tela de início.
 *
 * Dispensável por 24h (`localStorage`): é conteúdo fixo da página, não uma
 * interrupção — não precisa ser tão discreto quanto o carrossel de anúncios
 * (30min), mas também não deve voltar a cada navegação dentro da mesma sessão.
 */
export function PdfCtaBanner({ accountType, isAdmin, className, compact = false }: PdfCtaBannerProps) {
  const router = useRouter()
  const [dismissed, setDismissed] = useState(true)
  const jaTemAcesso = canDownloadExamPdf(accountType, isAdmin)
  const rotuloAcervo = useRotuloDoAcervo(!jaTemAcesso)

  useEffect(() => {
    if (jaTemAcesso) return
    try {
      const dismissedUntil = Number(localStorage.getItem(DISMISS_STORAGE_KEY) || 0)
      setDismissed(dismissedUntil > Date.now())
    } catch {
      setDismissed(false)
    }
  }, [jaTemAcesso])

  if (jaTemAcesso || dismissed) return null

  function assinar() {
    router.push(ROTA_ASSINATURA)
  }

  function fechar() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now() + DISMISS_MS))
    } catch {
      // Preferência não-crítica: sem storage, o banner só volta a aparecer sempre.
    }
  }

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-3.5 py-2.5',
          className,
        )}
      >
        <div className="flex-shrink-0 p-1.5 rounded-lg bg-amber-500/15">
          <Printer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="min-w-0 flex-1 text-xs text-muted-foreground leading-snug">
          Quer levar esta prova para o papel? O <strong className="text-foreground">{QUEST_LABEL}</strong> baixa
          prova, gabarito e resposta comentada — e libera {rotuloAcervo.toLowerCase()}.
        </p>
        <button
          onClick={assinar}
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-white text-xs font-semibold px-3 py-1.5 transition-all"
        >
          Ver planos
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={fechar}
          aria-label="Ocultar por 24 horas"
          className="flex-shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent',
        className,
      )}
    >
      <button
        onClick={fechar}
        aria-label="Ocultar por 24 horas"
        className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground/60 hover:text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
        <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/15">
          <Printer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="min-w-0 flex-1 pr-6 sm:pr-0">
          <p className="text-sm font-semibold leading-tight">Quer imprimir as provas?</p>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            O <strong className="text-foreground">{QUEST_LABEL}</strong> baixa qualquer prova em PDF — com gabarito
            e resposta comentada — e libera {rotuloAcervo.toLowerCase()} no Banco de Questões.
          </p>
        </div>

        <button
          onClick={assinar}
          className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-white text-xs font-semibold px-4 py-2.5 shadow-md shadow-amber-500/20 transition-all"
        >
          Conhecer o {QUEST_LABEL}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
