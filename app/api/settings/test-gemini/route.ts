import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { testGeminiConnection } from '@/lib/gemini-corrector'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key é obrigatória' },
        { status: 400 }
      )
    }

    // Testar conexão com a API key fornecida
    const isConnected = await testGeminiConnection(apiKey)

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Conexão estabelecida com sucesso'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Falha ao conectar com a API Gemini. Verifique se a API Key está correta.'
      })
    }
  } catch (error: any) {
    console.error('Test Gemini connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao testar conexão'
    })
  }
}
