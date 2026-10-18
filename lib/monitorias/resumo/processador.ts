import 'server-only'

/**
 * O processador do Resumo por IA: UM passo por chamada, sob lease.
 *
 *  - transcrever um trecho (o mais antigo pronto), ou
 *  - dar um passo no resumo de uma aula que terminou (uma chamada: resumo
 *    direto, uma janela do map-reduce, ou a redução final).
 *
 * Ninguém espera por ele: quem dispara é a confirmação de envio de cada
 * trecho, a saída da sala e a varredura de hora em hora (que também retoma o
 * que ficou pela metade). Teto de custo por aula e orçamento do mês conferidos
 * antes de cada chamada; tentativas limitadas, com espera crescente — nunca
 * em laço.
 */

import { get, del } from '@vercel/blob'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import {
  abrirEnvioDeArquivo,
  apagarArquivo,
  chaveGeminiDoResumo,
  consultarArquivo,
  criarInteracao,
  enviarBytesDoArquivo,
  ErroGemini,
  type CriarInteracao,
  type UsoDaInteracao,
} from '@/lib/ia/gemini'
import { colecoes } from '../db'
import { avisar, avisarEquipe } from '../avisos'
import { configDoResumo } from './config'
import { entregarAdicionais, reembolsarAdicionaisDaAula, registrarUso, usoDoMesResumo } from './adicional'
import { lerJson, validarResumo, validarTranscricao, ESQUEMA_RESUMO, ESQUEMA_TRANSCRICAO } from './esquema'
import { contatosNaFala, limparContatoDoResumo } from './contato-na-fala'
import { instrucaoDaParcial, instrucaoDaReducao, instrucaoDeTranscricao, instrucaoDoResumo, pedidoDeReparo, type ContextoDaAula } from './prompts'
import {
  COBERTURA_MINIMA_PCT,
  coberturaDaAula,
  motivoSemTranscricao,
  custoDaChamadaUsd,
  janelasDaTranscricao,
  lacunasDaAula,
  linhaDoTempo,
  prefixoDoTrecho,
  tabelaVigente,
  tokensDoTexto,
  transcricaoParaPrompt,
} from './regras'
import type { ChamadaRegistrada, ConfigResumo, FraseTranscrita, ResumoGerado, SegmentoDeAudio, TarefaResumo } from './tipos'

const LEASE_MS = 5 * 60_000
const TEMPO_TRANSCRICAO_MS = 240_000
const TEMPO_RESUMO_MS = 270_000
/** Quanto o resumo espera, depois do fim da aula, por vozes que não avisaram a saída. */
export const ESPERA_POR_VOZES_MS = 2 * 3600_000
/** Map-reduce acima disto (tokens da transcrição). */
const LIMITE_JANELA_UNICA = 150_000

async function cols() {
  return colecoes(await getDb())
}

function dono(): string {
  return `${process.env.VERCEL_REGION || 'local'}-${Math.random().toString(36).slice(2, 10)}`
}

function espera(tentativas: number): number {
  return Math.min(30 * 60_000, 2 ** Math.max(0, tentativas - 1) * 60_000)
}

export function usoDaChamada(u: UsoDaInteracao): { entradaTexto: number; entradaAudio: number; saida: number; raciocinio: number } {
  const audio = (u.input_tokens_by_modality || []).filter((m) => m.modality === 'audio').reduce((t, m) => t + (m.tokens || 0), 0)
  const entrada = u.total_input_tokens || 0
  return { entradaTexto: Math.max(0, entrada - audio), entradaAudio: audio, saida: u.total_output_tokens || 0, raciocinio: u.total_thought_tokens || 0 }
}

/** Custo real (tabela do dia da chamada) gravado na tarefa e no consumo do mês. */
async function registrarChamada(reservaId: string, etapa: ChamadaRegistrada['etapa'], modelo: string, uso: UsoDaInteracao, config: ConfigResumo, agora: Date): Promise<number> {
  const c = await cols()
  const u = usoDaChamada(uso)
  const tabela = tabelaVigente(config.precos, modelo, agora)
  if (!tabela) console.warn('[resumo-ia] modelo sem preço na tabela:', modelo)
  const usd = tabela ? custoDaChamadaUsd(tabela, u) : 0
  const chamada: ChamadaRegistrada = { etapa, modelo, entrada: u.entradaTexto, entradaAudio: u.entradaAudio, saida: u.saida, raciocinio: u.raciocinio, usd, em: agora }
  await Promise.all([
    c.resumos.updateOne({ _id: reservaId }, { $inc: { 'custo.realUsd': usd }, $push: { 'custo.chamadas': { $each: [chamada], $slice: -300 } }, $set: { updatedAt: agora } } as any),
    registrarUso({ realUsd: usd, chamadas: 1 }, agora),
  ])
  return usd
}

function contextoDe(t: TarefaResumo): ContextoDaAula {
  return { materia: t.materia, conteudos: t.conteudos, titulo: t.anuncioTitulo, individual: t.individual }
}

/**
 * O pedido de transcrição de um trecho (Interactions, saída JSON com esquema).
 * Um só lugar: o processador e o autoteste do admin mandam exatamente o mesmo.
 */
export function pedidoDeTranscricao(config: ConfigResumo, contexto: ContextoDaAula, voz: { papel: SegmentoDeAudio['papel']; nome: string }, arquivo: { uri: string; mime: string }): CriarInteracao {
  return {
    model: config.modeloTranscricao,
    system_instruction: instrucaoDeTranscricao(contexto, voz),
    input: [
      { type: 'text', text: 'Transcreva este áudio seguindo as regras.' },
      { type: 'audio', uri: arquivo.uri, mime_type: arquivo.mime },
    ],
    response_format: { type: 'text', mime_type: 'application/json', schema: ESQUEMA_TRANSCRICAO as unknown as Record<string, unknown> },
    generation_config: { thinking_level: 'low', max_output_tokens: 32_768 },
  }
}

/** O orçamento do mês: em 120% o processamento para (a varredura devolve os pendentes). */
async function orcamentoEstourado(config: ConfigResumo, agora: Date): Promise<boolean> {
  return (await usoDoMesResumo(agora)) >= config.limites.orcamentoMensalUsd * 1.2
}

// ─── Passo 1: transcrever um trecho ─────────────────────────────────────

async function pegarTrecho(agora: Date, quem: string): Promise<SegmentoDeAudio | null> {
  const c = await cols()
  return c.resumosSegmentos.findOneAndUpdate(
    {
      status: { $in: ['enviado', 'transcrevendo'] },
      $and: [
        { $or: [{ lease: { $exists: false } }, { 'lease.ate': { $lt: agora } }] },
        { $or: [{ proximaTentativaEm: { $exists: false } }, { proximaTentativaEm: { $lte: agora } }] },
      ],
    } as any,
    { $set: { status: 'transcrevendo', lease: { ate: new Date(agora.getTime() + LEASE_MS), dono: quem }, updatedAt: agora }, $inc: { tentativas: 1 } },
    { sort: { createdAt: 1 }, returnDocument: 'after' },
  )
}

/**
 * Trecho que não vai ser transcrito. `apagar=false` (tentativas esgotadas por
 * erro temporário) mantém o áudio para o "tentar de novo" do suporte — o
 * Google apaga sozinho em 48 h e a varredura apaga o resto na retenção.
 */
async function falharTrecho(seg: SegmentoDeAudio, erro: string, chave: string | null, apagar = true): Promise<void> {
  const c = await cols()
  await c.resumosSegmentos.updateOne({ _id: seg._id as any }, { $set: { status: 'falhou', erro: erro.slice(0, 300), updatedAt: new Date() }, $unset: { lease: '', frases: '' } })
  if (!apagar) return
  if (seg.arquivo?.nome && chave) await apagarArquivo(chave, seg.arquivo.nome)
  if (seg.blobUrl) await del(seg.blobUrl).catch(() => null)
}

async function adiarTrecho(seg: SegmentoDeAudio, ms: number, erro: string, contarTentativa = true): Promise<void> {
  const c = await cols()
  await c.resumosSegmentos.updateOne(
    { _id: seg._id as any },
    { $set: { status: 'enviado', proximaTentativaEm: new Date(Date.now() + ms), erro: erro.slice(0, 300), updatedAt: new Date() }, $unset: { lease: '' }, ...(contarTentativa ? {} : { $inc: { tentativas: -1 } }) } as any,
  )
}

/**
 * Por que o arquivo no Google não é o deste trecho (null = é). O nome aceito é
 * o de qualquer sessão que o servidor abriu PARA ESTE trecho (o prefixo leva
 * reserva, voz e número; só o servidor abre sessões com a chave), com o tamanho
 * declarado: duas aberturas do mesmo trecho ao mesmo tempo não derrubam o envio.
 */
export function divergenciaDoArquivo(seg: Pick<SegmentoDeAudio, 'reservaId' | 'userId' | 'seq' | 'bytes' | 'nomeDeExibicao'>, f: { displayName?: string; sizeBytes?: string } | null): string | null {
  if (!f) return 'o Google não encontrou o arquivo'
  const nome = f.displayName || ''
  const doTrecho = nome === seg.nomeDeExibicao || nome.startsWith(prefixoDoTrecho(seg.reservaId, seg.userId, seg.seq))
  if (seg.nomeDeExibicao && !doTrecho) return `nome no Google ("${nome.slice(0, 80) || '—'}") não é o deste trecho`
  if (Number(f.sizeBytes) !== seg.bytes) return `tamanho no Google (${f.sizeBytes ?? '—'} bytes) diferente do declarado (${seg.bytes})`
  return null
}

/** Áudio que caiu no Blob (o navegador não alcançou o Google): o servidor repassa ao Files API e apaga o Blob. */
async function garantirArquivoNoGoogle(seg: SegmentoDeAudio, chave: string): Promise<{ nome: string } | null> {
  if (seg.arquivo?.nome) return seg.arquivo
  if (seg.origem !== 'blob' || !seg.blobUrl) return null
  const blob = await get(seg.blobUrl, { access: 'private' })
  if (!blob || blob.statusCode !== 200 || !blob.stream) return null
  const bytes = await new Response(blob.stream as ReadableStream).arrayBuffer()
  if (bytes.byteLength !== seg.bytes) return null
  const url = await abrirEnvioDeArquivo(chave, { bytes: bytes.byteLength, mime: seg.mime, nome: seg.nomeDeExibicao || `res-${seg.reservaId}-${seg.userId}-${seg.seq}` })
  const arquivo = await enviarBytesDoArquivo(url, bytes)
  const c = await cols()
  await c.resumosSegmentos.updateOne({ _id: seg._id as any }, { $set: { arquivo: { nome: arquivo.name }, updatedAt: new Date() } })
  await del(seg.blobUrl).catch(() => null)
  return { nome: arquivo.name }
}

async function transcreverTrecho(seg: SegmentoDeAudio, agora: Date): Promise<void> {
  const c = await cols()
  const [t, config, chave] = await Promise.all([c.resumos.findOne({ _id: seg.reservaId }), configDoResumo(), chaveGeminiDoResumo()])
  if (!t || t.status === 'cancelado' || t.status === 'pronto') return falharTrecho(seg, 'tarefa encerrada', chave || null)
  if (seg.tentativas > config.limites.tentativasPorEtapa) return falharTrecho(seg, seg.erro || 'tentativas esgotadas', chave || null, false)
  if (!chave) return adiarTrecho(seg, 30 * 60_000, 'sem chave do Gemini', false)
  if (await orcamentoEstourado(config, agora)) return adiarTrecho(seg, 60 * 60_000, 'orçamento do mês esgotado', false)

  // Teto de custo da aula, conferido ANTES da chamada (estimativa conservadora deste trecho).
  const tabela = tabelaVigente(config.precos, config.modeloTranscricao, agora)
  const minutos = seg.duracaoAudioMs / 60_000
  const estimado = tabela
    ? custoDaChamadaUsd(tabela, {
        entradaAudio: (seg.duracaoAudioMs / 1000) * config.estimativa.tokensPorSegundoAudio,
        entradaTexto: config.estimativa.tokensPromptPorSegmento,
        saida: minutos * config.estimativa.tokensTranscricaoPorMinutoDeFala,
        raciocinio: minutos * config.estimativa.tokensTranscricaoPorMinutoDeFala * config.estimativa.fatorRaciocinio,
      })
    : 0
  if (t.custo.realUsd + estimado > config.limites.custoMaxPorAulaUsd) return falharTrecho(seg, 'teto de custo da aula atingido', chave)

  try {
    const arquivo = await garantirArquivoNoGoogle(seg, chave)
    if (!arquivo) return falharTrecho(seg, 'áudio não encontrado', chave)
    const noGoogle = await consultarArquivo(chave, arquivo.nome)
    // O arquivo precisa ser O deste trecho: nome dado pelo servidor ao abrir a sessão
    // (reserva, voz e número do trecho) e o mesmo tamanho declarado.
    const divergencia = divergenciaDoArquivo(seg, noGoogle)
    if (divergencia || !noGoogle) return falharTrecho(seg, `arquivo no Google não confere com o trecho: ${divergencia}`, chave)
    // Áudio recém-enviado costuma ficar ACTIVE em segundos: espera um pouco aqui antes de adiar.
    let estado = noGoogle
    for (let i = 0; i < 4 && estado?.state === 'PROCESSING'; i++) {
      await new Promise((r) => setTimeout(r, 5_000))
      estado = (await consultarArquivo(chave, arquivo.nome)) || estado
    }
    if (estado.state === 'PROCESSING') return adiarTrecho(seg, 5 * 60_000, 'arquivo ainda processando no Google', false)
    noGoogle.state = estado.state
    noGoogle.uri = estado.uri || noGoogle.uri
    if (noGoogle.state === 'FAILED' || !noGoogle.uri) return falharTrecho(seg, 'o Google não conseguiu ler o áudio', chave)

    const pedido = pedidoDeTranscricao(config, contextoDe(t), { papel: seg.papel, nome: seg.nome }, { uri: noGoogle.uri, mime: seg.mime })
    const { texto, uso } = await criarInteracao(chave, pedido, TEMPO_TRANSCRICAO_MS)
    await registrarChamada(seg.reservaId, 'transcricao', config.modeloTranscricao, uso, config, new Date())
    const frases = validarTranscricao(lerJson(texto), seg.duracaoAudioMs)
    if (!frases) throw new ErroGemini('transcrição em formato inválido', 200, true)
    await c.resumosSegmentos.updateOne(
      { _id: seg._id as any },
      { $set: { status: 'transcrito', frases, updatedAt: new Date() }, $unset: { lease: '', erro: '', proximaTentativaEm: '' } },
    )
    await verificarContatoNaFala(seg, frases, t).catch((e) => console.error('[resumo-ia] verificação de contato', String(seg._id), e))
    // O áudio sai do Google assim que a transcrição sai (senão ficaria até 48 h).
    if (await apagarArquivo(chave, arquivo.nome)) await c.resumosSegmentos.updateOne({ _id: seg._id as any }, { $unset: { arquivo: '' } })
  } catch (e) {
    const erro = e instanceof ErroGemini ? e : new ErroGemini('falha inesperada', undefined, true)
    console.error('[resumo-ia] transcrição falhou', String(seg._id), erro.status, erro.message.slice(0, 120))
    if (erro.temporario && seg.tentativas < config.limites.tentativasPorEtapa) return adiarTrecho(seg, espera(seg.tentativas), erro.message)
    return falharTrecho(seg, erro.message, chave, !erro.temporario)
  }
}

/**
 * Contato ou pagamento por fora DITO na aula (Termos do Monitor 5.5, aditivo
 * r2): cada frase vira uma infração na aba "Contato por fora", com a frase e o
 * minuto — nunca a transcrição inteira. A equipe é avisada uma vez por aula.
 */
async function verificarContatoNaFala(seg: SegmentoDeAudio, frases: FraseTranscrita[], t: TarefaResumo): Promise<void> {
  if (t.teste || !frases.length) return
  const achados = contatosNaFala(frases, { inicioDoTrecho: new Date(seg.inicio), inicioDaAula: new Date(t.inicio) })
  if (!achados.length) return
  const c = await cols()
  const { registrarInfracao } = await import('../infracoes')
  for (const a of achados) {
    await registrarInfracao({
      reservaId: seg.reservaId,
      titulo: t.anuncioTitulo,
      userId: seg.userId,
      nome: seg.nome,
      papel: seg.papel,
      origem: 'resumo_ia',
      deteccao: a.deteccao,
      texto: `[min ${a.minuto}] ${a.texto}`,
    })
  }
  const primeira = await c.resumos.updateOne({ _id: t._id, contatoNaFalaEm: { $exists: false } }, { $set: { contatoNaFalaEm: new Date() } })
  if (primeira.modifiedCount) {
    const { avisarEquipe } = await import('../avisos')
    await avisarEquipe(
      'Contato por fora dito na aula',
      `A transcrição do Resumo por IA de "${t.anuncioTitulo}" achou ${seg.papel === 'monitor' ? 'o monitor' : 'o aluno'} (${seg.nome}) passando contato ou combinando pagamento por fora (min ${achados[0].minuto}).`,
      '/admin/monitorias?aba=contato',
    )
  }
}

// ─── Passo 2: o resumo de uma aula que terminou ─────────────────────────

/** A aula terminou e todo o áudio que vai chegar já foi transcrito? */
async function prontaParaResumir(t: TarefaResumo, agora: Date): Promise<boolean> {
  const c = await cols()
  const fim = t.fim.getTime()
  // Folga para o último trecho chegar. Na sala de teste encerrada pelo admin,
  // quem estava em envio continua esperado pela regra do `enviandoRecente`.
  if (agora.getTime() < fim + (t.encerradoNoTesteEm ? 0 : 5 * 60_000)) return false
  const tarde = agora.getTime() >= fim + ESPERA_POR_VOZES_MS
  const [emAndamento, enviandoRecente, vozesComAudio] = await Promise.all([
    c.resumosSegmentos.countDocuments({ reservaId: t._id, status: { $in: ['enviado', 'transcrevendo'] } }, { limit: 1 }),
    c.resumosSegmentos.countDocuments({ reservaId: t._id, status: 'enviando', updatedAt: { $gt: new Date(agora.getTime() - 30 * 60_000) } }, { limit: 1 }),
    c.resumosSegmentos.distinct('userId', { reservaId: t._id }),
  ])
  // Trecho ainda na fila (inclusive os reabertos pelo "tentar de novo"): o resumo espera.
  if (emAndamento) return false
  if (t.status === 'resumindo') return true
  if (enviandoRecente && !tarde) return false
  if (tarde) return true
  // Cada voz que gravou avisou a saída e todos os trechos dela até o último chegaram.
  const vozes = Object.entries(t.vozes || {})
  const gravaram = vozes.filter(([uid]) => vozesComAudio.includes(uid))
  if (!gravaram.length) return false
  for (const [uid, v] of gravaram) {
    if (!v.saiuEm) return false
    const ultimo = v.ultimoSeq ?? -1
    if (ultimo < 0) continue
    const chegaram = await c.resumosSegmentos.countDocuments({ reservaId: t._id, userId: uid, seq: { $lte: ultimo }, status: { $ne: 'enviando' } })
    if (chegaram < ultimo + 1) return false
  }
  return true
}

async function pegarTarefa(agora: Date, quem: string): Promise<TarefaResumo | null> {
  const c = await cols()
  const candidatas = await c.resumos
    .find({
      status: { $in: ['aguardando', 'transcrevendo', 'resumindo'] },
      fim: { $lte: agora },
      $and: [
        { $or: [{ lease: { $exists: false } }, { 'lease.ate': { $lt: agora } }] },
        { $or: [{ proximaTentativaEm: { $exists: false } }, { proximaTentativaEm: { $lte: agora } }] },
      ],
    } as any)
    .sort({ fim: 1 })
    .limit(10)
    .toArray()
  for (const t of candidatas) {
    if (!(await prontaParaResumir(t, agora))) continue
    const res = await c.resumos.findOneAndUpdate(
      { _id: t._id, status: t.status, $or: [{ lease: { $exists: false } }, { 'lease.ate': { $lt: agora } }] } as any,
      { $set: { status: 'resumindo', lease: { ate: new Date(agora.getTime() + LEASE_MS), dono: quem }, updatedAt: agora } },
      { returnDocument: 'after' },
    )
    if (res) return res
  }
  return null
}

/** `motivo` vai no aviso da devolução ao comprador; `detalhe` (técnico) fica só na tarefa, para o admin. */
async function cancelarComReembolso(t: TarefaResumo, motivo: string, detalhe?: string): Promise<void> {
  const c = await cols()
  await c.resumos.updateOne({ _id: t._id }, { $set: { erro: (detalhe || motivo).slice(0, 400), updatedAt: new Date() }, $unset: { lease: '' } })
  const r = await reembolsarAdicionaisDaAula(t._id, motivo)
  // Quem não voltou agora (MP fora) volta pela varredura; a tarefa já não processa.
  const { cancelarTarefaSeSemCompradores } = await import('./tarefa')
  await cancelarTarefaSeSemCompradores(t._id, motivo)
  if (r.falhas) await c.resumos.updateOne({ _id: t._id, status: { $ne: 'cancelado' } }, { $set: { status: 'cancelado', updatedAt: new Date() } })
  // A devolução grava o motivo do aluno na tarefa: o detalhe técnico volta por último.
  if (detalhe) await c.resumos.updateOne({ _id: t._id }, { $set: { erro: detalhe.slice(0, 400) } })
}

function pedidoDeResumo(config: ConfigResumo, instrucao: string, entrada: string): CriarInteracao {
  return {
    model: config.modeloResumo,
    system_instruction: instrucao,
    input: entrada,
    response_format: { type: 'text', mime_type: 'application/json', schema: ESQUEMA_RESUMO as unknown as Record<string, unknown> },
    generation_config: { thinking_level: 'medium', max_output_tokens: 32_768 },
  }
}

/** Uma chamada que precisa sair num resumo válido: valida e, se preciso, UMA tentativa de reparo. */
async function gerarResumoValido(t: TarefaResumo, config: ConfigResumo, chave: string, instrucao: string, entrada: string): Promise<ResumoGerado> {
  const { texto, uso } = await criarInteracao(chave, pedidoDeResumo(config, instrucao, entrada), TEMPO_RESUMO_MS)
  await registrarChamada(t._id, 'resumo', config.modeloResumo, uso, config, new Date())
  const primeira = validarResumo(lerJson(texto))
  if (primeira.ok) return primeira.resumo
  const reparo = await criarInteracao(
    chave,
    { ...pedidoDeResumo(config, instrucao, `${pedidoDeReparo(primeira.erros)}\n\nJSON:\n${texto.slice(0, 200_000)}`), generation_config: { thinking_level: 'low', max_output_tokens: 32_768 } },
    TEMPO_RESUMO_MS,
  )
  await registrarChamada(t._id, 'reparo', config.modeloResumo, reparo.uso, config, new Date())
  const segunda = validarResumo(lerJson(reparo.texto))
  if (segunda.ok) return segunda.resumo
  throw new ErroGemini(`resumo inválido: ${segunda.erros.slice(0, 3).join('; ')}`, 200, true)
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/** Um passo do resumo. Devolve true se ainda há passo a dar nesta tarefa (próxima janela do map-reduce). */
async function resumirTarefa(t: TarefaResumo, agora: Date): Promise<boolean> {
  const c = await cols()
  const [config, chave, reserva] = await Promise.all([
    configDoResumo(),
    chaveGeminiDoResumo(),
    ObjectId.isValid(t._id) ? c.reservas.findOne({ _id: new ObjectId(t._id) } as any, { projection: { status: 1, inicio: 1, fim: 1, excluidaEm: 1, teste: 1 } }) : null,
  ])
  // A aula não aconteceu (cancelada, expirada, excluída): devolve quem ainda espera.
  if (!reserva || reserva.excluidaEm || !['confirmada', 'realizada', 'concluida', 'em_disputa'].includes(reserva.status)) {
    await cancelarComReembolso(t, 'A aula não aconteceu')
    return false
  }
  const liberar = async (ms: number, erro: string) => {
    await c.resumos.updateOne({ _id: t._id }, { $set: { proximaTentativaEm: new Date(Date.now() + ms), erro, updatedAt: new Date() }, $unset: { lease: '' } })
    return false
  }
  if (!chave) return liberar(30 * 60_000, 'sem chave do Gemini')
  if (await orcamentoEstourado(config, agora)) return liberar(60 * 60_000, 'orçamento do mês esgotado')

  // Sala de teste encerrada pelo admin: conta o período gravado (a tarefa), não
  // os 90 min agendados. Aula de verdade: a aula marcada inteira.
  const inicio = t.encerradoNoTesteEm ? t.inicio : reserva.inicio || t.inicio
  const fim = t.encerradoNoTesteEm ? t.fim : reserva.fim || t.fim
  const segs = await c.resumosSegmentos.find({ reservaId: t._id, status: 'transcrito' }).sort({ inicio: 1, seq: 1 }).toArray()
  const cobertura = coberturaDaAula(segs, inicio, fim)
  await c.resumos.updateOne({ _id: t._id }, { $set: { cobertura } })
  if (!segs.length) {
    // Por que nada foi transcrito: o erro real do trecho vai para o admin.
    const { resumoDosTrechos } = await import('./tarefa')
    const [todos, retrato] = await Promise.all([
      c.resumosSegmentos.find({ reservaId: t._id }, { projection: { status: 1, erro: 1, erroDireto: 1, updatedAt: 1 } }).toArray(),
      resumoDosTrechos([t._id]),
    ])
    const { aluno, detalhe } = motivoSemTranscricao(todos)
    // O cancelamento apaga os trechos: o retrato (sem áudio nem texto) fica para o admin.
    if (retrato[t._id]) await c.resumos.updateOne({ _id: t._id }, { $set: { trechosNoFim: retrato[t._id] } })
    await cancelarComReembolso(t, aluno, detalhe)
    return false
  }
  if (cobertura.pct < COBERTURA_MINIMA_PCT) {
    await cancelarComReembolso(t, `Áudio insuficiente: só ${cobertura.pct}% da aula foi gravado`)
    return false
  }
  const linhas = linhaDoTempo(segs, inicio)
  const lacunas = lacunasDaAula(segs, inicio, fim)
  const janelas = janelasDaTranscricao(linhas, { limiteTokens: LIMITE_JANELA_UNICA, janelaMin: 40, sobreposicaoMin: 3 })
  const ctx = contextoDe(t)

  // Teto de custo: o que falta gastar (entrada da transcrição + saída esperada) cabe no que sobrou?
  const tabela = tabelaVigente(config.precos, config.modeloResumo, agora)
  const entradaTokens = tokensDoTexto(transcricaoParaPrompt(linhas, lacunas)) + config.estimativa.tokensPromptResumo * janelas.length
  const saidaTokens = config.estimativa.tokensResumo * (1 + config.estimativa.fatorRaciocinio) * (janelas.length > 1 ? janelas.length + 1 : 1)
  const estimado = tabela ? custoDaChamadaUsd(tabela, { entradaTexto: entradaTokens, entradaAudio: 0, saida: saidaTokens, raciocinio: 0 }) : 0
  const fresco = await c.resumos.findOne({ _id: t._id }, { projection: { custo: 1, parciais: 1, tentativas: 1 } })
  if ((fresco?.custo.realUsd || 0) + estimado > config.limites.custoMaxPorAulaUsd * 1.25) {
    await falharTarefa(t, 'teto de custo da aula: a transcrição ficou maior que o esperado (aumente o teto e tente de novo)', false)
    return false
  }

  try {
    let resumo: ResumoGerado | null = null
    if (janelas.length === 1) {
      resumo = await gerarResumoValido(t, config, chave, instrucaoDoResumo(ctx), transcricaoParaPrompt(linhas, lacunas))
    } else {
      const parciais = fresco?.parciais || []
      const proxima = janelas.findIndex((_, i) => !parciais.some((p) => p.janela === i))
      if (proxima >= 0) {
        const j = janelas[proxima]
        const { texto, uso } = await criarInteracao(
          chave,
          {
            model: config.modeloResumo,
            system_instruction: instrucaoDaParcial(ctx, { de: mmss(j[0].t), ate: mmss(j[j.length - 1].t), n: proxima + 1, total: janelas.length }),
            input: transcricaoParaPrompt(j, lacunas.filter(([a, b]) => b >= j[0].t && a <= j[j.length - 1].t)),
            generation_config: { thinking_level: 'low', max_output_tokens: 16_384 },
          },
          TEMPO_RESUMO_MS,
        )
        await registrarChamada(t._id, 'parcial', config.modeloResumo, uso, config, new Date())
        if (!texto.trim()) throw new ErroGemini('notas vazias', 200, true)
        await c.resumos.updateOne({ _id: t._id }, { $push: { parciais: { janela: proxima, texto: texto.slice(0, 120_000) } }, $set: { updatedAt: new Date() }, $unset: { lease: '' } })
        return true
      }
      const notas = [...parciais].sort((a, b) => a.janela - b.janela).map((p) => `### Trecho ${p.janela + 1} de ${janelas.length}\n${p.texto}`).join('\n\n')
      resumo = await gerarResumoValido(t, config, chave, instrucaoDaReducao(ctx), notas)
    }
    // Rede de segurança: frase com contato que o modelo deixou passar sai do resumo.
    resumo = limparContatoDoResumo(resumo)
    // As lacunas de áudio entram no resumo mesmo que o modelo as esqueça.
    const semAudio = lacunas.map(([a, b]) => `Sem áudio gravado de ${mmss(a)} a ${mmss(b)}.`)
    resumo.lacunas = Array.from(new Set([...semAudio, ...resumo.lacunas]))
    const agoraFim = new Date()
    await c.resumos.updateOne(
      { _id: t._id },
      {
        $set: {
          status: 'pronto',
          resultado: resumo,
          prontoEm: agoraFim,
          transcricaoExpiraEm: new Date(agoraFim.getTime() + config.retencaoTranscricaoDias * 86_400_000),
          updatedAt: agoraFim,
        },
        $unset: { lease: '', parciais: '', erro: '', proximaTentativaEm: '', falhouEm: '' },
      },
    )
    await registrarUso({ aulas: 1 }, agoraFim)
    await entregarAdicionais(t._id, t.anuncioTitulo)
    return false
  } catch (e) {
    const erro = e instanceof ErroGemini ? e : new ErroGemini('falha inesperada', undefined, true)
    console.error('[resumo-ia] resumo falhou', t._id, erro.status, erro.message.slice(0, 160))
    await falharTarefa(t, erro.message, erro.temporario)
    return false
  }
}

/** Conta a tentativa; esgotou (ou erro definitivo) → "falhou", equipe e compradores avisados. */
async function falharTarefa(t: TarefaResumo, erro: string, temporario: boolean): Promise<void> {
  const c = await cols()
  const config = await configDoResumo()
  const tentativas = (t.tentativas || 0) + 1
  if (temporario && tentativas < config.limites.tentativasPorEtapa) {
    await c.resumos.updateOne(
      { _id: t._id },
      { $set: { tentativas, proximaTentativaEm: new Date(Date.now() + espera(tentativas)), erro: erro.slice(0, 300), updatedAt: new Date() }, $unset: { lease: '' } },
    )
    return
  }
  const res = await c.resumos.updateOne(
    { _id: t._id, status: { $ne: 'falhou' } },
    { $set: { status: 'falhou', tentativas, erro: erro.slice(0, 300), falhouEm: new Date(), updatedAt: new Date() }, $unset: { lease: '' } },
  )
  if (!res.modifiedCount) return
  await avisarEquipe('Resumo por IA falhou', `Aula "${t.anuncioTitulo}" (${t._id}): ${erro.slice(0, 200)}. Admin → Monitorias → Resumos por IA: tentar de novo ou reembolsar. Sem solução em 48 h, o adicional é devolvido sozinho.`)
  const compradores = await c.resumosAdicionais.find({ reservaId: t._id, status: 'pago' }, { projection: { alunoId: 1 } }).toArray()
  if (compradores.length) {
    await avisar(
      compradores.map((a) => ({
        userId: a.alunoId,
        titulo: 'Seu resumo está atrasado',
        mensagem: `Não conseguimos gerar o Resumo por IA de "${t.anuncioTitulo}" de primeira. A equipe já está vendo; se não der certo, o valor do adicional volta para você.`,
        url: `/monitorias/reservas/${t._id}`,
      })),
    )
  }
}

// ─── A chamada do processador ───────────────────────────────────────────

export interface ResultadoDoPasso {
  feito: 'trecho' | 'resumo' | null
  /** Vale chamar de novo já (mais trabalho pronto). */
  resta: boolean
}

export async function executarPasso(agora = new Date()): Promise<ResultadoDoPasso> {
  const quem = dono()
  const seg = await pegarTrecho(agora, quem)
  if (seg) {
    await transcreverTrecho(seg, agora)
    // Mais um trecho pronto, ou o último deixou a aula pronta para resumir: mais uma volta.
    return { feito: 'trecho', resta: true }
  }
  const t = await pegarTarefa(agora, quem)
  if (t) {
    const maisUmPasso = await resumirTarefa(t, agora)
    return { feito: 'resumo', resta: maisUmPasso }
  }
  return { feito: null, resta: false }
}

/** Há algo para o processador agora? (a varredura usa para decidir se dispara) */
export async function haTrabalho(agora = new Date()): Promise<boolean> {
  const c = await cols()
  const [trechos, tarefas] = await Promise.all([
    c.resumosSegmentos.countDocuments(
      { status: { $in: ['enviado', 'transcrevendo'] }, $or: [{ proximaTentativaEm: { $exists: false } }, { proximaTentativaEm: { $lte: agora } }] } as any,
      { limit: 1 },
    ),
    c.resumos.countDocuments(
      {
        status: { $in: ['aguardando', 'transcrevendo', 'resumindo'] },
        fim: { $lte: new Date(agora.getTime() - 5 * 60_000) },
        $or: [{ proximaTentativaEm: { $exists: false } }, { proximaTentativaEm: { $lte: agora } }],
      } as any,
      { limit: 1 },
    ),
  ])
  return trechos > 0 || tarefas > 0
}
