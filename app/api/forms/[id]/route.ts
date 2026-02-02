import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const db = await getDb()
        const form = await db.collection('forms').findOne({ _id: new ObjectId(params.id) })

        if (!form) {
            return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
        }

        // Check if active
        if (!form.settings.isActive) {
            return NextResponse.json({ error: 'Este formulário não está aceitando respostas no momento.' }, { status: 403 })
        }

        // Check deadline
        if (form.settings.deadline && new Date() > new Date(form.settings.deadline)) {
            return NextResponse.json({ error: 'O prazo para este formulário encerrou.' }, { status: 403 })
        }

        // Check limits
        if (form.settings.responseLimit && form.responseCount >= form.settings.responseLimit) {
            return NextResponse.json({ error: 'Este formulário atingiu o limite de respostas.' }, { status: 403 })
        }

        return NextResponse.json({ form })
    } catch (error) {
        console.error('Error fetching form:', error)
        return NextResponse.json({ error: 'Erro ao carregar formulário' }, { status: 500 })
    }
}
