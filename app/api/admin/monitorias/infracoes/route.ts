import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { jsonComprimido } from '@/lib/resposta-comprimida'

export const dynamic = 'force-dynamic'

/**
 * GET ?filtro=novas|todas&userId= — tentativas de passar contato ou combinar
 * por fora (o que o chat recusou e o que só citou outro canal), com quantas
 * cada pessoa teve nos últimos 30 dias para o suporte enxergar reincidência.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const busca = new URL(request.url).searchParams
    const filtro: Record<string, unknown> = {}
    if (busca.get('filtro') !== 'todas') filtro.vistaEm = null
    const userId = busca.get('userId')
    if (userId && /^[a-f0-9]{24}$/i.test(userId)) filtro.userId = userId
    const c = await obterColecoes()
    const itens = await c.infracoes.find(filtro as any).sort({ createdAt: -1 }).limit(150).toArray()
    const pessoas = Array.from(new Set(itens.map((i) => i.userId)))
    const reservaIds = Array.from(new Set(itens.map((i) => i.reservaId))).filter((r) => /^[a-f0-9]{24}$/i.test(r))
    const [porPessoa, reservas] = await Promise.all([
      c.infracoes
        .aggregate<{ _id: string; bloqueios: number }>([
          { $match: { userId: { $in: pessoas }, nivel: 'bloqueio', createdAt: { $gt: new Date(Date.now() - 30 * 24 * 3600_000) } } },
          { $group: { _id: '$userId', bloqueios: { $sum: 1 } } },
        ])
        .toArray(),
      c.reservas.find({ _id: { $in: reservaIds.map((r) => new ObjectId(r)) } } as any, { projection: { anuncioTitulo: 1, status: 1 } }).toArray(),
    ])
    const reincidencia = new Map(porPessoa.map((p) => [p._id, p.bloqueios]))
    const reservaDe = new Map(reservas.map((r) => [idDe(r), r]))
    return jsonComprimido(request, {
      itens: itens.map((i) => ({
        id: idDe(i),
        reservaId: i.reservaId,
        curto: i.reservaId.slice(-6).toUpperCase(),
        titulo: reservaDe.get(i.reservaId)?.anuncioTitulo || '',
        userId: i.userId,
        nome: i.nome,
        papel: i.papel,
        origem: i.origem,
        nivel: i.nivel,
        categorias: i.categorias,
        trechos: i.trechos,
        texto: i.texto,
        createdAt: i.createdAt,
        vista: !!i.vistaEm,
        bloqueios30d: reincidencia.get(i.userId) || 0,
      })),
    })
  })
}

const Marcar = z.union([z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/i)).min(1).max(200) }).strict(), z.object({ todas: z.literal(true) }).strict()])

/** POST {ids} | {todas: true} — marca como vistas (some do contador da aba). */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao }) => {
    const corpo = Marcar.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Nada para marcar.')
    const c = await obterColecoes()
    const filtro = 'ids' in corpo.data ? { _id: { $in: corpo.data.ids.map((i) => new ObjectId(i)) }, vistaEm: null } : { vistaEm: null }
    const r = await c.infracoes.updateMany(filtro as any, { $set: { vistaEm: new Date(), vistaPor: sessao.userId } })
    return ok({ marcadas: r.modifiedCount })
  })
}
