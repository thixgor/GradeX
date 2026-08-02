import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; responseId: string } }
) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!ObjectId.isValid(params.id) || !ObjectId.isValid(params.responseId)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const db = await getDb()

        // Só apaga se a resposta realmente pertence a este formulário.
        const result = await db.collection('form_responses').deleteOne({
            _id: new ObjectId(params.responseId),
            formId: params.id,
        })

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
        }

        // Mantém o contador em cache consistente (sem deixar ficar negativo).
        await db.collection('forms').updateOne(
            { _id: new ObjectId(params.id), responseCount: { $gt: 0 } },
            { $inc: { responseCount: -1 } }
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting response:', error)
        return NextResponse.json({ error: 'Erro ao excluir resposta' }, { status: 500 })
    }
}
