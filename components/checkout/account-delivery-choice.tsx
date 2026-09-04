'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, KeyRound, Loader2, ShieldCheck, UserCheck } from 'lucide-react'

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
  /** Conferência opcional "essa conta é minha mesmo?" (CPF + nascimento). */
  identity: AccountIdentityState
}

/**
 * Estado da conferência de identidade.
 *
 * Ela é um extra e nunca um portão: conta sem CPF ou sem data de nascimento
 * cadastrados não pode ser conferida, e barrar a compra por causa disso puniria
 * o comprador por um campo que ele talvez nem saiba que existe.
 */
export interface AccountIdentityState {
  cpf: string
  setCpf: (value: string) => void
  birthDate: string
  setBirthDate: (value: string) => void
  /** Nome cadastrado, devolvido só quando CPF e nascimento batem. */
  confirmedName: string | null
  checking: boolean
  error: string
  submit: () => void
  reset: () => void
}

/** 000.000.000-00 enquanto digita. */
function formatCpfInput(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/**
 * Consulta o e-mail digitado (com debounce) e guarda a escolha do comprador.
 * Falha de rede não trava nada: a compra segue pelo caminho da Serial Key.
 */
export function useAccountDeliveryChoice(email: string, emailValid: boolean): AccountDeliveryState {
  const [status, setStatus] = useState<LookupStatus>('idle')
  const [checkedEmail, setCheckedEmail] = useState('')
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode | null>(null)
  const [cpf, setCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [confirmedName, setConfirmedName] = useState<string | null>(null)
  const [checkingIdentity, setCheckingIdentity] = useState(false)
  const [identityError, setIdentityError] = useState('')
  // Descarta respostas de e-mails que a pessoa já trocou enquanto digitava.
  const requestId = useRef(0)

  const normalized = email.trim().toLowerCase()

  const resetIdentity = useCallback(() => {
    setCpf('')
    setBirthDate('')
    setConfirmedName(null)
    setIdentityError('')
    setCheckingIdentity(false)
  }, [])

  useEffect(() => {
    // Trocou o e-mail: nem a escolha nem a conferência anterior valem para este
    // endereço — o nome confirmado era de OUTRA conta.
    setDeliveryMode(null)
    resetIdentity()

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
          setStatus(data?.exists ? 'found' : 'none')
        })
        .catch(() => {
          // Sem consulta não há pergunta a fazer: segue pela Serial Key.
          if (id !== requestId.current) return
          setStatus('none')
        })
    }, 500)

    return () => clearTimeout(timer)
  }, [normalized, emailValid, resetIdentity])

  const choose = useCallback((mode: DeliveryMode) => setDeliveryMode(mode), [])

  const submitIdentity = useCallback(() => {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) {
      setIdentityError('Informe os 11 dígitos do CPF.')
      return
    }
    if (!birthDate) {
      setIdentityError('Informe a data de nascimento.')
      return
    }
    setCheckingIdentity(true)
    setIdentityError('')
    fetch('/api/serial-keys/account-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalized, cpf: digits, dateOfBirth: birthDate }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (data?.verified && typeof data.name === 'string' && data.name) {
          setConfirmedName(data.name)
          return
        }
        // Recusa uniforme: o servidor não conta se a conta tem CPF cadastrado,
        // se o CPF errou ou se a data errou, e a tela não inventa a diferença.
        setIdentityError(
          data?.error ||
          'Não foi possível confirmar com esses dados. Confira o CPF e a data de nascimento cadastrados nessa conta.'
        )
      })
      .catch(() => setIdentityError('Não foi possível conferir agora. Tente novamente em instantes.'))
      .finally(() => setCheckingIdentity(false))
  }, [cpf, birthDate, normalized])

  const found = status === 'found'
  return {
    status,
    email: checkedEmail || normalized,
    deliveryMode,
    setDeliveryMode: choose,
    canProceed: !found || deliveryMode !== null,
    checkoutBody: deliveryMode ? { deliveryMode } : {},
    identity: {
      cpf,
      setCpf: (value: string) => {
        setCpf(formatCpfInput(value))
        setIdentityError('')
      },
      birthDate,
      setBirthDate: (value: string) => {
        setBirthDate(value)
        setIdentityError('')
      },
      confirmedName,
      checking: checkingIdentity,
      error: identityError,
      submit: submitIdentity,
      reset: resetIdentity,
    },
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
  // Antes de qualquer `return`: hook não pode ficar depois de saída condicional.
  const [identityOpen, setIdentityOpen] = useState(false)

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
        link: 'text-emerald-300 hover:text-emerald-200',
        input: 'border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus:border-emerald-300/50',
        confirmed: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100',
        submit: 'bg-emerald-400 text-emerald-950 hover:bg-emerald-300',
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
        link: 'text-primary hover:underline',
        input: 'border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50',
        confirmed: 'border-emerald-500/35 bg-emerald-500/10 text-foreground',
        submit: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
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

  const { identity } = state

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
            {identity.confirmedName
              ? `Conta confirmada: ${identity.confirmedName}`
              : 'Encontramos uma conta com esse e-mail'}
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

      {/* Conferência opcional. Fica embaixo, fechada, porque a maioria sabe de
          quem é o próprio e-mail — quem tem dúvida é que abre. */}
      {identity.confirmedName ? (
        <div className={`mt-3 flex items-start gap-2.5 rounded-xl border p-3 ${skin.confirmed}`}>
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="min-w-0 text-[11px] leading-relaxed">
            CPF e data de nascimento conferem com o cadastro desta conta, que está no nome de{' '}
            <strong className="font-bold">{identity.confirmedName}</strong>.
          </p>
        </div>
      ) : identityOpen ? (
        <div className={`mt-3 rounded-xl border p-3 ${skin.option}`}>
          <p className={`text-[11px] font-bold ${skin.title}`}>Confirme que a conta é sua</p>
          <p className={`mt-0.5 text-[11px] leading-relaxed ${skin.muted}`}>
            Informe o CPF e a data de nascimento cadastrados nela. Batendo os dois, mostramos o nome do
            titular. Só funciona se a conta tiver os dois preenchidos.
          </p>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            <input
              value={identity.cpf}
              onChange={(event) => identity.setCpf(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') identity.submit() }}
              inputMode="numeric"
              autoComplete="off"
              placeholder="CPF"
              aria-label="CPF cadastrado na conta"
              disabled={identity.checking}
              className={`h-9 w-full min-w-0 rounded-lg border px-3 text-xs outline-none transition ${skin.input}`}
            />
            <input
              value={identity.birthDate}
              onChange={(event) => identity.setBirthDate(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') identity.submit() }}
              type="date"
              autoComplete="off"
              aria-label="Data de nascimento cadastrada na conta"
              disabled={identity.checking}
              className={`h-9 w-full min-w-0 rounded-lg border px-3 text-xs outline-none transition ${skin.input}`}
            />
          </div>
          {identity.error ? (
            <p className={`mt-2 text-[11px] font-semibold ${skin.missing}`}>{identity.error}</p>
          ) : null}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={identity.submit}
              disabled={identity.checking}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${skin.submit}`}
            >
              {identity.checking ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => { setIdentityOpen(false); identity.reset() }}
              className={`text-[11px] font-semibold ${skin.link}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIdentityOpen(true)}
          className={`mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold ${skin.link}`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Não tem certeza se a conta é sua? Confirme com CPF e data de nascimento
        </button>
      )}
    </div>
  )
}

export default AccountDeliveryChoice
