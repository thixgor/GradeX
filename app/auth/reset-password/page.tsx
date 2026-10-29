'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Eye, EyeOff } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import {
    Aviso,
    BotaoAcao,
    BotaoVidro,
    CabecalhoAuth,
    Campo,
    CartaoAuth,
    GrupoDeCampos,
    Selo,
    useCapsLock,
} from '@/components/auth/auth-ui'

/**
 * O mesmo mínimo que a API cobra — `SENHA_MIN`, de `lib/redefinicao-de-senha.ts`,
 * que não pode vir para o navegador (importa o Mongo).
 */
const MINIMO_DA_SENHA = 6

/** Uma regra da senha, marcada ao vivo enquanto a pessoa digita. */
function Regra({ ok, children }: { ok: boolean; children: React.ReactNode }) {
    return (
        <li
            className={`flex items-center gap-2 transition-colors duration-200 ${ok ? 'text-primary' : 'text-[color:var(--texto-3)]'}`}
        >
            <span
                className={`grid h-[18px] w-[18px] place-items-center rounded-full transition-all duration-200 ${ok ? 'scale-100 bg-primary text-primary-foreground' : 'scale-90 bg-[color:var(--seg-fundo)] text-transparent'}`}
                aria-hidden
            >
                <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {children}
            <span className="sr-only">{ok ? '(cumprido)' : '(pendente)'}</span>
        </li>
    )
}

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
    const { capsLigado, propsDoCapsLock } = useCapsLock()

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

        if (password.length < MINIMO_DA_SENHA) {
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
            <CartaoAuth>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Selo tipo="erro" />
                    <CabecalhoAuth
                        titulo="Link inválido"
                        subtitulo="O link de redefinição de senha é inválido ou está incompleto. Peça um novo — leva um minuto."
                    />
                    <div className="w-full space-y-3">
                        <BotaoAcao type="button" onClick={() => router.push('/auth/forgot-password')}>
                            Pedir um novo link
                        </BotaoAcao>
                        <BotaoVidro onClick={() => router.push('/auth/login')}>Voltar para o login</BotaoVidro>
                    </div>
                </div>
            </CartaoAuth>
        )
    }

    if (success) {
        return (
            <CartaoAuth>
                <div className="flex flex-col items-center gap-6 text-center">
                    <Selo tipo="sucesso" />
                    <CabecalhoAuth
                        titulo="Senha atualizada"
                        subtitulo="Por segurança, os aparelhos conectados foram desconectados: entre de novo com a nova senha."
                    />
                    <BotaoAcao type="button" onClick={() => router.push('/auth/login')}>
                        Ir para o login
                    </BotaoAcao>
                </div>
            </CartaoAuth>
        )
    }

    const tamanhoOk = password.length >= MINIMO_DA_SENHA
    const iguais = confirmPassword.length > 0 && password === confirmPassword

    return (
        <CartaoAuth>
            <form onSubmit={handleSubmit} className="space-y-5">
                <CabecalhoAuth titulo="Redefinir senha" subtitulo="Crie uma senha nova para sua conta." />

                <div className="space-y-3">
                    <GrupoDeCampos>
                        <Campo
                            id="password"
                            rotulo="Nova senha"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            enterKeyHint="next"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-describedby="regras-senha"
                            required
                            autoFocus
                            {...propsDoCapsLock}
                            acao={
                                <button
                                    type="button"
                                    className="campo-acao"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Esconder senhas' : 'Mostrar senhas'}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                                </button>
                            }
                        />
                        <Campo
                            id="confirmPassword"
                            rotulo="Confirmar nova senha"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            enterKeyHint="done"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            aria-describedby="regras-senha"
                            required
                            {...propsDoCapsLock}
                        />
                    </GrupoDeCampos>

                    <ul id="regras-senha" className="space-y-1.5 px-1 text-[13px] font-medium">
                        <Regra ok={tamanhoOk}>Pelo menos {MINIMO_DA_SENHA} caracteres</Regra>
                        <Regra ok={iguais}>As duas senhas são iguais</Regra>
                    </ul>

                    {capsLigado && (
                        <p className="px-1 text-[13px] font-medium text-[color:var(--atencao)]" aria-live="polite">
                            Caps Lock ligado
                        </p>
                    )}
                </div>

                {error && <Aviso id="erro-auth">{error}</Aviso>}

                {/expirado|inválido/i.test(error) && (
                    <BotaoVidro onClick={() => router.push('/auth/forgot-password')}>Pedir um novo link</BotaoVidro>
                )}

                <BotaoAcao carregando={loading} textoCarregando="Salvando…">
                    Salvar nova senha
                </BotaoAcao>
            </form>
        </CartaoAuth>
    )
}

export default function ResetPasswordPage() {
    return (
        <AuthShell voltar={{ href: '/auth/login', rotulo: 'Entrar' }}>
            <Suspense fallback={null}>
                <ResetPasswordForm />
            </Suspense>
        </AuthShell>
    )
}
