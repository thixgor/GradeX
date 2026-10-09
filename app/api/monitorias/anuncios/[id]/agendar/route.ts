import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { requisitosDoAlunoDe } from '@/lib/monitorias/servidor'
import { pendentes } from '@/lib/monitorias/requisitos'
import { carregarAnuncioParaContratar } from '@/lib/monitorias/carregar'
import { agendarDireto } from '@/lib/monitorias/reservas'
import { limparTexto } from '@/lib/monitorias/validacao'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    inicio: z.string().datetime(),
    duracaoMin: z.number().int().min(15).max(480),
    vagas: z.number().int().min(1).max(30),
    gratis: z.boolean(),
    conteudos: z.array(z.string().max(60)).max(20),
  })
  .strict()

/**
 * POST — agendamento direto: trava o horário (30 min para assinar e pagar),
 * emite o contrato já com a assinatura da oferta-padrão do monitor e devolve
 * o id da reserva para o checkout.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 10, windowMs: 10 * 60_000 }, emailVerificado: true }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Escolha um horário e uma duração válidos.')
    const req = await requisitosDoAlunoDe(sessao.userId)
    if (!req.ok || !req.user) {
      return erro(409, 'Complete seu cadastro para contratar monitorias.', { pendentes: pendentes(req.itens).filter((i) => i.chave !== 'termos') })
    }
    const { anuncio, tutor, monitor } = await carregarAnuncioParaContratar(params.id)
    const { reserva, contrato } = await agendarDireto({
      anuncio,
      tutor,
      aluno: req.user,
      monitor,
      inicio: new Date(corpo.data.inicio),
      duracaoMin: corpo.data.duracaoMin,
      vagas: corpo.data.vagas,
      gratis: corpo.data.gratis,
      conteudos: corpo.data.conteudos.map(limparTexto).filter((x) => anuncio.conteudos.includes(x)),
    })
    return ok({ reservaId: idDe(reserva), contratoId: idDe(contrato) }, 201)
  })
}
