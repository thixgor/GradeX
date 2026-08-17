import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { abrirQuestaoGratuita, lerAcessoAoBanco } from '@/lib/banco/acesso-servidor'
import { restantes } from '@/lib/banco/gratuito'

export const dynamic = 'force-dynamic'

/**
 * Gastar uma questão do saldo gratuito, de propósito.
 *
 * É uma rota separada e um POST porque abrir uma questão CONSOME algo. Se o
 * simples fato de carregar a página da questão gastasse o saldo, a pessoa
 * perderia as dez gratuitas navegando — clicando de volta, atualizando a aba,
 * abrindo por engano. Aqui ela vê o que vai gastar e decide.
 *
 * Para assinante e admin a rota responde liberado sem consumir nada, para que a
 * tela seja uma só.
 */
export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession()
    if (!session?.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()
    const acesso = await lerAcessoAoBanco(db, session.userId)
    if (!acesso) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // A questão precisa existir antes de custar saldo: gastar uma das dez num
    // id que não existe seria cobrar por nada.
    const existe = await db
      .collection('banco_questoes')
      .countDocuments({ _id: new ObjectId(id) }, { limit: 1 })
    if (existe === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    const resultado = await abrirQuestaoGratuita(db, acesso, id)

    if (!resultado.liberada) {
      return NextResponse.json(
        {
          error: resultado.motivo || 'Sem questões gratuitas restantes',
          requiresPlus: true,
          gratuito: { restantes: 0, limite: resultado.gratuito.limite },
        },
        { status: 403 },
      )
    }

    return NextResponse.json(
      {
        liberada: true,
        gratuito: acesso.ehGratuito
          ? { restantes: restantes(resultado.gratuito), limite: resultado.gratuito.limite }
          : undefined,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Erro ao abrir questão:', error)
    return NextResponse.json({ error: 'Erro ao abrir questão' }, { status: 500 })
  }
}
