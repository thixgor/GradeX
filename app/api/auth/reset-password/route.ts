
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'
import { z } from 'zod'
import { secureApiEndpoint } from '@/lib/api-security'

const resetPasswordSchema = z.object({
    token: z.string(),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
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

        const body = await req.json()
        const result = resetPasswordSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const { token, password } = result.data

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

        const db = await getDb()
        const user = await db.collection('users').findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Link de redefinição inválido ou expirado.' },
                { status: 400 }
            )
        }

        const hashedPassword = await hashPassword(password)

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: {
                    resetPasswordToken: "",
                    resetPasswordExpires: ""
                }
            }
        )

        return NextResponse.json({ message: 'Senha redefinida com sucesso!' })

    } catch (error) {
        console.error('Reset password error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
