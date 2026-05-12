import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { denyDisabledSectionApi } from '@/lib/sidebar-section-access'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const disabledResponse = await denyDisabledSectionApi('games')
        if (disabledResponse) return disabledResponse

        const db = await getDb()
        const id = params.id

        // Support finding by topic Name or topic ID
        let query: any = { topic: id }
        if (ObjectId.isValid(id)) {
            query = { $or: [{ topicId: id }, { topic: id }] }
        } else {
            query = { topic: id }
        }

        // Return words for gameplay
        // Maybe hide sensitive data? Difficulty, hint are fine.
        const words = await db.collection('games_hangman').find(query).toArray()
        return NextResponse.json({ words })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
