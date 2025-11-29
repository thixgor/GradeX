import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('GradeX')
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

    // Média geral de pontuação
    const submissionsWithScore = await submissionsCollection
      .find({ score: { $exists: true, $ne: null } })
      .toArray()
    const averageScore =
      submissionsWithScore.length > 0
        ? submissionsWithScore.reduce((sum, sub) => sum + (sub.score || 0), 0) /
          submissionsWithScore.length
        : 0

    // Provas mais populares (com mais submissões)
    const popularExams = await submissionsCollection
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
      ])
      .toArray()

    // Buscar títulos das provas populares
    const popularExamsWithTitles = await Promise.all(
      popularExams.map(async (exam) => {
        const examDoc = await examsCollection.findOne({ _id: exam._id })
        return {
          _id: exam._id,
          title: examDoc?.title || 'Prova sem título',
          submissionCount: exam.submissionCount,
          averageScore: exam.averageScore || 0,
        }
      })
    )

    // Usuários mais ativos (com mais submissões)
    const topUsers = await submissionsCollection
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
      ])
      .toArray()

    // Buscar nomes dos usuários
    const topUsersWithNames = await Promise.all(
      topUsers.map(async (user) => {
        const userDoc = await usersCollection.findOne({ _id: user._id })
        return {
          _id: user._id,
          name: userDoc?.name || 'Usuário desconhecido',
          submissionCount: user.submissionCount,
          averageScore: user.averageScore || 0,
        }
      })
    )

    // Atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

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
