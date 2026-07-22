'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { trackMeta } from '@/lib/meta-pixel'
import {
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Brain,
  Database,
  BookMarked,
  Zap,
  ChevronRight,
  Mail,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { BanReasonLabels, BanReason } from '@/lib/types'
import { Ban, AlertCircle } from 'lucide-react'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { BRAZIL_STATES } from '@/lib/brazil-states'
import { MEDICAL_SPECIALTIES } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState } from '@/lib/residency-hospitals-brazil'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { GoogleProfileSetupDialog } from '@/components/google-profile-setup-dialog'
import { clearBootstrapCache } from '@/hooks/use-bootstrap'

declare global {
  interface Window {
    google?: any
    grecaptcha?: any
  }
}

const GLASS_CARD =
  'auth-glass-card rounded-2xl border border-border bg-card shadow-sm'

// Só permite redirecionamentos internos (evita open-redirect via ?redirect=).
// Sem um "?redirect=" explícito, o destino padrão é direto o dashboard — ir
// para "/" faria essa rota re-renderizar a landing page (e seu loading.tsx)
// por um instante antes do redirect server-side para o dashboard, causando
// um flash visível da landing (com o rodapé) logo após o login.
function safeInternalPath(target: string | null | undefined): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/dashboard'
  return target
}

const highlights = [
  { icon: Database, text: '1.000+ questões por curso e período' },
  { icon: Brain, text: 'Flashcards Anki com repetição espaçada IA' },
  { icon: BookMarked, text: 'Resumos grátis e premium de todas as disciplinas' },
  { icon: Zap, text: 'Provas reais + simulados com correção automática' },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeInternalPath(searchParams.get('redirect'))
  const initialMode = searchParams.get('mode')
  const shouldReduceMotion = useReducedMotion()

  const [isLogin, setIsLogin] = useState(initialMode !== 'register')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [showBlockedModal, setShowBlockedModal] = useState(false)
  const [blockedMessage, setBlockedMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleStatus, setGoogleStatus] = useState<'loading' | 'ready' | 'error'>('loading')
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
    dateOfBirth: '',
    profession: '' as '' | 'medico' | 'academico' | 'residente',
    state: '',
    phone: '',
    specialty: '',
    residencySpecialty: '',
    residencyHospital: '',
    residencyYear: '',
    isAfyaMedicineStudent: false,
    afyaUnit: '',
    periodo: '',
    role: 'user',
  })

  const [isRegistered, setIsRegistered] = useState(false)

  // Verificação de código por email (2FA de administrador)
  const [emailCodeRequired, setEmailCodeRequired] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const [loginCode, setLoginCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const canBeAdmin = ['throdrigf@gmail.com', 'ecocardio93@gmail.com'].includes(
    formData.email.toLowerCase().trim()
  )

  // Se o usuário já está autenticado, não faz sentido mostrar o formulário de
  // login. Isso acontece quando ele aperta "Voltar" no navegador depois de
  // logar (página restaurada do bfcache, com o form "deslogado" congelado) ou
  // navega para /auth/login com a sessão ainda válida. Verificamos a sessão no
  // mount e a cada `pageshow` (que dispara na restauração do bfcache) e, se
  // autenticado, mandamos direto para o destino em vez do formulário.
  useEffect(() => {
    let cancelled = false

    const checkSessionAndRedirect = () => {
      fetch('/api/auth/me', { cache: 'no-store' })
        .then((r) => {
          if (!cancelled && r.ok) {
            window.location.replace(redirectTo)
          }
        })
        .catch(() => {})
    }

    checkSessionAndRedirect()

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        checkSessionAndRedirect()
      }
    }
    window.addEventListener('pageshow', handlePageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [redirectTo])

  useEffect(() => {
    const loadRecaptchaScript = () => {
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`
      script.async = true
      script.defer = true
      script.onload = () => {
        if (window.grecaptcha) {
          window.grecaptcha.ready(() => {})
        }
      }
      document.head.appendChild(script)
      return () => {
        try { document.head.removeChild(script) } catch {}
      }
    }

    const loadGoogleScript = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      // Sem client id configurado, o GIS não renderiza nada (área branca).
      // Sinaliza erro para exibir fallback em vez de espaço vazio.
      if (!clientId) {
        setGoogleStatus('error')
        return () => {}
      }

      setGoogleStatus('loading')
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        try {
          if (window.google) {
            window.google.accounts.id.initialize({
              client_id: clientId,
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
            setGoogleStatus('ready')
          } else {
            setGoogleStatus('error')
          }
        } catch {
          setGoogleStatus('error')
        }
      }
      script.onerror = () => setGoogleStatus('error')
      document.head.appendChild(script)
      return () => {
        try { document.head.removeChild(script) } catch {}
      }
    }

    const cleanupRecaptcha = loadRecaptchaScript()
    const cleanupGoogle = loadGoogleScript()
    return () => {
      cleanupRecaptcha?.()
      cleanupGoogle?.()
    }
  }, [isLogin])

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

      if (!isLogin) {
        if (!formData.name || !formData.email || !formData.password || !formData.dateOfBirth) {
          setError('Nome, email, senha e data de nascimento sao obrigatorios')
          setLoading(false)
          return
        }
        if (!formData.profession) {
          setError('Selecione se você é médico, acadêmico ou residente')
          setLoading(false)
          return
        }
        if (!formData.state) {
          setError('Selecione seu estado')
          setLoading(false)
          return
        }
        if (!isValidBrazilPhone(formData.phone)) {
          setError('Informe um telefone válido com DDD')
          setLoading(false)
          return
        }
        if (formData.profession === 'medico' && !formData.specialty) {
          setError('Selecione sua especialidade')
          setLoading(false)
          return
        }
        if (
          formData.profession === 'residente' &&
          (!formData.residencySpecialty || !formData.residencyHospital || !formData.residencyYear)
        ) {
          setError('Preencha os dados da sua residência')
          setLoading(false)
          return
        }
        if (formData.profession === 'academico' && !formData.afyaUnit) {
          setError('Selecione sua unidade')
          setLoading(false)
          return
        }
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email: formData.email, password: formData.password, recaptchaToken: token }
        : { ...formData, recaptchaToken: token }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Erro ao autenticar')
      }

      if (!isLogin) {
        // Conversão de topo do funil: conta grátis criada (o "teste grátis"
        // prometido no anúncio). É o evento que o algoritmo do Meta usa para
        // aprender a encontrar quem se cadastra.
        trackMeta('CompleteRegistration', { content_name: 'Cadastro gratuito' })
        setIsRegistered(true)
      } else if (data.requiresEmailCode) {
        // Conta de administrador: exige código enviado por email antes de entrar.
        setPendingEmail(data.email || formData.email)
        setEmailCodeRequired(true)
        setLoginCode('')
        setResendCooldown(60)
      } else {
        clearBootstrapCache()
        // Navegação completa (não router.push + refresh): o cookie de auth já
        // foi setado, então o destino renderiza do zero no servidor. Evita a
        // tela branca que o push+refresh causava no mobile.
        window.location.assign(redirectTo)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cooldown do botão de reenvio
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (loginCode.trim().length < 6) {
      setError('Digite o código de 6 dígitos enviado ao seu email.')
      return
    }
    setCodeLoading(true)
    try {
      const res = await fetch('/api/auth/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: loginCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'banned') {
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
          setShowBannedDialog(true)
          return
        }
        throw new Error(data.error || 'Código inválido')
      }
      clearBootstrapCache()
      window.location.assign(redirectTo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCodeLoading(false)
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0) return
    setError('')
    try {
      const res = await fetch('/api/auth/login/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Não foi possível reenviar o código')
      setResendCooldown(60)
    } catch (err: any) {
      setError(err.message)
    }
  }

  function cancelEmailCode() {
    setEmailCodeRequired(false)
    setLoginCode('')
    setPendingEmail('')
    setError('')
  }

  async function handleGoogleLogin(response: any) {
    setError('')

    if (!response?.credential) {
      setError('Não foi possível obter as credenciais do Google. Tente novamente.')
      return
    }

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
          setBanInfo({ reason: data.banReason, details: data.banDetails, bannedAt: data.bannedAt })
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

      clearBootstrapCache()
      window.location.assign(redirectTo)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleProfileSetupComplete(setupData: {
    profileName: string
    dateOfBirth: string
    profession: 'medico' | 'academico' | 'residente'
    state: string
    phone: string
    specialty?: string
    residencySpecialty?: string
    residencyHospital?: string
    residencyYear?: string
    isAfyaMedicineStudent: boolean
    afyaUnit?: string
    periodo?: string
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
          profession: setupData.profession,
          state: setupData.state,
          phone: setupData.phone,
          specialty: setupData.specialty,
          residencySpecialty: setupData.residencySpecialty,
          residencyHospital: setupData.residencyHospital,
          residencyYear: setupData.residencyYear,
          isAfyaMedicineStudent: setupData.isAfyaMedicineStudent,
          afyaUnit: setupData.afyaUnit,
          periodo: setupData.periodo,
          picture: googleData.picture,
          googleId: googleData.googleId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao criar perfil')
      setShowProfileSetup(false)
      clearBootstrapCache()
      window.location.assign(redirectTo)
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

  // Editorial inputs — light/dark via tokens
  const inputCls =
    'h-11 rounded-lg text-foreground placeholder:text-muted-foreground bg-card border border-border focus:border-primary/45 focus:ring-2 focus:ring-primary/15 focus:bg-background transition-colors'

  const selectCls =
    'flex h-11 w-full rounded-lg px-3 py-2 text-sm text-foreground bg-card border border-border focus:border-primary/45 focus:outline-none focus:ring-2 focus:ring-primary/15 transition-colors'

  return (
    <div className="min-h-screen surface-page text-foreground overflow-x-hidden relative">
      {/* Soft brand wash — no forced navy */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60 dark:opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(70,129,82,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(206,89,41,0.08), transparent 50%)',
        }}
        aria-hidden
      />

      {/* Top chrome */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm hover:bg-muted hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </button>
        <ThemeToggle />
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 min-h-screen flex">

        {/* ── LEFT PANEL — desktop only ── */}
        <motion.div
          initial={shouldReduceMotion ? {} : { opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex flex-col justify-center px-14 xl:px-20 w-[520px] xl:w-[580px] flex-shrink-0"
        >
          {/* Logo wordmark */}
          <div className="mb-10">
            <Logo variant="full" size="lg" />
          </div>

          {/* 3D Logo */}
          <div className="mb-10 flex items-start">
            <motion.div
              animate={shouldReduceMotion ? {} : {
                y: [0, -12, 0],
                rotateY: [0, 14, 0, -14, 0],
                rotateX: [0, -5, 0, 5, 0],
                scale: [1, 1.04, 1],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ perspective: 900, transformStyle: 'preserve-3d' }}
            >
              <div className="relative flex items-center justify-center">
                <motion.div
                  animate={shouldReduceMotion ? {} : { opacity: [0.35, 0.75, 0.35], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute rounded-full blur-3xl"
                  style={{
                    width: 160, height: 160,
                    background: 'radial-gradient(ellipse, rgba(74,222,128,0.50) 0%, rgba(45,212,191,0.25) 55%, transparent 75%)',
                  }}
                />
                <Image
                  src="/logo3d.png"
                  alt="DomineAqui"
                  width={200}
                  height={200}
                  priority
                  sizes="160px"
                  className="relative object-contain"
                  style={{
                    width: 160, height: 160,
                    filter: 'drop-shadow(0 0 20px rgba(74,222,128,0.80)) drop-shadow(0 0 50px rgba(45,212,191,0.40))',
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Headline */}
          <h2 className="mb-4 font-heading text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            <span className="text-foreground">Estude mais</span>
            <br />
            <span className="text-primary">inteligente.</span>
          </h2>

          <p className="text-muted-foreground text-base mb-10 leading-relaxed max-w-sm">
            Plataforma completa de estudo para alunos de saúde: questões, flashcards, resumos e muito mais.
          </p>

          {/* Feature bullets */}
          <ul className="space-y-3 mb-12">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span
                  className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.20)' }}
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {/* Social proof pill */}
          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-primary"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.20)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Acesso gratuito para começar
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT PANEL — form ── */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 min-h-screen">
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full max-w-md ${GLASS_CARD} flex flex-col`}
            style={{ maxHeight: 'calc(100vh - 40px)' }}
          >

            {/* ── Mobile: logo block ── */}
            <div className="lg:hidden pt-8 pb-2 flex flex-col items-center gap-5">
              <Logo variant="full" size="md" />
              <motion.div
                animate={shouldReduceMotion ? {} : {
                  y: [0, -10, 0],
                  rotateY: [0, 12, 0, -12, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ perspective: 800, transformStyle: 'preserve-3d' }}
              >
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={shouldReduceMotion ? {} : { opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute rounded-full blur-2xl"
                    style={{
                      width: 120, height: 120,
                      background: 'radial-gradient(ellipse, rgba(74,222,128,0.55) 0%, rgba(45,212,191,0.28) 55%, transparent 75%)',
                    }}
                  />
                  <Image
                    src="/logo3d.png"
                    alt="DomineAqui"
                    width={160}
                    height={160}
                    priority
                    sizes="120px"
                    className="relative object-contain"
                    style={{
                      width: 120, height: 120,
                      filter: 'drop-shadow(0 0 18px rgba(74,222,128,0.80)) drop-shadow(0 0 40px rgba(45,212,191,0.40))',
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* ── Header ── */}
            <div className="px-7 pt-6 pb-2 flex-shrink-0 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? 'login' : 'register'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    {isLogin ? 'Entrar na plataforma' : 'Criar sua conta'}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isLogin
                      ? 'Bem-vindo de volta, continue de onde parou'
                      : 'Grátis para começar, sem cartão de crédito'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Content ── */}
            {emailCodeRequired ? (
              <form onSubmit={handleVerifyCode} className="p-7 space-y-5">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(45,212,191,0.12)', border: '1px solid rgba(45,212,191,0.25)' }}
                  >
                    <Mail className="h-8 w-8 text-teal-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">Verificação de administrador</h3>
                    <p className="text-sm text-muted-foreground">
                      Enviamos um código de 6 dígitos para<br />
                      <span className="font-semibold text-foreground/90">{pendingEmail}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loginCode" className="text-xs font-medium text-muted-foreground">
                    Código de verificação
                  </Label>
                  <Input
                    id="loginCode"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    className={`${inputCls} text-center text-2xl tracking-[0.5em] font-mono`}
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 text-center p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={codeLoading}
                  className="w-full h-11 rounded-xl font-semibold text-sm text-secondary-foreground flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                  style={{ background: 'hsl(var(--secondary))' }}
                >
                  {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {codeLoading ? 'Verificando...' : 'Confirmar e entrar'}
                </button>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={cancelEmailCode}
                    className="text-foreground0 hover:text-muted-foreground transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className="text-foreground0 hover:text-primary transition-colors disabled:opacity-50 disabled:hover:text-foreground0"
                  >
                    {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código'}
                  </button>
                </div>
              </form>
            ) : isRegistered ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-7 space-y-5 flex flex-col items-center"
              >
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}
                >
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Conta criada com sucesso!</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link de confirmação para:<br />
                    <span className="font-semibold text-foreground/90">{formData.email}</span>
                  </p>
                </div>
                <div
                  className="p-3 rounded-xl w-full"
                  style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.18)' }}
                >
                  <p className="text-xs text-center text-amber-300">
                    <strong>Atenção:</strong> Confirme seu e-mail para ter acesso completo à plataforma.
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <button
                    onClick={() => router.push('/')}
                    className="w-full h-11 rounded-xl font-semibold text-sm text-secondary-foreground flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01]"
                    style={{ background: 'hsl(var(--secondary))' }}
                  >
                    Ir para o Início
                  </button>
                  <button
                    onClick={() => setIsLogin(true)}
                    className="w-full h-11 rounded-xl text-sm font-medium text-muted-foreground border border-border bg-card hover:bg-muted transition-all"
                  >
                    Fazer Login Agora
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 overflow-y-auto flex-1 px-7 py-5">

                  {/* Name — register only */}
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
                        <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nome Completo</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="João Silva"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required={!isLogin}
                          className={inputCls}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className={inputCls}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Senha</Label>
                      {isLogin && (
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs text-foreground0 hover:text-primary transition-colors"
                          tabIndex={-1}
                        >
                          Esqueceu a senha?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground0 hover:text-muted-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Register extra fields */}
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
                          <Label htmlFor="dateOfBirth" className="text-xs font-medium text-muted-foreground">Data de Nascimento *</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            required
                            className={inputCls}
                          />
                        </div>

                        <div
                          className="space-y-3 p-4 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                          <p className="text-sm font-medium text-muted-foreground">
                            Você é médico, acadêmico ou residente? *
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                { value: 'medico', label: 'Médico' },
                                { value: 'academico', label: 'Acadêmico' },
                                { value: 'residente', label: 'Residente' },
                              ] as const
                            ).map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                className={`h-9 rounded-xl text-sm font-semibold transition-all ${
                                  formData.profession === opt.value
                                    ? 'text-secondary-foreground'
                                    : 'text-muted-foreground border border-border bg-muted/40 hover:bg-muted'
                                }`}
                                style={
                                  formData.profession === opt.value
                                    ? { background: 'hsl(var(--secondary))' }
                                    : {}
                                }
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    profession: opt.value,
                                    isAfyaMedicineStudent: opt.value === 'academico',
                                    afyaUnit: opt.value === 'academico' ? formData.afyaUnit : '',
                                    specialty: opt.value === 'medico' ? formData.specialty : '',
                                    residencySpecialty: opt.value === 'residente' ? formData.residencySpecialty : '',
                                    residencyHospital: opt.value === 'residente' ? formData.residencyHospital : '',
                                    residencyYear: opt.value === 'residente' ? formData.residencyYear : '',
                                  })
                                }
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-xs font-medium text-muted-foreground">Estado *</Label>
                          <select
                            id="state"
                            className={selectCls}
                            value={formData.state}
                            onChange={(e) =>
                              setFormData({ ...formData, state: e.target.value, afyaUnit: '', residencyHospital: '' })
                            }
                            required
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="">Selecione seu estado...</option>
                            {BRAZIL_STATES.map((s) => (
                              <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Telefone (com DDD) *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            inputMode="numeric"
                            placeholder="(11) 91234-5678"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: formatBrazilPhone(e.target.value) })}
                            required
                            className={inputCls}
                          />
                        </div>

                        {formData.profession === 'medico' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <Label htmlFor="specialty" className="text-xs font-medium text-muted-foreground">Qual sua especialidade? *</Label>
                            <SearchableSelect
                              id="specialty"
                              value={formData.specialty}
                              onChange={(value) => setFormData({ ...formData, specialty: value })}
                              options={MEDICAL_SPECIALTIES}
                              placeholder="Selecione sua especialidade..."
                              searchPlaceholder="Buscar especialidade..."
                              className={selectCls}
                            />
                          </motion.div>
                        )}

                        {formData.profession === 'residente' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="residencySpecialty" className="text-xs font-medium text-muted-foreground">Qual sua residência? *</Label>
                              <SearchableSelect
                                id="residencySpecialty"
                                value={formData.residencySpecialty}
                                onChange={(value) => setFormData({ ...formData, residencySpecialty: value })}
                                options={MEDICAL_SPECIALTIES}
                                placeholder="Selecione a área da residência..."
                                searchPlaceholder="Buscar área da residência..."
                                className={selectCls}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="residencyHospital" className="text-xs font-medium text-muted-foreground">
                                Hospital da residência {formData.state ? '*' : '(selecione o estado primeiro)'}
                              </Label>
                              <SearchableSelect
                                id="residencyHospital"
                                value={formData.residencyHospital}
                                onChange={(value) => setFormData({ ...formData, residencyHospital: value })}
                                options={getResidencyHospitalsByState(formData.state)}
                                placeholder="Selecione o hospital..."
                                searchPlaceholder="Buscar hospital..."
                                className={selectCls}
                                disabled={!formData.state}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="residencyYear" className="text-xs font-medium text-muted-foreground">Qual ano de residência? *</Label>
                              <select
                                id="residencyYear"
                                className={selectCls}
                                value={formData.residencyYear}
                                onChange={(e) => setFormData({ ...formData, residencyYear: e.target.value })}
                                style={{ colorScheme: 'dark' }}
                              >
                                <option value="">Selecione...</option>
                                {RESIDENCY_YEARS.map((year) => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>
                          </motion.div>
                        )}

                        {formData.profession === 'academico' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="afyaUnit" className="text-xs font-medium text-muted-foreground">
                                Sua Unidade {formData.state ? '*' : '(selecione o estado primeiro)'}
                              </Label>
                              <SearchableSelect
                                id="afyaUnit"
                                value={formData.afyaUnit}
                                onChange={(value) => setFormData({ ...formData, afyaUnit: value })}
                                options={getMedicalSchoolsByState(formData.state)}
                                placeholder="Selecione sua instituição..."
                                searchPlaceholder="Buscar sua instituição..."
                                className={selectCls}
                                disabled={!formData.state}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="periodo" className="text-xs font-medium text-muted-foreground">Período (opcional)</Label>
                              <select
                                id="periodo"
                                className={selectCls}
                                value={formData.periodo}
                                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                                style={{ colorScheme: 'dark' }}
                              >
                                <option value="">Selecione seu período...</option>
                                {PERIODO_OPTIONS.map((periodo) => (
                                  <option key={periodo} value={periodo}>{formatPeriodoLabel(periodo)}</option>
                                ))}
                              </select>
                            </div>
                          </motion.div>
                        )}

                        {canBeAdmin && (
                          <div className="space-y-2">
                            <Label htmlFor="role" className="text-xs font-medium text-muted-foreground">Tipo de Conta</Label>
                            <select
                              id="role"
                              className={selectCls}
                              value={formData.role}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              style={{ colorScheme: 'dark' }}
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 text-center p-3 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
                    >
                      {error}
                    </motion.div>
                  )}
                </div>

                {/* ── Footer actions ── */}
                <div className="px-7 pb-7 pt-2 flex-shrink-0 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl font-semibold text-sm text-secondary-foreground flex items-center justify-center gap-2 transition-all hover:opacity-90 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                    style={{ background: 'hsl(var(--secondary))' }}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
                  </button>

                  {isLogin && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="px-3 text-muted-foreground" style={{ backgroundColor: 'transparent' }}>
                            ou continue com
                          </span>
                        </div>
                      </div>
                      <div className="min-h-[44px] flex flex-col justify-center items-center gap-2">
                        {/* GIS injeta o botão aqui — div sem filhos do React
                            para o Google ter controle total do DOM. */}
                        <div id="google-signin-button" className="flex justify-center" />
                        {googleStatus === 'loading' && (
                          <Loader2 className="h-4 w-4 animate-spin text-foreground0" />
                        )}
                        {googleStatus === 'error' && (
                          <p className="text-xs text-center text-foreground0">
                            Login com Google indisponível no momento. Use seu e-mail e senha acima.
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    className="w-full text-sm text-foreground0 hover:text-primary transition-colors py-1"
                    onClick={() => { setIsLogin(!isLogin); setError('') }}
                  >
                    {isLogin
                      ? 'Não tem uma conta? Criar conta grátis'
                      : 'Já tem uma conta? Entrar'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Modal: Cadastro Bloqueado ── */}
      <Dialog open={showBlockedModal} onOpenChange={setShowBlockedModal}>
        <DialogContent
          className="max-w-md border-none"
          style={{
            background: 'rgba(4,8,22,0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24,
            color: '#f1f5f9',
          }}
        >
          <DialogHeader>
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl text-red-400">Cadastro Bloqueado</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.10)' }}
                >
                  <p className="text-sm text-muted-foreground">{blockedMessage}</p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowBlockedModal(false)}
              className="w-full h-10 rounded-xl text-sm text-muted-foreground border border-border bg-card hover:bg-muted transition-all"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Usuário Banido ── */}
      <Dialog open={showBannedDialog} onOpenChange={setShowBannedDialog}>
        <DialogContent
          className="max-w-md border-none"
          style={{
            background: 'rgba(4,8,22,0.95)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 24,
            color: '#f1f5f9',
          }}
        >
          <DialogHeader>
            <div
              className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)' }}
            >
              <Ban className="h-8 w-8 text-red-400" />
            </div>
            <DialogTitle className="text-center text-xl text-red-400">Acesso Negado</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.10)' }}
                >
                  <p className="text-sm font-medium mb-2 text-foreground/90">Sua conta foi banida da plataforma.</p>
                  {banInfo.reason && (
                    <div className="space-y-1 mt-2">
                      <p className="text-xs font-semibold text-muted-foreground">Motivo:</p>
                      <p className="text-sm text-muted-foreground">{BanReasonLabels[banInfo.reason]}</p>
                    </div>
                  )}
                  {banInfo.details && (
                    <div className="space-y-1 mt-3">
                      <p className="text-xs font-semibold text-muted-foreground">Detalhes:</p>
                      <p className="text-sm text-muted-foreground">{banInfo.details}</p>
                    </div>
                  )}
                  {banInfo.bannedAt && (
                    <p className="text-xs mt-3 text-foreground0">
                      Data: {new Date(banInfo.bannedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-foreground0 text-center">
                  Se acredita que é um erro, entre em contato com o administrador.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setShowBannedDialog(false)}
              className="w-full h-10 rounded-xl text-sm text-muted-foreground border border-border bg-card hover:bg-muted transition-all"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Google Profile Setup ── */}
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
