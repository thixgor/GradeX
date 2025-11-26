import { Question, Alternative, KeyPoint, Settings } from './types'
import { getDb } from './mongodb'
import { v4 as uuidv4 } from 'uuid'

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

export interface QuestionGenerationParams {
  type: 'multiple-choice' | 'discursive'
  style: 'contextualizada' | 'rapida'
  subject: string // Tema/assunto da questão
  difficulty: number // 0-1 (0% a 100%)
  numberOfAlternatives?: number // Para múltipla escolha (padrão 5)
  useTRI?: boolean // Se deve gerar parâmetros TRI
  context: string // Contexto da questão (ENEM, UERJ, Medicina, etc)
}

interface GeneratedMultipleChoiceQuestion {
  statement: string
  statementSource: string
  command: string
  alternatives: Array<{
    letter: string
    text: string
    isCorrect: boolean
  }>
  correctAlternative: string
  triDiscrimination?: number
  triDifficulty?: number
  triGuessing?: number
}

interface GeneratedDiscursiveQuestion {
  statement: string
  statementSource: string
  command: string
  keyPoints: Array<{
    description: string
    weight: number
  }>
  maxScore: number
}

/**
 * Constrói o prompt para gerar questão de múltipla escolha
 */
function buildMultipleChoicePrompt(params: QuestionGenerationParams): string {
  const difficultyPercentage = (params.difficulty * 100).toFixed(0)
  const difficultyLevel =
    params.difficulty < 0.3 ? 'FÁCIL' :
    params.difficulty < 0.6 ? 'MÉDIO' :
    params.difficulty < 0.8 ? 'DIFÍCIL' : 'MUITO DIFÍCIL'

  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const numAlts = params.numberOfAlternatives || 5
  const alternativeLetters = letters.slice(0, numAlts).join(', ')

  const styleDescription = params.style === 'contextualizada'
    ? `A questão deve ser CONTEXTUALIZADA, com um enunciado amplo e rico em contexto, apresentando uma situação, cenário ou narrativa que contextualize o tema. Use storytelling para engajar o candidato. O enunciado deve ter pelo menos 4-6 linhas e apresentar informações relevantes que contextualizem o tema abordado.`
    : `A questão deve ser RÁPIDA e DIRETA, sem rodeios. Vá direto ao ponto com um enunciado objetivo, claro e conciso de no máximo 2-3 linhas. Não use storytelling ou contextualizações longas.`

  return `Você é um especialista em elaboração de questões de vestibular e concursos públicos. Crie uma questão de múltipla escolha de alta qualidade sobre o tema especificado.

**CONTEXTO:** ${params.context}
${params.context.includes('ENEM') ? 'A questão deve seguir o padrão ENEM: interdisciplinar, interpretativa, com texto-base e situação-problema contextualizada.' :
  params.context.includes('UERJ') ? 'A questão deve seguir o padrão UERJ: analítica, crítica, com ênfase em raciocínio e argumentação.' :
  `A questão deve ser adequada para o contexto especificado: ${params.context}`}

**TEMA/ASSUNTO:** ${params.subject}

**NÍVEL DE DIFICULDADE:** ${difficultyLevel} (${difficultyPercentage}%)
${params.difficulty < 0.3 ? 'Questão básica, conceitos fundamentais, raciocínio simples.' :
  params.difficulty < 0.6 ? 'Questão de complexidade média, exige raciocínio e conexão entre conceitos.' :
  params.difficulty < 0.8 ? 'Questão avançada, exige domínio profundo e raciocínio complexo.' :
  'Questão de altíssima complexidade, para candidatos de excelência.'}

**ESTILO:** ${params.style === 'contextualizada' ? 'CONTEXTUALIZADA' : 'RÁPIDA'}
${styleDescription}

**INSTRUÇÕES:**

1. **ENUNCIADO:**
   - Elabore um enunciado claro e bem estruturado
   - ${params.style === 'contextualizada' ? 'Crie um contexto rico e envolvente, com situação concreta' : 'Seja direto e objetivo'}
   - Certifique-se de que as informações fornecidas são suficientes para responder
   - Inclua dados, informações ou situações realistas

2. **FONTE DO ENUNCIADO (ABNT):**
   - Crie uma fonte fictícia mas verossímil em formato ABNT
   - Use formato: SOBRENOME, Nome. Título do trabalho. Editora, Ano.
   - Ou: "Adaptado de [nome de publicação científica/jornal], Ano"
   - A fonte deve ser coerente com o tema abordado

3. **COMANDO:**
   - Elabore um comando claro e específico do que se pede
   - Exemplos: "Com base no texto, assinale a alternativa correta:", "Considerando as informações apresentadas, é correto afirmar que:"

4. **ALTERNATIVAS (${numAlts} alternativas: ${alternativeLetters}):**
   - Crie ${numAlts} alternativas plausíveis e bem elaboradas
   - APENAS UMA deve ser correta
   - As incorretas devem ser plausíveis (distratores bem construídos)
   - Evite alternativas absurdas ou obviamente erradas
   - Mantenha paralelismo gramatical e estrutural
   - Varie o tamanho das alternativas para não dar pistas
   - Distribua aleatoriamente a posição da resposta correta

${params.useTRI ? `5. **PARÂMETROS TRI:**
   - **Discriminação (a):** ${params.difficulty < 0.4 ? '0.8-1.2' : params.difficulty < 0.7 ? '1.2-1.8' : '1.5-2.5'} - Capacidade de diferenciar candidatos
   - **Dificuldade (b):** ${params.difficulty < 0.3 ? '-2.0 a -0.5' : params.difficulty < 0.5 ? '-0.5 a 0.5' : params.difficulty < 0.7 ? '0.5 a 1.5' : '1.5 a 3.0'} - Nível de habilidade necessário
   - **Acerto ao acaso (c):** 0.15-0.25 - Probabilidade de acerto chutando
   - Ajuste os parâmetros conforme a dificuldade solicitada` : ''}

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
{
  "enunciado": "Texto completo do enunciado aqui",
  "fonteEnunciado": "SOBRENOME, Nome. Título. Editora, Ano.",
  "comando": "Texto do comando da questão",
  "alternativas": [
    { "letra": "A", "texto": "Texto da alternativa A", "correta": false },
    { "letra": "B", "texto": "Texto da alternativa B", "correta": true },
    { "letra": "C", "texto": "Texto da alternativa C", "correta": false },
    { "letra": "D", "texto": "Texto da alternativa D", "correta": false },
    { "letra": "E", "texto": "Texto da alternativa E", "correta": false }
  ],
  "alternativaCorreta": "B"${params.useTRI ? `,
  "triDiscriminacao": 1.5,
  "triDificuldade": 0.8,
  "triAcertoAcaso": 0.2` : ''}
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Garanta que EXATAMENTE uma alternativa seja marcada como correta
- As alternativas devem estar em ordem alfabética (A, B, C, D, E...)
- O campo "alternativaCorreta" deve corresponder à letra marcada como correta`
}

/**
 * Constrói o prompt para gerar questão discursiva
 */
function buildDiscursivePrompt(params: QuestionGenerationParams): string {
  const difficultyPercentage = (params.difficulty * 100).toFixed(0)
  const difficultyLevel =
    params.difficulty < 0.3 ? 'FÁCIL' :
    params.difficulty < 0.6 ? 'MÉDIO' :
    params.difficulty < 0.8 ? 'DIFÍCIL' : 'MUITO DIFÍCIL'

  const styleDescription = params.style === 'contextualizada'
    ? `A questão deve ser CONTEXTUALIZADA, com um enunciado amplo e rico em contexto, apresentando uma situação, cenário ou narrativa que contextualize o tema. O enunciado deve ter pelo menos 4-6 linhas e apresentar informações relevantes.`
    : `A questão deve ser RÁPIDA e DIRETA, sem rodeios. Vá direto ao ponto com um enunciado objetivo e conciso de no máximo 2-3 linhas.`

  return `Você é um especialista em elaboração de questões discursivas de vestibular e concursos. Crie uma questão discursiva de alta qualidade sobre o tema especificado.

**CONTEXTO:** ${params.context}
${params.context.includes('ENEM') ? 'A questão deve seguir o padrão ENEM: interdisciplinar, interpretativa, com situação-problema e exigindo argumentação fundamentada.' :
  params.context.includes('UERJ') ? 'A questão deve seguir o padrão UERJ: analítica, crítica, com ênfase em raciocínio, interpretação e argumentação sólida.' :
  `A questão deve ser adequada para o contexto especificado: ${params.context}`}

**TEMA/ASSUNTO:** ${params.subject}

**NÍVEL DE DIFICULDADE:** ${difficultyLevel} (${difficultyPercentage}%)
${params.difficulty < 0.3 ? 'Questão básica, conceitos fundamentais, resposta simples.' :
  params.difficulty < 0.6 ? 'Questão de complexidade média, exige análise e síntese.' :
  params.difficulty < 0.8 ? 'Questão avançada, exige domínio profundo e argumentação complexa.' :
  'Questão de altíssima complexidade, para candidatos de excelência.'}

**ESTILO:** ${params.style === 'contextualizada' ? 'CONTEXTUALIZADA' : 'RÁPIDA'}
${styleDescription}

**INSTRUÇÕES:**

1. **ENUNCIADO:**
   - Elabore um enunciado claro e bem estruturado
   - ${params.style === 'contextualizada' ? 'Crie um contexto rico e envolvente' : 'Seja direto e objetivo'}
   - Forneça todas as informações necessárias para a resposta

2. **FONTE DO ENUNCIADO (ABNT):**
   - Crie uma fonte fictícia mas verossímil em formato ABNT
   - Use formato: SOBRENOME, Nome. Título do trabalho. Editora, Ano.
   - Ou: "Adaptado de [nome de publicação], Ano"

3. **COMANDO:**
   - Elabore um comando claro e específico
   - Especifique o que o candidato deve fazer
   - Exemplos: "Explique e justifique:", "Analise criticamente:", "Compare e contraste:"

4. **PONTOS-CHAVE (3-5 pontos):**
   - Identifique os principais pontos que devem aparecer na resposta ideal
   - Cada ponto-chave deve ser específico e verificável
   - Atribua pesos proporcionais à importância de cada ponto (soma deve ser 1.0 ou 100%)
   - Ajuste os pesos conforme a relevância de cada aspecto
   - Pontos mais fundamentais devem ter peso maior

5. **PONTUAÇÃO MÁXIMA:**
   - Defina pontuação entre 5 e 15 pontos conforme complexidade
   - Questões fáceis: 5-7 pontos
   - Questões médias: 8-10 pontos
   - Questões difíceis: 11-15 pontos

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
{
  "enunciado": "Texto completo do enunciado aqui",
  "fonteEnunciado": "SOBRENOME, Nome. Título. Editora, Ano.",
  "comando": "Texto do comando da questão (o que o candidato deve fazer)",
  "pontosChave": [
    { "descricao": "Primeiro aspecto importante que deve aparecer", "peso": 0.30 },
    { "descricao": "Segundo aspecto importante", "peso": 0.25 },
    { "descricao": "Terceiro aspecto importante", "peso": 0.25 },
    { "descricao": "Quarto aspecto importante", "peso": 0.20 }
  ],
  "pontuacaoMaxima": 10
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- A soma dos pesos deve ser exatamente 1.0 (100%)
- Os pontos-chave devem ser objetivos e verificáveis
- Crie entre 3 e 5 pontos-chave`
}

/**
 * Gera uma questão de múltipla escolha usando Gemini
 */
export async function generateMultipleChoiceQuestion(
  params: QuestionGenerationParams
): Promise<Question> {
  const prompt = buildMultipleChoicePrompt(params)
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
          temperature: 0.8, // Mais criatividade para gerar questões variadas
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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

    return parseMultipleChoiceResponse(generatedText, params)
  } catch (error) {
    console.error('Erro ao gerar questão com Gemini:', error)
    throw error
  }
}

/**
 * Gera uma questão discursiva usando Gemini
 */
export async function generateDiscursiveQuestion(
  params: QuestionGenerationParams
): Promise<Question> {
  const prompt = buildDiscursivePrompt(params)
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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

    return parseDiscursiveResponse(generatedText, params)
  } catch (error) {
    console.error('Erro ao gerar questão discursiva com Gemini:', error)
    throw error
  }
}

/**
 * Parseia a resposta do Gemini para questão de múltipla escolha
 */
function parseMultipleChoiceResponse(response: string, params: QuestionGenerationParams): Question {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Gemini não contém JSON válido')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Criar alternativas no formato correto
    const alternatives: Alternative[] = parsed.alternativas.map((alt: any) => ({
      id: uuidv4(),
      letter: alt.letra,
      text: alt.texto,
      isCorrect: alt.correta === true,
    }))

    // Verificar se tem exatamente uma correta
    const correctCount = alternatives.filter(a => a.isCorrect).length
    if (correctCount !== 1) {
      throw new Error(`Número incorreto de alternativas corretas: ${correctCount}`)
    }

    const question: Question = {
      id: uuidv4(),
      number: 0, // Será atualizado ao adicionar à prova
      type: 'multiple-choice',
      statement: parsed.enunciado || '',
      statementSource: parsed.fonteEnunciado || '',
      command: parsed.comando || '',
      alternatives,
    }

    // Adicionar parâmetros TRI se aplicável
    if (params.useTRI) {
      question.triDiscrimination = parsed.triDiscriminacao || 1.0
      question.triDifficulty = parsed.triDificuldade || 0.0
      question.triGuessing = parsed.triAcertoAcaso || 0.2
    }

    return question
  } catch (error) {
    console.error('Erro ao parsear resposta:', error)
    console.error('Resposta recebida:', response)
    throw new Error('Falha ao interpretar resposta do gerador de questões')
  }
}

/**
 * Parseia a resposta do Gemini para questão discursiva
 */
function parseDiscursiveResponse(response: string, params: QuestionGenerationParams): Question {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Gemini não contém JSON válido')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Criar pontos-chave no formato correto
    const keyPoints: KeyPoint[] = parsed.pontosChave.map((pt: any) => ({
      id: uuidv4(),
      description: pt.descricao || pt.description || '',
      weight: pt.peso || pt.weight || 0,
    }))

    // Validar soma dos pesos
    const totalWeight = keyPoints.reduce((sum, kp) => sum + kp.weight, 0)
    if (Math.abs(totalWeight - 1.0) > 0.05) {
      // Normalizar pesos se não somarem 1.0
      keyPoints.forEach(kp => {
        kp.weight = kp.weight / totalWeight
      })
    }

    const question: Question = {
      id: uuidv4(),
      number: 0, // Será atualizado ao adicionar à prova
      type: 'discursive',
      statement: parsed.enunciado || '',
      statementSource: parsed.fonteEnunciado || '',
      command: parsed.comando || '',
      alternatives: [],
      keyPoints,
      maxScore: parsed.pontuacaoMaxima || 10,
    }

    return question
  } catch (error) {
    console.error('Erro ao parsear resposta discursiva:', error)
    console.error('Resposta recebida:', response)
    throw new Error('Falha ao interpretar resposta do gerador de questões discursivas')
  }
}
