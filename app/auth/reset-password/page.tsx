
'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-center">Link Inválido</CardTitle>
                    <CardDescription className="text-center">
                        O link de redefinição de senha é inválido ou está ausente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => router.push('/auth/login')} className="w-full">Voltar para Login</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 flex-shrink-0">
                <div className="flex items-center justify-center mb-4">
                    <Logo variant="full" size="lg" />
                </div>
                <CardTitle className="font-heading text-2xl text-center">
                    Redefinir Senha
                </CardTitle>
                <CardDescription className="text-center">
                    {!success
                        ? 'Crie uma nova senha segura para sua conta'
                        : 'Senha atualizada com sucesso!'}
                </CardDescription>
            </CardHeader>

            <CardContent>
                {success ? (
                    <div className="flex flex-col items-center justify-center space-y-4 py-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Sua senha foi alterada. Você já pode fazer login com a nova senha.
                        </p>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            className="w-full mt-4"
                        >
                            Ir para Login
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
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
                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Redefinindo...' : 'Salvar Nova Senha'}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}

export default function ResetPasswordPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#468152]/20 via-background to-[#E2A43E]/20 p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Suspense fallback={<div>Carregando...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    )
}
