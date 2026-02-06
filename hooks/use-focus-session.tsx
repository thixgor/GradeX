'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'

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
}

export interface FocusSessionHistory {
  id: string
  objective: string
  startedAt: string
  finishedAt: string
  totalTimeMs: number       // net study time (excluding pauses)
  syncedToServer: boolean
}

interface FocusSessionContextType {
  // Current session
  currentSession: FocusSession | null
  elapsedMs: number         // real-time elapsed (excluding pauses)

  // Actions
  startSession: (objective: string) => void
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

export function FocusSessionProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)
  const [history, setHistory] = useState<FocusSessionHistory[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
  useEffect(() => {
    if (currentSession?.status === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedMs(calcElapsedMs(currentSession))
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
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

  const startSession = useCallback((objective: string) => {
    const session: FocusSession = {
      id: generateId(),
      objective: objective.trim() || 'Sessao de Foco',
      startedAt: new Date().toISOString(),
      totalPausedMs: 0,
      status: 'active',
    }
    setCurrentSession(session)
    setElapsedMs(0)
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
      }

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
    setHistory(h => h.filter(s => s.id !== id))
  }, [])

  const renameSession = useCallback((id: string, newObjective: string) => {
    setHistory(h => h.map(s => s.id === id ? { ...s, objective: newObjective } : s))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  // --- Server sync (batch, on-demand) ---

  const syncToServer = useCallback(async () => {
    const unsynced = history.filter(s => !s.syncedToServer)
    if (unsynced.length === 0) return

    try {
      const res = await fetch('/api/focus-sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions: unsynced }),
      })
      if (res.ok) {
        setHistory(h => h.map(s => ({ ...s, syncedToServer: true })))
      }
    } catch {
      // Silently fail — will retry next time
    }
  }, [history])

  const pendingSyncCount = history.filter(s => !s.syncedToServer).length

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
      isModalOpen,
      openModal,
      closeModal,
    }}>
      {children}
    </FocusSessionContext.Provider>
  )
}
