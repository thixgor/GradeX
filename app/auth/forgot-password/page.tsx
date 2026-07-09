'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar solicitação')
            }

            setSubmitted(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

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
                                </p>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Não esqueça de verificar sua caixa de spam/lixo eletrônico.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="mt-4 h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
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
