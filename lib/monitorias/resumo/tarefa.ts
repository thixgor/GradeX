import 'server-only'

/**
 * O Resumo por IA — o lado do PROCESSAMENTO de uma aula: quem tem a voz
 * transcrita, a autorização do monitor, os trechos de áudio que cada navegador
 * manda direto ao Google, e o fim (cancelar, apagar, mostrar).
 *
 * Nenhum byte de áudio passa por aqui: o servidor abre a sessão de upload no
 * Files API e devolve só a URL; o navegador envia; o servidor confere depois.
 */

import { randomBytes } from 'crypto'
import { ObjectId } from 'mongodb'
import { del } from '@vercel/blob'
import { getDb } from '@/lib/mongodb'
import { abrirEnvioDeArquivo, apagarArquivo, chaveGeminiDoResumo, ErroGemini } from '@/lib/ia/gemini'
import { colecoes, idDe } from '../db'
import { ErroMonitoria } from '../reservas'
import type { Reserva } from '../tipos'
import { configDoResumo } from './config'
import { AUDIO_MAX_SEGMENTO_MS, BYTES_MAX_SEGMENTO, estimarCustoUsd, VERSAO_ADITIVO_RESUMO, vozTranscrita } from './regras'
import type { EstadoDoResumo, EstadoDoResumoNaSala, SegmentoDeAudio, TarefaResumo } from './tipos'

export type { EstadoDoResumoNaSala }

async function cols() {
  return colecoes(await getDb())
}

const ATIVAS: TarefaResumo['status'][] = ['aguardando', 'transcrevendo']
/** O áudio chega até 24 h depois da aula (aba que caiu e voltou). */
const JANELA_DE_ENVIO_MS = 24 * 3600_000

/** Cria (uma vez) a tarefa da aula e põe a voz do comprador na aula individual. */
export async function garantirTarefa(reserva: Reserva, comprador?: { alunoId: string; alunoNome: string }, teste = false): Promise<void> {
  if (!reserva.proposta || !reserva.inicio || !reserva.fim) return
  const c = await cols()
  const id = idDe(reserva)
  const agora = new Date()
  const individual = (reserva.proposta.vagas || 1) <= 1
  const [anuncio, tutor, config] = await Promise.all([
    ObjectId.isValid(reserva.anuncioId) ? c.anuncios.findOne({ _id: new ObjectId(reserva.anuncioId) } as any, { projection: { materia: 1 } }) : null,
    ObjectId.isValid(reserva.tutorId) ? c.tutores.findOne({ _id: new ObjectId(reserva.tutorId) } as any, { projection: { nome: 1 } }) : null,
    configDoResumo(),
  ])
  const estimado = estimarCustoUsd({ duracaoMin: reserva.proposta.duracaoMin, individual, config, data: reserva.inicio })?.usd || 0
  const doc: TarefaResumo = {
    _id: id,
    status: 'aguardando',
    tutorUserId: reserva.tutorUserId,
    anuncioTitulo: reserva.anuncioTitulo,
    materia: anuncio?.materia || '',
    conteudos: reserva.proposta.conteudos || [],
    individual,
    inicio: reserva.inicio,
    fim: reserva.fim,
    duracaoMin: reserva.proposta.duracaoMin,
    vozes: { [reserva.tutorUserId]: { papel: 'monitor', nome: tutor?.nome || 'Monitor' } },
    tentativas: 0,
    custo: { estimadoUsd: Math.round(estimado * 10_000) / 10_000, realUsd: 0, chamadas: [] },
    ...(teste ? { teste: true } : {}),
    createdAt: agora,
    updatedAt: agora,
  }
  await c.resumos.updateOne({ _id: id }, { $setOnInsert: doc }, { upsert: true })
  // Um comprador novo num grupo cuja tarefa tinha sido cancelada (os outros saíram) a reativa.
  await c.resumos.updateOne({ _id: id, status: 'cancelado', fim: { $gt: agora } }, { $set: { status: 'aguardando', updatedAt: agora }, $unset: { erro: '' } })
  if (individual && comprador && comprador.alunoId !== reserva.tutorUserId) {
    await c.resumos.updateOne(
      { _id: id, [`vozes.${comprador.alunoId}`]: { $exists: false } } as any,
      { $set: { [`vozes.${comprador.alunoId}`]: { papel: 'aluno', nome: comprador.alunoNome || 'Aluno' }, updatedAt: agora } },
    )
  }
}

/**
 * Sala de teste do admin com Resumo por IA: um adicional de teste (sem
 * cobrança, sem reembolso) mantém a tarefa viva; o admin lê o resultado.
 */
export async function criarResumoDeTeste(reserva: Reserva, adminId: string): Promise<void> {
  const c = await cols()
  const id = idDe(reserva)
  const agora = new Date()
  await c.resumosAdicionais.updateOne(
    { participacaoId: `teste:${id}` },
    {
      $setOnInsert: {
        participacaoId: `teste:${id}`,
        reservaId: id,
        alunoId: adminId,
        paymentOrderId: 'teste',
        precoCentavos: 0,
        taxaPixCentavos: 0,
        estimativa: { duracaoMin: reserva.proposta?.duracaoMin || 0, custoUsd: 0, brlPorUsd: 0, fonteCambio: 'manual', dataCambio: null, tabelaDesde: '', modelo: '' },
        aceite: { versao: VERSAO_ADITIVO_RESUMO, hash: 'teste', em: agora },
        status: 'pago',
        pagoEm: agora,
        teste: true,
        createdAt: agora,
        updatedAt: agora,
      },
    },
    { upsert: true },
  )
  await garantirTarefa(reserva, undefined, true)
}

// ─── Na sala ────────────────────────────────────────────────────────────


async function comprouEAindaVale(reservaId: string, userId: string): Promise<boolean> {
  const c = await cols()
  const part = await c.participacoes.findOne({ reservaId, alunoId: userId }, { projection: { _id: 1 } })
  if (!part) return false
  const a = await c.resumosAdicionais.findOne({ participacaoId: idDe(part), status: 'pago' }, { projection: { _id: 1 } })
  return !!a
}

/** O que a sala precisa saber do Resumo por IA para esta pessoa (null = a aula não tem). */
export async function estadoDoResumoNaSala(reserva: Reserva, userId: string): Promise<EstadoDoResumoNaSala | null> {
  const c = await cols()
  const id = idDe(reserva)
  const t = await c.resumos.findOne({ _id: id }, { projection: { status: 1, vozes: 1, individual: 1 } })
  if (!t || !ATIVAS.includes(t.status)) return null
  const papel: 'monitor' | 'aluno' = reserva.tutorUserId === userId ? 'monitor' : 'aluno'
  const voz = t.vozes?.[userId]
  const comprou = papel === 'aluno' ? await comprouEAindaVale(id, userId) : false
  const transcrita = vozTranscrita({ papel, individual: t.individual, comprou }) && (papel === 'monitor' || !!voz)
  const consentimento = papel === 'monitor' ? (voz?.consentimento ? (voz.consentimento.aceito ? 'aceito' : 'recusado') : 'pendente') : null
  const gravar = transcrita && (papel === 'aluno' || consentimento === 'aceito')
  const ultimo = gravar
    ? await c.resumosSegmentos.find({ reservaId: id, userId }, { projection: { seq: 1 } }).sort({ seq: -1 }).limit(1).toArray()
    : []
  return { ativo: true, gravar, papel, individual: t.individual, consentimento, proximoSeq: ultimo.length ? ultimo[0].seq + 1 : 0, versao: VERSAO_ADITIVO_RESUMO }
}

/**
 * Decisão do monitor sobre a voz dele. Recusar é definitivo: os adicionais
 * ainda não entregues são devolvidos (decisão da DomineAqui: o aluno não paga
 * por um resumo que não vai existir) e a tarefa é cancelada.
 */
export async function registrarConsentimento(reserva: Reserva, userId: string, aceito: boolean, ip: string): Promise<EstadoDoResumoNaSala | null> {
  if (reserva.tutorUserId !== userId) throw new ErroMonitoria(403, 'Só o monitor autoriza a transcrição da própria voz.')
  const c = await cols()
  const id = idDe(reserva)
  const agora = new Date()
  const res = await c.resumos.updateOne(
    { _id: id, status: { $in: ATIVAS }, [`vozes.${userId}.consentimento`]: { $exists: false } } as any,
    { $set: { [`vozes.${userId}.consentimento`]: { aceito, em: agora, versao: VERSAO_ADITIVO_RESUMO, ip }, updatedAt: agora } },
  )
  if (!res.modifiedCount) {
    const atual = await c.resumos.findOne({ _id: id }, { projection: { vozes: 1, status: 1 } })
    if (!atual || !ATIVAS.includes(atual.status)) throw new ErroMonitoria(409, 'Esta aula não tem Resumo por IA ativo.')
    // Já decidiu: só aceita repetir a mesma decisão.
    if (atual.vozes?.[userId]?.consentimento?.aceito !== aceito) throw new ErroMonitoria(409, 'Você já decidiu sobre a transcrição nesta aula.')
  } else if (!aceito) {
    const { reembolsarAdicionaisDaAula } = await import('./adicional')
    await reembolsarAdicionaisDaAula(id, 'O monitor não autorizou a transcrição da aula')
    await c.resumos.updateOne({ _id: id, status: { $in: ATIVAS } }, { $set: { status: 'cancelado', erro: 'O monitor não autorizou a transcrição.', updatedAt: new Date() } })
  }
  return estadoDoResumoNaSala(reserva, userId)
}

// ─── Envio dos trechos ──────────────────────────────────────────────────

const MIMES: Record<string, string> = { 'audio/webm': 'audio/webm', 'audio/ogg': 'audio/ogg', 'audio/mp4': 'audio/m4a', 'audio/m4a': 'audio/m4a' }

export interface DadosDoTrecho {
  seq: number
  bytes: number
  mime: string
  duracaoAudioMs: number
  duracaoRealMs: number
  inicio: string
  marcas: Array<[number, number]>
}

export type RespostaDoEnvio =
  | { modo: 'direto'; url: string }
  | { modo: 'blob'; caminho: string }
  | { modo: 'ja_enviado' }

function validarTrecho(d: DadosDoTrecho, reserva: Reserva, agora: Date): { mime: string; inicio: Date } {
  const mime = MIMES[String(d.mime || '').split(';')[0].trim().toLowerCase()]
  if (!mime) throw new ErroMonitoria(400, 'Formato de áudio não aceito.')
  if (!Number.isInteger(d.seq) || d.seq < 0 || d.seq > 400) throw new ErroMonitoria(400, 'Trecho inválido.')
  if (!Number.isInteger(d.bytes) || d.bytes < 1 || d.bytes > BYTES_MAX_SEGMENTO) throw new ErroMonitoria(400, 'Trecho grande demais.')
  if (!(d.duracaoAudioMs >= 500 && d.duracaoAudioMs <= AUDIO_MAX_SEGMENTO_MS)) throw new ErroMonitoria(400, 'Duração do trecho inválida.')
  if (!(d.duracaoRealMs >= d.duracaoAudioMs - 2_000 && d.duracaoRealMs <= 6 * 3600_000)) throw new ErroMonitoria(400, 'Duração do trecho inválida.')
  // ~32 kb/s no máximo (o gravador usa 24 kb/s): bytes demais para a duração não é fala comprimida.
  if (d.bytes > (d.duracaoAudioMs / 1000) * 6_000 + 64_000) throw new ErroMonitoria(400, 'Trecho incoerente.')
  const inicio = new Date(d.inicio)
  if (Number.isNaN(inicio.getTime())) throw new ErroMonitoria(400, 'Início inválido.')
  const ini = reserva.inicio!.getTime()
  const fim = reserva.fim!.getTime()
  if (inicio.getTime() < ini - 20 * 60_000 || inicio.getTime() > fim + 60 * 60_000 || inicio.getTime() > agora.getTime() + 2 * 60_000) {
    throw new ErroMonitoria(400, 'Trecho fora do horário da aula.')
  }
  if (!Array.isArray(d.marcas) || d.marcas.length > 3000) throw new ErroMonitoria(400, 'Marcas inválidas.')
  let anterior: [number, number] = [-1, -1]
  for (const m of d.marcas) {
    if (!Array.isArray(m) || m.length !== 2 || !m.every((x) => Number.isFinite(x) && x >= 0)) throw new ErroMonitoria(400, 'Marcas inválidas.')
    if (m[0] < anterior[0] || m[1] < anterior[1] || m[0] > d.duracaoAudioMs + 1_000 || m[1] > d.duracaoRealMs + 1_000) throw new ErroMonitoria(400, 'Marcas inválidas.')
    anterior = m as [number, number]
  }
  return { mime, inicio }
}

/**
 * Pede a URL de envio de um trecho. Confere quem é (voz transcrita e
 * autorizada), quando (do começo da aula até 24 h depois), quanto (tamanho,
 * duração e total de áudio da voz) e abre a sessão no Google. Se o Google não
 * abrir, devolve o caminho no Blob privado (reserva).
 */
export async function abrirEnvioDeTrecho(reserva: Reserva, userId: string, dados: DadosDoTrecho, origem: string, agora = new Date(), viaBlob = false): Promise<RespostaDoEnvio> {
  if (!reserva.inicio || !reserva.fim) throw new ErroMonitoria(409, 'Aula sem horário.')
  if (agora.getTime() < reserva.inicio.getTime() - 15 * 60_000 || agora.getTime() > reserva.fim.getTime() + JANELA_DE_ENVIO_MS) {
    throw new ErroMonitoria(409, 'Fora da janela de envio do áudio.')
  }
  const estado = await estadoDoResumoNaSala(reserva, userId)
  if (!estado?.gravar) throw new ErroMonitoria(403, 'Sua voz não está sendo transcrita nesta aula.')
  const { mime, inicio } = validarTrecho(dados, reserva, agora)
  const c = await cols()
  const id = idDe(reserva)
  const t = await c.resumos.findOne({ _id: id }, { projection: { vozes: 1, duracaoMin: 1 } })
  const voz = t?.vozes?.[userId]
  if (!t || !voz) throw new ErroMonitoria(403, 'Sua voz não está sendo transcrita nesta aula.')
  const existente = await c.resumosSegmentos.findOne({ reservaId: id, userId, seq: dados.seq })
  if (existente && ['enviado', 'transcrevendo', 'transcrito'].includes(existente.status)) return { modo: 'ja_enviado' }
  const [{ total } = { total: 0 }] = await c.resumosSegmentos
    .aggregate<{ total: number }>([{ $match: { reservaId: id, userId, seq: { $ne: dados.seq }, status: { $ne: 'descartado' } } }, { $group: { _id: null, total: { $sum: '$duracaoAudioMs' } } }])
    .toArray()
  if (total + dados.duracaoAudioMs > (t.duracaoMin + 30) * 60_000) throw new ErroMonitoria(409, 'Limite de áudio desta aula atingido.')
  const nonce = randomBytes(6).toString('hex')
  const nomeDeExibicao = `res-${id}-${userId}-${dados.seq}-${nonce}`
  const seg: Omit<SegmentoDeAudio, '_id' | 'createdAt'> = {
    reservaId: id,
    userId,
    seq: dados.seq,
    papel: voz.papel,
    nome: voz.nome,
    inicio,
    marcas: dados.marcas.length ? dados.marcas : [[0, 0]],
    duracaoAudioMs: Math.round(dados.duracaoAudioMs),
    duracaoRealMs: Math.round(dados.duracaoRealMs),
    bytes: dados.bytes,
    mime,
    origem: 'direto',
    status: 'enviando',
    tentativas: 0,
    nomeDeExibicao,
    updatedAt: agora,
  }
  await c.resumosSegmentos.updateOne(
    { reservaId: id, userId, seq: dados.seq, status: { $in: ['enviando', 'falhou'] } } as any,
    { $set: seg, $setOnInsert: { createdAt: agora }, $unset: { arquivo: '', blobUrl: '', erro: '' } },
    { upsert: true },
  ).catch((e) => {
    // Corrida com outro envio do mesmo trecho que já foi aceito (índice único).
    if ((e as { code?: number })?.code === 11000) return null
    throw e
  })
  await c.resumos.updateOne({ _id: id, status: 'aguardando' }, { $set: { status: 'transcrevendo', updatedAt: agora } })
  const chave = viaBlob ? '' : await chaveGeminiDoResumo()
  if (chave) {
    try {
      const url = await abrirEnvioDeArquivo(chave, { bytes: dados.bytes, mime, nome: nomeDeExibicao, origem })
      return { modo: 'direto', url }
    } catch (e) {
      if (e instanceof ErroGemini && e.status && e.status >= 400 && e.status < 500 && e.status !== 429) {
        console.error('[resumo-ia] Files API recusou a sessão', e.status)
      }
    }
  }
  await c.resumosSegmentos.updateOne({ reservaId: id, userId, seq: dados.seq, status: 'enviando' }, { $set: { origem: 'blob' } })
  return { modo: 'blob', caminho: caminhoNoBlob(id, userId, dados.seq, nonce) }
}

export function caminhoNoBlob(reservaId: string, userId: string, seq: number, nonce: string): string {
  return `monitorias-resumo/${reservaId}/${userId}/${seq}-${nonce}.audio`
}

/** O navegador terminou de enviar: grava onde o áudio está; o processador confere antes de usar. */
export async function concluirEnvioDeTrecho(reserva: Reserva, userId: string, p: { seq: number; arquivo?: string; blobUrl?: string }): Promise<{ ok: true }> {
  const c = await cols()
  const id = idDe(reserva)
  const seg = await c.resumosSegmentos.findOne({ reservaId: id, userId, seq: p.seq })
  if (!seg) throw new ErroMonitoria(404, 'Trecho não encontrado.')
  if (seg.status !== 'enviando') return { ok: true }
  const agora = new Date()
  if (p.arquivo) {
    if (!/^files\/[a-z0-9-]{1,64}$/.test(p.arquivo)) throw new ErroMonitoria(400, 'Arquivo inválido.')
    await c.resumosSegmentos.updateOne({ _id: seg._id as any, status: 'enviando' }, { $set: { status: 'enviado', origem: 'direto', arquivo: { nome: p.arquivo }, updatedAt: agora } })
  } else if (p.blobUrl) {
    const nonce = String(seg.nomeDeExibicao || '').split('-').pop() || ''
    let caminho = ''
    try {
      const u = new URL(p.blobUrl)
      if (!u.hostname.endsWith('.blob.vercel-storage.com') || u.protocol !== 'https:') throw new Error()
      caminho = decodeURIComponent(u.pathname.replace(/^\/+/, ''))
    } catch {
      throw new ErroMonitoria(400, 'Endereço do áudio inválido.')
    }
    // O Blob acrescenta um sufixo aleatório ao nome: confere só o começo.
    const esperado = caminhoNoBlob(id, userId, p.seq, nonce).replace(/\.audio$/, '')
    if (!nonce || !caminho.startsWith(esperado)) throw new ErroMonitoria(400, 'Endereço do áudio inválido.')
    await c.resumosSegmentos.updateOne({ _id: seg._id as any, status: 'enviando' }, { $set: { status: 'enviado', origem: 'blob', blobUrl: p.blobUrl, updatedAt: agora } })
  } else {
    throw new ErroMonitoria(400, 'Informe o arquivo enviado.')
  }
  return { ok: true }
}

/** A pessoa saiu da sala: o último trecho dela (o resumo não espera além do necessário). */
export async function registrarFimDaVoz(reserva: Reserva, userId: string, ultimoSeq: number): Promise<void> {
  const c = await cols()
  if (!Number.isInteger(ultimoSeq) || ultimoSeq < -1 || ultimoSeq > 400) throw new ErroMonitoria(400, 'Trecho inválido.')
  await c.resumos.updateOne(
    { _id: idDe(reserva), [`vozes.${userId}`]: { $exists: true } } as any,
    { $set: { [`vozes.${userId}.ultimoSeq`]: ultimoSeq, [`vozes.${userId}.saiuEm`]: new Date(), updatedAt: new Date() } },
  )
}

/**
 * "Gerar resumo agora" da sala de teste (só `teste: true`). Uma aula de
 * verdade espera o fim agendado e mede a cobertura sobre a aula inteira; no
 * teste, o admin fala alguns minutos sozinho numa sala de 90. Então o teste
 * termina aqui, e o período que conta é do primeiro trecho gravado até agora.
 * Quem não saiu pelo botão "Sair" conta como saído agora (um trecho que ainda
 * estiver só no navegador fica de fora).
 */
export async function encerrarTesteEGerarResumo(reservaId: string, agora = new Date()): Promise<{ inicio: Date; fim: Date; trechos: number }> {
  if (!ObjectId.isValid(reservaId)) throw new ErroMonitoria(404, 'Sala de teste não encontrada.')
  const c = await cols()
  const [reserva, tarefa, primeiro, trechos] = await Promise.all([
    c.reservas.findOne({ _id: new ObjectId(reservaId), teste: true } as any, { projection: { fim: 1 } }),
    c.resumos.findOne({ _id: reservaId, teste: true }, { projection: { status: 1, vozes: 1 } }),
    c.resumosSegmentos.find({ reservaId }, { projection: { inicio: 1 } }).sort({ inicio: 1 }).limit(1).next(),
    c.resumosSegmentos.countDocuments({ reservaId }),
  ])
  if (!reserva || !tarefa) throw new ErroMonitoria(404, 'Sala de teste com Resumo por IA não encontrada.')
  if (!ATIVAS.includes(tarefa.status)) throw new ErroMonitoria(409, `O resumo desta sala já está "${tarefa.status}".`)
  if (!primeiro) throw new ErroMonitoria(409, 'Nenhum trecho de voz chegou ainda: entre na sala, autorize e fale um pouco antes.')
  const saidas = Object.fromEntries(
    Object.entries(tarefa.vozes || {})
      .filter(([, v]) => !v.saiuEm)
      .map(([uid]) => [`vozes.${uid}.saiuEm`, agora]),
  )
  const atualizada = await c.resumos.updateOne(
    { _id: reservaId, teste: true, status: { $in: ATIVAS } },
    { $set: { inicio: primeiro.inicio, fim: agora, encerradoNoTesteEm: agora, updatedAt: agora, ...saidas }, $unset: { proximaTentativaEm: '' } } as any,
  )
  if (!atualizada.modifiedCount) throw new ErroMonitoria(409, 'O resumo desta sala mudou de estado. Atualize a página.')
  if (reserva.fim && reserva.fim > agora) await c.reservas.updateOne({ _id: new ObjectId(reservaId), teste: true } as any, { $set: { fim: agora, updatedAt: agora } })
  return { inicio: primeiro.inicio, fim: agora, trechos }
}

// ─── Fim: cancelar, apagar, mostrar ─────────────────────────────────────

/**
 * Sem nenhum comprador esperando o resumo (todos reembolsados): a tarefa para
 * e o áudio/transcrição são apagados. Resumo já pronto fica (quem recebeu continua lendo).
 */
export async function cancelarTarefaSeSemCompradores(reservaId: string, motivo: string): Promise<void> {
  const c = await cols()
  const esperando = await c.resumosAdicionais.countDocuments({ reservaId, status: 'pago' })
  if (esperando > 0) return
  const res = await c.resumos.updateOne(
    { _id: reservaId, status: { $in: ['aguardando', 'transcrevendo', 'resumindo', 'falhou'] } },
    { $set: { status: 'cancelado', erro: motivo.slice(0, 200), updatedAt: new Date() }, $unset: { lease: '', parciais: '' } },
  )
  if (res.modifiedCount) await descartarAudioETranscricoes(reservaId)
}

/** Apaga o que sobrou no Google e no Blob e as transcrições em texto (retenção, cancelamento, exclusão). */
export async function descartarAudioETranscricoes(reservaId: string): Promise<void> {
  const c = await cols()
  const segs = await c.resumosSegmentos.find({ reservaId }, { projection: { arquivo: 1, blobUrl: 1 } }).toArray()
  const chave = segs.some((s) => s.arquivo?.nome) ? await chaveGeminiDoResumo() : ''
  await Promise.all(
    segs.slice(0, 60).map(async (s) => {
      if (s.arquivo?.nome && chave) await apagarArquivo(chave, s.arquivo.nome)
      if (s.blobUrl) await del(s.blobUrl).catch(() => null)
    }),
  )
  await c.resumosSegmentos.deleteMany({ reservaId })
  await c.resumos.updateOne({ _id: reservaId }, { $unset: { parciais: '' } })
}

const ERROS_PUBLICOS: Partial<Record<TarefaResumo['status'], string>> = {
  falhou: 'Não conseguimos gerar o resumo desta vez. Nossa equipe já foi avisada e vai tentar de novo; se não der, o valor do adicional é devolvido.',
  cancelado: 'O Resumo por IA desta aula foi cancelado e o valor do adicional, devolvido.',
}

/** O que a página da reserva / do resumo mostra ao comprador (ou ao admin). Nunca a transcrição. */
export async function estadoDoResumoParaComprador(reserva: Reserva, userId: string, admin: boolean): Promise<EstadoDoResumo> {
  const c = await cols()
  const id = idDe(reserva)
  const part = await c.participacoes.findOne({ reservaId: id, alunoId: userId }, { projection: { _id: 1 } })
  const [adicional, t] = await Promise.all([
    part ? c.resumosAdicionais.findOne({ participacaoId: idDe(part) }) : Promise.resolve(null),
    c.resumos.findOne({ _id: id }, { projection: { status: 1, cobertura: 1, prontoEm: 1, resultado: 1, teste: 1 } }),
  ])
  const podeLer = admin || adicional?.status === 'entregue' || (!!adicional?.teste && t?.status === 'pronto')
  return {
    oferta: false,
    adicional: adicional
      ? { status: adicional.status, precoCentavos: adicional.precoCentavos, ...(adicional.reembolso ? { reembolso: { motivo: adicional.reembolso.motivo, status: adicional.reembolso.status } } : {}) }
      : null,
    tarefa:
      t && (adicional || admin)
        ? {
            status: t.status,
            cobertura: t.cobertura?.pct ?? null,
            prontoEm: t.prontoEm ? t.prontoEm.toISOString() : null,
            erroPublico: adicional?.status === 'reembolsado' && t.status !== 'pronto' ? ERROS_PUBLICOS.cancelado! : ERROS_PUBLICOS[t.status] || null,
          }
        : null,
    resultado: podeLer && t?.status === 'pronto' ? t.resultado || null : null,
  }
}
