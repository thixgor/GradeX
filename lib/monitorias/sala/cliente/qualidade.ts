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
}

export async function lerEstatisticas(pc: RTCPeerConnection): Promise<LeituraDoPar> {
  const leitura: LeituraDoPar = { perda: null, rttMs: null, bitrateDisponivel: null, limitadoPorBanda: false, tipo: null, bytesDoPar: 0 }
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
    if (s.type === 'outbound-rtp' && s.kind === 'video' && s.qualityLimitationReason === 'bandwidth') leitura.limitadoPorBanda = true
  })
  return leitura
}

async function ajustar(sender: RTCRtpSender | undefined, mudar: (e: RTCRtpEncodingParameters) => void): Promise<void> {
  if (!sender) return
  try {
    const p = sender.getParameters()
    if (!p.encodings || !p.encodings.length) p.encodings = [{}]
    mudar(p.encodings[0])
    await sender.setParameters(p)
  } catch {
    // Sem trilha ainda, ou navegador que recusa o parâmetro: o padrão dele serve.
  }
}

export function aplicarNivelDeVideo(sender: RTCRtpSender | undefined, nivel: NonNullable<Nivel>): Promise<void> {
  return ajustar(sender, (e) => {
    e.maxBitrate = nivel.maxBitrate
    e.scaleResolutionDownBy = nivel.escala
    e.maxFramerate = nivel.maxFramerate
  })
}

export function aplicarAudio(sender: RTCRtpSender | undefined): Promise<void> {
  return ajustar(sender, (e) => {
    e.maxBitrate = AUDIO_MAX_BITRATE
    // Áudio passa na frente do vídeo quando a rede aperta.
    e.priority = 'high'
    e.networkPriority = 'high'
  })
}

export function aplicarTela(sender: RTCRtpSender | undefined, maxBitrate: number, maxFramerate: number): Promise<void> {
  return ajustar(sender, (e) => {
    e.maxBitrate = maxBitrate
    e.maxFramerate = maxFramerate
    e.scaleResolutionDownBy = 1
  })
}
