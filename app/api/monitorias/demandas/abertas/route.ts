import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { abertaAgora } from '@/lib/monitorias/demandas'
import { anuncioAtendeDemanda, chaveDaMateria } from '@/lib/monitorias/demandas-regras'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/**
 * GET — mural de pedidos para o monitor: os abertos (os da matéria dele
 * primeiro), quais ele já respondeu e os anúncios com que pode responder.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, {}, async ({ sessao }) => {
    const c = await obterColecoes()
    const [tutor, anuncios, demandas] = await Promise.all([
      c.tutores.findOne({ userId: sessao.userId }, { projection: { _id: 1, status: 1 } }),
      c.anuncios.find({ userId: sessao.userId, status: 'publicado' }, { projection: { titulo: 1, materia: 1, grupo: 1 } }).toArray(),
      c.demandas
        .find({ ...abertaAgora(), alunoId: { $ne: sessao.userId } } as any)
        .sort({ createdAt: -1 })
        .limit(60)
        .toArray(),
    ])
    const minhasChaves = new Set(anuncios.map((a) => chaveDaMateria(a.materia || '')))
    const respondidas = tutor && demandas.length
      ? await c.reservas
          .find({ 'demanda.id': { $in: demandas.map(idDe) }, tutorId: idDe(tutor) } as any, { projection: { 'demanda.id': 1 } })
          .toArray()
      : []
    const minhaResposta = new Map(respondidas.map((r) => [r.demanda!.id, idDe(r)]))
    const itens = demandas
      .map((d) => ({
        id: idDe(d),
        alunoPrimeiroNome: d.alunoPrimeiroNome,
        materia: d.materia,
        assunto: d.assunto || null,
        pessoas: d.pessoas,
        valorPorPessoaCentavos: d.valorPorPessoaCentavos,
        duracaoMin: d.duracaoMin,
        quando: d.quando,
        periodos: d.periodos,
        respostas: d.respostas,
        createdAt: d.createdAt,
        expiraEm: d.expiraEm,
        minhaMateria: minhasChaves.has(d.materiaChave),
        minhaResposta: minhaResposta.get(idDe(d)) || null,
        /** Anúncios meus que comportam o pedido (grupo grande pede anúncio com grupo). */
        anunciosQueAtendem: anuncios.filter((a) => anuncioAtendeDemanda(a as any, d).ok).map(idDe),
      }))
      .sort((a, b) => Number(b.minhaMateria) - Number(a.minhaMateria))
    return jsonComprimido(request, {
      ehMonitor: !!tutor && tutor.status === 'ativo',
      anuncios: anuncios.map((a) => ({ id: idDe(a), titulo: a.titulo, materia: a.materia, maxAlunos: a.grupo?.ativo ? a.grupo.maxAlunos : 1 })),
      itens,
    })
  })
}
