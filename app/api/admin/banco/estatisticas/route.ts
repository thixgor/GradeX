import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { BancoEstatisticasAdmin } from '@/lib/types/banco-questoes'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const db = await getDb()

    // Total de questões
    const totalQuestoes = await db.collection('banco_questoes').countDocuments()

    // Questões por tipo
    const objetivas = await db.collection('banco_questoes').countDocuments({ tipo: 'objetiva' })
    const discursivas = await db.collection('banco_questoes').countDocuments({ tipo: 'discursiva' })

    // Questões por período
    const questoesPorPeriodo = await db.collection('banco_questoes')
      .aggregate([
        {
          $lookup: {
            from: 'banco_periodos',
            localField: 'periodoId',
            foreignField: '_id',
            as: 'periodo'
          }
        },
        { $unwind: '$periodo' },
        {
          $group: {
            _id: '$periodoId',
            periodoNome: { $first: '$periodo.nome' },
            total: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            periodoId: { $toString: '$_id' },
            periodoNome: 1,
            total: 1
          }
        },
        { $sort: { periodoNome: 1 } }
      ])
      .toArray()

    // Questões por dificuldade
    const facil = await db.collection('banco_questoes').countDocuments({ dificuldade: 'facil' })
    const medio = await db.collection('banco_questoes').countDocuments({ dificuldade: 'medio' })
    const dificil = await db.collection('banco_questoes').countDocuments({ dificuldade: 'dificil' })
    const semClassificacao = await db.collection('banco_questoes').countDocuments({
      $or: [
        { dificuldade: null },
        { dificuldade: { $exists: false } }
      ]
    })

    // Total de resoluções
    const totalResolucoes = await db.collection('banco_resolucoes').countDocuments()

    // Resoluções de hoje
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const resolucoesHoje = await db.collection('banco_resolucoes').countDocuments({
      createdAt: { $gte: hoje }
    })

    // Média de acertos (apenas objetivas)
    const acertosResult = await db.collection('banco_resolucoes')
      .aggregate([
        { $match: { tipo: 'objetiva' } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            acertos: { $sum: { $cond: ['$correta', 1, 0] } }
          }
        }
      ])
      .toArray()

    const mediaAcertos = acertosResult.length > 0 && acertosResult[0].total > 0
      ? Math.round((acertosResult[0].acertos / acertosResult[0].total) * 100)
      : 0

    const estatisticas: BancoEstatisticasAdmin = {
      totalQuestoes,
      questoesPorTipo: {
        objetiva: objetivas,
        discursiva: discursivas
      },
      questoesPorPeriodo: questoesPorPeriodo as any,
      questoesPorDificuldade: {
        facil,
        medio,
        dificil,
        semClassificacao
      },
      totalResolucoes,
      resolucoesHoje,
      mediaAcertos
    }

    return NextResponse.json({ estatisticas })
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }
}
