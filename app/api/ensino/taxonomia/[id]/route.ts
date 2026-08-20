import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { lerNos, podeEditarEnsino } from '@/lib/ensino/repositorio'
import { gerarSlug, idsDoRamo, slugUnico, validarNo } from '@/lib/ensino/taxonomia'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Renomear, mover, esconder ou recolorir um nó. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const atual = await db.collection(COLECOES.nos).findOne({ _id: new ObjectId(params.id) })
    if (!atual) return NextResponse.json({ error: 'Nível não encontrado' }, { status: 404 })

    const corpo = await request.json()
    const mudanca: Record<string, any> = { atualizadoEm: new Date() }

    if (typeof corpo.nome === 'string' && corpo.nome.trim()) {
      mudanca.nome = corpo.nome.trim().slice(0, 160)
    }
    if ('descricao' in corpo) {
      mudanca.descricao = corpo.descricao ? String(corpo.descricao).trim().slice(0, 600) : null
    }
    if ('cor' in corpo) mudanca.cor = corpo.cor ? String(corpo.cor).slice(0, 16) : null
    if ('oculto' in corpo) mudanca.oculto = corpo.oculto === true
    if (Number.isFinite(Number(corpo.ordem))) mudanca.ordem = Number(corpo.ordem)

    // Mover de pai é a operação perigosa: precisa continuar respeitando a
    // hierarquia, e um nó não pode virar descendente de si mesmo.
    if ('paiId' in corpo) {
      const paiId = corpo.paiId ? String(corpo.paiId) : null
      const nivel = corpo.nivel || atual.nivel

      if (paiId) {
        const nos = await lerNos(db)
        if (idsDoRamo(nos, params.id).includes(paiId)) {
          return NextResponse.json(
            { error: 'Um nível não pode entrar dentro de si mesmo.' },
            { status: 400 },
          )
        }
      }

      const pai =
        paiId && ObjectId.isValid(paiId)
          ? await db.collection(COLECOES.nos).findOne({ _id: new ObjectId(paiId) })
          : null

      const problemas = validarNo(
        { nome: mudanca.nome || atual.nome, nivel, paiId },
        pai ? ({ nivel: pai.nivel } as any) : null,
      )
      if (problemas.length > 0) {
        return NextResponse.json({ error: problemas[0].mensagem, problemas }, { status: 400 })
      }

      mudanca.paiId = paiId
      mudanca.nivel = nivel
    }

    if (typeof corpo.slug === 'string' && corpo.slug.trim()) {
      const usados = await db
        .collection(COLECOES.nos)
        .find({ _id: { $ne: new ObjectId(params.id) } }, { projection: { slug: 1 } })
        .toArray()
      mudanca.slug = slugUnico(gerarSlug(corpo.slug), usados.map((u: any) => u.slug))
    }

    await db
      .collection(COLECOES.nos)
      .updateOne({ _id: new ObjectId(params.id) }, { $set: mudanca })

    return NextResponse.json({ ok: true, mudanca })
  } catch (erro) {
    console.error('[ensino/taxonomia/id] PATCH:', erro)
    return NextResponse.json({ error: 'Erro ao salvar o nível' }, { status: 500 })
  }
}

/**
 * Apaga um nó — e só quando ele está realmente vazio.
 *
 * A alternativa (apagar em cascata) destruiria conteúdo com um clique, e este
 * subsistema não apaga aula nenhuma por decisão de arquitetura (§36). Quando o
 * nó tem filhos ou aulas, a resposta explica o que está preso ali, com os
 * números — um "não foi possível excluir" seco obrigaria o admin a caçar o
 * motivo à mão.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const sessao = await getSession()
    if (!(await podeEditarEnsino(db, sessao as any))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const [filhos, aulas] = await Promise.all([
      db.collection(COLECOES.nos).countDocuments({ paiId: params.id }),
      db.collection(COLECOES.aulas).countDocuments({
        $or: [
          { 'ensino.areaId': params.id },
          { 'ensino.moduloId': params.id },
          { 'ensino.topicoId': params.id },
          { 'ensino.subtopicoId': params.id },
        ],
      }),
    ])

    if (filhos > 0 || aulas > 0) {
      const partes = [
        filhos > 0 ? `${filhos} ${filhos === 1 ? 'nível' : 'níveis'} dentro` : '',
        aulas > 0 ? `${aulas} ${aulas === 1 ? 'aula' : 'aulas'}` : '',
      ].filter(Boolean)
      return NextResponse.json(
        {
          error: `Ainda há ${partes.join(' e ')} aqui. Mova esse conteúdo antes de excluir.`,
          filhos,
          aulas,
        },
        { status: 409 },
      )
    }

    await db.collection(COLECOES.nos).deleteOne({ _id: new ObjectId(params.id) })
    return NextResponse.json({ ok: true })
  } catch (erro) {
    console.error('[ensino/taxonomia/id] DELETE:', erro)
    return NextResponse.json({ error: 'Erro ao excluir o nível' }, { status: 500 })
  }
}
