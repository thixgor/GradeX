import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

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

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'forum')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomStr}.${extension}`
    const filePath = join(uploadsDir, fileName)

    // Converter o arquivo para buffer e salvar
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar URL pública do arquivo
    const fileUrl = `/uploads/forum/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
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
