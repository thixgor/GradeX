'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { OrdersPanel } from '@/components/shop/orders-panel'
import { Package as PackageIcon, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToastAlert } from '@/components/ui/toast-alert'
import { BanChecker } from '@/components/ban-checker'
import { AppShell } from '@/components/app-shell'
import { PlanLimitsCard } from '@/components/plan-limits-card'
import { CheckCircle, Clock, FileText, Download, Printer, ClipboardList, Trophy, BookOpen, Crown, Timer, Sparkles, Phone, Mail, XCircle, Ticket, AlertTriangle, ChevronDown, ChevronUp, Target, BarChart3, GraduationCap, ShoppingBag, Receipt, KeyRound, MapPin, Stethoscope, Pencil, Save, Loader2 } from 'lucide-react'
import { FocusSessionsProfile } from '@/components/focus-sessions-profile'
// PDF generator loaded dynamically to reduce initial bundle size (~200KB)
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountType } from '@/lib/types'
import { ActivationSuccessDialog } from '@/components/activation-success-dialog'
import { cn } from '@/lib/utils'
import { LiteModeSettingsCard } from '@/components/lite-mode-settings-card'
import { useUIPreferences } from '@/hooks/use-ui-preferences'
import { Heart, Music, MessageCircle } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { BRAZIL_STATES, formatStateLabel } from '@/lib/brazil-states'
import { MEDICAL_SPECIALTIES, RESIDENCY_AREAS } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState, OTHER_SCHOOL_OPTION } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState, OTHER_HOSPITAL_OPTION } from '@/lib/residency-hospitals-brazil'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { getMissingProfileFields } from '@/lib/profile-completeness'
import { formatCrmLabel, onlyCrmDigits } from '@/lib/crm'
import { ShieldCheck } from 'lucide-react'
import { PLUS_LABEL, isPlusAccount } from '@/lib/account-tier'

const PROFESSION_LABELS: Record<string, string> = {
  medico: 'Médico',
  academico: 'Acadêmico',
  residente: 'Residente',
}

type ProfileFormState = {
  name: string
  phone: string
  state: string
  profession: '' | 'medico' | 'academico' | 'residente'
  specialty: string
  crm: string
  crmUf: string
  residencySpecialty: string
  residencyHospital: string
  residencyYear: string
  afyaUnit: string
  periodo: string
  /** Só leitura: o CPF é definido no modal de completar perfil, com conferência
   *  na Receita Federal, e não pode ser reescrito aqui à mão. */
  cpf: string
  cpfVerified: boolean
}

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  phone: '',
  state: '',
  profession: '',
  specialty: '',
  crm: '',
  crmUf: '',
  residencySpecialty: '',
  residencyHospital: '',
  residencyYear: '',
  afyaUnit: '',
  periodo: '',
  cpf: '',
  cpfVerified: false,
}

interface UserSubmission {
  _id: string
  examId: string
  examName: string
  examTitle: string
  userId: string
  userName: string
  startedAt?: Date
  submittedAt: Date
  score?: number
  triScore?: number
  discursiveScore?: number
  correctionStatus?: 'pending' | 'corrected'
  corrections?: Array<{
    questionId: string
    score: number
    maxScore: number
    feedback: string
    method: string
  }>
  hasDiscursiveQuestions: boolean
  isPracticeExam?: boolean
  examEndTime?: Date
  answers?: any[]
  exam?: any
}

function calculateDuration(startTime: Date, endTime: Date): string {
  const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMins / 60)
  const minutes = diffMins % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profileTab, setProfileTab] = useState<'perfil' | 'pedidos'>(
    searchParams?.get('tab') === 'pedidos' ? 'pedidos' : 'perfil'
  )
  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null)
  const [questionsAnswered, setQuestionsAnswered] = useState(0)
  const [examsCompleted, setExamsCompleted] = useState(0)
  const [questionsAnsweredExams, setQuestionsAnsweredExams] = useState(0)
  const [questionsAnsweredBank, setQuestionsAnsweredBank] = useState(0)
  const [questionsCorrectBank, setQuestionsCorrectBank] = useState(0)
  const [questionsWrongBank, setQuestionsWrongBank] = useState(0)
  const [bankAccuracyRate, setBankAccuracyRate] = useState(0)
  const [userTotals, setUserTotals] = useState({
    totalCronogramasCreated: 0,
    totalFlashcardsCreated: 0,
    totalPersonalExamsCreated: 0,
  })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [serialKey, setSerialKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [activationSuccessOpen, setActivationSuccessOpen] = useState(false)
  const [activationDetails, setActivationDetails] = useState<any>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [hasRecurringSubscription, setHasRecurringSubscription] = useState(false)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(null)
  const [purchases, setPurchases] = useState<any[]>([])
  const [purchasesLoading, setPurchasesLoading] = useState(true)
  const [purchasesExpanded, setPurchasesExpanded] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [generatingReceipt, setGeneratingReceipt] = useState(false)
  const { showMusic, showSupport, toggle: toggleUIPref } = useUIPreferences()

  // ====== Dados de perfil (editáveis) ======
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileEmailVerified, setProfileEmailVerified] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [newEmailInput, setNewEmailInput] = useState('')
  const [emailPasswordInput, setEmailPasswordInput] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  useEffect(() => {
    loadSubmissions()
    loadUserData()
    loadStatistics()
    loadSubscriptionStatus()
    loadPurchases()
    loadProfileData()
  }, [])

  async function loadProfileData() {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        const p = data.profile || {}
        setProfileForm({
          name: p.name || '',
          phone: p.phone || '',
          state: p.state || '',
          profession: p.profession || '',
          specialty: p.specialty || '',
          crm: p.crm || '',
          crmUf: p.crmUf || '',
          residencySpecialty: p.residencySpecialty || '',
          residencyHospital: p.residencyHospital || '',
          residencyYear: p.residencyYear || '',
          afyaUnit: p.afyaUnit || '',
          periodo: p.periodo || '',
          cpf: p.cpf || '',
          cpfVerified: !!p.cpfVerified,
        })
        setProfileEmailVerified(!!p.emailVerified)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de perfil:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToastType(type)
    setToastMessage(message)
    setToastOpen(true)
  }

  async function handleSaveProfile() {
    if (profileForm.phone && !isValidBrazilPhone(profileForm.phone)) {
      showToast('Informe um telefone válido com DDD', 'error')
      return
    }
    setSavingProfile(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
          state: profileForm.state,
          profession: profileForm.profession,
          specialty: profileForm.specialty,
          crm: profileForm.crm,
          crmUf: profileForm.crmUf || profileForm.state,
          residencySpecialty: profileForm.residencySpecialty,
          residencyHospital: profileForm.residencyHospital,
          residencyYear: profileForm.residencyYear,
          afyaUnit: profileForm.afyaUnit,
          periodo: profileForm.periodo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados')
      showToast('Dados atualizados com sucesso!')
      setEditingProfile(false)
      if (profileForm.name) setUserName(profileForm.name)
      loadProfileData()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangeEmail() {
    if (!newEmailInput.trim() || !emailPasswordInput) {
      showToast('Preencha o novo e-mail e sua senha atual', 'error')
      return
    }
    setChangingEmail(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmailInput.trim(), currentPassword: emailPasswordInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar e-mail')
      showToast('E-mail alterado! Confira sua caixa de entrada para confirmar o novo endereço.')
      setChangeEmailOpen(false)
      setNewEmailInput('')
      setEmailPasswordInput('')
      loadUserData()
      loadProfileData()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setChangingEmail(false)
    }
  }

  const missingProfileFields = useMemo(
    () => getMissingProfileFields({
      phone: profileForm.phone || undefined,
      state: profileForm.state || undefined,
      profession: (profileForm.profession || undefined) as 'medico' | 'academico' | 'residente' | undefined,
      specialty: profileForm.specialty || undefined,
      crm: profileForm.crm || undefined,
      residencySpecialty: profileForm.residencySpecialty || undefined,
      residencyHospital: profileForm.residencyHospital || undefined,
      residencyYear: profileForm.residencyYear || undefined,
      afyaUnit: profileForm.afyaUnit || undefined,
      periodoBase: profileForm.periodo ? Number(profileForm.periodo) : undefined,
      // `cpf` aqui é a máscara vinda do servidor — só serve para saber se existe.
      cpf: profileForm.cpf || undefined,
    }),
    [profileForm]
  )

  async function loadSubmissions() {
    try {
      const res = await fetch('/api/user/submissions')
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Erro ao carregar submissoes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadUserData() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUserName(data.user?.name || 'Usuario')
        setUserRole(data.user?.role || 'user')
        setAccountType(data.user?.accountType || 'gratuito')
        setUserEmail(data.user?.email || '')
        setUserId(data.user?._id || data.user?.id || '')
        if (data.user?.trialExpiresAt) {
          setTrialExpiresAt(new Date(data.user.trialExpiresAt))
        }
        setUserTotals({
          totalCronogramasCreated: data.user?.totalCronogramasCreated || 0,
          totalFlashcardsCreated: data.user?.totalFlashcardsCreated || 0,
          totalPersonalExamsCreated: data.user?.totalPersonalExamsCreated || 0,
        })
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuario:', error)
    }
  }

  async function loadPurchases() {
    try {
      const res = await fetch('/api/materiais/purchases')
      if (res.ok) {
        const data = await res.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Erro ao carregar compras:', error)
    } finally {
      setPurchasesLoading(false)
    }
  }

  async function handleGenerateReceipt() {
    setGeneratingReceipt(true)
    try {
      const { generatePurchaseReceiptPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generatePurchaseReceiptPDF(purchases, {
        id: userId,
        name: userName,
        email: userEmail,
      })
      downloadPDF(blob, `Comprovante-DomineAqui-${new Date().toISOString().slice(0, 10)}.pdf`, {
        type: 'exam_pdf',
        resourceId: userId,
        resourceTitle: 'Comprovante de Compras',
      })
    } catch (error: any) {
      setToastMessage('Erro ao gerar comprovante: ' + error.message)
      setToastOpen(true)
    } finally {
      setGeneratingReceipt(false)
    }
  }

  async function loadStatistics() {
    try {
      const res = await fetch('/api/user/statistics')
      if (res.ok) {
        const data = await res.json()
        setQuestionsAnswered(data.questionsAnswered || 0)
        setExamsCompleted(data.examsCompleted || 0)
        setQuestionsAnsweredExams(data.questionsAnsweredExams || 0)
        setQuestionsAnsweredBank(data.questionsAnsweredBank || 0)
        setQuestionsCorrectBank(data.questionsCorrectBank || 0)
        setQuestionsWrongBank(data.questionsWrongBank || 0)
        setBankAccuracyRate(data.bankAccuracyRate || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    }
  }

  async function loadSubscriptionStatus() {
    try {
      const res = await fetch('/api/user/subscription-status')
      if (res.ok) {
        const data = await res.json()
        setHasRecurringSubscription(!!data.hasRecurringSubscription)
      }
    } catch {}
  }

  async function handleActivateKey() {
    if (!serialKey.trim()) {
      setToastMessage('Digite uma serial key valida')
      setToastOpen(true)
      return
    }
    setActivating(true)
    try {
      const res = await fetch('/api/serial-keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: serialKey.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao ativar serial key')
      setActivationDetails(data)
      setActivateDialogOpen(false)
      setSerialKey('')
      setActivationSuccessOpen(true)
      loadUserData()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastOpen(true)
    } finally {
      setActivating(false)
    }
  }

  async function handleCancelSubscription() {
    setCancelling(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao cancelar assinatura')
      setToastMessage(data.message)
      setToastOpen(true)
      setCancelDialogOpen(false)
      loadUserData()
    } catch (error: any) {
      setToastMessage(error.message)
      setToastOpen(true)
    } finally {
      setCancelling(false)
    }
  }

  function getTrialTimeRemaining(): string {
    if (!trialExpiresAt) return ''
    const now = new Date()
    const expiration = new Date(trialExpiresAt)
    const diffMs = expiration.getTime() - now.getTime()
    if (diffMs <= 0) return 'Expirado'
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (days > 0) return `${days}d ${hours}h ${minutes}min`
    if (hours > 0) return `${hours}h ${minutes}min`
    return `${minutes}min`
  }

  function getAccountBadge() {
    if (userRole === 'admin') {
      return { label: 'Admin', colors: 'from-purple-600 to-pink-600', icon: <Crown className="h-3.5 w-3.5" /> }
    }
    // Cargo único: 'plus' e os legados premium/essential usam o mesmo selo.
    if (isPlusAccount(accountType)) {
      return { label: PLUS_LABEL, colors: 'from-yellow-500 to-orange-500', icon: <Crown className="h-3.5 w-3.5" /> }
    }
    switch (accountType) {
      case 'trial':
        return { label: `Trial - ${getTrialTimeRemaining()}`, colors: 'from-blue-500 to-cyan-500', icon: <Timer className="h-3.5 w-3.5" /> }
      default:
        return { label: 'Gratuito', colors: 'from-gray-400 to-gray-500', icon: null }
    }
  }

  async function handleDownloadReport(submission: UserSubmission) {
    router.push(`/exam/${submission.examId}/user/${submission.userId}`)
  }

  async function handleDownloadAnswerSheet(examId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const { generateGabaritoPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateGabaritoPDF(data.exam)
      downloadPDF(blob, `Gabarito-${data.exam.title}.pdf`, { type: 'gabarito_pdf', resourceId: examId, resourceTitle: data.exam.title })
    } catch (error: any) {
      setToastMessage('Erro ao gerar gabarito: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadExamPDF(examId: string, userId: string) {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const data = await res.json()
      const { generateExamPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateExamPDF(data.exam, userId)
      downloadPDF(blob, `Prova-${data.exam.title}.pdf`, { type: 'exam_pdf', resourceId: examId, resourceTitle: data.exam.title })
    } catch (error: any) {
      setToastMessage('Erro ao gerar PDF da prova: ' + error.message)
      setToastOpen(true)
    }
  }

  async function handleDownloadAnswersPDF(submission: UserSubmission) {
    try {
      const res = await fetch(`/api/exams/${submission.examId}`)
      if (!res.ok) throw new Error('Erro ao buscar prova')
      const examData = await res.json()
      const submissionRes = await fetch(`/api/submissions/${submission._id}`)
      if (!submissionRes.ok) throw new Error('Erro ao buscar submissao')
      const submissionData = await submissionRes.json()
      const answers = submissionData.submission?.answers || []
      const { generateStudentAnswersPDF, downloadPDF } = await import('@/lib/pdf-generator')
      const blob = await generateStudentAnswersPDF(examData.exam, answers, submission.userName || userName)
      downloadPDF(blob, `Minhas-Respostas-${examData.exam.title}.pdf`, { type: 'student_answers_pdf', resourceId: submission.examId, resourceTitle: examData.exam.title })
    } catch (error: any) {
      setToastMessage('Erro ao gerar PDF de respostas: ' + error.message)
      setToastOpen(true)
    }
  }

  function isExamFinished(submission: UserSubmission): boolean {
    if (submission.isPracticeExam) return true
    if (!submission.examEndTime) return false
    return new Date() > new Date(submission.examEndTime)
  }

  const badge = getAccountBadge()

  return (
    <AppShell headerTitle="Meu Perfil" headerSubtitle={userName || 'Conta'}>
      <BanChecker />
      <div className="surface-page">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">

        {/* ====== Profile header ====== */}
        <section className="mb-5">
          <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm">
            <div
              className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
              style={{
                background:
                  'radial-gradient(ellipse at 100% 0%, rgba(70,129,82,0.14), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(226,164,62,0.1), transparent 50%)',
              }}
              aria-hidden
            />
            <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md font-heading text-2xl sm:text-3xl font-semibold">
                {(userName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="editorial-mark mb-1 justify-center sm:justify-start">Conta</p>
                <h1 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight truncate">
                  {userName || 'Carregando…'}
                </h1>
                {userEmail && (
                  <p className="mt-0.5 truncate text-xs sm:text-sm text-muted-foreground">{userEmail}</p>
                )}
                <div
                  className={cn(
                    'mt-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r',
                    badge.colors
                  )}
                >
                  {badge.icon}
                  {badge.label}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 shrink-0">
                {userRole !== 'admin' && accountType === 'gratuito' && (
                  <Button
                    size="sm"
                    onClick={() => setUpgradeDialogOpen(true)}
                    className="h-9 gap-1.5 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 text-xs font-bold"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Assinar Plus+
                  </Button>
                )}
                {userRole !== 'admin' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActivateDialogOpen(true)}
                    className="h-9 gap-1.5 rounded-md text-xs font-semibold"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Ativar key
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1 sm:w-fit scrollbar-hide">
          {([
            { id: 'perfil', label: 'Visão geral', icon: <UserIcon className="h-4 w-4" /> },
            { id: 'pedidos', label: 'Meus pedidos', icon: <PackageIcon className="h-4 w-4" /> },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setProfileTab(t.id)
                const url = t.id === 'pedidos' ? '/profile?tab=pedidos' : '/profile'
                window.history.replaceState(null, '', url)
              }}
              className={cn(
                'flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
                profileTab === t.id
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {profileTab === 'pedidos' && (
          <section className="mb-10">
            <OrdersPanel />
          </section>
        )}

        {profileTab === 'perfil' && (
        <>
        {/* ====== Meus Dados ====== */}
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="editorial-mark mb-0">Meus dados</h2>
            {!profileLoading && !editingProfile && (
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
          </div>

          {!profileLoading && missingProfileFields.length > 0 && !editingProfile && (
            <div className="mb-4 rounded-lg border border-amber-300/60 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1.5">
                Falta pouco pra completar seu perfil ✍️
              </p>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mb-2">
                Isso ajuda a gente a te dar uma experiência mais na sua cara: {missingProfileFields.map(f => f.label).join(', ')}.
              </p>
              <button
                type="button"
                onClick={() => setEditingProfile(true)}
                className="text-xs font-semibold text-amber-900 dark:text-amber-100 underline underline-offset-2"
              >
                Completar agora
              </button>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            {profileLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
            ) : !editingProfile ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="font-medium truncate">{userEmail}</p>
                    {!profileEmailVerified && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400">Não verificado</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setChangeEmailOpen(true)}
                      className="mt-0.5 block text-[11px] font-semibold text-primary hover:opacity-80"
                    >
                      Alterar e-mail
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="font-medium">{profileForm.phone || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <p className="font-medium">{profileForm.state ? formatStateLabel(profileForm.state) : <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Profissão</p>
                    <p className="font-medium">{profileForm.profession ? PROFESSION_LABELS[profileForm.profession] : <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">CPF</p>
                    <p className="font-medium flex items-center gap-1.5">
                      {profileForm.cpf || <span className="text-muted-foreground italic font-normal">Não informado</span>}
                      {profileForm.cpfVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          Verificado
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {profileForm.profession === 'medico' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Especialidade</p>
                        <p className="font-medium">{profileForm.specialty || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">CRM</p>
                        <p className="font-medium">{formatCrmLabel(profileForm.crm, profileForm.crmUf) || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                  </>
                )}

                {profileForm.profession === 'residente' && (
                  <>
                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Área da residência</p>
                        <p className="font-medium">{profileForm.residencySpecialty || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Ano</p>
                        <p className="font-medium">{profileForm.residencyYear || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 sm:col-span-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Hospital da residência</p>
                        <p className="font-medium">{profileForm.residencyHospital || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Stethoscope className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">CRM</p>
                        <p className="font-medium">{formatCrmLabel(profileForm.crm, profileForm.crmUf) || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                  </>
                )}

                {profileForm.profession === 'academico' && (
                  <>
                    <div className="flex items-start gap-2.5 sm:col-span-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Instituição</p>
                        <p className="font-medium">{profileForm.afyaUnit || <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Período</p>
                        <p className="font-medium">{profileForm.periodo ? formatPeriodoLabel(Number(profileForm.periodo)) : <span className="text-muted-foreground italic font-normal">Não informado</span>}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="profileName" className="text-xs font-medium text-muted-foreground">Nome</Label>
                    <Input
                      id="profileName"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="profilePhone" className="text-xs font-medium text-muted-foreground">Telefone (com DDD)</Label>
                    <Input
                      id="profilePhone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="(11) 91234-5678"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: formatBrazilPhone(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profileState" className="text-xs font-medium text-muted-foreground">Estado</Label>
                  <select
                    id="profileState"
                    className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value, afyaUnit: '', residencyHospital: '' })}
                  >
                    <option value="">Selecione seu estado...</option>
                    {BRAZIL_STATES.map((s) => (
                      <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Você é médico, acadêmico ou residente?</Label>
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
                        onClick={() =>
                          setProfileForm({
                            ...profileForm,
                            profession: opt.value,
                            specialty: opt.value === 'medico' ? profileForm.specialty : '',
                            residencySpecialty: opt.value === 'residente' ? profileForm.residencySpecialty : '',
                            residencyHospital: opt.value === 'residente' ? profileForm.residencyHospital : '',
                            residencyYear: opt.value === 'residente' ? profileForm.residencyYear : '',
                            afyaUnit: opt.value === 'academico' ? profileForm.afyaUnit : '',
                          })
                        }
                        className={cn(
                          'h-9 rounded-md text-sm font-semibold transition-all border',
                          profileForm.profession === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'text-muted-foreground border-border bg-muted/40 hover:bg-muted'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {profileForm.profession === 'medico' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Sua especialidade</Label>
                      <SearchableSelect
                        value={profileForm.specialty}
                        onChange={(v) => setProfileForm({ ...profileForm, specialty: v })}
                        options={MEDICAL_SPECIALTIES}
                        placeholder="Selecione sua especialidade..."
                        searchPlaceholder="Buscar especialidade..."
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                      />
                    </div>
                    <CrmInputs profileForm={profileForm} setProfileForm={setProfileForm} />
                  </>
                )}

                {profileForm.profession === 'residente' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Sua residência</Label>
                      <SearchableSelect
                        value={profileForm.residencySpecialty}
                        onChange={(v) => setProfileForm({ ...profileForm, residencySpecialty: v })}
                        options={RESIDENCY_AREAS}
                        placeholder="Selecione a área..."
                        searchPlaceholder="Buscar área da residência..."
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Hospital da residência {profileForm.state ? '' : '(selecione o estado primeiro)'}
                      </Label>
                      <SearchableSelect
                        value={profileForm.residencyHospital}
                        onChange={(v) => setProfileForm({ ...profileForm, residencyHospital: v })}
                        options={getResidencyHospitalsByState(profileForm.state)}
                        placeholder="Selecione o hospital..."
                        searchPlaceholder="Buscar hospital..."
                        customOption={OTHER_HOSPITAL_OPTION}
                        customPlaceholder="Digite o nome do hospital"
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                        disabled={!profileForm.state}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Ano de residência</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]"
                        value={profileForm.residencyYear}
                        onChange={(e) => setProfileForm({ ...profileForm, residencyYear: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {RESIDENCY_YEARS.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <CrmInputs profileForm={profileForm} setProfileForm={setProfileForm} />
                  </>
                )}

                {profileForm.profession === 'academico' && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Sua unidade {profileForm.state ? '' : '(selecione o estado primeiro)'}
                      </Label>
                      <SearchableSelect
                        value={profileForm.afyaUnit}
                        onChange={(v) => setProfileForm({ ...profileForm, afyaUnit: v })}
                        options={getMedicalSchoolsByState(profileForm.state)}
                        placeholder="Selecione sua instituição..."
                        searchPlaceholder="Buscar sua instituição..."
                        customOption={OTHER_SCHOOL_OPTION}
                        customPlaceholder="Digite o nome da sua instituição"
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm"
                        disabled={!profileForm.state}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Período (opcional)</Label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]"
                        value={profileForm.periodo}
                        onChange={(e) => setProfileForm({ ...profileForm, periodo: e.target.value })}
                      >
                        <option value="">Selecione seu período...</option>
                        {PERIODO_OPTIONS.map((p) => (
                          <option key={p} value={p}>{formatPeriodoLabel(p)}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="gap-1.5">
                    {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {savingProfile ? 'Salvando...' : 'Salvar alterações'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingProfile(false); loadProfileData() }} disabled={savingProfile}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-8">
          <h2 className="editorial-mark mb-3">Estatísticas</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: GraduationCap, label: 'Questões', value: questionsAnswered, tone: 'text-primary bg-primary/10 border-primary/20' },
              { icon: FileText, label: 'Provas', value: examsCompleted, tone: 'text-primary bg-primary/10 border-primary/20' },
              { icon: BookOpen, label: 'Banco', value: questionsAnsweredBank, tone: 'text-secondary bg-secondary/10 border-secondary/20' },
              { icon: BarChart3, label: 'Acerto', value: `${bankAccuracyRate}%`, tone: bankAccuracyRate >= 70 ? 'text-primary bg-primary/10 border-primary/20' : bankAccuracyRate >= 50 ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25' : 'text-red-600 bg-red-500/10 border-red-500/25' },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2.5">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-md border', tone)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                </div>
                <p className="font-heading text-2xl font-semibold tabular-nums text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {questionsAnsweredBank > 0 && (
          <section className="mb-8">
            <h2 className="editorial-mark mb-3">Desempenho no banco</h2>
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="font-heading text-2xl font-semibold text-primary tabular-nums">{questionsCorrectBank}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Acertos</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-2xl font-semibold text-red-500 tabular-nums">{questionsWrongBank}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Erros</p>
                </div>
                <div className="text-center">
                  <p className="font-heading text-2xl font-semibold text-foreground tabular-nums">{bankAccuracyRate}%</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Aproveitamento</p>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${bankAccuracyRate}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {!loading && (
          <section className="mb-8">
            <h2 className="editorial-mark mb-3">Limites do plano</h2>
            <PlanLimitsCard
              accountType={accountType}
              isAdmin={userRole === 'admin'}
              cronogramasCreated={userTotals.totalCronogramasCreated}
              flashcardsCreated={userTotals.totalFlashcardsCreated}
              personalExamsCreated={userTotals.totalPersonalExamsCreated}
              showUpgradeButton
            />
          </section>
        )}

        {/* ====== SECTION 5: Focus Sessions ====== */}
        <section className="mb-10">
          <h2 className="editorial-mark mb-3">Sessões de foco</h2>
          <FocusSessionsProfile />
        </section>

        {/* ====== SECTION 5b: Purchase History ====== */}
        {(purchasesLoading || purchases.length > 0) && (
          <section className="mb-10">
            {/* Header row — always visible, acts as toggle */}
            <button
              className="w-full flex items-center justify-between mb-0 group"
              onClick={() => setPurchasesExpanded(e => !e)}
            >
              <div className="flex items-center gap-2">
                <h2 className="editorial-mark mb-0">Histórico de compras</h2>
                {!purchasesLoading && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                    {purchases.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!purchasesLoading && purchases.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); handleGenerateReceipt() }}
                    disabled={generatingReceipt}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Receipt className="h-3 w-3" />
                    {generatingReceipt ? 'Gerando...' : 'Comprovante PDF'}
                  </button>
                )}
                {purchasesExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </button>

            {purchasesExpanded && (
              <div className="mt-4">
                {purchasesLoading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Carregando...</div>
                ) : (
                  <div className="rounded-2xl overflow-hidden border border-border/40 bg-card/50 backdrop-blur-sm">
                    {purchases.map((p, i) => (
                      <div
                        key={p._id}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3',
                          i !== purchases.length - 1 && 'border-b border-border/30'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {p.itemType === 'manual_clinico'
                            ? <BookOpen className="h-4 w-4 text-primary" />
                            : <ShoppingBag className="h-4 w-4 text-primary" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.itemTitle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(p.purchasedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {' · '}
                            <span className="capitalize">
                              {p.itemType === 'manual_clinico' ? 'Produto' : p.itemType === 'package' ? 'Pacote' : 'Material'}
                            </span>
                            {p.couponCode ? (
                              <>
                                {' · '}
                                <span>Cupom {p.couponCode}</span>
                              </>
                            ) : null}
                          </p>
                          {p.itemType === 'manual_clinico' && (p.planLabel || p.expiresAt || p.accessType) && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                              {p.planLabel ? <span className="font-bold text-emerald-700 dark:text-emerald-300">{p.planLabel}</span> : null}
                              {p.accessType === 'lifetime' || !p.expiresAt
                                ? ' · Vitalício (não expira)'
                                : (() => {
                                    const end = new Date(p.expiresAt).getTime()
                                    const ms = end - Date.now()
                                    const days = Math.ceil(ms / 86_400_000)
                                    const expStr = new Date(p.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                                    return days <= 0
                                      ? ` · Expirou em ${expStr}`
                                      : ` · ${days} ${days === 1 ? 'dia' : 'dias'} restantes · Expira ${expStr}`
                                  })()}
                            </p>
                          )}
                        </div>
                        {p.itemType === 'manual_clinico' && (
                          <Button size="sm" variant="outline" className="hidden sm:inline-flex h-8 text-xs" onClick={() => router.push('/manual-clinico')}>
                            Acessar Manual
                          </Button>
                        )}
                        <div className="text-right flex-shrink-0">
                          {p.price === 0 ? (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Grátis</span>
                          ) : (
                            <span className="text-sm font-bold">R$ {Number(p.price).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {purchases.length > 0 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-t border-border/30">
                        <span className="text-xs text-muted-foreground">{purchases.length} {purchases.length === 1 ? 'compra' : 'compras'}</span>
                        <span className="text-sm font-bold">
                          Total: R$ {purchases.reduce((s: number, p: any) => s + (p.price || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ====== SECTION 6: Submissions ====== */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Minhas Provas</h2>
            {submissions.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {submissions.length} {submissions.length === 1 ? 'prova' : 'provas'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">Carregando...</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-border bg-card shadow-sm">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground mb-4">Nenhuma prova realizada</p>
              <Button size="sm" variant="outline" onClick={() => router.push('/')}>
                Ver Provas Disponiveis
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((submission) => {
                const isExpanded = expandedSubmission === submission._id
                const isCorrected = submission.correctionStatus === 'corrected' || !submission.hasDiscursiveQuestions || !!submission.isPracticeExam
                const finished = isExamFinished(submission)

                return (
                  <div key={submission._id} className="rounded-xl border border-border/50 bg-card overflow-hidden transition-all duration-200">
                    {/* Summary row */}
                    <button
                      onClick={() => setExpandedSubmission(isExpanded ? null : submission._id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      {/* Status dot */}
                      <div className={cn('w-2 h-2 rounded-full shrink-0',
                        isCorrected ? 'bg-green-500' : 'bg-yellow-500'
                      )} />
                      {/* Title + date */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{submission.examTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(submission.submittedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                          {submission.startedAt && ` · ${calculateDuration(submission.startedAt, submission.submittedAt)}`}
                        </p>
                      </div>
                      {/* Score preview */}
                      {isCorrected && submission.triScore != null && (
                        <span className="text-sm font-bold tabular-nums shrink-0">{submission.triScore.toFixed(0)}</span>
                      )}
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3 animate-fade-in">
                        {/* Scores */}
                        {isCorrected ? (
                          <div className="flex gap-4 flex-wrap">
                            {submission.triScore != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nota TRI</p>
                                <p className="text-xl font-bold">{submission.triScore.toFixed(0)}</p>
                              </div>
                            )}
                            {submission.score != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pontuacao</p>
                                <p className="text-xl font-bold">{submission.score.toFixed(1)}</p>
                              </div>
                            )}
                            {submission.discursiveScore != null && (
                              <div>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Discursiva</p>
                                <p className="text-xl font-bold">{submission.discursiveScore.toFixed(1)}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/50 px-3 py-2 rounded-lg">
                            Aguardando correcao das questoes discursivas.
                          </p>
                        )}

                        {/* Discursive corrections */}
                        {submission.corrections && submission.corrections.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-muted-foreground">Correcoes Discursivas</p>
                            {submission.corrections.map((c, idx) => (
                              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded-lg text-xs">
                                <span>Questao {idx + 1}</span>
                                <span className="font-bold">
                                  {(c.score ?? 0).toFixed(1)} / {c.maxScore}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => handleDownloadExamPDF(submission.examId, submission.userId)}>
                            <Printer className="h-3 w-3 mr-1.5" />Prova PDF
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7"
                            onClick={() => handleDownloadAnswersPDF(submission)}>
                            <ClipboardList className="h-3 w-3 mr-1.5" />Respostas PDF
                          </Button>
                          {finished && (
                            <>
                              <Button size="sm" className="text-xs h-7"
                                onClick={() => handleDownloadReport(submission)}>
                                <FileText className="h-3 w-3 mr-1.5" />Relatorio
                              </Button>
                              <Button variant="outline" size="sm" className="text-xs h-7"
                                onClick={() => handleDownloadAnswerSheet(submission.examId)}>
                                <Download className="h-3 w-3 mr-1.5" />Gabarito
                              </Button>
                            </>
                          )}
                        </div>
                        {!finished && (
                          <p className="text-[11px] text-orange-600 dark:text-orange-400">
                            Prova em andamento. Gabarito e relatorio liberados apos o termino.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ====== SECTION 7: Preferences ====== */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Preferencias</h2>

          <h3 className="mb-3 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Desempenho
          </h3>
          <LiteModeSettingsCard />

          <h3 className="mt-6 mb-3 text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">
            Botões flutuantes
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Desative os botões flutuantes que você não usa para deixar a tela mais limpa.
          </p>
          <div className="rounded-lg border border-border bg-card shadow-sm divide-y divide-border">
            <PreferenceToggle
              icon={<Music className="h-4 w-4 text-primary" />}
              label="Player de Música"
              description="Player de música ambiente para estudo"
              checked={showMusic}
              onToggle={() => toggleUIPref('showMusic')}
            />
            <PreferenceToggle
              icon={<MessageCircle className="h-4 w-4 text-secondary" />}
              label="Botão de Suporte"
              description="Abre o chat de suporte / tickets"
              checked={showSupport}
              onToggle={() => toggleUIPref('showSupport')}
            />
          </div>
        </section>

        {/* ====== SECTION 8: Account Actions ====== */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Conta</h2>
          <div className="flex flex-wrap gap-2">
            {userRole !== 'admin' && hasRecurringSubscription && (
              <Button variant="outline" size="sm" className="text-xs h-8 text-red-600 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => setCancelDialogOpen(true)}>
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancelar Assinatura
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-8"
              onClick={() => router.push('/banco-questoes')}>
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Banco de Questoes
            </Button>
          </div>
        </section>
        </>
        )}

        {/* ====== DIALOGS ====== */}
        <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type={toastType} />

        {/* Upgrade Dialog */}
        <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">Assinar Plus+</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Entre em contato para ter acesso a recursos premium ilimitados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="text-sm font-semibold">(24) 99223-0908</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Mail className="h-4 w-4 text-green-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">E-mail</p>
                  <p className="text-sm font-semibold">throdrigf@gmail.com</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button
                onClick={() => {
                  const msg = encodeURIComponent(`Ola, eu sou ${userName} e quero fazer o upgrade do meu plano no DomineAqui!`)
                  window.open(`https://wa.me/5524992230908?text=${msg}`, '_blank')
                }}
                className="bg-green-600 hover:bg-green-700 text-white w-full"
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button onClick={() => setUpgradeDialogOpen(false)} variant="outline" className="w-full">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Serial Key Dialog */}
        <AnimatePresence>
          {activateDialogOpen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => !activating && setActivateDialogOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                className="relative z-10 w-full max-w-[400px] box-border overflow-hidden rounded-[26px] border p-6 sm:p-8"
                style={{
                  background: 'linear-gradient(160deg, rgba(9,20,14,0.97) 0%, rgba(6,15,10,0.98) 100%)',
                  borderColor: 'rgba(52,211,153,0.18)',
                  boxShadow: '0 30px 90px -20px rgba(16,185,129,0.35), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
                initial={{ opacity: 0, y: 30, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              >
                {/* Botão fechar */}
                <button
                  type="button"
                  onClick={() => !activating && setActivateDialogOpen(false)}
                  aria-label="Fechar"
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                >
                  <XCircle className="h-5 w-5" />
                </button>

                {/* Cabeçalho */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
                    <KeyRound className="h-8 w-8 text-white" strokeWidth={2} />
                  </div>
                  <h2 className="text-xl font-black text-white sm:text-2xl">Ativar Serial Key</h2>
                  <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-white/55">
                    Insira sua serial key para liberar seu produto ou plano na conta.
                  </p>
                </div>

                {/* Campo */}
                <div className="mt-6">
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-emerald-300/80">
                    Serial Key
                  </label>
                  <input
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                    value={serialKey}
                    onChange={(e) => setSerialKey(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter' && serialKey.trim() && !activating) handleActivateKey() }}
                    disabled={activating}
                    className="w-full box-border rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-center font-mono text-sm tracking-[0.15em] text-white placeholder:text-white/25 placeholder:tracking-normal outline-none transition-colors focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-60"
                  />
                </div>

                {/* Ações */}
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    onClick={handleActivateKey}
                    disabled={activating || !serialKey.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-[15px] font-extrabold text-[#04120a] shadow-lg shadow-emerald-500/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {activating ? (
                      <><span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04120a]/30 border-t-[#04120a]" /> Ativando...</>
                    ) : (
                      <>Ativar produto <KeyRound className="h-4 w-4" strokeWidth={2.5} /></>
                    )}
                  </button>
                  <button
                    onClick={() => setActivateDialogOpen(false)}
                    disabled={activating}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white/80 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Activation Success */}
        {activationDetails && (
          <ActivationSuccessDialog
            open={activationSuccessOpen}
            onOpenChange={setActivationSuccessOpen}
            details={activationDetails}
          />
        )}

        {/* Cancel Subscription Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center mb-3">
                <AlertTriangle className="h-7 w-7 text-white" />
              </div>
              <DialogTitle className="text-center text-xl">Cancelar Assinatura?</DialogTitle>
              <DialogDescription className="text-center text-sm">
                Tem certeza que deseja cancelar sua assinatura {isPlusAccount(accountType) ? PLUS_LABEL : 'Trial'}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-lg">
                Ao cancelar, sua assinatura no Mercado Pago será encerrada imediatamente, mas você mantém acesso Plus+ até o fim do período já pago. Após isso, sua conta voltará ao plano Gratuito automaticamente.
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <Phone className="h-4 w-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Fale comigo antes</p>
                  <p className="text-sm font-semibold">(24) 99223-0908</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2">
              <Button variant="outline" onClick={() => { setCancelDialogOpen(false); router.push('/tickets') }} className="w-full">
                <Ticket className="h-4 w-4 mr-2" />Abrir Ticket
              </Button>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full">Manter Assinatura</Button>
              <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling} className="w-full">
                {cancelling ? 'Cancelando...' : 'Sim, Cancelar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Email Dialog */}
        <Dialog open={changeEmailOpen} onOpenChange={(open) => { if (!changingEmail) { setChangeEmailOpen(open); if (!open) { setNewEmailInput(''); setEmailPasswordInput('') } } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Alterar e-mail</DialogTitle>
              <DialogDescription>
                Por segurança, confirme sua senha atual. Você receberá um link de confirmação no novo e-mail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="newEmail" className="text-xs font-medium text-muted-foreground">Novo e-mail</Label>
                <Input
                  id="newEmail"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  disabled={changingEmail}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentPasswordForEmail" className="text-xs font-medium text-muted-foreground">Senha atual</Label>
                <Input
                  id="currentPasswordForEmail"
                  type="password"
                  placeholder="••••••••"
                  value={emailPasswordInput}
                  onChange={(e) => setEmailPasswordInput(e.target.value)}
                  disabled={changingEmail}
                />
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setChangeEmailOpen(false)} disabled={changingEmail} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleChangeEmail} disabled={changingEmail} className="w-full sm:w-auto">
                {changingEmail ? 'Alterando...' : 'Alterar e-mail'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>
    </AppShell>
  )
}

function PreferenceToggle({
  icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon?: React.ReactNode
  label: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-green-600' : 'bg-muted-foreground/30'
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}

/**
 * CRM + UF. O mesmo par serve para médico e residente, e a UF cai no estado do
 * usuário por padrão — só quem migrou de estado precisa trocar.
 */
function CrmInputs({
  profileForm,
  setProfileForm,
}: {
  profileForm: ProfileFormState
  setProfileForm: (form: ProfileFormState) => void
}) {
  const controlClass =
    'flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]'

  return (
    <div className="grid grid-cols-[1fr_6rem] gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="profileCrm" className="text-xs font-medium text-muted-foreground">CRM</Label>
        <Input
          id="profileCrm"
          inputMode="numeric"
          placeholder="123456"
          value={profileForm.crm}
          onChange={(e) => setProfileForm({ ...profileForm, crm: onlyCrmDigits(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profileCrmUf" className="text-xs font-medium text-muted-foreground">UF</Label>
        <select
          id="profileCrmUf"
          className={controlClass}
          value={profileForm.crmUf || profileForm.state}
          onChange={(e) => setProfileForm({ ...profileForm, crmUf: e.target.value })}
        >
          <option value="">--</option>
          {BRAZIL_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>{s.uf}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
