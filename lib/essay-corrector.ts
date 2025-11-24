import { Question, EssayCompetence, EssayStyle, Settings } from './types'
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

interface EssayCorrectionResult {
  score: number
  maxScore: number
  generalFeedback: string
  competences: EssayCompetence[]
}

/**
 * Constrói o prompt para correção de redação ENEM
 */
function buildEnemPrompt(theme: string, essayText: string, rigor: number): string {
  const rigorPercentage = (rigor * 100).toFixed(0)
  const rigorDescription = rigor < 0.3 ? 'LENIENTE' : rigor < 0.6 ? 'MODERADO' : 'RIGOROSO'

  return `Você é um avaliador especializado em redações do ENEM e deve realizar uma correção detalhada e pedagógica baseada rigorosamente na Matriz de Referência oficial do exame. A redação deve ser avaliada exclusivamente como texto dissertativo-argumentativo em prosa, na modalidade escrita formal da língua portuguesa, sobre tema de ordem social, política, científica ou cultural, exigindo posicionamento claro sustentado por argumentação consistente e proposta de intervenção respeitadora dos direitos humanos.

Sua correção deve atribuir nota de zero a mil pontos, sendo que cada competência vale de zero a duzentos pontos, com intervalos obrigatórios de vinte em vinte pontos. A avaliação será organizada em cinco competências distintas, cada uma analisada separadamente com comentários específicos, justificativas claras e exemplos extraídos do próprio texto do candidato, sempre adotando tom pedagógico que auxilie o estudante a compreender seus acertos e identificar caminhos concretos de aprimoramento.

**NÍVEL DE RIGOR:** ${rigorDescription} (${rigorPercentage}%)
${rigor < 0.3 ? 'Seja mais tolerante com pequenos desvios e valorize o esforço argumentativo.' : rigor < 0.6 ? 'Mantenha equilíbrio entre rigor técnico e reconhecimento de esforços válidos.' : 'Seja extremamente rigoroso e exija precisão em todos os aspectos avaliados.'}

**TEMA DA REDAÇÃO:**
${theme}

**TEXTO DO CANDIDATO:**
${essayText.trim() || '(Texto em branco)'}

**INSTRUÇÕES DE CORREÇÃO:**

Na **Competência 1** (Domínio da modalidade escrita formal da língua portuguesa), você deve avaliar ortografia, acentuação, pontuação, concordância verbal e nominal, regência verbal e nominal, emprego de tempos e modos verbais, colocação pronominal, escolha vocabular adequada ao registro formal, uso correto de crase, hifenização, letras maiúsculas e minúsculas e construção de períodos sintaticamente completos e bem estruturados. Identifique e quantifique os desvios gramaticais encontrados, classificando-os conforme a gravidade.

Na **Competência 2** (Compreensão da proposta de redação e aplicação de conceitos das várias áreas de conhecimento), verifique se o candidato entendeu o recorte temático solicitado, se não fugiu nem tangenciou o tema, e se conseguiu aplicar conceitos de diversas áreas do conhecimento para fundamentar sua argumentação. Identifique a tese defendida e verifique se o repertório sociocultural mobilizado é pertinente, produtivo e bem contextualizado.

Na **Competência 3** (Seleção, relação, organização e interpretação de informações, fatos, opiniões e argumentos), examine a coerência global do texto, sua progressão lógica, a presença de um projeto de texto bem estruturado e a capacidade do candidato de encadear ideias de forma fluida, crescente e convincente.

Na **Competência 4** (Conhecimento dos mecanismos linguísticos necessários para a construção da argumentação), avalie o emprego adequado de operadores argumentativos, pronomes, advérbios, sinônimos e outros recursos de referenciação, a organização dos parágrafos e a articulação entre períodos.

Na **Competência 5** (Elaboração de proposta de intervenção para o problema abordado, respeitando os direitos humanos), analise se a intervenção está presente, pertinente, bem articulada à argumentação, e se apresenta os cinco elementos completos: agente, ação, meio/modo, finalidade e detalhamento.

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
{
  "competencia1": {
    "nota": 160,
    "feedback": "Feedback detalhado sobre domínio da norma culta"
  },
  "competencia2": {
    "nota": 180,
    "feedback": "Feedback detalhado sobre compreensão do tema e repertório"
  },
  "competencia3": {
    "nota": 160,
    "feedback": "Feedback detalhado sobre seleção e organização de argumentos"
  },
  "competencia4": {
    "nota": 140,
    "feedback": "Feedback detalhado sobre coesão textual"
  },
  "competencia5": {
    "nota": 160,
    "feedback": "Feedback detalhado sobre proposta de intervenção"
  },
  "feedbackGeral": "Comentário geral pedagógico sintetizando pontos fortes, aspectos que comprometeram a nota e orientações práticas de estudo"
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- Notas devem ser múltiplos de 20 (0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200)
- Cada competência vale de 0 a 200 pontos
- Nota total será a soma das 5 competências (0 a 1000)`
}

/**
 * Constrói o prompt para correção de redação UERJ
 */
function buildUerjPrompt(theme: string, essayText: string, rigor: number): string {
  const rigorPercentage = (rigor * 100).toFixed(0)
  const rigorDescription = rigor < 0.3 ? 'LENIENTE' : rigor < 0.6 ? 'MODERADO' : 'RIGOROSO'

  return `Você é um avaliador especializado em redações do vestibular da Universidade do Estado do Rio de Janeiro e deve realizar uma correção rigorosa e pedagógica baseada nos critérios específicos da banca examinadora da UERJ. A redação integra a prova de Língua Portuguesa Instrumental com Redação e vale vinte pontos no total, sendo avaliada segundo cinco critérios fundamentais que juntos compõem essa pontuação máxima.

A UERJ trabalha com um modelo muito particular de dissertação argumentativa, no qual é permitido o uso de primeira pessoa e estruturas opinativas, mas essas escolhas precisam ser plenamente justificadas, contextualizadas e inseridas dentro de um projeto textual sólido que demonstre autoria, densidade argumentativa, progressão lógica rigorosa e precisão textual.

**NÍVEL DE RIGOR:** ${rigorDescription} (${rigorPercentage}%)
${rigor < 0.3 ? 'Seja mais tolerante com pequenos desvios e valorize o esforço argumentativo e a originalidade.' : rigor < 0.6 ? 'Mantenha equilíbrio entre rigor técnico e reconhecimento de esforços válidos, valorizando autoria.' : 'Seja extremamente rigoroso, exigindo precisão, autoria genuína e densidade argumentativa em todos os aspectos.'}

**TEMA DA REDAÇÃO:**
${theme}

**TEXTO DO CANDIDATO:**
${essayText.trim() || '(Texto em branco)'}

**INSTRUÇÕES DE CORREÇÃO:**

No **Critério 1** (Adequação ao tema), verifique se o candidato demonstrou compreensão plena da proposta, identificando corretamente o recorte específico solicitado, se defendeu um ponto de vista coerente e se trouxe marcas claras de autoria. A UERJ pune explicitamente a perda de autoria que ocorre quando o candidato simplesmente copia ou parafraseia argumentos sem acrescentar análise própria.

No **Critério 2** (Tipo de texto), avalie se o candidato realmente produziu uma dissertação argumentativa, se estruturou o texto com clareza expositiva e persuasiva, e se escreveu de forma autônoma apresentando introdução, desenvolvimento e conclusão bem articulados.

No **Critério 3** (Estrutura do período e coesão), avalie a construção sintática dos períodos, o uso adequado e variado de conectores, os mecanismos de retomada e referenciação, a articulação entre ideias e a fluidez geral da leitura.

No **Critério 4** (Modalidade), avalie o domínio da norma-padrão da língua portuguesa: ortografia, pontuação, morfossintaxe, regência, concordância, colocação pronominal e precisão vocabular.

No **Critério 5** (Qualidade dos parágrafos), analise se cada parágrafo trabalha uma única ideia central bem desenvolvida, se há equilíbrio estrutural e se os parágrafos apresentam dois ou mais períodos bem articulados.

**FORMATO DE RESPOSTA (OBRIGATÓRIO):**
Retorne APENAS um JSON no seguinte formato:
{
  "criterio1": {
    "nota": 4.5,
    "feedback": "Feedback detalhado sobre adequação ao tema e autoria"
  },
  "criterio2": {
    "nota": 4.0,
    "feedback": "Feedback detalhado sobre tipo de texto e estrutura dissertativa"
  },
  "criterio3": {
    "nota": 3.5,
    "feedback": "Feedback detalhado sobre estrutura do período e coesão"
  },
  "criterio4": {
    "nota": 4.0,
    "feedback": "Feedback detalhado sobre modalidade e norma culta"
  },
  "criterio5": {
    "nota": 3.0,
    "feedback": "Feedback detalhado sobre qualidade dos parágrafos"
  },
  "feedbackGeral": "Comentário geral pedagógico sintetizando pontos fortes, aspectos que comprometeram a pontuação e orientações práticas de estudo"
}

IMPORTANTE:
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- Cada critério vale de 0 a 4 pontos (pode usar decimais: 0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0)
- Nota total será a soma dos 5 critérios (0 a 20 pontos)`
}

/**
 * Corrige uma redação usando Gemini 2.0 Flash
 */
export async function correctEssayWithGemini(
  question: Question,
  essayText: string,
  rigor: number = 0.45
): Promise<EssayCorrectionResult> {
  if (!question.essayTheme) {
    throw new Error('Redação sem tema definido')
  }

  if (!question.essayStyle) {
    throw new Error('Redação sem estilo definido (ENEM ou UERJ)')
  }

  const isEnem = question.essayStyle === 'enem'
  const prompt = isEnem
    ? buildEnemPrompt(question.essayTheme, essayText, rigor)
    : buildUerjPrompt(question.essayTheme, essayText, rigor)

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
          temperature: 0.2,
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

    return parseCorrectionResponse(generatedText, question.essayStyle!)
  } catch (error) {
    console.error('Erro ao corrigir redação com Gemini:', error)
    throw error
  }
}

/**
 * Parseia a resposta do Gemini para correção de redação
 */
function parseCorrectionResponse(response: string, essayStyle: EssayStyle): EssayCorrectionResult {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Resposta do Gemini não contém JSON válido')
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (essayStyle === 'enem') {
      // Validar estrutura ENEM
      const competences: EssayCompetence[] = [
        {
          name: 'Competência 1 - Domínio da norma culta',
          score: parsed.competencia1?.nota || 0,
          maxScore: 200,
          feedback: parsed.competencia1?.feedback || '',
        },
        {
          name: 'Competência 2 - Compreensão do tema',
          score: parsed.competencia2?.nota || 0,
          maxScore: 200,
          feedback: parsed.competencia2?.feedback || '',
        },
        {
          name: 'Competência 3 - Seleção e organização de argumentos',
          score: parsed.competencia3?.nota || 0,
          maxScore: 200,
          feedback: parsed.competencia3?.feedback || '',
        },
        {
          name: 'Competência 4 - Coesão textual',
          score: parsed.competencia4?.nota || 0,
          maxScore: 200,
          feedback: parsed.competencia4?.feedback || '',
        },
        {
          name: 'Competência 5 - Proposta de intervenção',
          score: parsed.competencia5?.nota || 0,
          maxScore: 200,
          feedback: parsed.competencia5?.feedback || '',
        },
      ]

      const totalScore = competences.reduce((sum, c) => sum + c.score, 0)

      return {
        score: totalScore,
        maxScore: 1000,
        generalFeedback: parsed.feedbackGeral || '',
        competences,
      }
    } else {
      // Validar estrutura UERJ
      const competences: EssayCompetence[] = [
        {
          name: 'Critério 1 - Adequação ao tema',
          score: parsed.criterio1?.nota || 0,
          maxScore: 4,
          feedback: parsed.criterio1?.feedback || '',
        },
        {
          name: 'Critério 2 - Tipo de texto',
          score: parsed.criterio2?.nota || 0,
          maxScore: 4,
          feedback: parsed.criterio2?.feedback || '',
        },
        {
          name: 'Critério 3 - Estrutura e coesão',
          score: parsed.criterio3?.nota || 0,
          maxScore: 4,
          feedback: parsed.criterio3?.feedback || '',
        },
        {
          name: 'Critério 4 - Modalidade',
          score: parsed.criterio4?.nota || 0,
          maxScore: 4,
          feedback: parsed.criterio4?.feedback || '',
        },
        {
          name: 'Critério 5 - Qualidade dos parágrafos',
          score: parsed.criterio5?.nota || 0,
          maxScore: 4,
          feedback: parsed.criterio5?.feedback || '',
        },
      ]

      const totalScore = competences.reduce((sum, c) => sum + c.score, 0)

      return {
        score: Math.round(totalScore * 10) / 10, // 1 casa decimal
        maxScore: 20,
        generalFeedback: parsed.feedbackGeral || '',
        competences,
      }
    }
  } catch (error) {
    console.error('Erro ao parsear resposta do Gemini:', error)
    console.error('Resposta recebida:', response)
    throw new Error('Falha ao interpretar resposta do corretor automático de redação')
  }
}

/**
 * Testa a conexão com a API Gemini
 */
export async function testGeminiConnection(apiKey?: string): Promise<boolean> {
  try {
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
