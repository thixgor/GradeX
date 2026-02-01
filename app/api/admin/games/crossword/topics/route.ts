import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET() {
    try {
        const db = await getDb()
        // Aggregation to find unique topics and count puzzles
        const topics = await db.collection('games_crosswords').aggregate([
            {
                $group: {
                    _id: "$topic",
                    module: { $first: "$module" },
                    description: { $first: "$description" }, // Just pick first one for now
                    puzzleCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: "$_id", // This is the topic name
                    name: "$_id",
                    // Use module in name if needed, or just return as is
                    module: "$module",
                    description: "$description",
                    puzzleCount: "$puzzleCount"
                }
            }
        ]).toArray()

        return NextResponse.json({ topics })
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
