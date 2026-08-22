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
import { prepararTermoDeBusca } from '@/lib/utils/escape-regex'
import { isValidObjectId } from '@/lib/api-security'

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

    /*
      * Paginação com piso e teto.
      *
      * `parseInt` sozinho aceita o que vier: `page=-5` produz `skip` negativo,
      * que o Mongo rejeita com erro — a rota devolvia 500 para um parâmetro que
      * qualquer pessoa consegue digitar na barra de endereço. E `page=1e9` manda
      * o servidor percorrer bilhões de posições antes de devolver nada, que é
      * uma varredura completa pedida de graça, quantas vezes o atacante quiser.
      *
      * O teto de páginas é generoso o bastante para percorrer o acervo inteiro
      * pela tela e baixo o bastante para que `skip` nunca vire uma varredura.
      */
    const TETO_DE_PAGINAS = 2000
    const paginaBruta = Number.parseInt(searchParams.get('page') || '1', 10)
    const page = Number.isFinite(paginaBruta)
      ? Math.min(Math.max(paginaBruta, 1), TETO_DE_PAGINAS)
      : 1
    const limiteBruto = Number.parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(limiteBruto)
      ? Math.min(Math.max(limiteBruto, 1), 50)
      : 20
    const skip = (page - 1) * limit

    /*
     * `campos=lista` — a resposta enxuta para quem só vai desenhar cartões.
     *
     * O cartão da listagem mostra assunto, tipo, dificuldade, período e as três
     * primeiras linhas do enunciado; ele nunca mostra alternativa, gabarito,
     * explicação nem imagem. Mesmo assim a rota devolvia o documento inteiro de
     * cada questão — e numa prova de Medicina o enunciado é um caso clínico de
     * vários parágrafos, com quatro ou cinco alternativas longas e uma
     * explicação comentada embaixo. Vinte desses num JSON é a maior parte do
     * tempo de espera da tela, para conteúdo que ninguém vai ler ali.
     *
     * É OPT-IN porque o painel do admin (/admin/exams/*) usa a MESMA rota para
     * escolher questões e lê alternativas e gabarito direto do resultado —
     * projetar por padrão apagaria a tela deles. Quem não pede continua
     * recebendo o documento completo.
     */
    const apenasParaLista = searchParams.get('campos') === 'lista'

    /** Quanto do enunciado cabe no cartão. `line-clamp-3` corta bem antes disso. */
    const PREVIA_DO_ENUNCIADO = 400

    const projecaoDeLista = {
      $project: {
        tipo: 1,
        dificuldade: 1,
        ano: 1,
        periodoLetivo: 1,
        fonte: 1,
        moduloNome: 1,
        topicoNome: 1,
        subtopicoNome: 1,
        jaResolvida: 1,
        // Só o veredito da última tentativa entra: o cartão desenha "Acertou" ou
        // "Errou", e o resto do registro (resposta dada, tempo, data) é assunto
        // da página da questão.
        ultimaResolucao: { correta: '$ultimaResolucao.correta' },
        enunciado: {
          $cond: [
            { $eq: [{ $type: '$enunciado' }, 'string'] },
            { $substrCP: ['$enunciado', 0, PREVIA_DO_ENUNCIADO] },
            '$enunciado',
          ],
        },
      },
    }

    /*
      * Helper para construir filtro com $in quando múltiplos IDs.
      *
      * `new ObjectId('xx')` LANÇA para qualquer coisa que não seja hex de 24
      * caracteres, e a exceção subia até o `catch` do handler: um `?moduloId=x`
      * na barra de endereço virava 500. Além de ruído no log, é um jeito barato
      * de fazer o servidor gastar uma invocação inteira para nada.
      *
      * Ids inválidos agora são descartados; se sobrar nenhum, o filtro
      * simplesmente não é aplicado.
      */
    const TETO_DE_IDS_POR_FILTRO = 50
    function buildIdFilter(param: string | undefined) {
      if (!param) return null
      const ids = param
        .split(',')
        .slice(0, TETO_DE_IDS_POR_FILTRO)
        .map((id) => id.trim())
        .filter((id) => isValidObjectId(id))
        .map((id) => new ObjectId(id))
      if (ids.length === 0) return null
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
    /*
      * O termo de busca vira TEXTO, nunca padrão.
      *
      * Este filtro roda sobre `enunciado`, que num banco de Medicina é um caso
      * clínico de vários parágrafos, em dezenas de milhares de documentos sem
      * índice de texto. Passar o termo cru para `$regex` significava que
      * `?busca=(a%2B)%2B%24` — digitável no console em dois segundos — fazia o
      * Mongo tentar casar um padrão de retrocesso catastrófico contra cada um
      * desses enunciados. Uma requisição já segura uma conexão do Atlas por
      * tempo indefinido; um punhado em paralelo derruba a plataforma inteira,
      * inclusive as telas que não têm nada a ver com busca.
      */
    const termoDeBusca = prepararTermoDeBusca(filtros.busca)
    if (termoDeBusca) {
      matchStage.enunciado = { $regex: termoDeBusca, $options: 'i' }
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

    /*
     * ORDENAR E PAGINAR ANTES DE ENRIQUECER.
     *
     * Os cinco `$lookup` desta rota (período, módulo, tópico, subtópico e a
     * última resolução do usuário) rodavam sobre TODAS as questões que casavam
     * com o filtro, e só depois vinham `$sort`/`$skip`/`$limit`. Sem filtro
     * nenhum — que é como a tela abre — isso significava enriquecer o acervo
     * inteiro para jogar fora tudo menos as 20 primeiras, com o `$lookup` de
     * resoluções executando um sub-pipeline POR QUESTÃO.
     *
     * Aqui a ordenação e o recorte da página vêm primeiro, direto sobre a
     * coleção (e sobre os índices de `createdAt`/`totalRespostas`), e só as 20
     * sobreviventes vão para os lookups. A única exceção é quando o filtro
     * depende da resolução ("não resolvidas", "só as que errei"): aí a resolução
     * PRECISA ser conhecida antes de contar a página, e esse lookup — só ele —
     * sobe para antes do recorte.
     */
    const ordenacao: any[] =
      filtros.ordenar === 'maisDificeis'
        ? [
            /*
             * A ordenação por dificuldade real não é um campo do documento — é
             * a razão entre acertos e respostas, calculada aqui. Questão sem
             * nenhuma resposta ainda não tem taxa, e SOME para o fim: colocá-la
             * entre as "mais difíceis" confundiria "ninguém tentou" com "quase
             * ninguém acerta", que são coisas opostas para quem está escolhendo
             * o que estudar.
             */
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
          ]
        : filtros.ordenar === 'menosPraticadas'
          ? [{ $sort: { totalRespostas: 1, createdAt: -1 } }]
          : [{ $sort: { createdAt: -1 } }]

    const pipeline: any[] = [{ $match: matchStage }]

    if (precisaResolucoes) {
      pipeline.push(resolucoesLookup, resolucoesAddFields, resolucoesMatch)
    }

    pipeline.push(...ordenacao, { $skip: skip }, { $limit: limit })

    // Hierarquia: agora sobre a página, não sobre o acervo.
    pipeline.push(
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
    )

    // Quando o filtro de resolução já rodou, `jaResolvida` e `ultimaResolucao`
    // vieram junto e repetir o lookup seria fazer o mesmo trabalho duas vezes.
    if (!precisaResolucoes) pipeline.push(resolucoesLookup)

    pipeline.push(
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
          ...(precisaResolucoes
            ? {}
            : {
                jaResolvida: { $gt: [{ $size: '$resolucoes' }, 0] },
                ultimaResolucao: { $arrayElemAt: ['$resolucoes', 0] },
              }),
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
      },
    )

    if (apenasParaLista) pipeline.push(projecaoDeLista)

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
