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
import { campoTextoPreenchido } from '@/lib/banco/filtros-conteudo'

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
      apenasErradas: searchParams.get('apenasErradas') === 'true',
      comImagem: searchParams.get('comImagem') === 'true',
      comExplicacao: searchParams.get('comExplicacao') === 'true',
      busca: searchParams.get('busca') || undefined,
      ordenar: (['recentes', 'menosPraticadas', 'maisDificeis'] as const).includes(
        searchParams.get('ordenar') as any,
      )
        ? (searchParams.get('ordenar') as BancoQuestoesFiltros['ordenar'])
        : 'recentes',
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
    if (filtros.comImagem) {
      matchStage.imagemUrl = campoTextoPreenchido()
    }
    if (filtros.comExplicacao) {
      matchStage.explicacao = campoTextoPreenchido()
    }

    // Lookup de resoluções do usuário — só entra quando "não resolvidas" ou
    // "só as que errei" está ativo. Ele roda um sub-pipeline POR QUESTÃO, então
    // carregá-lo sem necessidade (inclusive na contagem, que nem devolve
    // esse campo) custava caro para nada.
    const precisaResolucoes = filtros.apenasNaoResolvidas || filtros.apenasErradas
    const resolucoesLookup = {
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
    }
    const resolucoesAddFields = {
      $addFields: {
        jaResolvida: { $gt: [{ $size: '$resolucoes' }, 0] },
        ultimaResolucao: { $arrayElemAt: ['$resolucoes', 0] }
      }
    }
    // `apenasErradas` é o oposto complementar de "esconder as que já
    // resolvi": ele exige que TENHA resolvido, e que a última resposta tenha
    // sido errada — os dois juntos nunca fazem sentido ao mesmo tempo, e a
    // tela os trata como mutuamente exclusivos.
    const resolucoesMatch = {
      $match: filtros.apenasNaoResolvidas
        ? { jaResolvida: false }
        : { jaResolvida: true, 'ultimaResolucao.correta': false }
    }

    // Pipeline de CONTAGEM: só o que decide se a questão entra no total. Os
    // nomes de período/módulo/tópico/subtópico não importam para contar — o
    // pipeline completo, com os 5 lookups, rodava DE NOVO só para chegar num
    // número, dobrando o trabalho de toda listagem.
    const countPipeline: any[] = [{ $match: matchStage }]
    if (precisaResolucoes) countPipeline.push(resolucoesLookup, resolucoesAddFields, resolucoesMatch)
    countPipeline.push({ $count: 'total' })

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
      resolucoesLookup,
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

    if (precisaResolucoes) pipeline.push(resolucoesMatch)

    /*
     * A ordenação por dificuldade real não é um campo do documento — é a
     * razão entre acertos e respostas, calculada aqui. Questão sem nenhuma
     * resposta ainda não tem taxa, e SOME para o fim: colocá-la entre as
     * "mais difíceis" confundiria "ninguém tentou" com "quase ninguém acerta",
     * que são coisas opostas para quem está escolhendo o que estudar.
     */
    if (filtros.ordenar === 'maisDificeis') {
      pipeline.push(
        {
          $addFields: {
            _temResposta: { $gt: ['$totalRespostas', 0] },
            _taxaAcerto: {
              $cond: [
                { $gt: ['$totalRespostas', 0] },
                { $divide: ['$totalAcertos', '$totalRespostas'] },
                1,
              ],
            },
          },
        },
        { $sort: { _temResposta: -1, _taxaAcerto: 1, createdAt: -1 } },
        { $project: { _temResposta: 0, _taxaAcerto: 0 } },
      )
    } else if (filtros.ordenar === 'menosPraticadas') {
      pipeline.push({ $sort: { totalRespostas: 1, createdAt: -1 } })
    } else {
      pipeline.push({ $sort: { createdAt: -1 } })
    }

    // Paginação
    pipeline.push({ $skip: skip }, { $limit: limit })

    // Contagem e página de dados não dependem uma da outra — rodar em
    // paralelo custa o tempo da mais lenta das duas, não a soma das duas.
    const [countResult, questoes] = await Promise.all([
      db.collection<BancoQuestao>('banco_questoes').aggregate(countPipeline).toArray(),
      db.collection<BancoQuestao>('banco_questoes').aggregate<BancoQuestaoComHierarquia>(pipeline).toArray(),
    ])
    const total = countResult[0]?.total || 0

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
