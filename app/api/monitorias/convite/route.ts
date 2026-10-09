import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, idDe, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { entrarNoGrupo } from '@/lib/monitorias/reservas'
import { requisitosDoAlunoDe } from '@/lib/monitorias/servidor'
import { pendentes } from '@/lib/monitorias/requisitos'

export const dynamic = 'force-dynamic'

const CODIGO = /^[A-Za-z0-9_-]{8,20}$/

/** GET ?codigo= — prévia do grupo (para a tela de convite). */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { limite: { limit: 30, windowMs: 60_000 } }, async () => {
    const codigo = new URL(request.url).searchParams.get('codigo') || ''
    if (!CODIGO.test(codigo)) return erro(404, 'Convite inválido.')
    const c = await obterColecoes()
    const reserva = await c.reservas.findOne({ codigoConvite: codigo })
    if (!reserva?.proposta) return erro(404, 'Convite inválido.')
    const [ocupados, tutor] = await Promise.all([
      c.participacoes.countDocuments({ reservaId: idDe(reserva), status: { $nin: ['expirada', 'cancelada', 'reembolsada'] } }),
      c.tutores.findOne({ userId: reserva.tutorUserId }, { projection: { nome: 1, fotoUrl: 1 } }),
    ])
    return ok({
      reservaId: idDe(reserva),
      anuncioTitulo: reserva.anuncioTitulo,
      monitor: tutor ? { nome: tutor.nome, fotoUrl: tutor.fotoUrl || null } : null,
      inicio: reserva.proposta.inicio,
      duracaoMin: reserva.proposta.duracaoMin,
      valorPorPessoaCentavos: reserva.proposta.valorPorPessoaCentavos,
      vagas: reserva.proposta.vagas,
      ocupados,
      aberto: reserva.status === 'aguardando_pagamento' && !!reserva.prazoPagamento && reserva.prazoPagamento > new Date() && ocupados < reserva.proposta.vagas,
      prazoPagamento: reserva.prazoPagamento || null,
    })
  })
}

/** POST {codigo} — entra no grupo (cria o assento e o contrato do aluno). */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { limite: { limit: 10, windowMs: 10 * 60_000 }, emailVerificado: true }, async ({ sessao }) => {
    const corpo = z.object({ codigo: z.string().regex(CODIGO) }).strict().safeParse(await lerJson(request))
    if (!corpo.success) return erro(404, 'Convite inválido.')
    const req = await requisitosDoAlunoDe(sessao.userId)
    if (!req.ok || !req.user) return erro(409, 'Complete seu cadastro para entrar no grupo.', { pendentes: pendentes(req.itens).filter((i) => i.chave !== 'termos') })
    const { reserva, contrato } = await entrarNoGrupo({ codigo: corpo.data.codigo, aluno: req.user })
    return ok({ reservaId: idDe(reserva), contratoId: idDe(contrato) }, 201)
  })
}
