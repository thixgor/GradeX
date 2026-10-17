'use client'

/**
 * Leitura do `getStats()` de um par e aplicação do nível de vídeo.
 *
 * `getStats` é local (não usa rede): roda a cada 2 s com a aba visível e a cada
 * 5 s oculta. As decisões (subir, descer, pausar o vídeo) são das funções puras
 * em `regras.ts`; aqui só se lê o navegador e se escreve no `RTCRtpSender`.
 */

import { AUDIO_MAX_BITRATE, type Nivel } from '../regras'

export interface LeituraDoPar {
  perda: number | null
  rttMs: number | null
  bitrateDisponivel: number | null
  limitadoPorBanda: boolean
  tipo: 'direta' | 'retransmitida' | null
  /** Bytes enviados + recebidos no par de candidatos escolhido (acumulado). */
  bytesDoPar: number
  /** A câmera que EU envio a este par (não a tela). */
  envio: LeituraDeVideo | null
  /** A câmera que recebo dele. */
  recebimento: LeituraDeVideo | null
  /** Por que o navegador está segurando o meu vídeo: rede, processador ou nada. */
  motivoDoLimite: 'bandwidth' | 'cpu' | 'other' | 'none' | null
}

export interface LeituraDeVideo {
  fps: number | null
  largura: number | null
  altura: number | null
  /** Acumulado; a taxa (kbps) sai da diferença entre duas leituras. */
  bytes: number
}

function lerVideo(s: any, bytes: 'bytesSent' | 'bytesReceived'): LeituraDeVideo {
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  return { fps: num(s.framesPerSecond), largura: num(s.frameWidth), altura: num(s.frameHeight), bytes: num(s[bytes]) ?? 0 }
}

/** `midDaCamera`: o transceptor da câmera (a tela vai em outro e não entra nas contas de fps). */
export async function lerEstatisticas(pc: RTCPeerConnection, midDaCamera?: string | null): Promise<LeituraDoPar> {
  const leitura: LeituraDoPar = {
    perda: null,
    rttMs: null,
    bitrateDisponivel: null,
    limitadoPorBanda: false,
    tipo: null,
    bytesDoPar: 0,
    envio: null,
    recebimento: null,
    motivoDoLimite: null,
  }
  let relatorio: RTCStatsReport
  try {
    relatorio = await pc.getStats()
  } catch {
    return leitura
  }
  const porId = new Map<string, any>()
  relatorio.forEach((s: any) => porId.set(s.id, s))
  let parId: string | null = null
  relatorio.forEach((s: any) => {
    if (s.type === 'transport' && s.selectedCandidatePairId) parId = s.selectedCandidatePairId
  })
  let par: any = parId ? porId.get(parId) : null
  if (!par) {
    relatorio.forEach((s: any) => {
      // Firefox marca o par com `selected`; os outros, nomeado e bem-sucedido.
      if (s.type === 'candidate-pair' && (s.selected || (s.nominated && s.state === 'succeeded'))) par = par || s
    })
  }
  if (par) {
    if (typeof par.currentRoundTripTime === 'number') leitura.rttMs = par.currentRoundTripTime * 1000
    if (typeof par.availableOutgoingBitrate === 'number') leitura.bitrateDisponivel = par.availableOutgoingBitrate
    leitura.bytesDoPar = (par.bytesSent || 0) + (par.bytesReceived || 0)
    const local = porId.get(par.localCandidateId)
    const remoto = porId.get(par.remoteCandidateId)
    if (local || remoto) leitura.tipo = local?.candidateType === 'relay' || remoto?.candidateType === 'relay' ? 'retransmitida' : 'direta'
  }
  relatorio.forEach((s: any) => {
    if (s.type === 'remote-inbound-rtp' && typeof s.fractionLost === 'number') {
      leitura.perda = Math.max(leitura.perda ?? 0, s.fractionLost)
    }
    const daCamera = s.kind === 'video' && (!midDaCamera || s.mid === undefined || s.mid === midDaCamera)
    if (s.type === 'outbound-rtp' && daCamera) {
      if (s.qualityLimitationReason === 'bandwidth') leitura.limitadoPorBanda = true
      if (!leitura.envio || (s.framesPerSecond ?? 0) > (leitura.envio.fps ?? 0)) {
        leitura.envio = lerVideo(s, 'bytesSent')
        leitura.motivoDoLimite = s.qualityLimitationReason ?? null
      }
    }
    if (s.type === 'inbound-rtp' && daCamera && (!leitura.recebimento || (s.framesPerSecond ?? 0) > (leitura.recebimento.fps ?? 0))) {
      leitura.recebimento = lerVideo(s, 'bytesReceived')
    }
  })
  return leitura
}

type Preferencia = 'maintain-framerate' | 'maintain-resolution' | 'balanced'
type Parametros = RTCRtpSendParameters & { degradationPreference?: Preferencia }

/** Navegador que recusa `degradationPreference` (Firefox, Chrome antigo): não pede de novo. */
let preferenciaRecusada = false

async function ajustar(sender: RTCRtpSender | undefined, mudar: (e: RTCRtpEncodingParameters) => void, preferencia?: Preferencia): Promise<void> {
  if (!sender) return
  // Antes da negociação não há codificação: mexer agora só daria erro (quem
  // chama aplica de novo quando a conexão sobe).
  if (!sender.getParameters().encodings?.length) return
  const montar = (comPreferencia: boolean): Parametros => {
    const p = sender.getParameters() as Parametros
    mudar(p.encodings[0])
    if (comPreferencia && preferencia) p.degradationPreference = preferencia
    return p
  }
  try {
    await sender.setParameters(montar(!preferenciaRecusada))
  } catch {
    if (!preferencia || preferenciaRecusada) return // sem trilha ainda, ou parâmetro recusado: o padrão dele serve
    // A preferência derrubou o pedido inteiro: o teto de bitrate e fps vale mais que ela.
    preferenciaRecusada = true
    try {
      await sender.setParameters(montar(false))
    } catch {
      /* o padrão do navegador serve */
    }
  }
}

/**
 * Câmera: quando a banda aperta, o navegador baixa a resolução antes de travar
 * o movimento (`maintain-framerate`). O padrão do Chrome equilibra os dois e,
 * em rede apertada, entregava imagem nítida a 10 fps.
 */
export function aplicarNivelDeVideo(sender: RTCRtpSender | undefined, nivel: NonNullable<Nivel>): Promise<void> {
  return ajustar(
    sender,
    (e) => {
      e.maxBitrate = nivel.maxBitrate
      e.scaleResolutionDownBy = nivel.escala
      e.maxFramerate = nivel.maxFramerate
    },
    'maintain-framerate',
  )
}

export function aplicarAudio(sender: RTCRtpSender | undefined): Promise<void> {
  return ajustar(sender, (e) => {
    e.maxBitrate = AUDIO_MAX_BITRATE
    // Áudio passa na frente do vídeo quando a rede aperta.
    e.priority = 'high'
    e.networkPriority = 'high'
  })
}

/** Tela: texto legível vale mais que movimento. */
export function aplicarTela(sender: RTCRtpSender | undefined, maxBitrate: number, maxFramerate: number): Promise<void> {
  return ajustar(
    sender,
    (e) => {
      e.maxBitrate = maxBitrate
      e.maxFramerate = maxFramerate
      e.scaleResolutionDownBy = 1
    },
    'maintain-resolution',
  )
}
