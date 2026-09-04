import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'
import { Exam } from '@/lib/types'
import { ObjectId } from 'mongodb'
// Fora do arquivo de rota de propósito: o Next 14 valida os exports de um
// `route.ts` contra a lista de campos de rota que ele conhece, e qualquer
// export extra — uma função auxiliar, um tipo — quebra o `next build`.
import { tituloDaCopia } from '@/lib/provas/duplicar-prova'

export const dynamic = 'force-dynamic'

/**
 * POST — duplicar uma prova com as mesmas configurações.
 *
 * ## O que a cópia leva, e o que ela não leva
 *
 * Leva **a prova**: questões, alternativas, gabarito, pontuação, datas,
 * portões, proctoring, embaralhamento, público-alvo, liberações de download,
 * assinatura, tempo por questão. É isto que "com as mesmas configurações"
 * quer dizer — a intenção de quem duplica é reaplicar a prova, não remontá-la.
 *
 * Não leva **nada de aluno**: entregas, rascunhos, tentativas e anotações
 * pertencem à aplicação que aconteceu, não à prova. Uma cópia nasce sem
 * histórico, como uma prova nova.
 *
 * ## Por que a cópia nasce oculta
 *
 * `isHidden: true`, sempre, mesmo copiando uma prova visível. Duplicar é o
 * primeiro passo de "aplicar de novo com outra data" — e uma cópia que aparece
 * no catálogo do aluno no instante do clique é uma segunda prova, idêntica e
 * com as datas antigas, disponível para a turma inteira antes de o admin ter
 * mexido em uma linha. O botão "Tornar Visível" está a um clique dali.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const examsCollection = db.collection<Exam>('exams')

    const original = await examsCollection.findOne({ _id: new ObjectId(id) })
    if (!original) {
      return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })
    }

    // Os títulos que já existem, para a numeração do prefixo não repetir.
    const irmas = await examsCollection
      .find({ title: { $regex: '^Cópia( \\d+)? de ', $options: 'i' } }, { projection: { title: 1 } })
      .toArray()

    const {
      _id: _idOriginal,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      createdBy: _createdBy,
      // A ordem dentro do grupo é do documento original; herdá-la colocaria
      // duas provas na mesma posição. A cópia entra no fim (sem o campo).
      orderInGroup: _orderInGroup,
      title,
      ...configuracoes
    } = original as Exam & Record<string, unknown>

    const agora = new Date()
    const copia = {
      ...configuracoes,
      title: tituloDaCopia(title, irmas.map((e) => e.title)),
      // O dono da cópia é quem a criou, não quem criou a original: é ele que
      // vai editá-la, e `createdBy` é o que a rota de edição usa para decidir.
      createdBy: session.userId,
      isHidden: true,
      createdAt: agora,
      updatedAt: agora,
    } as unknown as Exam

    const resultado = await examsCollection.insertOne(copia)

    return NextResponse.json({
      success: true,
      examId: resultado.insertedId.toString(),
      title: copia.title,
      message: `"${copia.title}" foi criada oculta. Revise as datas e torne-a visível quando quiser aplicá-la.`,
    })
  } catch (error) {
    console.error('Duplicate exam error:', error)
    return NextResponse.json({ error: 'Erro ao duplicar prova' }, { status: 500 })
  }
}
