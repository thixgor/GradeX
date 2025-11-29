'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, Settings, AlertCircle, CheckCircle } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
}

interface LandingSettings {
  videoEmbedUrl: string
  landingPageEnabled: boolean
  videoEnabled: boolean
  personalExamsEnabled?: boolean
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
    personalExamsEnabled: true
  })
  const [videoPreview, setVideoPreview] = useState(true)

  useEffect(() => {
    checkAuth()
    // Recarregar configurações a cada 5 segundos para manter sincronizado
    const interval = setInterval(() => {
      loadSettings()
    }, 5000)
    return () => clearInterval(interval)
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
    } catch (error) {
      router.push('/auth/login')
    } finally {
      setLoading(false)
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
          personalExamsEnabled: data.personalExamsEnabled !== false
        }
        setSettings(settings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
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
            </CardContent>
          </Card>

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
        </div>
      </main>
    </div>
  )
}
