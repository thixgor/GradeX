import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// GET - Lista só os nomes de todas as patologias (um por linha, ordem alfabética).
// Projeção mínima: não traz o documento inteiro, só o campo `nome`.
export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()
    const docs = await db.collection('patologias')
      .find({}, { projection: { _id: 0, nome: 1 } })
      .sort({ nome: 1 })
      .toArray()

    const nomes = docs
      .map((d: any) => String(d.nome || '').trim())
      .filter(Boolean)

    return new NextResponse(nomes.join('\n') + '\n', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Total': String(nomes.length),
      },
    })
  } catch (error) {
    console.error('Erro ao listar nomes das patologias:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
