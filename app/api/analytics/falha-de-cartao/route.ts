import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth'
import { getDb } from '@/lib/mongodb'
import { checkRateLimit } from '@/lib/rate-limit'
import { getRequestAnalyticsMeta } from '@/lib/analytics'
import { registrarFalhaDeCartao } from '@/lib/payments/recusa-cartao-log'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Falha de cartão que só o NAVEGADOR do comprador vê: o Mercado Pago recusou os
 * dados na validação do cartão (antes de existir pagamento) ou o nosso servidor
 * respondeu erro ao envio. Vai para o log de recusas do DomineAqui Analytics.
 *
 * É informação do navegador — não é prova. Por isso o registro leva a origem
 * "navegador" e a rota só aceita campos de formato conhecido: dos números do
 * cartão, SÓ os 6 primeiros e os 4 últimos dígitos; qualquer outra sequência
 * longa de dígitos é apagada das mensagens. Campo fora do formato é descartado
 * sozinho (`catch`) em vez de derrubar o relato inteiro.
 *
 * Nunca atrapalha o checkout: o navegador dispara e esquece.
 */
const Schema = z.object({
  etapa: z.enum(['tokenizacao', 'envio']),
  origemDoFormulario: z.enum(['checkout', 'assinatura']),
  codigos: z.array(z.string().max(30)).max(8).catch([]),
  mensagem: z.string().max(400).optional().catch(undefined),
  httpStatus: z.number().int().min(100).max(599).optional().catch(undefined),
  codigoDoServidor: z.string().max(80).optional().catch(undefined),
  bandeira: z.string().max(30).optional().catch(undefined),
  bin: z.string().regex(/^\d{6}$/).optional().catch(undefined),
  ultimos4: z.string().regex(/^\d{4}$/).optional().catch(undefined),
  parcelas: z.number().int().min(1).max(24).optional().catch(undefined),
  valor: z.number().min(0).max(1_000_000).optional().catch(undefined),
  titularDiferente: z.boolean().optional().catch(undefined),
  deviceIdPresente: z.boolean().optional().catch(undefined),
  endpoint: z.string().max(120).optional().catch(undefined),
  produto: z.string().max(160).optional().catch(undefined),
})

/** Apaga sequências de 9+ dígitos (um número de cartão colado numa mensagem, por exemplo). */
function semDigitosLongos(texto?: string): string | undefined {
  return texto ? texto.replace(/\d[\d\s.-]{7,}\d/g, '[…]') : texto
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const rl = await checkRateLimit(ip, 'falha_de_cartao', 20, 60_000)
  if (!rl.success) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  const d = parsed.data

  const session = await getSession()
  const db = await getDb()
  await registrarFalhaDeCartao(db, {
    etapa: d.etapa,
    origem: 'navegador',
    userId: session?.userId,
    nome: session?.name,
    email: session?.email,
    produto: d.produto,
    valorCobrado: d.valor,
    navegador: {
      origemDoFormulario: d.origemDoFormulario,
      codigos: d.codigos,
      mensagem: semDigitosLongos(d.mensagem),
      httpStatus: d.httpStatus,
      codigoDoServidor: d.codigoDoServidor,
      bandeira: d.bandeira,
      bin: d.bin,
      ultimos4: d.ultimos4,
      parcelas: d.parcelas,
      valor: d.valor,
      titularDiferente: d.titularDiferente,
      deviceIdPresente: d.deviceIdPresente,
      endpoint: d.endpoint,
      produto: d.produto,
    },
    ...getRequestAnalyticsMeta(request),
  })

  return NextResponse.json({ ok: true })
}
