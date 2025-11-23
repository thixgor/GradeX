'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { User, BanReason, BanReasonLabels } from '@/lib/types'
import { ArrowLeft, Trash2, Ban, CheckCircle, AlertTriangle, Shield } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [banReason, setBanReason] = useState<BanReason>('other')
  const [banDetails, setBanDetails] = useState('')
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
                      <div className="flex items-center gap-2">
                        <CardTitle>{user.name}</CardTitle>
                        {user.role === 'admin' && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            <Shield className="h-3 w-3 inline mr-1" />
                            Admin
                          </span>
                        )}
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

      <ToastAlert
        open={toastOpen}
        onOpenChange={setToastOpen}
        message={toastMessage}
        type={toastType}
      />
    </div>
  )
}
