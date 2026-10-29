'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { Aviso, BotaoAcao, BotaoVidro, CabecalhoAuth, Campo, CartaoAuth, GrupoDeCampos, Selo } from '@/components/auth/auth-ui'

/** Espera antes de liberar o "Reenviar" — o servidor segura 45 s por conta. */
const ESPERA_PARA_REENVIAR_S = 60

export default function ForgotPasswordPage() {
    return (
        <AuthShell voltar={{ href: '/auth/login', rotulo: 'Entrar' }}>
            <Suspense fallback={null}>
                <ForgotPasswordView />
            </Suspense>
        </AuthShell>
    )
}

function ForgotPasswordView() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // O perfil e o painel do admin mandam o e-mail na URL para ninguém redigitar.
    const [email, setEmail] = useState(() => searchParams?.get('email') || '')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const [validadeMin, setValidadeMin] = useState(60)
    const [espera, setEspera] = useState(0)
    const [reenviado, setReenviado] = useState(false)

    useEffect(() => {
        if (espera <= 0) return
        const t = setTimeout(() => setEspera((s) => s - 1), 1000)
        return () => clearTimeout(t)
    }, [espera])

    async function solicitar(): Promise<boolean> {
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao processar solicitação')
            }

            if (typeof data.validadeMin === 'number') setValidadeMin(data.validadeMin)
            setEspera(ESPERA_PARA_REENVIAR_S)
            return true
        } catch (err: any) {
            setError(err.message || 'Erro ao processar solicitação')
            return false
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (await solicitar()) setSubmitted(true)
    }

    async function reenviar() {
        if (espera > 0 || loading) return
        if (await solicitar()) setReenviado(true)
    }

    const prazo = validadeMin % 60 === 0
        ? `${validadeMin / 60} hora${validadeMin / 60 > 1 ? 's' : ''}`
        : `${validadeMin} minutos`

    return (
        <CartaoAuth>
            {submitted ? (
                <div key="enviado" className="auth-troca flex flex-col items-center gap-6 text-center">
                    <Selo tipo="email" />
                    <CabecalhoAuth
                        titulo="Verifique sua caixa de entrada"
                        subtitulo={
                            <>
                                Se houver uma conta com o e-mail{' '}
                                <strong className="font-semibold text-foreground">{email}</strong>, o link para
                                redefinir a senha chega em instantes. Ele vale por {prazo}.
                            </>
                        }
                    />
                    <ul className="aviso-neutro w-full space-y-1.5 rounded-2xl p-3.5 text-left text-[13px] leading-relaxed">
                        <li>• Pode levar alguns minutos para chegar.</li>
                        <li>• Confira as pastas <strong>Spam</strong>, <strong>Lixo eletrônico</strong> e, no Gmail, a aba <strong>Promoções</strong>.</li>
                        <li>• Procure por <strong>DomineAqui</strong> ou pelo remetente <strong>no-reply@domineaqui.com.br</strong>.</li>
                        <li>• Pediu mais de uma vez? Qualquer um dos e-mails recentes funciona.</li>
                    </ul>
                    {error && <div className="w-full text-left"><Aviso>{error}</Aviso></div>}
                    {reenviado && !error && (
                        <p className="text-[13px] font-semibold text-primary" role="status">Pedido reenviado.</p>
                    )}
                    <div className="w-full space-y-3">
                        <BotaoAcao type="button" onClick={() => router.push('/auth/login')}>
                            Voltar para o login
                        </BotaoAcao>
                        <BotaoVidro onClick={reenviar} disabled={espera > 0 || loading} className="tabular-nums">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
                            {loading
                                ? 'Enviando…'
                                : espera > 0
                                    ? `Não chegou? Reenviar em ${espera}s`
                                    : 'Não chegou? Reenviar e-mail'}
                        </BotaoVidro>
                    </div>
                    <button
                        type="button"
                        onClick={() => { setSubmitted(false); setReenviado(false); setError('') }}
                        className="link-discreto"
                    >
                        Digitei o e-mail errado
                    </button>
                    <p className="text-[13px] text-[color:var(--texto-2)]">
                        Ainda sem e-mail? Fale com o suporte em{' '}
                        <a href="mailto:contato@domineaqui.com.br" className="link-auth">
                            contato@domineaqui.com.br
                        </a>
                        .
                    </p>
                </div>
            ) : (
                <form key="pedido" onSubmit={handleSubmit} className="auth-troca space-y-5">
                    <CabecalhoAuth
                        titulo="Esqueci minha senha"
                        subtitulo="Digite seu e-mail e enviamos um link para criar uma senha nova."
                    />
                    <GrupoDeCampos>
                        <Campo
                            id="email"
                            rotulo="E-mail"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            enterKeyHint="send"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            aria-describedby={error ? 'erro-auth' : undefined}
                            required
                            autoFocus={!email}
                        />
                    </GrupoDeCampos>

                    {error && <Aviso id="erro-auth">{error}</Aviso>}

                    <BotaoAcao carregando={loading} textoCarregando="Enviando…">
                        Enviar link
                    </BotaoAcao>

                    <p className="text-center text-sm text-[color:var(--texto-2)]">
                        Lembrou?{' '}
                        <Link href="/auth/login" className="link-auth">
                            Voltar para o login
                        </Link>
                    </p>
                </form>
            )}
        </CartaoAuth>
    )
}
