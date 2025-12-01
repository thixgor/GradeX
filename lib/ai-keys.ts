import { getDb } from './mongodb'

export type AIKeySection = 'generalExams' | 'personalExams' | 'flashcards'

/**
 * Obtém a API key de IA para uma seção específica
 * Se não houver chave configurada, usa a variável de ambiente padrão
 */
export async function getAIKey(section: AIKeySection): Promise<string> {
  try {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})
    
    const sectionKey = settings?.aiKeys?.[section]
    
    if (sectionKey) {
      return sectionKey
    }
  } catch (error) {
    console.error('Erro ao obter chave de IA:', error)
  }

  // Fallback para variável de ambiente padrão
  return process.env.OPENAI_API_KEY || ''
}

/**
 * Obtém todas as chaves de IA configuradas
 */
export async function getAllAIKeys() {
  try {
    const db = await getDb()
    const settings = await db.collection('landing_settings').findOne({})
    
    return settings?.aiKeys || {
      generalExams: '',
      personalExams: '',
      flashcards: ''
    }
  } catch (error) {
    console.error('Erro ao obter chaves de IA:', error)
    return {
      generalExams: '',
      personalExams: '',
      flashcards: ''
    }
  }
}
