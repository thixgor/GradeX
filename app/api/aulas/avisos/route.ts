import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import {
  filtroDoCurso,
  filtroGlobal,
  MAX_AVISOS_POR_CURSO,
  normalizarAviso,
  ordenarAvisos,
  type AvisoDeAula,
} from '@/lib/aulas/avisos'

export const dynamic = 'force-dynamic'

/**
 * Avisos das aulas — global e por curso (§36).
 *
 * A rota já existia, servindo um aviso único da plataforma. Ela ganhou o escopo
 * de curso, e com ele uma correção que era invisível antes:
 *
 * O POST desativava TODOS os avisos ativos (`updateMany({ ativo: true })`)
 * antes de criar o novo. Enquanto só existia o aviso global isso era inofensivo
 * — era o jeito de garantir "um de cada vez". Com avisos de curso na mesma
 * coleção, publicar um anúncio geral apagaria em silêncio o recado de todos os
 * cursos. Agora cada operação declara o escopo, e a desativação em massa só
 * alcança o global (§45).
 *
 * Diferença de cardinalidade, também deliberada: o global continua sendo UM
 * (é uma faixa da plataforma), enquanto o curso tem um mural com vários. Um
 * curso costuma ter mais de um recado válido ao mesmo tempo — a mudança de
 * horário e a regravação do módulo 4 não se substituem.
 */

async function ehAdmin() {
  const session = await getSession()
  if (!session) return null
  if (session.role === 'admin') return session
  // Monitor administra aula no dia a dia; avisos de curso fazem parte disso.
  const db = await getDb()
  const user = await db.collection('users').findOne({ _id: new ObjectId(session.userId) })
  return user?.secondaryRole === 'monitor' ? session : null
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const colecao = db.collection<AvisoDeAula>('aulas_avisos')
    const curso = new URL(request.url).searchParams.get('curso')

    if (curso) {
      if (!isValidObjectId(curso)) return NextResponse.json({ avisos: [] })
      const avisos = await colecao
        .find(filtroDoCurso(curso) as any)
        .limit(MAX_AVISOS_POR_CURSO)
        .toArray()

      return NextResponse.json(
        { avisos: ordenarAvisos(avisos).map((a) => ({ ...a, _id: String(a._id) })) },
        { headers: { 'Cache-Control': 'private, no-store' } },
      )
    }

    // O aviso global continua sendo um só.
    const aviso = await colecao.findOne(filtroGlobal() as any)
    return NextResponse.json({ aviso: aviso ? { ...aviso, _id: String(aviso._id) } : null })
  } catch (error) {
    console.error('Erro ao buscar aviso das aulas:', error)
    return NextResponse.json({ error: 'Erro ao buscar aviso das aulas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await ehAdmin()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const limpo = normalizarAviso(body)
    if (!limpo) {
      return NextResponse.json({ error: 'Título e mensagem são obrigatórios' }, { status: 400 })
    }

    const setorId = body?.setorId ? String(body.setorId) : null
    if (setorId && !isValidObjectId(setorId)) {
      return NextResponse.json({ error: 'Curso inválido' }, { status: 400 })
    }

    const db = await getDb()
    const colecao = db.collection<AvisoDeAula>('aulas_avisos')
    const agora = new Date()

    if (!setorId) {
      // Só o global é "um de cada vez", e a desativação é escopada ao global —
      // sem isso ela levaria junto os murais de todos os cursos.
      await colecao.updateMany(filtroGlobal() as any, {
        $set: { ativo: false, atualizadoEm: agora },
      })
    } else {
      const quantos = await colecao.countDocuments(filtroDoCurso(setorId) as any)
      if (quantos >= MAX_AVISOS_POR_CURSO) {
        return NextResponse.json(
          {
            error: `Este curso já tem ${MAX_AVISOS_POR_CURSO} avisos. Remova algum antes — o mural existe para ser lido, e ninguém lê vinte recados.`,
          },
          { status: 409 },
        )
      }
    }

    const novo: AvisoDeAula = {
      ...(setorId ? { setorId } : {}),
      titulo: limpo.titulo,
      mensagem: limpo.mensagem,
      tipo: limpo.tipo,
      fixado: limpo.fixado,
      ativo: true,
      criadoEm: agora,
      atualizadoEm: agora,
      criadoPor: session.userId,
      criadoPorNome: session.name,
    }

    const r = await colecao.insertOne(novo as any)
    return NextResponse.json({ success: true, aviso: { ...novo, _id: String(r.insertedId) } })
  } catch (error) {
    console.error('Erro ao criar aviso das aulas:', error)
    return NextResponse.json({ error: 'Erro ao criar aviso das aulas' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await ehAdmin()
    if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

    const params = new URL(request.url).searchParams
    const id = params.get('id')
    const curso = params.get('curso')

    const db = await getDb()
    const colecao = db.collection<AvisoDeAula>('aulas_avisos')
    const agora = new Date()

    /*
     * Avisos são desativados, não apagados.
     *
     * Guardar o histórico permite descobrir depois o que foi comunicado e
     * quando — a pergunta que aparece quando um aluno diz "ninguém avisou".
     */
    if (id) {
      if (!isValidObjectId(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
      const r = await colecao.updateOne(
        { _id: new ObjectId(id) as any },
        { $set: { ativo: false, atualizadoEm: agora } },
      )
      if (r.matchedCount === 0) {
        return NextResponse.json({ error: 'Aviso não encontrado' }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }

    // Sem id: limpa o escopo inteiro. Curso informado limpa só aquele mural;
    // sem curso, limpa o aviso global — nunca os dois.
    const filtro = curso && isValidObjectId(curso) ? filtroDoCurso(curso) : filtroGlobal()
    const r = await colecao.updateMany(filtro as any, {
      $set: { ativo: false, atualizadoEm: agora },
    })

    return NextResponse.json({ success: true, modifiedCount: r.modifiedCount })
  } catch (error) {
    console.error('Erro ao remover aviso das aulas:', error)
    return NextResponse.json({ error: 'Erro ao remover aviso das aulas' }, { status: 500 })
  }
}
