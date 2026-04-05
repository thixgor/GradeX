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
    const examsCol = db.collection('exams')
    const usersCol = db.collection('users')
    const subsCol = db.collection('submissions')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ─── ALL QUERIES IN PARALLEL ───────────────────────────────────
    const [
      // Basic counts
      totalExams,
      totalUsers,
      totalSubmissions,
      examsThisMonth,
      usersThisMonth,
      submissionsThisMonth,
      // Aggregations
      avgScoreResult,
      popularExams,
      topUsersAgg,
      // 30-day activity (single aggregation each instead of 7x3 loop)
      dailyExamsAgg,
      dailyUsersAgg,
      dailySubsAgg,
      // Distributions via facet
      accountDistAgg,
      examMethodDist,
      // NEW: Score distribution buckets
      scoreDistAgg,
      // NEW: Peak hours
      peakHoursAgg,
      // NEW: All users with full submission details
      allUsersDetailedAgg,
      // NEW: All exams with stats
      allExamsDetailedAgg,
      // NEW: Monthly user growth (last 12 months)
      userGrowthAgg,
      // NEW: Submissions per day-of-week
      dayOfWeekAgg,
    ] = await Promise.all([
      // --- Counts ---
      examsCol.countDocuments(),
      usersCol.countDocuments({ role: 'user' }),
      subsCol.countDocuments(),
      examsCol.countDocuments({ createdAt: { $gte: startOfMonth } }),
      usersCol.countDocuments({ role: 'user', createdAt: { $gte: startOfMonth } }),
      subsCol.countDocuments({ submittedAt: { $gte: startOfMonth } }),

      // --- Average score ---
      subsCol.aggregate([
        { $match: { score: { $exists: true, $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]).toArray(),

      // --- Popular exams (top 10) ---
      subsCol.aggregate([
        { $group: { _id: '$examId', submissionCount: { $sum: 1 }, averageScore: { $avg: '$score' }, lastSubmission: { $max: '$submittedAt' } } },
        { $sort: { submissionCount: -1 } },
        { $limit: 10 },
        { $addFields: { examObjectId: { $convert: { input: '$_id', to: 'objectId', onError: null, onNull: null } } } },
        { $lookup: { from: 'exams', localField: 'examObjectId', foreignField: '_id', as: 'exam' } },
        { $unwind: { path: '$exam', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, title: { $ifNull: ['$exam.title', 'Prova sem título'] }, submissionCount: 1, averageScore: { $ifNull: ['$averageScore', 0] }, lastSubmission: 1, scoringMethod: '$exam.scoringMethod', numberOfQuestions: '$exam.numberOfQuestions' } },
      ]).toArray(),

      // --- Top users (top 10) ---
      subsCol.aggregate([
        { $group: { _id: '$userId', submissionCount: { $sum: 1 }, averageScore: { $avg: '$score' }, lastSubmission: { $max: '$submittedAt' }, bestScore: { $max: '$score' }, worstScore: { $min: '$score' } } },
        { $sort: { submissionCount: -1 } },
        { $limit: 10 },
        { $addFields: { userObjectId: { $convert: { input: '$_id', to: 'objectId', onError: null, onNull: null } } } },
        { $lookup: { from: 'users', localField: 'userObjectId', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, name: { $ifNull: ['$user.name', 'Desconhecido'] }, email: { $ifNull: ['$user.email', ''] }, submissionCount: 1, averageScore: { $ifNull: ['$averageScore', 0] }, lastSubmission: 1, bestScore: 1, worstScore: 1, accountType: { $ifNull: ['$user.accountType', 'gratuito'] } } },
      ]).toArray(),

      // --- 30-day daily exams (single aggregation) ---
      examsCol.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]).toArray(),

      // --- 30-day daily users ---
      usersCol.aggregate([
        { $match: { role: 'user', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      ]).toArray(),

      // --- 30-day daily submissions ---
      subsCol.aggregate([
        { $match: { submittedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } }, count: { $sum: 1 } } },
      ]).toArray(),

      // --- Account type distribution (single aggregation with $facet) ---
      usersCol.aggregate([
        { $match: { role: 'user' } },
        {
          $facet: {
            gratuito: [{ $match: { $or: [{ accountType: 'gratuito' }, { accountType: { $exists: false } }] } }, { $count: 'count' }],
            trial: [{ $match: { accountType: 'trial', trialExpiresAt: { $gte: now } } }, { $count: 'count' }],
            premium: [{ $match: { accountType: 'premium' } }, { $count: 'count' }],
            essential: [{ $match: { accountType: 'essential' } }, { $count: 'count' }],
          },
        },
      ]).toArray(),

      // --- Exam method distribution ---
      examsCol.aggregate([
        { $group: { _id: '$scoringMethod', count: { $sum: 1 } } },
      ]).toArray(),

      // --- Score distribution (buckets of 10%) ---
      subsCol.aggregate([
        { $match: { score: { $exists: true, $ne: null, $gte: 0 } } },
        {
          $bucket: {
            groupBy: '$score',
            boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, Infinity],
            default: 'other',
            output: { count: { $sum: 1 } },
          },
        },
      ]).toArray(),

      // --- Peak hours (hour of day submissions happen) ---
      subsCol.aggregate([
        { $match: { submittedAt: { $exists: true } } },
        { $group: { _id: { $hour: '$submittedAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),

      // --- ALL users with their submission details ---
      usersCol.aggregate([
        { $match: { role: 'user' } },
        { $project: { name: 1, email: 1, accountType: { $ifNull: ['$accountType', 'gratuito'] }, createdAt: 1, lastLoginAt: 1, banned: 1 } },
        {
          $lookup: {
            from: 'submissions',
            let: { uid: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$userId', '$$uid'] } } },
              { $sort: { submittedAt: -1 } },
              { $project: { examId: 1, score: 1, submittedAt: 1 } },
            ],
            as: 'submissions',
          },
        },
        {
          $addFields: {
            totalSubmissions: { $size: '$submissions' },
            averageScore: { $cond: { if: { $gt: [{ $size: '$submissions' }, 0] }, then: { $avg: '$submissions.score' }, else: null } },
            bestScore: { $cond: { if: { $gt: [{ $size: '$submissions' }, 0] }, then: { $max: '$submissions.score' }, else: null } },
            lastActivity: { $arrayElemAt: ['$submissions.submittedAt', 0] },
            recentExamIds: { $slice: ['$submissions.examId', 20] },
          },
        },
        { $project: { submissions: 0 } },
        { $sort: { totalSubmissions: -1 } },
      ]).toArray(),

      // --- ALL exams with stats ---
      examsCol.aggregate([
        { $project: { title: 1, scoringMethod: 1, numberOfQuestions: 1, createdAt: 1, createdBy: 1, isHidden: 1, isPracticeExam: 1 } },
        {
          $lookup: {
            from: 'submissions',
            let: { eid: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$examId', '$$eid'] } } },
              { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$score' }, max: { $max: '$score' }, min: { $min: '$score' } } },
            ],
            as: 'stats',
          },
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1, scoringMethod: 1, numberOfQuestions: 1, createdAt: 1, createdBy: 1, isHidden: 1, isPracticeExam: 1,
            submissionCount: { $ifNull: ['$stats.count', 0] },
            averageScore: { $ifNull: ['$stats.avg', null] },
            bestScore: { $ifNull: ['$stats.max', null] },
            worstScore: { $ifNull: ['$stats.min', null] },
          },
        },
        { $sort: { submissionCount: -1 } },
      ]).toArray(),

      // --- Monthly user growth (last 12 months) ---
      usersCol.aggregate([
        { $match: { role: 'user', createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),

      // --- Submissions by day of week ---
      subsCol.aggregate([
        { $match: { submittedAt: { $exists: true } } },
        { $group: { _id: { $dayOfWeek: '$submittedAt' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]).toArray(),
    ])

    // ─── POST-PROCESS (in-memory, zero DB calls) ──────────────────

    const averageScore = avgScoreResult[0]?.avg || 0

    // Build 30-day activity map
    const examsMap = new Map(dailyExamsAgg.map((d: any) => [d._id, d.count]))
    const usersMap = new Map(dailyUsersAgg.map((d: any) => [d._id, d.count]))
    const subsMap = new Map(dailySubsAgg.map((d: any) => [d._id, d.count]))

    const recentActivity = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      recentActivity.push({
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        dateKey: key,
        examsCreated: examsMap.get(key) || 0,
        usersRegistered: usersMap.get(key) || 0,
        submissionsCompleted: subsMap.get(key) || 0,
      })
    }

    // Account distribution from facet
    const accountDist = accountDistAgg[0] || {}
    const accountTypeDistribution = {
      gratuito: accountDist.gratuito?.[0]?.count || 0,
      trial: accountDist.trial?.[0]?.count || 0,
      premium: accountDist.premium?.[0]?.count || 0,
      essential: accountDist.essential?.[0]?.count || 0,
    }

    // Exam method distribution from group
    const examMethodMap = new Map(examMethodDist.map((d: any) => [d._id, d.count]))
    const examTypeDistribution = {
      normal: examMethodMap.get('normal') || 0,
      tri: examMethodMap.get('tri') || 0,
      discursive: examMethodMap.get('discursive') || 0,
    }

    // Score distribution formatted
    const scoreLabels = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-100']
    const scoreBounds = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
    const scoreDistMap = new Map(scoreDistAgg.map((d: any) => [d._id, d.count]))
    const scoreDistribution = scoreBounds.map((b, i) => ({
      label: scoreLabels[i],
      count: scoreDistMap.get(b) || 0,
    }))

    // Peak hours formatted (0-23)
    const peakHoursMap = new Map(peakHoursAgg.map((d: any) => [d._id, d.count]))
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: peakHoursMap.get(h) || 0,
    }))

    // Day of week
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const dowMap = new Map(dayOfWeekAgg.map((d: any) => [d._id, d.count]))
    const submissionsByDayOfWeek = Array.from({ length: 7 }, (_, i) => ({
      day: dayNames[i],
      count: dowMap.get(i + 1) || 0, // MongoDB $dayOfWeek: 1=Sunday
    }))

    // Resolve exam titles for user detail examIds
    const allExamIds = new Set<string>()
    for (const u of allUsersDetailedAgg as any[]) {
      for (const eid of u.recentExamIds || []) {
        allExamIds.add(eid)
      }
    }
    // Build title map from allExamsDetailedAgg (already fetched, zero DB calls)
    const examTitleMap = new Map<string, string>()
    for (const e of allExamsDetailedAgg as any[]) {
      examTitleMap.set(e._id.toString(), e.title || 'Sem título')
    }

    // Enrich users with exam titles
    const allUsersDetailed = (allUsersDetailedAgg as any[]).map(u => ({
      ...u,
      recentExams: (u.recentExamIds || []).map((eid: string) => ({
        examId: eid,
        title: examTitleMap.get(eid) || 'Prova removida',
      })),
      recentExamIds: undefined,
    }))

    // Inactive users count (registered but 0 submissions)
    const inactiveUsers = allUsersDetailed.filter(u => u.totalSubmissions === 0).length

    // User retention: active in last 7d / active in last 30d
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const activeLast7d = allUsersDetailed.filter(u => u.lastActivity && new Date(u.lastActivity) >= sevenDaysAgo).length
    const activeLast30d = allUsersDetailed.filter(u => u.lastActivity && new Date(u.lastActivity) >= thirtyDaysAgo).length

    const stats = {
      // Overview
      totalExams,
      totalUsers,
      totalSubmissions,
      averageScore,
      examsThisMonth,
      usersThisMonth,
      submissionsThisMonth,
      // Rankings
      popularExams,
      topUsers: topUsersAgg,
      // Activity
      recentActivity,
      // Distributions
      accountTypeDistribution,
      examTypeDistribution,
      scoreDistribution,
      // Time analytics
      peakHours,
      submissionsByDayOfWeek,
      // Growth
      userGrowth: userGrowthAgg,
      // Detailed
      allUsersDetailed,
      allExamsDetailed: allExamsDetailedAgg,
      // Engagement
      inactiveUsers,
      activeLast7d,
      activeLast30d,
    }

    return NextResponse.json({ stats })
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
