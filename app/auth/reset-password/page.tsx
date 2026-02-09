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
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md auth-glass-card flex flex-col relative z-10"
            >
                <div className="p-6 text-center space-y-3">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                        className="flex justify-center mb-4"
                    >
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                    </motion.div>
                    <h1 className="font-heading text-2xl font-bold">Link Inválido</h1>
                    <p className="text-sm text-muted-foreground">
                        O link de redefinição de senha é inválido ou está ausente.
                    </p>
                </div>
                <div className="px-6 pb-6">
                    <Button
                        onClick={() => router.push('/auth/login')}
                        className="w-full h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                    >
                        Voltar para Login
                    </Button>
                </div>
            </motion.div>
        )
    }

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
                    Redefinir Senha
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {!success
                        ? 'Crie uma nova senha segura para sua conta'
                        : 'Senha atualizada com sucesso!'}
                </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-2">
                {success ? (
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
                        <p className="text-center text-sm text-muted-foreground">
                            Sua senha foi alterada. Você já pode fazer login com a nova senha.
                        </p>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="w-full mt-4 h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                        >
                            Ir para Login
                        </Button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-xs font-medium">Nova Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="auth-glass-input rounded-xl h-11 pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
            {/* Ambient floating blobs */}
            <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/30 top-[-10%] left-[-10%]" />
            <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/25 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
            <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/15 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />

            {/* Top bar */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            <Suspense fallback={<div className="text-muted-foreground">Carregando...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
