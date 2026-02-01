
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { User } from '@/lib/types'
import { sendVerificationEmail } from '@/lib/mail'
import crypto from 'crypto'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        // Rate Limit (1 por minuto)
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
        const limit = await checkRateLimit(ip, 'resend-verification', 1, 60 * 1000)

        if (!limit.success) {
            return NextResponse.json(
                { error: 'Aguarde um momento antes de reenviar.' },
                { status: 429 }
            )
        }

        const db = await getDb()
        const usersCollection = db.collection<User>('users')

        const user = await usersCollection.findOne({ email: session.email })

        if (!user) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        if (user.emailVerified) {
            return NextResponse.json({ error: 'E-mail já verificado' }, { status: 400 })
        }

        // Gerar novo token
        const verificationToken = crypto.randomBytes(32).toString('hex')

        await usersCollection.updateOne(
            { _id: user._id },
            { $set: { verificationToken } }
        )

        await sendVerificationEmail(user.email, verificationToken, user.name)

        return NextResponse.json({ success: true, message: 'Link reenviado com sucesso' })
    } catch (error) {
        console.error('Resend verify error:', error)
        return NextResponse.json({ error: 'Erro ao reenviar e-mail' }, { status: 500 })
    }
}
