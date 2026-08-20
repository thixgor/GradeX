import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import { COLECOES } from '@/lib/ensino/compatibilidade'
import { lerNos, montarCartoes } from '@/lib/ensino/repositorio'
import { ordenarParaRevisao, type AulaRevisavel } from '@/lib/ensino/revisao'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * A Área de Revisão (§16, §18).
 *
 * Devolve o que a pessoa JÁ estudou, ordenado por quanto aquilo pede uma
 * revisão. Não é uma segunda biblioteca: é uma leitura diferente da mesma base
 * — as aulas com progresso, com os recursos de revisão que cada uma tem.
 *
 * O corte por progresso é o que separa esta área da de Aprender. Conteúdo nunca
 * aberto não aparece aqui de propósito: para isso existe a Trilha, e mostrar
 * "revise o que você nunca viu" seria a forma mais rápida de a área perder
 * sentido.
 */
export async function GET(request: Request) {
  try {
    const sessao = await getSession()
    if (!sessao?.userId) {
      return NextResponse.json({ itens: [], logado: false })
    }

    const db = await getDb()
    const p = new URL(request.url).searchParams
    const limite = Math.min(200, Math.max(1, Number(p.get('limite')) || 40))

    const registros = await db
      .collection(COLECOES.progresso)
      .find({ usuarioId: sessao.userId, $or: [{ concluida: true }, { percentual: { $gt: 0 } }] })
      .sort({ atualizadoEm: -1 })
      .limit(400)
      .toArray()

    if (registros.length === 0) {
      return NextResponse.json({ itens: [], logado: true, total: 0 })
    }

    const ids = registros.map((r: any) => String(r.aulaId)).filter(ObjectId.isValid)
    const [documentos, nos] = await Promise.all([
      db
        .collection(COLECOES.aulas)
        .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } as any })
        .toArray(),
      lerNos(db),
    ])

    const usuario = await montarContextoDoUsuario(db, sessao as any)
    const cartoes = await montarCartoes(db, documentos as any, usuario, {
      usuarioId: sessao.userId,
      nos,
    })
    const porId = new Map(cartoes.map((c) => [c._id, c]))

    const revisaveis: AulaRevisavel[] = []
    for (const registro of registros as any[]) {
      const cartao = porId.get(String(registro.aulaId))
      // Assinatura vencida desde a última sessão: continuar oferecendo a
      // revisão de uma aula que a pessoa não pode mais abrir é prometer porta
      // fechada.
      if (!cartao || !cartao.acesso.liberado) continue
      revisaveis.push({
        aulaId: cartao._id,
        titulo: cartao.titulo,
        localizacao: cartao.localizacao,
        concluida: registro.concluida === true,
        percentual: Number(registro.percentual) || 0,
        atualizadoEm: registro.atualizadoEm,
        concluidaEm: registro.concluidaEm || null,
        temResumo: cartao.recursos.resumo,
        temPdf: cartao.recursos.pdf,
        temFlashcards: cartao.recursos.flashcards,
      })
    }

    const fila = ordenarParaRevisao(revisaveis, { limite })
    const porAula = new Map(cartoes.map((c) => [c._id, c]))

    return NextResponse.json(
      {
        logado: true,
        total: revisaveis.length,
        itens: fila.map((item) => ({
          ...item,
          href: porAula.get(item.aulaId)?.href || `/aulas/${item.aulaId}`,
          capa: porAula.get(item.aulaId)?.capa || null,
          resumoId: porAula.get(item.aulaId)?.resumoId || null,
          duracaoLabel: porAula.get(item.aulaId)?.duracaoLabel || '',
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('[ensino/revisao] GET:', erro)
    return NextResponse.json({ error: 'Erro ao montar a revisão' }, { status: 500 })
  }
}
