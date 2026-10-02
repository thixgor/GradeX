import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

import { COLECAO_ESTUDOS, autorizarEstudo, type EstudoNoBanco } from '@/lib/manual-clinico/integracao/acesso'
import {
  aplicarAlteracao,
  completarEstudo,
  resumirEstudo,
} from '@/lib/manual-clinico/integracao/estudos'
import { obterIndice } from '@/lib/manual-clinico/integracao/indice'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Um Estudo Integrado: ler, alterar, excluir.
 *
 * Todo filtro carrega o `userId` — o estudo de outra conta simplesmente não é
 * encontrado (404), em vez de existir e ser negado.
 *
 * A alteração é uma ação de cada vez (`renomear`, `acrescentar`, `remover`,
 * `marcar`, `anotar`, `trocar`), validada em `lib/manual-clinico/integracao/estudos.ts`.
 * A gravação usa `atualizadoEm` como trava otimista: se dois aparelhos mexerem
 * ao mesmo tempo, o segundo recebe 409 e recarrega, em vez de apagar sem
 * saber o que o primeiro fez.
 */

type Params = { params: { id: string } }

function idDe(params: Params['params']): ObjectId | null {
  return ObjectId.isValid(params.id) ? new ObjectId(params.id) : null
}

export async function GET(request: NextRequest, { params }: Params) {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro
  const { db, userId } = autorizado
  const id = idDe(params)
  if (!id) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })

  try {
    const [doc, indice] = await Promise.all([
      db.collection<EstudoNoBanco>(COLECAO_ESTUDOS).findOne({ _id: id, userId }),
      obterIndice(),
    ])
    if (!doc) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })
    return jsonComprimido(
      request,
      { estudo: completarEstudo(doc, (r) => indice.porRef.get(r)) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (erro) {
    console.error('Erro ao ler estudo integrado:', erro)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro
  const { db, userId } = autorizado
  const id = idDe(params)
  if (!id) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })

  try {
    const pedido = await request.json().catch(() => null)
    const colecao = db.collection<EstudoNoBanco>(COLECAO_ESTUDOS)
    const [doc, indice] = await Promise.all([colecao.findOne({ _id: id, userId }), obterIndice()])
    if (!doc) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })

    const agora = new Date()
    const resultado = aplicarAlteracao(doc, pedido, (r) => indice.porRef.has(r), agora)
    if (!resultado.ok) return NextResponse.json({ error: resultado.erro }, { status: 400 })

    const $set: Record<string, unknown> = { itens: resultado.itens, atualizadoEm: agora }
    if (resultado.titulo) $set.titulo = resultado.titulo

    const atualizado = await colecao.findOneAndUpdate(
      { _id: id, userId, atualizadoEm: doc.atualizadoEm },
      { $set },
      { returnDocument: 'after' },
    )
    if (!atualizado) {
      return NextResponse.json({ error: 'O estudo mudou em outro aparelho. Recarregue.' }, { status: 409 })
    }

    return jsonComprimido(request, {
      estudo: completarEstudo(atualizado, (r) => indice.porRef.get(r)),
      ...(resultado.recusados ? { recusados: resultado.recusados } : {}),
    })
  } catch (erro) {
    console.error('Erro ao alterar estudo integrado:', erro)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const autorizado = await autorizarEstudo()
  if ('erro' in autorizado) return autorizado.erro
  const { db, userId } = autorizado
  const id = idDe(params)
  if (!id) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })

  try {
    const removido = await db.collection<EstudoNoBanco>(COLECAO_ESTUDOS).findOneAndDelete({ _id: id, userId })
    if (!removido) return NextResponse.json({ error: 'Estudo não encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true, estudo: resumirEstudo(removido) })
  } catch (erro) {
    console.error('Erro ao excluir estudo integrado:', erro)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
