
'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'

export function VerifyEmailBanner() {
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const pathname = usePathname()

    // Não mostrar em páginas de auth ou landing (opcional, mas bom para UX)
    const isAuthPage = pathname?.startsWith('/auth')
    const isLandingPage = pathname === '/'

    useEffect(() => {
        const checkSession = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setSession(data.user)
                }
            } catch {
                // Silently ignore — network may be unavailable
            } finally {
                setLoading(false)
            }
        }

        if (!isAuthPage && !isLandingPage) {
            checkSession()
        }
    }, [pathname, isAuthPage, isLandingPage])

    const handleResend = async () => {
        setResending(true)
        setError('')
        try {
            const res = await fetch('/api/auth/verify/resend', { method: 'POST' })
            if (res.ok) {
                setSent(true)
                setTimeout(() => setSent(false), 5000)
            } else {
                const data = await res.json()
                setError(data.error || 'Erro ao enviar e-mail')
            }
        } catch (err) {
            setError('Erro de conexão')
        } finally {
            setResending(false)
        }
    }

    if (isAuthPage || isLandingPage || !session || session.emailVerified) {
        return null
    }

    return (
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 py-3 px-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Seu e-mail ainda não foi verificado!
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Para liberar o acesso completo à plataforma, confirme o link que enviamos para <span className="font-semibold">{session.email}</span>.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {error && <span className="text-xs text-red-600 dark:text-red-400 mr-2">{error}</span>}
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
                        onClick={handleResend}
                        disabled={resending || sent}
                    >
                        {resending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : sent ? (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                        ) : (
                            <Send className="h-4 w-4 mr-2" />
                        )}
                        {sent ? 'Enviado!' : 'Reenviar link'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
