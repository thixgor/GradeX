import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { AulaPostagem } from '@/lib/types'
import { isValidObjectId } from '@/lib/api-security'
import { definirConclusaoManual } from '@/lib/aulas/repositorio-progresso'

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
    const existe = await db.collection<AulaPostagem>('aulas_postagens').countDocuments(
      { _id: new ObjectId(params.id) },
      { limit: 1 }
    )
    if (existe === 0) {
      return NextResponse.json(
        { error: 'Aula não encontrada' },
        { status: 404 }
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
