import { Question, KeyPoint, Settings } from './types'
import { getDb } from './mongodb'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * Busca a API Key do Gemini do banco de dados
 */
async function getGeminiApiKey(): Promise<string> {
  try {
    const db = await getDb()
    const settingsCollection = db.collection<Settings>('settings')
    const settings = await settingsCollection.findOne({})

    if (!settings?.geminiApiKey) {
      throw new Error('API Key do Gemini não configurada. Configure em Configurações > API Gemini')
    }

    return settings.geminiApiKey
  } catch (error) {
    console.error('Erro ao buscar API Key do Gemini:', error)
    throw error
  }
}

interface CorrectionResult {
  score: number
  maxScore: number
  feedback: string
  keyPointsFound: string[]
}

/**
 * Corrige uma resposta discursiva usando Gemini 2.0 Flash
 * @param question A questão com os pontos-chave
 * @param studentAnswer A resposta do aluno
 * @param rigor Nível de rigor (0-1), padrão 0.45 (45%)
 * @returns Resultado da correção com nota, feedback e pontos-chave identificados
 */
export async function correctWithGemini(
  question: Question,
  studentAnswer: string,
  rigor: number = 0.45
): Promise<CorrectionResult> {
  if (!question.keyPoints || question.keyPoints.length === 0) {
    throw new Error('Questão sem pontos-chave definidos')
  }

  if (!question.maxScore) {
    throw new Error('Questão sem pontuação máxima definida')
  }

  // Construir o prompt para o Gemini
  const prompt = buildCorrectionPrompt(question, studentAnswer, rigor)

  // Buscar API Key do banco de dados
  const apiKey = await getGeminiApiKey()

  try {
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
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Baixa temperatura para respostas mais consistentes
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      throw new Error('Resposta vazia da API Gemini')
    }

    // Parsear a resposta do Gemini
    return parseCorrectionResponse(generatedText, question)
  } catch (error) {
    console.error('Erro ao corrigir com Gemini:', error)
    throw error
  }
}

/**
 * Constrói o prompt para a correção
 */
function buildCorrectionPrompt(question: Question, studentAnswer: string, rigor: number): string {
  const keyPointsList = question.keyPoints!
    .map((kp, idx) => `${idx + 1}. ${kp.description} (Peso: ${(kp.weight * 100).toFixed(0)}%)`)
    .join('\n')

  const rigorDescription = rigor < 0.3 ? 'LENIENTE' : rigor < 0.6 ? 'MODERADO' : 'RIGOROSO'

  return `Você é um corretor de questões discursivas com nível de rigor ${rigorDescription} (${(rigor * 100).toFixed(0)}%).

**QUESTÃO:**
${question.statement}

**COMANDO:**
${question.command}

**PONTOS-CHAVE ESPERADOS:**
${keyPointsList}

**PONTUAÇÃO MÁXIMA:** ${question.maxScore} pontos

**RESPOSTA DO ALUNO:**
${studentAnswer.trim() || '(Resposta em branco)'}

**INSTRUÇÕES DE CORREÇÃO:**
1. Analise a resposta do aluno e identifique quais pontos-chave foram mencionados
2. Para cada ponto-chave, verifique se o aluno demonstrou compreensão adequada
3. Aplique o rigor de ${(rigor * 100).toFixed(0)}% na avaliação:
   - Rigor LENIENTE: Aceite menções parciais e indiretas dos pontos-chave
   - Rigor MODERADO: Exija menções claras mas aceite pequenas imprecisões
   - Rigor RIGOROSO: Exija precisão e completude em cada ponto-chave
4. Calcule a nota proporcional aos pontos-chave identificados
5. Forneça feedback construtivo e específico

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
{
  "keyPointsFound": [1, 3],
  "score": 7.5,
  "feedback": "Seu feedback aqui"
}

Onde:
- keyPointsFound: array com os números dos pontos-chave identificados (1-indexed)
- score: nota numérica (0 a ${question.maxScore})
- feedback: texto com feedback construtivo (máximo 200 palavras)

IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.`
}

/**
 * Parseia a resposta do Gemini
 */
function parseCorrectionResponse(response: string, question: Question): CorrectionResult {
  try {
    // Extrair JSON da resposta (caso venha com texto adicional)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Gemini não contém JSON válido')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validar campos obrigatórios
    if (!Array.isArray(parsed.keyPointsFound)) {
      throw new Error('Campo keyPointsFound inválido')
    }

    if (typeof parsed.score !== 'number') {
      throw new Error('Campo score inválido')
    }

    if (typeof parsed.feedback !== 'string') {
      throw new Error('Campo feedback inválido')
    }

    // Converter índices (1-indexed) para IDs dos pontos-chave
    const keyPointIds = parsed.keyPointsFound
      .map((idx: number) => {
        if (idx < 1 || idx > question.keyPoints!.length) {
          return null
        }
        return question.keyPoints![idx - 1].id
      })
      .filter((id: string | null) => id !== null)

    // Garantir que a nota não exceda o máximo
    const score = Math.min(parsed.score, question.maxScore || 10)

    return {
      score: Math.round(score * 100) / 100, // 2 casas decimais
      maxScore: question.maxScore || 10,
      feedback: parsed.feedback.trim(),
      keyPointsFound: keyPointIds,
    }
  } catch (error) {
    console.error('Erro ao parsear resposta do Gemini:', error)
    console.error('Resposta recebida:', response)
    throw new Error('Falha ao interpretar resposta do corretor automático')
  }
}

/**
 * Testa a conexão com a API Gemini
 */
export async function testGeminiConnection(apiKey?: string): Promise<boolean> {
  try {
    // Usar API key fornecida ou buscar do banco
    const key = apiKey || await getGeminiApiKey()

    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': key,
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
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Erro ao testar conexão Gemini:', error)
    return false
  }
}
