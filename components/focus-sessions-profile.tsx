'use client'

import { useState, useEffect } from 'react'
import { useFocusSession, FocusSessionHistory } from '@/hooks/use-focus-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Clock, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, Cloud, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}min ${seconds}s`
  if (minutes > 0) return `${minutes}min ${seconds}s`
  return `${seconds}s`
}

function formatDate(iso: string): string {
  try {
    const date = new Date(iso)
    if (isNaN(date.getTime())) return 'Data inválida'
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date)
  } catch {
    return 'Data inválida'
  }
}

function getStatusColor(totalTimeMs: number): string {
  const minutes = totalTimeMs / 60000
  if (minutes >= 60) return 'from-green-500 to-emerald-600'
  if (minutes >= 30) return 'from-blue-500 to-indigo-600'
  if (minutes >= 15) return 'from-yellow-500 to-orange-500'
  return 'from-gray-400 to-gray-500'
}

function getStatusLabel(totalTimeMs: number): string {
  const minutes = totalTimeMs / 60000
  if (minutes >= 60) return 'Foco profundo'
  if (minutes >= 30) return 'Boa sessao'
  if (minutes >= 15) return 'Sessao curta'
  return 'Rapida'
}

export function FocusSessionsProfile() {
  const {
    history,
    deleteSession,
    renameSession,
    syncToServer,
    pendingSyncCount,
    currentSession,
  } = useFocusSession()

  const [expanded, setExpanded] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Auto-sync when component mounts (if user is logged in, this will work)
  useEffect(() => {
    if (pendingSyncCount > 0) {
      syncToServer()
    }
  }, []) // Only on mount

  async function handleSync() {
    setSyncing(true)
    await syncToServer()
    setSyncing(false)
  }

  function handleStartRename(id: string, currentObj: string) {
    setEditingId(id)
    setEditValue(currentObj)
  }

  function handleSaveRename(id: string) {
    renameSession(id, editValue.trim() || 'Sessao de Foco')
    setEditingId(null)
    setEditValue('')
  }

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      deleteSession(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmDeleteId(prev => prev === id ? null : prev), 3000)
    }
  }

  // Calculate stats
  const totalSessions = history.length
  const totalTimeMs = history.reduce((acc, s) => acc + s.totalTimeMs, 0)
  const avgTimeMs = totalSessions > 0 ? totalTimeMs / totalSessions : 0

  const isActive = currentSession?.status === 'active'
  const isPaused = currentSession?.status === 'paused'

  return (
    <Card className="backdrop-blur-xl bg-white/15 dark:bg-white/8 border-white/20 dark:border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-[#468152]" />
            Sessoes de Foco
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="text-xs h-7 gap-1"
              >
                {syncing ? (
                  <Cloud className="h-3 w-3 animate-pulse" />
                ) : (
                  <CloudOff className="h-3 w-3" />
                )}
                {syncing ? 'Sincronizando...' : `Sync (${pendingSyncCount})`}
              </Button>
            )}
            {(isActive || isPaused) && (
              <span className="inline-flex items-center gap-1 text-xs h-7 px-2 rounded-md border border-[#468152]/40 text-[#468152] dark:text-[#E2A43E]">
                <Clock className="h-3 w-3" />
                Sessao ativa
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats summary */}
        {totalSessions > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 bg-[#468152]/10 dark:bg-[#468152]/20 rounded-xl">
              <Target className="h-6 w-6 text-[#468152]" />
              <div>
                <p className="text-xs text-muted-foreground">Total de sessoes</p>
                <p className="text-xl font-bold">{totalSessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-[#E2A43E]/10 dark:bg-[#E2A43E]/20 rounded-xl">
              <Clock className="h-6 w-6 text-[#E2A43E]" />
              <div>
                <p className="text-xs text-muted-foreground">Tempo total</p>
                <p className="text-xl font-bold">{formatDuration(totalTimeMs)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
              <Target className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Media por sessao</p>
                <p className="text-xl font-bold">{formatDuration(avgTimeMs)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session list */}
        {totalSessions === 0 ? (
          <div className="text-center py-8">
            <Target className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Nenhuma sessao de foco registrada
            </p>
            <p className="text-xs text-muted-foreground">
              Use o botao no header para iniciar uma sessao
            </p>
          </div>
        ) : (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <span>Historico de sessoes</span>
              {expanded
                ? <ChevronUp className="w-4 h-4" />
                : <ChevronDown className="w-4 h-4" />
              }
            </button>

            {expanded && (
              <div className="space-y-2">
                {history.map(session => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group"
                  >
                    {/* Status indicator */}
                    <div className={cn(
                      'w-2 h-8 rounded-full bg-gradient-to-b shrink-0',
                      getStatusColor(session.totalTimeMs),
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveRename(session.id)
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                            className="flex-1 text-sm bg-transparent border-b border-foreground/30 focus:outline-none focus:border-[#468152] px-0.5 py-0.5"
                            autoFocus
                            maxLength={100}
                          />
                          <button
                            onClick={() => handleSaveRename(session.id)}
                            className="p-1.5 hover:bg-[#468152]/20 rounded-lg"
                          >
                            <Check className="w-3.5 h-3.5 text-[#468152]" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 hover:bg-muted rounded-lg"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium truncate">{session.objective}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(session.startedAt)}
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatDuration(session.totalTimeMs)}
                            </span>
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                              session.totalTimeMs >= 3600000
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                : session.totalTimeMs >= 1800000
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                            )}>
                              {getStatusLabel(session.totalTimeMs)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    {editingId !== session.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Sync indicator */}
                        {session.syncedToServer ? (
                          <Cloud className="w-3 h-3 text-[#468152]/50 mr-1" />
                        ) : (
                          <CloudOff className="w-3 h-3 text-muted-foreground/30 mr-1" />
                        )}
                        <button
                          onClick={() => handleStartRename(session.id, session.objective)}
                          className="p-1.5 hover:bg-muted rounded-lg"
                          title="Renomear"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            confirmDeleteId === session.id
                              ? 'bg-red-100 dark:bg-red-950/50'
                              : 'hover:bg-red-100 dark:hover:bg-red-950/50',
                          )}
                          title={confirmDeleteId === session.id ? 'Confirmar exclusao' : 'Excluir'}
                        >
                          <Trash2 className={cn(
                            'w-3.5 h-3.5',
                            confirmDeleteId === session.id ? 'text-red-600' : 'text-red-400',
                          )} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
