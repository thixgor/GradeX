import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  BancoQuestao,
  BancoQuestaoComHierarquia,
  BancoQuestoesFiltros,
  BancoQuestoesResponse
} from '@/lib/types/banco-questoes'
import { lerAcessoAoBanco, ocultarConteudo } from '@/lib/banco/acesso-servidor'
import { jaDesbloqueada, restantes } from '@/lib/banco/gratuito'
import { interpretarPeriodoLetivo } from '@/lib/banco/periodo-letivo'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const { searchParams } = new URL(request.url)

    /*
     * Quem é gratuito NÃO é mais barrado aqui.
     *
     * Antes, sem `periodoId` a resposta era 403: a pessoa precisava escolher um
     * período da grade da faculdade num modal, antes de ver qualquer coisa, e o
     * servidor sorteava 5 questões daquele período — para sempre. A amostra caía
     * em assunto aleatório, quase nunca no que ela queria testar, que é
     * justamente a única coisa que faria assinar.
     *
     * Agora a listagem inteira responde para todo mundo, com os mesmos filtros.
     * O que muda é o CONTEÚDO: questão que a pessoa não abriu volta sem
     * enunciado, sem alternativas e sem explicação (`ocultarConteudo`). Ela vê
     * onde as questões estão e escolhe onde gastar o saldo.
     */
    const acesso = await lerAcessoAoBanco(db, session.userId)
    if (!acesso) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Extrair filtros — agora aceita múltiplos IDs separados por vírgula
    // `periodoId` não é mais filtro do produto (ver lib/banco/hierarquia.ts).
    // O parâmetro continua sendo aceito para não quebrar link antigo salvo.
    const periodoIdParam = searchParams.get('periodoId') || undefined
    const moduloIdParam = searchParams.get('moduloId') || undefined
    const topicoIdParam = searchParams.get('topicoId') || undefined
    const subtopicoIdParam = searchParams.get('subtopicoId') || undefined

    const filtros: BancoQuestoesFiltros = {
      periodoId: periodoIdParam,
      moduloId: moduloIdParam,
      topicoId: topicoIdParam,
      subtopicoId: subtopicoIdParam,
      tipo: searchParams.get('tipo') as BancoQuestoesFiltros['tipo'] || undefined,
      dificuldade: searchParams.get('dificuldade') as BancoQuestoesFiltros['dificuldade'] || undefined,
      apenasNaoResolvidas: searchParams.get('apenasNaoResolvidas') === 'true',
      busca: searchParams.get('busca') || undefined
    }

    // Parse anos param
    const anosParam = searchParams.get('anos')
    const anos = anosParam ? anosParam.split(',').map(Number).filter(n => !isNaN(n)) : undefined

    // Período letivo ("2026.2"): é assim que a prova se chama na faculdade, e
    // por isso é o recorte temporal que a tela oferece. Só entram rótulos com
    // formato válido — um valor solto viraria um filtro que nunca casa e a
    // pessoa veria "nenhuma questão" sem entender por quê.
    const periodosParam = searchParams.get('periodos')
    const periodos = periodosParam
      ? periodosParam
          .split(',')
          .map((p) => p.trim())
          .filter((p) => interpretarPeriodoLetivo(p) !== null)
      : undefined

    // Paginação
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const skip = (page - 1) * limit

    // Helper para construir filtro com $in quando múltiplos IDs
    function buildIdFilter(param: string | undefined) {
      if (!param) return null
      const ids = param.split(',').filter(Boolean).map(id => new ObjectId(id.trim()))
      return ids.length === 1 ? ids[0] : { $in: ids }
    }

    // Construir query
    const matchStage: any = {}

    const periodoFilter = buildIdFilter(periodoIdParam)
    if (periodoFilter) matchStage.periodoId = periodoFilter

    const moduloFilter = buildIdFilter(moduloIdParam)
    if (moduloFilter) matchStage.moduloId = moduloFilter

    const topicoFilter = buildIdFilter(topicoIdParam)
    if (topicoFilter) matchStage.topicoId = topicoFilter

    const subtopicoFilter = buildIdFilter(subtopicoIdParam)
    if (subtopicoFilter) matchStage.subtopicoid = subtopicoFilter

    if (filtros.tipo) {
      matchStage.tipo = filtros.tipo
    }
    if (filtros.dificuldade) {
      matchStage.dificuldade = filtros.dificuldade
    }
    if (filtros.busca) {
      matchStage.enunciado = { $regex: filtros.busca, $options: 'i' }
    }
    if (anos && anos.length > 0) {
      matchStage.ano = { $in: anos }
    }
    if (periodos && periodos.length > 0) {
      matchStage.periodoLetivo = { $in: periodos }
    }

    const pipeline: any[] = [
      { $match: matchStage },
      // Lookup para hierarquia
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
        $lookup: {
          from: 'banco_subtopicos',
          localField: 'subtopicoid',
          foreignField: '_id',
          as: 'subtopico'
        }
      },
      // Lookup para resoluções do usuário
      {
        $lookup: {
          from: 'banco_resolucoes',
          let: { questaoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$questaoId', '$$questaoId'] },
                    { $eq: ['$userId', new ObjectId(session.userId)] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'resolucoes'
        }
      },
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
          jaResolvida: { $gt: [{ $size: '$resolucoes' }, 0] },
          ultimaResolucao: { $arrayElemAt: ['$resolucoes', 0] }
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0,
          subtopico: 0,
          resolucoes: 0
        }
      }
    ]

    // Filtrar apenas não resolvidas se solicitado
    if (filtros.apenasNaoResolvidas) {
      pipeline.push({
        $match: { jaResolvida: false }
      })
    }

    // Contar total
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate(countPipeline)
      .toArray()
    const total = countResult[0]?.total || 0

    // Paginação
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    )

    const questoes = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>(pipeline)
      .toArray()

    // O corte do conteúdo é a ÚLTIMA coisa: filtro, contagem e paginação são
    // iguais para todo mundo, então o número de resultados que o gratuito vê é
    // o número real — e o que ele decide abrir é escolha dele.
    const visiveis = acesso.ehGratuito
      ? questoes.map((q) =>
          jaDesbloqueada(acesso.gratuito, String(q._id)) ? q : ocultarConteudo(q),
        )
      : questoes

    const response: BancoQuestoesResponse & {
      gratuito?: { restantes: number; limite: number; desbloqueadas: string[] }
    } = {
      questoes: visiveis,
      paginacao: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      ...(acesso.ehGratuito
        ? {
            gratuito: {
              restantes: restantes(acesso.gratuito),
              limite: acesso.gratuito.limite,
              desbloqueadas: acesso.gratuito.desbloqueadas,
            },
          }
        : {}),
    }

    return NextResponse.json(response, {
      // Resposta personalizada (o que está aberto muda por pessoa).
      headers: { 'Cache-Control': 'private, no-store' },
    })
  } catch (error) {
    console.error('Erro ao buscar questões:', error)
    return NextResponse.json({ error: 'Erro ao buscar questões' }, { status: 500 })
  }
}
