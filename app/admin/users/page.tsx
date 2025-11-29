'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { User, BanReason, BanReasonLabels, AccountType } from '@/lib/types'
import { ArrowLeft, Trash2, Ban, CheckCircle, AlertTriangle, Shield, Crown, Timer, Settings } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTierDialog, setShowTierDialog] = useState(false)
  const [showQuotaDialog, setShowQuotaDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState<BanReason>('other')
  const [banDetails, setBanDetails] = useState('')
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('gratuito')
  const [trialDays, setTrialDays] = useState(7)
  const [examsQuota, setExamsQuota] = useState(0)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'error' | 'success' | 'info'>('error')

  useEffect(() => {
    loadUsers()
  }, [])

  const showToastMessage = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  async function loadUsers() {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleBan() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban',
          banReason,
          banDetails
        })
      })

      if (!res.ok) throw new Error('Erro ao banir usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowBanDialog(false)
      setBanDetails('')
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUnban(userId: string) {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unban' })
      })

      if (!res.ok) throw new Error('Erro ao desbanir usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleDelete() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Erro ao deletar usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowDeleteDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUpdateTier() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_tier',
          accountType: selectedAccountType,
          trialDays: selectedAccountType === 'trial' ? trialDays : undefined
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar tier do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowTierDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  async function handleUpdateQuota() {
    if (!selectedUser) return

    try {
      const res = await fetch(`/api/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_quota',
          dailyPersonalExamsCreated: examsQuota
        })
      })

      if (!res.ok) throw new Error('Erro ao atualizar quota do usuário')

      const data = await res.json()
      showToastMessage(data.message, 'success')
      setShowQuotaDialog(false)
      loadUsers()
    } catch (error: any) {
      showToastMessage(error.message)
    }
  }

  function getAccountTypeBadge(user: User) {
    const accountType = user.accountType || 'gratuito'

    switch (accountType) {
      case 'premium':
        return (
          <span className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded flex items-center gap-1 w-fit">
            <Crown className="h-3 w-3" />
            Premium
          </span>
        )
      case 'trial':
        return (
          <span className="text-xs bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 py-1 rounded flex items-center gap-1 w-fit">
            <Timer className="h-3 w-3" />
            Trial
          </span>
        )
      default:
        return (
          <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded w-fit">
            Gratuito
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">{users.length} usuário(s) no sistema</p>
            </div>
            {users.map((user) => (
              <Card key={user._id?.toString()}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{user.name}</CardTitle>
                        {user.role === 'admin' && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Admin
                          </span>
                        )}
                        {user.role !== 'admin' && getAccountTypeBadge(user)}
                        {user.banned && (
                          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            <Ban className="h-3 w-3 inline mr-1" />
                            Banido
                          </span>
                        )}
                      </div>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user.banned && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Motivo: {BanReasonLabels[user.banReason!]}
                      </p>
                      {user.banDetails && (
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{user.banDetails}</p>
                      )}
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Banido em: {new Date(user.bannedAt!).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {user.role !== 'admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setSelectedAccountType(user.accountType || 'gratuito')
                            setTrialDays(user.trialDuration || 7)
                            setShowTierDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Plano
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            // Se admin setou um valor, usar esse
                            // Caso contrário, calcular baseado em criadas
                            const remaining = user.dailyPersonalExamsRemaining !== undefined
                              ? user.dailyPersonalExamsRemaining
                              : (() => {
                                  const accountType = user.accountType || 'gratuito'
                                  const tierLimits = {
                                    gratuito: 3,
                                    trial: 5,
                                    premium: 10
                                  }
                                  const limit = tierLimits[accountType as keyof typeof tierLimits] || 3
                                  const examsCreated = user.dailyPersonalExamsCreated || 0
                                  return Math.max(0, limit - examsCreated)
                                })()
                            setExamsQuota(remaining)
                            setShowQuotaDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gerenciar Quotas
                        </Button>
                      </>
                    )}

                    {user.banned ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnban(user._id!.toString())}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Desbanir
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowBanDialog(true)
                        }}
                        disabled={user.role === 'admin'}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Banir
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowDeleteDialog(true)
                      }}
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Dialog de Banimento */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a banir <strong>{selectedUser?.name}</strong>.
              O usuário não poderá mais acessar a plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo do Banimento</Label>
              <select
                value={banReason}
                onChange={(e) => setBanReason(e.target.value as BanReason)}
                className="w-full p-2 border rounded-md bg-background"
              >
                {Object.entries(BanReasonLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Detalhes (opcional)</Label>
              <Textarea
                value={banDetails}
                onChange={(e) => setBanDetails(e.target.value)}
                placeholder="Informações adicionais sobre o banimento..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBan}>
              <Ban className="h-4 w-4 mr-2" />
              Banir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Delete */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center">Deletar Usuário?</DialogTitle>
            <DialogDescription className="text-center">
              Você está prestes a deletar permanentemente <strong>{selectedUser?.name}</strong>.
              <br /><br />
              Todas as submissões deste usuário também serão deletadas.
              <br /><br />
              Esta ação <strong>NÃO pode ser desfeita</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Sim, Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Plano */}
      <Dialog open={showTierDialog} onOpenChange={setShowTierDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Plano do Usuário</DialogTitle>
            <DialogDescription>
              Alterar o plano de <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedAccountType === 'gratuito' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('gratuito')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <div className="font-semibold">Gratuito</div>
                  <div className="text-xs opacity-80">Padrão</div>
                </Button>
                <Button
                  variant={selectedAccountType === 'trial' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('trial')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <Timer className="h-4 w-4" />
                  <div className="font-semibold">Trial</div>
                  <div className="text-xs opacity-80">Temporário</div>
                </Button>
                <Button
                  variant={selectedAccountType === 'premium' ? 'default' : 'outline'}
                  onClick={() => setSelectedAccountType('premium')}
                  className="h-auto py-3 flex-col gap-1"
                  size="sm"
                >
                  <Crown className="h-4 w-4" />
                  <div className="font-semibold">Premium</div>
                  <div className="text-xs opacity-80">Vitalício</div>
                </Button>
              </div>
            </div>

            {selectedAccountType === 'trial' && (
              <div className="space-y-2">
                <Label htmlFor="trial-days">Duração do Trial (dias)</Label>
                <Input
                  id="trial-days"
                  type="number"
                  min="1"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)}
                />
                <p className="text-xs text-muted-foreground">
                  O trial expirará {trialDays} {trialDays === 1 ? 'dia' : 'dias'} após a ativação
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTierDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTier}>
              <Settings className="h-4 w-4 mr-2" />
              Atualizar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Quotas */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Quotas de Provas Pessoais</DialogTitle>
            <DialogDescription>
              Ajustar quotas de provas pessoais para <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exams-quota">Provas Pessoais Restantes</Label>
              <Input
                id="exams-quota"
                type="number"
                min="0"
                max="999"
                value={examsQuota}
                onChange={(e) => setExamsQuota(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Número de provas que o usuário pode criar nas próximas 24 horas
              </p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium">Status Atual:</p>
              <p className="text-sm text-muted-foreground mt-1">
                {(() => {
                  const accountType = selectedUser?.accountType || 'gratuito'
                  const tierLimits = {
                    gratuito: 3,
                    trial: 5,
                    premium: 10
                  }
                  const limit = tierLimits[accountType as keyof typeof tierLimits] || 3
                  const examsCreated = selectedUser?.dailyPersonalExamsCreated || 0
                  const remaining = selectedUser?.dailyPersonalExamsRemaining !== undefined
                    ? selectedUser.dailyPersonalExamsRemaining
                    : Math.max(0, limit - examsCreated)
                  
                  return remaining === limit 
                    ? '✓ Quota disponível' 
                    : `⚠ ${examsCreated} provas criadas hoje (${remaining} restantes)`
                })()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateQuota}>
              <Settings className="h-4 w-4 mr-2" />
              Atualizar Quotas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
