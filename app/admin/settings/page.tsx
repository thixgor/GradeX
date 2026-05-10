'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/theme-toggle'
import { LogoLoading } from '@/components/logo-loading'
import { ArrowLeft, Settings, AlertCircle, CheckCircle, Eye, EyeOff, Trash2, Zap, Plus, ArrowUp, ArrowDown } from 'lucide-react'
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

interface MercadoPagoStatus {
  configured: boolean
  env?: 'sandbox' | 'production'
  publicKey?: string
  accessTokenMasked?: string
  webhookUrl?: string
  webhookSecretConfigured?: boolean
  error?: string
}

interface MercadoPagoEvent {
  id: string
  eventId: string
  topic?: string
  resourceId?: string
  signatureValid: boolean
  processedAt?: string
  processingError?: string
  attempts: number
  createdAt: string
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
  const [videoPreview, setVideoPreview] = useState(true)
  const [mpStatus, setMpStatus] = useState<MercadoPagoStatus | null>(null)
  const [mpEvents, setMpEvents] = useState<MercadoPagoEvent[]>([])
  const [mpTesting, setMpTesting] = useState(false)
  const [mpTestResult, setMpTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [planos, setPlanos] = useState<PlanConfig[]>([])
  const [savingPlanos, setSavingPlanos] = useState(false)
  const [planosError, setPlanosError] = useState('')
  const [planosSuccess, setPlanosSuccess] = useState('')
  const [testingAIKey, setTestingAIKey] = useState<'generalExams' | 'personalExams' | 'flashcards' | null>(null)
  const [aiKeyTestResults, setAiKeyTestResults] = useState<Record<string, { success: boolean; message: string }>>({})

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
      loadMercadoPago()
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

  async function loadMercadoPago() {
    try {
      const [statusRes, eventsRes] = await Promise.all([
        fetch('/api/admin/mercado-pago/status'),
        fetch('/api/admin/mercado-pago/events?limit=20'),
      ])
      if (statusRes.ok) setMpStatus(await statusRes.json())
      if (eventsRes.ok) setMpEvents(await eventsRes.json())
    } catch (error) {
      console.error('Erro ao carregar Mercado Pago:', error)
    }
  }

  async function testMercadoPagoConnection() {
    setMpTesting(true)
    setMpTestResult(null)
    try {
      const res = await fetch('/api/admin/mercado-pago/test', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setMpTestResult({
          ok: true,
          message: `Conectado: ${data.account?.nickname || data.account?.email || data.account?.id} (${data.account?.siteId || '—'})`,
        })
      } else {
        setMpTestResult({ ok: false, message: data.error || 'Falha ao conectar' })
      }
    } catch (err: any) {
      setMpTestResult({ ok: false, message: String(err?.message || err) })
    } finally {
      setMpTesting(false)
    }
  }

  async function testAIKey(keyType: 'generalExams' | 'personalExams' | 'flashcards') {
    const apiKey = settings.aiKeys?.[keyType]

    if (!apiKey?.trim()) {
      setAiKeyTestResults(prev => ({
        ...prev,
        [keyType]: { success: false, message: 'Por favor, insira uma API Key' }
      }))
      return
    }

    setTestingAIKey(keyType)
    try {
      const res = await fetch('/api/settings/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey })
      })

      const data = await res.json()

      if (data.success) {
        setAiKeyTestResults(prev => ({
          ...prev,
          [keyType]: { success: true, message: 'Conexão estabelecida com sucesso!' }
        }))
      } else {
        setAiKeyTestResults(prev => ({
          ...prev,
          [keyType]: { success: false, message: data.error || 'Falha ao conectar' }
        }))
      }
    } catch (error: any) {
      setAiKeyTestResults(prev => ({
        ...prev,
        [keyType]: { success: false, message: 'Erro ao testar: ' + error.message }
      }))
    } finally {
      setTestingAIKey(null)
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
    return <LogoLoading message="Carregando configurações..." size="lg" fullscreen />
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.landingPageEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.landingPageEnabled ? 'translate-x-7' : 'translate-x-1'
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.videoEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.videoEnabled ? 'translate-x-7' : 'translate-x-1'
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.personalExamsEnabled ? 'bg-primary' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.personalExamsEnabled ? 'translate-x-7' : 'translate-x-1'
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
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${settings.registrationBlocked ? 'bg-red-500' : 'bg-muted'
                    }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings.registrationBlocked ? 'translate-x-7' : 'translate-x-1'
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

          {/* Mercado Pago */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Integração Mercado Pago
                {mpStatus?.env && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    mpStatus.env === 'production'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100'
                  }`}>
                    {mpStatus.env === 'production' ? 'PRODUÇÃO' : 'SANDBOX'}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Credenciais carregadas via variáveis de ambiente. O painel exibe apenas o sufixo do token.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mpStatus?.configured && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-semibold">Mercado Pago não configurado.</p>
                    <p>Defina <code>MERCADOPAGO_ACCESS_TOKEN</code>, <code>MERCADOPAGO_PUBLIC_KEY</code> e <code>MERCADOPAGO_WEBHOOK_SECRET</code> nas variáveis de ambiente.</p>
                    {mpStatus?.error && <p className="mt-1 opacity-80">{mpStatus.error}</p>}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Public Key</Label>
                  <Input value={mpStatus?.publicKey || '—'} readOnly className="font-mono text-xs" />
                </div>
                <div>
                  <Label>Access Token</Label>
                  <Input value={mpStatus?.accessTokenMasked || '—'} readOnly className="font-mono text-xs" />
                </div>
                <div className="sm:col-span-2">
                  <Label>URL de Webhook</Label>
                  <Input value={mpStatus?.webhookUrl || '—'} readOnly className="font-mono text-xs" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Configure essa URL no painel do Mercado Pago: <em>Sua aplicação → Webhooks</em>.
                  </p>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full ${mpStatus?.webhookSecretConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
                  Webhook secret {mpStatus?.webhookSecretConfigured ? 'configurado' : 'não configurado'}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testMercadoPagoConnection} disabled={mpTesting || !mpStatus?.configured}>
                  {mpTesting ? 'Testando...' : 'Testar conexão'}
                </Button>
                <Button variant="outline" onClick={loadMercadoPago}>
                  Recarregar
                </Button>
              </div>
              {mpTestResult && (
                <div className={`flex gap-2 p-3 rounded-lg border ${
                  mpTestResult.ok
                    ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                }`}>
                  {mpTestResult.ok ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${mpTestResult.ok ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {mpTestResult.message}
                  </p>
                </div>
              )}

              {/* Eventos recentes */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Webhooks recentes</h4>
                {mpEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum evento recebido ainda.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {mpEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between gap-2 text-xs p-2 rounded bg-muted/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            ev.signatureValid && ev.processedAt && !ev.processingError
                              ? 'bg-green-500'
                              : ev.processingError
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                          }`} />
                          <span className="font-mono truncate">{ev.topic || 'event'} · {ev.resourceId || '—'}</span>
                        </div>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(ev.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="flex gap-2">
                  <Input
                    id="ai-general"
                    type="password"
                    placeholder="sk-..."
                    value={settings.aiKeys?.generalExams || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiKeys: { ...settings.aiKeys, generalExams: e.target.value }
                    })}
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testAIKey('generalExams')}
                    disabled={testingAIKey === 'generalExams'}
                    className="shrink-0"
                  >
                    {testingAIKey === 'generalExams' ? 'Testando...' : 'Testar'}
                  </Button>
                </div>
                {aiKeyTestResults.generalExams && (
                  <div className={`flex gap-2 p-2 rounded-lg text-sm ${aiKeyTestResults.generalExams.success
                    ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                    }`}>
                    {aiKeyTestResults.generalExams.success ? (
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{aiKeyTestResults.generalExams.message}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Usado em: /admin/exams/create (Criação de Provas Gerais)
                </p>
              </div>

              {/* Personal Exams */}
              <div className="space-y-2">
                <Label htmlFor="ai-personal">API Key para Provas Pessoais</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-personal"
                    type="password"
                    placeholder="sk-..."
                    value={settings.aiKeys?.personalExams || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiKeys: { ...settings.aiKeys, personalExams: e.target.value }
                    })}
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testAIKey('personalExams')}
                    disabled={testingAIKey === 'personalExams'}
                    className="shrink-0"
                  >
                    {testingAIKey === 'personalExams' ? 'Testando...' : 'Testar'}
                  </Button>
                </div>
                {aiKeyTestResults.personalExams && (
                  <div className={`flex gap-2 p-2 rounded-lg text-sm ${aiKeyTestResults.personalExams.success
                    ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                    }`}>
                    {aiKeyTestResults.personalExams.success ? (
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{aiKeyTestResults.personalExams.message}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Usado em: /exams/personal/[id]/generate-questions (Geração de Questões)
                </p>
              </div>

              {/* Flashcards */}
              <div className="space-y-2">
                <Label htmlFor="ai-flashcards">API Key para Flashcards</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-flashcards"
                    type="password"
                    placeholder="sk-..."
                    value={settings.aiKeys?.flashcards || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      aiKeys: { ...settings.aiKeys, flashcards: e.target.value }
                    })}
                    className="font-mono text-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testAIKey('flashcards')}
                    disabled={testingAIKey === 'flashcards'}
                    className="shrink-0"
                  >
                    {testingAIKey === 'flashcards' ? 'Testando...' : 'Testar'}
                  </Button>
                </div>
                {aiKeyTestResults.flashcards && (
                  <div className={`flex gap-2 p-2 rounded-lg text-sm ${aiKeyTestResults.flashcards.success
                    ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'
                    }`}>
                    {aiKeyTestResults.flashcards.success ? (
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{aiKeyTestResults.flashcards.message}</span>
                  </div>
                )}
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
                  <div key={idx} className="p-4 border rounded-lg space-y-3 bg-card relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (idx === 0) return
                            const updated = [...planos]
                            const temp = updated[idx]
                            updated[idx] = updated[idx - 1]
                            updated[idx - 1] = temp
                            // Update ordem
                            updated.forEach((p, i) => p.ordem = i)
                            setPlanos(updated)
                          }}
                          disabled={idx === 0}
                          title="Mover para cima"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (idx === planos.length - 1) return
                            const updated = [...planos]
                            const temp = updated[idx]
                            updated[idx] = updated[idx + 1]
                            updated[idx + 1] = temp
                            // Update ordem
                            updated.forEach((p, i) => p.ordem = i)
                            setPlanos(updated)
                          }}
                          disabled={idx === planos.length - 1}
                          title="Mover para baixo"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja remover este plano?')) {
                            const updated = planos.filter((_, i) => i !== idx)
                            setPlanos(updated)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">ID do Tipo (ex: questoes_mensal)</Label>
                        <Input
                          value={plano.tipo}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].tipo = e.target.value
                            setPlanos(updated)
                          }}
                          placeholder="unique_id"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nome (ex: DomineAqui PREMIUM)</Label>
                        <Input
                          value={plano.nome}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].nome = e.target.value
                            setPlanos(updated)
                          }}
                          placeholder="Nome do Plano"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Período (ex: Plano Mensal)</Label>
                        <Input
                          value={plano.periodo}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].periodo = e.target.value
                            setPlanos(updated)
                          }}
                          placeholder="Período"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
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
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">De (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={plano.precoOriginal || ''}
                            onChange={(e) => {
                              const updated = [...planos]
                              updated[idx].precoOriginal = e.target.value ? parseFloat(e.target.value) : undefined
                              setPlanos(updated)
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role and Duration Config */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg border border-dashed">
                      <div>
                        <Label className="text-xs">Cargo a Atribuir</Label>
                        <select
                          value={plano.role || 'premium'}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].role = e.target.value as any
                            setPlanos(updated)
                          }}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        >
                          <option value="premium">Premium</option>
                          <option value="essential">Essential</option>
                          <option value="trial">Trial</option>
                          <option value="gratuito">Gratuito</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Duração em Meses (0 = Vitalício)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={plano.durationMonths || 0}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].durationMonths = parseInt(e.target.value) || 0
                            setPlanos(updated)
                          }}
                          placeholder="Ex: 1 (Mensal), 12 (Anual)"
                        />
                      </div>
                      <div className="md:col-span-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                        <strong>Pagamentos via Mercado Pago.</strong> Preço, duração e cargo definem
                        a fatura. Planos com <code>durationMonths</code> em {'{1, 3, 12}'} são
                        recorrentes (Preapproval). Demais (ex.: vitalício) são Order única.
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Badge (ex: MAIS POPULAR)</Label>
                      <Input
                        value={plano.badge || ''}
                        onChange={(e) => {
                          const updated = [...planos]
                          updated[idx].badge = e.target.value
                          setPlanos(updated)
                        }}
                        placeholder="Texto da etiqueta"
                      />
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
                        placeholder="Breve descrição"
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
                          // Remove empty lines handling logic to allow empty lines while typing, but clean up on save if needed?
                          // Actually, split('\n') is fine, we can filter empty strings or not. 
                          // The original code filtered: .filter(b => b.length > 0). I will keep that behavior or refine it.
                          // Better to keep all lines while typing so user can press enter.
                          // I'll filter empty strings *only* when saving or rendering, but let's keep it simple here.
                          // Just assign the array.
                          setPlanos(updated)
                        }}
                        placeholder="Lista de benefícios..."
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
                        {/* Icons are already imported */}
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

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const updated = [...planos]
                          updated[idx].destaque = !updated[idx].destaque
                          setPlanos(updated)
                        }}
                        className={plano.destaque ? 'text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30' : 'text-gray-500'}
                      >
                        <Zap className={`h-4 w-4 mr-2 ${plano.destaque ? 'fill-current' : ''}`} />
                        {plano.destaque ? 'Em Destaque' : 'Destacar'}
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed p-8"
                  onClick={() => {
                    const newPlan = {
                      tipo: `custom_${Date.now()}`,
                      nome: 'Novo Plano',
                      periodo: 'Mensal',
                      preco: 0,
                      descricao: '',
                      beneficios: [],
                      oculto: true, // Start hidden
                      ordem: planos.length,
                      criadoEm: new Date(),
                      atualizadoEm: new Date()
                    }
                    setPlanos([...planos, newPlan])
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Novo Plano
                </Button>
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
