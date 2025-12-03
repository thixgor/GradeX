'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Settings, AlertCircle, CheckCircle, Eye, EyeOff, Trash2 } from 'lucide-react'
import { PlanConfig } from '@/lib/types'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AIKeySettings {
  generalExams?: string
  personalExams?: string
  flashcards?: string
}

interface LandingSettings {
  videoEmbedUrl: string
  landingPageEnabled: boolean
  videoEnabled: boolean
  personalExamsEnabled?: boolean
  registrationBlocked?: boolean
  registrationBlockedMessage?: string
  aiKeys?: AIKeySettings
}

interface StripeSettings {
  monthly: string
  quarterly: string
  'semi-annual': string
  annual: string
  lifetime: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<LandingSettings>({
    videoEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    landingPageEnabled: true,
    videoEnabled: true,
    personalExamsEnabled: true,
    registrationBlocked: false,
    registrationBlockedMessage: 'Cadastro temporariamente desativado',
    aiKeys: {
      generalExams: '',
      personalExams: '',
      flashcards: ''
    }
  })
  const [stripeSettings, setStripeSettings] = useState<StripeSettings>({
    monthly: '',
    quarterly: '',
    'semi-annual': '',
    annual: '',
    lifetime: ''
  })
  const [videoPreview, setVideoPreview] = useState(true)
  const [savingStripe, setSavingStripe] = useState(false)
  const [stripeError, setStripeError] = useState('')
  const [stripeSuccess, setStripeSuccess] = useState('')
  const [planos, setPlanos] = useState<PlanConfig[]>([])
  const [savingPlanos, setSavingPlanos] = useState(false)
  const [planosError, setPlanosError] = useState('')
  const [planosSuccess, setPlanosSuccess] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        router.push('/auth/login')
        return
      }
      const data = await res.json()

      if (data.user.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(data.user)
      loadSettings()
      loadStripeSettings()
      loadPlanos()
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlanos() {
    try {
      const res = await fetch('/api/admin/settings/planos')
      if (res.ok) {
        const data = await res.json()
        setPlanos(data.planos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  }

  async function savePlanos() {
    setSavingPlanos(true)
    setPlanosError('')
    setPlanosSuccess('')

    try {
      const res = await fetch('/api/admin/settings/planos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planos })
      })

      const data = await res.json()

      if (!res.ok) {
        setPlanosError(data.error || 'Erro ao salvar planos')
        return
      }

      setPlanosSuccess('Planos salvos com sucesso!')
      setTimeout(() => {
        loadPlanos()
      }, 1000)
    } catch (error) {
      setPlanosError('Erro ao salvar planos')
    } finally {
      setSavingPlanos(false)
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        // Garantir que personalExamsEnabled é um booleano
        const settings: LandingSettings = {
          videoEmbedUrl: data.videoEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          landingPageEnabled: data.landingPageEnabled !== false,
          videoEnabled: data.videoEnabled !== false,
          personalExamsEnabled: data.personalExamsEnabled !== false,
          registrationBlocked: data.registrationBlocked || false,
          registrationBlockedMessage: data.registrationBlockedMessage || 'Cadastro temporariamente desativado',
          aiKeys: data.aiKeys || {
            generalExams: '',
            personalExams: '',
            flashcards: ''
          }
        }
        setSettings(settings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function loadStripeSettings() {
    try {
      const res = await fetch('/api/admin/stripe-settings')
      if (res.ok) {
        const data = await res.json()
        setStripeSettings({
          monthly: data.monthly || '',
          quarterly: data.quarterly || '',
          'semi-annual': data['semi-annual'] || '',
          annual: data.annual || '',
          lifetime: data.lifetime || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de Stripe:', error)
    }
  }

  async function handleSaveStripe() {
    setStripeError('')
    setStripeSuccess('')
    setSavingStripe(true)

    try {
      const res = await fetch('/api/admin/stripe-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stripeSettings)
      })

      const data = await res.json()

      if (!res.ok) {
        setStripeError(data.error || 'Erro ao salvar configurações')
        return
      }

      setStripeSuccess('Configurações de Stripe salvas com sucesso!')
      setTimeout(() => {
        loadStripeSettings()
      }, 1000)
    } catch (error) {
      setStripeError('Erro ao salvar configurações de Stripe')
    } finally {
      setSavingStripe(false)
    }
  }

  async function handleSave() {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar configurações')
        return
      }

      setSuccess('Configurações salvas com sucesso!')
      // Recarregar as configurações após 1 segundo
      setTimeout(() => {
        loadSettings()
      }, 1000)
    } catch (error) {
      setError('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/admin')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Settings className="h-6 w-6 text-primary" />
                  Configurações da Landing Page
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Controle os elementos principais da landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Landing Page Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Habilitar Landing Page</Label>
                  <p className="text-sm text-muted-foreground">
                    Se desabilitado, usuários não autenticados irão direto para login
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, landingPageEnabled: !settings.landingPageEnabled })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.landingPageEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.landingPageEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Video Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Habilitar Vídeo de Demonstração</Label>
                  <p className="text-sm text-muted-foreground">
                    Se desabilitado, a seção de vídeo não será exibida na landing page
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, videoEnabled: !settings.videoEnabled })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.videoEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.videoEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Personal Exams Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Habilitar Provas Pessoais</Label>
                  <p className="text-sm text-muted-foreground">
                    Se desabilitado, usuários não poderão criar ou acessar provas pessoais
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, personalExamsEnabled: !settings.personalExamsEnabled })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.personalExamsEnabled ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.personalExamsEnabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Registration Blocked Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Bloquear Cadastro de Novos Usuários</Label>
                  <p className="text-sm text-muted-foreground">
                    Se ativado, novos usuários não poderão se cadastrar via email ou OAuth2
                  </p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, registrationBlocked: !settings.registrationBlocked })}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    settings.registrationBlocked ? 'bg-red-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.registrationBlocked ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Messages */}
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadSettings()}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registration Blocked Message */}
          {settings.registrationBlocked && (
            <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-100">Mensagem de Bloqueio de Cadastro</CardTitle>
                <CardDescription className="text-red-800 dark:text-red-200">
                  Esta mensagem será exibida quando usuários tentarem se cadastrar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="blockMessage">Mensagem</Label>
                  <textarea
                    id="blockMessage"
                    placeholder="Digite a mensagem que será exibida..."
                    value={settings.registrationBlockedMessage || ''}
                    onChange={(e) => setSettings({ ...settings, registrationBlockedMessage: e.target.value })}
                    className="w-full p-3 border rounded-lg bg-white dark:bg-slate-900 text-foreground resize-none h-24"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo 200 caracteres
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {saving ? 'Salvando...' : 'Salvar Mensagem'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => loadSettings()}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Video Embed Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Vídeo de Demonstração</CardTitle>
              <CardDescription>
                Configure a URL do vídeo embed que aparece na landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl">URL do Embed do Vídeo</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://www.youtube.com/embed/..."
                  value={settings.videoEmbedUrl}
                  onChange={(e) => setSettings({ ...settings, videoEmbedUrl: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Suporta YouTube, Vimeo e Dailymotion. Use URLs de embed (ex: youtube.com/embed/...)
                </p>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Prévia do Vídeo</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVideoPreview(!videoPreview)}
                  >
                    {videoPreview ? 'Ocultar' : 'Mostrar'} Prévia
                  </Button>
                </div>
                {videoPreview && (
                  <div className="bg-black/50 rounded-lg overflow-hidden">
                    <div className="aspect-video">
                      <iframe
                        width="100%"
                        height="100%"
                        src={settings.videoEmbedUrl}
                        title="Prévia do Vídeo"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadSettings()}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">Dicas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                <strong>YouTube:</strong> Use URLs como <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">https://www.youtube.com/embed/dQw4w9WgXcQ</code>
              </p>
              <p>
                <strong>Vimeo:</strong> Use URLs como <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">https://vimeo.com/123456789</code>
              </p>
              <p>
                <strong>Dailymotion:</strong> Use URLs como <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">https://www.dailymotion.com/embed/video/...</code>
              </p>
            </CardContent>
          </Card>

          {/* Stripe Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Stripe</CardTitle>
              <CardDescription>
                Gerencie os Price IDs dos planos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly */}
              <div className="space-y-2">
                <Label htmlFor="stripe-monthly">Mensal (price_id)</Label>
                <Input
                  id="stripe-monthly"
                  placeholder="price_1SZNGXLawSqPVy6JgWlwc7jZ"
                  value={stripeSettings.monthly}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, monthly: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              {/* Quarterly */}
              <div className="space-y-2">
                <Label htmlFor="stripe-quarterly">Trimestral (price_id)</Label>
                <Input
                  id="stripe-quarterly"
                  placeholder="price_1SZNGwLawSqPVy6Ja5PmQ7La"
                  value={stripeSettings.quarterly}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, quarterly: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              {/* Semi-Annual */}
              <div className="space-y-2">
                <Label htmlFor="stripe-semi-annual">Semestral (price_id)</Label>
                <Input
                  id="stripe-semi-annual"
                  placeholder="price_1SZNHALawSqPVy6J83iS9ZOE"
                  value={stripeSettings['semi-annual']}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, 'semi-annual': e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              {/* Annual */}
              <div className="space-y-2">
                <Label htmlFor="stripe-annual">Anual (price_id)</Label>
                <Input
                  id="stripe-annual"
                  placeholder="price_1SZNHcLawSqPVy6JzTZvOkDJ"
                  value={stripeSettings.annual}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, annual: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              {/* Lifetime */}
              <div className="space-y-2">
                <Label htmlFor="stripe-lifetime">Vitalício (price_id)</Label>
                <Input
                  id="stripe-lifetime"
                  placeholder="price_1SZNI6LawSqPVy6JCtC12X3H"
                  value={stripeSettings.lifetime}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, lifetime: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              {/* Messages */}
              {stripeError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{stripeError}</p>
                </div>
              )}

              {stripeSuccess && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">{stripeSuccess}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveStripe}
                  disabled={savingStripe}
                  className="bg-primary hover:bg-primary/90"
                >
                  {savingStripe ? 'Salvando...' : 'Salvar Configurações de Stripe'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadStripeSettings()}
                  disabled={savingStripe}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Keys Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Chaves de IA</CardTitle>
              <CardDescription>
                Configure diferentes API keys de IA para cada seção, reduzindo carga e RPM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General Exams */}
              <div className="space-y-2">
                <Label htmlFor="ai-general">API Key para Provas Gerais</Label>
                <Input
                  id="ai-general"
                  type="password"
                  placeholder="sk-..."
                  value={settings.aiKeys?.generalExams || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiKeys: { ...settings.aiKeys, generalExams: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usado em: /admin/exams/create (Criação de Provas Gerais)
                </p>
              </div>

              {/* Personal Exams */}
              <div className="space-y-2">
                <Label htmlFor="ai-personal">API Key para Provas Pessoais</Label>
                <Input
                  id="ai-personal"
                  type="password"
                  placeholder="sk-..."
                  value={settings.aiKeys?.personalExams || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiKeys: { ...settings.aiKeys, personalExams: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usado em: /exams/personal/[id]/generate-questions (Geração de Questões)
                </p>
              </div>

              {/* Flashcards */}
              <div className="space-y-2">
                <Label htmlFor="ai-flashcards">API Key para Flashcards</Label>
                <Input
                  id="ai-flashcards"
                  type="password"
                  placeholder="sk-..."
                  value={settings.aiKeys?.flashcards || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    aiKeys: { ...settings.aiKeys, flashcards: e.target.value }
                  })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usado em: /flashcards (Geração de Flashcards com IA)
                </p>
              </div>

              {/* Info Card */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Dica:</strong> Use diferentes chaves de IA para distribuir a carga e evitar limites de RPM. Se deixar vazio, usará a chave padrão do ambiente.
                </p>
              </div>

              {/* Messages */}
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? 'Salvando...' : 'Salvar Chaves de IA'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadSettings()}
                  disabled={saving}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Planos Card */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Planos</CardTitle>
              <CardDescription>Configure os planos de preço disponíveis em /buy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Planos List */}
              <div className="space-y-4">
                {planos.map((plano, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                          value={plano.nome}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].nome = e.target.value
                            setPlanos(updated)
                          }}
                          placeholder="DomineAqui PREMIUM"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Período</Label>
                        <Input
                          value={plano.periodo}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].periodo = e.target.value
                            setPlanos(updated)
                          }}
                          placeholder="Plano Mensal"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={plano.preco}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].preco = parseFloat(e.target.value)
                            setPlanos(updated)
                          }}
                          placeholder="24.90"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Preço Original (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={plano.precoOriginal || ''}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].precoOriginal = e.target.value ? parseFloat(e.target.value) : undefined
                            setPlanos(updated)
                          }}
                          placeholder="29.90"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={plano.descricao || ''}
                        onChange={(e) => {
                          const updated = [...planos]
                          updated[idx].descricao = e.target.value
                          setPlanos(updated)
                        }}
                        placeholder="Melhor custo-benefício"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Benefícios (um por linha)</Label>
                      <Textarea
                        value={(plano.beneficios || []).join('\n')}
                        onChange={(e) => {
                          const updated = [...planos]
                          updated[idx].beneficios = e.target.value
                            .split('\n')
                            .map(b => b.trim())
                            .filter(b => b.length > 0)
                          setPlanos(updated)
                        }}
                        placeholder="400 Questões Pessoais por dia&#10;500 Flashcards por dia&#10;Cronogramas ilimitados&#10;Forum de materiais e discussão premium&#10;Aulas ao vivo e vídeo-aulas pós-aula&#10;Acesso a grupo de WhatsApp"
                        rows={6}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = [...planos]
                          updated[idx].oculto = !updated[idx].oculto
                          setPlanos(updated)
                        }}
                        className={plano.oculto ? 'text-red-600' : 'text-green-600'}
                      >
                        {plano.oculto ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Oculto
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Visível
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Messages */}
              {planosError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{planosError}</p>
                </div>
              )}

              {planosSuccess && (
                <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-200">{planosSuccess}</p>
                </div>
              )}

              {/* Save Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={savePlanos}
                  disabled={savingPlanos}
                  className="bg-primary hover:bg-primary/90"
                >
                  {savingPlanos ? 'Salvando...' : 'Salvar Planos'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadPlanos()}
                  disabled={savingPlanos}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
