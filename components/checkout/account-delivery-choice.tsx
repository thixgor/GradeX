'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, KeyRound, Loader2, UserCheck } from 'lucide-react'

/**
 * "Encontramos uma conta com esse e-mail — quer o material aplicado nela?"
 *
 * Quem compra sem entrar quase sempre JÁ TEM conta: digita o mesmo e-mail,
 * paga, recebe a Serial Key e só então descobre que precisaria ativá-la (ou
 * pior, ativa numa conta nova e fica com o acesso partido em duas). Perguntar
 * ANTES do pagamento resolve isso no único momento em que ainda dá para
 * escolher, e sem exigir login: o e-mail já está digitado ali.
 *
 * A resposta vira `deliveryMode` no checkout:
 *  - `account`     → o produto é aplicado direto na conta assim que o pagamento
 *                    é aprovado. Não existe key para ativar.
 *  - `serial_key`  → comportamento de sempre: a key chega no e-mail informado.
 *
 * O servidor nunca confia nisto: ele procura a conta de novo pelo e-mail da
 * compra e ignora qualquer id que venha do navegador.
 */

export type DeliveryMode = 'account' | 'serial_key'

type LookupStatus = 'idle' | 'checking' | 'found' | 'none'

export interface AccountDeliveryState {
  status: LookupStatus
  /** E-mail (normalizado) a que a consulta se refere. */
  email: string
  firstName?: string
  /** Escolha do comprador. `null` enquanto ele não respondeu. */
  deliveryMode: DeliveryMode | null
  setDeliveryMode: (mode: DeliveryMode) => void
  /**
   * Dá para seguir para o pagamento? Só é `false` enquanto existe uma conta
   * encontrada e a pergunta continua sem resposta — não queremos decidir por
   * ele para onde vai o que ele está pagando.
   */
  canProceed: boolean
  /** O que mandar no corpo do checkout (vazio quando não há nada a dizer). */
  checkoutBody: { deliveryMode?: DeliveryMode }
}

/**
 * Consulta o e-mail digitado (com debounce) e guarda a escolha do comprador.
 * Falha de rede não trava nada: a compra segue pelo caminho da Serial Key.
 */
export function useAccountDeliveryChoice(email: string, emailValid: boolean): AccountDeliveryState {
  const [status, setStatus] = useState<LookupStatus>('idle')
  const [checkedEmail, setCheckedEmail] = useState('')
  const [firstName, setFirstName] = useState<string | undefined>(undefined)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode | null>(null)
  // Descarta respostas de e-mails que a pessoa já trocou enquanto digitava.
  const requestId = useRef(0)

  const normalized = email.trim().toLowerCase()

  useEffect(() => {
    // Trocou o e-mail: a resposta anterior não vale mais para este endereço.
    setDeliveryMode(null)
    setFirstName(undefined)

    if (!emailValid) {
      setStatus('idle')
      setCheckedEmail('')
      return
    }

    const id = ++requestId.current
    setStatus('checking')
    const timer = setTimeout(() => {
      fetch('/api/serial-keys/account-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalized }),
      })
        .then(res => res.json())
        .then((data) => {
          if (id !== requestId.current) return
          setCheckedEmail(normalized)
          if (data?.exists) {
            setStatus('found')
            setFirstName(typeof data.firstName === 'string' ? data.firstName : undefined)
          } else {
            setStatus('none')
          }
        })
        .catch(() => {
          // Sem consulta não há pergunta a fazer: segue pela Serial Key.
          if (id !== requestId.current) return
          setStatus('none')
        })
    }, 500)

    return () => clearTimeout(timer)
  }, [normalized, emailValid])

  const choose = useCallback((mode: DeliveryMode) => setDeliveryMode(mode), [])

  const found = status === 'found'
  return {
    status,
    email: checkedEmail || normalized,
    firstName,
    deliveryMode,
    setDeliveryMode: choose,
    canProceed: !found || deliveryMode !== null,
    checkoutBody: deliveryMode ? { deliveryMode } : {},
  }
}

/**
 * A pergunta em si. Não renderiza nada enquanto não há conta encontrada —
 * exceto o "verificando…", que evita o susto de a caixa aparecer sozinha
 * depois que a pessoa já apertou o botão.
 */
export function AccountDeliveryChoice({
  state,
  tone = 'light',
  className = '',
  /** Mostra o pedido de escolha em vermelho (o comprador tentou avançar sem responder). */
  highlightMissing = false,
}: {
  state: AccountDeliveryState
  tone?: 'light' | 'dark'
  className?: string
  highlightMissing?: boolean
}) {
  const skin = tone === 'dark'
    ? {
        box: 'border-white/10 bg-white/[0.06] text-white',
        title: 'text-white',
        muted: 'text-white/55',
        strong: 'text-white',
        icon: 'text-emerald-300',
        option: 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]',
        optionActive: 'border-emerald-300/60 bg-emerald-300/10',
        radio: 'border-white/25',
        radioActive: 'border-emerald-300 bg-emerald-300 text-emerald-950',
        missing: 'text-rose-300',
      }
    : {
        box: 'border-border bg-muted/40 text-foreground',
        title: 'text-foreground',
        muted: 'text-muted-foreground',
        strong: 'text-foreground',
        icon: 'text-emerald-600 dark:text-emerald-400',
        option: 'border-border bg-background hover:bg-muted/60',
        optionActive: 'border-primary/50 bg-primary/10',
        radio: 'border-border',
        radioActive: 'border-primary bg-primary text-primary-foreground',
        missing: 'text-destructive',
      }

  if (state.status === 'checking') {
    return (
      <div className={`flex items-center gap-2 rounded-2xl border p-3.5 text-sm ${skin.box} ${className}`}>
        <Loader2 className={`h-4 w-4 shrink-0 animate-spin ${skin.icon}`} />
        <span className={`text-xs ${skin.muted}`}>Verificando se este e-mail já tem conta…</span>
      </div>
    )
  }

  if (state.status !== 'found') return null

  const options: { mode: DeliveryMode; title: string; description: string; icon: typeof UserCheck }[] = [
    {
      mode: 'account',
      title: 'Sim, quero o material aplicado à conta diretamente',
      description: `O acesso entra na conta ${state.email} assim que o pagamento for aprovado. Não precisa ativar nada.`,
      icon: UserCheck,
    },
    {
      mode: 'serial_key',
      title: 'Não, quero receber a chave de ativação por e-mail',
      description: `A Serial Key chega em ${state.email} e você ativa na conta que quiser, quando quiser.`,
      icon: KeyRound,
    },
  ]

  return (
    <div className={`rounded-2xl border p-3.5 text-sm ${skin.box} ${className}`}>
      <div className="flex items-start gap-2.5">
        <UserCheck className={`mt-0.5 h-4 w-4 shrink-0 ${skin.icon}`} />
        <div className="min-w-0 flex-1">
          <p className={`font-bold ${skin.title}`}>
            Encontramos uma conta com esse e-mail{state.firstName ? `, ${state.firstName}` : ''}
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${skin.muted}`}>
            A conta <strong className={skin.strong}>{state.email}</strong> já existe aqui. Você quer que este
            material seja aplicado a ela?
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {options.map((option) => {
          const active = state.deliveryMode === option.mode
          const Icon = option.icon
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => state.setDeliveryMode(option.mode)}
              aria-pressed={active}
              className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${active ? skin.optionActive : skin.option}`}
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${active ? skin.radioActive : skin.radio}`}>
                {active ? <Check className="h-2.5 w-2.5" /> : null}
              </span>
              <span className="min-w-0">
                <span className={`flex items-center gap-1.5 text-xs font-bold ${skin.title}`}>
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${skin.icon}`} />
                  {option.title}
                </span>
                <span className={`mt-0.5 block text-[11px] leading-relaxed ${skin.muted}`}>
                  {option.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {highlightMissing && state.deliveryMode === null ? (
        <p className={`mt-2 text-[11px] font-semibold ${skin.missing}`}>
          Escolha uma das opções acima para seguir para o pagamento.
        </p>
      ) : null}
    </div>
  )
}

export default AccountDeliveryChoice
