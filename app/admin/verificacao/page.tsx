'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Delete,
  Loader2,
  LockKeyhole,
  LogOut,
  ShieldCheck,
} from 'lucide-react'

const CODE_LENGTH = 4
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

function sanitizeRedirect(raw: string | null): string {
  // Só aceita caminho interno do painel: evita virar open redirect.
  if (!raw) return '/admin'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/admin'
  if (raw.startsWith('/admin/verificacao')) return '/admin'
  return raw
}

function AdminGateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = useMemo(
    () => sanitizeRedirect(searchParams.get('redirect')),
    [searchParams]
  )

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [lockedUntilSeconds, setLockedUntilSeconds] = useState(0)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const submittedRef = useRef(false)

  const code = digits.join('')

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  // Contagem regressiva do bloqueio por excesso de tentativas.
  useEffect(() => {
    if (lockedUntilSeconds <= 0) return
    const timer = setInterval(() => {
      setLockedUntilSeconds((value) => Math.max(0, value - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [lockedUntilSeconds])

  const submitCode = useCallback(
    async (value: string) => {
      if (submittedRef.current || value.length !== CODE_LENGTH) return
      submittedRef.current = true
      setSubmitting(true)
      setError('')

      try {
        const res = await fetch('/api/admin/security/gate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: value }),
        })
        const data = await res.json().catch(() => ({}))

        if (res.status === 429) {
          setLockedUntilSeconds(Number(data?.retryAfterSeconds) || 60)
          setError(data?.error || 'Tentativas demais. Aguarde um pouco.')
          setDigits(Array(CODE_LENGTH).fill(''))
          return
        }

        if (!res.ok) {
          const remaining = Number(data?.attemptsRemaining)
          setError(
            Number.isFinite(remaining) && remaining >= 0
              ? `${data?.error || 'Código incorreto.'} ${remaining} tentativa(s) restante(s).`
              : data?.error || 'Código incorreto.'
          )
          setDigits(Array(CODE_LENGTH).fill(''))
          inputsRef.current[0]?.focus()
          return
        }

        setUnlocked(true)
        // Navegação completa (não router.replace + refresh): o cookie do gate
        // já foi setado, então o destino precisa renderizar do zero no
        // servidor. Com navegação client-side, o Router Cache do App Router
        // pode reentregar o redirect antigo (para esta mesma página) de antes
        // do desbloqueio, travando num loop — mesmo problema documentado no
        // login (app/auth/login/page.tsx).
        window.location.assign(redirectTo)
      } catch {
        setError('Falha de conexão. Tente novamente.')
        setDigits(Array(CODE_LENGTH).fill(''))
      } finally {
        setSubmitting(false)
        submittedRef.current = false
      }
    },
    [redirectTo, router]
  )

  function setDigitAt(index: number, value: string) {
    setError('')
    setDigits((current) => {
      const next = [...current]
      next[index] = value
      const joined = next.join('')
      if (joined.length === CODE_LENGTH && !joined.includes('')) {
        // Envia sozinho ao completar — sem botão extra no caminho.
        void submitCode(joined)
      }
      return next
    })
  }

  function handleChange(index: number, raw: string) {
    const onlyDigits = raw.replace(/\D/g, '')
    if (!onlyDigits) {
      setDigitAt(index, '')
      return
    }

    // Colar o código inteiro preenche todos os campos de uma vez.
    if (onlyDigits.length > 1) {
      const chars = onlyDigits.slice(0, CODE_LENGTH).split('')
      setError('')
      setDigits(() => {
        const next = Array(CODE_LENGTH).fill('')
        chars.forEach((char, i) => {
          next[i] = char
        })
        const joined = next.join('')
        if (joined.length === CODE_LENGTH && !joined.includes('')) void submitCode(joined)
        return next
      })
      inputsRef.current[Math.min(chars.length, CODE_LENGTH - 1)]?.focus()
      return
    }

    setDigitAt(index, onlyDigits)
    if (index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault()
      setDigitAt(index - 1, '')
      inputsRef.current[index - 1]?.focus()
      return
    }
    if (event.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus()
    if (event.key === 'Enter') void submitCode(digits.join(''))
  }

  function pressKeypad(value: string) {
    const firstEmpty = digits.findIndex((digit) => !digit)
    if (firstEmpty === -1) return
    setDigitAt(firstEmpty, value)
    inputsRef.current[Math.min(firstEmpty + 1, CODE_LENGTH - 1)]?.focus()
  }

  function pressBackspace() {
    const lastFilled = [...digits].map((d) => !!d).lastIndexOf(true)
    if (lastFilled === -1) return
    setDigitAt(lastFilled, '')
    inputsRef.current[lastFilled]?.focus()
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // segue para o login de qualquer forma
    }
    // Mesmo motivo do desbloqueio: navegação completa depois de mudar cookies.
    window.location.assign('/auth/login')
  }

  const blocked = submitting || unlocked || lockedUntilSeconds > 0

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Logo />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
              {unlocked ? <CheckCircle2 className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
            </div>
            <CardTitle className="text-2xl">
              {unlocked ? 'Painel liberado' : 'Painel bloqueado'}
            </CardTitle>
            <CardDescription>
              {unlocked
                ? 'Redirecionando...'
                : 'Digite o código de segurança para acessar a área administrativa.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex justify-center gap-3" aria-label="Código de segurança">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element
                  }}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onFocus={(event) => event.target.select()}
                  disabled={blocked}
                  type="password"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label={`Dígito ${index + 1}`}
                  maxLength={CODE_LENGTH}
                  className="h-16 w-14 rounded-xl border-2 bg-background text-center text-2xl font-bold outline-none transition-colors focus:border-primary disabled:opacity-60"
                />
              ))}
            </div>

            {error && (
              <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            {lockedUntilSeconds > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Nova tentativa em {lockedUntilSeconds}s
              </p>
            )}

            {submitting && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </p>
            )}

            {/* Teclado numérico: no celular evita depender do teclado do sistema. */}
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD.map((key) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  className="h-14 text-xl font-semibold"
                  disabled={blocked}
                  onClick={() => pressKeypad(key)}
                >
                  {key}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                className="h-14"
                disabled={blocked}
                onClick={() => setDigits(Array(CODE_LENGTH).fill(''))}
              >
                Limpar
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-14 text-xl font-semibold"
                disabled={blocked}
                onClick={() => pressKeypad('0')}
              >
                0
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-14"
                disabled={blocked}
                onClick={pressBackspace}
                aria-label="Apagar"
              >
                <Delete className="h-5 w-5" />
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={blocked || code.length !== CODE_LENGTH}
              onClick={() => submitCode(code)}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Desbloquear painel
            </Button>

            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao site
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair da conta
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              O painel tranca sozinho após um período sem uso. Se este dispositivo não for
              seu, saia da conta.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function AdminVerificacaoPage() {
  return (
    <Suspense fallback={null}>
      <AdminGateForm />
    </Suspense>
  )
}
