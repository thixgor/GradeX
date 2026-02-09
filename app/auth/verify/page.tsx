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
            } catch (err) {
                setStatus('error')
                setMessage('Ocorreu um erro ao tentar verificar seu e-mail.')
            }
        }

        verifyEmail()
    }, [token])

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md auth-glass-card flex flex-col relative z-10"
        >
            {/* Header */}
            <div className="p-6 pb-2 flex-shrink-0 text-center space-y-3">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-center mb-2"
                >
                    <Logo variant="full" size="lg" />
                </motion.div>
                <h1 className="font-heading text-2xl font-bold">
                    Verificação de E-mail
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {status === 'loading' && 'Verificando sua conta...'}
                    {status === 'success' && 'Tudo pronto! Sua conta está ativa.'}
                    {status === 'error' && 'Não foi possível verificar seu e-mail.'}
                </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-2 flex flex-col items-center justify-center space-y-4 py-4">
                {status === 'loading' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    </motion.div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center space-y-4 w-full"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                            className="h-20 w-20 rounded-full bg-[#468152]/10 flex items-center justify-center"
                        >
                            <CheckCircle2 className="h-10 w-10 text-[#468152]" />
                        </motion.div>
                        <p className="text-center text-sm text-muted-foreground">
                            Seu e-mail foi confirmado com sucesso. Agora você tem acesso completo a todas as funcionalidades do DomineAqui.
                        </p>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="w-full mt-4 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                        >
                            Ir para o Login
                        </Button>
                    </motion.div>
                )}

                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center space-y-4 w-full"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                            className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center"
                        >
                            <XCircle className="h-10 w-10 text-red-500" />
                        </motion.div>
                        <p className="text-center text-sm text-muted-foreground">
                            {message}
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/auth/login')}
                            className="w-full mt-4 h-11 rounded-xl soul-light backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
                        >
                            Voltar para o Login
                        </Button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
            {/* Ambient floating blobs */}
            <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/30 top-[-10%] left-[-10%]" />
            <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/25 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
            <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/15 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />

            {/* Top bar */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            <Suspense fallback={<Loader2 className="animate-spin" />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
