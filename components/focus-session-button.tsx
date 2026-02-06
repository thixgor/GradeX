'use client'

import { useState, useEffect, useRef } from 'react'
import { useFocusSession } from '@/hooks/use-focus-session'
import { cn } from '@/lib/utils'
import { Focus, Play, Pause, StopCircle, Target, Clock, Trash2, Edit3, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// ============================================================
// Helpers
// ============================================================

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function formatTimeParts(ms: number): { h: string; m: string; s: string } {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return {
    h: hours.toString().padStart(2, '0'),
    m: minutes.toString().padStart(2, '0'),
    s: seconds.toString().padStart(2, '0'),
  }
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return 'Data inválida'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date)
  } catch {
    return 'Data inválida'
  }
}

// ============================================================
// Component
// ============================================================

export function FocusSessionButton() {
  const {
    currentSession,
    elapsedMs,
    startSession,
    pauseSession,
    resumeSession,
    finishSession,
    history,
    deleteSession,
    renameSession,
  } = useFocusSession()

  const [open, setOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [objective, setObjective] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [confirmFinish, setConfirmFinish] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Reset confirm state when popover closes
  useEffect(() => {
    if (!open) {
      setConfirmFinish(false)
      setEditingId(null)
    }
  }, [open])

  // Auto-focus objective input when popover opens without session
  useEffect(() => {
    if (open && !currentSession && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, currentSession])

  if (!mounted) return null

  const isActive = currentSession?.status === 'active'
  const isPaused = currentSession?.status === 'paused'
  const hasSession = isActive || isPaused
  const time = formatTimeParts(hasSession ? elapsedMs : 0)

  function handleStart() {
    startSession(objective)
    setObjective('')
  }

  function handleFinish() {
    if (!confirmFinish) {
      setConfirmFinish(true)
      return
    }
    finishSession()
    setConfirmFinish(false)
  }

  function handleSaveRename(id: string) {
    renameSession(id, editValue.trim() || 'Sessao de Foco')
    setEditingId(null)
    setEditValue('')
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative flex items-center gap-2 rounded-full transition-all duration-500 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'backdrop-blur-xl border h-9 px-2.5',
          hasSession
            ? 'bg-gradient-to-r from-[#468152]/20 to-[#E2A43E]/20 border-[#468152]/40 dark:from-[#468152]/30 dark:to-[#E2A43E]/30 dark:border-[#468152]/50 focus-session-active'
            : 'bg-white/20 dark:bg-white/10 border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/15',
          (isHovered && !hasSession) ? 'pr-4' : '',
          hasSession ? 'pr-3' : '',
        )}
      >
        <div className={cn(
          'relative flex items-center justify-center w-5 h-5 shrink-0',
          hasSession && 'focus-session-icon-glow',
        )}>
          <Focus className={cn(
            'w-4 h-4 transition-colors duration-300',
            hasSession ? 'text-[#468152] dark:text-[#E2A43E]' : 'text-muted-foreground',
          )} />
          {isActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#468152] dark:bg-[#E2A43E] focus-session-pulse" />
          )}
          {isPaused && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-500" />
          )}
        </div>
        <div className={cn(
          'overflow-hidden transition-all duration-500 ease-out',
          hasSession ? 'max-w-[120px] opacity-100'
            : isHovered ? 'max-w-[140px] opacity-100'
              : 'max-w-0 opacity-0',
        )}>
          <span className={cn(
            'whitespace-nowrap text-xs font-medium',
            hasSession ? 'text-[#468152] dark:text-[#E2A43E] tabular-nums' : 'text-muted-foreground',
          )}>
            {hasSession
              ? (isPaused ? `${formatTime(elapsedMs)} ⏸` : formatTime(elapsedMs))
              : 'Sessao de foco'}
          </span>
        </div>
      </button>

      {/* Dropdown Popover */}
      {open && (
        <Card className="absolute right-0 top-12 w-80 max-w-[90vw] shadow-2xl z-50 p-0 border overflow-hidden slide-in-from-bottom-4">
          {/* Timer area */}
          <div className={cn(
            'px-5 pt-5 pb-4',
            hasSession
              ? 'bg-gradient-to-br from-[#468152]/5 to-[#E2A43E]/5 dark:from-[#468152]/10 dark:to-[#E2A43E]/10'
              : 'bg-card',
          )}>
            {/* Stopwatch display */}
            <div className="flex items-center justify-center gap-1">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'text-3xl font-bold tabular-nums leading-none rounded-lg px-2 py-1.5',
                  'bg-background/80 dark:bg-background/50 border border-border/50',
                  isActive && 'text-[#468152] dark:text-[#E2A43E]',
                  isPaused && 'text-yellow-600 dark:text-yellow-400 focus-session-blink',
                  !hasSession && 'text-muted-foreground/30',
                )}>
                  {time.h}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">hr</span>
              </div>

              <span className={cn(
                'text-2xl font-bold mb-4',
                isActive && 'text-[#468152] dark:text-[#E2A43E] focus-session-colon-blink',
                isPaused && 'text-yellow-600/40 dark:text-yellow-400/40',
                !hasSession && 'text-muted-foreground/20',
              )}>:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'text-3xl font-bold tabular-nums leading-none rounded-lg px-2 py-1.5',
                  'bg-background/80 dark:bg-background/50 border border-border/50',
                  isActive && 'text-[#468152] dark:text-[#E2A43E]',
                  isPaused && 'text-yellow-600 dark:text-yellow-400 focus-session-blink',
                  !hasSession && 'text-muted-foreground/30',
                )}>
                  {time.m}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">min</span>
              </div>

              <span className={cn(
                'text-2xl font-bold mb-4',
                isActive && 'text-[#468152] dark:text-[#E2A43E] focus-session-colon-blink',
                isPaused && 'text-yellow-600/40 dark:text-yellow-400/40',
                !hasSession && 'text-muted-foreground/20',
              )}>:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className={cn(
                  'text-3xl font-bold tabular-nums leading-none rounded-lg px-2 py-1.5',
                  'bg-background/80 dark:bg-background/50 border border-border/50',
                  isActive && 'text-[#468152] dark:text-[#E2A43E]',
                  isPaused && 'text-yellow-600 dark:text-yellow-400 focus-session-blink',
                  !hasSession && 'text-muted-foreground/30',
                )}>
                  {time.s}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">seg</span>
              </div>
            </div>

            {/* Objective display (when active) */}
            {hasSession && currentSession && (
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Target className="w-3 h-3 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {currentSession.objective}
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="px-4 py-3 border-t border-border/50 bg-card">
            {/* No session — objective input + start */}
            {!hasSession && (
              <div className="space-y-2">
                <div className="relative">
                  <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Qual e seu objetivo?"
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStart()}
                    maxLength={100}
                    className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-[#468152]/40 placeholder:text-muted-foreground/60"
                  />
                </div>
                <Button
                  onClick={handleStart}
                  size="sm"
                  className="w-full h-9 rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white text-sm gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Iniciar Sessao
                </Button>
              </div>
            )}

            {/* Active — pause + finish */}
            {isActive && (
              <div className="flex gap-2">
                <Button
                  onClick={pauseSession}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-sm gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pausar
                </Button>
                <Button
                  onClick={handleFinish}
                  variant={confirmFinish ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-sm gap-1.5"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  {confirmFinish ? 'Confirmar?' : 'Finalizar'}
                </Button>
              </div>
            )}

            {/* Paused — resume + finish */}
            {isPaused && (
              <div className="flex gap-2">
                <Button
                  onClick={resumeSession}
                  size="sm"
                  className="flex-1 h-9 rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white text-sm gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Retomar
                </Button>
                <Button
                  onClick={handleFinish}
                  variant={confirmFinish ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1 h-9 rounded-lg text-sm gap-1.5"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  {confirmFinish ? 'Confirmar?' : 'Finalizar'}
                </Button>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="border-t border-border/50">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors bg-card"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recentes ({Math.min(history.length, 5)})
                </span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="px-3 pb-3 space-y-1 max-h-[180px] overflow-y-auto scrollbar-hide bg-card">
                  {history.slice(0, 5).map(session => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveRename(session.id)}
                              className="flex-1 text-xs bg-transparent border-b border-foreground/30 focus:outline-none focus:border-[#468152] px-0.5 py-0.5"
                              autoFocus
                              maxLength={100}
                            />
                            <button onClick={() => handleSaveRename(session.id)} className="p-0.5 hover:bg-[#468152]/20 rounded">
                              <Check className="w-3 h-3 text-[#468152]" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-medium truncate">{session.objective}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(session.startedAt)} · {formatDuration(session.totalTimeMs)}
                            </p>
                          </>
                        )}
                      </div>
                      {editingId !== session.id && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => { setEditingId(session.id); setEditValue(session.objective) }}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/50 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
