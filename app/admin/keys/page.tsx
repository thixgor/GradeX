'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { ArrowLeft, Key, Plus, Copy, Check, Clock, Crown, Timer, Trash2, History, Calendar } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SerialKey, SerialKeyType, SerialKeyTrialSubtype, SerialKeyPremiumSubtype } from '@/lib/types'

const PREMIUM_PRICES: Record<SerialKeyPremiumSubtype, number> = {
  'teste': 0,
  'mensal': 24.90,
  'trimestral': 69.90,
  'semestral': 109.90,
  'vitalicio': 529.00,
}

const TRIAL_PRICES: Record<SerialKeyTrialSubtype, number> = {
  'teste': 0,
  '7dias': 0,
}

export default function AdminKeysPage() {
  const router = useRouter()
  const [keys, setKeys] = useState<SerialKey[]>([])
  const [loading, setLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<SerialKeyType>('trial')
  const [selectedTrialSubtype, setSelectedTrialSubtype] = useState<SerialKeyTrialSubtype>('7dias')
  const [selectedPremiumSubtype, setSelectedPremiumSubtype] = useState<SerialKeyPremiumSubtype>('mensal')
  const [generating, setGenerating] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

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
      const body: any = { 
        type: selectedType,
        trialSubtype: selectedTrialSubtype,
        premiumSubtype: selectedPremiumSubtype,
        price: selectedType === 'trial' ? TRIAL_PRICES[selectedTrialSubtype] : PREMIUM_PRICES[selectedPremiumSubtype]
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

      const typeLabel = selectedType === 'trial' ? `Trial (${selectedTrialSubtype})` : `Premium (${selectedPremiumSubtype})`
      setToastMessage(`Serial key ${typeLabel} gerada com sucesso!`)
      setToastType('success')
      setToastOpen(true)
      setGenerateDialogOpen(false)
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
      const subtypeLabel = key.premiumSubtype === 'vitalicio' ? 'Vitalício' : 
                          key.premiumSubtype === 'teste' ? 'Teste (2 min)' :
                          (key.premiumSubtype || 'mensal').charAt(0).toUpperCase() + (key.premiumSubtype || 'mensal').slice(1)
      const priceLabel = key.price ? ` - R$ ${key.price.toFixed(2)}` : ''
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <Crown className="h-3 w-3 mr-1" />
          Premium ({subtypeLabel}){priceLabel}
        </span>
      )
    }
    // Trial
    const subtypeLabel = key.trialSubtype === 'teste' ? 'Teste (2 min)' : '7 dias'
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
        <Timer className="h-3 w-3 mr-1" />
        Trial ({subtypeLabel})
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
                    <Card key={String(key._id)}>
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
                              onClick={() => handleDeleteKey(String(key._id))}
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
                    <Card key={String(key._id)} className="opacity-75">
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Gerar Nova Serial Key
            </DialogTitle>
            <DialogDescription>
              Escolha o tipo e subtipo de serial key que deseja gerar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Tipo de Serial Key */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Tipo de Serial Key</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedType === 'trial' ? 'default' : 'outline'}
                  onClick={() => setSelectedType('trial')}
                  className="h-auto py-4 flex-col gap-2"
                >
                  <Timer className="h-5 w-5" />
                  <div>
                    <div className="font-semibold">Trial</div>
                    <div className="text-xs opacity-80">Teste ou 7 dias</div>
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
                    <div className="text-xs opacity-80">Vários planos</div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Subtipo Trial */}
            {selectedType === 'trial' && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Subtipo Trial</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedTrialSubtype === 'teste' ? 'default' : 'outline'}
                    onClick={() => setSelectedTrialSubtype('teste')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Teste Dev</div>
                      <div className="text-xs opacity-80">2 minutos</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedTrialSubtype === '7dias' ? 'default' : 'outline'}
                    onClick={() => setSelectedTrialSubtype('7dias')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">7 Dias</div>
                      <div className="text-xs opacity-80">Uma semana</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Subtipo Premium */}
            {selectedType === 'premium' && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Subtipo Premium</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedPremiumSubtype === 'teste' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('teste')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Teste Dev</div>
                      <div className="text-xs opacity-80">2 minutos</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'mensal' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('mensal')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Mensal</div>
                      <div className="text-xs opacity-80">R$ 24,90</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'trimestral' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('trimestral')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Trimestral</div>
                      <div className="text-xs opacity-80">R$ 69,90</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'semestral' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('semestral')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Semestral</div>
                      <div className="text-xs opacity-80">R$ 109,90</div>
                    </div>
                  </Button>
                  <Button
                    variant={selectedPremiumSubtype === 'vitalicio' ? 'default' : 'outline'}
                    onClick={() => setSelectedPremiumSubtype('vitalicio')}
                    className="h-auto py-3 flex-col gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    <div>
                      <div className="font-semibold text-sm">Vitalício</div>
                      <div className="text-xs opacity-80">R$ 529,00</div>
                    </div>
                  </Button>
                </div>
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
