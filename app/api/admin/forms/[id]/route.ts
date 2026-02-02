import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const db = await getDb()
        const form = await db.collection('forms').findOne({ _id: new ObjectId(params.id) })

        if (!form) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 })
        }

        return NextResponse.json({ form })
    } catch (error) {
        console.error('Error fetching form:', error)
        return NextResponse.json({ error: 'Error fetching form' }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const db = await getDb()

        const updateData = {
            ...body,
            updatedAt: new Date()
        }
        delete updateData._id // Prevent updating _id

        const result = await db.collection('forms').updateOne(
            { _id: new ObjectId(params.id) },
            { $set: updateData }
        )

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating form:', error)
        return NextResponse.json({ error: 'Error updating form' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const db = await getDb()
        const result = await db.collection('forms').deleteOne({ _id: new ObjectId(params.id) })

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Form not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting form:', error)
        return NextResponse.json({ error: 'Error deleting form' }, { status: 500 })
    }
}
