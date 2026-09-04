'use client'

import { useState } from 'react'
import { AlertTriangle, ArrowRight, Check, Mail, Pencil, Phone, User, Wand2 } from 'lucide-react'
import type { AccountDeliveryState } from './account-delivery-choice'

/**
 * As duas telas que ficam entre "digitei meus dados" e "paguei", na compra SEM
 * LOGIN.
 *
 * O problema que elas resolvem é o mesmo: nessa compra o e-mail é o ÚNICO
 * endereço do que foi comprado. Errar uma letra nele não dá erro em lugar
 * nenhum — o pagamento passa, a entrega sai para o vazio, e o desfecho é
 * reembolso e suporte. Antes, o único lugar onde a pessoa relia o que digitou
 * era uma linha cinza de 12px acima do formulário de cartão.
 *
 *  - `EmailQualityNotice` avisa enquanto ela digita: erro parecido com um
 *    provedor conhecido (com correção em um clique) e domínio que o DNS diz
 *    não receber e-mail.
 *  - `BuyerDataConfirmation` é a parada obrigatória antes do pagamento, com os
 *    três campos em tamanho legível e para onde a compra vai.
 */

type Tone = 'light' | 'dark'

function skinFor(tone: Tone) {
  return tone === 'dark'
    ? {
        box: 'border-white/10 bg-white/[0.06] text-white',
        title: 'text-white',
        muted: 'text-white/55',
        strong: 'text-white',
        icon: 'text-emerald-300',
        warnBox: 'border-amber-300/35 bg-amber-300/10 text-amber-100',
        warnIcon: 'text-amber-300',
        warnStrong: 'text-white',
        dangerBox: 'border-rose-400/35 bg-rose-400/10 text-rose-100',
        dangerIcon: 'text-rose-300',
        row: 'border-white/10 bg-white/[0.03]',
        fix: 'bg-amber-300 text-amber-950 hover:bg-amber-200',
        confirm: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300',
        edit: 'border-white/15 text-white hover:bg-white/[0.06]',
        checkbox: 'border-white/30',
        checkboxActive: 'border-amber-300 bg-amber-300 text-amber-950',
      }
    : {
        box: 'border-border bg-muted/40 text-foreground',
        title: 'text-foreground',
        muted: 'text-muted-foreground',
        strong: 'text-foreground',
        icon: 'text-emerald-600 dark:text-emerald-400',
        warnBox: 'border-amber-500/35 bg-amber-400/10 text-foreground',
        warnIcon: 'text-amber-600 dark:text-amber-400',
        warnStrong: 'text-foreground',
        dangerBox: 'border-destructive/35 bg-destructive/10 text-foreground',
        dangerIcon: 'text-destructive',
        row: 'border-border bg-background',
        fix: 'bg-amber-500 text-white hover:bg-amber-600',
        confirm: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        edit: 'border-border text-foreground hover:bg-muted/60',
        checkbox: 'border-border',
        checkboxActive: 'border-amber-500 bg-amber-500 text-white',
      }
}

/**
 * Aviso logo abaixo do campo de e-mail. Não renderiza nada quando não há o que
 * dizer — e não diz nada enquanto o endereço ainda está pela metade.
 */
export function EmailQualityNotice({
  state,
  onUseSuggestion,
  tone = 'light',
  className = '',
}: {
  state: AccountDeliveryState
  /** Trocar o e-mail digitado pelo sugerido, com um clique. */
  onUseSuggestion: (email: string) => void
  tone?: Tone
  className?: string
}) {
  const skin = skinFor(tone)
  const { suggestion, domain } = state.emailCheck

  if (suggestion) {
    return (
      <div className={`mt-2 rounded-xl border p-2.5 text-xs ${skin.warnBox} ${className}`}>
        <div className="flex items-start gap-2">
          <Wand2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${skin.warnIcon}`} />
          <div className="min-w-0 flex-1">
            <p className="leading-relaxed">
              Você quis dizer <strong className={`font-bold ${skin.warnStrong}`}>{suggestion}</strong>?
            </p>
            <button
              type="button"
              onClick={() => onUseSuggestion(suggestion)}
              className={`mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black transition ${skin.fix}`}
            >
              <Check className="h-3 w-3" /> Usar este e-mail
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (domain === 'undeliverable') {
    return (
      <div className={`mt-2 rounded-xl border p-2.5 text-xs ${skin.dangerBox} ${className}`}>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${skin.dangerIcon}`} />
          <p className="min-w-0 leading-relaxed">
            <strong className="font-bold">Esse domínio não recebe e-mail.</strong> Não encontramos servidor
            de e-mail para ele — confira o endereço, ou a compra não vai chegar a lugar nenhum.
          </p>
        </div>
      </div>
    )
  }

  return null
}

/**
 * A parada antes do pagamento: os dados grandes, na cara, e um botão só para
 * seguir.
 *
 * Quando o e-mail está sob suspeita (erro de digitação provável ou domínio que
 * não recebe), o botão exige um "confirmo que está correto" marcado à mão. É
 * atrito de propósito, e só para quem precisa dele: para o resto o botão já
 * nasce ligado.
 */
export function BuyerDataConfirmation({
  name,
  email,
  phone,
  deliveryLine,
  emailSuspicious = false,
  onEdit,
  onConfirm,
  tone = 'light',
  className = '',
}: {
  name: string
  email: string
  phone: string
  /** Para onde vai a compra, na linguagem da tela ("A Serial Key vai para…"). */
  deliveryLine: string
  emailSuspicious?: boolean
  onEdit: () => void
  onConfirm: () => void
  tone?: Tone
  className?: string
}) {
  const skin = skinFor(tone)
  const [acknowledged, setAcknowledged] = useState(false)
  const blocked = emailSuspicious && !acknowledged

  const rows = [
    { icon: User, label: 'Nome completo', value: name, highlight: false },
    { icon: Mail, label: 'E-mail', value: email, highlight: true },
    { icon: Phone, label: 'Telefone', value: phone, highlight: false },
  ]

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div>
        <h2 className={`text-lg font-bold ${skin.title}`}>Confira antes de pagar</h2>
        <p className={`mt-0.5 text-xs leading-relaxed ${skin.muted}`}>
          É para estes dados que a compra vai. Depois do pagamento, corrigir depende do suporte.
        </p>
      </div>

      <div className="grid gap-2">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} className={`rounded-xl border px-3.5 py-2.5 ${skin.row}`}>
              <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${skin.muted}`}>
                <Icon className="h-3 w-3" /> {row.label}
              </p>
              <p
                className={`mt-0.5 break-all font-bold ${skin.strong} ${row.highlight ? 'text-base' : 'text-sm'}`}
              >
                {row.value}
              </p>
            </div>
          )
        })}
      </div>

      <div className={`rounded-xl border p-3 text-xs ${skin.box}`}>
        <p className={`leading-relaxed ${skin.muted}`}>{deliveryLine}</p>
      </div>

      {emailSuspicious ? (
        <button
          type="button"
          onClick={() => setAcknowledged(v => !v)}
          aria-pressed={acknowledged}
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-left text-xs transition ${skin.warnBox}`}
        >
          <span
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition ${acknowledged ? skin.checkboxActive : skin.checkbox}`}
          >
            {acknowledged ? <Check className="h-2.5 w-2.5" /> : null}
          </span>
          <span className="min-w-0 leading-relaxed">
            Este e-mail parece ter algo errado. Confirmo que <strong className="font-bold">{email}</strong> está
            correto e é onde quero receber a compra.
          </span>
        </button>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={blocked}
          className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-[15px] font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${skin.confirm}`}
        >
          Está tudo certo, ir para pagamento <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex h-12 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition sm:flex-none ${skin.edit}`}
        >
          <Pencil className="h-3.5 w-3.5" /> Corrigir
        </button>
      </div>
    </div>
  )
}
