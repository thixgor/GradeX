'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { ToastAlert } from '@/components/ui/toast-alert'
import { Logo } from '@/components/logo'
import { Eye, EyeOff, Mail } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BanReasonLabels, BanReason } from '@/lib/types'
import { Ban, AlertCircle } from 'lucide-react'
import { ADMIN_EMAILS } from '@/lib/constants'
import { GoogleProfileSetupDialog } from '@/components/google-profile-setup-dialog'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleData, setGoogleData] = useState<{
    email: string
    name?: string
    picture?: string
    googleId: string
  } | null>(null)
  const [banInfo, setBanInfo] = useState<{
    reason?: BanReason
    details?: string
    bannedAt?: Date
  }>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'user'
  })

  useEffect(() => {
    // Carrega o script do Google
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        })
        
        // Renderiza o botão quando o script carrega
        const buttonElement = document.getElementById('google-signin-button')
        if (buttonElement && isLogin) {
          window.google.accounts.id.renderButton(buttonElement, {
            type: 'standard',
            size: 'large',
            text: 'signin_with',
            locale: 'pt-BR',
          })
        }
      }
    }
    
    document.head.appendChild(script)

    return () => {
      try {
        document.head.removeChild(script)
      } catch (e) {
        // Script já foi removido
      }
    }
  }, [isLogin])

  const canBeAdmin = ADMIN_EMAILS.includes(formData.email.toLowerCase().trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        // Verifica se o usuário está banido
        if (data.error === 'banned') {
          setBanInfo({
            reason: data.banReason,
            details: data.banDetails,
            bannedAt: data.bannedAt
          })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Erro ao autenticar')
      }

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin(response: any) {
    setError('')
    setGoogleLoading(true)

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({
            reason: data.banReason,
            details: data.banDetails,
            bannedAt: data.bannedAt
          })
          setShowBannedDialog(true)
          return
        }
        if (data.error === 'blocked') {
          setBlockedMessage(data.message)
          setShowBlockedModal(true)
          return
        }
        throw new Error(data.error || 'Erro ao fazer login com Google')
      }

      // Se requer setup de perfil
      if (data.requiresProfileSetup) {
        setGoogleData(data.googleData)
        setShowProfileSetup(true)
        return
      }

      // Login bem-sucedido
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleProfileSetupComplete(profileName: string) {
    if (!googleData) return

    setGoogleLoading(true)
    try {
      const res = await fetch('/api/auth/google/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleData.email,
          profileName,
          picture: googleData.picture,
          googleId: googleData.googleId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar perfil')
      }

      setShowProfileSetup(false)
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#468152]/20 via-background to-[#E2A43E]/20 p-4">
      <div className="absolute top-4 left-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/')}
        >
          ← Voltar
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Logo variant="full" size="lg" />
          </div>
          <CardTitle className="font-heading text-2xl text-center">
            {isLogin ? 'Entrar' : 'Criar Conta'}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin
              ? 'Entre com suas credenciais para continuar'
              : 'Preencha os dados para criar sua conta'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Tipo de Conta</Label>
                <select
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Usuário</option>
                  {canBeAdmin && <option value="admin">Administrador</option>}
                </select>
                {!canBeAdmin && formData.email && (
                  <p className="text-xs text-muted-foreground">
                    Apenas emails autorizados podem criar contas de administrador
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
                {error}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>

            {isLogin && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
                  </div>
                </div>

                <div
                  id="google-signin-button"
                  className="flex justify-center"
                />
              </>
            )}

            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              onClick={() => {
                setIsLogin(!isLogin)
                setError('')
              }}
            >
              {isLogin
                ? 'Não tem uma conta? Criar conta'
                : 'Já tem uma conta? Entrar'}
            </button>
          </CardFooter>
        </form>
      </Card>

      {/* Modal de Cadastro Bloqueado */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center text-xl text-red-600 dark:text-red-400">
              Cadastro Bloqueado
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {blockedMessage}
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBlockedModal(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Usuário Banido */}
      <Dialog open={showBannedDialog} onOpenChange={setShowBannedDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
              <Ban className="h-8 w-8 text-red-600 dark:text-red-300" />
            </div>
            <DialogTitle className="text-center text-xl text-red-600 dark:text-red-400">
              Acesso Negado
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Sua conta foi banida da plataforma.
                  </p>
                  {banInfo.reason && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                        Motivo:
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {BanReasonLabels[banInfo.reason]}
                      </p>
                    </div>
                  )}
                  {banInfo.details && (
                    <div className="space-y-1 mt-3">
                      <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                        Detalhes:
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {banInfo.details}
                      </p>
                    </div>
                  )}
                  {banInfo.bannedAt && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                      Data do banimento: {new Date(banInfo.bannedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Se você acredita que isso é um erro, entre em contato com o administrador da plataforma.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowBannedDialog(false)}
              className="w-full"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Profile Setup Dialog */}
      {googleData && (
        <GoogleProfileSetupDialog
          open={showProfileSetup}
          googleData={googleData}
          onComplete={handleProfileSetupComplete}
          isLoading={googleLoading}
        />
      )}
    </div>
  )
}
