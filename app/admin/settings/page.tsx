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
import { PlanPermissionsEditor } from '@/components/admin/plan-permissions-editor'
import { normalizePlanPermissions } from '@/lib/plan-entitlements'
import { PLUS_LABEL, normalizeAccountType } from '@/lib/account-tier'
import { useCargos } from '@/hooks/use-cargos'
import { PlusGuardPanel } from '@/components/admin/plus-guard-panel'
import {
  normalizeSidebarOrder,
  normalizeSidebarSections,
  type SidebarSectionOrder,
  type SidebarSectionSettings,
} from '@/lib/sidebar-sections'
import { normalizeSidebarIcons, type SidebarSectionIcons } from '@/lib/sidebar-icons'
import { MESES_DE_RECORRENCIA, planoEhRecorrente } from '@/lib/payments/subscription-view'
import {
  normalizeSidebarGroups,
  normalizeSidebarSectionGroups,
  type SidebarGroupDefinition,
  type SidebarSectionGroups,
} from '@/lib/sidebar-groups'
import {
  SidebarMenuConfig,
  type SidebarMenuConfigValue,
} from '@/components/admin/sidebar-menu-config'

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
  landingPageEnabled: boolean
  personalExamsEnabled?: boolean
  registrationBlocked?: boolean
  registrationBlockedMessage?: string
  aiKeys?: AIKeySettings
  sidebarSections?: SidebarSectionSettings
  sidebarSectionOrder?: SidebarSectionOrder
  sidebarSectionIcons?: SidebarSectionIcons
  sidebarGroups?: SidebarGroupDefinition[]
  sidebarSectionGroups?: SidebarSectionGroups
}

interface MercadoPagoStatus {
  configured: boolean
  env?: 'sandbox' | 'production'
  publicKey?: string
  publicKeySource?: 'marketplace' | 'env'
  /** Inconsistências de credencial que quebram o cartão sem quebrar Pix/boleto. */
  warnings?: string[]
  accessTokenMasked?: string
  webhookUrl?: string
  webhookSecretConfigured?: boolean
  error?: string
  split?: {
    enabled: boolean
    partnerPercent: number
    mainPercent: number
  }
  marketplace?: {
    oauthConfigured: boolean
    redirectUri: string
    connected: boolean
    collectorId: number | null
    connectedAt: string | null
    effectiveTokenMasked: string
    effectiveSource: 'marketplace' | 'env'
  }
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
  // O seletor "Cargo a Atribuir" de cada plano vem daqui — ver `/admin/cargos`.
  const { cargos: cargosDisponiveis, acharCargo } = useCargos()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState<LandingSettings>({
    landingPageEnabled: true,
    personalExamsEnabled: true,
    registrationBlocked: false,
    registrationBlockedMessage: 'Cadastro temporariamente desativado',
    aiKeys: {
      generalExams: '',
      personalExams: '',
      flashcards: ''
    },
    sidebarSections: normalizeSidebarSections(),
    sidebarSectionOrder: normalizeSidebarOrder(),
    sidebarSectionIcons: normalizeSidebarIcons(),
    sidebarGroups: normalizeSidebarGroups(),
    sidebarSectionGroups: normalizeSidebarSectionGroups(undefined),
  })
  const [mpStatus, setMpStatus] = useState<MercadoPagoStatus | null>(null)
  const [mpEvents, setMpEvents] = useState<MercadoPagoEvent[]>([])
  const [mpTesting, setMpTesting] = useState(false)
  const [mpTestResult, setMpTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [mpDisconnecting, setMpDisconnecting] = useState(false)
  const [mpOauthBanner, setMpOauthBanner] = useState<{ ok: boolean; message: string } | null>(null)
  const [paymentMethods, setPaymentMethods] = useState({ pix: true, credit_card: true, boleto: true, subscriptions: true, requireCpfForPix: true })
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false)
  const [planos, setPlanos] = useState<PlanConfig[]>([])
  const [savingPlanos, setSavingPlanos] = useState(false)
  const [planosError, setPlanosError] = useState('')
  const [planosSuccess, setPlanosSuccess] = useState('')
  const [testingAIKey, setTestingAIKey] = useState<'generalExams' | 'personalExams' | 'flashcards' | null>(null)
  const [aiKeyTestResults, setAiKeyTestResults] = useState<Record<string, { success: boolean; message: string }>>({})

  useEffect(() => {
    checkAuth()
  }, [])

  // Mostra o resultado do fluxo OAuth de marketplace (retorno do Mercado Pago)
  // e limpa os parâmetros da URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('mp_oauth')
    if (!result) return
    if (result === 'connected') {
      setMpOauthBanner({ ok: true, message: 'Marketplace conectado! O split de pagamentos já está ativo.' })
    } else {
      const reason = params.get('reason') || 'erro desconhecido'
      setMpOauthBanner({ ok: false, message: `Falha ao conectar o marketplace: ${reason}` })
    }
    params.delete('mp_oauth')
    params.delete('reason')
    params.delete('tab')
    const qs = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
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
      loadPaymentMethods()
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
      const res = await fetch('/api/admin/settings', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        // Os vínculos seção → grupo só fazem sentido contra a lista de grupos
        // que sobreviveu à normalização.
        const grupos = normalizeSidebarGroups(data.sidebarGroups)
        // Garantir que personalExamsEnabled é um booleano
        const settings: LandingSettings = {
          landingPageEnabled: data.landingPageEnabled !== false,
          personalExamsEnabled: data.personalExamsEnabled !== false,
          registrationBlocked: data.registrationBlocked || false,
          registrationBlockedMessage: data.registrationBlockedMessage || 'Cadastro temporariamente desativado',
          aiKeys: data.aiKeys || {
            generalExams: '',
            personalExams: '',
            flashcards: ''
          },
          sidebarSections: normalizeSidebarSections(data.sidebarSections),
          sidebarSectionOrder: normalizeSidebarOrder(data.sidebarSectionOrder),
          sidebarSectionIcons: normalizeSidebarIcons(data.sidebarSectionIcons),
          sidebarGroups: grupos,
          sidebarSectionGroups: normalizeSidebarSectionGroups(data.sidebarSectionGroups, grupos),
        }
        setSettings(settings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  async function loadPaymentMethods() {
    try {
      const res = await fetch('/api/admin/settings/payment-methods')
      if (res.ok) setPaymentMethods(await res.json())
    } catch {}
  }

  async function savePaymentMethods() {
    setSavingPaymentMethods(true)
    try {
      await fetch('/api/admin/settings/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentMethods),
      })
    } finally {
      setSavingPaymentMethods(false)
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

  function connectMarketplace() {
    // Navegação (não fetch) — a rota redireciona para o Mercado Pago.
    window.location.href = '/api/admin/mercado-pago/oauth/start'
  }

  async function disconnectMarketplace() {
    if (!confirm('Desconectar o marketplace? Os pagamentos voltam a cair 100% na conta principal.')) return
    setMpDisconnecting(true)
    try {
      const res = await fetch('/api/admin/mercado-pago/oauth/disconnect', { method: 'POST' })
      if (res.ok) {
        setMpOauthBanner({ ok: true, message: 'Marketplace desconectado. Split desativado.' })
        await loadMercadoPago()
      } else {
        const data = await res.json().catch(() => ({}))
        setMpOauthBanner({ ok: false, message: data.error || 'Falha ao desconectar.' })
      }
    } catch (err: any) {
      setMpOauthBanner({ ok: false, message: String(err?.message || err) })
    } finally {
      setMpDisconnecting(false)
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

  /**
   * Ponte entre o estado desta tela e o componente do menu. O componente
   * trabalha com nomes curtos (sections/order/icons/groups/sectionGroups);
   * aqui eles voltam a ser os campos do documento de configuração.
   */
  function aplicarMenu(patch: Partial<SidebarMenuConfigValue>) {
    setSettings((atual) => ({
      ...atual,
      ...(patch.sections ? { sidebarSections: patch.sections } : {}),
      ...(patch.order ? { sidebarSectionOrder: patch.order } : {}),
      ...(patch.icons ? { sidebarSectionIcons: patch.icons } : {}),
      ...(patch.groups ? { sidebarGroups: patch.groups } : {}),
      ...(patch.sectionGroups ? { sidebarSectionGroups: patch.sectionGroups } : {}),
    }))
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

          {/* Menu lateral: seções, ordem, ícones e grupos.
              A tela inteira vive em components/admin/sidebar-menu-config. */}
          <SidebarMenuConfig
            value={{
              sections: normalizeSidebarSections(settings.sidebarSections),
              order: normalizeSidebarOrder(settings.sidebarSectionOrder),
              icons: normalizeSidebarIcons(settings.sidebarSectionIcons),
              groups: normalizeSidebarGroups(settings.sidebarGroups),
              sectionGroups: normalizeSidebarSectionGroups(
                settings.sidebarSectionGroups,
                normalizeSidebarGroups(settings.sidebarGroups)
              ),
            }}
            onChange={aplicarMenu}
            saving={saving}
            onSave={handleSave}
            onCancel={() => loadSettings()}
          />

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

          {/* Salvar */}
          <Card>
            <CardHeader>
              <CardTitle>Salvar alterações</CardTitle>
              <CardDescription>
                Aplica as configurações acima na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {(mpStatus?.warnings?.length ?? 0) > 0 && (
                <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900 dark:text-amber-100 space-y-1">
                    <p className="font-semibold">Pagamento por cartão em risco</p>
                    {mpStatus!.warnings!.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>
                    Public Key
                    {mpStatus?.publicKeySource === 'marketplace' && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (do marketplace conectado)
                      </span>
                    )}
                  </Label>
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

              {/* Split de pagamentos / Marketplace */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-1">Divisão de pagamentos (marketplace)</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Conecte a conta que processa os pagamentos à aplicação do sócio para dividir cada venda automaticamente.
                </p>

                {mpOauthBanner && (
                  <div className={`flex gap-2 p-3 mb-3 rounded-lg border ${
                    mpOauthBanner.ok
                      ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
                  }`}>
                    {mpOauthBanner.ok ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${mpOauthBanner.ok ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                      {mpOauthBanner.message}
                    </p>
                  </div>
                )}

                {/* Estado da conexão */}
                <div className="flex items-center gap-2 text-sm mb-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${mpStatus?.marketplace?.connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {mpStatus?.marketplace?.connected ? (
                    <span>
                      Conectado · conta <span className="font-mono">{mpStatus.marketplace.collectorId}</span> · token{' '}
                      <span className="font-mono">{mpStatus.marketplace.effectiveTokenMasked}</span>
                    </span>
                  ) : (
                    <span>Não conectado — pagamentos caem 100% na conta principal.</span>
                  )}
                </div>

                {/* Resumo da divisão */}
                {mpStatus?.split?.enabled ? (
                  <div className="text-sm p-3 mb-3 rounded-lg bg-muted/40">
                    Cada venda: <strong>{mpStatus.split.mainPercent}%</strong> para a conta principal ·{' '}
                    <strong>{mpStatus.split.partnerPercent}%</strong> para o sócio.
                  </div>
                ) : (
                  <div className="text-sm p-3 mb-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                    Split desligado. Defina <code>MERCADOPAGO_SPLIT_ENABLED=true</code> e{' '}
                    <code>MERCADOPAGO_SPLIT_PARTNER_PERCENT</code> nas variáveis de ambiente.
                  </div>
                )}

                {!mpStatus?.marketplace?.oauthConfigured && (
                  <div className="flex gap-2 p-3 mb-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p>Para conectar, configure <code>MERCADOPAGO_CLIENT_ID</code> e <code>MERCADOPAGO_CLIENT_SECRET</code> (da aplicação de marketplace do sócio) nas variáveis de ambiente.</p>
                      <p className="mt-1">Registre esta URL de callback na aplicação do MP:</p>
                      <code className="break-all">{mpStatus?.marketplace?.redirectUri}</code>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {mpStatus?.marketplace?.connected ? (
                    <Button variant="outline" onClick={disconnectMarketplace} disabled={mpDisconnecting}>
                      {mpDisconnecting ? 'Desconectando...' : 'Desconectar marketplace'}
                    </Button>
                  ) : (
                    <Button onClick={connectMarketplace} disabled={!mpStatus?.marketplace?.oauthConfigured}>
                      Conectar marketplace
                    </Button>
                  )}
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

              {/* Métodos de pagamento habilitados */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Métodos de pagamento</h4>
                <div className="space-y-2">
                  {([
                    { key: 'pix', label: 'Pix' },
                    { key: 'credit_card', label: 'Cartão de crédito/débito' },
                    { key: 'boleto', label: 'Boleto bancário' },
                    { key: 'subscriptions', label: 'Assinaturas recorrentes' },
                  ] as const).map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">{label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={paymentMethods[key]}
                        onClick={() => setPaymentMethods(prev => ({ ...prev, [key]: !prev[key] }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          paymentMethods[key] ? 'bg-primary' : 'bg-input'
                        }`}
                      >
                        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${paymentMethods[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  ))}
                </div>
                {/* CPF no Pix — o único meio onde exigir documento é escolha
                    nossa. No cartão o CPF entra na tokenização e no boleto vai
                    no registro: sem ele o Mercado Pago recusa o pagamento. */}
                <div className="mt-4 flex items-start justify-between gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">Exigir CPF no Pix</span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {paymentMethods.requireCpfForPix
                        ? 'O comprador precisa informar o CPF para pagar por Pix. É o dado da nota fiscal.'
                        : 'O Pix segue sem CPF — um passo a menos no caminho mais rápido de conversão, mas a nota sai sem o CPF do comprador. Quem informar mesmo assim tem o CPF vinculado ao perfil.'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cartão e boleto sempre exigem CPF — é requisito do Mercado Pago, não uma escolha do painel.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={paymentMethods.requireCpfForPix}
                    aria-label="Exigir CPF no Pix"
                    onClick={() => setPaymentMethods(prev => ({ ...prev, requireCpfForPix: !prev.requireCpfForPix }))}
                    className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      paymentMethods.requireCpfForPix ? 'bg-primary' : 'bg-input'
                    }`}
                  >
                    <span className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${paymentMethods.requireCpfForPix ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <Button
                  size="sm"
                  className="mt-3"
                  onClick={savePaymentMethods}
                  disabled={savingPaymentMethods}
                >
                  {savingPaymentMethods ? 'Salvando...' : 'Salvar métodos'}
                </Button>
              </div>

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

          {/* Plus+ — cargo único da plataforma */}
          <PlusGuardPanel />

          {/* Planos Card */}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Planos {PLUS_LABEL}</CardTitle>
              <CardDescription>
                Preços, durações e permissões dos planos exibidos em /buy. Todo plano pago
                concede o mesmo cargo; o que cada um libera da plataforma é definido no bloco
                de permissões de cada plano.
              </CardDescription>
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
                        <Label className="text-xs">Nome (ex: DomineAqui Plus+)</Label>
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
                          value={normalizeAccountType(plano.role)}
                          onChange={(e) => {
                            const updated = [...planos]
                            updated[idx].role = e.target.value as any
                            setPlanos(updated)
                          }}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                        >
                          {/* Opções vindas do registro (`/admin/cargos`): vender
                              um cargo novo não exige mais editar este arquivo. */}
                          {cargosDisponiveis.map(cargo => (
                            <option key={cargo.id} value={cargo.id}>
                              {cargo.nome}
                              {cargo.pago ? '' : ' (sem cobrança)'}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {acharCargo(plano.role)?.descricao ||
                            'O cargo que a compra deste plano concede.'}{' '}
                          <a href="/admin/cargos" className="text-primary hover:underline">
                            Editar cargos
                          </a>
                          . Planos antigos com Premium/Essential aparecem como {PLUS_LABEL} e são
                          gravados assim ao salvar.
                        </p>
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
                        {/*
                          Como este plano vai cobrar, dito em vez de deduzido.
                          A regra estava só no parágrafo abaixo, e o campo
                          "Período" logo acima é TEXTO LIVRE: dava para ter um
                          plano escrito "Anual" com duração 0 ou 6, que o
                          checkout vende como pagamento único. Quem configurou
                          não tinha como perceber sem conhecer a regra de cor.
                        */}
                        <CobrancaDoPlano meses={plano.durationMonths} />
                      </div>
                      <div className="md:col-span-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                        <strong>Pagamentos via Mercado Pago.</strong> Preço, duração e cargo definem
                        a fatura. Só <code>durationMonths</code> em {'{1, 3, 12}'} vira assinatura
                        recorrente (Preapproval): o cartão é cobrado de novo sozinho e o cliente
                        cancela no perfil. Qualquer outro valor — inclusive 6 e 0 — é cobrado uma
                        vez (Order única), sem renovação. O campo <strong>Período</strong> é só o
                        rótulo que aparece na vitrine e não muda nada na cobrança.
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
                    <PlanPermissionsEditor
                      permissoes={plano.permissoes}
                      role={plano.role}
                      onChange={(permissoes) => {
                        const updated = [...planos]
                        updated[idx] = { ...updated[idx], permissoes }
                        setPlanos(updated)
                      }}
                    />

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
                      role: 'plus' as const, // único cargo pago da plataforma
                      durationMonths: 1,
                      oculto: true, // Start hidden
                      ordem: planos.length,
                      // Nasce sem modulação: o plano novo se comporta como o
                      // cargo até alguém decidir o contrário.
                      permissoes: normalizePlanPermissions(null),
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

/**
 * Como este plano cobra, do lado do campo que decide isso.
 *
 * Vale para o admin o mesmo que o selo de /admin/analytics vale para o
 * relatório: um plano recorrente e um avulso valem o mesmo na primeira
 * cobrança e nada parecido depois, e a diferença estava escondida numa regra
 * de cabeça ({1, 3, 12}) que o formulário só descrevia em prosa.
 */
function CobrancaDoPlano({ meses }: { meses?: number }) {
  const valor = Number(meses) || 0
  const recorrente = planoEhRecorrente(valor)

  if (recorrente) {
    return (
      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed">
        <span className="inline-flex rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-bold text-violet-700 dark:text-violet-300">
          Recorrente
        </span>
        <span className="text-muted-foreground">
          cobra sozinho a cada {valor === 1 ? 'mês' : valor === 3 ? '3 meses' : 'ano'}; o cliente cancela no perfil.
        </span>
      </p>
    )
  }

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed">
      <span className="inline-flex rounded-full border border-border bg-muted px-2 py-0.5 font-bold text-muted-foreground">
        Avulso
      </span>
      <span className="text-muted-foreground">
        {valor === 0
          ? 'vitalício: cobra uma vez e o acesso não expira.'
          : `cobra uma vez e libera ${valor} ${valor === 1 ? 'mês' : 'meses'} de acesso, sem renovar.`}
        {valor > 0 && (
          <> Para renovar sozinho, use {MESES_DE_RECORRENCIA.join(', ')} meses.</>
        )}
      </span>
    </p>
  )
}
