import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { lerAcessoAoBanco } from '@/lib/banco/acesso-servidor'

export const dynamic = 'force-dynamic'

/*
 * Esta rota sorteia questões do Banco para montar uma prova de treino.
 *
 * ## O buraco que ela era
 *
 * Ela pedia apenas "estar logado". Não consultava `lerAcessoAoBanco`, aceitava
 * `?limit=500` e devolvia cada questão com `alternatives[].isCorrect`,
 * `explanation` e `commentedFeedback` preenchidos. Somando: qualquer pessoa
 * criava uma conta gratuita e, com uma dezena de requisições feitas do console
 * do navegador, levava o acervo inteiro — enunciado, gabarito e resposta
 * comentada — que é exatamente o produto que a plataforma vende.
 *
 * Todas as outras portas do Banco já eram guardadas: a listagem esconde o
 * conteúdo de quem é gratuito (`ocultarConteudo`), a questão individual exige
 * saldo, e a criação de listas aleatórias recusa quem não assina. Esta era a
 * única que ficou de fora, e por isso anulava as três.
 *
 * ## O que mudou
 *
 * 1. Mesmo portão das demais: quem é gratuito recebe 403 com o convite de
 *    assinar, como em `listas/aleatorias`.
 * 2. Teto de sorteio de 500 para 200 — acima de qualquer prova real, longe de
 *    servir como exportação. A tela usa o mesmo número, então ninguém pede 300
 *    questões e recebe 200 sem entender por quê.
 * 3. Ids malformados deixam de virar 500.
 *
 * O gabarito continua saindo — ver o comentário na montagem das alternativas.
 * Escondê-lo aqui faria a prova pessoal nascer sem correção possível, que é
 * remover o recurso em vez de protegê-lo.
 */

/**
 * Teto de questões por sorteio.
 *
 * Precisa bater com o `max` do campo em
 * `app/exams/personal/[id]/generate-questions/page.tsx`: um teto menor no
 * servidor devolveria menos questões do que a tela deixou pedir, silenciosamente.
 */
export const MAXIMO_DE_QUESTOES_POR_SORTEIO = 200

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limiteBruto = Number.parseInt(searchParams.get('limit') || '10', 10)
    const limit = Number.isFinite(limiteBruto)
      ? Math.min(Math.max(limiteBruto, 1), MAXIMO_DE_QUESTOES_POR_SORTEIO)
      : 10

    const db = await getDb()

    // Mesmo veredito que a listagem e a questão individual usam. Sem isto, esta
    // rota era a porta dos fundos do Banco inteiro.
    const acesso = await lerAcessoAoBanco(db, session.userId)
    if (!acesso) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }
    if (acesso.ehGratuito) {
      return NextResponse.json(
        {
          error: 'Sortear questoes do Banco e exclusivo de assinantes Plus+',
          requiresPlus: true,
        },
        { status: 403 },
      )
    }

    // Build match stage from filters — aceita múltiplos IDs separados por vírgula
    const matchStage: any = {}

    const periodoId = searchParams.get('periodoId')
    const moduloId = searchParams.get('moduloId')
    const topicoId = searchParams.get('topicoId')
    const subtopicoId = searchParams.get('subtopicoId')
    const tipo = searchParams.get('tipo')
    const dificuldade = searchParams.get('dificuldade')
    const anosParam = searchParams.get('anos')

    // Ids malformados são descartados em vez de lançarem: `new ObjectId('x')`
    // vira exceção, e a exceção virava 500 numa URL que qualquer um digita.
    function buildIdFilter(param: string | null) {
      if (!param) return null
      const ids = param
        .split(',')
        .slice(0, 50)
        .map((id) => id.trim())
        .filter((id) => isValidObjectId(id))
        .map((id) => new ObjectId(id))
      if (ids.length === 0) return null
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

      /*
        * O gabarito CONTINUA saindo daqui, de propósito.
        *
        * Esta rota não entrega questões para responder: ela entrega o material
        * com que o próprio aluno monta uma prova pessoal, que é gravada em
        * seguida com `saveExamWithQuestions`. Sem `isCorrect` e sem a resposta
        * comentada a prova nasceria sem gabarito e nunca poderia ser corrigida —
        * o recurso deixaria de existir.
        *
        * O que fecha o abuso aqui é o portão de assinatura acima e o teto de
        * sorteio, não esconder o campo: quem chega neste ponto é assinante e
        * está montando a própria prova, com o conteúdo que ele paga para ter.
        */
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
