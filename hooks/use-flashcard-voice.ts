'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Modo voz dos flashcards — reconhecimento de fala restrito às três avaliações
 * (Fácil / Médio / Difícil).
 *
 * Regra central: NENHUMA palavra fora do dicionário abaixo pode disparar ação.
 * O usuário lê a resposta em voz alta, comenta, xinga — nada disso pode virar
 * uma avaliação. Por isso o casamento é por igualdade exata contra um conjunto
 * fechado de frases (depois de tirar acento, pontuação e algumas partículas de
 * apoio), e não por "contém" — que marcaria "não achei fácil não" como Fácil.
 */

import type { FlashcardSpacedRating } from '@/lib/types'

export type VoiceRating = FlashcardSpacedRating

export type VoiceStatus =
  | 'unsupported' // navegador sem Web Speech API (Firefox, WebViews antigas)
  | 'idle'        // suportado, mas desligado agora
  | 'starting'    // pedindo permissão / abrindo o microfone
  | 'listening'   // microfone aberto
  | 'denied'      // usuário (ou o sistema) negou o microfone
  | 'error'       // falha de hardware/rede — dá para tentar de novo

interface UseFlashcardVoiceOptions {
  /** Liga o microfone. Na prática: estudando + modo voz + card no verso. */
  enabled: boolean
  onRating: (rating: VoiceRating, heard: string) => void
  lang?: string
}

/**
 * Frases aceitas por avaliação. Tudo aqui já vem normalizado (sem acento).
 * Os nomes antigos (suave / no ponto / porrete) continuam valendo: quem se
 * acostumou a falar assim não precisa reaprender por causa da troca de rótulo.
 */
const RATING_PHRASES: Record<VoiceRating, string[]> = {
  FACIL: ['facil', 'suave', 'facinho', 'facilimo', 'tranquilo'],
  MEDIO: ['medio', 'media', 'no ponto', 'ponto', 'mediano'],
  DIFICIL: ['dificil', 'porrete', 'porrada', 'pesado', 'complicado', 'errei'],
}

/**
 * Partículas de apoio removidas das pontas antes de comparar. Sem isso, "foi
 * suave" ou "tá difícil" — a forma natural de falar — não casariam. A lista é
 * curta de propósito: cada palavra aqui é uma chance a mais de falso positivo.
 */
const FILLERS = new Set([
  'foi', 'ta', 'esta', 'e', 'eh', 'muito', 'bem', 'ai', 'ah', 'o', 'a',
  'mais', 'meio', 'bastante', 'super', 'achei',
])

/** Minúsculas, sem acento, sem pontuação, espaços colapsados. */
function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tira as partículas de apoio das duas pontas (não do meio). */
function stripFillers(text: string): string {
  const words = text.split(' ').filter(Boolean)
  let start = 0
  let end = words.length
  while (start < end && FILLERS.has(words[start])) start++
  while (end > start && FILLERS.has(words[end - 1])) end--
  return words.slice(start, end).join(' ')
}

/**
 * Devolve a avaliação SÓ quando o que sobrou é exatamente uma das frases do
 * dicionário. Qualquer outra coisa → `null`, e o hook simplesmente ignora.
 */
export function matchRating(raw: string): VoiceRating | null {
  const core = stripFillers(normalizeTranscript(raw))
  if (!core) return null
  // Frase longa nunca é um comando: corta cedo e evita casos esquisitos.
  if (core.split(' ').length > 3) return null

  const hits = new Set<VoiceRating>()
  for (const [rating, phrases] of Object.entries(RATING_PHRASES) as [VoiceRating, string[]][]) {
    if (phrases.includes(core)) hits.add(rating)
  }
  // Empate ("fácil ou difícil") é ambiguidade — nunca marca nada.
  return hits.size === 1 ? Array.from(hits)[0] : null
}

function getRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

export function useFlashcardVoice({ enabled, onRating, lang = 'pt-BR' }: UseFlashcardVoiceOptions) {
  const [supported, setSupported] = useState(false)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [heard, setHeard] = useState('')

  const recognitionRef = useRef<any>(null)
  const runningRef = useRef(false)
  // `enabled` dentro dos handlers nativos ficaria congelado no valor do render
  // em que o reconhecimento foi criado — o auto-restart precisa do valor atual.
  const enabledRef = useRef(enabled)
  const onRatingRef = useRef(onRating)
  // Uma avaliação por ativação: o Chrome repete o mesmo trecho entre resultados
  // parciais e finais, e sem isso o card seria avaliado duas ou três vezes.
  const firedRef = useRef(false)
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartCountRef = useRef(0)
  const deniedRef = useRef(false)
  // `stop()`/`abort()` também disparam `onend`. Sem essa trava, parar o
  // microfone ao esconder a aba seria imediatamente desfeito pelo auto-restart.
  const suppressRestartRef = useRef(false)

  onRatingRef.current = onRating
  enabledRef.current = enabled

  useEffect(() => {
    setSupported(!!getRecognitionCtor())
  }, [])

  const stopRecognition = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current)
      restartTimerRef.current = null
    }
    suppressRestartRef.current = true
    const rec = recognitionRef.current
    if (!rec) return
    runningRef.current = false
    try { rec.stop() } catch {}
    try { rec.abort?.() } catch {}
  }, [])

  const startRecognition = useCallback(() => {
    if (deniedRef.current) return
    suppressRestartRef.current = false
    const Ctor = getRecognitionCtor()
    if (!Ctor) { setStatus('unsupported'); return }
    if (runningRef.current) return

    let rec = recognitionRef.current
    if (!rec) {
      rec = new Ctor()
      rec.lang = lang
      rec.continuous = true
      rec.interimResults = true
      // Alternativas extras aumentam a chance de "porrete" aparecer em alguma
      // delas sem afrouxar o filtro — todas passam pelo mesmo casamento exato.
      rec.maxAlternatives = 3

      rec.onstart = () => {
        runningRef.current = true
        restartCountRef.current = 0
        setStatus('listening')
      }

      rec.onresult = (event: any) => {
        if (firedRef.current || !enabledRef.current) return
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          // Alternativas de menor confiança só entram no resultado final: num
          // parcial elas são chute em cima de áudio incompleto e é justamente
          // aí que "médico" viraria "médio" e marcaria o card sozinho.
          const limit = result.isFinal ? result.length : 1
          for (let a = 0; a < limit; a++) {
            const transcript: string = result[a]?.transcript || ''
            if (!transcript.trim()) continue
            const rating = matchRating(transcript)
            if (rating) {
              firedRef.current = true
              setHeard(transcript.trim())
              onRatingRef.current(rating, transcript.trim())
              return
            }
          }
        }
      }

      rec.onerror = (event: any) => {
        const code = event?.error
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          deniedRef.current = true
          runningRef.current = false
          setStatus('denied')
          return
        }
        // 'no-speech', 'aborted' e 'audio-capture' são rotina: o navegador
        // encerra sozinho e o onend reabre. Nada a reportar ao usuário.
        if (code === 'network') setStatus('error')
      }

      rec.onend = () => {
        runningRef.current = false
        if (!enabledRef.current || firedRef.current || deniedRef.current || suppressRestartRef.current) {
          setStatus(s => (s === 'denied' || s === 'error' ? s : 'idle'))
          return
        }
        // O Chrome encerra a sessão a cada poucos segundos de silêncio e o
        // Safari ignora `continuous` — reabrir é o que mantém o modo voz vivo
        // durante a leitura da resposta. Teto para não virar laço se o
        // microfone estiver indisponível.
        if (restartCountRef.current >= 60) { setStatus('error'); return }
        restartCountRef.current++
        restartTimerRef.current = setTimeout(() => {
          restartTimerRef.current = null
          if (enabledRef.current && !firedRef.current && !deniedRef.current) {
            try { rec.start() } catch {}
          }
        }, 250)
      }

      recognitionRef.current = rec
    } else {
      rec.lang = lang
    }

    setStatus('starting')
    try {
      rec.start()
    } catch {
      // InvalidStateError: já havia uma sessão aberta. O onend reabre.
      runningRef.current = false
    }
  }, [lang])

  // Liga/desliga conforme o card vira. Toda a economia de bateria mora aqui:
  // fora do verso do card o microfone simplesmente não existe.
  useEffect(() => {
    if (!supported) return
    if (enabled) {
      firedRef.current = false
      restartCountRef.current = 0
      setHeard('')
      startRecognition()
    } else {
      firedRef.current = false
      stopRecognition()
      setStatus(s => (s === 'denied' || s === 'unsupported' ? s : 'idle'))
    }
    return () => { if (enabled) stopRecognition() }
  }, [enabled, supported, startRecognition, stopRecognition])

  // Aba escondida / tela bloqueada: solta o microfone (o indicador de gravação
  // do sistema apagando é o que o usuário espera) e reabre ao voltar.
  useEffect(() => {
    if (!supported) return
    function onVisibility() {
      if (document.hidden) {
        stopRecognition()
      } else if (enabledRef.current && !firedRef.current && !deniedRef.current) {
        restartCountRef.current = 0
        startRecognition()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [supported, startRecognition, stopRecognition])

  // Desmontou (saiu do estudo, trocou de página): não deixa microfone aberto.
  useEffect(() => () => {
    stopRecognition()
    recognitionRef.current = null
  }, [stopRecognition])

  /** Nova tentativa depois de negar a permissão — só o usuário pode pedir. */
  const retry = useCallback(() => {
    deniedRef.current = false
    restartCountRef.current = 0
    setStatus('idle')
    if (enabledRef.current) startRecognition()
  }, [startRecognition])

  return {
    supported,
    status: supported ? status : ('unsupported' as VoiceStatus),
    heard,
    retry,
  }
}
