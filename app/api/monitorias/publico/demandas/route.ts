import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaPublica } from '@/lib/monitorias/rota'
import { abertaAgora } from '@/lib/monitorias/demandas'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/**
 * GET — "alunos procurando monitor agora", para a vitrine de quem quer ensinar.
 * Sem nome nem conta: só o que foi pedido. O CDN segura 60 s.
 */
export async function GET(request: NextRequest) {
  return rotaPublica(request, { limit: 60, windowMs: 60_000 }, async () => {
    const c = await obterColecoes()
    const filtro = abertaAgora()
    const [total, recentes] = await Promise.all([
      c.demandas.countDocuments(filtro as any),
      c.demandas
        .find(filtro as any, { projection: { materia: 1, assunto: 1, pessoas: 1, valorPorPessoaCentavos: 1, duracaoMin: 1, quando: 1, periodos: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray(),
    ])
    return jsonComprimido(
      request,
      {
        total,
        recentes: recentes.map((d) => ({
          id: idDe(d),
          materia: d.materia,
          assunto: d.assunto || null,
          pessoas: d.pessoas,
          valorPorPessoaCentavos: d.valorPorPessoaCentavos,
          duracaoMin: d.duracaoMin,
          quando: d.quando,
          periodos: d.periodos,
          createdAt: d.createdAt,
        })),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  })
}
