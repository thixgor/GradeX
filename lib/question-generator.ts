import { Question, Alternative, KeyPoint, Settings, AlternativeType } from './types'
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
  alternativeType?: AlternativeType // Tipo de alternativa (standard, true-false, comparison, assertion-reason)
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

  const altType = params.alternativeType || 'standard'
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const numAlts = altType === 'multiple-affirmative' ? 4 : altType === 'comparison' ? 4 : altType === 'assertion-reason' ? 5 : (params.numberOfAlternatives || 5)
  const alternativeLetters = letters.slice(0, numAlts).join(', ')

  const styleDescription = params.style === 'contextualizada'
    ? `A questão deve ser CONTEXTUALIZADA, com um enunciado amplo e rico em contexto, apresentando uma situação, cenário ou narrativa que contextualize o tema. Use storytelling para engajar o candidato. O enunciado deve ter pelo menos 4-6 linhas e apresentar informações relevantes que contextualizem o tema abordado.`
    : `A questão deve ser RÁPIDA e DIRETA, sem rodeios. Vá direto ao ponto com um enunciado objetivo, claro e conciso de no máximo 2-3 linhas. Não use storytelling ou contextualizações longas.`

  // Instruções específicas para cada tipo de alternativa
  let alternativeTypeInstructions = ''
  if (altType === 'multiple-affirmative') {
    alternativeTypeInstructions = `
**TIPO DE QUESTÃO: AFIRMATIVAS CORRETAS (I-IV)**
- Crie 4 AFIRMAÇÕES numeradas (I, II, III, IV) no enunciado
- Cada afirmação deve ser independente e pode ser verdadeira ou falsa
- O comando deve ser: "Julgue as afirmações abaixo e assinale a alternativa correta:" ou similar
- As alternativas devem indicar quais afirmações são verdadeiras
- Exemplo de alternativas:
  A) Apenas I e II estão corretas
  B) Apenas II e III estão corretas
  C) Apenas I, III e IV estão corretas
  D) Todas as afirmações estão corretas
- A habilidade exigida é reconhecer conceitos isolados e avaliar cada afirmação independentemente
- Distribua a resposta correta entre as alternativas (não deixe sempre "todas corretas" ou "apenas uma correta")
`
  } else if (altType === 'comparison') {
    alternativeTypeInstructions = `
**TIPO DE QUESTÃO: COMPARAÇÃO**
- Coloque DUAS situações, conceitos, mecanismos ou estruturas lado a lado no enunciado
- O comando deve pedir para comparar essas duas coisas
- As alternativas devem indicar relações quantitativas ou funcionais
- Exemplo de alternativas:
  A) A estrutura X é maior que a estrutura Y
  B) A estrutura X é menor que a estrutura Y
  C) As estruturas X e Y têm o mesmo tamanho
  D) A estrutura X apresenta mais componentes que Y
- A habilidade exigida é domínio de diferenças, semelhanças e relações quantitativas ou funcionais
- Seja específico nas comparações (maior/menor, mais/menos, igual, diferente, etc)
`
  } else if (altType === 'assertion-reason') {
    alternativeTypeInstructions = `
**TIPO DE QUESTÃO: ASSERÇÃO E RAZÃO**
- Crie DUAS afirmações no enunciado:
  * ASSERÇÃO: Uma afirmação principal
  * RAZÃO: Uma justificativa ou explicação
- O comando deve ser: "Analise as afirmações abaixo:" ou similar
- As alternativas são FIXAS:
  A) As duas afirmações são verdadeiras, e a segunda justifica a primeira
  B) As duas afirmações são verdadeiras, mas a segunda não justifica a primeira
  C) A primeira afirmação é verdadeira, e a segunda é falsa
  D) A primeira afirmação é falsa, e a segunda é verdadeira
  E) As duas afirmações são falsas
- A habilidade exigida é analisar se uma afirmação explica ou justifica a outra
`
  } else {
    alternativeTypeInstructions = `
**TIPO DE QUESTÃO: PADRÃO (MÚLTIPLA ESCOLHA)**
4. **ALTERNATIVAS (${numAlts} alternativas: ${alternativeLetters}):**
   - Crie ${numAlts} alternativas plausíveis e bem elaboradas
   - APENAS UMA deve ser correta
   - As incorretas devem ser plausíveis (distratores bem construídos)
   - Evite alternativas absurdas ou obviamente erradas
   - Mantenha paralelismo gramatical e estrutural
   - Varie o tamanho das alternativas para não dar pistas
   - Distribua aleatoriamente a posição da resposta correta
`
  }

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
   - ${altType !== 'standard' ? 'Siga o comando específico indicado para este tipo de questão' : 'Exemplos: "Com base no texto, assinale a alternativa correta:", "Considerando as informações apresentadas, é correto afirmar que:"'}

${alternativeTypeInstructions}

${params.useTRI ? `${altType === 'standard' ? '5' : '4'}. **PARÂMETROS TRI:**
   - **Discriminação (a):** ${params.difficulty < 0.4 ? '0.8-1.2' : params.difficulty < 0.7 ? '1.2-1.8' : '1.5-2.5'} - Capacidade de diferenciar candidatos
   - **Dificuldade (b):** ${params.difficulty < 0.3 ? '-2.0 a -0.5' : params.difficulty < 0.5 ? '-0.5 a 0.5' : params.difficulty < 0.7 ? '0.5 a 1.5' : '1.5 a 3.0'} - Nível de habilidade necessário
   - **Acerto ao acaso (c):** 0.15-0.25 - Probabilidade de acerto chutando
   - Ajuste os parâmetros conforme a dificuldade solicitada` : ''}

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
${altType === 'multiple-affirmative' ? `{
  "enunciado": "Texto completo do enunciado aqui, incluindo as 4 afirmações numeradas:\\n\\nI. Primeira afirmação...\\nII. Segunda afirmação...\\nIII. Terceira afirmação...\\nIV. Quarta afirmação...",
  "fonteEnunciado": "SOBRENOME, Nome. Título. Editora, Ano.",
  "comando": "Julgue as afirmações abaixo e assinale a alternativa correta:",
  "alternativas": [
    { "letra": "A", "texto": "Apenas I e II estão corretas", "correta": false },
    { "letra": "B", "texto": "Apenas II e III estão corretas", "correta": true },
    { "letra": "C", "texto": "Apenas I, III e IV estão corretas", "correta": false },
    { "letra": "D", "texto": "Todas as afirmações estão corretas", "correta": false }
  ],
  "alternativaCorreta": "B"${params.useTRI ? `,
  "triDiscriminacao": 1.5,
  "triDificuldade": 0.8,
  "triAcertoAcaso": 0.2` : ''}
}` : altType === 'comparison' ? `{
  "enunciado": "Texto completo do enunciado aqui, apresentando duas situações/conceitos/estruturas para comparar (X e Y)",
  "fonteEnunciado": "SOBRENOME, Nome. Título. Editora, Ano.",
  "comando": "Com base nas informações apresentadas, compare X e Y:",
  "alternativas": [
    { "letra": "A", "texto": "X é maior que Y", "correta": false },
    { "letra": "B", "texto": "X é menor que Y", "correta": true },
    { "letra": "C", "texto": "X e Y têm o mesmo tamanho", "correta": false },
    { "letra": "D", "texto": "X apresenta mais componentes que Y", "correta": false }
  ],
  "alternativaCorreta": "B"${params.useTRI ? `,
  "triDiscriminacao": 1.5,
  "triDificuldade": 0.8,
  "triAcertoAcaso": 0.2` : ''}
}` : altType === 'assertion-reason' ? `{
  "enunciado": "Texto completo do enunciado aqui, incluindo:\\n\\nASSERÇÃO: Primeira afirmação principal...\\n\\nRAZÃO: Segunda afirmação que pode ou não justificar a primeira...",
  "fonteEnunciado": "SOBRENOME, Nome. Título. Editora, Ano.",
  "comando": "Analise as afirmações abaixo:",
  "alternativas": [
    { "letra": "A", "texto": "As duas afirmações são verdadeiras, e a segunda justifica a primeira", "correta": true },
    { "letra": "B", "texto": "As duas afirmações são verdadeiras, mas a segunda não justifica a primeira", "correta": false },
    { "letra": "C", "texto": "A primeira afirmação é verdadeira, e a segunda é falsa", "correta": false },
    { "letra": "D", "texto": "A primeira afirmação é falsa, e a segunda é verdadeira", "correta": false },
    { "letra": "E", "texto": "As duas afirmações são falsas", "correta": false }
  ],
  "alternativaCorreta": "A"${params.useTRI ? `,
  "triDiscriminacao": 1.5,
  "triDificuldade": 0.8,
  "triAcertoAcaso": 0.2` : ''}
}` : `{
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
}`}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional
- Garanta que EXATAMENTE uma alternativa seja marcada como correta
- ${altType === 'multiple-affirmative' ? 'As alternativas devem indicar quais afirmações (I, II, III, IV) estão corretas' : altType === 'comparison' ? 'As alternativas devem indicar relações de comparação específicas e quantificáveis' : altType === 'assertion-reason' ? 'Use EXATAMENTE os textos das alternativas especificados acima' : 'As alternativas devem estar em ordem alfabética (A, B, C, D, E...)'}
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
      alternativeType: params.alternativeType || 'standard', // Salvar o tipo de alternativa
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

/**
 * Embaralha o conteúdo (texto) das alternativas de uma questão
 * As letras (A, B, C, D, E) permanecem fixas
 * Apenas o texto das alternativas é reorganizado
 */
export function shuffleAlternatives(question: Question): Question {
  if (question.type !== 'multiple-choice' || !question.alternatives.length) {
    return question
  }

  // Encontrar qual alternativa é a correta ANTES do shuffle
  const correctAlternativeText = question.alternatives.find(a => a.isCorrect)?.text

  // Extrair os textos das alternativas
  const texts = question.alternatives.map(alt => alt.text)
  
  // Fisher-Yates shuffle dos textos
  for (let i = texts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [texts[i], texts[j]] = [texts[j], texts[i]]
  }

  // Reatribuir textos shuffled mantendo as letras fixas
  const shuffledAlternatives = question.alternatives.map((alt, index) => ({
    ...alt,
    text: texts[index],
    // Marcar como correta se o texto corresponde ao texto correto original
    isCorrect: texts[index] === correctAlternativeText
  }))

  return {
    ...question,
    alternatives: shuffledAlternatives,
  }
}

/**
 * Gera feedback comentado para uma questão de múltipla escolha
 * Explica por que cada alternativa está correta ou incorreta
 */
export async function generateCommentedFeedback(
  question: Question,
  context: string
): Promise<{ correctAlternative: string; explanations: Record<string, string> }> {
  if (question.type !== 'multiple-choice' || !question.alternatives.length) {
    throw new Error('Apenas questões de múltipla escolha suportam feedback comentado')
  }

  const correctAlt = question.alternatives.find(a => a.isCorrect)
  if (!correctAlt) {
    throw new Error('Nenhuma alternativa marcada como correta')
  }

  const prompt = `Você é um especialista em educação. Analise a seguinte questão de múltipla escolha e gere um feedback comentado detalhado.

**CONTEXTO:** ${context}

**ENUNCIADO:** ${question.statement}

**COMANDO:** ${question.command}

**ALTERNATIVAS:**
${question.alternatives.map(alt => `${alt.letter}) ${alt.text}`).join('\n')}

**ALTERNATIVA CORRETA:** ${correctAlt.letter}

Gere um feedback comentado em JSON com a seguinte estrutura:
{
  "A": "Explicação concisa de por que A está correta ou incorreta",
  "B": "Explicação concisa de por que B está correta ou incorreta",
  "C": "Explicação concisa de por que C está correta ou incorreta",
  "D": "Explicação concisa de por que D está correta ou incorreta",
  "E": "Explicação concisa de por que E está correta ou incorreta"
}

IMPORTANTE:
- Cada explicação deve ter 1-3 linhas
- Para a alternativa correta, explique por que está correta
- Para alternativas incorretas, explique por que estão erradas
- Use linguagem clara e educativa
- Retorne APENAS o JSON, sem texto adicional`

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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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

    // Parsear JSON da resposta
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Gemini não contém JSON válido')
    }

    const explanations = JSON.parse(jsonMatch[0])

    return {
      correctAlternative: correctAlt.letter,
      explanations,
    }
  } catch (error) {
    console.error('Erro ao gerar feedback comentado:', error)
    throw error
  }
}

/**
 * Gera uma questão com tipo misto (alternando entre diferentes tipos)
 * Distribuição: 50% Standard, 20% Multiple-Affirmative, 15% Comparison, 15% Assertion-Reason
 */
export async function generateMixedTypeQuestion(
  params: QuestionGenerationParams
): Promise<Question> {
  // Gerar número aleatório para determinar o tipo
  const random = Math.random()
  let selectedType: AlternativeType

  if (random < 0.5) {
    selectedType = 'standard'
  } else if (random < 0.7) {
    selectedType = 'multiple-affirmative'
  } else if (random < 0.85) {
    selectedType = 'comparison'
  } else {
    selectedType = 'assertion-reason'
  }

  // Gerar questão com o tipo selecionado
  const questionParams: QuestionGenerationParams = {
    ...params,
    alternativeType: selectedType,
  }

  return generateMultipleChoiceQuestion(questionParams)
}
