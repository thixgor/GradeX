import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { secureApiEndpoint, isValidObjectId } from '@/lib/api-security'
import { getDb } from '@/lib/mongodb'
import { incluirMembros, removerMembros, separarEmails, unicos } from '@/lib/aulas/grupos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Membros de uma turma (§16).
 *
 * A turma guarda IDs de usuário, mas quem monta a turma pensa em **e-mails** —
 * é o que a secretaria tem na planilha. Traduzir aqui, no servidor, é o que
 * permite colar uma lista inteira de uma vez; obrigar o admin a descobrir o id
 * de cada aluno tornaria a funcionalidade inutilizável na prática.
 *
 * A resposta devolve os e-mails que **não** viraram membro. Isso não é detalhe:
 * numa lista de 200 colada de planilha sempre há erro de digitação e gente que
 * ainda não criou conta, e uma turma que aceita tudo em silêncio deixa alunos de
 * fora sem ninguém perceber — até a aula abrir e eles não conseguirem entrar.
 */

const PostSchema = z.object({
  /** Texto colado com e-mails em qualquer separador. */
  emails: z.string().max(60_000).optional(),
  /** Ids já conhecidos, quando a tela os tem em mãos. */
  ids: z.array(z.string()).max(2000).optional(),
})

const DeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(2000),
})

async function turmaExiste(db: any, id: string): Promise<boolean> {
  const n = await db.collection('aulas_grupos').countDocuments({ _id: new ObjectId(id) }, { limit: 1 })
  return n > 0
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

  const parsed = PostSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const emails = separarEmails(parsed.data.emails || '')
  const idsDiretos = unicos(parsed.data.ids || []).filter(isValidObjectId)

  if (emails.length === 0 && idsDiretos.length === 0) {
    return NextResponse.json({ error: 'Nenhum e-mail válido na lista.' }, { status: 400 })
  }

  try {
    const db = await getDb()
    const grupo = await db.collection('aulas_grupos').findOne({ _id: new ObjectId(params.id) })
    if (!grupo) return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })

    // Uma consulta para a lista inteira. Uma por e-mail faria 200 idas ao banco
    // para uma colagem de planilha.
    const contas = emails.length
      ? await db
          .collection('users')
          .find({ email: { $in: emails } }, { projection: { email: 1 } })
          .limit(2000)
          .toArray()
      : []

    const encontrados = new Map(contas.map((c) => [String(c.email || '').toLowerCase(), String(c._id)]))
    const semConta = emails.filter((e) => !encontrados.has(e))

    const resultado = incluirMembros(
      Array.isArray(grupo.membros) ? grupo.membros.map(String) : [],
      [...idsDiretos, ...Array.from(encontrados.values())],
    )

    await db
      .collection('aulas_grupos')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { membros: resultado.membros, atualizadoEm: new Date() } },
      )

    return NextResponse.json({
      success: true,
      adicionados: resultado.adicionados,
      jaEstavam: resultado.jaEstavam,
      excedentes: resultado.excedentes,
      // Devolvido para a tela mostrar exatamente quem ficou de fora.
      semConta,
      totalMembros: resultado.membros.length,
    })
  } catch (error) {
    console.error('[aulas/grupos/membros] erro ao incluir:', error)
    return NextResponse.json({ error: 'Erro ao adicionar membros' }, { status: 500 })
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = DeleteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  try {
    const db = await getDb()
    if (!(await turmaExiste(db, params.id))) {
      return NextResponse.json({ error: 'Turma não encontrada' }, { status: 404 })
    }

    const grupo = await db.collection('aulas_grupos').findOne({ _id: new ObjectId(params.id) })
    const restantes = removerMembros(
      Array.isArray(grupo?.membros) ? grupo!.membros.map(String) : [],
      parsed.data.ids,
    )

    await db
      .collection('aulas_grupos')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { membros: restantes, atualizadoEm: new Date() } },
      )

    return NextResponse.json({ success: true, totalMembros: restantes.length })
  } catch (error) {
    console.error('[aulas/grupos/membros] erro ao remover:', error)
    return NextResponse.json({ error: 'Erro ao remover membros' }, { status: 500 })
  }
}
