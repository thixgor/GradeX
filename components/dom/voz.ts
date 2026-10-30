'use client'

/**
 * A voz do Dom: síntese de fala do próprio aparelho (Web Speech, pt-BR, tom
 * agudo e fofinho) + "bipes" gerados na hora (Web Audio) para as reações
 * curtas — abrir, chegar resposta, errar.
 *
 * Por que não áudio gravado: zero byte baixado, zero custo de servidor, e o
 * Dom pode falar qualquer frase do repertório (e ler as respostas, quando o
 * aluno toca em "ouvir"). Os momentos falados vêm de `falas.ts`.
 *
 * Tudo respeita o botão de mudo (guardado no aparelho) e só toca depois de
 * um toque do aluno — o navegador bloqueia áudio antes disso de qualquer jeito.
 */

const CHAVE_MUDO = 'dom:mudo'

export function estaMudo(): boolean {
  try {
    return localStorage.getItem(CHAVE_MUDO) === '1'
  } catch {
    return false
  }
}

export function definirMudo(mudo: boolean): void {
  try {
    localStorage.setItem(CHAVE_MUDO, mudo ? '1' : '0')
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  if (mudo) pararDeFalar()
}

function vozPtBr(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const vozes = window.speechSynthesis.getVoices().filter((v) => /^pt(-|_)?BR/i.test(v.lang) || /portugu[eê]s.*brasil/i.test(v.name))
  if (!vozes.length) return null
  // Preferência: vozes naturais/neurais e masculinas (o Dom é um menino), depois qualquer pt-BR.
  const pontos = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online|google/i.test(v.name) ? 4 : 0) + (/antonio|daniel|felipe|ricardo|male|masculin/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1)
  return [...vozes].sort((a, b) => pontos(b) - pontos(a))[0]
}

export interface OuvintesDaFala {
  aoComecar?: () => void
  aoTerminar?: () => void
  /** Uma vez por palavra (para a boca mudar de ritmo). */
  aoPalavra?: () => void
}

let falaAtual: SpeechSynthesisUtterance | null = null

/** Tira marcação e encurta para a fala não virar audiobook. */
function textoParaFala(texto: string, teto: number): string {
  const limpo = texto
    .replace(/\*\*?|__?|`|#+\s/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (limpo.length <= teto) return limpo
  const corte = limpo.slice(0, teto)
  const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('! '), corte.lastIndexOf('? '))
  return fim > teto * 0.4 ? corte.slice(0, fim + 1) : corte + '…'
}

export function falar(texto: string, ouvintes: OuvintesDaFala = {}, teto = 260): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || estaMudo() || !texto) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(textoParaFala(texto, teto))
  u.lang = 'pt-BR'
  const voz = vozPtBr()
  if (voz) u.voice = voz
  u.pitch = 1.55
  u.rate = 1.06
  u.volume = 0.9
  u.onstart = () => ouvintes.aoComecar?.()
  const fim = () => {
    if (falaAtual === u) falaAtual = null
    ouvintes.aoTerminar?.()
  }
  u.onend = fim
  u.onerror = fim
  u.onboundary = (e) => {
    if (e.name === 'word') ouvintes.aoPalavra?.()
  }
  falaAtual = u
  synth.speak(u)
  return true
}

export function pararDeFalar(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  falaAtual = null
}

export function vozDisponivel(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// ── Bipes ──────────────────────────────────────────────────────────────────

let audio: AudioContext | null = null

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    audio ??= new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audio.state === 'suspended') void audio.resume()
    return audio
  } catch {
    return null
  }
}

type Bipe = 'abrir' | 'resposta' | 'erro' | 'enviar' | 'magia' | 'fechar'

const NOTAS: Record<Bipe, Array<[freq: number, inicio: number, duracao: number]>> = {
  abrir: [[660, 0, 0.09], [880, 0.08, 0.12]],
  resposta: [[784, 0, 0.07], [1046, 0.06, 0.1]],
  enviar: [[523, 0, 0.06]],
  erro: [[392, 0, 0.12], [311, 0.11, 0.18]],
  fechar: [[880, 0, 0.07], [660, 0.06, 0.1]],
  magia: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.1], [1046, 0.24, 0.22]],
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
    ganho.gain.exponentialRampToValueAtTime(0.08, agora + inicio + 0.015)
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + inicio + duracao)
    osc.connect(ganho).connect(ctx.destination)
    osc.start(agora + inicio)
    osc.stop(agora + inicio + duracao + 0.02)
  }
}
