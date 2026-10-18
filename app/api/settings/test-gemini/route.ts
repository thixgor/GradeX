import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { decifrarSegredoDeConfig, ehMascara } from '@/lib/ia/cripto-config'
import { ErroGemini, gerarConteudoGemini, modelosGemini } from '@/lib/ia/gemini'

export const dynamic = 'force-dynamic'

const SECOES = ['generalExams', 'personalExams', 'flashcards'] as const

/**
 * POST {apiKey?, secao?} — testa uma chave com o modelo principal configurado.
 * O painel só conhece a chave mascarada depois de salva: com a máscara (ou sem
 * chave) o teste usa a gravada da seção (`secao` ausente = a chave padrão).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const secao = SECOES.find((s) => s === body?.secao)
    let apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
    if (!apiKey || ehMascara(apiKey)) {
      const db = await getDb()
      const doc = secao
        ? await db.collection('landing_settings').findOne({}, { projection: { aiKeys: 1 } })
        : await db.collection('settings').findOne({}, { projection: { geminiApiKey: 1 } })
      apiKey = decifrarSegredoDeConfig(secao ? doc?.aiKeys?.[secao] : doc?.geminiApiKey)
    }
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key é obrigatória' }, { status: 400 })
    }

    const modelos = await modelosGemini()
    try {
      const { texto, modelo } = await gerarConteudoGemini({
        chaves: [apiKey],
        modelos,
        corpo: { contents: [{ parts: [{ text: 'Teste de conexão. Responda apenas "OK".' }] }], generationConfig: { maxOutputTokens: 100 } },
        timeoutMs: 20_000,
        prazoMs: 40_000,
      })
      return NextResponse.json({ success: true, message: `Conexão estabelecida com sucesso (${modelo})`, modelo, response: texto.slice(0, 50) })
    } catch (e) {
      const erro = e instanceof ErroGemini ? e : null
      return NextResponse.json(
        { success: false, error: `Falha ao conectar com a API Gemini: ${erro?.message || 'erro desconhecido'}` },
        { status: erro?.status && erro.status >= 400 ? erro.status : 502 },
      )
    }
  } catch (error: any) {
    console.error('Test Gemini connection error:', error?.message)
    return NextResponse.json({ success: false, error: 'Erro ao testar conexão' }, { status: 500 })
  }
}
