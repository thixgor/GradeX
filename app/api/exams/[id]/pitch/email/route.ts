import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { totalStudents } from '@/lib/comms/persuasion'
import { deliverTransactionalEmails, sendPitchDeVendasEmail } from '@/lib/mail'
import { notaLiberadaParaOAluno } from '@/lib/provas/nota-da-prova'
import {
  arredondarProvaSocial,
  montarPitch,
  pitchDaProva,
  pitchVisivelPara,
} from '@/lib/provas/pitch-de-vendas'
import type { Exam, ExamSubmission } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * Manda a prévia do pitch por e-mail, uma vez só.
 *
 * ## Por que é uma rota à parte, e não um pedaço da entrega
 *
 * O caminho óbvio seria enviar dentro de `POST /submit`, logo depois de
 * gravar a submissão. Duas coisas desaconselham: a entrega é a requisição
 * mais sensível a atraso da prova inteira (ela acontece no segundo do
 * término, às vezes com a turma toda junta), e o SMTP da casa é lento o
 * bastante para ter timeouts explícitos configurados. Pendurar um envio de
 * marketing ali é cobrar do aluno que entrega o preço de um anúncio.
 *
 * Aqui o envio acontece DEPOIS que a tela de fim de prova já está desenhada:
 * o cartão do pitch pede, sem esperar resposta, e a pessoa nem sabe que
 * houve requisição.
 *
 * ## A trava de envio único
 *
 * `pitchEmailEnviadoEm` é gravado na própria entrega, com `$exists: false`
 * na condição: quem ganha a corrida grava e envia; qualquer segunda chamada
 * — recarregar a tela, voltar no histórico, o efeito duplo do modo estrito do
 * React, dois cliques — encontra `modifiedCount: 0` e sai calada.
 *
 * A marca é gravada ANTES do envio, e de propósito. Errar para o lado de "não
 * mandou" é uma oferta perdida; errar para o lado de "mandou três vezes" é
 * uma denúncia de spam, e essa não se desfaz.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()
    const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const config = pitchDaProva(exam)
    if (!config.email.ativo) {
      return NextResponse.json({ enviado: false, motivo: 'e-mail desligado nesta prova' })
    }

    const isAdmin = session.role === 'admin'
    // `ObjectId.isValid` antes do construtor: a sessão de desenvolvimento não
    // usa id do Mongo, e um erro aqui viraria 500 num envio que ninguém pediu.
    const usuario = ObjectId.isValid(session.userId)
      ? await db
          .collection('users')
          .findOne(
            { _id: new ObjectId(session.userId) },
            { projection: { name: 1, email: 1, accountType: 1 } },
          )
      : null

    const destinatario = String(usuario?.email || session.email || '').trim()
    if (!destinatario) {
      return NextResponse.json({ enviado: false, motivo: 'conta sem e-mail' })
    }

    const accountType = (usuario?.accountType as string | undefined) ?? null
    if (!pitchVisivelPara(exam, { accountType, isAdmin })) {
      return NextResponse.json({ enviado: false, motivo: 'pitch não se aplica a esta conta' })
    }

    /*
     * O e-mail é do fim da prova, então ele exige uma entrega.
     *
     * Sem esta condição a rota vira um disparador aberto: qualquer conta
     * autenticada chamaria o endereço de qualquer prova e mandaria e-mail para
     * si mesma quantas vezes quisesse. Com ela, o envio é consequência de um
     * fato gravado — esta pessoa entregou esta prova — e a marca de envio único
     * mora nesse mesmo fato.
     */
    const submissions = db.collection<ExamSubmission>('submissions')
    const marcado = await submissions.updateOne(
      { examId: id, userId: session.userId, pitchEmailEnviadoEm: { $exists: false } },
      { $set: { pitchEmailEnviadoEm: new Date() } },
    )

    if (marcado.matchedCount === 0) {
      // Ou não há entrega (nada a anunciar), ou o e-mail já saiu. As duas
      // respostas são a mesma para quem chamou: não sai nada agora.
      return NextResponse.json({ enviado: false, motivo: 'sem entrega nova para anunciar' })
    }

    const entrega = await submissions.findOne({ examId: id, userId: session.userId })
    const total = exam.totalPoints || 100
    const aproveitamento =
      entrega &&
      typeof entrega.score === 'number' &&
      total > 0 &&
      notaLiberadaParaOAluno(exam, { userId: session.userId, isAdmin, jaSubmeteu: true })
        ? Math.max(0, Math.min(100, (entrega.score / total) * 100))
        : null

    const nome = String(usuario?.name || session.name || '').trim()
    const pitch = montarPitch(config, {
      primeiroNome: nome.split(/\s+/)[0] || 'estudante',
      tituloDaProva: exam.title,
      aproveitamento,
      estudantes: arredondarProvaSocial(await totalStudents().catch(() => 0)),
    })

    if (!pitch || pitch.destinos.length === 0) {
      return NextResponse.json({ enviado: false, motivo: 'pitch incompleto' })
    }

    // Esperado antes de responder: em serverless não existe "depois" — a
    // instância congela com a resposta. Ver `deliverTransactionalEmails`.
    await deliverTransactionalEmails([
      sendPitchDeVendasEmail({
        email: destinatario,
        assunto: pitch.email.assunto,
        titulo: pitch.titulo,
        paragrafos: pitch.email.paragrafos,
        chamada: pitch.chamada,
        destino: pitch.destinos[0].href,
        tituloDaProva: exam.title,
      }),
    ])

    return NextResponse.json({ enviado: true })
  } catch (error) {
    console.error('[pitch] falha ao enviar o e-mail do pitch:', error)
    return NextResponse.json({ error: 'Erro ao enviar o e-mail' }, { status: 500 })
  }
}
