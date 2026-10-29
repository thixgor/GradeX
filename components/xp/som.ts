'use client'

/**
 * Os sons do XP, sintetizados na hora (sem arquivo): o "plim" do ponto ganho e
 * o acorde da subida de nível. Respeitam a mesma chave de som da jornada de
 * perfil (`da_jornada_som`): quem desligou o som lá, desligou aqui.
 *
 * O navegador só deixa tocar depois de algum gesto na página — e o XP sempre
 * chega depois de um (a pessoa acabou de resolver, revisar, entregar). Se o
 * contexto de áudio ainda estiver suspenso, o som simplesmente não sai.
 */

let contexto: AudioContext | null = null

function somLigado(): boolean {
  try {
    return window.localStorage.getItem('da_jornada_som') !== 'off'
  } catch {
    return true
  }
}

export function tocarSomDeXp(qual: 'ponto' | 'grande' | 'nivel'): void {
  if (typeof window === 'undefined' || !somLigado()) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && qual === 'ponto') return
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    contexto ||= new Ctor()
    const ctx = contexto
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const notas =
      qual === 'ponto' ? [784, 1175] : qual === 'grande' ? [659.25, 783.99, 1046.5, 1318.5] : [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568]
    const passo = qual === 'ponto' ? 0.07 : 0.09
    notas.forEach((frequencia, i) => {
      const inicio = ctx.currentTime + i * passo
      const osc = ctx.createOscillator()
      const ganho = ctx.createGain()
      osc.type = qual === 'nivel' && i % 2 ? 'triangle' : 'sine'
      osc.frequency.value = frequencia
      ganho.gain.setValueAtTime(0, inicio)
      ganho.gain.linearRampToValueAtTime(qual === 'ponto' ? 0.05 : 0.07, inicio + 0.012)
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + (qual === 'nivel' ? 1.1 : 0.4))
      osc.connect(ganho).connect(ctx.destination)
      osc.start(inicio)
      osc.stop(inicio + 1.2)
    })
  } catch {
    // som é enfeite: nunca vira erro
  }
}
