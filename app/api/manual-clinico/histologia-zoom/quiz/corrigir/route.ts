import { NextResponse } from 'next/server'

import { histologiaLiberadaNaRequisicao } from '@/lib/histologia/acesso'
import { histologiaHabilitada } from '@/lib/histologia/licenca'
import { corrigir } from '@/lib/histologia-zoom/quiz/banco'

/** Corrige uma questão do quiz de identificação e devolve a resposta comentada. */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ID = /^[a-z0-9-]{1,80}$/

export async function POST(requisicao: Request) {
  if (!histologiaHabilitada() || !(await histologiaLiberadaNaRequisicao())) {
    return new NextResponse(null, { status: 404 })
  }
  let corpo: { id?: unknown; opcao?: unknown; texto?: unknown; opcoes?: unknown }
  try {
    corpo = await requisicao.json()
  } catch {
    return NextResponse.json({ erro: 'corpo inválido' }, { status: 400 })
  }
  if (typeof corpo.id !== 'string' || corpo.id.length > 2000) {
    return NextResponse.json({ erro: 'questão inválida' }, { status: 400 })
  }
  const opcao = typeof corpo.opcao === 'string' && ID.test(corpo.opcao) ? corpo.opcao : undefined
  const texto = typeof corpo.texto === 'string' ? corpo.texto.slice(0, 200) : undefined
  const opcoes = Array.isArray(corpo.opcoes)
    ? corpo.opcoes.filter((o): o is string => typeof o === 'string' && ID.test(o)).slice(0, 6)
    : []

  const correcao = await corrigir(corpo.id, { opcao, texto }, opcoes)
  if (!correcao) return NextResponse.json({ erro: 'questão inválida' }, { status: 400 })
  return NextResponse.json(correcao, { headers: { 'Cache-Control': 'private, no-store' } })
}
