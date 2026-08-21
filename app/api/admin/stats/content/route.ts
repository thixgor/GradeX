import { NextRequest, NextResponse } from 'next/server'
import {
  andFilters,
  dateMatch,
  parseRange,
  requireAdmin,
} from '@/lib/admin-stats/common'
import { ACTIVITY_COLLECTION, ACTIVITY_KIND_LABELS } from '@/lib/tracking/activity-events'

export const dynamic = 'force-dynamic'

const DOWNLOAD_TYPE_LABELS: Record<string, string> = {
  exam_pdf: 'Prova (PDF)',
  gabarito_pdf: 'Gabarito',
  exam_answers_pdf: 'Prova + Gabarito',
  group_pdf: 'Grupo (PDF)',
  patologia_pdf: 'Patologia (PDF)',
  manual_completo_pdf: 'Manual Completo',
  student_answers_pdf: 'Minhas Respostas',
  annotations_pdf: 'Anotações',
}

/**
 * Conteúdo: quem abriu o quê, no Manual Clínico, nos materiais e no resto.
 *
 * Cruza três fontes que antes viviam separadas — as aberturas
 * (`activity_events`), os acessos ao leitor de PDF/HTML
 * (`material_*_viewer_logs`) e os downloads (`download_logs`) — para que uma
 * patologia muito lida e pouco baixada não pareça inativa.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok || !guard.db) return guard.response!
  const db = guard.db

  try {
    const range = parseRange(request.nextUrl.searchParams)
    const events = db.collection(ACTIVITY_COLLECTION)
    const downloads = db.collection('download_logs')

    const rankingStage = [
      {
        $group: {
          _id: '$resourceId',
          titulo: { $last: '$resourceTitle' },
          aberturas: { $sum: 1 },
          leitores: { $addToSet: '$userId' },
          ultima: { $max: '$createdAt' },
        },
      },
      { $project: { titulo: 1, aberturas: 1, ultima: 1, leitores: { $size: '$leitores' } } },
      { $sort: { aberturas: -1 } },
      { $limit: 30 },
    ]

    const [
      patologiasRanking,
      materiaisRanking,
      areaResumo,
      kindResumo,
      totalPatologias,
      patologiasPorArea,
      patologiasPorSistema,
      totalMateriais,
      downloadsPorTipo,
      topDownloads,
      downloadsPorUsuario,
      leitorPdfLogs,
      leitorHtmlLogs,
      feed,
      seriePorArea,
    ] = await Promise.all([
      events
        .aggregate([
          { $match: andFilters({ kind: 'manual_patologia_open' }, dateMatch('createdAt', range)) },
          ...rankingStage,
        ])
        .toArray(),
      events
        .aggregate([
          { $match: andFilters({ kind: 'material_open' }, dateMatch('createdAt', range)) },
          ...rankingStage,
        ])
        .toArray(),
      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          {
            $group: {
              _id: { $ifNull: ['$area', 'Outros'] },
              aberturas: { $sum: 1 },
              leitores: { $addToSet: '$userId' },
            },
          },
          { $project: { aberturas: 1, leitores: { $size: '$leitores' } } },
          { $sort: { aberturas: -1 } },
        ])
        .toArray(),
      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          { $group: { _id: '$kind', aberturas: { $sum: 1 }, leitores: { $addToSet: '$userId' } } },
          { $project: { aberturas: 1, leitores: { $size: '$leitores' } } },
          { $sort: { aberturas: -1 } },
        ])
        .toArray(),

      db.collection('patologias').countDocuments(),
      db
        .collection('patologias')
        .aggregate([
          { $unwind: { path: '$areas', preserveNullAndEmptyArrays: true } },
          { $group: { _id: { $ifNull: ['$areas', 'Não definida'] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      db
        .collection('patologias')
        .aggregate([
          { $group: { _id: { $ifNull: ['$sistema', 'Não definido'] }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 30 },
        ])
        .toArray(),
      db.collection('materials').countDocuments(),

      downloads
        .aggregate([
          { $match: dateMatch('downloadedAt', range) },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])
        .toArray(),
      downloads
        .aggregate([
          { $match: andFilters(dateMatch('downloadedAt', range), { resourceId: { $ne: '' } }) },
          {
            $group: {
              _id: { tipo: '$type', resourceId: '$resourceId' },
              titulo: { $last: '$resourceTitle' },
              count: { $sum: 1 },
              ultimo: { $max: '$downloadedAt' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 25 },
        ])
        .toArray(),
      downloads
        .aggregate([
          { $match: dateMatch('downloadedAt', range) },
          {
            $group: {
              _id: '$userId',
              nome: { $last: '$userName' },
              email: { $last: '$userEmail' },
              count: { $sum: 1 },
              ultimo: { $max: '$downloadedAt' },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 25 },
        ])
        .toArray(),

      // Abrir o leitor é um sinal mais forte que abrir a página do material.
      db
        .collection('material_pdf_viewer_logs')
        .aggregate([
          { $match: andFilters({ action: 'viewer_open' }, dateMatch('createdAt', range)) },
          {
            $group: {
              _id: '$materialId',
              titulo: { $last: '$materialTitle' },
              aberturas: { $sum: 1 },
              leitores: { $addToSet: '$userId' },
              ultima: { $max: '$createdAt' },
            },
          },
          { $project: { titulo: 1, aberturas: 1, ultima: 1, leitores: { $size: '$leitores' } } },
          { $sort: { aberturas: -1 } },
          { $limit: 25 },
        ])
        .toArray(),
      db
        .collection('material_html_viewer_logs')
        .aggregate([
          { $match: dateMatch('ts', range) },
          {
            $group: {
              _id: '$materialId',
              titulo: { $last: '$materialTitle' },
              aberturas: { $sum: 1 },
              leitores: { $addToSet: '$userId' },
              ultima: { $max: '$ts' },
            },
          },
          { $project: { titulo: 1, aberturas: 1, ultima: 1, leitores: { $size: '$leitores' } } },
          { $sort: { aberturas: -1 } },
          { $limit: 25 },
        ])
        .toArray(),

      // Feed "quem abriu o quê" — o pedido mais direto do painel.
      events.find(dateMatch('createdAt', range) as any).sort({ createdAt: -1 }).limit(120).toArray(),

      events
        .aggregate([
          { $match: dateMatch('createdAt', range) },
          {
            $group: {
              _id: {
                dia: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                area: { $ifNull: ['$area', 'Outros'] },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.dia': 1 } },
        ])
        .toArray(),
    ])

    const rank = (rows: any[]) =>
      rows.map(r => ({
        resourceId: String(r._id ?? ''),
        titulo: r.titulo || String(r._id ?? '—'),
        aberturas: r.aberturas,
        leitores: r.leitores,
        ultima: r.ultima || null,
      }))

    return NextResponse.json({
      range: { key: range.key, label: range.label },
      resumo: {
        totalPatologias,
        totalMateriais,
        aberturasNoPeriodo: (areaResumo as any[]).reduce((s, a) => s + a.aberturas, 0),
        downloadsNoPeriodo: (downloadsPorTipo as any[]).reduce((s, d) => s + d.count, 0),
      },
      porArea: (areaResumo as any[]).map(a => ({
        area: a._id,
        aberturas: a.aberturas,
        leitores: a.leitores,
      })),
      porTipo: (kindResumo as any[]).map(k => ({
        kind: k._id,
        rotulo: ACTIVITY_KIND_LABELS[k._id] || k._id,
        aberturas: k.aberturas,
        leitores: k.leitores,
      })),
      manualClinico: {
        maisAbertas: rank(patologiasRanking as any[]),
        porArea: (patologiasPorArea as any[]).map(a => ({ label: a._id, count: a.count })),
        porSistema: (patologiasPorSistema as any[]).map(s => ({ label: s._id, count: s.count })),
      },
      materiais: {
        maisAbertos: rank(materiaisRanking as any[]),
        leitorPdf: rank(leitorPdfLogs as any[]),
        leitorHtml: rank(leitorHtmlLogs as any[]),
      },
      downloads: {
        porTipo: (downloadsPorTipo as any[]).map(d => ({
          tipo: d._id,
          rotulo: DOWNLOAD_TYPE_LABELS[d._id] || d._id || 'Outro',
          count: d.count,
        })),
        maisBaixados: (topDownloads as any[]).map(d => ({
          tipo: d._id?.tipo,
          rotulo: DOWNLOAD_TYPE_LABELS[d._id?.tipo] || d._id?.tipo || 'Outro',
          resourceId: d._id?.resourceId,
          titulo: d.titulo || d._id?.resourceId || '—',
          count: d.count,
          ultimo: d.ultimo,
        })),
        porUsuario: (downloadsPorUsuario as any[]).map(u => ({
          userId: u._id,
          nome: u.nome || 'Desconhecido',
          email: u.email || '',
          count: u.count,
          ultimo: u.ultimo,
        })),
      },
      feed: (feed as any[]).map(e => ({
        userId: e.userId,
        nome: e.userName || 'Visitante',
        email: e.userEmail || '',
        plano: e.accountType || 'gratuito',
        kind: e.kind,
        rotulo: ACTIVITY_KIND_LABELS[e.kind] || e.kind,
        area: e.area || 'Outros',
        titulo: e.resourceTitle || e.resourceId || '—',
        resourceId: e.resourceId || '',
        dispositivo: e.device || 'desconhecido',
        em: e.createdAt,
      })),
      seriePorArea: (seriePorArea as any[]).map(r => ({
        dia: r._id?.dia,
        area: r._id?.area,
        count: r.count,
      })),
    })
  } catch (error: any) {
    console.error('[stats/content]', error)
    return NextResponse.json({ error: error?.message || 'Erro ao carregar conteúdo' }, { status: 500 })
  }
}
