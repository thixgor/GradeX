import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const db = await getDb()
        const id = params.id

        // Support finding by topic Name or topic ID
        let query: any = { topic: id }
        if (ObjectId.isValid(id)) {
            query = { $or: [{ topicId: id }, { topic: id }] }
        } else {
            // Case insensitive search for topic name?
            query = { topic: id }
        }

        const puzzles = await db.collection('games_crosswords').find(query).toArray()
        return NextResponse.json({ puzzles })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const db = await getDb()

        const puzzle = {
            ...body,
            topicId: params.id,
            createdAt: new Date()
        }
        delete puzzle._id

        await db.collection('games_crosswords').insertOne(puzzle)
        return NextResponse.json({ puzzle })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
