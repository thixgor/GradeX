import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { buscarContaPorEmail, enviarLinkDeRedefinicao, VALIDADE_DO_LINK_MIN } from '@/lib/redefinicao-de-senha'
import { headers } from 'next/headers'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Email inválido'),
})

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const result = forgotPasswordSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        // Rate Limit
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const limit = await checkRateLimit(ip, 'forgot-password', 8, 60 * 60 * 1000) // 8 pedidos por hora

        if (!limit.success) {
            return NextResponse.json(
                { error: 'Muitas tentativas. Tente novamente mais tarde.' },
                { status: 429 }
            )
        }

        // A mesma resposta para conta existente e inexistente: o formulário
        // não pode servir para descobrir quem tem cadastro.
        const genericResponse = NextResponse.json({
            message: 'Se um cadastro com este e-mail existir, você receberá um link para redefinir sua senha.',
            validadeMin: VALIDADE_DO_LINK_MIN,
        })

        const db = await getDb()
        const user = await buscarContaPorEmail(db, result.data.email)
        if (!user) return genericResponse

        const envio = await enviarLinkDeRedefinicao(db, user, { origem: 'esqueci' })

        if (envio.status === 'falhou') {
            // Antes a falha era engolida e a tela dizia "verifique sua caixa de
            // entrada" para um e-mail que nunca saiu. Dizer a verdade só revela
            // que a conta existe enquanto o SMTP estiver fora — e deixa a pessoa
            // tentar de novo em vez de esperar para sempre.
            console.error('[forgot-password] envio do link falhou:', envio.erro)
            return NextResponse.json(
                {
                    error:
                        'Não conseguimos enviar o e-mail agora. Tente novamente em alguns minutos. ' +
                        'Se continuar, fale com o suporte em contato@domineaqui.com.br.',
                },
                { status: 503 }
            )
        }

        // 'aguarde': um e-mail acabou de sair para esta conta. Não manda outro,
        // mas responde igual — o link anterior chega e funciona.
        return genericResponse
    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
