'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'
import { Eye, EyeOff, Mail, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BanReasonLabels, BanReason } from '@/lib/types'
import { Ban, AlertCircle } from 'lucide-react'
import { ADMIN_EMAILS } from '@/lib/constants'
import { INSTITUTION_UNITS } from '@/lib/institution-units'
import { GoogleProfileSetupDialog } from '@/components/google-profile-setup-dialog'

declare global {
  interface Window {
    google?: any
    grecaptcha?: any
  }
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
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
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [banInfo, setBanInfo] = useState<{
    reason?: BanReason
    details?: string
    bannedAt?: Date
  }>({})

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
    isAfyaMedicineStudent: false,
    afyaUnit: '',
    role: 'user'
  })

  useEffect(() => {
    const loadRecaptchaScript = () => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
      script.async = true
      script.defer = true

      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {
            console.log('reCAPTCHA carregado com sucesso')
          })
        }
      }

      document.head.appendChild(script)

      return () => {
        try {
          document.head.removeChild(script)
        } catch (e) {
          // Script already removed
        }
      }
    }

    const loadGoogleScript = () => {
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
          // Script already removed
        }
      }
    }

    const cleanupRecaptcha = loadRecaptchaScript()
    const cleanupGoogle = loadGoogleScript()

    return () => {
      cleanupRecaptcha?.()
      cleanupGoogle?.()
    }
  }, [isLogin])

  const canBeAdmin = ['throdrigf@gmail.com', 'ecocardio93@gmail.com'].includes(formData.email.toLowerCase().trim())

  const [isRegistered, setIsRegistered] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!window.grecaptcha) {
        setError('reCAPTCHA nao carregado. Tente novamente.')
        setLoading(false)
        return
      }

      const token = await window.grecaptcha.execute(
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
        { action: isLogin ? 'login' : 'register' }
      )

      if (!token) {
        setError('Falha ao verificar reCAPTCHA. Tente novamente.')
        setLoading(false)
        return
      }

      setRecaptchaToken(token)

      if (!isLogin) {
        if (!formData.name || !formData.email || !formData.password || !formData.dateOfBirth) {
          setError('Nome, email, senha e data de nascimento sao obrigatorios')
          setLoading(false)
          return
        }

        if (formData.isAfyaMedicineStudent && !formData.afyaUnit) {
          setError('Selecione sua unidade')
          setLoading(false)
          return
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email: formData.email, password: formData.password, recaptchaToken: token }
        : {
          ...formData,
          recaptchaToken: token,
        }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        throw new Error(data.error || 'Erro ao autenticar')
      }

      if (!isLogin) {
        setIsRegistered(true)
      } else {
        router.push(redirectTo)
        router.refresh()
      }
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

      if (data.requiresProfileSetup) {
        setGoogleData(data.googleData)
        setShowProfileSetup(true)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleProfileSetupComplete(setupData: {
    profileName: string
    dateOfBirth: string
    isAfyaMedicineStudent: boolean
    afyaUnit?: string
  }) {
    if (!googleData) return

    setGoogleLoading(true)
    try {
      const res = await fetch('/api/auth/google/setup-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleData.email,
          profileName: setupData.profileName,
          dateOfBirth: setupData.dateOfBirth,
          isAfyaMedicineStudent: setupData.isAfyaMedicineStudent,
          afyaUnit: setupData.afyaUnit,
          picture: googleData.picture,
          googleId: googleData.googleId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar perfil')
      }

      setShowProfileSetup(false)
      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  function handleProfileSetupCancel() {
    setShowProfileSetup(false)
    setGoogleData(null)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Ambient floating blobs */}
      <div className="auth-bg-blob w-[500px] h-[500px] bg-[#468152]/30 top-[-10%] left-[-10%]" />
      <div className="auth-bg-blob w-[400px] h-[400px] bg-[#E2A43E]/25 bottom-[-5%] right-[-5%]" style={{ animationDelay: '-4s' }} />
      <div className="auth-bg-blob w-[300px] h-[300px] bg-[#CE5929]/15 top-[40%] right-[20%]" style={{ animationDelay: '-8s' }} />

      {/* Top bar */}
      <div className="absolute top-4 left-4 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="soul-light rounded-xl backdrop-blur-sm bg-white/20 dark:bg-white/5 border border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10"
        >
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Voltar
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md auth-glass-card max-h-[90vh] flex flex-col relative z-10"
      >
        {/* Header */}
        <div className="p-6 pb-2 flex-shrink-0 text-center space-y-3">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex justify-center mb-2"
          >
            <Logo variant="full" size="lg" />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="font-heading text-2xl font-bold">
                {isLogin ? 'Entrar' : 'Criar Conta'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLogin
                  ? 'Entre com suas credenciais para continuar'
                  : 'Preencha os dados para criar sua conta'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {isRegistered ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 space-y-5 flex flex-col items-center"
          >
            <div className="h-20 w-20 rounded-full bg-[#468152]/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-[#468152]" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold font-heading">Conta criada com sucesso!</h3>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmacao para o seu e-mail: <br />
                <span className="font-semibold text-foreground">{formData.email}</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#E2A43E]/10 border border-[#E2A43E]/20">
              <p className="text-xs text-center">
                <strong>Atencao:</strong> Voce precisa confirmar seu e-mail para ter acesso completo a todas as ferramentas da plataforma.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button onClick={() => router.push('/')} className="w-full soul-light soul-light-brand btn-brand-glow text-white rounded-xl h-11">
                Ir para o Inicio
              </Button>
              <Button variant="outline" onClick={() => setIsLogin(true)} className="w-full soul-light rounded-xl h-11 backdrop-blur-sm">
                Fazer Login Agora
              </Button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 overflow-y-auto flex-1 px-6 py-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="name" className="text-xs font-medium">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Joao Silva"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      className="auth-glass-input rounded-xl h-11"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="auth-glass-input rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
                  {isLogin && (
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-muted-foreground hover:text-[#468152] transition-colors"
                      tabIndex={-1}
                    >
                      Esqueceu a senha?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="auth-glass-input rounded-xl h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth" className="text-xs font-medium">Data de Nascimento *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        required
                        className="auth-glass-input rounded-xl h-11"
                      />
                    </div>

                    <div className="space-y-3 p-4 rounded-xl bg-[#E2A43E]/5 border border-[#E2A43E]/15">
                      <p className="text-sm font-medium">
                        Você é estudante de Ciências Médicas?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.isAfyaMedicineStudent ? 'default' : 'outline'}
                          className={`flex-1 h-9 rounded-xl soul-light ${formData.isAfyaMedicineStudent ? 'bg-[#468152] hover:bg-[#468152]/90' : ''}`}
                          onClick={() => setFormData({ ...formData, isAfyaMedicineStudent: true })}
                        >
                          Sim
                        </Button>
                        <Button
                          type="button"
                          variant={!formData.isAfyaMedicineStudent ? 'default' : 'outline'}
                          className={`flex-1 h-9 rounded-xl soul-light ${!formData.isAfyaMedicineStudent ? 'bg-muted-foreground/80 hover:bg-muted-foreground/70' : ''}`}
                          onClick={() => setFormData({ ...formData, isAfyaMedicineStudent: false, afyaUnit: '' })}
                        >
                          Nao
                        </Button>
                      </div>
                    </div>

                    {formData.isAfyaMedicineStudent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="afyaUnit" className="text-xs font-medium">Sua Unidade *</Label>
                        <select
                          id="afyaUnit"
                          className="flex h-11 w-full rounded-xl auth-glass-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={formData.afyaUnit}
                          onChange={(e) => setFormData({ ...formData, afyaUnit: e.target.value })}
                          required={formData.isAfyaMedicineStudent}
                        >
                          <option value="">Selecione sua unidade...</option>
                          {INSTITUTION_UNITS.map((unit) => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </motion.div>
                    )}

                    {canBeAdmin && (
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-xs font-medium">Tipo de Conta</Label>
                        <select
                          id="role"
                          className="flex h-11 w-full rounded-xl auth-glass-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                          <option value="user">Usuario</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive text-center p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 flex-shrink-0 space-y-4">
              <Button
                type="submit"
                className="w-full h-11 rounded-xl soul-light soul-light-brand btn-brand-glow text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>

              {isLogin && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/40"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-muted-foreground backdrop-blur-sm">Ou continue com</span>
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
                className="w-full text-sm text-muted-foreground hover:text-[#468152] transition-colors py-1"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
              >
                {isLogin
                  ? 'Nao tem uma conta? Criar conta'
                  : 'Ja tem uma conta? Entrar'}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Modal de Cadastro Bloqueado */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent className="max-w-md auth-glass-card border-none">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl text-red-500">
              Cadastro Bloqueado
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm">{blockedMessage}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setShowBlockedModal(false)} className="w-full rounded-xl soul-light">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Usuario Banido */}
      <Dialog open={showBannedDialog} onOpenChange={setShowBannedDialog}>
        <DialogContent className="max-w-md auth-glass-card border-none">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Ban className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-center text-xl text-red-500">
              Acesso Negado
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="space-y-4 mt-4">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-sm font-medium mb-2">
                    Sua conta foi banida da plataforma.
                  </p>
                  {banInfo.reason && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Motivo:</p>
                      <p className="text-sm">{BanReasonLabels[banInfo.reason]}</p>
                    </div>
                  )}
                  {banInfo.details && (
                    <div className="space-y-1 mt-3">
                      <p className="text-xs font-semibold">Detalhes:</p>
                      <p className="text-sm">{banInfo.details}</p>
                    </div>
                  )}
                  {banInfo.bannedAt && (
                    <p className="text-xs mt-3 opacity-70">
                      Data do banimento: {new Date(banInfo.bannedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Se voce acredita que isso e um erro, entre em contato com o administrador da plataforma.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => setShowBannedDialog(false)} className="w-full rounded-xl soul-light">
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
          onCancel={handleProfileSetupCancel}
          isLoading={googleLoading}
        />
      )}
    </div>
  )
}
