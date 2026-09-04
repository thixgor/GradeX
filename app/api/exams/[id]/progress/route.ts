import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { Exam, ExamSubmission, UserAnswer } from '@/lib/types'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { pessoaEstaNoPublico } from '@/lib/provas/publico-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import {
  COLECAO_DE_PROGRESSO,
  RETOMADAS_PERMITIDAS,
  avaliarRetomada,
  contarRespondidas,
  type ProgressoDaProva,
} from '@/lib/provas/retomada'

export const dynamic = 'force-dynamic'

/**
 * O progresso da prova em andamento — gravado enquanto o aluno responde,
 * devolvido quando ele volta.
 *
 * Três verbos:
 *
 *  - `GET`    — o que está salvo e se dá para continuar (o veredito da retomada).
 *  - `PUT`    — a gravação automática, chamada de tempos em tempos pela tela.
 *  - `POST`   — consumir a retomada: "estou voltando, me devolve a prova".
 *
 * A entrega (`/submit`) apaga o registro. Ele é rascunho, não histórico.
 *
 * ## Por que no servidor e não no `localStorage`
 *
 * O que o `localStorage` não cobre é justamente o caso que a retomada existe
 * para cobrir: o celular que reinicia, o navegador que limpa os dados do site,
 * a pessoa que volta pelo notebook porque o celular morreu. Também é o que
 * impede a retomada de ser contornável — um contador guardado no navegador do
 * aluno é um contador que ele zera.
 */

const LIMITE_DE_RESPOSTAS = 1000
const LIMITE_DE_TEXTO = 20_000

/** Fica com o que a prova de fato tem, no tamanho que ela de fato usa. */
function sanearRespostas(bruto: unknown, idsValidos: Set<string>): UserAnswer[] {
  if (!Array.isArray(bruto)) return []
  const vistas = new Set<string>()
  const limpas: UserAnswer[] = []

  for (const item of bruto.slice(0, LIMITE_DE_RESPOSTAS)) {
    const questionId = String((item as any)?.questionId || '')
    if (!questionId || !idsValidos.has(questionId) || vistas.has(questionId)) continue
    vistas.add(questionId)

    const bruta = item as any
    const resposta: UserAnswer = { questionId }

    if (typeof bruta.selectedAlternative === 'string') {
      resposta.selectedAlternative = bruta.selectedAlternative.slice(0, 120)
    }
    if (Array.isArray(bruta.crossedAlternatives)) {
      resposta.crossedAlternatives = bruta.crossedAlternatives
        .slice(0, 20)
        .map((a: unknown) => String(a).slice(0, 120))
    }
    if (typeof bruta.discursiveText === 'string') {
      resposta.discursiveText = bruta.discursiveText.slice(0, LIMITE_DE_TEXTO)
    }
    if (typeof bruta.essayText === 'string') {
      resposta.essayText = bruta.essayText.slice(0, LIMITE_DE_TEXTO)
    }
    if (typeof bruta.discursiveSelfScore === 'number' && Number.isFinite(bruta.discursiveSelfScore)) {
      resposta.discursiveSelfScore = Math.min(100, Math.max(0, Math.round(bruta.discursiveSelfScore)))
    }
    if (Array.isArray(bruta.highlights)) {
      resposta.highlights = bruta.highlights.slice(0, 200)
    }

    limpas.push(resposta)
  }

  return limpas
}

/** Carrega a prova e confere que esta pessoa tem o que fazer nela. */
async function contextoDaProva(id: string, userId: string, isAdmin: boolean) {
  if (!ObjectId.isValid(id)) return { erro: NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 }) }

  const db = await getDb()
  const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
  if (!exam) return { erro: NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 }) }

  if (!isAdmin) {
    const periodo = await lerPeriodoDoAluno(db, userId)
    if (!pessoaEstaNoPublico(exam, { userId, isAdmin, periodo })) {
      return { erro: NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 }) }
    }
  }

  const submissao = await db
    .collection<ExamSubmission>('submissions')
    .findOne({ examId: id, userId }, { projection: { _id: 1 } })

  return { db, exam, jaEntregou: !!submissao }
}

function vereditoDe(
  progresso: ProgressoDaProva | null,
  exam: Exam,
  jaEntregou: boolean,
) {
  const janela = resolverJanelaDaProva(exam)
  return {
    veredito: avaliarRetomada({
      progresso,
      jaEntregou,
      janelaAberta: janela.podeEnviar,
      // Os dois extremos da janela precisam ser distinguíveis: `podeEnviar` é
      // falso tanto antes do início quanto depois do término.
      jaEncerrou: janela.encerrada,
      respostasGravadas: contarRespondidas(progresso?.answers),
    }),
    janela,
  }
}

// GET — o que está salvo, e se dá para continuar.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const ctx = await contextoDaProva(id, session.userId, session.role === 'admin')
    if ('erro' in ctx) return ctx.erro

    const progresso = await ctx.db!
      .collection<ProgressoDaProva>(COLECAO_DE_PROGRESSO)
      .findOne({ examId: id, userId: session.userId })

    const { veredito, janela } = vereditoDe(progresso as any, ctx.exam!, ctx.jaEntregou!)

    return NextResponse.json({
      progresso: progresso
        ? {
            answers: progresso.answers || [],
            currentQuestionIndex: progresso.currentQuestionIndex || 0,
            questionOrder: progresso.questionOrder || null,
            userName: progresso.userName || '',
            themeTranscription: progresso.themeTranscription || '',
            signature: progresso.signature || '',
            startedAt: progresso.startedAt,
            resumesUsed: progresso.resumesUsed || 0,
            respondidas: contarRespondidas(progresso.answers),
            atualizadoEm: progresso.updatedAt,
          }
        : null,
      veredito,
      janela,
    })
  } catch (error) {
    console.error('Get exam progress error:', error)
    return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 })
  }
}

// PUT — gravação automática enquanto a prova acontece.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const ctx = await contextoDaProva(id, session.userId, session.role === 'admin')
    if ('erro' in ctx) return ctx.erro

    // Prova entregue não tem rascunho, e prova encerrada não recebe mais nada —
    // deixar gravar depois do fim seria uma forma silenciosa de continuar
    // respondendo com a prova fechada.
    if (ctx.jaEntregou) return NextResponse.json({ error: 'Prova já entregue' }, { status: 409 })

    const janela = resolverJanelaDaProva(ctx.exam!)
    if (!janela.podeEnviar) {
      return NextResponse.json({ error: janela.motivo || 'Prova encerrada' }, { status: 409 })
    }

    const body = await request.json()
    const idsValidos = new Set((ctx.exam!.questions || []).map((q) => q.id))
    const answers = sanearRespostas(body.answers, idsValidos)

    const agora = new Date()
    const indice = Number(body.currentQuestionIndex)
    const ordem = Array.isArray(body.questionOrder)
      ? body.questionOrder.filter((qid: unknown) => idsValidos.has(String(qid))).map(String)
      : undefined

    const set: Record<string, unknown> = {
      answers,
      currentQuestionIndex: Number.isFinite(indice) ? Math.max(0, Math.min(5000, Math.trunc(indice))) : 0,
      updatedAt: agora,
    }
    if (ordem && ordem.length > 0) set.questionOrder = ordem
    if (typeof body.userName === 'string') set.userName = body.userName.slice(0, 160)
    if (typeof body.themeTranscription === 'string') {
      set.themeTranscription = body.themeTranscription.slice(0, 2000)
    }
    // A assinatura é uma imagem em base64: gravada uma vez, na primeira
    // gravação em que ela existe. Reenviá-la a cada 12 segundos multiplicaria o
    // tamanho do rascunho sem mudar nada.
    if (typeof body.signature === 'string' && body.signature.startsWith('data:image/')) {
      set.signature = body.signature.slice(0, 400_000)
    }

    await ctx.db!.collection<ProgressoDaProva>(COLECAO_DE_PROGRESSO).updateOne(
      { examId: id, userId: session.userId },
      {
        $set: set,
        $setOnInsert: {
          examId: id,
          userId: session.userId,
          // O início vem da PRIMEIRA gravação e nunca é reescrito: é ele que
          // ancora o cronômetro individual da prova (`duration`), e reescrevê-lo
          // numa retomada devolveria a duração inteira a quem recarregou.
          startedAt: body.startedAt ? new Date(body.startedAt) : agora,
          resumesUsed: 0,
        },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true, salvoEm: agora, respondidas: contarRespondidas(answers) })
  } catch (error) {
    console.error('Save exam progress error:', error)
    return NextResponse.json({ error: 'Erro ao salvar progresso' }, { status: 500 })
  }
}

// POST — consumir a retomada e receber a prova de volta.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const ctx = await contextoDaProva(id, session.userId, session.role === 'admin')
    if ('erro' in ctx) return ctx.erro

    const colecao = ctx.db!.collection<ProgressoDaProva>(COLECAO_DE_PROGRESSO)
    const progresso = await colecao.findOne({ examId: id, userId: session.userId })

    const { veredito } = vereditoDe(progresso as any, ctx.exam!, ctx.jaEntregou!)
    if (!veredito.podeRetomar) {
      return NextResponse.json({ error: veredito.mensagem || 'Não é possível retomar esta prova', veredito }, { status: 409 })
    }

    /*
     * O incremento é a permissão.
     *
     * O filtro exige que o contador ainda esteja abaixo do teto, então duas
     * abas clicando em "continuar" ao mesmo tempo — ou um clique repetido numa
     * conexão ruim — não gastam duas retomadas nem devolvem duas: a segunda
     * atualização não encontra documento e a resposta é a mesma recusa que
     * qualquer outra tentativa esgotada.
     */
    const retomado = await colecao.findOneAndUpdate(
      { examId: id, userId: session.userId, resumesUsed: { $lt: RETOMADAS_PERMITIDAS } },
      { $inc: { resumesUsed: 1 }, $set: { lastResumedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: 'after' },
    )

    const documento = (retomado as any)?.value ?? retomado
    if (!documento) {
      return NextResponse.json(
        { error: 'Você já usou a sua única retomada nesta prova.' },
        { status: 409 },
      )
    }

    return NextResponse.json({
      success: true,
      progresso: {
        answers: documento.answers || [],
        currentQuestionIndex: documento.currentQuestionIndex || 0,
        questionOrder: documento.questionOrder || null,
        userName: documento.userName || '',
        themeTranscription: documento.themeTranscription || '',
        signature: documento.signature || '',
        startedAt: documento.startedAt,
        resumesUsed: documento.resumesUsed || 0,
      },
      retomadasRestantes: Math.max(0, RETOMADAS_PERMITIDAS - (documento.resumesUsed || 0)),
    })
  } catch (error) {
    console.error('Resume exam error:', error)
    return NextResponse.json({ error: 'Erro ao retomar prova' }, { status: 500 })
  }
}
