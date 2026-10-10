import { NextRequest } from 'next/server'
import { z } from 'zod'
import { erro, idDe, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { requisitosDoAlunoDe } from '@/lib/monitorias/servidor'
import { pendentes } from '@/lib/monitorias/requisitos'
import { carregarAnuncioParaContratar } from '@/lib/monitorias/carregar'
import { criarSolicitacao } from '@/lib/monitorias/reservas'
import { limparTexto } from '@/lib/monitorias/validacao'
import { mascararContato } from '@/lib/monitorias/contato'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    modo: z.enum(['negociacao', 'a_combinar']),
    mensagem: z.string().min(10).max(2000),
    vagas: z.number().int().min(1).max(30),
    conteudos: z.array(z.string().max(60)).max(20),
    gratis: z.boolean(),
  })
  .strict()

/** POST — abre um pedido de monitoria (negociação ou "a combinar"). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return rotaAutenticada(request, { limite: { limit: 10, windowMs: 60 * 60_000 }, emailVerificado: true }, async ({ sessao }) => {
    // Por pessoa, somando todos os anúncios: cada pedido manda e-mail ao monitor.
    const lim = await checkRateLimit(`mon-solic:${sessao.userId}`, 'monitorias_solicitar', 15, 60 * 60_000)
    if (!lim.success) return erro(429, 'Muitos pedidos em pouco tempo. Tente de novo mais tarde.')
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Confira os dados do pedido (mensagem com pelo menos 10 caracteres).')
    const req = await requisitosDoAlunoDe(sessao.userId)
    if (!req.ok || !req.user) {
      return erro(409, 'Complete seu cadastro para contratar monitorias.', { pendentes: pendentes(req.itens).filter((i) => i.chave !== 'termos') })
    }
    const { anuncio, tutor, monitor } = await carregarAnuncioParaContratar(params.id)
    const reserva = await criarSolicitacao({
      anuncio,
      tutor,
      aluno: req.user,
      monitor,
      modo: corpo.data.modo,
      mensagem: mascararContato(limparTexto(corpo.data.mensagem)).texto,
      vagas: corpo.data.vagas,
      conteudos: corpo.data.conteudos.map(limparTexto).filter(Boolean).filter((x) => anuncio.conteudos.includes(x)),
      gratis: corpo.data.gratis,
    })
    return ok({ reservaId: idDe(reserva) }, 201)
  })
}
