import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { hojeBrasilia, somarDias } from '@/lib/cronogramas/brasilia'
import {
  COLECAO_AVALIACOES,
  garantirIndices,
  listarAvaliacoes,
  serializarAvaliacao,
  validarAvaliacao,
} from '@/lib/cronogramas/avaliacoes-servidor'
import { normalizarSecao } from '@/lib/cronogramas/tipos'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Avaliações no painel: listar e criar.
 *
 * Diferente da rota do aluno, aqui rascunho aparece — o painel é justamente
 * onde ele existe. Todo o resto (filtro por seção, período, janela de datas,
 * busca) passa pela mesma função de consulta, para as duas telas nunca
 * discordarem sobre o que é "a agenda do 3º período".
 */

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const periodoBruto = Math.round(Number(params.get('periodo')))
  const hoje = hojeBrasilia()

  const avaliacoes = await listarAvaliacoes({
    secao: normalizarSecao(params.get('secao')),
    periodo: Number.isFinite(periodoBruto) && periodoBruto >= 1 ? periodoBruto : null,
    desde: params.get('desde') || somarDias(hoje, -365),
    ate: params.get('ate') || somarDias(hoje, 730),
    busca: params.get('q'),
    limite: 500,
  })

  return NextResponse.json({ avaliacoes, hoje })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  let corpo: any
  try {
    corpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  // Criar várias de uma vez é o caso normal, não a exceção: o admin chega com
  // o calendário do semestre na mão. Uma avaliação só entra como lista de um.
  const itens = Array.isArray(corpo?.avaliacoes) ? corpo.avaliacoes : [corpo]
  if (itens.length === 0 || itens.length > 60) {
    return NextResponse.json({ error: 'Envie de 1 a 60 avaliações.' }, { status: 400 })
  }

  const documentos: any[] = []
  for (const item of itens) {
    const validacao = validarAvaliacao(item)
    if (!validacao.ok) return NextResponse.json({ error: validacao.erro }, { status: 400 })

    documentos.push({
      ...validacao.dados,
      criadaEm: new Date(),
      atualizadaEm: new Date(),
      criadaPor: session.userId,
    })
  }

  const db = await getDb()
  await garantirIndices(db)
  const resultado = await db.collection(COLECAO_AVALIACOES).insertMany(documentos)

  const criadas = documentos.map((doc, indice) =>
    serializarAvaliacao({ ...doc, _id: resultado.insertedIds[indice] }),
  )

  return NextResponse.json({ avaliacoes: criadas }, { status: 201 })
}
