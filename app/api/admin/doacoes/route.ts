import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET — todas as doações (admin), opcionalmente filtradas por status
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const db = await getDb()
    const filter = status ? { status } : {}

    const doacoes = await db
      .collection('doacoes')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(
      doacoes.map(d => ({ ...d, _id: d._id.toString() }))
    )
  } catch (error) {
    console.error('Erro ao buscar doações (admin):', error)
    return NextResponse.json({ error: 'Erro ao buscar doações' }, { status: 500 })
  }
}

// POST — adicionar doação manualmente (já aprovada)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { nomeCompleto, apelido, valor, mensagem, dataDoacao } = body

    if (!nomeCompleto?.trim()) return NextResponse.json({ error: 'Nome completo obrigatório' }, { status: 400 })
    if (!apelido?.trim()) return NextResponse.json({ error: 'Apelido obrigatório' }, { status: 400 })
    if (!valor || isNaN(Number(valor)) || Number(valor) <= 0) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

    const db = await getDb()
    const now = new Date()

    const doc = {
      nomeCompleto: nomeCompleto.trim(),
      apelido: apelido.trim(),
      valor: Number(valor),
      mensagem: mensagem?.trim() || undefined,
      dataDoacao: dataDoacao ? new Date(dataDoacao) : now,
      status: 'approved' as const,
      addedByAdmin: true,
      reviewedBy: session.userId,
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('doacoes').insertOne(doc)
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc }, { status: 201 })
  } catch (error) {
    console.error('Erro ao adicionar doação (admin):', error)
    return NextResponse.json({ error: 'Erro ao adicionar doação' }, { status: 500 })
  }
}
