'use client'

/**
 * O som do Dom: falas GRAVADAS (ElevenLabs, ver `falas.ts`) e "bipes" curtos
 * gerados na hora (Web Audio) para as reações — abrir, chegar resposta, errar.
 *
 * Nada de voz sintetizada: o Dom só fala com a voz dele. Fala que ainda não
 * tem áudio (`AUDIOS_GRAVADOS`) não vira requisição: os ouvintes recebem
 * começo e fim num tempo estimado pelo tamanho do texto, e a boca mexe em
 * silêncio enquanto o balão mostra a frase.
 *
 * Com áudio, a boca segue a AMPLITUDE da gravação (um analisador lê o volume
 * a cada quadro): abre nas sílabas fortes e fecha nas pausas.
 *
 * Tudo respeita o botão de som (guardado no aparelho) e só toca depois de um
 * toque do aluno — o navegador bloqueia áudio antes disso de qualquer jeito.
 */

import { AUDIOS_GRAVADOS } from './audios-gravados'
import { textoDaFala, type Fala } from './falas'

const CHAVE_MUDO = 'dom:mudo'
const PASTA = '/dom/audio/v1'

export function estaMudo(): boolean {
  try {
    return localStorage.getItem(CHAVE_MUDO) === '1'
  } catch {
    return false
  }
}

export const EVENTO_DO_MUDO = 'dom:mudo'

export function definirMudo(mudo: boolean): void {
  try {
    localStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0')
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  if (mudo) pararDeFalar()
  // Todos os Doms da tela (lançador, painel, aparições) põem/tiram a fita juntos.
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO_DO_MUDO, { detail: { mudo } }))
}

/**
 * Silenciar com cena: o Dom reclama (a fala `desabilitado`, que toca mesmo
 * indo para o mudo) e só então leva a fita na boca. `aoFalar` recebe os
 * ouvintes da boca de quem está mostrando o Dom.
 */
export function silenciarComCena(fala: Fala, o: OuvintesDaFala = {}): void {
  falar(
    fala,
    {
      ...o,
      aoTerminar: () => {
        o.aoTerminar?.()
        definirMudo(true)
      },
    },
    { prioridade: 'alta', ignorarMudo: true },
  )
}

export function temAudio(fala: Fala): boolean {
  return AUDIOS_GRAVADOS.has(fala.id)
}

export interface OuvintesDaFala {
  aoComecar?: () => void
  aoTerminar?: () => void
  /** Boca aberta (true) ou fechada (false), no ritmo da fala. */
  aoBoca?: (aberta: boolean) => void
}

let atual: { audio?: HTMLAudioElement; parar: () => void } | null = null

/**
 * Parcimônia — o que impede o Dom de virar o colega chato:
 * - `alta`: o aluno pediu (silenciar, passo do guia, fim do socrático) → sempre;
 * - `normal`: saudações e reações → no máximo uma a cada 4 s;
 * - `baixa`: "pensando…", "achei!", "vou te levar lá" → no máximo uma a cada
 *   20 s. Nas outras, a frase vai só para o balão e a boca mexe em silêncio.
 *
 * Sem sorteio: com ele, a mesma ação ora falava, ora não — e parecia que a
 * voz tinha sumido.
 */
export type PrioridadeDaFala = 'alta' | 'normal' | 'baixa'
const INTERVALO_MINIMO_MS: Record<PrioridadeDaFala, number> = { alta: 0, normal: 4_000, baixa: 20_000 }
let ultimoAudioEm = 0

function deveTocar(prioridade: PrioridadeDaFala): boolean {
  if (prioridade === 'alta') return true
  return Date.now() - ultimoAudioEm >= INTERVALO_MINIMO_MS[prioridade]
}

export function pararDeFalar(): void {
  atual?.parar()
  atual = null
}

/** Duração estimada de uma fala sem áudio (≈ 14 caracteres por segundo). */
function duracaoEstimada(fala: Fala): number {
  return Math.min(6000, Math.max(900, textoDaFala(fala).length * 70))
}

/** Boca "falando" sem som: abre e fecha num ritmo irregular, como sílabas. */
function bocaMuda(ms: number, o: OuvintesDaFala): () => void {
  let aberta = false
  let vivo = true
  const passo = () => {
    if (!vivo) return
    aberta = !aberta
    o.aoBoca?.(aberta)
    timer = setTimeout(passo, 90 + Math.random() * 110)
  }
  let timer = setTimeout(passo, 60)
  const fim = setTimeout(() => {
    vivo = false
    clearTimeout(timer)
    o.aoBoca?.(false)
    o.aoTerminar?.()
  }, ms)
  o.aoComecar?.()
  return () => {
    vivo = false
    clearTimeout(timer)
    clearTimeout(fim)
    o.aoBoca?.(false)
    o.aoTerminar?.()
  }
}

/**
 * Fala em voz alta (ou mexe a boca em silêncio, se mudo ou sem gravação).
 * Interrompe a fala anterior.
 */
export function falar(
  fala: Fala,
  o: OuvintesDaFala = {},
  { prioridade = 'normal', ignorarMudo = false }: { prioridade?: PrioridadeDaFala; ignorarMudo?: boolean } = {},
): void {
  if (typeof window === 'undefined') return
  pararDeFalar()
  if ((estaMudo() && !ignorarMudo) || !temAudio(fala) || !deveTocar(prioridade)) {
    atual = { parar: bocaMuda(duracaoEstimada(fala), o) }
    return
  }
  ultimoAudioEm = Date.now()
  const audio = new Audio(`${PASTA}/${fala.id}.mp3`)
  audio.preload = 'auto'
  audio.volume = 0.75
  let quadro = 0
  let terminou = false
  let desligar: (() => void) | null = null
  let pararBocaMuda: (() => void) | null = null
  // Rede lenta ou arquivo travado: quem espera o fim (o guia, a cena do mudo)
  // não pode ficar parado para sempre.
  const limite = setTimeout(() => {
    if (!terminou && audio.paused) {
      audio.pause()
      atual = { parar: bocaMuda(duracaoEstimada(fala), o) }
      terminou = true
      desligar?.()
    }
  }, 5000)
  const terminar = () => {
    if (terminou) return
    terminou = true
    clearTimeout(limite)
    cancelAnimationFrame(quadro)
    pararBocaMuda?.()
    desligar?.()
    o.aoBoca?.(false)
    o.aoTerminar?.()
  }
  // Boca pela amplitude só com o Web Audio RODANDO. Ligar o elemento a um
  // contexto suspenso (sem toque ainda, aba que voltou do segundo plano, iOS
  // depois de uma ligação) manda o som para um destino mudo — era o "às vezes
  // a voz some". Fora disso, o elemento toca direto e a boca segue o ritmo
  // irregular.
  const ctx = contexto()
  const comAnalisador = !!ctx && ctx.state === 'running'
  if (comAnalisador && ctx) {
    try {
      const fonte = ctx.createMediaElementSource(audio)
      const analisador = ctx.createAnalyser()
      analisador.fftSize = 512
      // Com o Web Audio no meio, o volume do elemento não vale em todo
      // navegador: o ganho de 75% vai num nó próprio.
      const ganho = ctx.createGain()
      ganho.gain.value = 0.75
      fonte.connect(analisador).connect(ganho).connect(ctx.destination)
      audio.volume = 1
      desligar = () => {
        try {
          fonte.disconnect()
          ganho.disconnect()
        } catch {
          /* já desligado */
        }
      }
      const dados = new Uint8Array(analisador.fftSize)
      let aberta = false
      const ler = () => {
        analisador.getByteTimeDomainData(dados)
        let soma = 0
        for (let i = 0; i < dados.length; i++) {
          const v = (dados[i] - 128) / 128
          soma += v * v
        }
        const volume = Math.sqrt(soma / dados.length)
        const abrir = aberta ? volume > 0.035 : volume > 0.06
        if (abrir !== aberta) {
          aberta = abrir
          o.aoBoca?.(aberta)
        }
        quadro = requestAnimationFrame(ler)
      }
      audio.addEventListener('play', () => (quadro = requestAnimationFrame(ler)), { once: true })
    } catch {
      desligar = null
    }
  }
  audio.addEventListener('play', () => {
    clearTimeout(limite)
    o.aoComecar?.()
    if (!desligar) pararBocaMuda = bocaMuda(audio.duration ? audio.duration * 1000 : duracaoEstimada(fala), { aoBoca: o.aoBoca })
  }, { once: true })
  audio.addEventListener('ended', terminar, { once: true })
  audio.addEventListener('error', () => {
    // Arquivo listado mas ausente (deploy pela metade): cai para a boca muda.
    if (terminou) return
    clearTimeout(limite)
    terminou = true
    desligar?.()
    atual = { parar: bocaMuda(duracaoEstimada(fala), o) }
  }, { once: true })
  audio.play().catch(() => {
    // Autoplay bloqueado (sem toque ainda): fica só o balão, com a boca mexendo.
    if (terminou) return
    clearTimeout(limite)
    terminou = true
    desligar?.()
    atual = { parar: bocaMuda(duracaoEstimada(fala), o) }
  })
  atual = {
    audio,
    parar: () => {
      audio.pause()
      terminar()
    },
  }
}

// ── Bipes ──────────────────────────────────────────────────────────────────

let audioCtx: AudioContext | null = null
let destravaInstalada = false

/**
 * O navegador suspende o contexto (sem toque, aba em segundo plano, iOS
 * "interrupted"). A cada toque/tecla e a cada volta da aba, tenta retomar —
 * assim a próxima fala sai com voz e com a boca pela amplitude.
 */
function instalarDestrava(): void {
  if (destravaInstalada || typeof window === 'undefined') return
  destravaInstalada = true
  const retomar = () => {
    if (audioCtx && audioCtx.state !== 'running' && audioCtx.state !== 'closed') void audioCtx.resume().catch(() => {})
  }
  for (const evento of ['pointerdown', 'keydown', 'touchend'] as const) window.addEventListener(evento, retomar, { passive: true, capture: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retomar()
  })
}

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!audioCtx || audioCtx.state === 'closed') audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    instalarDestrava()
    if (audioCtx.state !== 'running') void audioCtx.resume().catch(() => {})
    return audioCtx
  } catch {
    return null
  }
}

type Bipe = 'abrir' | 'resposta' | 'erro' | 'enviar' | 'magia' | 'fechar' | 'surgir'

const NOTAS: Record<Bipe, Array<[freq: number, inicio: number, duracao: number]>> = {
  abrir: [[660, 0, 0.09], [880, 0.08, 0.12]],
  resposta: [[784, 0, 0.07], [1046, 0.06, 0.1]],
  enviar: [[523, 0, 0.06]],
  erro: [[392, 0, 0.12], [311, 0.11, 0.18]],
  fechar: [[880, 0, 0.07], [660, 0.06, 0.1]],
  magia: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.1], [1046, 0.24, 0.22]],
  surgir: [[587, 0, 0.08], [784, 0.07, 0.08], [988, 0.14, 0.14]],
}

export function bipe(qual: Bipe): void {
  if (estaMudo()) return
  const ctx = contexto()
  if (!ctx) return
  const agora = ctx.currentTime
  for (const [freq, inicio, duracao] of NOTAS[qual]) {
    const osc = ctx.createOscillator()
    const ganho = ctx.createGain()
    osc.type = qual === 'erro' ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq, agora + inicio)
    ganho.gain.setValueAtTime(0.0001, agora + inicio)
    ganho.gain.exponentialRampToValueAtTime(0.07, agora + inicio + 0.015)
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + duracao)
    osc.connect(ganho).connect(ctx.destination)
    osc.start(agora + inicio)
    osc.stop(agora + inicio + duracao + 0.02)
  }
}
