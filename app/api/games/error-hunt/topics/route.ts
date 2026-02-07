import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()

        // 1. Get explicitly created topics
        const explicitTopics = await db.collection('games_topics').find({ type: 'error-hunt' }).toArray()

        // 2. Map counts
        const topicsWithCounts = await Promise.all(explicitTopics.map(async (t) => {
            const count = await db.collection('games_error_hunt').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return {
                ...t,
                questionCount: count,
                name: t.name
            }
        }))

        // 3. Redundancy from existing questions
        const existingQuestionTopics = await db.collection('games_error_hunt').aggregate([
            {
                $group: {
                    _id: "$topic",
                    module: { $first: "$module" },
                    questionCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: "$_id",
                    name: "$_id",
                    module: "$module",
                    questionCount: "$questionCount"
                }
            }
        ]).toArray()

        // 4. Merge
        const finalTopics = [...topicsWithCounts] as any[]

        existingQuestionTopics.forEach(eqt => {
            const exists = finalTopics.find(ft => ft.name === eqt.name)
            if (!exists) {
                finalTopics.push(eqt)
            }
        })

        const activeTopics = finalTopics.filter(t => t.questionCount > 0)
        const headers = new Headers({
            'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
            'Content-Type': 'application/json',
        })

        return NextResponse.json({ topics: activeTopics }, { headers })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
