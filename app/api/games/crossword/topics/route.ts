import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()
        // Mesma agregação usada no admin para listar tópicos
        const topics = await db.collection('games_topics').find({ type: 'crossword' }).toArray()

        // Populate count if needed, or rely on aggregation from puzzles if preferred.
        // The admin route used aggregation from crosswords collection directly in one version, 
        // and games_topics in another. Let's use games_topics for consistency if imported.
        // But wait, the admin route for crossword topics used aggregation on 'games_crosswords'.
        // Let's check what I implemented in admin route step 182.

        // Actually, Step 182 implemented aggregation on 'games_crosswords'.
        // Then I updated import to use 'games_topics'.
        // Let's use 'games_topics' as primary source, and count puzzles.

        const topicsWithCounts = await Promise.all(topics.map(async (t) => {
            // Count puzzles for this topic
            const count = await db.collection('games_crosswords').countDocuments({
                $or: [{ topicId: t._id.toString() }, { topic: t.name }]
            })
            // If count > 0 or we want to show empty topics
            return { ...t, puzzleCount: count }
        }))

        // Filter out topics with 0 puzzles if desired for end-users? 
        // Let's keep them to match admin view or filter? Users only want playable content.
        const activeTopics = topicsWithCounts.filter(t => t.puzzleCount > 0)

        return NextResponse.json({ topics: activeTopics })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
