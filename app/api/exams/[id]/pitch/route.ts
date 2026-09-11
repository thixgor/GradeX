import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { totalStudents } from '@/lib/comms/persuasion'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { notaLiberadaParaOAluno } from '@/lib/provas/nota-da-prova'
import { provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'
import {
  arredondarProvaSocial,
  montarPitch,
  normalizarPitch,
  pitchDaProva,
  pitchVisivelPara,
  type PitchMontado,
} from '@/lib/provas/pitch-de-vendas'
import type { Exam, ExamSubmission } from '@/lib/types'

export const dynamic = 'force-dynamic'

/**
 * O pitch de vendas desta prova, já escrito para quem está pedindo.
 *
 * ## Por que o texto é montado aqui, e não na tela
 *
 * Duas das coisas que o pitch diz são fatos do banco: quantas contas existem
 * (prova social) e quanto a pessoa acertou. O primeiro o navegador não tem, e
 * o segundo ele não pode ter antes da hora — a nota de uma prova avaliativa
 * espera o término (`lib/provas/nota-da-prova.ts`), e mandá-la para cá só
 * porque seria conveniente para um anúncio seria abrir pela porta do
 * marketing exatamente o que o resto do sistema fecha.
 *
 * Então o servidor decide o que é verdade, escreve o texto e manda pronto. A
 * tela renderiza. Quando a nota está presa, o modelo "Lógica" cai sozinho
 * para a versão sem número — ver `MODELOS_DE_PITCH`.
 *
 * ## Os dois métodos
 *
 * `GET` é o do aluno: devolve o pitch que ELE vê, ou `{ pitch: null }` quando
 * não há pitch para esta pessoa (desligado, incompleto, ou ela já assina).
 * Nunca devolve erro por isso — "não há oferta para você" é uma resposta, não
 * uma falha, e a tela não deve ter que interpretar um 404 para saber disso.
 *
 * `POST` é a prévia do admin: ele manda o rascunho que está editando e recebe
 * o texto que aquele rascunho produziria, com os mesmos números reais. É o que
 * permite ver o pitch antes de ligá-lo para a turma.
 */

async function carregarProva(id: string): Promise<{ db: Awaited<ReturnType<typeof getDb>>; exam: Exam } | null> {
  if (!ObjectId.isValid(id)) return null
  const db = await getDb()
  const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
  if (!exam) return null
  return { db, exam }
}

interface DadosDeQuem {
  primeiroNome: string
  accountType: string | null
  aproveitamento: number | null
}

/** O aproveitamento em porcentagem, só quando a nota já é desta pessoa. */
function aproveitamentoDaEntrega(
  exam: Exam,
  entrega: ExamSubmission | null,
  contexto: { userId: string; isAdmin: boolean },
): number | null {
  if (!entrega) return null
  if (!notaLiberadaParaOAluno(exam, { ...contexto, jaSubmeteu: true })) return null

  const total = exam.totalPoints || 100
  if (typeof entrega.score !== 'number' || total <= 0) return null
  return Math.max(0, Math.min(100, (entrega.score / total) * 100))
}

async function lerQuem(
  db: Awaited<ReturnType<typeof getDb>>,
  exam: Exam,
  session: { userId: string; name?: string; role?: string },
): Promise<DadosDeQuem> {
  const isAdmin = session.role === 'admin'
  const [usuario, entrega] = await Promise.all([
    // O id da sessão passa por `ObjectId.isValid` porque ele nem sempre é um
    // id do Mongo: a sessão de desenvolvimento (`lib/dev-auth.ts`) inventa uma,
    // e um construtor que estoura aqui derrubaria a tela de fim de prova
    // inteira por causa de um cartão de anúncio.
    ObjectId.isValid(session.userId)
      ? db
          .collection('users')
          .findOne(
            { _id: new ObjectId(session.userId) },
            { projection: { name: 1, accountType: 1 } },
          )
      : null,
    db
      .collection<ExamSubmission>('submissions')
      .findOne({ examId: exam._id!.toString(), userId: session.userId }),
  ])

  const nome = String(usuario?.name || session.name || '').trim()
  return {
    primeiroNome: nome.split(/\s+/)[0] || 'estudante',
    accountType: (usuario?.accountType as string | undefined) ?? null,
    aproveitamento: aproveitamentoDaEntrega(exam, entrega, { userId: session.userId, isAdmin }),
  }
}

async function escrever(exam: Exam, pitchBruto: unknown, quem: DadosDeQuem): Promise<PitchMontado | null> {
  return montarPitch(normalizarPitch(pitchBruto), {
    primeiroNome: quem.primeiroNome,
    tituloDaProva: exam.title,
    aproveitamento: quem.aproveitamento,
    // O número real, arredondado para baixo. Se a contagem falhar, a frase da
    // prova social simplesmente não é escrita — melhor calar do que estimar.
    estudantes: arredondarProvaSocial(await totalStudents().catch(() => 0)),
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const carregada = await carregarProva(id)
    if (!carregada) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }
    const { db, exam } = carregada

    // A mesma porta do resto da prova: quem não tem a prova não tem o pitch
    // dela. Ver `lib/provas/visibilidade-da-prova.ts`.
    const isAdmin = session.role === 'admin'
    if (!isAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    const quem = await lerQuem(db, exam, session)

    if (!pitchVisivelPara(exam, { accountType: quem.accountType, isAdmin })) {
      return NextResponse.json({ pitch: null })
    }

    const pitch = await escrever(exam, (exam as any).pitchDeVendas, quem)
    const config = pitchDaProva(exam)

    return NextResponse.json({
      pitch,
      // A tela só dispara o e-mail quando ele existe — e o servidor confere de
      // novo na rota de envio; isto aqui poupa uma requisição, não é a trava.
      email: pitch && config.email.ativo,
    })
  } catch (error) {
    console.error('[pitch] falha ao montar o pitch da prova:', error)
    return NextResponse.json({ error: 'Erro ao montar o pitch' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const carregada = await carregarProva(id)
    if (!carregada) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }
    const { db, exam } = carregada

    const body = await request.json().catch(() => ({}))
    const quem = await lerQuem(db, exam, session)

    /*
     * A prévia ignora `esconderDeAssinantes`.
     *
     * O admin é conta paga (`isPaidAccount` passa admin como pagante), então
     * pedir a prévia pela regra do aluno devolveria sempre nada — e a tela de
     * configuração mostraria um quadro vazio para um pitch perfeitamente
     * configurado. Quem decide se a prévia aparece é o conteúdo, não a conta
     * de quem está olhando.
     */
    return NextResponse.json({ pitch: await escrever(exam, body?.pitchDeVendas, quem) })
  } catch (error) {
    console.error('[pitch] falha ao montar a prévia do pitch:', error)
    return NextResponse.json({ error: 'Erro ao montar a prévia' }, { status: 500 })
  }
}
