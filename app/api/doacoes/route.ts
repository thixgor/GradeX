import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — rankings públicos (somente aprovadas)
// ?sort=top  → por maior valor
// ?sort=recent → por data mais recente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get('sort') || 'top'

    const db = await getDb()

    const doacoes = await db
      .collection('doacoes')
      .find({ status: 'approved' })
      .sort(sort === 'recent' ? [['dataDoacao', -1]] : [['valor', -1], ['dataDoacao', -1]])
      .limit(50)
      .toArray()

    return NextResponse.json(
      doacoes.map(d => ({
        _id: d._id.toString(),
        apelido: d.apelido,
        valor: d.valor,
        mensagem: d.mensagem || null,
        dataDoacao: d.dataDoacao,
        createdAt: d.createdAt,
      }))
    )
  } catch (error) {
    console.error('Erro ao buscar doações:', error)
    return NextResponse.json({ error: 'Erro ao buscar doações' }, { status: 500 })
  }
}

// POST — submeter doação (usuário autenticado, fica pendente)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await req.json()
    const { nomeCompleto, apelido, valor, mensagem, dataDoacao } = body

    if (!nomeCompleto?.trim()) return NextResponse.json({ error: 'Nome completo obrigatório' }, { status: 400 })
    if (!apelido?.trim()) return NextResponse.json({ error: 'Apelido obrigatório' }, { status: 400 })
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    if (!dataDoacao) return NextResponse.json({ error: 'Data obrigatória' }, { status: 400 })

    const db = await getDb()
    const now = new Date()

    const doc = {
      nomeCompleto: nomeCompleto.trim(),
      apelido: apelido.trim(),
      valor: Number(valor),
      mensagem: mensagem?.trim() || undefined,
      dataDoacao: new Date(dataDoacao),
      status: 'pending' as const,
      userId: session.userId,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('doacoes').insertOne(doc)

    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 })
  } catch (error) {
    console.error('Erro ao submeter doação:', error)
    return NextResponse.json({ error: 'Erro ao submeter doação' }, { status: 500 })
  }
}
