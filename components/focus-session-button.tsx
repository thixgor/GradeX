'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useFocusSession } from '@/hooks/use-focus-session'
import { useAnchoredPanel } from '@/hooks/use-anchored-panel'
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
  const inputRef = useRef<HTMLInputElement>(null)

  // O painel vive num portal ancorado ao botão: dentro do cabeçalho ele nascia
  // com a borda esquerda fora da tela no celular — dava a impressão de que o
  // botão simplesmente não funcionava.
  const closePanel = useCallback(() => setOpen(false), [])
  const { triggerRef, panelRef, style } = useAnchoredPanel<HTMLButtonElement>(open, closePanel, {
    width: 340,
  })

  useEffect(() => { setMounted(true) }, [])

  // Reset confirm state when popover closes
  useEffect(() => {
    if (!open) {
      setConfirmFinish(false)
      setEditingId(null)
    }
  }, [open])

  // Auto-focus objective input when popover opens without session.
  // No celular, não: focar sozinho abre o teclado por cima do painel que a
  // pessoa acabou de abrir para ver o cronômetro.
  useEffect(() => {
    if (!open || currentSession || !inputRef.current) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    const timer = setTimeout(() => inputRef.current?.focus(), 100)
    return () => clearTimeout(timer)
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
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={hasSession ? 'Sessão de foco em andamento' : 'Abrir sessão de foco'}
        className={cn(
          // `h-10` e `touch-manipulation`: alvo de toque de verdade e sem o
          // atraso de 300ms do duplo-toque no celular.
          'relative flex items-center gap-2 rounded-full transition-all duration-500 ease-out touch-manipulation',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-session-trigger h-10 px-2.5',
          hasSession && 'focus-session-trigger-active focus-session-active',
          open && 'focus-session-trigger-open',
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

      {/* Painel — portal no <body>, ancorado ao botão (ver useAnchoredPanel) */}
      {open && style && createPortal(
        <Card
          ref={panelRef}
          style={style}
          role="dialog"
          aria-label="Sessão de foco"
          className="app-anchored-panel focus-session-panel overflow-y-auto overscroll-contain p-0"
        >
          {/* Timer area */}
          <div className={cn(
            'px-5 pt-5 pb-4',
            hasSession &&
              'bg-gradient-to-br from-[#468152]/10 to-[#E2A43E]/10 dark:from-[#468152]/15 dark:to-[#E2A43E]/15',
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
          <div className="px-4 py-3 border-t border-border/50">
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
                    // `text-base` no celular: abaixo de 16px o Safari do iPhone
                    // dá zoom na página ao focar o campo.
                    className="w-full h-10 pl-8 pr-3 rounded-lg bg-muted/50 border border-border/50 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#468152]/40 placeholder:text-muted-foreground/60"
                  />
                </div>
                <Button
                  onClick={handleStart}
                  size="sm"
                  className="w-full h-10 rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white text-sm gap-1.5"
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
                  className="flex-1 h-10 rounded-lg text-sm gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pausar
                </Button>
                <Button
                  onClick={handleFinish}
                  variant={confirmFinish ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 rounded-lg text-sm gap-1.5"
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
                  className="flex-1 h-10 rounded-lg bg-gradient-to-r from-[#468152] to-[#E2A43E] hover:from-[#468152]/90 hover:to-[#E2A43E]/90 text-white text-sm gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Retomar
                </Button>
                <Button
                  onClick={handleFinish}
                  variant={confirmFinish ? 'destructive' : 'outline'}
                  size="sm"
                  className="flex-1 h-10 rounded-lg text-sm gap-1.5"
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
                className="w-full flex items-center justify-between px-4 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Recentes ({Math.min(history.length, 5)})
                </span>
                {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showHistory && (
                <div className="px-3 pb-3 space-y-1 max-h-[180px] overflow-y-auto overscroll-contain scrollbar-hide">
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
                        // Sem hover no celular: renomear e apagar ficavam
                        // invisíveis lá. Só o desktop esconde até o hover.
                        <div className="flex items-center gap-0.5 opacity-70 transition-opacity shrink-0 lg:opacity-0 lg:group-hover:opacity-100">
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
        </Card>,
        document.body,
      )}
    </div>
  )
}
