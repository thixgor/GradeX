import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { ObjectId } from 'mongodb'
import { lerLinkDoYouTube } from '@/lib/musica/link-do-youtube'

// Ver o comentário da rota pública: esta lê cookies e portanto já era dinâmica,
// mas declarar é o padrão do projeto e protege contra regressão.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

const NOME_MAXIMO = 100

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

function semCache(body: unknown, init?: { status?: number }) {
    return NextResponse.json(body, {
        status: init?.status ?? 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
}

function erro(motivo: string, status = 400) {
    return semCache({ success: false, error: motivo }, { status })
}

function idValido(id: unknown): id is string {
    return typeof id === 'string' && ObjectId.isValid(id)
}

// GET - List all playlists (admin only)
export async function GET() {
    const admin = await verifyAdmin()
    if (!admin) return erro('Unauthorized', 401)

    try {
        const db = await getDb()

        const playlists = await db
            .collection('study_playlists')
            .find({})
            .sort({ order: 1, createdAt: -1 })
            .toArray()

        return semCache({
            success: true,
            playlists: playlists.map((p) => ({
                _id: p._id.toString(),
                name: p.name,
                youtubeUrl: p.youtubeUrl,
                youtubePlaylistId: p.youtubePlaylistId ?? null,
                youtubeVideoId: p.youtubeVideoId ?? null,
                isActive: p.isActive !== false,
                order: typeof p.order === 'number' ? p.order : 0,
                createdAt: p.createdAt ?? null,
                updatedAt: p.updatedAt ?? null,
            })),
        })
    } catch (error) {
        console.error('Error fetching study playlists:', error)
        return erro('Failed to fetch playlists', 500)
    }
}

// POST - Create new playlist (admin only)
export async function POST(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return erro('Unauthorized', 401)

    try {
        const body = await request.json()
        const { name, youtubeUrl } = body

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return erro('Dê um nome para essa música ou playlist.')
        }
        if (name.trim().length > NOME_MAXIMO) {
            return erro(`Nome muito longo (máx. ${NOME_MAXIMO} caracteres).`)
        }
        if (typeof youtubeUrl !== 'string') {
            return erro('Cole o link do YouTube.')
        }

        const leitura = lerLinkDoYouTube(youtubeUrl)
        if (!leitura.ok) return erro(leitura.motivo)

        const db = await getDb()

        // Duplicidade: a mesma playlist (ou a mesma faixa) cadastrada duas vezes
        // só faz o sorteio inicial do player repetir.
        const jaExiste = await db.collection('study_playlists').findOne(
            leitura.item.tipo === 'playlist'
                ? { youtubePlaylistId: leitura.item.playlistId }
                : { youtubeVideoId: leitura.item.videoId },
        )
        if (jaExiste) {
            return erro(`"${jaExiste.name}" já usa esse mesmo link.`)
        }

        const maxOrderDoc = await db
            .collection('study_playlists')
            .findOne({}, { sort: { order: -1 } })

        const nextOrder = (typeof maxOrderDoc?.order === 'number' ? maxOrderDoc.order : 0) + 1

        const result = await db.collection('study_playlists').insertOne({
            name: name.trim(),
            youtubeUrl: leitura.url,
            youtubePlaylistId: leitura.item.playlistId,
            youtubeVideoId: leitura.item.videoId,
            isActive: true,
            order: nextOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
        })

        return semCache({ success: true, playlistId: result.insertedId.toString() })
    } catch (error) {
        console.error('Error creating study playlist:', error)
        return erro('Failed to create playlist', 500)
    }
}

// PATCH - Update playlist (admin only)
export async function PATCH(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return erro('Unauthorized', 401)

    try {
        const body = await request.json()
        const { id, name, youtubeUrl, isActive, order } = body

        // `new ObjectId(lixo)` lança, e a mensagem que chegava era o genérico
        // "Failed to update playlist" — que não ajudava ninguém.
        if (!idValido(id)) return erro('Registro inválido.')

        const db = await getDb()

        const updateData: Record<string, unknown> = { updatedAt: new Date() }

        if (name !== undefined) {
            if (typeof name !== 'string' || name.trim().length === 0) {
                return erro('Dê um nome para essa música ou playlist.')
            }
            if (name.trim().length > NOME_MAXIMO) {
                return erro(`Nome muito longo (máx. ${NOME_MAXIMO} caracteres).`)
            }
            updateData.name = name.trim()
        }

        if (youtubeUrl !== undefined) {
            const leitura = lerLinkDoYouTube(String(youtubeUrl))
            if (!leitura.ok) return erro(leitura.motivo)

            // A checagem de duplicidade existia só na criação: dava para EDITAR
            // uma playlist até ela virar cópia de outra.
            const conflito = await db.collection('study_playlists').findOne({
                _id: { $ne: new ObjectId(id) },
                ...(leitura.item.tipo === 'playlist'
                    ? { youtubePlaylistId: leitura.item.playlistId }
                    : { youtubeVideoId: leitura.item.videoId }),
            })
            if (conflito) return erro(`"${conflito.name}" já usa esse mesmo link.`)

            updateData.youtubeUrl = leitura.url
            updateData.youtubePlaylistId = leitura.item.playlistId
            updateData.youtubeVideoId = leitura.item.videoId
        }

        if (isActive !== undefined) {
            updateData.isActive = Boolean(isActive)
        }

        if (order !== undefined) {
            const n = Number(order)
            if (!Number.isFinite(n)) return erro('Ordem inválida.')
            updateData.order = n
        }

        const resultado = await db
            .collection('study_playlists')
            .updateOne({ _id: new ObjectId(id) }, { $set: updateData })

        // Antes o painel dizia "atualizada com sucesso" mesmo quando o registro
        // já tinha sido apagado em outra aba, e nada mudava na lista.
        if (resultado.matchedCount === 0) {
            return erro('Esse registro não existe mais. Atualize a página.', 404)
        }

        return semCache({ success: true })
    } catch (error) {
        console.error('Error updating study playlist:', error)
        return erro('Failed to update playlist', 500)
    }
}

// DELETE - Remove playlist (admin only)
export async function DELETE(request: NextRequest) {
    const admin = await verifyAdmin()
    if (!admin) return erro('Unauthorized', 401)

    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!idValido(id)) return erro('Registro inválido.')

        const db = await getDb()

        const resultado = await db
            .collection('study_playlists')
            .deleteOne({ _id: new ObjectId(id) })

        if (resultado.deletedCount === 0) {
            return erro('Esse registro não existe mais. Atualize a página.', 404)
        }

        return semCache({ success: true })
    } catch (error) {
        console.error('Error deleting study playlist:', error)
        return erro('Failed to delete playlist', 500)
    }
}
