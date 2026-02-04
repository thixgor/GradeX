import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

// Schema para validação
const reportSchema = z.object({
    reason: z.enum([
        'erro_gabarito',
        'enunciado_confuso',
        'imagem_ruim',
        'conteudo_desatualizado',
        'outros'
    ]),
    description: z.string().max(500).optional()
})

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
        }

        const { id } = await params
        if (!ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID da questão inválido' }, { status: 400 })
        }

        const body = await request.json()
        const validation = reportSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Dados inválidos', details: validation.error.format() }, { status: 400 })
        }

        const { reason, description } = validation.data

        // Se a razão for 'outros', a descrição é obrigatória
        if (reason === 'outros' && (!description || description.trim().length === 0)) {
            return NextResponse.json({ error: 'Descrição é obrigatória para "Outros"' }, { status: 400 })
        }

        const db = await getDb()

        // Verificar se a questão existe
        const questao = await db.collection('banco_questoes').findOne({ _id: new ObjectId(id) })
        if (!questao) {
            return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
        }

        // Criar o relato
        const report = {
            questionId: new ObjectId(id),
            userId: new ObjectId(session.userId),
            reason,
            description: description ? description.trim() : null,
            status: 'pending', // pending, resolved, ignored
            createdAt: new Date(),
            updatedAt: new Date()
        }

        await db.collection('banco_questoes_reports').insertOne(report)

        return NextResponse.json({ success: true, message: 'Relato enviado com sucesso' })
    } catch (error) {
        console.error('Erro ao enviar relato:', error)
        return NextResponse.json({ error: 'Erro interno ao processar relato' }, { status: 500 })
    }
}
