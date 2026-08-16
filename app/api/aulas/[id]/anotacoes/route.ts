import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { isValidObjectId } from '@/lib/api-security'
import { avaliarAcessoAula } from '@/lib/aulas/acesso'
import { montarContextoDoUsuario } from '@/lib/aulas/contexto'
import {
  normalizarAnotacao,
  ordenarAnotacoes,
  type AnotacaoDaAula,
} from '@/lib/aulas/anotacoes'
import type { AulaPostagem } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const COLECAO = 'aulas_anotacoes'
const MAX_POR_AULA = 300

/**
 * Anotações do aluno numa aula.
 *
 * São privadas por definição: toda consulta filtra por `usuarioId` da sessão,
 * nunca por parâmetro da requisição. Não existe caminho aqui que devolva a
 * anotação de outra pessoa.
 */

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const db = await getDb()
    const anotacoes = await db.collection<AnotacaoDaAula>(COLECAO)
      .find({ aulaId: params.id, usuarioId: session.userId })
      .limit(MAX_POR_AULA)
      .toArray()

    return NextResponse.json(
      { anotacoes: ordenarAnotacoes(anotacoes) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('[aulas/anotacoes] erro ao listar:', error)
    return NextResponse.json({ error: 'Erro ao carregar anotações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isValidObjectId(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const session = await getSession()
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const dados = normalizarAnotacao(body as any)
    if (!dados) return NextResponse.json({ error: 'Escreva algo na anotação.' }, { status: 400 })

    const db = await getDb()

    // Anotar exige poder assistir: sem isto, a aula bloqueada viraria um
    // bloco de notas gratuito pendurado em conteúdo pago.
    const aula = await db.collection<AulaPostagem>('aulas_postagens').findOne({
      _id: new ObjectId(params.id),
    })
    if (!aula) return NextResponse.json({ error: 'Aula não encontrada' }, { status: 404 })

    const usuario = await montarContextoDoUsuario(db, session)
    if (!avaliarAcessoAula(aula as any, usuario).liberado) {
      return NextResponse.json({ error: 'Sem acesso a esta aula' }, { status: 403 })
    }

    const total = await db.collection(COLECAO).countDocuments(
      { aulaId: params.id, usuarioId: session.userId },
      { limit: MAX_POR_AULA + 1 },
    )
    if (total >= MAX_POR_AULA) {
      return NextResponse.json(
        { error: `Limite de ${MAX_POR_AULA} anotações por aula atingido.` },
        { status: 409 },
      )
    }

    const agora = new Date()
    const anotacao: AnotacaoDaAula = {
      aulaId: params.id,
      usuarioId: session.userId,
      conteudo: dados.conteudo,
      segundo: dados.segundo,
      destacada: dados.destacada,
      criadoEm: agora,
      atualizadoEm: agora,
    }
    const inserida = await db.collection<AnotacaoDaAula>(COLECAO).insertOne(anotacao as any)

    return NextResponse.json(
      { anotacao: { ...anotacao, _id: String(inserida.insertedId) } },
      { status: 201 },
    )
  } catch (error) {
    console.error('[aulas/anotacoes] erro ao criar:', error)
    return NextResponse.json({ error: 'Erro ao salvar anotação' }, { status: 500 })
  }
}
