import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam, ExamSubmission, UserAnswer } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'
import { pessoaEstaNoPublico } from '@/lib/provas/publico-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { COLECAO_DE_PROGRESSO } from '@/lib/provas/retomada'

export const dynamic = 'force-dynamic'

// POST - Submeter respostas da prova
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { userName, themeTranscription, answers, signature, startedAt } = body

    if (!userName || !answers) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const db = await getDb()
    const examsCollection = db.collection<Exam>('exams')
    const submissionsCollection = db.collection<ExamSubmission>('submissions')

    const exam = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    /*
     * A janela da prova, decidida pelo relógio do servidor.
     *
     * Antes a checagem era só `now > endTime`. Faltavam os dois outros lados da
     * mesma porta: nada impedia uma entrega ANTES do início (a prova nem tinha
     * começado e já havia nota no ranking) e o portão não existia aqui. A
     * `resolverJanelaDaProva` responde as três de uma vez — e é a mesma função
     * que a tela usa para desenhar, então servidor e cliente não podem mais
     * discordar sobre quando a prova está aberta.
     *
     * Fechar o PORTÃO não bloqueia a entrega: quem entrou antes dele fechar
     * continua respondendo até o término. É o término que encerra a prova.
     */
    const now = new Date()
    const janela = resolverJanelaDaProva(exam, now)
    if (!janela.podeEnviar) {
      return NextResponse.json(
        { error: janela.motivo || 'Prova fora do horário' },
        { status: 400 }
      )
    }

    /*
     * Prova aplicada a um período não recebe entrega de fora dele.
     *
     * Sem isto, a restrição de público seria só de exibição: quem descobrisse o
     * id da prova entregaria por `fetch` e entraria no ranking da turma.
     */
    if (session.role !== 'admin') {
      const noPublico = pessoaEstaNoPublico(exam, {
        userId: session.userId,
        isAdmin: false,
        periodo: await lerPeriodoDoAluno(db, session.userId),
      })
      if (!noPublico) {
        return NextResponse.json(
          { error: 'Esta prova não foi aplicada para você.' },
          { status: 403 }
        )
      }
    }

    // Verifica se já existe submissão (exceto para provas práticas que permitem múltiplas tentativas)
    if (!exam.isPracticeExam) {
      const existingSubmission = await submissionsCollection.findOne({
        examId: id,
        userId: session.userId,
      })

      if (existingSubmission) {
        return NextResponse.json(
          { error: 'Você já submeteu esta prova' },
          { status: 400 }
        )
      }
    }

    let score: number | undefined
    let correctionStatus: 'pending' | 'corrected' | undefined

    // Verificar se há questões discursivas ou redações
    const hasDiscursiveQuestions = exam.questions.some(q => q.type === 'discursive')
    const hasEssayQuestions = exam.questions.some(q => q.type === 'essay')

    // Discursivas em modo 'prompt' são autoavaliadas pelo aluno — não precisam de correção externa
    const discursiveNeedsCorrection = hasDiscursiveQuestions && exam.discursiveCorrectionMethod !== 'prompt'
    const needsCorrection = discursiveNeedsCorrection || hasEssayQuestions

    // Calcula pontuação de múltipla escolha (sempre, se existirem)
    let multipleChoiceScore = 0
    let multipleChoicePercentage = 0
    const multipleChoiceQuestions = exam.questions.filter(q => q.type === 'multiple-choice')
    const discursiveQuestions = exam.questions.filter(q => q.type === 'discursive')

    if (exam.scoringMethod === 'normal' && multipleChoiceQuestions.length > 0) {
      let correctAnswers = 0

      for (const answer of answers as UserAnswer[]) {
        const question = exam.questions.find(q => q.id === answer.questionId)
        if (question && question.type === 'multiple-choice') {
          const correctAlt = question.alternatives.find(alt => alt.isCorrect)
          if (correctAlt && answer.selectedAlternative === correctAlt.id) {
            correctAnswers++
          }
        }
      }

      multipleChoicePercentage = (correctAnswers / multipleChoiceQuestions.length) * 100
      multipleChoiceScore = correctAnswers
    }

    // Calcular score final quando não precisa de correção externa
    if (exam.scoringMethod === 'normal' && !needsCorrection) {
      const totalPoints = exam.totalPoints || 100
      const totalQuestions = exam.questions.length

      if (totalQuestions > 0) {
        let totalWeightedScore = 0

        // MC score (0-100% of MC weight)
        if (multipleChoiceQuestions.length > 0) {
          const mcWeight = multipleChoiceQuestions.length / totalQuestions
          totalWeightedScore += mcWeight * (multipleChoiceScore / multipleChoiceQuestions.length)
        }

        // Self-score discursive (mode: prompt)
        if (discursiveQuestions.length > 0 && exam.discursiveCorrectionMethod === 'prompt') {
          const discWeight = discursiveQuestions.length / totalQuestions
          let discAvgPct = 0
          let scored = 0
          for (const dq of discursiveQuestions) {
            const ans = (answers as UserAnswer[]).find(a => a.questionId === dq.id)
            if (ans?.discursiveSelfScore !== undefined) {
              discAvgPct += ans.discursiveSelfScore / 100
              scored++
            }
          }
          if (scored > 0) {
            totalWeightedScore += discWeight * (discAvgPct / scored)
          }
        }

        score = Math.round(totalWeightedScore * totalPoints * 100) / 100
      }
    }

    // Se tem questões que precisam de correção externa, marcar como pendente
    if (needsCorrection) {
      correctionStatus = 'pending'
    }

    /*
     * O rascunho é a fonte do que não veio do formulário.
     *
     * `startedAt` sai dele, e não do corpo da requisição: o cliente mandava o
     * horário lido do próprio `localStorage`, que é do aluno — ele podia
     * reescrever o início da prova e, com ele, a duração registrada. O rascunho
     * grava o início na primeira vez e nunca o reescreve, nem numa retomada.
     */
    const progresso = await db
      .collection(COLECAO_DE_PROGRESSO)
      .findOne({ examId: id, userId: session.userId })

    const inicioDoCliente = startedAt ? new Date(startedAt) : undefined
    const inicioConfiavel = progresso?.startedAt
      ? new Date(progresso.startedAt)
      : inicioDoCliente && Number.isFinite(inicioDoCliente.getTime())
        ? inicioDoCliente
        : undefined

    /*
     * A assinatura exigida é exigida também aqui.
     *
     * `requireSignature` era uma decisão do painel que só existia no desenho da
     * tela — e mal: o campo aparecia apenas na sala de espera, que só quem
     * chega adiantado vê. Quem entrava com a prova em andamento nunca assinava,
     * e uma prova "com assinatura obrigatória" acumulava entregas sem nenhuma.
     * A tela foi consertada; esta checagem é o que faz a exigência valer
     * também para quem entrega por fora dela.
     *
     * O rascunho é consultado antes de recusar: a assinatura é gravada nele na
     * primeira vez em que existe, e quem recarregou a página no meio da prova
     * pode chegar aqui sem ela em mãos. Recusar uma prova respondida por causa
     * de uma imagem que o servidor já tem guardada seria trocar um defeito de
     * exigência por um bem pior.
     */
    const assinaturaValida = (valor: unknown): valor is string =>
      typeof valor === 'string' && valor.startsWith('data:image/')

    const assinaturaDaEntrega = assinaturaValida(signature)
      ? signature
      : assinaturaValida(progresso?.signature)
        ? (progresso!.signature as string)
        : undefined

    if (exam.requireSignature && !assinaturaDaEntrega) {
      return NextResponse.json(
        { error: 'Esta prova exige assinatura digital. Assine no campo de assinatura antes de entregar.' },
        { status: 400 }
      )
    }

    const submission: ExamSubmission = {
      examId: id,
      userId: session.userId,
      userName,
      themeTranscription,
      answers,
      signature: assinaturaDaEntrega ?? signature,
      score,
      corrections: needsCorrection ? [] : undefined,
      correctionStatus,
      startedAt: inicioConfiavel,
      // A ordem em que ESTE aluno viu as questões, para o relatório numerar
      // como ele viu. Ver lib/provas/embaralhar.ts.
      questionOrder: Array.isArray(body.questionOrder) && body.questionOrder.length > 0
        ? body.questionOrder.map((qid: unknown) => String(qid))
        : progresso?.questionOrder,
      resumesUsed: progresso?.resumesUsed || 0,
      submittedFromSavedProgress: body.fromSavedProgress === true ? true : undefined,
      submittedAt: new Date(),
    }

    const result = await submissionsCollection.insertOne(submission)

    // O rascunho existia para sobreviver à queda. Entregue a prova, ele não tem
    // mais o que guardar — e deixá-lo para trás faria a tela oferecer "continuar
    // de onde parou" numa prova que já foi entregue.
    await db
      .collection(COLECAO_DE_PROGRESSO)
      .deleteOne({ examId: id, userId: session.userId })
      .catch(() => {})

    // Se tem questões com correção automática (discursivas ou redações), corrigir agora
    if (needsCorrection) {
      const shouldAutoCorrectDiscursive = hasDiscursiveQuestions && exam.discursiveCorrectionMethod === 'ai'
      const hasAutoCorrectEssay = hasEssayQuestions && exam.questions.some(q => q.type === 'essay' && q.essayCorrectionMethod === 'ai')

      if (shouldAutoCorrectDiscursive || hasAutoCorrectEssay) {
        try {
          const corrections: any[] = []

          // Corrigir questões discursivas
          if (shouldAutoCorrectDiscursive) {
            const { correctWithGemini } = await import('@/lib/gemini-corrector')

            for (const question of exam.questions.filter(q => q.type === 'discursive')) {
              const answer = answers.find((a: any) => a.questionId === question.id)
              if (answer && answer.discursiveText) {
                try {
                  const result = await correctWithGemini(
                    question,
                    answer.discursiveText,
                    exam.aiRigor || 0.45
                  )

                  corrections.push({
                    questionId: question.id,
                    score: result.score,
                    maxScore: result.maxScore,
                    feedback: result.feedback,
                    method: 'ai',
                    correctedAt: new Date(),
                    keyPointsFound: result.keyPointsFound,
                  })
                } catch (error) {
                  console.error(`Erro ao corrigir questão discursiva ${question.number}:`, error)
                }
              }
            }
          }

          // Corrigir redações com IA
          if (hasAutoCorrectEssay) {
            const { correctEssayWithGemini } = await import('@/lib/essay-corrector')

            for (const question of exam.questions.filter(q => q.type === 'essay' && q.essayCorrectionMethod === 'ai')) {
              const answer = answers.find((a: any) => a.questionId === question.id)
              if (answer && answer.essayText) {
                try {
                  const result = await correctEssayWithGemini(
                    question,
                    answer.essayText,
                    question.essayAiRigor || 0.45
                  )

                  corrections.push({
                    questionId: question.id,
                    score: result.score,
                    maxScore: result.maxScore,
                    feedback: result.generalFeedback,
                    method: 'ai',
                    correctedAt: new Date(),
                    essayCompetences: result.competences,
                    essayGeneralFeedback: result.generalFeedback,
                  })
                } catch (error) {
                  console.error(`Erro ao corrigir redação ${question.number}:`, error)
                }
              }
            }
          }

          // Atualizar submissão com correções
          if (corrections.length > 0) {
            const discursiveScore = corrections.reduce((sum, c) => sum + c.score, 0)

            // Verificar se TODAS as questões que precisam de correção foram corrigidas
            const totalQuestionsNeedingCorrection = exam.questions.filter(
              q => q.type === 'discursive' || (q.type === 'essay' && q.essayCorrectionMethod === 'ai')
            ).length

            const newCorrectionStatus = corrections.length === totalQuestionsNeedingCorrection ? 'corrected' : 'pending'

            // Calcular nota final combinando todos os tipos de questões
            let finalScore: number | undefined

            if (exam.scoringMethod === 'normal') {
              // Calcular percentual de cada tipo de questão
              const percentages: number[] = []
              const questionCounts: number[] = []

              // Múltipla escolha
              if (multipleChoiceQuestions.length > 0) {
                percentages.push(multipleChoicePercentage)
                questionCounts.push(multipleChoiceQuestions.length)
              }

              // Discursivas e redações - calcular percentual de cada uma
              for (const correction of corrections) {
                const question = exam.questions.find(q => q.id === correction.questionId)
                if (question) {
                  const percentage = (correction.score / correction.maxScore) * 100
                  percentages.push(percentage)
                  questionCounts.push(1)
                }
              }

              // Média ponderada: cada questão tem peso igual
              const totalQuestions = questionCounts.reduce((sum, count) => sum + count, 0)
              if (totalQuestions > 0) {
                const weightedSum = percentages.reduce((sum, percentage, idx) => {
                  return sum + (percentage * questionCounts[idx])
                }, 0)

                // Percentual final de 0-100
                const finalPercentage = weightedSum / totalQuestions

                // Converter para pontuação total da prova
                const totalPoints = exam.totalPoints || 100
                finalScore = (finalPercentage / 100) * totalPoints
                finalScore = Math.round(finalScore * 100) / 100 // 2 casas decimais
              }
            }

            await submissionsCollection.updateOne(
              { _id: result.insertedId },
              {
                $set: {
                  corrections,
                  discursiveScore,
                  correctionStatus: newCorrectionStatus,
                  score: finalScore,
                },
              }
            )

            return NextResponse.json({
              success: true,
              message: 'Prova submetida e corrigida automaticamente!',
              score: finalScore,
              submissionId: result.insertedId.toString(),
            })
          }
        } catch (error) {
          console.error('Erro na correção automática:', error)
          // Se falhar, continua com status pending
        }
      }
    }

    // Se tem questões que precisam de correção externa (ai/manual), avisa
    if (needsCorrection) {
      const messageType = discursiveNeedsCorrection && hasEssayQuestions
        ? 'As questões discursivas e redações'
        : hasEssayQuestions
        ? 'A redação'
        : 'As questões discursivas'

      return NextResponse.json({
        success: true,
        message: `Prova submetida! ${messageType} serão corrigidas em breve. Você será notificado quando a correção estiver pronta.`,
        submissionId: result.insertedId.toString(),
      })
    }

    // Se for método normal, retorna a pontuação calculada
    if (exam.scoringMethod === 'normal') {
      return NextResponse.json({
        success: true,
        score,
        submissionId: result.insertedId.toString(),
      })
    }

    // Se for TRI, apenas confirma submissão
    return NextResponse.json({
      success: true,
      message: 'Prova submetida! A pontuação TRI será calculada após o término.',
      submissionId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('Submit exam error:', error)
    return NextResponse.json(
      { error: 'Erro ao submeter prova' },
      { status: 500 }
    )
  }
}
