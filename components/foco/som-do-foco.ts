'use client'

import { AUDIOS_DE_FOCO_PRONTOS, PASTA_DE_AUDIO_DE_FOCO, type IdDaFalaDeFoco } from '@/lib/foco/narracao'

/**
 * Os sons do Modo Foco, todos sem arquivo pesado:
 *
 * - **ambiente** gerado na hora pelo Web Audio — ruído marrom (grave, como um
 *   ventilador), chuva (ruído rosa filtrado com gotas) — ou a música calma da
 *   jornada, que já está no CDN. A evidência de ruído de fundo para atenção é
 *   mista (melhor em quem tem desatenção, Söderlund et al., 2010), então é
 *   opção, nunca padrão;
 * - **sinos** sintetizados para as viradas de fase;
 * - **voz** (`public/audio/foco/`), quando os MP3 existirem.
 *
 * Tudo respeita a chave de som do site (`da_jornada_som`).
 */

export type Ambiente = 'silencio' | 'marrom' | 'chuva' | 'lofi'

let contexto: AudioContext | null = null
let fonteAtual: { parar: () => void } | null = null
let ganhoAmbiente: GainNode | null = null

function somLigado(): boolean {
  try {
    return window.localStorage.getItem('da_jornada_som') !== 'off'
  } catch {
    return true
  }
}

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (contexto) return contexto
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    contexto = new Ctor()
  } catch {
    return null
  }
  return contexto
}

function bufferDeRuido(c: AudioContext, tipo: 'marrom' | 'rosa'): AudioBuffer {
  const segundos = 4
  const buffer = c.createBuffer(2, c.sampleRate * segundos, c.sampleRate)
  for (let canal = 0; canal < 2; canal++) {
    const dados = buffer.getChannelData(canal)
    let ultimo = 0
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < dados.length; i++) {
      const branco = Math.random() * 2 - 1
      if (tipo === 'marrom') {
        ultimo = (ultimo + 0.02 * branco) / 1.02
        dados[i] = ultimo * 3.5
      } else {
        // Ruído rosa (Paul Kellet).
        b0 = 0.99886 * b0 + branco * 0.0555179
        b1 = 0.99332 * b1 + branco * 0.0750759
        b2 = 0.969 * b2 + branco * 0.153852
        b3 = 0.8665 * b3 + branco * 0.3104856
        b4 = 0.55 * b4 + branco * 0.5329522
        b5 = -0.7616 * b5 - branco * 0.016898
        dados[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + branco * 0.5362) * 0.11
        b6 = branco * 0.115926
      }
    }
  }
  return buffer
}

/** Liga o ambiente escolhido (ou desliga, com `silencio`). Precisa de um gesto antes. */
export function tocarAmbiente(qual: Ambiente, volume = 0.5): void {
  pararAmbiente()
  if (qual === 'silencio' || !somLigado()) return
  const c = ctx()
  if (!c) return
  c.resume().catch(() => {})
  const ganho = c.createGain()
  ganho.gain.value = 0
  ganho.connect(c.destination)
  ganhoAmbiente = ganho

  if (qual === 'lofi') {
    const el = new Audio('/audio/jornada/musica.mp3')
    el.loop = true
    try {
      c.createMediaElementSource(el).connect(ganho)
    } catch {
      return
    }
    el.play().catch(() => {})
    fonteAtual = { parar: () => el.pause() }
  } else {
    const fonte = c.createBufferSource()
    fonte.buffer = bufferDeRuido(c, qual === 'marrom' ? 'marrom' : 'rosa')
    fonte.loop = true
    let saida: AudioNode = fonte
    if (qual === 'chuva') {
      const filtro = c.createBiquadFilter()
      filtro.type = 'lowpass'
      filtro.frequency.value = 2400
      fonte.connect(filtro)
      saida = filtro
    }
    saida.connect(ganho)
    fonte.start()
    fonteAtual = { parar: () => { try { fonte.stop() } catch {} } }
  }
  const alvo = Math.max(0, Math.min(1, volume)) * (qual === 'lofi' ? 0.45 : 0.6)
  ganho.gain.linearRampToValueAtTime(alvo, c.currentTime + 1.5)
}

export function volumeDoAmbiente(volume: number, qual: Ambiente): void {
  const c = contexto
  if (!c || !ganhoAmbiente) return
  const alvo = Math.max(0, Math.min(1, volume)) * (qual === 'lofi' ? 0.45 : 0.6)
  ganhoAmbiente.gain.linearRampToValueAtTime(alvo, c.currentTime + 0.2)
}

export function pararAmbiente(): void {
  const c = contexto
  const ganho = ganhoAmbiente
  const fonte = fonteAtual
  fonteAtual = null
  ganhoAmbiente = null
  if (!c || !ganho || !fonte) return
  ganho.gain.linearRampToValueAtTime(0, c.currentTime + 0.6)
  window.setTimeout(() => fonte.parar(), 650)
}

/** Sinos de virada de fase: começo (subindo), pausa (descendo), fim (acorde). */
export function tocarSino(qual: 'inicio' | 'pausa' | 'volta' | 'fim' | 'toque' | 'erro'): void {
  if (!somLigado()) return
  const c = ctx()
  if (!c) return
  c.resume().catch(() => {})
  const notas: Record<typeof qual, number[]> = {
    inicio: [523.25, 783.99],
    pausa: [783.99, 659.25, 523.25],
    volta: [523.25, 659.25, 783.99],
    fim: [523.25, 659.25, 783.99, 1046.5],
    toque: [1046.5],
    erro: [196, 185],
  }
  notas[qual].forEach((f, i) => {
    const inicio = c.currentTime + i * (qual === 'toque' ? 0 : 0.14)
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = qual === 'erro' ? 'triangle' : 'sine'
    osc.frequency.value = f
    g.gain.setValueAtTime(0, inicio)
    g.gain.linearRampToValueAtTime(qual === 'toque' ? 0.05 : 0.09, inicio + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + (qual === 'fim' ? 1.6 : 0.9))
    osc.connect(g).connect(c.destination)
    osc.start(inicio)
    osc.stop(inicio + 1.7)
  })
}

/** A voz do foco, quando os MP3 estiverem no ar. */
export function falarFoco(id: IdDaFalaDeFoco): void {
  if (!AUDIOS_DE_FOCO_PRONTOS || !somLigado()) return
  try {
    const el = new Audio(`${PASTA_DE_AUDIO_DE_FOCO}/${id}.mp3`)
    el.play().catch(() => {})
  } catch {}
}
