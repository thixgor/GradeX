import { getDb } from './mongodb'
import { Settings } from './types'

export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

/**
 * Busca a API Key do Gemini no banco de dados
 */
export async function getGeminiApiKey(): Promise<string> {
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
