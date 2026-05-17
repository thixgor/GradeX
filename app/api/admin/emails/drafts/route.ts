import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface DraftPayload {
    id?: string
    name?: string
    subject?: string
    previewText?: string
    blocks?: unknown
    attachmentType?: string
    selectedMaterialId?: string
    selectedFlashcardId?: string
    customLinkUrl?: string
    customLinkTitle?: string
    customLinkDescription?: string
    attachmentCtaText?: string
    selectedTemplateId?: string
}

export async function GET() {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const db = await getDb()
        const drafts = await db
            .collection('emailDrafts')
            .find({})
            .sort({ updatedAt: -1 })
            .limit(100)
            .toArray()

        return NextResponse.json({
            drafts: drafts.map(d => ({
                ...d,
                _id: d._id.toString(),
                createdBy: d.createdBy ? String(d.createdBy) : undefined,
            })),
        })
    } catch (error) {
        console.error('List drafts error:', error)
        return NextResponse.json({ error: 'Erro ao listar rascunhos' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getSession()
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
        }

        const body: DraftPayload = await request.json()
        const now = new Date()
        const name = (body.name || body.subject || 'Rascunho sem título').toString().slice(0, 160)

        const data = {
            name,
            subject: body.subject || '',
            previewText: body.previewText || '',
            blocks: Array.isArray(body.blocks) ? body.blocks : [],
            attachmentType: body.attachmentType || 'none',
            selectedMaterialId: body.selectedMaterialId || '',
            selectedFlashcardId: body.selectedFlashcardId || '',
            customLinkUrl: body.customLinkUrl || '',
            customLinkTitle: body.customLinkTitle || '',
            customLinkDescription: body.customLinkDescription || '',
            attachmentCtaText: body.attachmentCtaText || '',
            selectedTemplateId: body.selectedTemplateId || '',
            updatedAt: now,
            updatedBy: session.userId,
        }

        const db = await getDb()
        const collection = db.collection('emailDrafts')

        if (body.id) {
            const result = await collection.findOneAndUpdate(
                { _id: new ObjectId(body.id) },
                { $set: data },
                { returnDocument: 'after' }
            )
            const doc = result?.value || result
            if (!doc) {
                return NextResponse.json({ error: 'Rascunho não encontrado' }, { status: 404 })
            }
            return NextResponse.json({
                draft: { ...doc, _id: doc._id.toString() },
            })
        }

        const inserted = await collection.insertOne({
            ...data,
            createdAt: now,
            createdBy: session.userId,
        })

        return NextResponse.json({
            draft: {
                ...data,
                _id: inserted.insertedId.toString(),
                createdAt: now,
                createdBy: session.userId,
            },
        })
    } catch (error) {
        console.error('Save draft error:', error)
        return NextResponse.json({ error: 'Erro ao salvar rascunho' }, { status: 500 })
    }
}
