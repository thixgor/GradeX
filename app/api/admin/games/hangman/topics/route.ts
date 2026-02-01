import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()
        // Find topics of type 'hangman'
        const topics = await db.collection('games_topics').find({ type: 'hangman' }).toArray()

        // Also fetch aggregation from existing words to ensure we catch imported ones that might not have syncd correctly (redundancy)
        // Or just trust games_topics based on my import logic.

        // We need 'wordCount'.
        const topicsWithCounts = await Promise.all(topics.map(async (t) => {
            const count = await db.collection('games_hangman').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return { ...t, wordCount: count }
        }))

        return NextResponse.json({ topics: topicsWithCounts })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const db = await getDb()
        const topic = {
            name: body.name,
            description: body.description,
            type: 'hangman',
            createdAt: new Date()
        }
        await db.collection('games_topics').insertOne(topic)
        return NextResponse.json({ topic: { ...topic, wordCount: 0 } })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
