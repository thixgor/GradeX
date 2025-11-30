import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// POST - Upload de arquivo (imagem ou PDF)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipo de arquivo não permitido. Use apenas imagens (JPEG, PNG, GIF, WEBP) ou PDF'
      }, { status: 400 })
    }

    // Validar tamanho
    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 2 * 1024 * 1024 // 10MB para PDF, 2MB para imagens
    if (file.size > maxSize) {
      const maxSizeMB = file.type === 'application/pdf' ? '10MB' : '2MB'
      return NextResponse.json({
        error: `Arquivo muito grande. Tamanho máximo: ${maxSizeMB}`
      }, { status: 400 })
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Salvar no MongoDB
    const db = await getDb()
    const uploadsCollection = db.collection('forum_uploads')

    const fileDoc = {
      fileName: file.name,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      data: base64,
      uploadedBy: session.userId,
      uploadedByName: session.name,
      uploadedAt: new Date(),
      type: file.type.startsWith('image/') ? 'image' : 'pdf'
    }

    const result = await uploadsCollection.insertOne(fileDoc)

    return NextResponse.json({
      success: true,
      url: `/api/forum/uploads/${result.insertedId}`,
      name: file.name,
      size: file.size,
      type: file.type.startsWith('image/') ? 'image' : 'pdf'
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
