import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { normalizarGrupo, type GrupoDeAulas } from '@/lib/aulas/grupos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Uma turma: ver com os membros, renomear, excluir.
 *
 * O GET aqui — ao contrário da listagem — traz os membros com nome e e-mail,
 * porque é a tela em que se confere quem está dentro. A resolução dos nomes é
 * uma consulta só, com `$in`: uma por membro faria uma turma de 200 alunos
 * abrir com 200 idas ao banco.
 */

const PatchSchema = z.object({
  nome: z.string().min(1).optional(),
  descricao: z.string().optional(),
})

/** Quantos membros a tela resolve por vez. Acima disso, só a contagem. */
const MEMBROS_POR_PAGINA = 300

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const db = await getDb()
    const grupo = await db
      .collection<GrupoDeAulas>('aulas_grupos')
      .findOne({ _id: new ObjectId(params.id) as any })

    if (!grupo) return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })

    const ids = (Array.isArray(grupo.membros) ? grupo.membros : []).filter(isValidObjectId)
    const recorte = ids.slice(0, MEMBROS_POR_PAGINA)

    const pessoas = recorte.length
      ? await db
          .collection('users')
          .find(
            { _id: { $in: recorte.map((i) => new ObjectId(i)) } as any },
            { projection: { name: 1, email: 1 } },
          )
          .toArray()
      : []

    // Um id que não resolve é uma conta apagada. Ele aparece assim mesmo, para
    // o admin poder tirá-lo — some da tela seria deixar lixo permanente.
    const porId = new Map(pessoas.map((p) => [String(p._id), p]))
    const membros = recorte.map((id) => {
      const p = porId.get(id)
      return {
        id,
        nome: p?.name || 'Conta removida',
        email: p?.email || '',
        existe: !!p,
      }
    })

    return NextResponse.json(
      {
        grupo: {
          _id: String(grupo._id),
          nome: grupo.nome,
          descricao: grupo.descricao || '',
          totalMembros: ids.length,
          membros,
          truncado: ids.length > recorte.length,
        },
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/grupos/id] erro ao ler:', error)
    return NextResponse.json({ error: 'Erro ao carregar a turma' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const limpo = normalizarGrupo({ nome: parsed.data.nome, descricao: parsed.data.descricao })
  if (!limpo) return NextResponse.json({ error: 'Informe um nome para a turma.' }, { status: 400 })

  try {
    const db = await getDb()
    const r = await db.collection('aulas_grupos').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { nome: limpo.nome, descricao: limpo.descricao, atualizadoEm: new Date() } },
    )
    if (r.matchedCount === 0) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[aulas/grupos/id] erro ao atualizar:', error)
    return NextResponse.json({ error: 'Erro ao atualizar a turma' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'WRITE',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse
  if (!isValidObjectId(params.id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const db = await getDb()

    /*
     * Excluir uma turma que ainda tranca aulas é a maneira mais silenciosa de
     * quebrar o acesso: a condição continua gravada na aula apontando para uma
     * turma que não existe mais, ninguém nunca satisfaz, e a aula fica trancada
     * para todo mundo — sem nenhuma mensagem de erro em lugar nenhum.
     *
     * Por isso a exclusão é recusada enquanto houver aula usando a turma, e a
     * resposta diz quantas são (§45).
     */
    const emUso = await db.collection('aulas_postagens').countDocuments(
      {
        $or: [
          { 'regrasAcesso.liberarPara': { $elemMatch: { tipo: 'grupo', grupoId: params.id } } },
          { 'regrasAcesso.exigirTambem': { $elemMatch: { tipo: 'grupo', grupoId: params.id } } },
        ],
      },
      { limit: 500 },
    )

    if (emUso > 0) {
      return NextResponse.json(
        {
          error: `${emUso} aula(s) ainda usam esta turma na regra de acesso. Troque a regra dessas aulas antes de excluir — senão elas ficariam trancadas para todo mundo.`,
          emUso,
        },
        { status: 409 },
      )
    }

    const r = await db.collection('aulas_grupos').deleteOne({ _id: new ObjectId(params.id) })
    if (r.deletedCount === 0) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[aulas/grupos/id] erro ao excluir:', error)
    return NextResponse.json({ error: 'Erro ao excluir a turma' }, { status: 500 })
  }
}
