import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

// GET - Servir arquivo de upload
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const uploadsCollection = db.collection('forum_uploads')

    const fileDoc = await uploadsCollection.findOne({ _id: new ObjectId(id) })

    if (!fileDoc) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    // Converter base64 de volta para buffer
    const buffer = Buffer.from(fileDoc.data, 'base64')

    // Retornar com headers apropriados
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileDoc.mimeType,
        'Content-Disposition': `inline; filename="${fileDoc.originalName}"`,
        'Cache-Control': 'public, max-age=31536000', // 1 ano
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Erro ao baixar arquivo' },
      { status: 500 }
    )
  }
}
