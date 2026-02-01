import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()
        const topics = await db.collection('games_topics').find({ type: 'error-hunt' }).toArray()

        const topicsWithCounts = await Promise.all(topics.map(async (t) => {
            const count = await db.collection('games_error_hunt').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return { ...t, questionCount: count }
        }))

        const activeTopics = topicsWithCounts.filter(t => t.questionCount > 0)
        return NextResponse.json({ topics: activeTopics })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
