import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { denyDisabledSectionApi } from '@/lib/sidebar-section-access'

export async function GET() {
    try {
        const disabledResponse = await denyDisabledSectionApi('games')
        if (disabledResponse) return disabledResponse

        const db = await getDb()

        // 1. Get explicitly created topics from 'games_topics'
        const explicitTopics = await db.collection('games_topics').find({ type: 'crossword' }).toArray()

        // 2. Map counts to explicit topics
        const topicsWithCounts = await Promise.all(explicitTopics.map(async (t) => {
            const count = await db.collection('games_crosswords').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            return {
                ...t,
                puzzleCount: count,
                name: t.name
            }
        }))

        // 3. Find unique topics already in 'games_crosswords' for redundancy
        const existingPuzzleTopics = await db.collection('games_crosswords').aggregate([
            {
                $group: {
                    _id: "$topic",
                    module: { $first: "$module" },
                    description: { $first: "$description" },
                    puzzleCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: "$_id",
                    name: "$_id",
                    module: "$module",
                    description: "$description",
                    puzzleCount: "$puzzleCount"
                }
            }
        ]).toArray()

        // 4. Merge but favor the explicit ones
        const finalTopics = [...topicsWithCounts] as any[]

        existingPuzzleTopics.forEach(ept => {
            const exists = finalTopics.find(ft => ft.name === ept.name)
            if (!exists) {
                finalTopics.push(ept)
            }
        })

        // Filter out topics with 0 puzzles (users shouldn't see empty rooms)
        const activeTopics = finalTopics.filter(t => t.puzzleCount > 0)

        // Cache game topics for 10 minutes (rarely change)
        const headers = new Headers({
            'Cache-Control': 'no-store',
            'Content-Type': 'application/json',
        })

        return NextResponse.json({ topics: activeTopics }, { headers })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
