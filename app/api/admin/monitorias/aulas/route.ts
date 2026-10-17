import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { idDe, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada } from '@/lib/monitorias/rota'
import { jsonComprimido } from '@/lib/resposta-comprimida'
import { presente, resumirPresenca } from '@/lib/monitorias/sala/regras'
import { salaParaOSuporte } from '@/lib/monitorias/sala/servidor'
import { inicioDoDiaEmBrasilia, inicioDoDiaSeguinteEmBrasilia } from '@/lib/fuso-brasilia'

export const dynamic = 'force-dynamic'

type Filtro = 'ao_vivo' | 'hoje' | 'proximas' | 'todas'

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * GET ?filtro=ao_vivo|hoje|proximas|todas&q= — as aulas para o suporte agir:
 * quem está na sala agora, presença, tentativas de contato e o estado da sala.
 * `q` aceita o id completo, os 6 últimos caracteres do id (#A1B2C3), o título
 * do anúncio ou o nome de um aluno.
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const busca = new URL(request.url).searchParams
    const filtro = (['ao_vivo', 'hoje', 'proximas', 'todas'].includes(busca.get('filtro') || '') ? busca.get('filtro') : 'ao_vivo') as Filtro
    const q = (busca.get('q') || '').trim().replace(/^#/, '').slice(0, 80)
    const agora = new Date()
    const c = await obterColecoes()

    const condicoes: Record<string, unknown>[] = []
    if (q) {
      if (/^[a-f0-9]{24}$/i.test(q)) condicoes.push({ _id: new ObjectId(q) })
      else {
        const ou: Record<string, unknown>[] = [{ anuncioTitulo: { $regex: escapar(q), $options: 'i' } }]
        if (/^[a-f0-9]{4,8}$/i.test(q)) ou.push({ $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${escapar(q.toLowerCase())}$` } } })
        const porAluno = await c.participacoes
          .find({ alunoNome: { $regex: escapar(q), $options: 'i' } }, { projection: { reservaId: 1 } })
          .limit(100)
          .toArray()
        if (porAluno.length) ou.push({ _id: { $in: porAluno.map((p) => new ObjectId(p.reservaId)) } })
        condicoes.push({ $or: ou })
      }
    }

    let ordem: Record<string, 1 | -1> = { inicio: -1 }
    if (!q && filtro === 'ao_vivo') {
      const salas = await c.salas.find({ fim: { $gt: new Date(agora.getTime() - 30 * 60_000) } }, { projection: { participantes: 1 } }).limit(500).toArray()
      const vivas = salas.filter((s) => Object.values(s.participantes || {}).some((p) => presente(p, agora))).map((s) => new ObjectId(String(s._id)))
      condicoes.push({ _id: { $in: vivas } })
    } else if (!q && filtro === 'hoje') {
      condicoes.push({ inicio: { $gte: inicioDoDiaEmBrasilia(agora), $lt: inicioDoDiaSeguinteEmBrasilia(agora) } })
      ordem = { inicio: 1 }
    } else if (!q && filtro === 'proximas') {
      condicoes.push({ inicio: { $gt: agora }, status: { $in: ['confirmada', 'aguardando_pagamento', 'aguardando_assinaturas'] } })
      ordem = { inicio: 1 }
    }

    const reservas = await c.reservas
      .find(condicoes.length ? ({ $and: condicoes } as any) : {}, {
        projection: { anuncioTitulo: 1, status: 1, inicio: 1, fim: 1, tutorUserId: 1, tutorId: 1, solicitanteId: 1, motivoCancelamento: 1, disputa: 1, linkReuniao: 1 },
      })
      .sort(ordem)
      .limit(60)
      .toArray()
    const ids = reservas.map((r) => idDe(r))
    const tutorIds = Array.from(new Set(reservas.map((r) => r.tutorId).filter((t) => /^[a-f0-9]{24}$/i.test(t))))
    const [assentos, salas, tutores, infracoes] = await Promise.all([
      c.participacoes.find({ reservaId: { $in: ids } }, { projection: { reservaId: 1, alunoId: 1, alunoNome: 1, status: 1, valorCentavos: 1 } }).toArray(),
      c.salas
        .find({ _id: { $in: ids } }, { projection: { participantes: 1, encerradaEm: 1, encerradaPeloSuporte: 1, removidos: 1, permissoes: 1, registro: 1 } })
        .toArray(),
      c.tutores.find({ _id: { $in: tutorIds.map((t) => new ObjectId(t)) } } as any, { projection: { nome: 1 } }).toArray(),
      c.infracoes
        .aggregate<{ _id: string; total: number; bloqueios: number }>([
          { $match: { reservaId: { $in: ids } } },
          { $group: { _id: '$reservaId', total: { $sum: 1 }, bloqueios: { $sum: { $cond: [{ $eq: ['$nivel', 'bloqueio'] }, 1, 0] } } } },
        ])
        .toArray(),
    ])
    const salaDe = new Map(salas.map((s) => [String(s._id), s]))
    const nomeDoTutor = new Map(tutores.map((t) => [idDe(t), t.nome]))
    const infracoesDe = new Map(infracoes.map((i) => [i._id, i]))
    return jsonComprimido(request, {
      aulas: reservas.map((r) => {
        const id = idDe(r)
        const sala = salaDe.get(id)
        return {
          id,
          curto: id.slice(-6).toUpperCase(),
          titulo: r.anuncioTitulo,
          status: r.status,
          inicio: r.inicio || null,
          fim: r.fim || null,
          monitor: nomeDoTutor.get(r.tutorId) || 'Monitor',
          motivoCancelamento: r.motivoCancelamento || null,
          disputa: r.disputa ? { motivo: r.disputa.motivo, em: r.disputa.em } : null,
          temLinkExterno: !!r.linkReuniao,
          alunos: assentos.filter((a) => a.reservaId === id).map((a) => ({ id: idDe(a), nome: a.alunoNome, status: a.status, valorCentavos: a.valorCentavos })),
          sala: sala ? salaParaOSuporte(sala, agora) : null,
          presenca: sala ? resumirPresenca(sala.registro || []) : [],
          infracoes: infracoesDe.get(id) ? { total: infracoesDe.get(id)!.total, bloqueios: infracoesDe.get(id)!.bloqueios } : { total: 0, bloqueios: 0 },
        }
      }),
    })
  })
}
