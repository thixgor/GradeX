import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { ObjectId } from 'mongodb'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

async function verifyAdmin() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('auth-token')?.value

        if (!token) return null

        const { payload } = await jwtVerify(token, JWT_SECRET)

        if (payload.role !== 'admin') return null

        return payload
    } catch {
        return null
    }
}

function extractPlaylistId(url: string): string | null {
    try {
        const urlObj = new URL(url)

        // Handle youtube.com/playlist?list=
        if (urlObj.searchParams.has('list')) {
            return urlObj.searchParams.get('list')
        }

        // Handle youtu.be or youtube.com/watch with list param
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.searchParams.get('list')
        }

        return null
    } catch {
        // If URL parsing fails, try to extract with regex
        const match = url.match(/[?&]list=([^&]+)/)
        return match ? match[1] : null
    }
}

// GET - List all playlists (admin only)
export async function GET(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const db = await getDb()

        const playlists = await db
            .collection('study_playlists')
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray()

        return NextResponse.json({
            success: true,
            playlists: playlists.map(p => ({
                ...p,
                _id: p._id.toString()
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

// POST - Create new playlist (admin only)
export async function POST(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, youtubeUrl } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Nome da playlist é obrigatório' },
                { status: 400 }
            )
        }

        if (name.length > 100) {
            return NextResponse.json(
                { success: false, error: 'Nome muito longo (máx. 100 caracteres)' },
                { status: 400 }
            )
        }

        if (!youtubeUrl || typeof youtubeUrl !== 'string') {
            return NextResponse.json(
                { success: false, error: 'URL do YouTube é obrigatória' },
                { status: 400 }
            )
        }

        const playlistId = extractPlaylistId(youtubeUrl)

        if (!playlistId) {
            return NextResponse.json(
                { success: false, error: 'URL de playlist inválida. Use o formato: https://www.youtube.com/playlist?list=...' },
                { status: 400 }
            )
        }

        const db = await getDb()

        // Check for duplicate
        const existing = await db.collection('study_playlists').findOne({
            youtubePlaylistId: playlistId
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Esta playlist já está cadastrada' },
                { status: 400 }
            )
        }

        // Get current max order
        const maxOrderDoc = await db
            .collection('study_playlists')
            .findOne({}, { sort: { order: -1 } })

        const nextOrder = (maxOrderDoc?.order || 0) + 1

        const result = await db.collection('study_playlists').insertOne({
            name: name.trim(),
            youtubeUrl: youtubeUrl.trim(),
            youtubePlaylistId: playlistId,
            isActive: true,
            order: nextOrder,
            createdAt: new Date(),
            updatedAt: new Date()
        })

        return NextResponse.json({
            success: true,
            playlistId: result.insertedId.toString()
        })
    } catch (error) {
        console.error('Error creating study playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create playlist' },
            { status: 500 }
        )
    }
}

// PATCH - Update playlist (admin only)
export async function PATCH(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { id, name, youtubeUrl, isActive, order } = body

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID é obrigatório' },
                { status: 400 }
            )
        }

        const db = await getDb()

        const updateData: Record<string, unknown> = {
            updatedAt: new Date()
        }

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Nome inválido' },
                    { status: 400 }
                )
            }
            if (name.length > 100) {
                return NextResponse.json(
                    { success: false, error: 'Nome muito longo (máx. 100 caracteres)' },
                    { status: 400 }
                )
            }
            updateData.name = name.trim()
        }

        if (youtubeUrl !== undefined) {
            const playlistId = extractPlaylistId(youtubeUrl)
            if (!playlistId) {
                return NextResponse.json(
                    { success: false, error: 'URL de playlist inválida' },
                    { status: 400 }
                )
            }
            updateData.youtubeUrl = youtubeUrl.trim()
            updateData.youtubePlaylistId = playlistId
        }

        if (isActive !== undefined) {
            updateData.isActive = Boolean(isActive)
        }

        if (order !== undefined) {
            updateData.order = Number(order)
        }

        await db.collection('study_playlists').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating study playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update playlist' },
            { status: 500 }
        )
    }
}

// DELETE - Remove playlist (admin only)
export async function DELETE(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID é obrigatório' },
                { status: 400 }
            )
        }

        const db = await getDb()

        await db.collection('study_playlists').deleteOne({
            _id: new ObjectId(id)
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting study playlist:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete playlist' },
            { status: 500 }
        )
    }
}
