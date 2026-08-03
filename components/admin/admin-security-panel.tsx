'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  CheckCircle2,
  History,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'

type GateStatus = {
  unlocked: boolean
  expiresInSeconds?: number
  absoluteExpiresInSeconds?: number
  idleWindowSeconds?: number
}

type SecurityEvent = {
  id?: string
  type: string
  userName: string
  userEmail: string
  ip: string
  deviceName: string
  meta: Record<string, unknown>
  createdAt?: string
}

const EVENT_LABELS: Record<string, { label: string; tone: string }> = {
  gate_unlocked: { label: 'Painel desbloqueado', tone: 'text-emerald-600 dark:text-emerald-400' },
  gate_failed: { label: 'Código incorreto', tone: 'text-red-600 dark:text-red-400' },
  gate_rate_limited: { label: 'Tentativas bloqueadas', tone: 'text-red-600 dark:text-red-400' },
  gate_locked: { label: 'Painel trancado', tone: 'text-amber-600 dark:text-amber-400' },
  admins_logged_out: { label: 'Admins desconectados', tone: 'text-amber-600 dark:text-amber-400' },
}

function formatDuration(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return 'expirado'
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`
  if (minutes > 0) return `${minutes} min`
  return `${totalSeconds}s`
}

function formatEventTime(value?: string): string {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface AdminSecurityPanelProps {
  /** Reaproveita o toast da página hospedeira. */
  onNotify?: (message: string, type?: 'error' | 'success' | 'info') => void
}

/**
 * Bloco de segurança do painel: estado da trava, botão de pânico para derrubar
 * todos os administradores e a trilha de auditoria recente.
 */
export function AdminSecurityPanel({ onNotify }: AdminSecurityPanelProps) {
  const [status, setStatus] = useState<GateStatus | null>(null)
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [keepCurrentSession, setKeepCurrentSession] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [locking, setLocking] = useState(false)

  const notify = useCallback(
    (message: string, type: 'error' | 'success' | 'info' = 'error') => {
      if (onNotify) onNotify(message, type)
      else if (type === 'error') console.error(message)
    },
    [onNotify]
  )

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/security/gate')
      if (res.ok) setStatus(await res.json())
    } catch {
      // silencioso: o estado da trava é informativo
    }
  }, [])

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true)
    try {
      const res = await fetch('/api/admin/security/events?limit=12')
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch {
      // silencioso
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    loadEvents()
  }, [loadStatus, loadEvents])

  // Faz a contagem regressiva localmente em vez de bater na API a cada segundo.
  useEffect(() => {
    if (!status?.unlocked) return
    const timer = setInterval(() => {
      setStatus((current) => {
        if (!current?.unlocked) return current
        const remaining = Math.max(0, (current.expiresInSeconds || 0) - 30)
        return { ...current, expiresInSeconds: remaining }
      })
    }, 30000)
    return () => clearInterval(timer)
  }, [status?.unlocked])

  async function handleLockPanel() {
    setLocking(true)
    try {
      const res = await fetch('/api/admin/security/gate', { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao trancar o painel')
      // Navegação completa: o cookie do gate acabou de ser removido, e
      // navegação client-side pode reentregar uma resposta cacheada de antes
      // da mudança (mesmo cuidado do login e da tela de verificação).
      window.location.assign('/admin/verificacao?redirect=/admin/users')
    } catch (error: any) {
      notify(error?.message || 'Erro ao trancar o painel')
      setLocking(false)
    }
  }

  async function handleLogoutAllAdmins() {
    setLoggingOut(true)
    try {
      const res = await fetch('/api/admin/security/logout-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepCurrentSession }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Erro ao desconectar administradores')

      setShowLogoutDialog(false)

      if (!keepCurrentSession) {
        // A própria sessão caiu junto: sai para o login em vez de ficar numa
        // tela que vai dar 401 na primeira ação. Navegação completa pelo
        // mesmo motivo dos outros pontos deste arquivo.
        window.location.assign('/auth/login')
        return
      }

      notify(
        `${data.revoked || 0} sessão(ões) de ${data.affectedUsers || 0} administrador(es) encerrada(s).`,
        'success'
      )
      loadEvents()
    } catch (error: any) {
      notify(error?.message || 'Erro ao desconectar administradores')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Segurança do painel
          </CardTitle>
          <CardDescription>
            Trava de acesso e desconexão em massa — para quando uma conta de admin ficar
            aberta num dispositivo que não é mais confiável.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            {status?.unlocked ? (
              <div className="flex items-start gap-2 text-sm">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="font-medium">Painel desbloqueado neste dispositivo</p>
                  <p className="text-xs text-muted-foreground">
                    Tranca sozinho em {formatDuration(status.expiresInSeconds)} sem uso
                    {status.absoluteExpiresInSeconds
                      ? ` · código exigido de novo em ${formatDuration(status.absoluteExpiresInSeconds)}`
                      : ''}
                    .
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-sm">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">Verificando o estado da trava...</p>
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="destructive"
              className="justify-start"
              onClick={() => {
                setKeepCurrentSession(true)
                setShowLogoutDialog(true)
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deslogar todos os administradores
            </Button>

            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={handleLockPanel}
              disabled={locking}
            >
              {locking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="mr-2 h-4 w-4" />
              )}
              Bloquear painel agora
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <History className="h-4 w-4" />
                Eventos recentes
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={loadEvents} disabled={loadingEvents}>
                <RefreshCw className={`h-3.5 w-3.5 ${loadingEvents ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {loadingEvents ? 'Carregando...' : 'Nenhum evento registrado ainda.'}
              </p>
            ) : (
              <ul className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {events.map((event, index) => {
                  const meta = EVENT_LABELS[event.type] || {
                    label: event.type,
                    tone: 'text-muted-foreground',
                  }
                  return (
                    <li
                      key={event.id || `${event.type}-${index}`}
                      className="rounded-md border bg-muted/20 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium ${meta.tone}`}>{meta.label}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {formatEventTime(event.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-muted-foreground">
                        {event.userName || event.userEmail || 'Desconhecido'} · {event.ip}
                        {event.deviceName ? ` · ${event.deviceName}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Deslogar todos os administradores
            </DialogTitle>
            <DialogDescription>
              Todas as sessões de contas com cargo de administrador serão encerradas, em
              qualquer dispositivo. Cada um precisará entrar de novo com e-mail, senha e o
              código do painel.
            </DialogDescription>
          </DialogHeader>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
            <Checkbox
              checked={keepCurrentSession}
              onCheckedChange={setKeepCurrentSession}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Manter esta sessão conectada</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Desmarque se a suspeita for sobre este dispositivo — aí você também sai.
              </span>
            </span>
          </label>

          {!keepCurrentSession && (
            <p className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Você será desconectado junto e voltará para a tela de login.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutDialog(false)} disabled={loggingOut}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogoutAllAdmins} disabled={loggingOut}>
              {loggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
