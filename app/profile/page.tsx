'use client'

/**
 * /profile — dividido em quatro seções, cada uma com um trabalho só:
 *
 *   Visão geral  → como eu estou agora (números, atalhos, limites, últimas provas)
 *   Desempenho   → o aprofundamento em gráficos + histórico completo de provas
 *   Pedidos      → produtos físicos com rastreio + compras digitais
 *   Configurações→ meus dados, comportamento do app e ações da conta
 *
 * A página só carrega dados e coordena os diálogos; cada seção mora no seu
 * próprio arquivo em `components/profile/`.
 */

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BarChart3,
  Crown,
  KeyRound,
  Package as PackageIcon,
  Phone,
  Settings,
  Sparkles,
  LifeBuoy,
  Target,
  Ticket,
  Timer,
  AlertTriangle,
  User as UserIcon,
  XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { BanChecker } from '@/components/ban-checker'
import { ActivationSuccessDialog } from '@/components/activation-success-dialog'
import { OrdersPanel } from '@/components/shop/orders-panel'
import { OverviewTab, type OverviewStats } from '@/components/profile/overview-tab'
import { PerformanceTab } from '@/components/profile/performance-tab'
import { PurchaseHistory } from '@/components/profile/purchase-history'
import { AtendimentoTab } from '@/components/profile/atendimento-tab'
import { SettingsTab } from '@/components/profile/settings-tab'
import type { UserSubmission } from '@/components/profile/submissions-list'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AccountType } from '@/lib/types'
import { PLUS_LABEL, QUEST_LABEL, ROTA_ASSINATURA, isPlusAccount, isQuestAccount } from '@/lib/account-tier'
import { cn } from '@/lib/utils'

type ProfileTab = 'visao-geral' | 'desempenho' | 'pedidos' | 'atendimento' | 'config'

const TABS = [
  { id: 'visao-geral', label: 'Visão geral', short: 'Visão', icon: UserIcon },
  { id: 'desempenho', label: 'Desempenho', short: 'Desemp.', icon: BarChart3 },
  { id: 'pedidos', label: 'Pedidos', short: 'Pedidos', icon: PackageIcon },
  // "Atendimento" reúne o que a pessoa PEDIU e espera resposta: solicitações de
  // desconto e tickets de suporte. As duas eram conversas com a mesma equipe
  // sem endereço fixo — o ticket só existia dentro do balão flutuante, e a
  // solicitação só aparecia na página do produto.
  { id: 'atendimento', label: 'Atendimento', short: 'Atend.', icon: LifeBuoy },
  { id: 'config', label: 'Configurações', short: 'Config.', icon: Settings },
] as const

/** Aceita também os valores antigos da URL (`?tab=pedidos`, `?tab=perfil`). */
function parseTab(value: string | null | undefined): ProfileTab {
  switch (value) {
    case 'pedidos':
      return 'pedidos'
    case 'desempenho':
      return 'desempenho'
    case 'atendimento':
    case 'solicitacoes':
    case 'tickets':
      return 'atendimento'
    case 'config':
    case 'configuracoes':
      return 'config'
    default:
      return 'visao-geral'
  }
}

const EMPTY_STATS: OverviewStats = {
  questionsAnswered: 0,
  examsCompleted: 0,
  questionsAnsweredBank: 0,
  bankAccuracyRate: 0,
  streakDays: 0,
  longestStreak: 0,
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<ProfileTab>(() => parseTab(searchParams?.get('tab')))

  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [stats, setStats] = useState<OverviewStats>(EMPTY_STATS)

  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null)
  const [userTotals, setUserTotals] = useState({
    totalCronogramasCreated: 0,
    totalFlashcardsCreated: 0,
    totalPersonalExamsCreated: 0,
  })
  const [hasRecurringSubscription, setHasRecurringSubscription] = useState(false)

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [serialKey, setSerialKey] = useState('')
  const [activating, setActivating] = useState(false)
  const [activationSuccessOpen, setActivationSuccessOpen] = useState(false)
  const [activationDetails, setActivationDetails] = useState<any>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadSubmissions()
    loadUserData()
    loadStatistics()
    loadSubscriptionStatus()
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastType(type)
    setToastMessage(message)
    setToastOpen(true)
  }, [])

  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast])

  function changeTab(next: ProfileTab) {
    setTab(next)
    const url = next === 'visao-geral' ? '/profile' : `/profile?tab=${next}`
    window.history.replaceState(null, '', url)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      setSubmissionsLoading(false)
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
        if (data.user?.trialExpiresAt) setTrialExpiresAt(new Date(data.user.trialExpiresAt))
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

  async function loadStatistics() {
    try {
      const res = await fetch('/api/user/statistics')
      if (res.ok) {
        const data = await res.json()
        setStats({
          questionsAnswered: data.questionsAnswered || 0,
          examsCompleted: data.examsCompleted || 0,
          questionsAnsweredBank: data.questionsAnsweredBank || 0,
          bankAccuracyRate: data.bankAccuracyRate || 0,
          streakDays: data.streakDays || 0,
          longestStreak: data.longestStreak || 0,
        })
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
      showError('Digite uma serial key válida')
      return
    }
    setActivating(true)
    try {
      const res = await fetch('/api/serial-keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: serialKey.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao ativar serial key')
      setActivationDetails(data)
      setActivateDialogOpen(false)
      setSerialKey('')
      setActivationSuccessOpen(true)
      loadUserData()
    } catch (error: any) {
      showError(error.message)
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
      showToast(data.message)
      setCancelDialogOpen(false)
      loadUserData()
    } catch (error: any) {
      showError(error.message)
    } finally {
      setCancelling(false)
    }
  }

  function getTrialTimeRemaining(): string {
    if (!trialExpiresAt) return ''
    const diffMs = new Date(trialExpiresAt).getTime() - Date.now()
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
    if (isQuestAccount(accountType)) {
      return {
        label: QUEST_LABEL,
        colors: 'from-emerald-500 to-teal-500',
        icon: <Target className="h-3.5 w-3.5" />,
      }
    }
    if (accountType === 'trial') {
      return {
        label: `Trial - ${getTrialTimeRemaining()}`,
        colors: 'from-blue-500 to-cyan-500',
        icon: <Timer className="h-3.5 w-3.5" />,
      }
    }
    return { label: 'Gratuito', colors: 'from-gray-400 to-gray-500', icon: null }
  }

  const badge = getAccountBadge()

  return (
    <AppShell headerTitle="Meu Perfil" headerSubtitle={userName || 'Conta'}>
      <BanChecker />
      <div className="surface-page">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {/* ====== Cabeçalho da conta ====== */}
          <section className="mb-5">
            <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div
                className="pointer-events-none absolute inset-0 opacity-40 dark:opacity-25"
                style={{
                  background:
                    'radial-gradient(ellipse at 100% 0%, rgba(70,129,82,0.14), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(226,164,62,0.1), transparent 50%)',
                }}
                aria-hidden
              />
              <div className="relative flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary font-heading text-2xl font-semibold text-primary-foreground shadow-md sm:h-20 sm:w-20 sm:text-3xl">
                  {(userName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="editorial-mark mb-1 justify-center sm:justify-start">Conta</p>
                  <h1 className="truncate font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                    {userName || 'Carregando…'}
                  </h1>
                  {userEmail && <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">{userEmail}</p>}
                  <div
                    className={cn(
                      'mt-2 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r px-2.5 py-1 text-xs font-semibold text-white',
                      badge.colors,
                    )}
                  >
                    {badge.icon}
                    {badge.label}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-center gap-2">
                  {/*
                    O botão leva à vitrine de planos, e não a um diálogo com
                    telefone e e-mail. Quem clica em "Assinar" já decidiu: o
                    que essa pessoa precisa é ver preço, o que entra em cada
                    plano e o botão de pagar — não uma instrução para mandar
                    mensagem no WhatsApp e esperar resposta.

                    Aparece para quem ainda não tem a plataforma inteira: além
                    do gratuito, o trial (que vence) e o Quest (que cobre só o
                    Banco de Questões).
                  */}
                  {userRole !== 'admin' && !isPlusAccount(accountType) && (
                    <Button
                      size="sm"
                      onClick={() => router.push(ROTA_ASSINATURA)}
                      className="h-9 gap-1.5 rounded-md bg-secondary text-xs font-bold text-secondary-foreground hover:bg-secondary/90"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isQuestAccount(accountType) ? `Migrar para ${PLUS_LABEL}` : `Assinar ${PLUS_LABEL}`}
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

          {/* ====== Navegação entre seções ====== */}
          <nav
            aria-label="Seções do perfil"
            className="scrollbar-hide mb-6 flex w-full gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1"
          >
            {TABS.map(({ id, label, short, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => changeTab(id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition-colors sm:px-4',
                  tab === id
                    ? 'border border-border bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </button>
            ))}
          </nav>

          {tab === 'visao-geral' && (
            <OverviewTab
              stats={stats}
              accountType={accountType}
              isAdmin={userRole === 'admin'}
              userTotals={userTotals}
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              onGoToPerformance={() => changeTab('desempenho')}
            />
          )}

          {tab === 'desempenho' && (
            <PerformanceTab
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              userName={userName}
              onError={showError}
            />
          )}

          {tab === 'pedidos' && (
            <div className="space-y-8">
              <section>
                <h2 className="editorial-mark mb-3">Pedidos da loja</h2>
                <OrdersPanel />
              </section>
              <section>
                <h2 className="editorial-mark mb-3">Compras digitais</h2>
                <PurchaseHistory userId={userId} userName={userName} userEmail={userEmail} onError={showError} />
              </section>
            </div>
          )}

          {tab === 'atendimento' && <AtendimentoTab />}

          {tab === 'config' && (
            <SettingsTab
              userEmail={userEmail}
              userRole={userRole}
              hasRecurringSubscription={hasRecurringSubscription}
              onNameChange={setUserName}
              onToast={showToast}
              onReloadUser={loadUserData}
              onActivateKey={() => setActivateDialogOpen(true)}
              onCancelSubscription={() => setCancelDialogOpen(true)}
            />
          )}

          {/* ====== DIÁLOGOS ====== */}
          <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type={toastType} />


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
                  className="relative z-10 box-border w-full max-w-[400px] overflow-hidden rounded-[26px] border p-6 sm:p-8"
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
                  <button
                    type="button"
                    onClick={() => !activating && setActivateDialogOpen(false)}
                    aria-label="Fechar"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
                      <KeyRound className="h-8 w-8 text-white" strokeWidth={2} />
                    </div>
                    <h2 className="text-xl font-black text-white sm:text-2xl">Ativar Serial Key</h2>
                    <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-white/55">
                      Insira sua serial key para liberar seu produto ou plano na conta.
                    </p>
                  </div>

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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && serialKey.trim() && !activating) handleActivateKey()
                      }}
                      disabled={activating}
                      className="box-border w-full rounded-xl border border-emerald-400/20 bg-black/30 px-4 py-3 text-center font-mono text-sm tracking-[0.15em] text-white outline-none transition-colors placeholder:tracking-normal placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20 disabled:opacity-60"
                    />
                  </div>

                  <div className="mt-6 flex flex-col gap-2.5">
                    <button
                      onClick={handleActivateKey}
                      disabled={activating || !serialKey.trim()}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-[15px] font-extrabold text-[#04120a] shadow-lg shadow-emerald-500/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {activating ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04120a]/30 border-t-[#04120a]" />{' '}
                          Ativando...
                        </>
                      ) : (
                        <>
                          Ativar produto <KeyRound className="h-4 w-4" strokeWidth={2.5} />
                        </>
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

          {activationDetails && (
            <ActivationSuccessDialog
              open={activationSuccessOpen}
              onOpenChange={setActivationSuccessOpen}
              details={activationDetails}
            />
          )}

          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 to-orange-500">
                  <AlertTriangle className="h-7 w-7 text-white" />
                </div>
                <DialogTitle className="text-center text-xl">Cancelar Assinatura?</DialogTitle>
                <DialogDescription className="text-center text-sm">
                  Tem certeza que deseja cancelar sua assinatura {isPlusAccount(accountType) ? PLUS_LABEL : 'Trial'}?
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  Ao cancelar, sua assinatura no Mercado Pago será encerrada imediatamente, mas você mantém acesso Plus+
                  até o fim do período já pago. Após isso, sua conta voltará ao plano Gratuito automaticamente.
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                  <Phone className="h-4 w-4 shrink-0 text-blue-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fale comigo antes</p>
                    <p className="text-sm font-semibold">(24) 99223-0908</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelDialogOpen(false)
                    router.push('/profile?tab=atendimento')
                  }}
                  className="w-full"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  Abrir Ticket
                </Button>
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full">
                  Manter Assinatura
                </Button>
                <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling} className="w-full">
                  {cancelling ? 'Cancelando...' : 'Sim, Cancelar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AppShell>
  )
}
