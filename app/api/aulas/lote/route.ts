import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import type { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Ações em massa sobre aulas (§30).
 *
 * Com centenas de aulas, publicar uma turma inteira clicando uma a uma não é
 * administração — é digitação. Aqui a seleção da tela vira uma escrita só.
 *
 * A exclusão exige `confirmar: true` no corpo. Não é burocracia: é o único
 * ponto desta rota que destrói conteúdo, e um clique errado num checkbox de
 * "selecionar todas" apagaria um curso inteiro sem volta.
 */

const Schema = z.object({
  acao: z.enum(['publicar', 'ocultar', 'agendar', 'mover', 'excluir']),
  ids: z.array(z.string()).min(1).max(500),
  /** Para `agendar`. */
  dataLiberacao: z.string().optional(),
  ocultarAteLiberacao: z.boolean().optional(),
  /** Para `mover`. */
  destino: z
    .object({
      setorId: z.string().nullable().optional(),
      topicoId: z.string().nullable().optional(),
      subtopicoId: z.string().nullable().optional(),
      moduloId: z.string().nullable().optional(),
      submoduloId: z.string().nullable().optional(),
    })
    .optional(),
  confirmar: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
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
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const { acao, ids, dataLiberacao, ocultarAteLiberacao, destino, confirmar } = parsed.data
  const objectIds = ids.filter(isValidObjectId).map((id) => new ObjectId(id))
  if (objectIds.length === 0) {
    return NextResponse.json({ error: 'Nenhuma aula válida selecionada' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const colecao = db.collection<AulaPostagem>('aulas_postagens')
    const filtro = { _id: { $in: objectIds } as any }
    const agora = new Date()

    if (acao === 'excluir') {
      if (confirmar !== true) {
        return NextResponse.json(
          { error: 'Confirme a exclusão para prosseguir.' },
          { status: 428 },
        )
      }
      const r = await colecao.deleteMany(filtro)
      return NextResponse.json({ success: true, afetadas: r.deletedCount })
    }

    let update: Record<string, any>

    if (acao === 'publicar') {
      // Publicar também destrava a data: uma aula que ficou agendada para uma
      // segunda-feira já passada continuaria escondida, e o admin acabou de
      // dizer que quer ela no ar agora.
      update = {
        $set: { oculta: false, dataLiberacao: agora, ocultarAteLiberacao: false, atualizadoEm: agora },
      }
    } else if (acao === 'ocultar') {
      update = { $set: { oculta: true, atualizadoEm: agora } }
    } else if (acao === 'agendar') {
      const data = dataLiberacao ? new Date(dataLiberacao) : null
      if (!data || Number.isNaN(data.getTime())) {
        return NextResponse.json({ error: 'Informe uma data válida.' }, { status: 400 })
      }
      update = {
        $set: {
          oculta: false,
          dataLiberacao: data,
          ocultarAteLiberacao: ocultarAteLiberacao === true,
          atualizadoEm: agora,
        },
      }
    } else {
      // mover
      const set: Record<string, any> = { atualizadoEm: agora }
      const unset: Record<string, any> = {}
      for (const [campo, valor] of Object.entries(destino || {})) {
        if (valor === null || valor === '') unset[campo] = 1
        else if (typeof valor === 'string' && isValidObjectId(valor)) set[campo] = valor
      }
      if (Object.keys(set).length === 1 && Object.keys(unset).length === 0) {
        return NextResponse.json({ error: 'Informe o destino.' }, { status: 400 })
      }
      update = Object.keys(unset).length > 0 ? { $set: set, $unset: unset } : { $set: set }
    }

    const r = await colecao.updateMany(filtro, update)
    return NextResponse.json({ success: true, afetadas: r.modifiedCount })
  } catch (error) {
    console.error('[aulas/lote] erro:', error)
    return NextResponse.json({ error: 'Erro ao aplicar a ação' }, { status: 500 })
  }
}
