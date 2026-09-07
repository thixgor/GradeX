import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import type { ExamSubmission } from '@/lib/types'
import { COLECAO_DE_ENTRADAS } from '@/lib/provas/entrada-na-prova'
import { COLECAO_DE_PROGRESSO } from '@/lib/provas/retomada'

export const dynamic = 'force-dynamic'

/**
 * A folha de presença de UMA pessoa — com a imagem da assinatura.
 *
 * ## Por que numa rota só dela
 *
 * A assinatura é uma imagem em base64: até 400 KB por aluno. Numa turma de 60,
 * mandá-la junto do retrato seria trocar 24 MB a cada volta do relógio para
 * exibir, quase sempre, o mesmo desenho — e o retrato é pedido de 15 em 15
 * segundos enquanto a prova acontece.
 *
 * Aqui ela é pedida uma vez, quando o admin abre aquela pessoa para conferir.
 * O retrato continua dizendo apenas SE existe assinatura (`assinou`), que é o
 * que a lista precisa mostrar.
 *
 * ## Três lugares, uma assinatura
 *
 * A mesma assinatura pode estar gravada em três documentos, e cada um cobre
 * uma etapa: a folha de presença da sala de espera (`exam_entries`), o
 * rascunho da prova em andamento (`exam_progress`) e a entrega
 * (`submissions`). A primeira é a que vale — é a do momento em que a pessoa
 * assinou — e as outras entram quando ela não existe, que é o caso de quem
 * assinou na tela de entrada com a prova já em andamento, sem passar pela sala.
 */

export interface FolhaDePresencaDoAluno {
  userId: string
  nome: string
  email: string
  nomeDeclarado: string | null
  entrouEm: string | null
  assinatura: string | null
  assinadoEm: string | null
  transcricaoDaFrase: string | null
  /** De onde veio a assinatura devolvida. */
  origem: 'sala-de-espera' | 'prova' | 'entrega' | null
}

function iso(valor: unknown): string | null {
  if (!valor) return null
  const data = valor instanceof Date ? valor : new Date(valor as string)
  return Number.isFinite(data.getTime()) ? data.toISOString() : null
}

function assinaturaValida(valor: unknown): string | null {
  return typeof valor === 'string' && valor.startsWith('data:image/') ? valor : null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const { id, userId } = await params
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    const db = await getDb()

    const [entrada, progresso, entrega, usuario] = await Promise.all([
      db
        .collection(COLECAO_DE_ENTRADAS)
        .findOne(
          { examId: id, userId },
          {
            projection: {
              _id: 0,
              entrouEm: 1,
              nomeDeclarado: 1,
              assinatura: 1,
              assinadoEm: 1,
              transcricaoDaFrase: 1,
            },
          },
        ),
      db
        .collection(COLECAO_DE_PROGRESSO)
        .findOne(
          { examId: id, userId },
          { projection: { _id: 0, userName: 1, signature: 1, themeTranscription: 1, startedAt: 1 } },
        ),
      db
        .collection<ExamSubmission>('submissions')
        .findOne(
          { examId: id, userId, 'answers.0': { $exists: true } } as any,
          { projection: { _id: 0, userName: 1, signature: 1, themeTranscription: 1, submittedAt: 1 } },
        ),
      ObjectId.isValid(userId)
        ? db
            .collection('users')
            .findOne({ _id: new ObjectId(userId) }, { projection: { name: 1, email: 1 } })
        : null,
    ])

    if (!entrada && !progresso && !entrega) {
      return NextResponse.json({ error: 'Esta pessoa não tem registro nesta prova.' }, { status: 404 })
    }

    const daSala = assinaturaValida((entrada as any)?.assinatura)
    const daProva = assinaturaValida((progresso as any)?.signature)
    const daEntrega = assinaturaValida((entrega as any)?.signature)

    const folha: FolhaDePresencaDoAluno = {
      userId,
      nome: (usuario as any)?.name || '',
      email: (usuario as any)?.email || '',
      nomeDeclarado:
        (entrada as any)?.nomeDeclarado ||
        (progresso as any)?.userName ||
        (entrega as any)?.userName ||
        null,
      entrouEm: iso((entrada as any)?.entrouEm),
      assinatura: daSala || daProva || daEntrega,
      assinadoEm: iso((entrada as any)?.assinadoEm) || iso((progresso as any)?.startedAt),
      transcricaoDaFrase:
        (entrada as any)?.transcricaoDaFrase ||
        (progresso as any)?.themeTranscription ||
        (entrega as any)?.themeTranscription ||
        null,
      origem: daSala ? 'sala-de-espera' : daProva ? 'prova' : daEntrega ? 'entrega' : null,
    }

    return NextResponse.json(folha, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Folha de presença error:', error)
    return NextResponse.json({ error: 'Erro ao carregar a folha de presença' }, { status: 500 })
  }
}
