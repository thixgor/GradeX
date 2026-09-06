import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { colecaoDeProvas } from '@/lib/provas/colecoes'
import { ObjectId } from 'mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { filtroDoEscopo, sequenciaFinal } from '@/lib/provas/ordem-das-provas'

export const dynamic = 'force-dynamic'

/** Teto por chamada: uma lista bem maior que isso não é uma lista, é um catálogo. */
const MAXIMO_POR_LEVA = 300

/**
 * Definir a ordem das provas de uma lista. Só admin.
 *
 * ## Por que a sequência inteira, e não "troque estas duas"
 *
 * As duas rotas que existiam antes (`PATCH /api/exams/[id]` com `direction`, e
 * uma cópia quase idêntica em `/api/exams/[id]/reorder`, que ninguém chamava)
 * recebiam "sobe" ou "desce" e descobriam no servidor quem era o vizinho. Isso
 * obriga cliente e servidor a concordarem sobre a lista — e eles discordam
 * fácil: basta a tela ter um filtro ligado, ou uma prova ter sido criada entre
 * o desenho e o clique, e a prova troca de lugar com alguém que a pessoa não
 * está vendo. O clique some, e ninguém consegue explicar por quê.
 *
 * Aqui o cliente manda a sequência que ele quer ver. Não há vizinho a
 * adivinhar, a chamada é idempotente (mandar duas vezes é igual a mandar uma)
 * e o mesmo formato serve tanto para uma casa quanto para um arrastar futuro.
 *
 * ## Quem não veio na lista não fica sem posição
 *
 * Exigir que a sequência cubra a lista inteira transformaria uma corrida banal
 * — alguém publica uma prova enquanto o admin arruma a página — num 400 sem
 * explicação. Em vez disso, as provas do escopo que não vieram na sequência
 * são acomodadas DEPOIS das que vieram, na ordem padrão. O resultado é sempre
 * uma lista inteira com posições distintas, e a prova nova aparece no fim, que
 * é onde dá para vê-la e movê-la.
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    // A ordem do catálogo é decisão editorial da plataforma, não de quem
    // criou a prova: por isso admin, e não "dono do grupo".
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const groupId = body?.groupId ? String(body.groupId) : null
    const brutos: unknown[] = Array.isArray(body?.ids) ? body.ids : []

    const ids = Array.from(
      new Set(brutos.map((i) => String(i)).filter(isValidObjectId)),
    ).slice(0, MAXIMO_POR_LEVA)

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Nenhuma prova válida informada' }, { status: 400 })
    }
    if (groupId && !isValidObjectId(groupId)) {
      return NextResponse.json({ error: 'Grupo inválido' }, { status: 400 })
    }

    const examsCollection = await colecaoDeProvas()

    /*
     * Todo o escopo, e não só os ids recebidos: as ausentes precisam de
     * posição também, senão a lista fica metade arrumada e metade não —
     * e a próxima ordenação mistura as duas metades.
     */
    const doEscopo = await examsCollection
      .find(filtroDoEscopo(groupId) as any)
      .project({ _id: 1, groupId: 1, orderInGroup: 1, createdAt: 1, isPersonalExam: 1 })
      .toArray()

    const conhecidos = new Set(doEscopo.map((p) => p._id!.toString()))
    const forasteiros = ids.filter((id) => !conhecidos.has(id))
    if (forasteiros.length > 0) {
      // Erro de cliente de verdade (pediu para ordenar prova de outra lista),
      // e não a corrida benigna tratada acima.
      return NextResponse.json(
        { error: 'Há provas que não pertencem a esta lista', ids: forasteiros },
        { status: 400 },
      )
    }

    const sequencia = sequenciaFinal(doEscopo as any, ids)

    /*
     * Só quem realmente mudou de lugar.
     *
     * Mover uma prova uma casa muda a posição de duas; gravar a sequência
     * inteira faria disso uma escrita por prova da lista — e a lista das
     * provas sem grupo pode ter centenas. A rota antiga fazia pior: um
     * `updateOne` sequencial, com `await` dentro de um laço, para normalizar
     * o grupo todo antes de trocar o par.
     */
    const posicaoAtual = new Map(
      doEscopo.map((prova) => [prova._id!.toString(), (prova as any).orderInGroup]),
    )
    const escritas = sequencia
      .map((id, indice) => ({ id, indice }))
      .filter(({ id, indice }) => posicaoAtual.get(id) !== indice)
      .map(({ id, indice }) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { orderInGroup: indice } },
        },
      }))

    if (escritas.length > 0) await examsCollection.bulkWrite(escritas as any)

    return NextResponse.json({ ordem: sequencia, atualizadas: escritas.length })
  } catch (error) {
    console.error('Erro ao ordenar provas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
