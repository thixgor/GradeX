import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoEstatisticasUsuario } from '@/lib/types/banco-questoes'
import { isPlusAccount } from '@/lib/account-tier'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const db = await getDb()

    // Verificar se usuário é premium ou admin
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(session.userId) })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    if (user.role !== 'admin' && !isPlusAccount(user.accountType)) {
      return NextResponse.json({
        error: 'Acesso restrito a assinantes Plus+',
        requiresPlus: true
      }, { status: 403 })
    }

    const userId = new ObjectId(session.userId)

    // Single $facet aggregation — replaces 6 sequential DB queries with 1 round trip
    const [facetResult] = await db.collection('banco_resolucoes')
      .aggregate([
        { $match: { userId } },
        {
          $facet: {
            // Contagens gerais
            counts: [
              {
                $group: {
                  _id: null,
                  totalResolvidas: { $sum: 1 },
                  totalAcertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } },
                  totalErros: {
                    $sum: {
                      $cond: [
                        { $and: [{ $eq: ['$correta', false] }, { $eq: ['$tipo', 'objetiva'] }] },
                        1, 0
                      ]
                    }
                  }
                }
              }
            ],
            // Questões por período
            questoesPorPeriodo: [
              {
                $lookup: {
                  from: 'banco_questoes',
                  localField: 'questaoId',
                  foreignField: '_id',
                  as: 'questao'
                }
              },
              { $unwind: '$questao' },
              {
                $lookup: {
                  from: 'banco_periodos',
                  localField: 'questao.periodoId',
                  foreignField: '_id',
                  as: 'periodo'
                }
              },
              { $unwind: '$periodo' },
              {
                $group: {
                  _id: '$questao.periodoId',
                  periodoNome: { $first: '$periodo.nome' },
                  total: { $sum: 1 },
                  acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  periodoId: { $toString: '$_id' },
                  periodoNome: 1,
                  total: 1,
                  acertos: 1
                }
              }
            ],
            // Questões por tipo
            questoesPorTipo: [
              {
                $group: {
                  _id: '$tipo',
                  total: { $sum: 1 },
                  acertos: { $sum: { $cond: [{ $eq: ['$correta', true] }, 1, 0] } }
                }
              },
              {
                $project: {
                  _id: 0,
                  tipo: '$_id',
                  total: 1,
                  acertos: 1
                }
              }
            ],
            // Últimas resoluções
            ultimasResolucoes: [
              { $sort: { createdAt: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ])
      .toArray()

    const counts = facetResult.counts[0] || { totalResolvidas: 0, totalAcertos: 0, totalErros: 0 }
    const { totalResolvidas, totalAcertos, totalErros } = counts

    const estatisticas: BancoEstatisticasUsuario = {
      totalResolvidas,
      totalAcertos,
      totalErros,
      percentualAcerto: totalResolvidas > 0 ? Math.round((totalAcertos / totalResolvidas) * 100) : 0,
      questoesPorPeriodo: facetResult.questoesPorPeriodo as any,
      questoesPorTipo: facetResult.questoesPorTipo as any,
      ultimasResolucoes: facetResult.ultimasResolucoes as any
    }

    return NextResponse.json({ estatisticas })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
