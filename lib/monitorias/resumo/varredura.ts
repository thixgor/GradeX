import 'server-only'

/**
 * O passo do Resumo por IA na varredura de hora em hora:
 *  1. orçamento do mês em 120% → para de processar e devolve os pendentes;
 *  2. resumo que falhou e ninguém resolveu em 48 h → devolve o adicional;
 *  3. reembolso próprio do adicional que o MP não confirmou → tenta de novo
 *     (mesma chave de idempotência);
 *  4. retenção: transcrições vencidas, tarefas encerradas e envios abandonados
 *     são apagados (inclusive o que sobrou no Google e no Blob);
 *  5. sobrou trabalho (trecho para transcrever, aula para resumir, lease
 *     vencido de uma função que caiu) → dispara o processador.
 */

import { getDb } from '@/lib/mongodb'
import { colecoes } from '../db'
import { configDoResumo } from './config'
import { reembolsarAdicional, reembolsarAdicionaisDaAula, usoDoMesResumo } from './adicional'
import { descartarAudioETranscricoes, cancelarTarefaSeSemCompradores } from './tarefa'
import { haTrabalho } from './processador'
import { dispararProcessador } from './disparo'

const H = 3_600_000
const LOTE = 20

export interface RelatorioDoResumo {
  reembolsos: number
  apagadas: number
  disparou: boolean
}

export async function varrerResumos(agora: Date, origem: string): Promise<RelatorioDoResumo> {
  const c = colecoes(await getDb())
  const r: RelatorioDoResumo = { reembolsos: 0, apagadas: 0, disparou: false }
  const config = await configDoResumo()

  // 1. Orçamento estourado (120%): ninguém paga por um resumo que não vamos fazer.
  if ((await usoDoMesResumo(agora)) >= config.limites.orcamentoMensalUsd * 1.2) {
    const ativas = await c.resumos.find({ status: { $in: ['aguardando', 'transcrevendo', 'resumindo'] } }, { projection: { _id: 1 } }).limit(LOTE).toArray()
    for (const t of ativas) {
      const out = await reembolsarAdicionaisDaAula(t._id, 'O limite mensal de processamento de IA foi atingido')
      r.reembolsos += out.ok
      await cancelarTarefaSeSemCompradores(t._id, 'Orçamento mensal de IA esgotado')
    }
  }

  // 2. Falhou e ficou 48 h sem solução do suporte → devolve o adicional.
  const falhas = await c.resumos.find({ status: 'falhou', falhouEm: { $lt: new Date(agora.getTime() - 48 * H) } }, { projection: { _id: 1 } }).limit(LOTE).toArray()
  for (const t of falhas) {
    const out = await reembolsarAdicionaisDaAula(t._id, 'Não foi possível gerar o resumo desta aula')
    r.reembolsos += out.ok
  }

  // 3. Reembolso próprio do adicional que não confirmou no MP: de novo, mesma chave.
  const pendentes = await c.resumosAdicionais
    .find({ status: 'reembolso_processando', 'reembolso.viaAssento': { $ne: true }, updatedAt: { $lt: new Date(agora.getTime() - 20 * 60_000) } } as any, { projection: { participacaoId: 1, reembolso: 1 } })
    .limit(LOTE)
    .toArray()
  for (const a of pendentes) {
    const out = await reembolsarAdicional({ participacaoId: a.participacaoId, motivo: a.reembolso?.motivo || 'Reembolso do Resumo por IA', por: a.reembolso?.por || 'sistema', forcar: true })
    if (out.ok) r.reembolsos++
  }

  // 4. Retenção: transcrição vencida (resumo pronto) e tarefas encerradas há mais que o prazo.
  const limiteRetencao = new Date(agora.getTime() - config.retencaoTranscricaoDias * 24 * H)
  const vencidas = await c.resumos
    .find(
      { $or: [{ transcricaoExpiraEm: { $lt: agora } }, { status: { $in: ['cancelado', 'falhou'] }, fim: { $lt: limiteRetencao }, transcricaoApagadaEm: { $exists: false } }] } as any,
      { projection: { _id: 1 } },
    )
    .limit(50)
    .toArray()
  for (const t of vencidas) {
    await descartarAudioETranscricoes(t._id)
    await c.resumos.updateOne({ _id: t._id }, { $unset: { transcricaoExpiraEm: '' }, $set: { transcricaoApagadaEm: agora } } as any)
    r.apagadas++
  }
  // Envio aberto e nunca concluído (aba fechada de vez): passou a janela, sai.
  await c.resumosSegmentos.deleteMany({ status: 'enviando', updatedAt: { $lt: new Date(agora.getTime() - 25 * H) } })

  // 5. Trabalho pronto (ou lease vencido) → uma volta do processador.
  if (await haTrabalho(agora)) {
    dispararProcessador(origem)
    r.disparou = true
  }
  return r
}
