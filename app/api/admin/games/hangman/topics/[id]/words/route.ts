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
            query = { topic: id }
        }

        const words = await db.collection('games_hangman').find(query).toArray()
        return NextResponse.json({ words })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json()
        const db = await getDb()

        const word = {
            ...body,
            topicId: params.id,
            createdAt: new Date()
        }
        delete word._id

        await db.collection('games_hangman').insertOne(word)
        return NextResponse.json({ word })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
