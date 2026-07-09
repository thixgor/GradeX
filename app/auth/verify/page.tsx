'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Token de verificação inválido ou ausente.')
            return
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`/api/auth/verify?token=${token}`)
                const data = await res.json()

                if (res.ok) {
                    setStatus('success')
                } else {
                    setStatus('error')
                    setMessage(data.error || 'Falha ao verificar e-mail.')
                }
            } catch {
                setStatus('error')
                setMessage('Ocorreu um erro ao tentar verificar seu e-mail.')
            }
        }

        verifyEmail()
    }, [token])

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
                <p className="editorial-mark justify-center">Conta</p>
                <h1 className="font-heading text-2xl font-semibold tracking-tight">
                    Verificação de E-mail
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {status === 'loading' && 'Verificando sua conta...'}
                    {status === 'success' && 'Tudo pronto! Sua conta está ativa.'}
                    {status === 'error' && 'Não foi possível verificar seu e-mail.'}
                </p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 px-6 pb-6 pt-2 py-4">
                {status === 'loading' && (
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                )}

                {status === 'success' && (
                    <div className="flex w-full flex-col items-center space-y-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Seu e-mail foi confirmado com sucesso. Agora você tem acesso completo a todas as funcionalidades do DomineAqui.
                        </p>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="mt-4 h-11 w-full rounded-lg bg-secondary font-semibold text-secondary-foreground hover:bg-secondary/90"
                        >
                            Ir para o Login
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex w-full flex-col items-center space-y-4">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                            <XCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/auth/login')}
                            className="mt-4 h-11 w-full rounded-lg border-border bg-card"
                        >
                            Voltar para o Login
                        </Button>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default function VerifyPage() {
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

            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
