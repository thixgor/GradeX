import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'
import { isValidObjectId } from '@/lib/api-security'
import { definirConclusaoManual } from '@/lib/aulas/repositorio-progresso'
import { motivoDoBloqueio, normalizarAvaliacao } from '@/lib/aulas/avaliacao'
import { liberadoParaConcluir } from '@/lib/aulas/avaliacao-servidor'

export const dynamic = 'force-dynamic'

/**
 * Conclusão marcada à mão pelo aluno.
 *
 * A rota é a mesma de antes (as telas atuais continuam chamando-a igual), mas
 * agora escreve nos dois lugares: no registro de progresso novo e no array
 * legado `usuariosConcluidos`, que várias telas ainda leem. Manter os dois em
 * dia é o que permite trocar as telas uma a uma, sem um dia de virada em que
 * tudo precisa mudar junto.
 *
 * A escrita dupla acontece dentro de `definirConclusaoManual`, para não existir
 * um caminho que atualize só uma das visões.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const concluida = (body as any)?.concluida === true

    const db = await getDb()
    const aula = await db.collection<AulaPostagem>('aulas_postagens').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { avaliacao: 1 } }
    )
    if (!aula) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
      )
    }

    /*
     * Avaliação obrigatória (§39).
     *
     * A checagem é aqui, e não na tela, porque a tela é só um botão: quem
     * chamasse a rota direto marcaria a aula como concluída sem fazer a prova,
     * e o certificado (§38) — que conta aulas concluídas — sairia por cima
     * disso. Um documento que a pessoa mostra a terceiros não pode ter a régua
     * no navegador.
     *
     * Só trava a marcação; DESMARCAR continua livre. Quem se enganou tem de
     * poder voltar atrás sem depender de suporte.
     */
    const avaliacao = normalizarAvaliacao((aula as any).avaliacao)
    if (concluida && !(await liberadoParaConcluir(db, session.userId, avaliacao))) {
      return NextResponse.json(
        { error: motivoDoBloqueio(avaliacao), avaliacao: { examId: avaliacao!.examId } },
        { status: 409 }
      )
    }

    const progresso = await definirConclusaoManual(db, session.userId, params.id, concluida)

    return NextResponse.json({ success: true, progresso })
  } catch (error) {
    console.error('Erro ao marcar conclusão:', error)
    return NextResponse.json(
      { error: 'Erro ao marcar conclusão' },
      { status: 500 }
    )
  }
}
