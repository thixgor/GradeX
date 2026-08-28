'use client'

/**
 * "Sua assinatura" — o cartão que faltava.
 *
 * O QUE ISTO CONSERTA
 * -------------------
 * A assinatura recorrente era o único produto da plataforma que cobrava de
 * novo sozinho e o único que não aparecia em lugar nenhum depois da compra. O
 * banco guardava valor, ciclo, próxima cobrança e data de fim do período pago;
 * a interface não mostrava nada disso. Quem quisesse conferir quanto paga e
 * quando precisava abrir a fatura do cartão — e cobrança que o cliente não
 * consegue verificar no site é a definição operacional de chargeback.
 *
 * O botão de cancelar existia, mas morava no terceiro lugar de uma fileira de
 * botões dentro da seção "Conta" da aba "Configurações", e nada no site levava
 * até lá: o checkout prometia "cancele quando quiser no seu perfil" em texto
 * puro e o botão "Gerenciar no perfil" de /buy abria a Visão geral, onde não
 * havia uma linha sobre a assinatura. O cancelamento self-service existia no
 * código e virava atendimento humano na prática.
 *
 * DEPOIS DE CANCELAR, A TELA PRECISA MUDAR
 * ----------------------------------------
 * `cancelAtPeriodEnd` fica `true` mas o `status` continua 'authorized' de
 * propósito — é o que mantém o acesso até o fim do período já pago. Como a
 * antiga checagem olhava só o status, o botão "Cancelar assinatura" reaparecia
 * idêntico no reload e o cancelamento parecia não ter funcionado. Aqui o
 * estado cancelado tem cara própria: some o botão de cancelar, aparece a data
 * até quando o acesso vale, e a única ação oferecida é assinar de novo.
 *
 * Não existe "reativar": o cancelamento encerra o preapproval no Mercado Pago
 * na hora, e preapproval cancelada não volta. Oferecer um botão de desfazer
 * seria prometer o que o provedor não faz.
 */

import { useRouter } from 'next/navigation'
import {
  CalendarClock,
  CreditCard,
  Crown,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Undo2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  diasDeGarantiaRestantes,
  rotuloDeCicloDeCobranca,
  type MesesDeRecorrencia,
} from '@/lib/payments/subscription-view'
import { cn } from '@/lib/utils'

/** Espelha o objeto `recurring` de /api/user/subscription-status. */
export interface RecurringSubscription {
  planId: string
  planName: string
  amount: number
  currency: string
  billingIntervalMonths: MesesDeRecorrencia
  status: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  currentPeriodEndsAt: string | null
  nextBillingAt: string | null
  lastPaymentAt: string | null
  startedAt: string | null
}

function formatarBRL(valor: number): string {
  return `R$ ${Number(valor || 0).toFixed(2).replace('.', ',')}`
}

function formatarData(valor: string | null): string | null {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR')
}

export function SubscriptionCard({
  recurring,
  onCancelar,
  cancelando = false,
  className,
}: {
  recurring: RecurringSubscription
  onCancelar: () => void
  cancelando?: boolean
  className?: string
}) {
  const router = useRouter()

  const cancelada = recurring.cancelAtPeriodEnd
  const pendente = recurring.status === 'pending'
  const pausada = recurring.status === 'paused'

  const ciclo = rotuloDeCicloDeCobranca(recurring.billingIntervalMonths)
  const fimDoPeriodo = formatarData(recurring.currentPeriodEndsAt)
  const proximaCobranca = formatarData(recurring.nextBillingAt)
  const garantiaRestante = diasDeGarantiaRestantes(recurring.startedAt)

  const selo = cancelada
    ? { texto: 'Cancelamento agendado', classe: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' }
    : pendente
      ? { texto: 'Aguardando o banco', classe: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300' }
      : pausada
        ? { texto: 'Pausada', classe: 'border-border bg-muted text-muted-foreground' }
        : { texto: 'Ativa · renova sozinha', classe: 'border-primary/30 bg-primary/10 text-primary' }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        cancelada && 'border-amber-500/35',
        className,
      )}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={cn(
                'mb-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide',
                selo.classe,
              )}
            >
              <Crown className="h-3 w-3" aria-hidden />
              {selo.texto}
            </span>
            <h3 className="truncate font-heading text-xl font-semibold tracking-tight text-foreground">
              {recurring.planName}
            </h3>
          </div>

          <div className="text-right">
            <p className="font-heading text-2xl font-semibold tabular-nums tracking-tight text-foreground">
              {formatarBRL(recurring.amount)}
            </p>
            <p className="text-xs text-muted-foreground">por {ciclo}</p>
          </div>
        </div>

        {/* ── A linha que responde "quando sai o dinheiro de novo?" ────────── */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 text-sm">
            {cancelada ? (
              <>
                <p className="font-semibold text-foreground">
                  Cancelada — não haverá nova cobrança.
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  {fimDoPeriodo
                    ? <>Seu acesso continua até <strong className="text-foreground">{fimDoPeriodo}</strong>. Depois disso a conta volta ao plano Gratuito automaticamente.</>
                    : 'Seu acesso continua até o fim do período que você já pagou.'}
                </p>
              </>
            ) : pendente ? (
              <>
                <p className="font-semibold text-foreground">Aguardando a autorização do seu banco.</p>
                <p className="mt-0.5 text-muted-foreground">
                  Assim que o cartão for aprovado, o acesso é liberado e você recebe um e-mail de confirmação.
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  {proximaCobranca ? (
                    <>
                      Próxima cobrança de{' '}
                      <strong className="text-foreground">{formatarBRL(recurring.amount)}</strong> em{' '}
                      <strong className="text-foreground">{proximaCobranca}</strong>, no mesmo cartão.
                    </>
                  ) : (
                    <>
                      Renova automaticamente a cada {ciclo}
                      {fimDoPeriodo ? <> — o período atual vai até <strong className="text-foreground">{fimDoPeriodo}</strong></> : ''}.
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Você pode cancelar a qualquer momento e continua com acesso até o fim do período já pago.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Ações ───────────────────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap gap-2">
          {cancelada ? (
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-md bg-secondary text-xs font-bold text-secondary-foreground hover:bg-secondary/90"
              onClick={() => router.push('/buy')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Assinar de novo
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={cancelando}
              onClick={onCancelar}
              className="h-9 gap-1.5 rounded-md border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
            >
              {cancelando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Cancelar assinatura
            </Button>
          )}

          {/*
            Garantia de 7 dias: o FAQ de /buy promete devolução integral e
            manda a pessoa procurar o WhatsApp. Dentro do prazo, o pedido passa
            a ter um botão no mesmo lugar onde ela vê a cobrança.
          */}
          {garantiaRestante > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push('/profile?tab=atendimento&assunto=reembolso')}
              className="h-9 gap-1.5 rounded-md text-xs font-semibold"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Pedir reembolso · {garantiaRestante}{' '}
              {garantiaRestante === 1 ? 'dia restante' : 'dias restantes'}
            </Button>
          )}
        </div>
      </div>

      <p className="flex items-center gap-2 border-t border-border bg-muted/30 px-5 py-2.5 text-[11px] text-muted-foreground sm:px-6">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
        Cobrança processada pelo Mercado Pago
        <CreditCard className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden />
      </p>
    </div>
  )
}
