import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { garantirIndicesDeEnsino, podeEditarEnsino } from '@/lib/ensino/repositorio'
import { gerarSlug, slugUnico } from '@/lib/ensino/taxonomia'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Professores (§26).
 *
 * Um registro próprio, e não um texto dentro da aula, por uma razão só: o
 * professor aparece em dezenas de aulas, e um campo de texto significa
 * atualizar a foto em dezenas de lugares — ou, na prática, nunca atualizar.
 *
 * A Trilha NÃO tem professor. Ela é um caminho, e um caminho pode atravessar
 * aulas de gente diferente; amarrar a Trilha a um único nome impediria
 * exatamente a montagem que o modelo existe para permitir.
 */
export async function GET() {
  try {
    const db = await getDb()
    const professores = await db
      .collection(COLECOES.professores)
      .find({})
      .sort({ ordem: 1, nome: 1 })
      .toArray()

    return NextResponse.json({
      professores: professores.map((p: any) => ({ ...p, _id: String(p._id) })),
    })
  } catch (erro) {
    console.error('[ensino/professores] GET:', erro)
    return NextResponse.json({ error: 'Erro ao carregar professores' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json()
    const nome = String(corpo?.nome || '').trim().slice(0, 160)
    if (!nome) return NextResponse.json({ error: 'Informe o nome' }, { status: 400 })

    const usados = await db
      .collection(COLECOES.professores)
      .find({}, { projection: { slug: 1 } })
      .toArray()

    const documento = {
      nome,
      slug: slugUnico(gerarSlug(nome), usados.map((u: any) => u.slug)),
      foto: corpo?.foto ? String(corpo.foto).slice(0, 600) : null,
      titulacao: corpo?.titulacao ? String(corpo.titulacao).trim().slice(0, 160) : null,
      apresentacao: corpo?.apresentacao ? String(corpo.apresentacao).trim().slice(0, 1200) : null,
      ordem: Number(corpo?.ordem) || 0,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    }

    const resultado = await db.collection(COLECOES.professores).insertOne(documento as any)
    await garantirIndicesDeEnsino(db)

    return NextResponse.json({ professor: { ...documento, _id: String(resultado.insertedId) } })
  } catch (erro) {
    console.error('[ensino/professores] POST:', erro)
    return NextResponse.json({ error: 'Erro ao criar professor' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const corpo = await request.json()
    const id = String(corpo?._id || '')
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const mudanca: Record<string, any> = { atualizadoEm: new Date() }
    for (const campo of ['nome', 'foto', 'titulacao', 'apresentacao'] as const) {
      if (campo in corpo) mudanca[campo] = corpo[campo] ? String(corpo[campo]).slice(0, 1200) : null
    }
    if (Number.isFinite(Number(corpo.ordem))) mudanca.ordem = Number(corpo.ordem)

    await db
      .collection(COLECOES.professores)
      .updateOne({ _id: new ObjectId(id) }, { $set: mudanca })

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[ensino/professores] PATCH:', erro)
    return NextResponse.json({ error: 'Erro ao salvar professor' }, { status: 500 })
  }
}

/**
 * Remove o professor — e o desvincula das aulas.
 *
 * Aqui a limpeza é obrigatória, ao contrário do que acontece com nós da
 * taxonomia: uma aula guardando o id de um professor apagado mostraria um
 * espaço vazio onde deveria haver um nome, e não há nada que o admin possa
 * fazer para descobrir de quem era.
 */
export async function DELETE(request: Request) {
  try {
    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const id = new URL(request.url).searchParams.get('id') || ''
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    await Promise.all([
      db.collection(COLECOES.professores).deleteOne({ _id: new ObjectId(id) }),
      db
        .collection(COLECOES.aulas)
        .updateMany({ 'ensino.professorIds': id }, { $pull: { 'ensino.professorIds': id } } as any),
    ])

    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[ensino/professores] DELETE:', erro)
    return NextResponse.json({ error: 'Erro ao excluir professor' }, { status: 500 })
  }
}
