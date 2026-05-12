import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { denyDisabledSectionApi } from '@/lib/sidebar-section-access'

export async function GET() {
    try {
        const disabledResponse = await denyDisabledSectionApi('games')
        if (disabledResponse) return disabledResponse

        const db = await getDb()

        const crosswordCount = await db.collection('games_crosswords').countDocuments({})
        const hangmanCount = await db.collection('games_hangman').countDocuments({})
        const errorHuntCount = await db.collection('games_error_hunt').countDocuments({})

        // Topics stats
        const topicsCount = await db.collection('games_topics').countDocuments({})

        return NextResponse.json({
            crossword: crosswordCount,
            hangman: hangmanCount,
            errorHunt: errorHuntCount,
            totalTopics: topicsCount,
            recentActivity: [] // Placeholder
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}
