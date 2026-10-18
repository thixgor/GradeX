import { NextRequest } from 'next/server'
import { z } from 'zod'
import { audit } from '@/lib/payments/audit'
import { erro, lerJson } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { abrirEnvioDoAutoteste, rodarAutoteste } from '@/lib/monitorias/resumo/autoteste'

export const dynamic = 'force-dynamic'

const Corpo = z.discriminatedUnion('etapa', [
  z.object({ etapa: z.literal('abrir'), bytes: z.number().int() }).strict(),
  z
    .object({
      etapa: z.literal('rodar'),
      arquivo: z.string().max(80).optional(),
      nome: z.string().max(40).optional(),
      bytes: z.number().int().optional(),
      erro: z.string().max(300).optional(),
    })
    .strict(),
])

/**
 * POST — autoteste do Resumo por IA contra o Google de verdade (só admin).
 *  - `abrir`: abre a sessão de envio que o navegador do admin usa (como na sala);
 *  - `rodar`: confere o arquivo, transcreve WAV e WebM com o pedido real e apaga tudo.
 */
export async function POST(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = Corpo.safeParse(await lerJson(request))
    if (!corpo.success) return erro(400, 'Pedido inválido.')
    if (corpo.data.etapa === 'abrir') {
      const origem = request.headers.get('origin') || new URL(request.url).origin
      return ok(await abrirEnvioDoAutoteste(origem, corpo.data.bytes))
    }
    const { etapa: _etapa, ...navegador } = corpo.data
    const resultado = await rodarAutoteste(navegador)
    await audit({
      action: 'monitoria_resumo_suporte',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_resumo',
      resourceId: 'autoteste',
      metadata: { acao: 'autoteste', etapas: Object.fromEntries(resultado.etapas.map((e) => [e.etapa, e.ok])), custoUsd: resultado.custoUsd },
      ip,
    })
    return ok(resultado)
  })
}
