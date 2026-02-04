import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const db = await getDb()

        // Verificar admin
        const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')
        const page = parseInt(searchParams.get('page') || '1')

        const query: any = {}
        if (status && status !== 'all') {
            query.status = status
        }

        const skip = (page - 1) * limit

        const reports = await db.collection('banco_questoes_reports')
            .aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'banco_questoes',
                        localField: 'questionId',
                        foreignField: '_id',
                        as: 'question'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        reason: 1,
                        description: 1,
                        status: 1,
                        createdAt: 1,
                        questionId: 1,
                        questionEnunciado: { $arrayElemAt: ['$question.enunciado', 0] },
                        userName: { $arrayElemAt: ['$user.name', 0] },
                        userEmail: { $arrayElemAt: ['$user.email', 0] }
                    }
                }
            ])
            .toArray()

        const total = await db.collection('banco_questoes_reports').countDocuments(query)
        const unreadCount = await db.collection('banco_questoes_reports').countDocuments({ status: 'pending' })

        return NextResponse.json({
            reports,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        })
    } catch (error) {
        console.error('Erro ao buscar relatos:', error)
        return NextResponse.json({ error: 'Erro ao buscar relatos' }, { status: 500 })
    }
}
