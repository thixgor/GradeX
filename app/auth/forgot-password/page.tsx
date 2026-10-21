'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

/** Espera antes de liberar o "Reenviar" — o servidor segura 45 s por conta. */
const ESPERA_PARA_REENVIAR_S = 60

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ForgotPasswordView />
        </Suspense>
    )
}

function ForgotPasswordView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // O perfil e o painel do admin mandam o e-mail na URL para ninguém redigitar.
    const [email, setEmail] = useState(() => searchParams?.get('email') || '')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [validadeMin, setValidadeMin] = useState(60)
    const [espera, setEspera] = useState(0)
    const [reenviado, setReenviado] = useState(false)

    useEffect(() => {
        if (espera <= 0) return
        const t = setTimeout(() => setEspera((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [espera])

    async function solicitar(): Promise<boolean> {
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar solicitação')
            }

            if (typeof data.validadeMin === 'number') setValidadeMin(data.validadeMin)
            setEspera(ESPERA_PARA_REENVIAR_S)
            return true
        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação')
            return false
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (await solicitar()) setSubmitted(true)
    }

    async function reenviar() {
        if (espera > 0 || loading) return
        if (await solicitar()) setReenviado(true)
    }

    const prazo = validadeMin % 60 === 0
        ? `${validadeMin / 60} hora${validadeMin / 60 > 1 ? 's' : ''}`
        : `${validadeMin} minutos`

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden surface-page p-4 text-foreground">
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-50 dark:opacity-35"
                style={{
                    background:
                        'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(70,129,82,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(206,89,41,0.07), transparent 50%)',
                }}
                aria-hidden
            />

            <div className="absolute left-4 top-4 z-20">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/auth/login')}
                    className="rounded-lg border-border bg-card shadow-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar para Login
                </Button>
            </div>
            <div className="absolute right-4 top-4 z-20">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="auth-glass-card relative z-10 flex w-full max-w-md flex-col rounded-2xl"
            >
                <div className="flex-shrink-0 space-y-3 p-6 pb-2 text-center">
                    <div className="mb-2 flex justify-center">
                        <Logo variant="full" size="lg" />
                    </div>
                    <p className="editorial-mark justify-center">Recuperação</p>
                    <h1 className="font-heading text-2xl font-semibold tracking-tight">
                        Esqueci minha senha
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {!submitted
                            ? 'Digite seu email para receber as instruções de recuperação'
                            : 'Verifique sua caixa de entrada'}
                    </p>
                </div>

                <div className="px-6 pb-6 pt-2">
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                                <CheckCircle2 className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Se houver uma conta associada ao email{' '}
                                    <strong className="text-foreground">{email}</strong>, você receberá um link para redefinir sua senha em instantes.
                                    O link vale por {prazo}.
                                </p>
                            </div>
                            <ul className="w-full space-y-1.5 rounded-lg border border-border bg-muted/40 p-3 text-left text-xs text-muted-foreground">
                                <li>• Pode levar alguns minutos para chegar.</li>
                                <li>• Confira as pastas <strong>Spam</strong>, <strong>Lixo eletrônico</strong> e, no Gmail, a aba <strong>Promoções</strong>.</li>
                                <li>• Procure por <strong>DomineAqui</strong> ou pelo remetente <strong>no-reply@domineaqui.com.br</strong>.</li>
                                <li>• Pediu mais de uma vez? Qualquer um dos e-mails recentes funciona.</li>
                            </ul>
                            {error && (
                                <div className="w-full rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                            {reenviado && !error && (
                                <p className="text-center text-xs font-medium text-primary">Pedido reenviado.</p>
                            )}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={reenviar}
                                disabled={espera > 0 || loading}
                                className="h-11 w-full rounded-lg"
                            >
                                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                {loading
                                    ? 'Enviando...'
                                    : espera > 0
                                        ? `Não chegou? Reenviar em ${espera}s`
                                        : 'Não chegou? Reenviar e-mail'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => { setSubmitted(false); setReenviado(false); setError('') }}
                                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                            >
                                Digitei o e-mail errado
                            </button>
                            <p className="text-center text-xs text-muted-foreground">
                                Ainda sem e-mail? Fale com o suporte em{' '}
                                <a href="mailto:contato@domineaqui.com.br" className="font-medium text-primary underline-offset-4 hover:underline">
                                    contato@domineaqui.com.br
                                </a>
                                .
                            </p>
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="auth-glass-input h-11 rounded-lg"
                                />
                            </div>

                            {error && (
                                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar instruções'}
                            </Button>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
