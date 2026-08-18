'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, Loader2, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

/**
 * Último passo do cadastro com Google.
 *
 * O cadastro por e-mail pede só nome, e-mail e senha — o resto do perfil
 * (telefone, estado, profissão, faculdade, CRM, CPF) é coletado depois, dentro
 * do app, pelo `ProfileCompletionGate`. Este modal existia pedindo tudo isso de
 * uma vez, com campos que a plataforma nem usa mais (data de nascimento) e sem
 * os que ela passou a usar (CRM, CPF): quem entrava "com um toque" no Google
 * caía num formulário de 8 campos, mais longo que o cadastro comum.
 *
 * Agora ele confirma o que o Google já entregou e cria a conta. Um campo, um
 * botão — a mesma fricção do cadastro por e-mail, sem a senha.
 */

interface GoogleProfileSetupDialogProps {
  open: boolean
  googleData: {
    email: string
    name?: string
    picture?: string
    googleId: string
  }
  onComplete: (data: { profileName: string }) => void
  onCancel?: () => void
  isLoading?: boolean
  /** Erro vindo do servidor (ex.: e-mail já cadastrado). */
  serverError?: string
}

const PERKS = [
  'Acesso imediato, sem confirmar e-mail',
  'Sem senha para lembrar e sem cartão',
  'O resto do perfil você completa depois',
]

export function GoogleProfileSetupDialog({
  open,
  googleData,
  onComplete,
  onCancel,
  isLoading = false,
  serverError,
}: GoogleProfileSetupDialogProps) {
  const firstName = (googleData.name || '').trim().split(/\s+/)[0] || ''
  const [profileName, setProfileName] = useState(googleData.name?.trim() || '')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setProfileName(googleData.name?.trim() || '')
    setError('')
  }, [open, googleData.name])

  // Trava o scroll do fundo: sem isso, no mobile o dedo arrasta a página atrás.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  // Esc cancela — o modal antigo prendia o usuário na tela sem saída de teclado.
  useEffect(() => {
    if (!open || !onCancel) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel, isLoading])

  if (!open) return null

  const trimmedName = profileName.trim()
  const visibleError = error || serverError || ''

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isLoading) return

    if (trimmedName.length < 2) {
      setError('Digite como você quer ser chamado (mínimo 2 letras).')
      inputRef.current?.focus()
      return
    }

    setError('')
    onComplete({ profileName: trimmedName })
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="google-setup-title"
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
      >
        <header className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <GoogleMark className="h-4 w-4" />
            Cadastro com Google
          </div>
          <h2
            id="google-setup-title"
            className="mt-1.5 text-lg font-semibold text-foreground sm:text-xl"
          >
            {firstName ? `Falta só confirmar, ${firstName}` : 'Falta só confirmar'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sua conta grátis é criada agora, com os dados que o Google já enviou.
          </p>
        </header>

        <form
          id="google-setup-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-5 sm:px-6"
        >
          {/* Conta do Google — mostra de qual conta estamos falando. */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            {googleData.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={googleData.picture}
                alt=""
                width={44}
                height={44}
                referrerPolicy="no-referrer"
                className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {googleData.name || googleData.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{googleData.email}</p>
            </div>
            <span
              className="flex flex-shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary"
              title="E-mail já verificado pelo Google"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verificado
            </span>
          </div>

          <div className="mt-5 space-y-2">
            <label htmlFor="profileName" className="block text-sm font-medium text-foreground">
              Como você quer ser chamado?
            </label>
            <input
              ref={inputRef}
              id="profileName"
              type="text"
              autoComplete="name"
              enterKeyHint="done"
              maxLength={60}
              placeholder="Seu nome"
              value={profileName}
              onChange={(event) => {
                setProfileName(event.target.value)
                setError('')
              }}
              disabled={isLoading}
              className={`flex h-11 w-full rounded-lg border bg-background px-3 py-2 text-base text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:text-sm ${
                error ? 'border-destructive focus-visible:ring-destructive' : 'border-input'
              }`}
            />
            <p className="text-xs text-muted-foreground">
              É o nome que aparece nas suas provas e atividades. Dá para mudar
              depois, no seu perfil.
            </p>
          </div>

          <ul className="mt-5 space-y-2">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                {perk}
              </li>
            ))}
          </ul>

          {visibleError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{visibleError}</span>
            </div>
          )}
        </form>

        <footer className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
          <button
            type="submit"
            form="google-setup-form"
            disabled={isLoading || trimmedName.length < 2}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Criando sua conta...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Criar minha conta grátis
              </>
            )}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="mt-2 h-10 w-full rounded-xl text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              Usar outro e-mail
            </button>
          )}

          <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
            Ao continuar você concorda com os{' '}
            <a href="/termos-de-servico" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Termos de Uso
            </a>{' '}
            e a{' '}
            <a href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              Política de Privacidade
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  )
}

/** O "G" oficial, para o modal ser reconhecível como fluxo do Google. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
