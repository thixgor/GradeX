import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { secureApiEndpoint } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { normalizarGrupo, type GrupoDeAulas } from '@/lib/aulas/grupos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Turmas (§16) — listar e criar.
 *
 * A coleção `aulas_grupos` já era consultada em toda abertura de aula, mas
 * nenhuma rota jamais escrevia nela: a consulta voltava sempre vazia e a
 * condição de acesso por turma era inalcançável. Esta é a metade que faltava.
 *
 * A listagem devolve a CONTAGEM de membros, não a lista. Uma turma pode ter
 * milhares de ids, e mandar todos só para desenhar "Turma A · 240 alunos"
 * transformaria a tela de turmas num download de vários megabytes.
 */

const Schema = z.object({
  nome: z.string().min(1),
  descricao: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const security = await secureApiEndpoint(request, {
    rateLimit: 'READ',
    auth: {
      requireAuth: true,
      allowedRoles: ['admin'],
      allowSecondaryRoles: ['monitor'],
    },
  })
  if (!security.success || security.errorResponse) return security.errorResponse

  try {
    const db = await getDb()
    const grupos = await db
      .collection<GrupoDeAulas>('aulas_grupos')
      .find({}, { projection: { nome: 1, descricao: 1, membros: 1, criadoEm: 1 } })
      .sort({ nome: 1 })
      .limit(500)
      .toArray()

    return NextResponse.json(
      {
        grupos: grupos.map((g) => ({
          _id: String(g._id),
          nome: g.nome,
          descricao: g.descricao || '',
          totalMembros: Array.isArray(g.membros) ? g.membros.length : 0,
          criadoEm: g.criadoEm,
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/grupos] erro ao listar:', error)
    return NextResponse.json({ error: 'Erro ao carregar as turmas' }, { status: 500 })
  }
}

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

  const limpo = normalizarGrupo(parsed.data)
  if (!limpo) return NextResponse.json({ error: 'Informe um nome para a turma.' }, { status: 400 })

  try {
    const db = await getDb()
    const agora = new Date()
    const novo: GrupoDeAulas = {
      nome: limpo.nome,
      descricao: limpo.descricao,
      membros: [],
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const r = await db.collection<GrupoDeAulas>('aulas_grupos').insertOne(novo as any)

    return NextResponse.json({
      success: true,
      grupo: { _id: String(r.insertedId), ...novo, totalMembros: 0 },
    })
  } catch (error) {
    console.error('[aulas/grupos] erro ao criar:', error)
    return NextResponse.json({ error: 'Erro ao criar a turma' }, { status: 500 })
  }
}
