import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import {
  secureApiEndpoint,
  validateUploadedFile,
  validateFileMagicBytes,
  MAX_FILE_SIZES
} from '@/lib/api-security'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verificar rate limit e autorizacao
    const security = await secureApiEndpoint(request, {
      rateLimit: 'UPLOAD',
      auth: {
        requireAuth: true
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo fornecido' },
        { status: 400 }
      )
    }

    // Validar arquivo (tipo, extensao, tamanho)
    const validation = validateUploadedFile(file, 'all', MAX_FILE_SIZES.default)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Ler conteudo do arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Validar magic bytes (verificar se conteudo corresponde ao tipo declarado)
    const magicValidation = await validateFileMagicBytes(bytes)
    if (!magicValidation.valid) {
      return NextResponse.json(
        { error: 'Conteudo do arquivo nao corresponde ao tipo declarado' },
        { status: 400 }
      )
    }

    // Cria diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gera nome unico e seguro para o arquivo
    // Usa UUID + hash para evitar previsibilidade e colisoes
    const timestamp = Date.now()
    const randomId = crypto.randomUUID()
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()

    // Nome final: timestamp-uuid.extensao
    // Isso evita ataques de path traversal e garante unicidade
    const filename = `${timestamp}-${randomId}${extension}`
    const filepath = join(uploadsDir, filename)

    // Salva o arquivo
    await writeFile(filepath, buffer)

    // Retorna a URL pública
    const url = `/uploads/${filename}`

    return NextResponse.json({
      success: true,
      url,
      filename: validation.sanitizedName || file.name,
      size: file.size,
      type: file.type
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    )
  }
}
