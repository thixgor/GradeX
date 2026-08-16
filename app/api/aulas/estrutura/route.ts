import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Reordenar e mover a estrutura do curso (§3, §4).
 *
 * Uma rota só, em lote, de propósito. Arrastar um item na tela muda a ordem de
 * VÁRIOS irmãos ao mesmo tempo: tirar a aula 5 e soltá-la na posição 2 renumera
 * tudo entre elas. Mandar uma requisição por item deixaria a lista visivelmente
 * "se acertando" aos poucos e, se uma falhasse no meio, a ordem ficaria
 * inconsistente — metade nova, metade antiga.
 *
 * O mesmo movimento também pode trocar o pai (mover aula entre módulos, módulo
 * entre seções), então cada item carrega o destino opcional. Trocar o pai e
 * reordenar são a mesma operação para quem arrasta; separá-las em duas rotas
 * obrigaria a UI a orquestrar as duas e a lidar com o estado entre elas.
 */

const COLECAO_POR_TIPO = {
  setor: 'aulas_setores',
  topico: 'aulas_topicos',
  subtopico: 'aulas_subtopicos',
  modulo: 'aulas_modulos',
  submodulo: 'aulas_submodulos',
  aula: 'aulas_postagens',
} as const

type TipoDeNo = keyof typeof COLECAO_POR_TIPO

/**
 * Campos de vínculo que cada tipo aceita.
 *
 * Existe para o `pai` do movimento não conseguir escrever um campo que aquele
 * tipo não tem — um submódulo com `setorId` solto viraria um nó órfão que a
 * árvore não sabe desenhar.
 */
const PAIS_VALIDOS: Record<TipoDeNo, string[]> = {
  setor: [],
  topico: ['setorId'],
  subtopico: ['setorId', 'topicoId'],
  modulo: ['setorId', 'topicoId', 'subtopicoId'],
  submodulo: ['moduloId'],
  aula: ['setorId', 'topicoId', 'subtopicoId', 'moduloId', 'submoduloId'],
}

const MovimentoSchema = z.object({
  tipo: z.enum(['setor', 'topico', 'subtopico', 'modulo', 'submodulo', 'aula']),
  id: z.string().min(1),
  ordem: z.number().int().min(0).max(100_000),
  pai: z.record(z.string().nullable()).optional(),
})

const Schema = z.object({
  movimentos: z.array(MovimentoSchema).min(1).max(500),
})

export async function PATCH(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const agora = new Date()

    // Agrupa por coleção para mandar um bulkWrite por tipo, em vez de uma
    // escrita por item.
    const porColecao = new Map<string, any[]>()

    for (const movimento of parsed.data.movimentos) {
      if (!isValidObjectId(movimento.id)) continue

      const colecao = COLECAO_POR_TIPO[movimento.tipo as TipoDeNo]
      const permitidos = PAIS_VALIDOS[movimento.tipo as TipoDeNo]

      const set: Record<string, any> = { ordem: movimento.ordem, atualizadoEm: agora }
      const unset: Record<string, any> = {}

      for (const [campo, valor] of Object.entries(movimento.pai || {})) {
        if (!permitidos.includes(campo)) continue
        // `null` limpa o vínculo — é como um módulo sai de um subtópico e passa
        // a pendurar direto no tópico.
        if (valor === null || valor === '') unset[campo] = 1
        else if (isValidObjectId(valor)) set[campo] = valor
      }

      const update: Record<string, any> = { $set: set }
      if (Object.keys(unset).length > 0) update.$unset = unset

      const lista = porColecao.get(colecao) || []
      lista.push({
        updateOne: { filter: { _id: new ObjectId(movimento.id) }, update },
      })
      porColecao.set(colecao, lista)
    }

    let aplicados = 0
    for (const [colecao, operacoes] of porColecao) {
      if (operacoes.length === 0) continue
      // `ordered: false` deixa o resto passar se um item sumiu no meio do
      // caminho (alguém apagou em outra aba) — uma linha perdida não deve
      // desfazer a reorganização inteira.
      const resultado = await db.collection(colecao).bulkWrite(operacoes, { ordered: false })
      aplicados += resultado.modifiedCount || 0
    }

    return NextResponse.json({ success: true, aplicados })
  } catch (error) {
    console.error('[aulas/estrutura] erro ao reordenar:', error)
    return NextResponse.json({ error: 'Erro ao salvar a nova ordem' }, { status: 500 })
  }
}
