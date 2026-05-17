import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        if (!ObjectId.isValid(params.id)) {
            return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
        }

        const db = await getDb()
        const result = await db
            .collection('emailDrafts')
            .deleteOne({ _id: new ObjectId(params.id) })

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete draft error:', error)
        return NextResponse.json({ error: 'Erro ao excluir rascunho' }, { status: 500 })
    }
}
