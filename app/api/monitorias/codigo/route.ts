import { NextRequest } from 'next/server'
import { ObjectId } from 'mongodb'
import { z } from 'zod'
import { checkRateLimit } from '@/lib/rate-limit'
import { erro, lerJson, obterColecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { emitirCodigo, type FinalidadeCodigo } from '@/lib/monitorias/codigos'
import { enviarCodigoPorEmail } from '@/lib/monitorias/avisos'
import { carregarUsuario } from '@/lib/monitorias/servidor'

export const dynamic = 'force-dynamic'

const Corpo = z
  .object({
    finalidade: z.enum(['assinar', 'oferta', 'pix']),
    ref: z.string().max(40).optional(),
  })
  .strict()

/**
 * Envia o código de 6 dígitos para o e-mail da conta. Só envia se a pessoa
 * tem direito à ação (é parte do contrato / dona do anúncio) — o código não
 * vira um jeito de disparar e-mail para qualquer coisa.
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { limite: 'WRITE', emailVerificado: true }, async ({ sessao }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Dados inválidos.')
    const limite = await checkRateLimit(`mon-codigo:${sessao.userId}`, 'monitorias_codigo', 5, 10 * 60_000)
    if (!limite.success) return erro(429, 'Muitos códigos pedidos. Aguarde alguns minutos.')

    const c = await obterColecoes()
    const { finalidade, ref } = corpo.data
    let chave: FinalidadeCodigo
    let acao: string
    if (finalidade === 'pix') {
      chave = 'pix'
      acao = 'confirmar a troca da sua chave PIX de recebimento'
    } else {
      if (!ref || !ObjectId.isValid(ref)) return erro(400, 'Referência inválida.')
      if (finalidade === 'assinar') {
        const contrato = await c.contratos.findOne({ _id: new ObjectId(ref) } as any, { projection: { contratanteId: 1, contratadoId: 1, numero: 1, status: 1 } })
        if (!contrato || (contrato.contratanteId !== sessao.userId && contrato.contratadoId !== sessao.userId)) return erro(404, 'Não encontrado.')
        if (contrato.status !== 'aguardando_assinaturas') return erro(409, 'Este contrato não aceita mais assinaturas.')
        chave = `assinar:${ref}`
        acao = `assinar o contrato de monitoria nº ${contrato.numero}`
      } else {
        const anuncio = await c.anuncios.findOne({ _id: new ObjectId(ref), userId: sessao.userId } as any, { projection: { titulo: 1 } })
        if (!anuncio) return erro(404, 'Não encontrado.')
        chave = `oferta:${ref}`
        acao = `assinar a oferta-padrão de agendamento direto do anúncio "${anuncio.titulo}"`
      }
    }
    const user = await carregarUsuario(sessao.userId)
    if (!user?.email) return erro(400, 'Conta sem e-mail.')
    const codigo = await emitirCodigo(sessao.userId, chave)
    const enviado = await enviarCodigoPorEmail({ email: user.email, nome: user.name, codigo, finalidade: acao })
    if (!enviado) return erro(502, 'Não conseguimos enviar o e-mail agora. Tente de novo.')
    const [nome, dominio] = user.email.split('@')
    return ok({ enviado: true, para: `${nome.slice(0, 2)}***@${dominio}` })
  })
}
