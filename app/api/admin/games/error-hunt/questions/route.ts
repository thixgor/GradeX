import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: Request) {
    try {
        const db = await getDb()
        // Return all questions
        const questions = await db.collection('games_error_hunt').find({}).sort({ createdAt: -1 }).toArray()
        return NextResponse.json({ questions })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const db = await getDb()

        const question = {
            ...body,
            createdAt: new Date()
        }
        await db.collection('games_error_hunt').insertOne(question)
        return NextResponse.json({ question: { ...question, _id: question._id } })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
