import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { User } from '@/lib/types'
import { BancoEstatisticasUsuario } from '@/lib/types/banco-questoes'

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

    if (user.role !== 'admin' && user.accountType !== 'premium') {
      return NextResponse.json({
        error: 'Acesso restrito a usuários Premium',
        requiresPremium: true
      }, { status: 403 })
    }

    const userId = new ObjectId(session.userId)

    // Estatísticas gerais
    const totalResolvidas = await db.collection('banco_resolucoes')
      .countDocuments({ userId })

    const totalAcertos = await db.collection('banco_resolucoes')
      .countDocuments({ userId, correta: true })

    const totalErros = await db.collection('banco_resolucoes')
      .countDocuments({ userId, correta: false, tipo: 'objetiva' })

    // Questões por período
    const questoesPorPeriodo = await db.collection('banco_resolucoes')
      .aggregate([
        { $match: { userId } },
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
            acertos: {
              $sum: {
                $cond: [{ $eq: ['$correta', true] }, 1, 0]
              }
            }
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
      ])
      .toArray()

    // Questões por tipo
    const questoesPorTipo = await db.collection('banco_resolucoes')
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$tipo',
            total: { $sum: 1 },
            acertos: {
              $sum: {
                $cond: [{ $eq: ['$correta', true] }, 1, 0]
              }
            }
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
      ])
      .toArray()

    // Últimas resoluções
    const ultimasResolucoes = await db.collection('banco_resolucoes')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    const estatisticas: BancoEstatisticasUsuario = {
      totalResolvidas,
      totalAcertos,
      totalErros,
      percentualAcerto: totalResolvidas > 0 ? Math.round((totalAcertos / totalResolvidas) * 100) : 0,
      questoesPorPeriodo: questoesPorPeriodo as any,
      questoesPorTipo: questoesPorTipo as any,
      ultimasResolucoes: ultimasResolucoes as any
    }

    return NextResponse.json({ estatisticas })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
