import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  secureApiEndpoint,
  sanitizeHtml,
  validateStringInput
} from '@/lib/api-security'

export const dynamic = 'force-dynamic'

interface ExtractionEntry {
  moduloNome: string
  topicoOrigem: string
  topicoDestino: string
}

interface ExtractionResult {
  moduloNome: string
  topicoOrigem: string
  topicoDestino: string
  sucesso: boolean
  questoesMovidas: number
  erro?: string
}

/**
 * Parses the TXT input format:
 *
 * [MODULE NAME]
 * Topic A >> Topic B
 *
 * [ANOTHER MODULE]
 * Topic C >> Topic D
 * Topic E >> Topic F
 *
 * Multiple entries can be separated by blank lines
 */
function parseTxtInput(txt: string): { entries: ExtractionEntry[], errors: string[] } {
  const entries: ExtractionEntry[] = []
  const errors: string[] = []

  const lines = txt.split('\n').map(line => line.trim())
  let currentModule: string | null = null
  let lineNumber = 0

  for (const line of lines) {
    lineNumber++

    // Skip empty lines
    if (!line) {
      continue
    }

    // Check for module name in brackets [MODULE NAME]
    const moduleMatch = line.match(/^\[(.+)\]$/)
    if (moduleMatch) {
      currentModule = moduleMatch[1].trim()
      if (!currentModule) {
        errors.push(`Linha ${lineNumber}: Nome do módulo vazio`)
      }
      continue
    }

    // Check for topic extraction: Topic A >> Topic B
    const extractionMatch = line.match(/^(.+?)\s*>>\s*(.+)$/)
    if (extractionMatch) {
      if (!currentModule) {
        errors.push(`Linha ${lineNumber}: Extração definida sem módulo. Use [NOME DO MÓDULO] antes.`)
        continue
      }

      const topicoOrigem = extractionMatch[1].trim()
      const topicoDestino = extractionMatch[2].trim()

      if (!topicoOrigem) {
        errors.push(`Linha ${lineNumber}: Tópico de origem vazio`)
        continue
      }

      if (!topicoDestino) {
        errors.push(`Linha ${lineNumber}: Tópico de destino vazio`)
        continue
      }

      if (topicoOrigem === topicoDestino) {
        errors.push(`Linha ${lineNumber}: Tópico de origem e destino são iguais`)
        continue
      }

      entries.push({
        moduloNome: currentModule,
        topicoOrigem,
        topicoDestino
      })
      continue
    }

    // If line doesn't match any pattern, it's an error
    errors.push(`Linha ${lineNumber}: Formato inválido. Use [MÓDULO] ou "Tópico A >> Tópico B"`)
  }

  return { entries, errors }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and rate limit
    const security = await secureApiEndpoint(request, {
      rateLimit: 'WRITE',
      auth: {
        requireAuth: true,
        allowedRoles: ['admin']
      }
    })

    if (!security.success || security.errorResponse) {
      return security.errorResponse
    }

    const body = await request.json()

    // Validate and sanitize input
    const txtValidation = validateStringInput(body.txt, 'Texto', {
      required: true,
      minLength: 5,
      maxLength: 50000 // Allow reasonably large inputs
    })

    if (!txtValidation.valid) {
      return NextResponse.json(
        { error: txtValidation.error },
        { status: 400 }
      )
    }

    const txt = sanitizeHtml(txtValidation.value!)

    // Parse the TXT input
    const { entries, errors: parseErrors } = parseTxtInput(txt)

    if (entries.length === 0) {
      return NextResponse.json({
        sucesso: false,
        error: 'Nenhuma extração válida encontrada no texto',
        errosParsing: parseErrors
      }, { status: 400 })
    }

    const db = await getDb()
    const modulosCollection = db.collection('banco_modulos')
    const topicosCollection = db.collection('banco_topicos')
    const questoesCollection = db.collection('banco_questoes')

    const results: ExtractionResult[] = []
    let totalMovidas = 0

    for (const entry of entries) {
      const result: ExtractionResult = {
        moduloNome: entry.moduloNome,
        topicoOrigem: entry.topicoOrigem,
        topicoDestino: entry.topicoDestino,
        sucesso: false,
        questoesMovidas: 0
      }

      try {
        // Find module by name (case-insensitive)
        const modulo = await modulosCollection.findOne({
          nome: { $regex: new RegExp(`^${escapeRegex(entry.moduloNome)}$`, 'i') }
        })

        if (!modulo) {
          result.erro = `Módulo "${entry.moduloNome}" não encontrado`
          results.push(result)
          continue
        }

        // Find source topic by name within the module
        const topicoOrigem = await topicosCollection.findOne({
          moduloId: modulo._id,
          nome: { $regex: new RegExp(`^${escapeRegex(entry.topicoOrigem)}$`, 'i') }
        })

        if (!topicoOrigem) {
          result.erro = `Tópico de origem "${entry.topicoOrigem}" não encontrado no módulo "${entry.moduloNome}"`
          results.push(result)
          continue
        }

        // Find destination topic by name within the module
        const topicoDestino = await topicosCollection.findOne({
          moduloId: modulo._id,
          nome: { $regex: new RegExp(`^${escapeRegex(entry.topicoDestino)}$`, 'i') }
        })

        if (!topicoDestino) {
          result.erro = `Tópico de destino "${entry.topicoDestino}" não encontrado no módulo "${entry.moduloNome}"`
          results.push(result)
          continue
        }

        // Move all questions from source topic to destination topic
        const updateResult = await questoesCollection.updateMany(
          { topicoId: topicoOrigem._id },
          {
            $set: {
              topicoId: topicoDestino._id,
              // Clear subtopic since it belongs to the old topic
              subtopicoid: null,
              updatedAt: new Date()
            }
          }
        )

        result.sucesso = true
        result.questoesMovidas = updateResult.modifiedCount
        totalMovidas += updateResult.modifiedCount

      } catch (error) {
        result.erro = 'Erro interno ao processar extração'
        console.error(`Erro ao processar extração para ${entry.moduloNome}:`, error)
      }

      results.push(result)
    }

    return NextResponse.json({
      sucesso: true,
      totalMovidas,
      totalEntradas: entries.length,
      resultados: results,
      errosParsing: parseErrors.length > 0 ? parseErrors : undefined
    })

  } catch (error) {
    console.error('Erro ao extrair questões:', error)
    return NextResponse.json(
      { error: 'Erro ao processar extração de questões' },
      { status: 500 }
    )
  }
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
