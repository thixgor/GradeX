'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  applyLiteModeToDocument,
  detectDeviceCapability,
  parseLitePreference,
  readStoredLitePreference,
  LITE_AUTO_NOTICE_KEY,
  LITE_CHANGE_EVENT,
  LITE_PROMPT_DISMISS_KEY,
  LITE_PROMPT_SNOOZE_MS,
  LITE_STORAGE_KEY,
  type DeviceCapability,
  type LitePreference,
} from '@/lib/lite-mode'

export interface LiteModeContextType {
  /** Modo Lite ativo agora (já resolvendo o `auto`). */
  liteMode: boolean
  /** Escolha do usuário: `auto` | `on` | `off`. */
  preference: LitePreference
  setPreference: (preference: LitePreference) => void
  /** Liga/desliga direto (usado pelos botões de atalho no header e na sidebar). */
  toggleLiteMode: () => void
  /** `false` até o valor real do localStorage ser lido — evita mismatch de SSR. */
  hydrated: boolean
  /** Sinais de capacidade do aparelho (memória, CPU, conexão). */
  device: DeviceCapability | null
  /** Está ligado porque o `auto` detectou aparelho fraco (não por escolha explícita). */
  autoEnabled: boolean
  /** A plataforma mediu travamentos reais ou detectou aparelho fraco e vale sugerir. */
  shouldSuggest: boolean
  /** Some com o convite por 7 dias. */
  dismissSuggestion: () => void
  /** O usuário já viu o aviso de "ativei sozinho"? */
  autoNoticeSeen: boolean
  markAutoNoticeSeen: () => void
}

export const LiteModeContext = createContext<LiteModeContextType | null>(null)

/** Quadros por segundo abaixo disso = interface travando de verdade. */
const SLOW_FPS_THRESHOLD = 34
/** Janela de medição dos quadros (ms). Curta o suficiente pra não pesar. */
const FPS_SAMPLE_MS = 2600

function resolveLiteMode(preference: LitePreference, device: DeviceCapability | null): boolean {
  if (preference === 'on') return true
  if (preference === 'off') return false
  return !!device?.shouldAutoEnable
}

export function LiteModeProvider({ children }: { children: ReactNode }) {
  // Começa em `auto`/desligado no servidor e na primeira renderização do cliente
  // (o script inline do <head> já pintou a tela certa); o valor real entra logo
  // após montar, sem mismatch de hidratação.
  const [preference, setPreferenceState] = useState<LitePreference>('auto')
  const [device, setDevice] = useState<DeviceCapability | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [measuredSlow, setMeasuredSlow] = useState(false)
  const [promptSnoozed, setPromptSnoozed] = useState(true)
  const [autoNoticeSeen, setAutoNoticeSeen] = useState(true)
  const measuredRef = useRef(false)

  const liteMode = resolveLiteMode(preference, device)

  // ── Hidratação: lê preferência + capacidade do aparelho ──
  useEffect(() => {
    const storedPreference = readStoredLitePreference()
    const capability = detectDeviceCapability()

    let snoozed = false
    let noticeSeen = false
    try {
      const dismissedAt = Number(localStorage.getItem(LITE_PROMPT_DISMISS_KEY) || 0)
      snoozed = !!dismissedAt && Date.now() - dismissedAt < LITE_PROMPT_SNOOZE_MS
      noticeSeen = localStorage.getItem(LITE_AUTO_NOTICE_KEY) === 'true'
    } catch {}

    setPreferenceState(storedPreference)
    setDevice(capability)
    setPromptSnoozed(snoozed)
    setAutoNoticeSeen(noticeSeen)
    setHydrated(true)
  }, [])

  // ── Aplica no <html> sempre que o valor resolvido muda ──
  useEffect(() => {
    if (!hydrated) return
    applyLiteModeToDocument(liteMode, preference)
    window.dispatchEvent(
      new CustomEvent(LITE_CHANGE_EVENT, { detail: { liteMode, preference } }),
    )
  }, [hydrated, liteMode, preference])

  // ── Conexão pode mudar no meio da sessão (Wi-Fi → 3G, economia de dados) ──
  useEffect(() => {
    if (!hydrated || preference !== 'auto') return
    const nav = navigator as Navigator & {
      connection?: EventTarget & { addEventListener?: (t: string, l: () => void) => void }
    }
    const connection = nav.connection
    if (!connection?.addEventListener) return

    const onChange = () => setDevice(detectDeviceCapability())
    connection.addEventListener('change', onChange)
    return () => (connection as any).removeEventListener?.('change', onChange)
  }, [hydrated, preference])

  // ── Sincroniza entre abas ──
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LITE_STORAGE_KEY) return
      setPreferenceState(parseLitePreference(event.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ── Medição real de travamento ──
  // Aparelho fraco nem sempre se declara: `deviceMemory` mente, `hardwareConcurrency`
  // conta núcleos que não entregam. Então, quando o Lite está DESLIGADO, medimos os
  // quadros por segundo durante alguns segundos de uso. Se estiver arrastando, o
  // convite aparece — é a diferença entre "existe uma opção escondida no perfil" e
  // "a plataforma percebeu que travou e ofereceu a solução".
  useEffect(() => {
    if (!hydrated || liteMode || measuredRef.current || promptSnoozed) return
    if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return

    let frames = 0
    let rafId = 0
    let start = 0
    let cancelled = false

    const tick = (now: number) => {
      if (cancelled) return
      if (!start) start = now
      frames += 1
      const elapsed = now - start
      if (elapsed < FPS_SAMPLE_MS) {
        rafId = requestAnimationFrame(tick)
        return
      }
      measuredRef.current = true
      const fps = (frames * 1000) / elapsed
      // Só confia na medição se houve quadros suficientes (aba em segundo plano
      // congela o rAF e produziria um falso positivo).
      if (frames > 20 && fps < SLOW_FPS_THRESHOLD) setMeasuredSlow(true)
    }

    // Espera o carregamento assentar: medir durante o burst inicial mediria o
    // boot, não o uso.
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      rafId = requestAnimationFrame(tick)
    }, 3500)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [hydrated, liteMode, promptSnoozed])

  const setPreference = useCallback((next: LitePreference) => {
    setPreferenceState(next)
    setDevice((current) => current ?? detectDeviceCapability())
    try {
      localStorage.setItem(LITE_STORAGE_KEY, next)
    } catch {}
  }, [])

  const toggleLiteMode = useCallback(() => {
    setPreferenceState((prev) => {
      const currentlyOn = resolveLiteMode(prev, detectDeviceCapability())
      const next: LitePreference = currentlyOn ? 'off' : 'on'
      try {
        localStorage.setItem(LITE_STORAGE_KEY, next)
      } catch {}
      return next
    })
  }, [])

  const dismissSuggestion = useCallback(() => {
    setPromptSnoozed(true)
    try {
      localStorage.setItem(LITE_PROMPT_DISMISS_KEY, String(Date.now()))
    } catch {}
  }, [])

  const markAutoNoticeSeen = useCallback(() => {
    setAutoNoticeSeen(true)
    try {
      localStorage.setItem(LITE_AUTO_NOTICE_KEY, 'true')
    } catch {}
  }, [])

  const shouldSuggest =
    hydrated && !liteMode && !promptSnoozed && (measuredSlow || !!device?.shouldSuggest)

  const autoEnabled = preference === 'auto' && liteMode

  const value = useMemo<LiteModeContextType>(
    () => ({
      liteMode,
      preference,
      setPreference,
      toggleLiteMode,
      hydrated,
      device,
      autoEnabled,
      shouldSuggest,
      dismissSuggestion,
      autoNoticeSeen,
      markAutoNoticeSeen,
    }),
    [
      liteMode,
      preference,
      setPreference,
      toggleLiteMode,
      hydrated,
      device,
      autoEnabled,
      shouldSuggest,
      dismissSuggestion,
      autoNoticeSeen,
      markAutoNoticeSeen,
    ],
  )

  return <LiteModeContext.Provider value={value}>{children}</LiteModeContext.Provider>
}
