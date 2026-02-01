
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#468152]/20 via-background to-[#E2A43E]/20 p-4">
            <div className="absolute top-4 left-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/auth/login')}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Login
                </Button>
            </div>
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 flex-shrink-0">
                    <div className="flex items-center justify-center mb-4">
                        <Logo variant="full" size="lg" />
                    </div>
                    <CardTitle className="font-heading text-2xl text-center">
                        Esqueci minha senha
                    </CardTitle>
                    <CardDescription className="text-center">
                        {!submitted
                            ? 'Digite seu email para receber as instruções de recuperação'
                            : 'Verifique sua caixa de entrada'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
                            </div>
                            <p className="text-center text-sm text-muted-foreground">
                                Se houver uma conta associada ao email <strong>{email}</strong>, você receberá um link para redefinir sua senha em instantes.
                            </p>
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Não esqueça de verificar sua caixa de spam/lixo eletrônico.
                            </p>
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="w-full mt-4"
                            >
                                Voltar para Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar instruções'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
