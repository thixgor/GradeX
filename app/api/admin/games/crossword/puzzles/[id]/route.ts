import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const db = await getDb()
        if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const puzzle = await db.collection('games_crosswords').findOne({ _id: new ObjectId(params.id) })
        if (!puzzle) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        return NextResponse.json({ puzzle })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const db = await getDb()
        if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        await db.collection('games_crosswords').deleteOne({ _id: new ObjectId(params.id) })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const db = await getDb()
        if (!ObjectId.isValid(params.id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const body = await req.json()
        const { _id, ...updateData } = body // Remove _id from update data

        await db.collection('games_crosswords').updateOne(
            { _id: new ObjectId(params.id) },
            { $set: { ...updateData, updatedAt: new Date() } }
        )
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
