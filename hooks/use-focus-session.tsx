'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { useIntervaloVisivel } from '@/hooks/use-intervalo-visivel'
import { formatarRelogio } from '@/lib/foco/ritmo-de-foco'

// ============================================================
// Types
// ============================================================

export interface FocusSession {
  id: string
  objective: string
  startedAt: string         // ISO string
  pausedAt?: string         // ISO string - when paused
  totalPausedMs: number     // accumulated paused time
  finishedAt?: string       // ISO string
  status: 'active' | 'paused' | 'finished'
  /** Meta da sessão em minutos (25, 50, 90…). Sem meta, é cronômetro livre. */
  targetMinutes?: number
}

export interface FocusSessionHistory {
  id: string
  objective: string
  startedAt: string
  finishedAt: string
  totalTimeMs: number       // net study time (excluding pauses)
  syncedToServer: boolean
  targetMinutes?: number
}

interface FocusSessionContextType {
  // Current session
  currentSession: FocusSession | null
  elapsedMs: number         // real-time elapsed (excluding pauses)

  // Actions
  startSession: (objective: string, targetMinutes?: number) => void
  pauseSession: () => void
  resumeSession: () => void
  finishSession: () => void

  // History (local)
  history: FocusSessionHistory[]
  deleteSession: (id: string) => void
  renameSession: (id: string, newObjective: string) => void
  clearHistory: () => void

  // Sync
  syncToServer: () => Promise<void>
  pendingSyncCount: number

  /** Há conta: o histórico sobe para o desempenho do perfil. */
  isAuthenticated: boolean

  /** A sessão que acabou de terminar — alimenta a tela de resumo. */
  lastFinished: FocusSessionHistory | null
  dismissLastFinished: () => void

  // Modal
  isModalOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const FocusSessionContext = createContext<FocusSessionContextType | null>(null)

export function useFocusSession() {
  const ctx = useContext(FocusSessionContext)
  if (!ctx) throw new Error('useFocusSession must be used within FocusSessionProvider')
  return ctx
}

// ============================================================
// LocalStorage helpers
// ============================================================

const STORAGE_KEY_SESSION = 'gradex:focus-session:current'
const STORAGE_KEY_HISTORY = 'gradex:focus-session:history'

function loadSession(): FocusSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

function saveSession(session: FocusSession | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session))
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION)
    }
  } catch { /* ignore */ }
}

function loadHistory(): FocusSessionHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

function saveHistory(history: FocusSessionHistory[]) {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
  } catch { /* ignore */ }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ============================================================
// Elapsed time calculator
// ============================================================

function calcElapsedMs(session: FocusSession): number {
  const start = new Date(session.startedAt).getTime()
  const now = session.status === 'paused'
    ? new Date(session.pausedAt!).getTime()
    : session.status === 'finished'
      ? new Date(session.finishedAt!).getTime()
      : Date.now()
  return Math.max(0, now - start - session.totalPausedMs)
}


// ============================================================
// Provider
// ============================================================

export function FocusSessionProvider({
  children,
  isAuthenticated = true,
}: {
  children: ReactNode
  /** Visitante: nada é enviado, o histórico fica só no aparelho. */
  isAuthenticated?: boolean
}) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [history, setHistory] = useState<FocusSessionHistory[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [lastFinished, setLastFinished] = useState<FocusSessionHistory | null>(null)
  const initialized = useRef(false)

  // --- Initialize from localStorage ---
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const saved = loadSession()
    const savedHistory = loadHistory()
    setHistory(savedHistory)

    if (saved) {
      // Recover session from storage
      if (saved.status === 'active') {
        // Was active when page closed — keep it active
        setCurrentSession(saved)
        setElapsedMs(calcElapsedMs(saved))
      } else if (saved.status === 'paused') {
        setCurrentSession(saved)
        setElapsedMs(calcElapsedMs(saved))
      } else {
        // Finished session left in storage somehow, clean up
        saveSession(null)
      }
    }
  }, [])

  // --- Timer tick ---
  // Só com a aba visível: o tempo é calculado a partir do início, então nada
  // se perde enquanto ela está escondida — ao voltar, o relógio já acerta.
  const isRunning = currentSession?.status === 'active'
  const tick = useCallback(() => {
    if (currentSession) setElapsedMs(calcElapsedMs(currentSession))
  }, [currentSession])
  useIntervaloVisivel(tick, isRunning ? 1000 : null)

  // --- Título da aba ---
  // O cronômetro no título é o que mantém a sessão presente com a pessoa em
  // outra aba (o PDF, o banco). Escondida, a aba mostra só que há foco em
  // andamento: um minuto parado no título seria um número errado.
  const originalTitle = useRef<string | null>(null)
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!currentSession) {
      if (originalTitle.current !== null) {
        document.title = originalTitle.current
        originalTitle.current = null
      }
      return
    }
    // Sem o prefixo, quem escreveu o título foi a navegação (o Next troca o
    // título a cada página): ele passa a ser a base.
    if (originalTitle.current === null || !/^[⏱⏸] /.test(document.title)) {
      originalTitle.current = document.title.replace(/^[⏱⏸] [^·]+ · /, '')
    }
    const base = originalTitle.current
    const paused = currentSession.status === 'paused'
    const visible = document.visibilityState === 'visible'
    document.title = paused
      ? `⏸ ${formatarRelogio(elapsedMs)} · ${base}`
      : visible
        ? `⏱ ${formatarRelogio(elapsedMs)} · ${base}`
        : `⏱ Foco · ${base}`
  }, [currentSession, elapsedMs])

  useEffect(() => {
    if (currentSession?.status !== 'active') return
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && originalTitle.current !== null) {
        document.title = `⏱ Foco · ${originalTitle.current}`
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [currentSession])

  // --- Persist current session on change ---
  useEffect(() => {
    if (initialized.current) {
      saveSession(currentSession)
    }
  }, [currentSession])

  // --- Persist history on change ---
  useEffect(() => {
    if (initialized.current) {
      saveHistory(history)
    }
  }, [history])

  // --- beforeunload: save accurate snapshot ---
  useEffect(() => {
    function handleBeforeUnload() {
      if (currentSession) {
        saveSession(currentSession)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentSession])

  // --- Cross-tab sync via storage event ---
  useEffect(() => {
    function handleStorageChange(e: StorageEvent) {
      if (e.key === STORAGE_KEY_SESSION) {
        const updated = e.newValue ? JSON.parse(e.newValue) : null
        setCurrentSession(updated)
        if (updated) setElapsedMs(calcElapsedMs(updated))
        else setElapsedMs(0)
      }
      if (e.key === STORAGE_KEY_HISTORY) {
        const updated = e.newValue ? JSON.parse(e.newValue) : []
        setHistory(updated)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // --- Actions ---

  const startSession = useCallback((objective: string, targetMinutes?: number) => {
    const session: FocusSession = {
      id: generateId(),
      objective: objective.trim() || 'Sessão de foco',
      startedAt: new Date().toISOString(),
      totalPausedMs: 0,
      status: 'active',
      targetMinutes: targetMinutes && targetMinutes > 0 ? Math.round(targetMinutes) : undefined,
    }
    setCurrentSession(session)
    setElapsedMs(0)
    setLastFinished(null)
  }, [])

  const pauseSession = useCallback(() => {
    setCurrentSession(prev => {
      if (!prev || prev.status !== 'active') return prev
      return {
        ...prev,
        status: 'paused' as const,
        pausedAt: new Date().toISOString(),
      }
    })
  }, [])

  const resumeSession = useCallback(() => {
    setCurrentSession(prev => {
      if (!prev || prev.status !== 'paused' || !prev.pausedAt) return prev
      const pauseDuration = Date.now() - new Date(prev.pausedAt).getTime()
      return {
        ...prev,
        status: 'active' as const,
        pausedAt: undefined,
        totalPausedMs: prev.totalPausedMs + pauseDuration,
      }
    })
  }, [])

  const finishSession = useCallback(() => {
    // Read current session snapshot to avoid issues with React StrictMode
    // calling state updaters twice
    setCurrentSession(prev => {
      if (!prev) return prev

      // If paused, add remaining pause time
      let totalPausedMs = prev.totalPausedMs
      if (prev.status === 'paused' && prev.pausedAt) {
        totalPausedMs += Date.now() - new Date(prev.pausedAt).getTime()
      }

      const finishedAt = new Date().toISOString()
      const totalTimeMs = new Date(finishedAt).getTime() - new Date(prev.startedAt).getTime() - totalPausedMs

      const entry: FocusSessionHistory = {
        id: prev.id,
        objective: prev.objective,
        startedAt: prev.startedAt,
        finishedAt,
        totalTimeMs: Math.max(0, totalTimeMs),
        syncedToServer: false,
        targetMinutes: prev.targetMinutes,
      }
      setLastFinished(entry)

      // Deduplicate by id to prevent StrictMode double-fire
      setHistory(h => {
        if (h.some(s => s.id === entry.id)) return h
        return [entry, ...h]
      })
      setElapsedMs(0)
      return null // clear current session
    })
  }, [])

  const deleteSession = useCallback((id: string) => {
    setHistory(h => {
      const target = h.find(s => s.id === id)
      // Já estava na conta: apagar só daqui deixaria o tempo contando no perfil.
      if (target?.syncedToServer) {
        void fetch(`/api/focus-sessions/sync?sessionId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
      }
      return h.filter(s => s.id !== id)
    })
  }, [])

  const renameSession = useCallback((id: string, newObjective: string) => {
    // Volta para a fila de sincronização: o upsert leva o nome novo.
    setHistory(h => h.map(s => s.id === id ? { ...s, objective: newObjective, syncedToServer: false } : s))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // --- Server sync (batch, on-demand) ---

  const syncing = useRef(false)
  const syncToServer = useCallback(async () => {
    // Sessão de menos de um minuto é clique por engano, não estudo.
    const unsynced = history.filter(s => !s.syncedToServer && s.totalTimeMs >= 60_000).slice(0, 50)
    if (!isAuthenticated || unsynced.length === 0 || syncing.current) return

    syncing.current = true
    try {
      const res = await fetch('/api/focus-sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: unsynced }),
      })
      if (res.ok) {
        const sent = new Set(unsynced.map(s => `${s.id}|${s.objective}`))
        setHistory(h => h.map(s => (sent.has(`${s.id}|${s.objective}`) ? { ...s, syncedToServer: true } : s)))
      }
    } catch {
      // Silencioso: a próxima mudança no histórico tenta de novo.
    } finally {
      syncing.current = false
    }
  }, [history, isAuthenticated])

  // Antes, a sincronização só acontecia quando a pessoa abria o perfil — e o
  // tempo de foco não entrava no desempenho de quem nunca abria. Agora vai
  // sozinha: ao terminar, renomear, ou ao abrir o site com algo pendente.
  // Visitante não envia: o histórico fica só no aparelho, como antes.
  const pendingSyncCount = history.filter(s => !s.syncedToServer && s.totalTimeMs >= 60_000).length
  useEffect(() => {
    if (pendingSyncCount === 0) return
    const timer = window.setTimeout(() => void syncToServer(), 1500)
    return () => window.clearTimeout(timer)
  }, [pendingSyncCount, syncToServer])

  const dismissLastFinished = useCallback(() => setLastFinished(null), [])

  const openModal = useCallback(() => setIsModalOpen(true), [])
  const closeModal = useCallback(() => setIsModalOpen(false), [])

  return (
    <FocusSessionContext.Provider value={{
      currentSession,
      elapsedMs,
      startSession,
      pauseSession,
      resumeSession,
      finishSession,
      history,
      deleteSession,
      renameSession,
      clearHistory,
      syncToServer,
      pendingSyncCount,
      isAuthenticated,
      lastFinished,
      dismissLastFinished,
      isModalOpen,
      openModal,
      closeModal,
    }}>
      {children}
    </FocusSessionContext.Provider>
  )
}
