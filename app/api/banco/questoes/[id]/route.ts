import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { BancoQuestao, BancoQuestaoComHierarquia } from '@/lib/types/banco-questoes'
import { lerAcessoAoBanco } from '@/lib/banco/acesso-servidor'
import { jaDesbloqueada, restantes } from '@/lib/banco/gratuito'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const db = await getDb()

    const acesso = await lerAcessoAoBanco(db, session.userId)
    if (!acesso) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    /*
     * Questão fechada não devolve conteúdo — devolve o CONVITE para abrir.
     *
     * O 403 aqui não é um beco: ele diz quantas questões gratuitas ainda
     * existem, e a tela oferece o botão que gasta uma delas (POST em
     * `/abrir`). Antes, uma questão fora do sorteio do período respondia
     * apenas "Acesso restrito a assinantes Plus+", que é uma porta sem
     * maçaneta para quem estava justamente avaliando se vale assinar.
     */
    if (acesso.ehGratuito && !jaDesbloqueada(acesso.gratuito, id)) {
      const sobrando = restantes(acesso.gratuito)
      return NextResponse.json(
        {
          error: sobrando > 0
            ? 'Esta questão ainda não foi aberta'
            : 'Você já usou suas questões gratuitas',
          bloqueada: true,
          podeAbrir: sobrando > 0,
          requiresPlus: sobrando === 0,
          gratuito: { restantes: sobrando, limite: acesso.gratuito.limite },
        },
        { status: 403 },
      )
    }

    // Buscar questão com hierarquia
    const pipeline = [
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'banco_periodos',
          localField: 'periodoId',
          foreignField: '_id',
          as: 'periodo'
        }
      },
      {
        $lookup: {
          from: 'banco_modulos',
          localField: 'moduloId',
          foreignField: '_id',
          as: 'modulo'
        }
      },
      {
        $lookup: {
          from: 'banco_topicos',
          localField: 'topicoId',
          foreignField: '_id',
          as: 'topico'
        }
      },
      {
        $lookup: {
          from: 'banco_subtopicos',
          localField: 'subtopicoid',
          foreignField: '_id',
          as: 'subtopico'
        }
      },
      {
        $lookup: {
          from: 'banco_resolucoes',
          let: { questaoId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$questaoId', '$$questaoId'] },
                    { $eq: ['$userId', new ObjectId(session.userId)] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'resolucoes'
        }
      },
      {
        $addFields: {
          periodoNome: { $arrayElemAt: ['$periodo.nome', 0] },
          moduloNome: { $arrayElemAt: ['$modulo.nome', 0] },
          topicoNome: { $arrayElemAt: ['$topico.nome', 0] },
          subtopicoNome: { $arrayElemAt: ['$subtopico.nome', 0] },
          jaResolvida: { $gt: [{ $size: '$resolucoes' }, 0] },
          ultimaResolucao: { $arrayElemAt: ['$resolucoes', 0] }
        }
      },
      {
        $project: {
          periodo: 0,
          modulo: 0,
          topico: 0,
          subtopico: 0,
          resolucoes: 0
        }
      }
    ]

    const questoes = await db.collection<BancoQuestao>('banco_questoes')
      .aggregate<BancoQuestaoComHierarquia>(pipeline)
      .toArray()

    if (questoes.length === 0) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    return NextResponse.json(
      {
        questao: questoes[0],
        gratuito: acesso.ehGratuito
          ? { restantes: restantes(acesso.gratuito), limite: acesso.gratuito.limite }
          : undefined,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    )
  } catch (error) {
    console.error('Erro ao buscar questão:', error)
    return NextResponse.json({ error: 'Erro ao buscar questão' }, { status: 500 })
  }
}
