import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { getPersonalExamsLifetimeLimit, getPersonalExamsQuota } from '@/lib/tier-limits'
import {
  avaliarUsoDoPlano,
  corpoDeRecusa,
  registrarUsoDoPlano,
  resolverPermissoes,
  type ContextoDePermissoes,
} from '@/lib/plan-entitlements-server'
import { ObjectId } from 'mongodb'
import { podeVerGabarito, prepararProvaParaEntrega } from '@/lib/provas/sanitizar-prova'
import { normalizarPublico, ramosDePublicoParaMongo } from '@/lib/provas/publico-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { normalizarLiberacoes } from '@/lib/provas/downloads-da-prova'
import { interpretarInstante } from '@/lib/provas/horario-local'
import { validarJanelaDoFormulario } from '@/lib/provas/janela-da-prova'

export const dynamic = 'force-dynamic'

// GET - Listar provas
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')

    let query: any = {}

    /*
     * Quem vê o quê.
     *
     * Administradores veem:
     * - Todas as provas públicas, OCULTAS INCLUSIVE
     * - Suas próprias provas pessoais
     * Usuários comuns veem:
     * - Provas públicas não ocultas
     * - Suas próprias provas pessoais
     *
     * ## O que "oculta" deixou de significar
     *
     * O comentário acima sempre disse "administradores veem todas", mas o
     * filtro dizia `isHidden: false` para todo mundo. Ocultar uma prova a fazia
     * sumir também de `/admin/exams` — a única tela onde existe o botão "Tornar
     * Visível". O admin escondia a prova e perdia o caminho de volta: para
     * reexibi-la era preciso mexer no banco. O selo "Oculto" e o botão de
     * reexibir estavam desenhados naquela tela para uma prova que a rota nunca
     * entregava.
     *
     * `isHidden` é uma decisão sobre o CATÁLOGO DO ALUNO, não sobre o painel de
     * quem administra a prova. Agora ela é aplicada só a quem não é admin.
     *
     * O `$ne: true` no lugar de `=== false` é a mesma ideia aplicada aos
     * documentos antigos: prova criada antes do campo existir não tem
     * `isHidden`, e `isHidden: false` a excluía da lista de todo mundo — some
     * do catálogo uma prova que ninguém escondeu.
     */
    const ehAdmin = session.role === 'admin'

    const ramoPublico: Record<string, any> = {
      $or: [
        { isPersonalExam: false },
        { isPersonalExam: { $exists: false } }
      ]
    }
    if (!ehAdmin) ramoPublico.isHidden = { $ne: true }

    query = {
      isDeleted: { $ne: true }, // Extra safety filter
      $or: [
        ramoPublico,
        {
          isPersonalExam: true,
          createdBy: session.userId
        },
      ],
    }

    /*
     * Prova aplicada a um período só aparece para quem é daquele período.
     *
     * O `$and` é necessário: a query já usa `$or` no nível de cima (visibilidade
     * e prova pessoal) e um segundo `$or` na mesma chave sobrescreveria o
     * primeiro — a prova restrita de um período apareceria para a plataforma
     * inteira, que é o avesso do que a restrição promete.
     *
     * O admin não é filtrado: o painel dele lista tudo. O criador da prova
     * também passa, pelo ramo `createdBy` do `$or` de cima.
     */
    if (!ehAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)

      query = {
        $and: [
          query,
          // Os ramos entram achatados num `$or` só: um `$or` aninhado dentro de
          // outro é válido, mas o planner não usa índice nele.
          { $or: [{ createdBy: session.userId }, ...ramosDePublicoParaMongo(periodo)] },
        ],
      }
    }

    // Sem projeção: o frontend (app/provas, app/admin/exams) lê campos
    // como groupId, totalPoints, scoringMethod, startTime/endTime,
    // gatesOpen/Close, isPracticeExam e questions diretamente do objeto.
    // Restringir projection quebra agrupamento por grupo e exibição
    // de pontos (mostrava "undefined pts"). Mantemos o documento
    // completo aqui; a otimização de CPU vem do cache abaixo + do
    // session cache em lib/auth.ts.
    // `?limit=` é opcional e usado por quem só precisa das mais recentes (a
    // dashboard pede 3). Antes o parâmetro era ignorado: o servidor devolvia
    // todas as provas visíveis — com o array `questions` completo — e o
    // cliente jogava fora todas menos três. Quem não envia o parâmetro
    // (/provas, /admin/exams) continua recebendo a lista inteira.
    const limitParam = Number(request.nextUrl.searchParams.get('limit'))
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 0

    // `?resumo=1` devolve só o suficiente para listar e escolher uma prova.
    // É opt-in justamente porque a projeção completa é necessária às telas
    // existentes (ver comentário acima): quem não pede continua recebendo o
    // documento inteiro. Quem só monta um seletor — como o editor de aulas ao
    // vincular a avaliação (§39) — não precisa baixar o banco de questões de
    // cada prova para mostrar uma lista de títulos.
    const resumo = request.nextUrl.searchParams.get('resumo') === '1'
    const projecao = {
      title: 1,
      // `groupId` faz parte da identidade da prova, não do conteúdo dela: sem
      // ele, quem lista provas por grupo conta zero em todos os grupos — e o
      // zero não parece um erro de projeção, parece um banco vazio.
      groupId: 1,
      isHidden: 1,
      isPersonalExam: 1,
      isPracticeExam: 1,
      numberOfQuestions: 1,
      startTime: 1,
      endTime: 1,
      createdAt: 1,
    }

    /*
     * `campos=lista` — tudo que /provas desenha, e nada do que ela não desenha.
     *
     * A diferença para `resumo=1` é a capa, a descrição, os portões, a pontuação
     * e o autor: /provas mostra os cinco, então o resumo mínimo não serve para
     * ela. O que ela NÃO usa é o array `questions`, e é ele que domina o
     * documento — uma prova de 60 questões carrega os 60 enunciados, as
     * alternativas de cada uma e o gabarito. Numa conta com dezenas de provas
     * visíveis isso são megabytes de JSON para montar uma grade de cartões que
     * só mostra título, capa e "60 questões".
     *
     * A tela precisa das questões em um lugar só: gerar o PDF de uma prova de
     * treino. Isso acontece num clique, sobre UMA prova, e agora busca o
     * documento completo em /api/exams/[id] na hora — em vez de todo visitante
     * baixar o banco de questões de todas as provas por precaução.
     */
    const apenasParaLista = request.nextUrl.searchParams.get('campos') === 'lista'
    const projecaoDeLista = {
      ...projecao,
      description: 1,
      coverImage: 1,
      createdBy: 1,
      gatesOpen: 1,
      gatesClose: 1,
      totalPoints: 1,
      scoringMethod: 1,
      // A tela mostra o selo do período alvo e decide quais botões de download
      // desenhar; sem os dois campos ela desenha para todo mundo o mesmo.
      audience: 1,
      freeDownloads: 1,
    }

    const projecaoEscolhida = apenasParaLista
      ? { projection: projecaoDeLista }
      : resumo
        ? { projection: projecao }
        : {}

    /*
     * `?ids=a,b,c` — as provas completas de um conjunto conhecido, numa
     * requisição só.
     *
     * Quem precisa disso é o PDF de um grupo: a tela lista as provas enxutas
     * (`campos=lista`, sem `questions`) e o gerador precisa das questões. O
     * caminho óbvio seria pedir `/api/exams/[id]` uma vez por prova — e um
     * grupo de vinte provas viram vinte requisições, vinte leituras de sessão e
     * vinte idas ao banco para montar um arquivo só. Aqui é uma consulta com
     * `$in`, sob o MESMO filtro de visibilidade do restante da rota: pedir um id
     * não dá acesso a nada que a listagem já não devolveria.
     *
     * O teto de 100 ids existe para o parâmetro não virar uma consulta
     * arbitrariamente grande vinda do cliente.
     */
    const idsParam = (request.nextUrl.searchParams.get('ids') || '').trim()
    const idsPedidos = idsParam
      ? idsParam.split(',').map((valor) => valor.trim()).filter((valor) => ObjectId.isValid(valor)).slice(0, 100)
      : []
    if (idsParam && idsPedidos.length === 0) {
      return NextResponse.json({ exams: [] })
    }
    if (idsPedidos.length > 0) {
      query = { ...query, _id: { $in: idsPedidos.map((valor) => new ObjectId(valor)) } }
    }

    const cursor = examsCollection.find(query, idsPedidos.length > 0 ? {} : projecaoEscolhida).sort({ createdAt: -1 })
    const exams = await (limit ? cursor.limit(limit) : cursor).toArray()

    /*
     * Sem `resumo` nem `campos=lista`, esta rota devolve o documento completo de
     * TODAS as provas visíveis — e "completo" inclui `questions[]` com o
     * gabarito de cada uma. Era o dump do catálogo inteiro numa requisição só,
     * para qualquer conta autenticada.
     *
     * O gabarito é preservado exatamente onde faz falta — prova de treino, prova
     * pessoal de quem a criou e prova já encerrada, decidido por
     * `podeVerGabarito` —, e some do resto.
     *
     * Aqui havia uma consulta a `submissions` (por `?ids=`), de quando entregar
     * a prova liberava o gabarito dela. Não libera mais: numa prova aplicada à
     * turma inteira, quem entrega primeiro receberia o gabarito com os colegas
     * ainda respondendo (ver `lib/provas/sanitizar-prova.ts`). Sem efeito sobre
     * o veredito, a consulta virou uma ida ao banco por requisição que não muda
     * nada — e saiu.
     */
    const contextoBase = {
      userId: session.userId,
      isAdmin: session.role === 'admin',
    }

    const provasParaEntrega = exams.map((prova) => prepararProvaParaEntrega(prova, contextoBase))

    // Cache privado curto: lista pessoal de provas raramente muda em
    // alguns segundos. SWR mantém UI responsiva sem regerar imediato.
    const headers = new Headers({
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
      'Content-Type': 'application/json',
    })

    return NextResponse.json({ exams: provasParaEntrega }, { headers })
  } catch (error) {
    console.error('Get exams error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar provas' },
      { status: 500 }
    )
  }
}

// Função para obter data atual em horário de Brasília
function getBrasiliaDate(): Date {
  const now = new Date()
  // Brasília é UTC-3
  const brasiliaTime = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return brasiliaTime
}

// Função para verificar se passou meia-noite em Brasília
function needsDailyReset(lastReset: Date | null): boolean {
  if (!lastReset) return true

  const now = getBrasiliaDate()
  const last = new Date(lastReset.getTime() - 3 * 60 * 60 * 1000)

  // Comparar apenas a data (ano, mês, dia)
  return (
    now.getUTCFullYear() !== last.getUTCFullYear() ||
    now.getUTCMonth() !== last.getUTCMonth() ||
    now.getUTCDate() !== last.getUTCDate()
  )
}

// Função auxiliar para resetar limites diários se necessário
async function resetDailyLimitsIfNeeded(db: any, userId: string, accountType: string) {
  const usersCollection = db.collection('users')
  const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  if (!user) return null

  const lastReset = user.lastDailyReset ? new Date(user.lastDailyReset) : null
  const needsReset = needsDailyReset(lastReset)

  if (needsReset) {
    const now = new Date()

    // Limite diário do plano. Vem de lib/tier-limits.ts para o cargo `plus`
    // não cair no fallback de conta gratuita — era o que acontecia com o
    // mapa literal antigo, que só conhecia 'premium'.
    const examsPerDay = getPersonalExamsQuota(accountType)

    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          dailyPersonalExamsCreated: 0,
          dailyPersonalExamsRemaining: examsPerDay,
          dailyAiQuestionsUsed: 0,
          lastDailyReset: now,
        },
      }
    )

    return {
      ...user,
      dailyPersonalExamsCreated: 0,
      dailyPersonalExamsRemaining: examsPerDay,
      dailyAiQuestionsUsed: 0,
      lastDailyReset: now,
    }
  }

  return user
}

// POST - Criar prova
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Sanitize and limit string inputs
    const title = String(body.title || '').slice(0, 150).trim()
    const description = body.description ? String(body.description).slice(0, 1000) : undefined
    const themePhrase = body.themePhrase ? String(body.themePhrase).slice(0, 200) : undefined

    const {
      coverImage,
      numberOfQuestions,
      numberOfAlternatives,
      scoringMethod,
      totalPoints,
      questions,
      pdfUrl,
      gatesOpen,
      gatesClose,
      startTime,
      endTime,
      isHidden = false,
      discursiveCorrectionMethod,
      aiRigor,
      navigationMode = 'paginated',
      duration,
      // Campos de proctoring
      proctoringEnabled,
      proctoringCamera,
      proctoringAudio,
      proctoringScreen,
      proctoringScreenMode,
      // Configurações adicionais
      isPracticeExam = false,
      allowCustomName = false,
      requireSignature = false,
      shuffleQuestions = false,
      shuffleAlternatives = false,
      // Ausente = classificação visível, que é como toda prova se comportava
      // antes de o campo existir.
      showRanking = true,
      audience,
      freeDownloads,
      // Novos campos
      isPersonalExam = false,
      groupId,
      aiQuestionsCount = 0,
      feedbackMode = 'end',
    } = body

    // Numeric validation
    const numQuestions = Math.min(Math.max(0, Number(numberOfQuestions) || 0), 1000)
    const numAlternatives = Math.min(Math.max(0, Number(numberOfAlternatives) || 0), 10)
    const pointsTotal = Math.min(Math.max(0, Number(totalPoints) || 0), 1000000)

    // Validação: campos obrigatórios
    if (!title || !numAlternatives || !scoringMethod) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando ou inválidos' },
        { status: 400 }
      )
    }

    // Para provas não-pessoais, numberOfQuestions é obrigatório
    if (!isPersonalExam && !numQuestions) {
      return NextResponse.json(
        { error: 'Número de questões é obrigatório para provas públicas' },
        { status: 400 }
      )
    }

    if (!isPracticeExam && (!startTime || !endTime)) {
      return NextResponse.json(
        { error: 'Datas de início e fim são obrigatórias para provas não-práticas' },
        { status: 400 }
      )
    }

    /*
     * As quatro datas viram instantes num lugar só.
     *
     * `new Date('2026-05-10T14:00')` — o formato que o `<input datetime-local>`
     * produz — é lido no fuso de QUEM EXECUTA, e quem executa aqui é uma função
     * rodando em UTC. As 14h de Brasília viravam 11h, e os portões da prova
     * abriam e fechavam três horas antes de o primeiro aluno chegar. O painel
     * agora manda ISO com fuso; `interpretarInstante` é a rede para o que
     * chegar sem ele. Ver lib/provas/horario-local.ts.
     */
    const abrePortaoEm = interpretarInstante(gatesOpen)
    const fechaPortaoEm = interpretarInstante(gatesClose)
    const comecaEm = interpretarInstante(startTime)
    const terminaEm = interpretarInstante(endTime)

    // Prova de treino não tem janela ('livre'), então não há o que conferir.
    if (!isPracticeExam) {
      const erroDaJanela = validarJanelaDoFormulario({
        gatesOpen: abrePortaoEm,
        gatesClose: fechaPortaoEm,
        startTime: comecaEm,
        endTime: terminaEm,
      })
      if (erroDaJanela) {
        return NextResponse.json({ error: erroDaJanela }, { status: 400 })
      }
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const usersCollection = db.collection('users')

    /**
     * Permissões do plano assinado, quando ele modula "Provas por IA".
     *
     * Fica fora do bloco de validação porque o registro de consumo só acontece
     * depois que a prova entra no banco — cobrar a cota de uma prova que
     * falhou ao gravar seria cobrar por nada.
     */
    let permissoesDoPlano: ContextoDePermissoes | null = null

    // Se for prova pessoal e não for admin, validar limites
    if (isPersonalExam && session.role !== 'admin') {
      // Obter tipo de conta primeiro
      const tempUser = await usersCollection.findOne({ _id: new ObjectId(session.userId) })
      if (!tempUser) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }

      const accountType = tempUser.accountType || 'gratuito'

      permissoesDoPlano = await resolverPermissoes(db, {
        userId: session.userId,
        role: session.role,
        accountType,
        premiumPlanType: tempUser.premiumPlanType,
      })
      const veredictoDoPlano = await avaliarUsoDoPlano(db, permissoesDoPlano, 'provasIa')
      if (!veredictoDoPlano.permitido) {
        return NextResponse.json(corpoDeRecusa(veredictoDoPlano), { status: 403 })
      }
      /**
       * Com o plano modulando a área, ele é a única régua: os tetos abaixo
       * (vitalício, diário e questões de IA por prova) ficam de fora. Rodar os
       * dois daria ao aluno duas respostas diferentes para a mesma pergunta —
       * e a tabela por cargo aqui embaixo não conhece o cargo `plus`, então
       * ela derrubaria em 5 questões um plano configurado para 50 provas.
       */
      const usarTetosDoCargo = !veredictoDoPlano.aplicavel

      // Resetar limites se necessário
      const user = await resetDailyLimitsIfNeeded(db, session.userId, accountType)
      if (!user) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
      }
      const dailyExamsUsed = user.dailyPersonalExamsCreated || 0
      const dailyAiQuestionsUsed = user.dailyAiQuestionsUsed || 0

      // Calcular limites baseado no tipo de conta
      const dailyExamsLimits: Record<string, number> = {
        gratuito: 3,
        trial: 10,
        premium: 20,
      }
      const aiQuestionsLimits: Record<string, number> = {
        gratuito: 5,
        trial: 10,
        premium: 20,
      }
      const dailyExamsLimit = dailyExamsLimits[accountType] || 3
      const aiQuestionsPerExamLimit = aiQuestionsLimits[accountType] || 5

      // Validar limite vitalício de provas pessoais para usuários gratuitos
      const personalExamsLifetimeLimit = getPersonalExamsLifetimeLimit(accountType)
      if (usarTetosDoCargo && personalExamsLifetimeLimit !== Infinity) {
        // Usar contador vitalício se existir, senão contar documentos ativos como fallback
        let existingPersonalExams = user.totalPersonalExamsCreated

        if (typeof existingPersonalExams !== 'number') {
          existingPersonalExams = await examsCollection.countDocuments({
            isPersonalExam: true,
            createdBy: session.userId
          })
        }

        if (existingPersonalExams >= personalExamsLifetimeLimit) {
          return NextResponse.json({
            error: `Limite vitalício de provas pessoais atingido (${personalExamsLifetimeLimit} no total). Faça para o Plus+ para criar mais provas.`,
            requiresUpgrade: true,
            upgradeUrl: '/buy',
            limit: personalExamsLifetimeLimit,
            used: existingPersonalExams
          }, { status: 403 })
        }
      }

      // Se admin setou um valor de "restantes", usar esse para calcular se pode criar
      let examsRemaining = dailyExamsLimit - dailyExamsUsed
      if (user.dailyPersonalExamsRemaining !== undefined) {
        examsRemaining = user.dailyPersonalExamsRemaining
      }

      // Validar limite diário de provas pessoais
      if (usarTetosDoCargo && examsRemaining <= 0) {
        return NextResponse.json(
          {
            error: `Limite diário de provas pessoais atingido (${dailyExamsLimit}/dia para contas ${accountType})`,
          },
          { status: 403 }
        )
      }

      // Validar limite de questões IA por prova
      if (usarTetosDoCargo && aiQuestionsCount > aiQuestionsPerExamLimit) {
        return NextResponse.json(
          {
            error: `Limite de questões geradas por IA atingido (máximo ${aiQuestionsPerExamLimit} por prova para contas ${accountType})`,
          },
          { status: 403 }
        )
      }

      // Incrementar contadores
      const updateData: any = {
        $inc: {
          dailyPersonalExamsCreated: 1,
          dailyAiQuestionsUsed: aiQuestionsCount,
          totalPersonalExamsCreated: 1,
        },
      }

      // Se admin setou um valor de "restantes", decrementar esse valor também
      if (user.dailyPersonalExamsRemaining !== undefined) {
        updateData.$inc.dailyPersonalExamsRemaining = -1
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(session.userId) },
        updateData
      )
    }

    // Apenas admin pode criar provas públicas (não pessoais)
    if (!isPersonalExam && session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar provas públicas' },
        { status: 403 }
      )
    }

    // Para provas práticas, usar datas que permitem acesso imediato
    const now = new Date()
    const defaultFutureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 ano no futuro

    const newExam: Exam = {
      title,
      description,
      coverImage,
      numberOfQuestions: numQuestions,
      numberOfAlternatives: numAlternatives,
      themePhrase,
      scoringMethod,
      totalPoints: pointsTotal,
      questions: questions || [],
      pdfUrl,
      // Prova de treino não tem portão: ela é 'livre' na janela, e um portão
      // gravado nela só confundiria quem abrisse o formulário depois.
      gatesOpen: isPracticeExam ? undefined : (abrePortaoEm ?? undefined),
      gatesClose: isPracticeExam ? undefined : (fechaPortaoEm ?? undefined),
      startTime: comecaEm ?? (isPracticeExam ? now : new Date()),
      endTime: terminaEm ?? (isPracticeExam ? defaultFutureDate : new Date()),
      createdBy: session.userId,
      isHidden,
      discursiveCorrectionMethod,
      aiRigor,
      navigationMode,
      duration,
      // Configurações de proctoring
      proctoring: proctoringEnabled ? {
        enabled: proctoringEnabled,
        camera: proctoringCamera || false,
        audio: proctoringAudio || false,
        screen: proctoringScreen || false,
        screenMode: proctoringScreenMode || 'window',
      } : undefined,
      // Configurações adicionais
      isPracticeExam,
      allowCustomName,
      requireSignature,
      shuffleQuestions,
      shuffleAlternatives,
      showRanking: showRanking !== false,
      // Público e exceção de download só existem em prova pública: numa prova
      // pessoal não há a quem aplicar nem plano de terceiro a excetuar.
      audience: isPersonalExam ? undefined : normalizarPublico(audience),
      freeDownloads: isPersonalExam ? undefined : normalizarLiberacoes(freeDownloads),
      // Novos campos
      groupId: groupId || null,
      isPersonalExam,
      aiQuestionsCount: aiQuestionsCount || 0,
      feedbackMode: feedbackMode as 'end' | 'immediate',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await examsCollection.insertOne(newExam)

    if (permissoesDoPlano) {
      await registrarUsoDoPlano(db, permissoesDoPlano, 'provasIa', {
        recurso: String(result.insertedId),
      })
    }

    return NextResponse.json({
      success: true,
      examId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Create exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar prova' },
      { status: 500 }
    )
  }
}

// DELETE - Deletar TODAS as provas (uso administrativo)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão' },
        { status: 403 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection('submissions')

    // Deletar todas as submissões
    await submissionsCollection.deleteMany({})

    // Deletar todas as provas
    const result = await examsCollection.deleteMany({})

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} prova(s) deletada(s) com sucesso`,
      deletedCount: result.deletedCount
    })
  } catch (error) {
    console.error('Delete all exams error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar provas' },
      { status: 500 }
    )
  }
}
