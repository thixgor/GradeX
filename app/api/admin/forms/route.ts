import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Form } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const db = await getDb()
        const forms = await db.collection('forms').find({}).sort({ createdAt: -1 }).toArray()

        return NextResponse.json({ forms })
    } catch (error) {
        console.error('Error fetching forms:', error)
        return NextResponse.json({ error: 'Error fetching forms' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        // Validation
        if (!body.title) {
            return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 })
        }

        const newForm: Form = {
            title: body.title,
            description: body.description || '',
            blocks: body.blocks || [],
            settings: {
                isActive: true,
                sendConfirmationEmail: false,
                ...body.settings
            },
            createdBy: session.userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            responseCount: 0
        }

        const db = await getDb()
        const result = await db.collection('forms').insertOne(newForm as any)

        return NextResponse.json({ success: true, form: { ...newForm, _id: result.insertedId } })
    } catch (error) {
        console.error('Error creating form:', error)
        return NextResponse.json({ error: 'Error creating form' }, { status: 500 })
    }
}
