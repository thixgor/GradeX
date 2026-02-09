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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
            {/* Ambient floating blobs */}
            <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/30 top-[-10%] left-[-10%]" />
            <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/25 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
            <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/15 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />

            {/* Top bar */}
            <div className="absolute top-4 left-4 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/auth/login')}
                    className="soul-light rounded-xl backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                </Button>
            </div>
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* Main card */}
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
                        Esqueci minha senha
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {!submitted
                            ? 'Digite seu email para receber as instruções de recuperação'
                            : 'Verifique sua caixa de entrada'}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-2">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col items-center justify-center space-y-4 py-4"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                                className="h-20 w-20 rounded-full bg-[#468152]/10 flex items-center justify-center"
                            >
                                <CheckCircle2 className="h-10 w-10 text-[#468152]" />
                            </motion.div>
                            <div className="text-center space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Se houver uma conta associada ao email <strong className="text-foreground">{email}</strong>, você receberá um link para redefinir sua senha em instantes.
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Não esqueça de verificar sua caixa de spam/lixo eletrônico.
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="w-full mt-4 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                            >
                                Voltar para Login
                            </Button>
                        </motion.div>
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
                                    className="auth-glass-input rounded-xl h-11"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-sm text-destructive text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
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
