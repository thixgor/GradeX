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

        // Fetch all responses for this form
        const responses = await db.collection('form_responses')
            .find({ formId: params.id })
            .sort({ submittedAt: -1 })
            .toArray()

        return NextResponse.json({ responses })
    } catch (error) {
        console.error('Error fetching responses:', error)
        return NextResponse.json({ error: 'Error fetching responses' }, { status: 500 })
    }
}
