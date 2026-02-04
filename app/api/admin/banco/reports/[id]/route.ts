import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const { id } = await params
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const db = await getDb()

        // Verificar admin
        const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const body = await request.json()
        const { status } = body

        if (!['pending', 'resolved', 'ignored'].includes(status)) {
            return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
        }

        await db.collection('banco_questoes_reports').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        )

        return NextResponse.json({ success: true, message: 'Status atualizado' })
    } catch (error) {
        console.error('Erro ao atualizar relato:', error)
        return NextResponse.json({ error: 'Erro ao atualizar relato' }, { status: 500 })
    }
}
