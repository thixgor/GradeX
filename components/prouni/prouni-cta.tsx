'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, Clock, GraduationCap, LogIn, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * "Sou PROUNI/FIES, quero desconto" na página do produto.
 *
 * Some sozinho quando não há nada a oferecer: se o admin não configurou
 * benefício para este item, `/api/prouni/beneficio` responde `null` e o
 * componente não renderiza nada. É por isso que ele pode ser pendurado em
 * qualquer página de produto sem virar poluição nas que não participam.
 *
 * Também mostra o estado de quem já pediu — em análise, aprovado, recusado —,
 * porque a alternativa é a pessoa reenviar o formulário achando que o primeiro
 * envio se perdeu, que é exatamente o comportamento que enche a fila do admin.
 */

export interface ProuniCtaProps {
  itemType: 'material' | 'package' | 'manual_clinico' | 'plus'
  itemId: string
  className?: string
  /** `compacto` cabe na coluna de compra; `completo` ocupa a largura da seção. */
  variante?: 'compacto' | 'completo'
  /**
   * `dark` para superfícies que já são escuras nos dois temas (o checkout do
   * Manual Clínico). Sem isso o texto do chamativo herdaria a cor do tema
   * claro sobre um cartão escuro e ficaria ilegível justamente onde a pessoa
   * está decidindo a compra.
   */
  aparencia?: 'app' | 'dark'
}

interface Beneficio {
  discountLabel: string
  stackWithTier: boolean
  instructions: string
}

interface Solicitacao {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewNotes: string
  grant: { discountLabel: string; usage: string } | null
}

export function ProuniCta({ itemType, itemId, className, variante = 'compacto', aparencia = 'app' }: ProuniCtaProps) {
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null)
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null)
  /*
   * A rota é aberta a visitante de propósito (ver app/api/prouni/beneficio),
   * e devolve junto se há sessão. Isso importa porque o benefício NÃO é cupom:
   * ele não tem código, não vale por link e não se aplica sozinho numa compra
   * anônima — ele nasce de uma solicitação analisada, presa a uma conta. Sem
   * dizer isso, a tela de compra anuncia um desconto que a pessoa não tem como
   * usar ali, e a promessa vira reclamação depois do pagamento.
   */
  const [autenticado, setAutenticado] = useState<boolean | null>(null)

  useEffect(() => {
    let ativo = true
    if (!itemId) return
    fetch(`/api/prouni/beneficio?itemType=${encodeURIComponent(itemType)}&itemId=${encodeURIComponent(itemId)}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!ativo || !json?.benefit) return
        setBeneficio(json.benefit)
        setSolicitacao(json.request || null)
        setAutenticado(json.authenticated === true)
      })
      // Silêncio proposital: isto decora uma página de venda. Uma falha aqui
      // não pode aparecer como erro numa tela onde a pessoa está comprando.
      .catch(() => {})
    return () => { ativo = false }
  }, [itemType, itemId])

  if (!beneficio) return null

  const escuro = aparencia === 'dark'
  const corTitulo = escuro ? 'text-white' : 'text-foreground'
  const corTexto = escuro ? 'text-white/70' : 'text-muted-foreground'
  const href = `/prouni-fies/${itemType}/${encodeURIComponent(itemId)}`
  const aprovado = solicitacao?.status === 'approved' && solicitacao.grant?.usage !== 'used'
  const emAnalise = solicitacao?.status === 'pending'
  const recusado = solicitacao?.status === 'rejected'

  return (
    <div
      className={cn(
        'rounded-xl border border-sky-500/30 bg-sky-500/10 p-3',
        escuro && 'border-sky-400/40 bg-sky-400/10',
        variante === 'completo' && 'sm:p-4',
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className={cn('mt-0.5 rounded-lg bg-sky-500/15 p-1.5', escuro ? 'text-sky-200' : 'text-sky-600 dark:text-sky-300')}>
          <GraduationCap className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          {aprovado ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="h-4 w-4 shrink-0" />
                Desconto PROUNI/FIES aprovado
              </p>
              <p className={cn('mt-0.5 text-xs', corTexto)}>
                Seu {solicitacao?.grant?.discountLabel} é aplicado sozinho no checkout deste item.
              </p>
            </>
          ) : emAnalise ? (
            <>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0" />
                Solicitação em análise
              </p>
              <p className={cn('mt-0.5 text-xs', corTexto)}>
                Avisaremos assim que o comprovante for conferido.
              </p>
            </>
          ) : (
            <>
              <p className={cn('text-sm font-semibold', corTitulo)}>
                É bolsista ProUni ou FIES? Você tem {beneficio.discountLabel} neste item.
              </p>
              <p className={cn('mt-0.5 text-xs', corTexto)}>
                {beneficio.instructions
                  ? beneficio.instructions
                  : 'Envie o comprovante uma vez. Aprovado, o desconto entra sozinho no seu checkout.'}
              </p>
              {beneficio.stackWithTier && (
                <p className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Soma com o desconto de lote em andamento.
                </p>
              )}
              {/* O desconto não é código nem link: é uma solicitação analisada,
                  presa a uma conta. Dito aqui, antes do pagamento — e não
                  descoberto depois, quando o preço cheio já foi cobrado. */}
              <p className={cn('mt-1.5 text-[11px] leading-snug', corTexto)}>
                {autenticado === false
                  ? 'Não é cupom: o desconto vale por conta. Entre (ou crie uma conta), envie o comprovante e, aprovado, ele entra sozinho no checkout deste item.'
                  : 'Não é cupom: peça o desconto pela sua conta, envie o comprovante e, aprovado, ele entra sozinho no checkout deste item.'}
              </p>
              {recusado && solicitacao?.reviewNotes && (
                <p className="mt-1 flex items-start gap-1 text-[11px] text-rose-600 dark:text-rose-300">
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                  Solicitação anterior recusada: {solicitacao.reviewNotes}
                </p>
              )}
              <Link
                href={href}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
              >
                {autenticado === false ? <LogIn className="h-3.5 w-3.5" /> : null}
                {autenticado === false
                  ? 'Entrar e solicitar o desconto'
                  : 'Sou PROUNI/FIES, quero desconto'}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
