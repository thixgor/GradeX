import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { Exam, ExamSubmission } from '@/lib/types'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { COLECAO_DE_ENTRADAS } from '@/lib/provas/entrada-na-prova'
import { COLECAO_DE_PROGRESSO } from '@/lib/provas/retomada'
import {
  LIMITE_DE_PARTICIPANTES,
  ordenarParticipantes,
  provaAcompanhavel,
  resumoDoAcompanhamento,
  type ParticipanteAoVivo,
  type RetratoAoVivo,
} from '@/lib/provas/acompanhamento-ao-vivo'

export const dynamic = 'force-dynamic'

/**
 * O retrato da prova acontecendo — quem entrou, quem assinou, quem começou e
 * em que questão cada um está.
 *
 * ## A regra que governa este arquivo: o retrato é pequeno
 *
 * O painel do admin pergunta de tempos em tempos enquanto a prova acontece
 * (ver `cadenciaDoRetrato`), e a Vercel cobra por invocação e por duração. Uma
 * rota que devolvesse os documentos como eles são no banco custaria caro por
 * um motivo bobo: `exam_progress` guarda a imagem da assinatura em base64 (até
 * 400 KB por pessoa) e o array inteiro de respostas, com o texto das
 * discursivas (até 20 000 caracteres por questão). Ler 60 alunos assim é ler
 * dezenas de megabytes a cada 15 segundos para exibir "questão 12 de 40".
 *
 * Por isso NADA pesado sai do Mongo. A agregação faz as contas lá dentro e
 * devolve, por pessoa, uma dúzia de campos escalares:
 *
 *  - `assinou` vira um booleano (a imagem não vem);
 *  - `respondidas` vira um número (o array não vem);
 *  - a resposta da questão ATUAL vira uma string (as outras não vêm).
 *
 * O enunciado, o comando e as alternativas também não vêm daqui: o painel já
 * tem a prova inteira em memória (`GET /api/exams` devolve os documentos
 * completos), e a ordem que cada aluno viu é reproduzível no navegador a
 * partir da semente `examId:userId` (ver `lib/provas/embaralhar.ts`). Expandir
 * uma pessoa para ler a questão que ela está respondendo custa zero
 * requisição.
 *
 * O único dado grande — a imagem da assinatura — mora na rota irmã
 * (`./[userId]`), pedida uma vez, quando o admin abre aquela pessoa.
 */

/** Ninguém precisa de um retrato mais novo do que o rascunho que o alimenta. */
const CABECALHO_DE_CACHE = 'private, max-age=5, must-revalidate'

/**
 * As respostas que contam como respondidas.
 *
 * Comparação (`$ne`), e não `$strLenCP`: o operador de string estoura o
 * pipeline inteiro se algum documento antigo tiver gravado um número onde hoje
 * há texto, e um painel que quebra por causa de um documento de 2024 é pior do
 * que um painel que conta um a mais.
 */
const RESPOSTA_TEM_CONTEUDO = {
  $or: [
    { $ne: [{ $ifNull: ['$$a.selectedAlternative', ''] }, ''] },
    { $ne: [{ $ifNull: ['$$a.discursiveText', ''] }, ''] },
    { $ne: [{ $ifNull: ['$$a.essayText', ''] }, ''] },
    { $ne: [{ $ifNull: ['$$a.discursiveSelfScore', null] }, null] },
  ],
}

function iso(valor: unknown): string | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor as string)
  return Number.isFinite(data.getTime()) ? data.toISOString() : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()
    const exam = (await db.collection('exams').findOne(
      { _id: new ObjectId(id) },
      {
        projection: {
          title: 1,
          gatesOpen: 1,
          gatesClose: 1,
          startTime: 1,
          endTime: 1,
          isPracticeExam: 1,
          isPersonalExam: 1,
          requireSignature: 1,
          allowCustomName: 1,
          themePhrase: 1,
          numberOfQuestions: 1,
          // Só os ids: é o que basta para saber em que questão cada pessoa
          // está. Trazer as questões inteiras aqui traria enunciados, imagens e
          // alternativas de toda a prova a cada volta do relógio.
          'questions.id': 1,
        },
      },
    )) as (Partial<Exam> & { questions?: { id: string }[] }) | null

    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    if (!provaAcompanhavel(exam)) {
      return NextResponse.json(
        { error: 'Prova de treino e prova pessoal não têm andamento para acompanhar.' },
        { status: 400 },
      )
    }

    const ordemPadrao = (exam.questions || []).map((q) => q.id).filter(Boolean)
    const totalQuestoes = exam.numberOfQuestions || ordemPadrao.length

    const [entradas, progressos, entregas] = await Promise.all([
      // A folha de presença sem a imagem: `assinou` é o que o retrato mostra,
      // e a imagem custa 400 KB por pessoa.
      db
        .collection(COLECAO_DE_ENTRADAS)
        .aggregate([
          { $match: { examId: id } },
          { $sort: { entrouEm: 1 } },
          { $limit: LIMITE_DE_PARTICIPANTES },
          {
            $project: {
              _id: 0,
              userId: 1,
              entrouEm: 1,
              nomeDeclarado: 1,
              assinadoEm: 1,
              assinou: { $ne: [{ $ifNull: ['$assinatura', ''] }, ''] },
              transcreveu: { $ne: [{ $ifNull: ['$transcricaoDaFrase', ''] }, ''] },
            },
          },
        ])
        .toArray(),

      db
        .collection(COLECAO_DE_PROGRESSO)
        .aggregate([
          { $match: { examId: id } },
          { $sort: { updatedAt: -1 } },
          { $limit: LIMITE_DE_PARTICIPANTES },
          {
            // `$addFields` e não `$set`: é o mesmo estágio com o nome que o
            // resto do projeto usa — o `$set` de agregação só existe do Mongo
            // 4.2 em diante, e não há motivo para exigir isso aqui.
            // A ordem que ESTA pessoa viu: a gravada, quando a prova embaralha;
            // a da própria prova, quando não. Sem este passo, a "questão 12" do
            // painel seria a décima segunda do banco — que não é a que ela está
            // lendo.
            $addFields: {
              _ordem: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ['$questionOrder', []] } }, 0] },
                  '$questionOrder',
                  // `$literal`: sem ele, um id de questão que começasse com
                  // "$" seria lido como caminho de campo pelo Mongo.
                  { $literal: ordemPadrao },
                ],
              },
              // `$floor` + `$toInt` porque `$arrayElemAt` exige índice inteiro: o
              // número chega do JavaScript como double, e um documento antigo
              // com valor fracionário derrubaria o pipeline inteiro — o painel
              // da prova em andamento não pode cair por causa de um decimal.
              _indice: { $toInt: { $floor: { $max: [0, { $ifNull: ['$currentQuestionIndex', 0] }] } } },
            },
          },
          { $addFields: { _questaoId: { $arrayElemAt: ['$_ordem', '$_indice'] } } },
          {
            $addFields: {
              _respostaAtual: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ['$answers', []] },
                      as: 'a',
                      cond: { $eq: ['$$a.questionId', '$_questaoId'] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              userId: 1,
              nomeDeclarado: '$userName',
              iniciouEm: '$startedAt',
              ultimoSinalEm: '$updatedAt',
              retomadasUsadas: { $ifNull: ['$resumesUsed', 0] },
              indice: '$_indice',
              questaoId: { $ifNull: ['$_questaoId', null] },
              marcada: { $ifNull: ['$_respostaAtual.selectedAlternative', null] },
              escreveu: {
                $or: [
                  { $ne: [{ $ifNull: ['$_respostaAtual.discursiveText', ''] }, ''] },
                  { $ne: [{ $ifNull: ['$_respostaAtual.essayText', ''] }, ''] },
                ],
              },
              assinou: { $ne: [{ $ifNull: ['$signature', ''] }, ''] },
              transcreveu: { $ne: [{ $ifNull: ['$themeTranscription', ''] }, ''] },
              respondidas: {
                $size: {
                  $filter: { input: { $ifNull: ['$answers', []] }, as: 'a', cond: RESPOSTA_TEM_CONTEUDO },
                },
              },
            },
          },
        ])
        .toArray(),

      /*
       * `answers.0` não é filigrana: `/api/exams/[id]/start-proctoring` grava
       * um documento em `submissions` só para o aluno aparecer no
       * monitoramento por vídeo, e esse documento já nasce com `submittedAt`
       * preenchido. Sem este filtro, todo mundo de uma prova com proctoring
       * apareceria como "Entregou" no instante em que começasse a fazê-la.
       * É o mesmo `REAL_SUBMISSION_FILTER` de `lib/admin-stats/common.ts`.
       */
      db
        .collection<ExamSubmission>('submissions')
        .find(
          { examId: id, 'answers.0': { $exists: true } } as any,
          { projection: { userId: 1, userName: 1, submittedAt: 1, startedAt: 1 } },
        )
        .limit(LIMITE_DE_PARTICIPANTES)
        .toArray(),
    ])

    // ── Uma linha por pessoa, vindo de três origens ──────────────────────
    const linhas = new Map<string, ParticipanteAoVivo>()

    const linhaDe = (userId: string): ParticipanteAoVivo => {
      const existente = linhas.get(userId)
      if (existente) return existente
      const nova: ParticipanteAoVivo = {
        userId,
        nome: '',
        email: '',
        nomeDeclarado: null,
        entrouEm: null,
        assinou: false,
        assinadoEm: null,
        transcreveu: false,
        iniciouEm: null,
        ultimoSinalEm: null,
        entregouEm: null,
        respondidas: 0,
        totalQuestoes,
        retomadasUsadas: 0,
        questaoAtual: null,
      }
      linhas.set(userId, nova)
      return nova
    }

    for (const entrada of entradas as any[]) {
      if (!entrada.userId) continue
      const linha = linhaDe(String(entrada.userId))
      linha.entrouEm = iso(entrada.entrouEm)
      linha.nomeDeclarado = entrada.nomeDeclarado || linha.nomeDeclarado
      linha.assinou = linha.assinou || !!entrada.assinou
      linha.assinadoEm = iso(entrada.assinadoEm) || linha.assinadoEm
      linha.transcreveu = linha.transcreveu || !!entrada.transcreveu
    }

    for (const progresso of progressos as any[]) {
      if (!progresso.userId) continue
      const linha = linhaDe(String(progresso.userId))
      linha.nomeDeclarado = progresso.nomeDeclarado || linha.nomeDeclarado
      linha.iniciouEm = iso(progresso.iniciouEm)
      linha.ultimoSinalEm = iso(progresso.ultimoSinalEm)
      linha.retomadasUsadas = Number(progresso.retomadasUsadas) || 0
      linha.respondidas = Number(progresso.respondidas) || 0
      // A assinatura do rascunho não substitui a da sala: ela CONFIRMA. Quem
      // assinou na espera e começou a prova tem as duas, e a marca de quando
      // assinou continua sendo a primeira.
      linha.assinou = linha.assinou || !!progresso.assinou
      linha.transcreveu = linha.transcreveu || !!progresso.transcreveu
      /*
       * Quem assinou direto na tela de entrada — com a prova já em andamento,
       * sem passar pela sala — não tem `assinadoEm`: a assinatura dessa pessoa
       * chegou junto com a primeira gravação do rascunho. O início serve de
       * marca; sem ele a linha mostraria "Assinou —" sobre uma assinatura que
       * existe.
       */
      if (!linha.assinadoEm && progresso.assinou) linha.assinadoEm = iso(progresso.iniciouEm)

      const indice = Number(progresso.indice) || 0
      linha.questaoAtual = {
        indice,
        numero: indice + 1,
        questaoId: progresso.questaoId ?? null,
        marcada: progresso.marcada ?? null,
        escreveu: !!progresso.escreveu,
      }
    }

    for (const entrega of entregas) {
      if (!entrega.userId) continue
      const linha = linhaDe(String(entrega.userId))
      linha.entregouEm = iso(entrega.submittedAt)
      linha.nomeDeclarado = entrega.userName || linha.nomeDeclarado
      if (!linha.iniciouEm) linha.iniciouEm = iso(entrega.startedAt)
    }

    // ── Os nomes das contas ─────────────────────────────────────────────
    // O registro de entrada guarda só o id: ele é um controle de acesso, não um
    // cadastro. O nome vem daqui, uma consulta só para a lista inteira.
    const ids = [...linhas.keys()].filter((u) => ObjectId.isValid(u))
    if (ids.length > 0) {
      const usuarios = await db
        .collection('users')
        .find(
          { _id: { $in: ids.map((u) => new ObjectId(u)) } },
          { projection: { name: 1, email: 1 } },
        )
        .toArray()

      for (const usuario of usuarios) {
        const linha = linhas.get(String(usuario._id))
        if (!linha) continue
        linha.nome = (usuario as any).name || ''
        linha.email = (usuario as any).email || ''
      }
    }

    const agora = new Date()
    const participantes = ordenarParticipantes([...linhas.values()], agora.getTime())

    const corpo: Omit<RetratoAoVivo, 'agora'> = {
      provaId: id,
      assinaturaObrigatoria: !!exam.requireSignature,
      assinaturaDisponivel: exam.requireSignature !== false,
      pedeFraseTema: !!exam.themePhrase,
      permiteNomeProprio: !!exam.allowCustomName,
      totalQuestoes,
      janela: resolverJanelaDaProva(exam, agora, { jaEntrou: true }),
      participantes,
      resumo: resumoDoAcompanhamento(participantes, agora.getTime()),
      truncado:
        entradas.length >= LIMITE_DE_PARTICIPANTES ||
        progressos.length >= LIMITE_DE_PARTICIPANTES ||
        entregas.length >= LIMITE_DE_PARTICIPANTES,
    }

    /*
     * A etiqueta cobre o retrato SEM o relógio.
     *
     * `agora` muda a cada chamada por definição; incluí-lo faria a etiqueta
     * mudar sempre e a comparação nunca valer nada. Fora ele, uma sala parada —
     * que é o estado da maior parte de qualquer prova — responde 304 sem corpo,
     * e o painel fica com o retrato que já tem.
     */
    const etiqueta = `W/"${createHash('sha1').update(JSON.stringify(corpo)).digest('base64url')}"`

    if (request.headers.get('if-none-match') === etiqueta) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etiqueta, 'Cache-Control': CABECALHO_DE_CACHE },
      })
    }

    const retrato: RetratoAoVivo = { ...corpo, agora: agora.toISOString() }
    return NextResponse.json(retrato, {
      headers: { ETag: etiqueta, 'Cache-Control': CABECALHO_DE_CACHE },
    })
  } catch (error) {
    console.error('Retrato ao vivo error:', error)
    return NextResponse.json({ error: 'Erro ao carregar o andamento da prova' }, { status: 500 })
  }
}
