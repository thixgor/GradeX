'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { BotaoAcao, BotaoVidro, CabecalhoAuth, CartaoAuth, Selo } from '@/components/auth/auth-ui'

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
        <CartaoAuth>
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-6 py-4 text-center" role="status">
                    <div className="grid h-[76px] w-[76px] place-items-center rounded-[26px] bg-[color:var(--campo)] shadow-[inset_0_0_0_1px_var(--campo-borda)]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                    </div>
                    <CabecalhoAuth titulo="Verificando seu e-mail" subtitulo="Só um instante…" />
                </div>
            )}

            {status === 'success' && (
                <div key="ok" className="auth-troca flex flex-col items-center gap-6 text-center">
                    <Selo tipo="sucesso" />
                    <CabecalhoAuth
                        titulo="E-mail confirmado"
                        subtitulo="Tudo pronto! Agora você tem acesso completo a todas as funcionalidades do DomineAqui."
                    />
                    <BotaoAcao type="button" onClick={() => router.push('/auth/login')}>
                        Ir para o login
                    </BotaoAcao>
                </div>
            )}

            {status === 'error' && (
                <div key="erro" className="auth-troca flex flex-col items-center gap-6 text-center">
                    <Selo tipo="erro" />
                    <CabecalhoAuth titulo="Não foi possível verificar" subtitulo={message} />
                    <BotaoVidro onClick={() => router.push('/auth/login')}>Voltar para o login</BotaoVidro>
                </div>
            )}
        </CartaoAuth>
    )
}

export default function VerifyPage() {
    return (
        <AuthShell voltar={{ href: '/auth/login', rotulo: 'Entrar' }}>
            <Suspense fallback={null}>
                <VerifyContent />
            </Suspense>
        </AuthShell>
    )
}
