import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

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

    // Testar conexão diretamente com a API Gemini
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Teste de conexão. Responda apenas "OK".',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 100,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      
      const errorMessage = errorData.error?.message || response.statusText
      return NextResponse.json({
        success: false,
        error: `Falha ao conectar com a API Gemini: ${errorMessage}`
      }, { status: response.status })
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      return NextResponse.json({
        success: false,
        error: 'Resposta vazia da API Gemini'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Conexão estabelecida com sucesso',
      response: generatedText
    })
  } catch (error: any) {
    console.error('Test Gemini connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao testar conexão'
    }, { status: 500 })
  }
}
