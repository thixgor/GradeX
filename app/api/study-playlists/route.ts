import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

/**
 * Catálogo público de músicas de estudo (é daqui que o player se abastece).
 *
 * `force-dynamic` + `no-store` não são zelo: sem eles esta rota é elegível a
 * cache — no build do Next e na borda da Vercel. O sintoma era exatamente o
 * relatado, "cadastro no admin e não aparece": o painel mostrava a playlist
 * nova (aquela rota lê cookies, então nunca foi cacheável) enquanto o player
 * continuava recebendo a lista congelada de antes. Praticamente todas as
 * outras rotas do projeto já declaram isto.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
    try {
        const db = await getDb()

        const playlists = await db
            .collection('study_playlists')
            .find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .toArray()

        return NextResponse.json(
            {
                success: true,
                playlists: playlists
                    .map((p) => ({
                        _id: p._id.toString(),
                        name: p.name,
                        youtubePlaylistId: p.youtubePlaylistId ?? null,
                        youtubeVideoId: p.youtubeVideoId ?? null,
                        youtubeUrl: p.youtubeUrl,
                        order: p.order,
                    }))
                    // Um registro sem nada tocável (documento antigo, importação
                    // pela metade) faria o player montar um iframe vazio e ficar
                    // "carregando" para sempre. Melhor nem ofertar.
                    .filter((p) => p.youtubePlaylistId || p.youtubeVideoId),
            },
            { headers: { 'Cache-Control': 'no-store, max-age=0' } },
        )
    } catch (error) {
        console.error('Error fetching study playlists:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch playlists' },
            { status: 500, headers: { 'Cache-Control': 'no-store, max-age=0' } },
        )
    }
}
