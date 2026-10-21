import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { z } from 'zod'
import { secureApiEndpoint } from '@/lib/api-security'
import { sendPasswordChangedEmail, deliverTransactionalEmails } from '@/lib/mail'
import { buscarContaPeloToken, gravarNovaSenha, SENHA_MAX, SENHA_MIN } from '@/lib/redefinicao-de-senha'

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Link de redefinição inválido.'),
    password: z
        .string()
        .min(SENHA_MIN, `A senha deve ter no mínimo ${SENHA_MIN} caracteres`)
        .max(SENHA_MAX, `A senha deve ter no máximo ${SENHA_MAX} caracteres`),
})

export async function POST(req: NextRequest) {
    try {
        // Rate limit para reset password (endpoint sensivel)
        const security = await secureApiEndpoint(req, {
            rateLimit: 'AUTH',
            auth: { requireAuth: false }
        })

        if (!security.success || security.errorResponse) {
            return security.errorResponse
        }

        const body = await req.json().catch(() => ({}))
        const result = resetPasswordSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { token, password } = result.data

        const db = await getDb()
        const user = await buscarContaPeloToken(db, token)

        if (!user) {
            return NextResponse.json(
                { error: 'Link de redefinição inválido ou expirado. Peça um novo em "Esqueci minha senha".' },
                { status: 400 }
            )
        }

        // Abrir o link que chegou no e-mail prova que a caixa é da pessoa: a
        // conta fica com o e-mail confirmado de quebra.
        await gravarNovaSenha(db, user._id!, password, { por: 'reset', confirmarEmail: true })

        await deliverTransactionalEmails([
            sendPasswordChangedEmail({ email: user.email, nome: user.name, por: 'reset' }),
        ])

        return NextResponse.json({ message: 'Senha redefinida com sucesso!' })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
