'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { ArrowLeft, Key, Plus, Copy, Check, Clock, Crown, Timer, Trash2, History } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SerialKey, SerialKeyType } from '@/lib/types'

export default function AdminKeysPage() {
  const router = useRouter()
  const [keys, setKeys] = useState<SerialKey[]>([])
  const [loading, setLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<SerialKeyType>('trial')
  const [generating, setGenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [customDays, setCustomDays] = useState(0)
  const [customHours, setCustomHours] = useState(0)
  const [customMinutes, setCustomMinutes] = useState(0)

  useEffect(() => {
    checkAuth()
    loadKeys()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok || (await res.json()).user?.role !== 'admin') {
        router.push('/')
      }
    } catch (error) {
      router.push('/')
    }
  }

  async function loadKeys() {
    try {
      const res = await fetch('/api/serial-keys')
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys || [])
      } else {
        throw new Error('Erro ao carregar keys')
      }
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateKey() {
    setGenerating(true)
    try {
      const body: any = { type: selectedType }

      // Adicionar campos customizados se for custom
      if (selectedType === 'custom') {
        if (customDays === 0 && customHours === 0 && customMinutes === 0) {
          throw new Error('Para tipo personalizado, especifique ao menos dias, horas ou minutos')
        }
        body.customDurationDays = customDays
        body.customDurationHours = customHours
        body.customDurationMinutes = customMinutes
      }

      const res = await fetch('/api/serial-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar serial key')
      }

      setToastMessage(`Serial key ${selectedType.toUpperCase()} gerada com sucesso!`)
      setToastType('success')
      setToastOpen(true)
      setGenerateDialogOpen(false)
      // Reset custom duration
      setCustomDays(0)
      setCustomHours(0)
      setCustomMinutes(0)
      loadKeys()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    } finally {
      setGenerating(false)
    }
  }

  async function handleClearHistory() {
    if (!confirm('Tem certeza que deseja limpar todo o histórico de serial keys? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const res = await fetch('/api/serial-keys/clear-history', {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao limpar histórico')
      }

      setToastMessage(data.message)
      setToastType('success')
      setToastOpen(true)
      loadKeys()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  function copyToClipboard(key: string) {
    navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  async function handleDeleteKey(keyId: string) {
    if (!confirm('Tem certeza que deseja deletar esta serial key?')) {
      return
    }

    try {
      const res = await fetch(`/api/serial-keys/${keyId}`, {
        method: 'DELETE'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao deletar serial key')
      }

      setToastMessage('Serial key deletada com sucesso!')
      setToastType('success')
      setToastOpen(true)
      loadKeys()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastType('error')
      setToastOpen(true)
    }
  }

  function getTypeBadge(key: SerialKey) {
    if (key.type === 'premium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium (Vitalício)
        </span>
      )
    }
    if (key.type === 'custom') {
      const parts = []
      if (key.customDurationDays) parts.push(`${key.customDurationDays}d`)
      if (key.customDurationHours) parts.push(`${key.customDurationHours}h`)
      if (key.customDurationMinutes) parts.push(`${key.customDurationMinutes}m`)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Timer className="h-3 w-3 mr-1" />
          Personalizado ({parts.join(' ')})
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <Timer className="h-3 w-3 mr-1" />
        Trial (7d)
      </span>
    )
  }

  function getStatusBadge(key: SerialKey) {
    if (key.used) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <Check className="h-3 w-3 mr-1" />
          Usada
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Disponível
      </span>
    )
  }

  const unusedKeys = keys.filter(k => !k.used)
  const usedKeys = keys.filter(k => k.used)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciamento de Serial Keys</h1>
              <p className="text-sm text-muted-foreground">
                {keys.length} {keys.length === 1 ? 'key gerada' : 'keys geradas'} | {unusedKeys.length} disponíveis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleClearHistory}
              variant="destructive"
              size="sm"
            >
              <History className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
            <Button
              onClick={() => setGenerateDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Gerar Nova Key
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {/* Keys Disponíveis */}
            {unusedKeys.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-yellow-500" />
                  Keys Disponíveis ({unusedKeys.length})
                </h2>
                <div className="grid gap-4">
                  {unusedKeys.map((key) => (
                    <Card key={key._id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeBadge(key)}
                            {getStatusBadge(key)}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(key.key)}
                            >
                              {copiedKey === key.key ? (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteKey(key._id!)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted rounded-lg font-mono text-lg font-bold tracking-wider">
                            {key.key}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Gerada por:</span> {key.generatedByName}
                            </div>
                            <div>
                              <span className="font-medium">Data:</span>{' '}
                              {new Date(key.generatedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Keys Usadas */}
            {usedKeys.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Keys Usadas ({usedKeys.length})
                </h2>
                <div className="grid gap-4">
                  {usedKeys.map((key) => (
                    <Card key={key._id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getTypeBadge(key)}
                            {getStatusBadge(key)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="p-3 bg-muted rounded-lg font-mono text-lg font-bold tracking-wider text-muted-foreground">
                            {key.key}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Gerada por:</span> {key.generatedByName}
                            </div>
                            <div>
                              <span className="font-medium">Data geração:</span>{' '}
                              {new Date(key.generatedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div>
                              <span className="font-medium">Usada por:</span> {key.usedByName}
                            </div>
                            <div>
                              <span className="font-medium">Data uso:</span>{' '}
                              {key.usedAt && new Date(key.usedAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {keys.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Nenhuma serial key gerada ainda
                  </p>
                  <Button onClick={() => setGenerateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Gerar Primeira Key
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Generate Key Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Gerar Nova Serial Key
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo de serial key que deseja gerar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipo de Serial Key</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <Button
                  variant={selectedType === 'trial' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('trial')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Timer className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Trial</div>
                    <div className="text-xs opacity-80">7 dias</div>
                  </div>
                </Button>
                <Button
                  variant={selectedType === 'premium' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('premium')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Crown className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Premium</div>
                    <div className="text-xs opacity-80">Vitalício</div>
                  </div>
                </Button>
                <Button
                  variant={selectedType === 'custom' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('custom')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Clock className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Custom</div>
                    <div className="text-xs opacity-80">Personalizado</div>
                  </div>
                </Button>
              </div>
            </div>

            {selectedType === 'custom' && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <Label>Duração Personalizada</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="custom-days" className="text-xs">Dias</Label>
                    <Input
                      id="custom-days"
                      type="number"
                      min="0"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-hours" className="text-xs">Horas</Label>
                    <Input
                      id="custom-hours"
                      type="number"
                      min="0"
                      max="23"
                      value={customHours}
                      onChange={(e) => setCustomHours(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-minutes" className="text-xs">Minutos</Label>
                    <Input
                      id="custom-minutes"
                      type="number"
                      min="0"
                      max="59"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </div>
                {(customDays > 0 || customHours > 0 || customMinutes > 0) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    📅 Duração total: {customDays}d {customHours}h {customMinutes}m
                    <br />
                    🕒 Expira em: {new Date(Date.now() + (customDays * 24 * 60 + customHours * 60 + customMinutes) * 60 * 1000).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateKey}
              disabled={generating}
            >
              {generating ? 'Gerando...' : 'Gerar Serial Key'}
            </Button>
          </div>
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
