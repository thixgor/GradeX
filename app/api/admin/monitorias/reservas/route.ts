import { NextRequest } from 'next/server'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { resumirPresenca } from '@/lib/monitorias/sala/regras'

export const dynamic = 'force-dynamic'

/** GET ?status=em_disputa|todas — reservas para o suporte (disputas primeiro). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const status = new URL(request.url).searchParams.get('status') || 'em_disputa'
    const c = await obterColecoes()
    const filtro = status === 'todas' ? { excluidaEm: { $exists: false } } : { status, excluidaEm: { $exists: false } }
    const reservas = await c.reservas.find(filtro as any).sort({ updatedAt: -1 }).limit(100).toArray()
    const ids = reservas.map((r) => idDe(r))
    const [assentos, salas] = await Promise.all([
      c.participacoes.find({ reservaId: { $in: ids } }).toArray(),
      // Presença na sala de aula (registro mínimo): evidência para decidir "o monitor faltou".
      c.salas.find({ _id: { $in: ids } }, { projection: { registro: 1 } }).toArray(),
    ])
    const presencaPorReserva = new Map(salas.map((s) => [String(s._id), resumirPresenca(s.registro || [])]))
    return ok({
      reservas: reservas.map((r) => ({
        id: idDe(r),
        anuncioTitulo: r.anuncioTitulo,
        status: r.status,
        origem: r.origem,
        inicio: r.inicio || null,
        fim: r.fim || null,
        proposta: r.proposta || null,
        disputa: r.disputa || null,
        ticketId: r.ticketId || null,
        motivoCancelamento: r.motivoCancelamento || null,
        updatedAt: r.updatedAt,
        presenca: presencaPorReserva.get(idDe(r)) || [],
        assentos: assentos
          .filter((a) => a.reservaId === idDe(r))
          .map((a) => ({
            id: idDe(a),
            alunoNome: a.alunoNome,
            status: a.status,
            valorCentavos: a.valorCentavos,
            pagoCentavos: a.pagoCentavos ?? null,
            reembolsos: a.reembolsos,
            falta: a.falta || null,
            cancelamentoTardio: a.cancelamentoTardio || null,
          })),
      })),
    })
  })
}
