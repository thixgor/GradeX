import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 500)

    const db = await getDb()

    // Build match stage from filters — aceita múltiplos IDs separados por vírgula
    const matchStage: any = {}

    const periodoId = searchParams.get('periodoId')
    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const subtopicoId = searchParams.get('subtopicoId')
    const tipo = searchParams.get('tipo')
    const dificuldade = searchParams.get('dificuldade')
    const anosParam = searchParams.get('anos')

    function buildIdFilter(param: string | null) {
      if (!param) return null
      const ids = param.split(',').filter(Boolean).map(id => new ObjectId(id.trim()))
      return ids.length === 1 ? ids[0] : { $in: ids }
    }

    const pf = buildIdFilter(periodoId)
    if (pf) matchStage.periodoId = pf
    const mf = buildIdFilter(moduloId)
    if (mf) matchStage.moduloId = mf
    const tf = buildIdFilter(topicoId)
    if (tf) matchStage.topicoId = tf
    const sf = buildIdFilter(subtopicoId)
    if (sf) matchStage.subtopicoId = sf
    if (tipo) matchStage.tipo = tipo
    if (dificuldade) matchStage.dificuldade = dificuldade
    if (anosParam) {
      const anos = anosParam.split(',').map(Number).filter(n => !isNaN(n))
      if (anos.length > 0) matchStage.ano = { $in: anos }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      { $sample: { size: limit } },
      {
        $lookup: {
          from: 'banco_periodos',
          localField: 'periodoId',
          foreignField: '_id',
          as: 'periodo'
        }
      },
      {
        $lookup: {
          from: 'banco_modulos',
          localField: 'moduloId',
          foreignField: '_id',
          as: 'modulo'
        }
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: 'topicoId',
          foreignField: '_id',
          as: 'topico'
        }
      },
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0,
        }
      }
    ]

    const rawQuestions = await db.collection('banco_questoes')
      .aggregate(pipeline)
      .toArray()

    // Transform to exam Question format
    const questions = rawQuestions.map((q, index) => {
      const isObjetiva = q.tipo === 'objetiva'
      const questionType = isObjetiva ? 'multiple-choice' : 'discursive'

      // Build alternatives for objetiva
      const alternatives = isObjetiva
        ? (q.alternativas || []).map((alt: any) => ({
            id: `${q._id}-${alt.letra}`,
            letter: alt.letra,
            text: alt.texto,
            isCorrect: alt.correta === true,
          }))
        : []

      // Build commentedFeedback from alternatives for objetiva
      let commentedFeedback = undefined
      if (isObjetiva && alternatives.length > 0) {
        const correctAlt = alternatives.find((a: any) => a.isCorrect)
        if (correctAlt) {
          const explanations: Record<string, string> = {}
          for (const alt of (q.alternativas || [])) {
            if (alt.correta) {
              explanations[alt.letra] = alt.explicacao || alt.texto || 'Alternativa correta.'
            } else {
              explanations[alt.letra] = alt.explicacao || 'Alternativa incorreta.'
            }
          }
          commentedFeedback = {
            correctAlternative: correctAlt.letter,
            explanations,
          }
        }
      }

      // Build alternative images map
      const alternativeImages = (q.imagensAlternativas || []).reduce((acc: any, img: any) => {
        acc[img.letra] = img.url
        return acc
      }, {})

      // Source info from hierarchy
      const sourceInfo = [q.periodoNome, q.moduloNome, q.topicoNome].filter(Boolean).join(' > ')

      return {
        id: q._id.toString(),
        number: index + 1,
        type: questionType,
        statement: q.enunciado || '',
        statementSource: q.fonte || (sourceInfo ? `Banco de Questões — ${sourceInfo}` : 'Banco de Questões'),
        command: isObjetiva ? '' : (q.comando || ''),
        imageUrl: q.imagemUrl || undefined,
        imageSource: q.fonteImagem || undefined,
        alternatives,
        alternativeImages: Object.keys(alternativeImages).length > 0 ? alternativeImages : undefined,
        explanation: q.explicacao || (isObjetiva ? '' : (q.respostaModelo || '')),
        commentedFeedback,
        origin: 'banco',
        sourceInfo,
        ano: q.ano,
        dificuldade: q.dificuldade,
        // Discursive-specific fields
        ...(questionType === 'discursive' ? {
          keyPoints: q.pontosChave || undefined,
          maxScore: q.notaMaxima || 10,
        } : {}),
      }
    })

    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Erro ao buscar questoes aleatorias:', error)
    return NextResponse.json({ error: 'Erro ao buscar questoes' }, { status: 500 })
  }
}
