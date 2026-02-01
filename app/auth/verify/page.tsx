
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-center mb-4">
                    <Logo variant="full" size="lg" />
                </div>
                <CardTitle className="font-heading text-2xl text-center">
                    Verificação de E-mail
                </CardTitle>
                <CardDescription className="text-center">
                    {status === 'loading' && 'Verificando sua conta...'}
                    {status === 'success' && 'Tudo pronto! Sua conta está ativa.'}
                    {status === 'error' && 'Não foi possível verificar seu e-mail.'}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
                {status === 'loading' && (
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                )}

                {status === 'success' && (
                    <>
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-300" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Seu e-mail foi confirmado com sucesso. Agora você tem acesso completo a todas as funcionalidades do DomineAqui.
                        </p>
                        <Button onClick={() => router.push('/auth/login')} className="w-full mt-4">
                            Ir para o Login
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                            <XCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {message}
                        </p>
                        <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full mt-4">
                            Voltar para o Login
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default function VerifyPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#468152]/20 via-background to-[#E2A43E]/20 p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <Suspense fallback={<Loader2 className="animate-spin" />}>
                <VerifyContent />
            </Suspense>
        </div>
    )
}
