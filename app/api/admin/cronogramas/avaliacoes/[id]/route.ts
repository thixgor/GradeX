import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import {
  COLECAO_AVALIACOES,
  COLECAO_ENVIOS,
  serializarAvaliacao,
  validarAvaliacao,
} from '@/lib/cronogramas/avaliacoes-servidor'
import { normalizarConfigLembrete } from '@/lib/cronogramas/lembretes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Edição de UMA avaliação.
 *
 * `PATCH` aceita alteração parcial de propósito: a tela do painel edita no
 * lugar — o admin troca a data numa linha da lista, ou liga o interruptor de
 * lembrete no card, e nada mais do documento é tocado. Mandar o objeto inteiro
 * a cada tecla abriria janela para dois admins sobrescreverem um ao outro.
 */

function idValido(id: string): boolean {
  return ObjectId.isValid(id)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!idValido(params.id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 })

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const db = await getDb()
  const atual = await db.collection(COLECAO_AVALIACOES).findOne({ _id: new ObjectId(params.id) })
  if (!atual) return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })

  // A validação roda sobre o documento MESCLADO: só assim uma edição que muda
  // apenas a hora ainda é checada contra a data que já estava gravada.
  const mesclado = { ...atual, ...corpo }
  if (corpo.lembrete) mesclado.lembrete = normalizarConfigLembrete({ ...atual.lembrete, ...corpo.lembrete })

  const validacao = validarAvaliacao(mesclado)
  if (!validacao.ok) return NextResponse.json({ error: validacao.erro }, { status: 400 })

  await db.collection(COLECAO_AVALIACOES).updateOne(
    { _id: new ObjectId(params.id) },
    { $set: { ...validacao.dados, atualizadaEm: new Date() } },
  )

  return NextResponse.json({
    avaliacao: serializarAvaliacao({ ...validacao.dados, _id: atual._id, criadaEm: atual.criadaEm }),
  })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  if (!idValido(params.id)) return NextResponse.json({ error: 'Id inválido' }, { status: 400 })

  const db = await getDb()
  const resultado = await db.collection(COLECAO_AVALIACOES).deleteOne({ _id: new ObjectId(params.id) })
  if (resultado.deletedCount === 0) {
    return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
  }

  // O histórico de disparos some junto: ele só serve para não repetir lembrete
  // de uma avaliação que existe.
  await db.collection(COLECAO_ENVIOS).deleteMany({ avaliacaoId: params.id })

  return NextResponse.json({ success: true })
}
