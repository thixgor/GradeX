import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()
        const topics = await db.collection('games_topics').find({ type: 'hangman' }).toArray()

        const topicsWithCounts = await Promise.all(topics.map(async (t) => {
            const count = await db.collection('games_hangman').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return { ...t, wordCount: count }
        }))

        const activeTopics = topicsWithCounts.filter(t => t.wordCount > 0)

        return NextResponse.json({ topics: activeTopics })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
