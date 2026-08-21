
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { normalizeEmail } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/mail'
import { checkRateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { headers } from 'next/headers'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const result = forgotPasswordSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.errors[0].message },
                { status: 400 }
            )
        }

        const email = normalizeEmail(result.data.email)

        // Rate Limit
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        const limit = await checkRateLimit(ip, 'forgot-password', 5, 60 * 60 * 1000) // 5 tentativas por hora

        if (!limit.success) {
            return NextResponse.json(
                { error: 'Muitas tentativas. Tente novamente mais tarde.' },
                { status: 429 }
            )
        }

        const db = await getDb()
        const user = await db.collection('users').findOne({ email })

        // Generic response for security
        const genericResponse = NextResponse.json({
            message: 'Se um cadastro com este e-mail existir, você receberá um link para redefinir sua senha.'
        })

        if (!user) {
            return genericResponse
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: expiry
                }
            }
        )

        try {
            await sendPasswordResetEmail(user.email, resetToken)
        } catch (emailError) {
            console.error('Failed to send reset email:', emailError)
            // Even if email fails, we return success to not leak info? 
            // Or maybe 500? Security-wise, distinct error might leak user existence (if we only try for existing users).
            // Given we are inside the "if user" block, failing here implies user exists.
            // So we should return the generic response or a generic "Service Unavailable".
            // Let's return generic response but log the error.
        }

        return genericResponse

    } catch (error) {
        console.error('Forgot password error:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
