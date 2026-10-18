import { NextRequest } from 'next/server'
import { audit } from '@/lib/payments/audit'
import { getDb } from '@/lib/mongodb'
import { erro, lerJson, colecoes } from '@/lib/monitorias/db'
import { rotaAutenticada, ok } from '@/lib/monitorias/rota'
import { mesDoUso } from '@/lib/monitorias/sala/config'
import { cambioAtual } from '@/lib/monitorias/resumo/cambio'
import { configDoResumo, salvarConfigDoResumo } from '@/lib/monitorias/resumo/config'
import { CONFIG_RESUMO_PADRAO, cambioEfetivo, lucroDoPeriodo, precoDoResumo, vendaLiberada } from '@/lib/monitorias/resumo/regras'
import { chaveGeminiDoResumo } from '@/lib/ia/gemini'
import { getPaymentConfig } from '@/lib/payments/config'

export const dynamic = 'force-dynamic'

const DURACOES = [30, 60, 90, 120, 180]

/**
 * GET — config, câmbio em uso, prévia de preço (com custo e lucro) por
 * duração, consumo e lucro do mês, e o split do sócio quando configurado (a
 * parte comissionável inclui o adicional, salvo "fora da comissão do sócio").
 */
export async function GET(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async () => {
    const config = await configDoResumo()
    const agora = new Date()
    const [cambio, chave, uso] = await Promise.all([
      cambioAtual(config, agora),
      chaveGeminiDoResumo(),
      colecoes(await getDb()).resumosUso.findOne({ _id: mesDoUso(agora) }),
    ])
    const previa = DURACOES.map((duracaoMin) => ({
      duracaoMin,
      individual: precoDoResumo({ duracaoMin, individual: true, config, brlPorUsd: cambio.brlPorUsd, dataDaAula: agora }),
      grupo: precoDoResumo({ duracaoMin, individual: false, config, brlPorUsd: cambio.brlPorUsd, dataDaAula: agora }),
    }))
    const vendasCentavos = uso?.vendasCentavos || 0
    const reembolsosCentavos = uso?.reembolsosCentavos || 0
    const realUsd = uso?.realUsd || 0
    const { split } = getPaymentConfig().mp
    return ok({
      config,
      padrao: CONFIG_RESUMO_PADRAO,
      liberada: vendaLiberada(config),
      chaveConfigurada: !!chave,
      cambio,
      previa,
      uso: {
        realUsd,
        chamadas: uso?.chamadas || 0,
        aulas: uso?.aulas || 0,
        vendasCentavos,
        reembolsosCentavos,
        // Gasto em US$ convertido pelo câmbio efetivo de hoje (o Google cobra na fatura do mês).
        lucroCentavos: lucroDoPeriodo({ vendasCentavos, reembolsosCentavos, gastoUsd: realUsd, brlPorUsdEfetivo: cambioEfetivo(cambio.brlPorUsd, config) }),
      },
      split: { configurado: split.enabled && split.partnerPercent > 0, percentual: split.partnerPercent, incluiOResumo: !config.foraDaComissaoDoSocio },
    })
  })
}

/** PUT — salva (normalizada). Ligar a venda exige a confirmação do nível pago e uma chave. */
export async function PUT(request: NextRequest) {
  return rotaAutenticada(request, { admin: true, limite: 'ADMIN' }, async ({ sessao, ip }) => {
    const corpo = await lerJson(request)
    if (!corpo || typeof corpo !== 'object') return erro(400, 'Configuração inválida.')
    const quer = corpo as { vendaAtiva?: unknown; nivelPagoConfirmado?: unknown }
    if (quer.vendaAtiva === true) {
      if (quer.nivelPagoConfirmado !== true) return erro(400, 'Para ligar a venda, confirme que a chave do Gemini é de um projeto com faturamento ativo (nível pago).')
      if (!(await chaveGeminiDoResumo())) return erro(400, 'Configure a chave padrão do Gemini (Provas → API Gemini) ou a variável GEMINI_API_KEY antes de ligar a venda.')
    }
    const antes = await configDoResumo()
    const config = await salvarConfigDoResumo(corpo)
    await audit({
      action: 'monitoria_resumo_config',
      actorUserId: sessao.userId,
      resourceType: 'monitoria_resumo',
      resourceId: 'config',
      metadata: { vendaAtiva: [antes.vendaAtiva, config.vendaAtiva], nivelPagoConfirmado: config.nivelPagoConfirmado, modelos: [config.modeloTranscricao, config.modeloResumo], margens: [config.margemSegurancaPct, config.margemComercialPct], limites: config.limites },
      ip,
    })
    return ok({ config, liberada: vendaLiberada(config) })
  })
}
