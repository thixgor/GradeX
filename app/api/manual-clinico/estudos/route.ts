import { NextRequest, NextResponse } from 'next/server'

import {
  COLECAO_ESTUDOS,
  autorizarEstudo,
  garantirIndicesDosEstudos,
  type EstudoNoBanco,
} from '@/lib/manual-clinico/integracao/acesso'
import {
  MAX_ESTUDOS_POR_USUARIO,
  acrescentarItens,
  limparTitulo,
  resumirEstudo,
} from '@/lib/manual-clinico/integracao/estudos'
import { obterIndice } from '@/lib/manual-clinico/integracao/indice'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Meus Estudos Integrados — lista e criação.
 *
 * Fica na conta (e não no navegador) porque o estudo atravessa aparelhos:
 * monta-se no computador e revisa-se no celular antes da prova.
 */

export async function GET() {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro
  const { db, userId } = autorizado

  try {
    const [docs] = await Promise.all([
      db
        .collection<EstudoNoBanco>(COLECAO_ESTUDOS)
        .find({ userId })
        .sort({ atualizadoEm: -1 })
        .limit(MAX_ESTUDOS_POR_USUARIO)
        .toArray(),
      garantirIndicesDosEstudos(db),
    ])
    return NextResponse.json({ estudos: docs.map(resumirEstudo) }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (erro) {
    console.error('Erro ao listar estudos integrados:', erro)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro
  const { db, userId } = autorizado

  try {
    const corpo = await request.json().catch(() => null)
    const titulo = limparTitulo(corpo?.titulo)
    if (!titulo) return NextResponse.json({ error: 'Dê um nome ao estudo' }, { status: 400 })

    const colecao = db.collection<Omit<EstudoNoBanco, '_id'>>(COLECAO_ESTUDOS)
    const [total, indice] = await Promise.all([colecao.countDocuments({ userId }), obterIndice()])
    if (total >= MAX_ESTUDOS_POR_USUARIO) {
      return NextResponse.json(
        { error: `Você chegou ao limite de ${MAX_ESTUDOS_POR_USUARIO} estudos. Exclua um para criar outro.` },
        { status: 409 },
      )
    }

    const agora = new Date()
    const refs = Array.isArray(corpo?.refs) ? corpo.refs : []
    const { itens, recusados } = acrescentarItens([], refs, (r) => indice.porRef.has(r), agora)

    const doc = { userId, titulo, itens, criadoEm: agora, atualizadoEm: agora }
    const resultado = await colecao.insertOne(doc)

    return NextResponse.json({
      estudo: resumirEstudo({ ...doc, _id: resultado.insertedId }),
      ...(recusados > 0 ? { recusados } : {}),
    })
  } catch (erro) {
    console.error('Erro ao criar estudo integrado:', erro)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
