'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDIOS_PRONTOS, FALAS, PASTA_DE_AUDIO, type IdDaFala } from '@/lib/jornada/narracao'

/**
 * O som da jornada de perfil: a voz que narra, a música de fundo e os efeitos
 * de jogo (o "plim" de ponto ganho, a fanfarra da conquista).
 *
 * ## Por que a música passa por Web Audio
 *
 * No iPhone, `audio.volume` é só leitura — o Safari ignora. Uma música de fundo
 * tocada direto pelo `<audio>` sairia no volume cheio, por cima da voz. Ligada a
 * um `GainNode`, ela fica baixinha e ainda "abaixa" (ducking) enquanto a voz
 * fala, em qualquer navegador.
 *
 * ## Por que nada toca antes do primeiro toque
 *
 * Navegador nenhum deixa uma página tocar som sozinha. `destravar()` é chamado
 * no primeiro gesto da pessoa (o "Começar", ou o primeiro toque no modal) e é
 * dali que a música entra, em fade.
 *
 * ## A fila da voz
 *
 * A reação à profissão ("Residente! Plantão puxado, né?") toca enquanto a tela
 * já desliza para o passo seguinte. Se a fala do passo novo cortasse a reação,
 * a pessoa ouviria meia frase. Então reação não é interrompida: a fala do passo
 * entra na fila e toca logo depois. Fala de passo, essa sim, é interrompida
 * quando a pessoa avança rápido — ninguém quer ouvir a pergunta que já respondeu.
 */

const CHAVE_PREFERENCIA = 'da_jornada_som'
// A música chega a -20 LUFS e as vozes a -18 (ver docs/jornada-voz-e-musica.md):
// a 30% a música fica ~12 dB abaixo da voz quando toca sozinha, e a 10% some
// para trás enquanto a narradora fala (~22 dB abaixo).
const VOLUME_MUSICA = 0.3
const VOLUME_MUSICA_SOB_VOZ = 0.1

export type Efeito = 'toque' | 'ponto' | 'conquista' | 'fim'

/** Falas que terminam mesmo se a tela andar: a boas-vindas, as reações e o fim. */
function ehProtegida(id: IdDaFala): boolean {
  return id === 'boas-vindas' || id === 'conclusao' || id.startsWith('reacao-')
}

function lerPreferencia(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_PREFERENCIA) !== 'off'
  } catch {
    return true
  }
}

export function useSomDaJornada(aberto: boolean) {
  const [ligado, setLigado] = useState(true)
  const [falando, setFalando] = useState<IdDaFala | null>(null)
  const [legenda, setLegenda] = useState<IdDaFala | null>(null)

  const contexto = useRef<AudioContext | null>(null)
  const ganhoDaMusica = useRef<GainNode | null>(null)
  const musica = useRef<HTMLAudioElement | null>(null)
  const voz = useRef<HTMLAudioElement | null>(null)
  const vozAtual = useRef<{ id: IdDaFala; protegida: boolean } | null>(null)
  const fila = useRef<IdDaFala[]>([])
  const destravado = useRef(false)
  const ligadoRef = useRef(true)

  useEffect(() => {
    const preferencia = lerPreferencia()
    setLigado(preferencia)
    ligadoRef.current = preferencia
  }, [])

  const ajustarMusica = useCallback((alvo: number, segundos = 0.6) => {
    const ctx = contexto.current
    const ganho = ganhoDaMusica.current
    if (!ctx || !ganho) return
    const agora = ctx.currentTime
    ganho.gain.cancelScheduledValues(agora)
    ganho.gain.setValueAtTime(ganho.gain.value, agora)
    ganho.gain.linearRampToValueAtTime(alvo, agora + segundos)
  }, [])

  const garantirContexto = useCallback((): AudioContext | null => {
    if (contexto.current) return contexto.current
    const Ctor = typeof window !== 'undefined'
      ? window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined
    if (!Ctor) return null
    try {
      contexto.current = new Ctor()
    } catch {
      return null
    }
    return contexto.current
  }, [])

  const iniciarMusica = useCallback(() => {
    if (!AUDIOS_PRONTOS.musica || musica.current) return
    const ctx = garantirContexto()
    if (!ctx) return
    const el = new Audio(`${PASTA_DE_AUDIO}/musica.mp3`)
    el.loop = true
    el.preload = 'auto'
    try {
      const fonte = ctx.createMediaElementSource(el)
      const ganho = ctx.createGain()
      ganho.gain.value = 0
      fonte.connect(ganho).connect(ctx.destination)
      ganhoDaMusica.current = ganho
    } catch {
      return
    }
    musica.current = el
    el.play().then(
      () => ajustarMusica(vozAtual.current ? VOLUME_MUSICA_SOB_VOZ : VOLUME_MUSICA, 2.2),
      () => {},
    )
  }, [ajustarMusica, garantirContexto])

  const tocarProxima = useCallback(() => {
    const id = fila.current.shift()
    if (!id) {
      vozAtual.current = null
      setFalando(null)
      ajustarMusica(VOLUME_MUSICA)
      return
    }
    tocar(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajustarMusica])

  function tocar(id: IdDaFala) {
    setLegenda(id)
    if (!AUDIOS_PRONTOS.voz || !ligadoRef.current || !destravado.current) {
      vozAtual.current = null
      setFalando(null)
      return
    }
    const el = new Audio(`${PASTA_DE_AUDIO}/${id}.mp3`)
    el.preload = 'auto'
    voz.current = el
    vozAtual.current = { id, protegida: ehProtegida(id) }
    const acabou = () => {
      if (voz.current !== el) return
      voz.current = null
      tocarProxima()
    }
    el.addEventListener('ended', acabou)
    el.addEventListener('error', acabou)
    ajustarMusica(VOLUME_MUSICA_SOB_VOZ, 0.35)
    el.play().then(() => setFalando(id), acabou)
  }

  /**
   * Narra uma fala. Fala protegida (boas-vindas, reação, fim) não é cortada por
   * fala de passo — esta espera na fila; fala de passo é substituída pela nova.
   */
  const falar = useCallback((id: IdDaFala) => {
    if (!FALAS[id]) return
    const atual = vozAtual.current
    if (atual?.protegida && !ehProtegida(id)) {
      fila.current = [id]
      return
    }
    fila.current = []
    if (voz.current) {
      voz.current.pause()
      voz.current = null
    }
    tocar(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** Primeiro gesto da pessoa: libera o áudio e entra a música. */
  const destravar = useCallback((): boolean => {
    if (destravado.current) return false
    destravado.current = true
    const ctx = garantirContexto()
    ctx?.resume().catch(() => {})
    if (ligadoRef.current) iniciarMusica()
    return true
  }, [garantirContexto, iniciarMusica])

  /**
   * Efeitos de jogo sintetizados na hora (sem arquivo): notas curtas de
   * sinos, suaves, que não brigam com a música.
   */
  const efeito = useCallback((qual: Efeito) => {
    if (!ligadoRef.current || !destravado.current) return
    const ctx = garantirContexto()
    if (!ctx) return
    const notas: Record<Efeito, number[]> = {
      toque: [880],
      ponto: [660, 990],
      conquista: [523.25, 659.25, 783.99, 1046.5],
      fim: [523.25, 659.25, 783.99, 1046.5, 1318.5],
    }
    const passo = qual === 'toque' ? 0 : 0.085
    notas[qual].forEach((frequencia, i) => {
      const inicio = ctx.currentTime + i * passo
      const osc = ctx.createOscillator()
      const ganho = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequencia
      const pico = qual === 'toque' ? 0.04 : 0.07
      ganho.gain.setValueAtTime(0, inicio)
      ganho.gain.linearRampToValueAtTime(pico, inicio + 0.012)
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + (qual === 'fim' ? 0.9 : 0.45))
      osc.connect(ganho).connect(ctx.destination)
      osc.start(inicio)
      osc.stop(inicio + 1)
    })
    if (qual !== 'toque' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(qual === 'fim' ? [12, 40, 18] : 10) } catch {}
    }
  }, [garantirContexto])

  const alternar = useCallback(() => {
    const novo = !ligadoRef.current
    ligadoRef.current = novo
    setLigado(novo)
    try { window.localStorage.setItem(CHAVE_PREFERENCIA, novo ? 'on' : 'off') } catch {}
    if (!novo) {
      fila.current = []
      voz.current?.pause()
      voz.current = null
      vozAtual.current = null
      setFalando(null)
      musica.current?.pause()
    } else {
      destravado.current = true
      contexto.current?.resume().catch(() => {})
      if (musica.current) {
        musica.current.play().catch(() => {})
        ajustarMusica(VOLUME_MUSICA, 1.2)
      } else {
        iniciarMusica()
      }
    }
  }, [ajustarMusica, iniciarMusica])

  // Fechou o modal: a música sai em fade e tudo é solto.
  useEffect(() => {
    if (aberto) return
    fila.current = []
    voz.current?.pause()
    voz.current = null
    vozAtual.current = null
    const el = musica.current
    if (el) {
      ajustarMusica(0, 0.8)
      window.setTimeout(() => el.pause(), 850)
    }
  }, [aberto, ajustarMusica])

  useEffect(() => () => {
    voz.current?.pause()
    musica.current?.pause()
    contexto.current?.close().catch(() => {})
  }, [])

  /**
   * Onde a voz está agora (0–1), para o balão escrever no ritmo da fala.
   * `null` quando não há voz tocando — o balão volta ao ritmo de digitação.
   */
  const progressoDaVoz = useCallback((): number | null => {
    const el = voz.current
    if (!el || el.paused || !Number.isFinite(el.duration) || el.duration <= 0) return null
    return Math.min(1, el.currentTime / el.duration)
  }, [])

  return { ligado, alternar, falar, falando, legenda, destravar, efeito, progressoDaVoz }
}
