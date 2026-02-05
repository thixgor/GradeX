import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()

        // 1. Get explicitly created topics
        const explicitTopics = await db.collection('games_topics').find({ type: 'hangman' }).toArray()

        // 2. Map counts
        const topicsWithCounts = await Promise.all(explicitTopics.map(async (t) => {
            const count = await db.collection('games_hangman').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return {
                ...t,
                wordCount: count,
                name: t.name
            }
        }))

        // 3. Redundancy from existing words
        const existingWordTopics = await db.collection('games_hangman').aggregate([
            {
                $group: {
                    _id: "$topic",
                    module: { $first: "$module" },
                    wordCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: "$_id",
                    name: "$_id",
                    module: "$module",
                    wordCount: "$wordCount"
                }
            }
        ]).toArray()

        // 4. Merge
        const finalTopics = [...topicsWithCounts] as any[]

        existingWordTopics.forEach(ewt => {
            const exists = finalTopics.find(ft => ft.name === ewt.name)
            if (!exists) {
                finalTopics.push(ewt)
            }
        })

        const activeTopics = finalTopics.filter(t => t.wordCount > 0)

        return NextResponse.json({ topics: activeTopics })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
