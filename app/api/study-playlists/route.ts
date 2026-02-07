import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

// GET - Public endpoint to fetch all active playlists
export async function GET(request: NextRequest) {
    try {
        const db = await getDb()

        const playlists = await db
            .collection('study_playlists')
            .find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .toArray()

        return NextResponse.json({
            success: true,
            playlists: playlists.map(p => ({
                _id: p._id.toString(),
                name: p.name,
                youtubePlaylistId: p.youtubePlaylistId,
                youtubeUrl: p.youtubeUrl,
                order: p.order
            }))
        })
    } catch (error) {
        console.error('Error fetching study playlists:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch playlists' },
            { status: 500 }
        )
    }
}
