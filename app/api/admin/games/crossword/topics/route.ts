import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
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
                puzzleCount: count
            }
        }))

        // 3. Find unique topics already in 'games_crosswords' that might not be in 'games_topics' (redundancy)
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

        // 4. Merge but favor the explicit ones (those with a real ObjectId in games_topics)
        const finalTopics = [...topicsWithCounts] as any[]

        existingPuzzleTopics.forEach(ept => {
            const exists = finalTopics.find(ft => (ft as any).name === (ept as any).name)
            if (!exists) {
                finalTopics.push(ept)
            }
        })

        return NextResponse.json({ topics: finalTopics })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    // Manually create a topic (dummy puzzle or separate metadata collection?)
    // Since we are schema-less regarding topics (derived from puzzles), 
    // strictly speaking we can't create a topic without a puzzle.
    // However, the import tool creates puzzles directly.
    // For manual creation in UI, we might need a separate 'games_metadata' collection headers.
    // For now, let's just create a dummy puzzle or allow the UI to handle "virtual" topics.
    // Simplifying: The UI currently calls this to "create topic".
    // I entered a dilemma: If I base topics on existing puzzles, I can't start a new empty topic.
    // Solution: Create a 'games_topics' collection to store explicitly created topics.

    try {
        const body = await req.json()
        const db = await getDb()
        const topic = {
            name: body.name,
            description: body.description,
            type: 'crossword',
            createdAt: new Date()
        }
        const res = await db.collection('games_topics').insertOne(topic)
        return NextResponse.json({ topic: { ...topic, _id: res.insertedId, puzzleCount: 0 } })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
