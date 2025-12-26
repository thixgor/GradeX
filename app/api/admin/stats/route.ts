import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const db = await getDb()
    const examsCollection = db.collection('exams')
    const usersCollection = db.collection('users')
    const submissionsCollection = db.collection('submissions')

    // Data de início do mês atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Total de provas
    const totalExams = await examsCollection.countDocuments()
    const examsThisMonth = await examsCollection.countDocuments({
      createdAt: { $gte: startOfMonth },
    })

    // Total de usuários
    const totalUsers = await usersCollection.countDocuments({ role: 'user' })
    const usersThisMonth = await usersCollection.countDocuments({
      role: 'user',
      createdAt: { $gte: startOfMonth },
    })

    // Total de submissões
    const totalSubmissions = await submissionsCollection.countDocuments()
    const submissionsThisMonth = await submissionsCollection.countDocuments({
      submittedAt: { $gte: startOfMonth },
    })

    // Média geral de pontuação (evita carregar todas as submissões em memória)
    const averageScoreAgg = await submissionsCollection
      .aggregate([
        { $match: { score: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ])
      .toArray()
    const averageScore = averageScoreAgg[0]?.avg || 0

    // Provas mais populares (com mais submissões) + título via $lookup
    const popularExamsWithTitles = await submissionsCollection
      .aggregate([
        {
          $group: {
            _id: '$examId',
            submissionCount: { $sum: 1 },
            averageScore: { $avg: '$score' },
          },
        },
        { $sort: { submissionCount: -1 } },
        { $limit: 5 },
        {
          $addFields: {
            examObjectId: {
              $convert: {
                input: '$_id',
                to: 'objectId',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'exams',
            localField: 'examObjectId',
            foreignField: '_id',
            as: 'exam',
          },
        },
        { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            title: { $ifNull: ['$exam.title', 'Prova sem título'] },
            submissionCount: 1,
            averageScore: { $ifNull: ['$averageScore', 0] },
          },
        },
      ])
      .toArray()

    // Usuários mais ativos (com mais submissões) + nome via $lookup
    const topUsersWithNames = await submissionsCollection
      .aggregate([
        {
          $group: {
            _id: '$userId',
            submissionCount: { $sum: 1 },
            averageScore: { $avg: '$score' },
          },
        },
        { $sort: { submissionCount: -1 } },
        { $limit: 5 },
        {
          $addFields: {
            userObjectId: {
              $convert: {
                input: '$_id',
                to: 'objectId',
                onError: null,
                onNull: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            name: { $ifNull: ['$user.name', 'Usuário desconhecido'] },
            submissionCount: 1,
            averageScore: { $ifNull: ['$averageScore', 0] },
          },
        },
      ])
      .toArray()

    // Atividade recente (últimos 7 dias)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59
      )

      const examsCreated = await examsCollection.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })

      const usersRegistered = await usersCollection.countDocuments({
        role: 'user',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      })

      const submissionsCompleted = await submissionsCollection.countDocuments({
        submittedAt: { $gte: startOfDay, $lte: endOfDay },
      })

      recentActivity.push({
        date: date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        }),
        examsCreated,
        usersRegistered,
        submissionsCompleted,
      })
    }

    // Distribuição de tipos de conta
    const gratuito = await usersCollection.countDocuments({
      role: 'user',
      $or: [{ accountType: 'gratuito' }, { accountType: { $exists: false } }],
    })
    const trial = await usersCollection.countDocuments({
      role: 'user',
      accountType: 'trial',
      trialExpiresAt: { $gte: now },
    })
    const premium = await usersCollection.countDocuments({
      role: 'user',
      accountType: 'premium',
    })

    // Distribuição de métodos de avaliação
    const normal = await examsCollection.countDocuments({ scoringMethod: 'normal' })
    const tri = await examsCollection.countDocuments({ scoringMethod: 'tri' })
    const discursive = await examsCollection.countDocuments({ scoringMethod: 'discursive' })

    const stats = {
      totalExams,
      totalUsers,
      totalSubmissions,
      averageScore,
      examsThisMonth,
      usersThisMonth,
      submissionsThisMonth,
      popularExams: popularExamsWithTitles,
      topUsers: topUsersWithNames,
      recentActivity,
      accountTypeDistribution: {
        gratuito,
        trial,
        premium,
      },
      examTypeDistribution: {
        normal,
        tri,
        discursive,
      },
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
