'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!token) {
            setError('Token inválido ou ausente')
            return
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem')
            return
        }

        if (password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao redefinir senha')
            }

            setSuccess(true)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="auth-glass-card relative z-10 flex w-full max-w-md flex-col rounded-2xl"
            >
                <div className="space-y-3 p-6 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                    </div>
                    <h1 className="font-heading text-2xl font-semibold">Link Inválido</h1>
                    <p className="text-sm text-muted-foreground">
                        O link de redefinição de senha é inválido ou está ausente.
                    </p>
                </div>
                <div className="px-6 pb-6">
                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
                    >
                        Voltar para Login
                    </Button>
                </div>
            </motion.div>
        )
    }

    return (
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
                <p className="editorial-mark justify-center">Nova senha</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                    Redefinir Senha
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {!success
                        ? 'Crie uma nova senha segura para sua conta'
                        : 'Senha atualizada com sucesso!'}
                </p>
            </div>

            <div className="px-6 pb-6 pt-2">
                {success ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Sua senha foi alterada. Você já pode fazer login com a nova senha.
                        </p>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="mt-4 h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
                        >
                            Ir para Login
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-medium">Nova Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="auth-glass-input h-11 rounded-lg pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs font-medium">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                            {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                        </Button>
                    </form>
                )}
            </div>
        </motion.div>
    )
}

export default function ResetPasswordPage() {
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

            <div className="absolute right-4 top-4 z-20">
                <ThemeToggle />
            </div>

            <Suspense fallback={<div className="text-muted-foreground">Carregando...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
