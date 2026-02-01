
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
        }

        const db = await getDb()
        const usersCollection = db.collection<User>('users')

        const user = await usersCollection.findOne({ verificationToken: token })

        if (!user) {
            return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 400 })
        }

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: { emailVerified: true },
                $unset: { verificationToken: "" }
            }
        )

        return NextResponse.json({ success: true, message: 'E-mail verificado com sucesso' })
    } catch (error) {
        console.error('Verify error:', error)
        return NextResponse.json({ error: 'Erro ao verificar e-mail' }, { status: 500 })
    }
}
