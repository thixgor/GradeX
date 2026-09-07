import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { provaExisteParaPessoa } from '@/lib/provas/visibilidade-da-prova'
import { lerPeriodoDoAluno } from '@/lib/provas/periodo-do-aluno'
import { registrarEntrada, registrarFolhaDePresenca } from '@/lib/provas/entrada-na-prova'
import { resolverJanelaDaProva } from '@/lib/provas/janela-da-prova'

export const dynamic = 'force-dynamic'

/**
 * POST — passar pelo portão.
 *
 * A tela da prova chama isto ao abrir. Quem chega com o portão aberto fica
 * registrado como "dentro", e o registro é o que faz o botão "Iniciar Prova"
 * destravar às 14h numa prova cujo portão fechou às 13h50 — o caso que antes
 * travava a sala de espera inteira. Ver `lib/provas/entrada-na-prova.ts`.
 *
 * O cliente pede; quem decide é o relógio do servidor. Chamar esta rota com o
 * portão fechado não abre porta nenhuma: devolve 403 com o motivo.
 */
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
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()
    const exam = await db.collection<Exam>('exams').findOne({ _id: new ObjectId(id) })
    if (!exam) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const isAdmin = session.role === 'admin'

    // As mesmas portas da rota da prova: uma prova oculta ou aplicada a outro
    // período não existe para quem não foi convocado, e o portão dela também
    // não. Sem isto, esta rota seria um jeito de descobrir que a prova existe.
    if (!isAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    const resultado = await registrarEntrada(db, exam, id, session.userId)

    if (!resultado.dentro) {
      return NextResponse.json(
        {
          error: resultado.motivo || 'Os portões desta prova estão fechados.',
          janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou: false }),
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      dentro: true,
      registrouAgora: resultado.registrouAgora,
      janela: resolverJanelaDaProva(exam, new Date(), { jaEntrou: true }),
    })
  } catch (error) {
    console.error('Registrar entrada error:', error)
    return NextResponse.json({ error: 'Erro ao entrar na prova' }, { status: 500 })
  }
}

/**
 * PATCH — a folha de presença da sala de espera.
 *
 * ## O buraco que isto fecha
 *
 * Nome e assinatura são pedidos na sala de espera, que por definição acontece
 * ANTES do início. O único lugar onde eles eram gravados era o rascunho da
 * prova (`PUT /api/exams/[id]/progress`), e essa rota recusa qualquer envio
 * com a janela fechada — corretamente, porque gravar rascunho antes da hora
 * seria responder antes da hora. Resultado: quem assinava às 13h20 só
 * aparecia como assinado depois de a prova começar, e o painel do admin, que
 * existe para conferir a presença ENQUANTO a sala enche, não tinha o que
 * mostrar.
 *
 * A folha vai para o registro de entrada (ver
 * `lib/provas/entrada-na-prova.ts`), que já é o fato "esta pessoa está na
 * sala".
 *
 * Quem decide continua sendo o servidor: a mesma passagem pelo portão do POST
 * é reavaliada aqui, então uma chamada com o portão fechado — de quem nunca
 * entrou — não vira presença. E nada disso é a prova em si: a rota não aceita
 * nem grava resposta nenhuma.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const isAdmin = session.role === 'admin'
    if (!isAdmin) {
      const periodo = await lerPeriodoDoAluno(db, session.userId)
      if (!provaExisteParaPessoa(exam, { userId: session.userId, isAdmin, periodo })) {
        return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
      }
    }

    // Prova de treino e prova pessoal não têm portão, logo não têm sala de
    // espera nem folha de presença — e não geram registro de entrada para
    // atualizar. Responder 204 evita que a tela do aluno fique tentando.
    const janela = resolverJanelaDaProva(exam, new Date(), { jaEntrou: false })
    if (janela.fase === 'livre' || janela.encerrada) {
      return new NextResponse(null, { status: 204 })
    }

    const entrada = await registrarEntrada(db, exam, id, session.userId)
    if (!entrada.dentro) {
      return NextResponse.json(
        { error: entrada.motivo || 'Os portões desta prova estão fechados.' },
        { status: 403 },
      )
    }

    const body = await request.json().catch(() => ({}))
    const resultado = await registrarFolhaDePresenca(db, id, session.userId, {
      nome: typeof body?.nome === 'string' ? body.nome : undefined,
      assinatura: typeof body?.assinatura === 'string' ? body.assinatura : undefined,
      transcricao: typeof body?.transcricao === 'string' ? body.transcricao : undefined,
    })

    return NextResponse.json({ gravou: resultado.gravou, assinou: resultado.assinou })
  } catch (error) {
    console.error('Registrar folha de presença error:', error)
    return NextResponse.json({ error: 'Erro ao registrar presença' }, { status: 500 })
  }
}
