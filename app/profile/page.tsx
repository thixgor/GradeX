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

import dynamic from 'next/dynamic'
// O Modo Foco (jogos, respiração, sons) só baixa quando a aba abre.
const ModoFoco = dynamic(() => import('@/components/foco/modo-foco').then((m) => m.ModoFoco), { ssr: false })
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Crown,
  KeyRound,
  Phone,
  Sparkles,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { FundoIos } from '@/components/materiais/fundo-ios'
import { RitmoDoPerfil } from '@/components/profile/ritmo-do-perfil'
import { BanChecker } from '@/components/ban-checker'
import { ActivationSuccessDialog } from '@/components/activation-success-dialog'
import { OrdersPanel } from '@/components/shop/orders-panel'
import { OverviewTab, type ResumoDoPerfil } from '@/components/profile/overview-tab'
import { PerformanceTab } from '@/components/profile/performance-tab'
import { PurchaseHistory } from '@/components/profile/purchase-history'
import { AtendimentoTab } from '@/components/profile/atendimento-tab'
import { SettingsTab } from '@/components/profile/settings-tab'
import type { RecurringSubscription } from '@/components/profile/subscription-card'
import type { UserSubmission } from '@/components/profile/submissions-list'
import { Button } from '@/components/ui/button'
import '@/components/profile/perfil.css'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToastAlert } from '@/components/ui/toast-alert'
import { AccountType } from '@/lib/types'
import { PLUS_LABEL, ROTA_ASSINATURA, isPlusAccount, isQuestAccount, normalizeAccountType } from '@/lib/account-tier'
import { CartaoDeUpgrade } from '@/components/upgrade/cartao-de-upgrade'
import { precoAnunciado, useOfertaDeUpgrade } from '@/hooks/use-oferta-de-upgrade'
import { SeloDeCargo } from '@/components/cargo-badge'
import { cn } from '@/lib/utils'
import { Avatar as Retrato } from '@/components/monitorias/base'
import { escopoMonitorias } from '@/components/monitorias/fonte'
import { avatarPorId } from '@/lib/monitorias/avatares'
import { voltarValido } from '@/lib/monitorias/requisitos'
import type { CampoDoPerfil } from '@/components/profile/personal-data-card'

const CAMPOS: CampoDoPerfil[] = ['email', 'dados', 'cpf', 'fullName', 'dateOfBirth', 'foto', 'senha']

type ProfileTab = 'visao-geral' | 'foco' | 'desempenho' | 'pedidos' | 'atendimento' | 'config'

const TABS = [
  { id: 'visao-geral', label: 'Visão geral', short: 'Geral' },
  // O Modo Foco: métodos, ciclos, jogos de atenção e respiração. Também abre
  // pelo botão "Foco" do topo e por /foco.
  { id: 'foco', label: 'Foco', short: 'Foco' },
  { id: 'desempenho', label: 'Desempenho', short: 'Gráficos' },
  { id: 'pedidos', label: 'Pedidos', short: 'Pedidos' },
  // "Atendimento" reúne o que a pessoa PEDIU e espera resposta: solicitações de
  // desconto e tickets de suporte. As duas eram conversas com a mesma equipe
  // sem endereço fixo — o ticket só existia dentro do balão flutuante, e a
  // solicitação só aparecia na página do produto.
  { id: 'atendimento', label: 'Atendimento', short: 'Ajuda' },
  { id: 'config', label: 'Ajustes', short: 'Ajustes' },
] as const

/** Aceita também os valores antigos da URL (`?tab=pedidos`, `?tab=perfil`). */
function parseTab(value: string | null | undefined): ProfileTab {
  switch (value) {
    case 'pedidos':
      return 'pedidos'
    case 'desempenho':
      return 'desempenho'
    case 'foco':
      return 'foco'
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

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Link de pendência (`?campo=`) abre direto em Configurações, no campo certo.
  const [campo] = useState<CampoDoPerfil | null>(() => {
    const c = searchParams?.get('campo') as CampoDoPerfil | null
    return c && CAMPOS.includes(c) ? c : null
  })
  const [tab, setTab] = useState<ProfileTab>(() => (campo ? 'config' : parseTab(searchParams?.get('tab'))))
  // De onde a pessoa veio (só caminhos das Monitorias; nada de redirecionamento aberto).
  const [voltar] = useState<string | null>(() => {
    const v = searchParams?.get('voltar')
    return voltarValido(v) ? v : null
  })
  const [salvouAlgo, setSalvouAlgo] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)

  const [submissions, setSubmissions] = useState<UserSubmission[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(true)
  const [resumo, setResumo] = useState<ResumoDoPerfil | null>(null)

  const [userName, setUserName] = useState('')
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user')
  const [userEmail, setUserEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [accountType, setAccountType] = useState<AccountType>('gratuito')
  // Sem isto o convite para assinar piscava para quem já é Plus+ enquanto
  // `/api/auth/me` não respondia (o cargo nasce 'gratuito').
  const [contaCarregada, setContaCarregada] = useState(false)
  const [trialExpiresAt, setTrialExpiresAt] = useState<Date | null>(null)
  const [userTotals, setUserTotals] = useState({
    totalCronogramasCreated: 0,
    totalFlashcardsCreated: 0,
    totalPersonalExamsCreated: 0,
  })
  const [hasRecurringSubscription, setHasRecurringSubscription] = useState(false)
  /** Cobrança recorrente ativa — valor, ciclo, próxima cobrança, cancelamento. */
  const [recurring, setRecurring] = useState<RecurringSubscription | null>(null)
  /*
   * Compra recém-aprovada. O checkout redireciona para cá com
   * `?purchase=success` (pagamento único) ou `?subscription=success`
   * (assinatura) e, até agora, esta página lia apenas `?tab` — os dois
   * parâmetros caíam no vazio e quem acabava de pagar chegava numa Visão geral
   * comum, sem uma palavra de confirmação. Pior: o webhook às vezes ainda não
   * processou, então o selo do cargo ainda dizia "Gratuito" logo depois do
   * pagamento.
   */
  const [purchaseSuccess, setPurchaseSuccess] = useState<'plan' | 'subscription' | null>(null)

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

  /*
   * Confirmação de compra.
   *
   * A liberação do cargo depende do webhook do Mercado Pago, que pode chegar
   * depois do redirect. Por isso a tela não se contenta com a primeira leitura:
   * ela recarrega usuário e assinatura alguns segundos depois, para o selo
   * "Gratuito" não ficar contradizendo o pagamento que a pessoa acabou de
   * fazer. O parâmetro sai da URL para o aviso não voltar em cada refresh.
   */
  useEffect(() => {
    const tipo = searchParams?.get('subscription') === 'success'
      ? 'subscription'
      : searchParams?.get('purchase') === 'success'
        ? 'plan'
        : null
    if (!tipo) return

    setPurchaseSuccess(tipo)
    const recarregar = setTimeout(() => {
      loadUserData()
      loadSubscriptionStatus()
    }, 2500)

    const url = new URL(window.location.href)
    url.searchParams.delete('purchase')
    url.searchParams.delete('subscription')
    window.history.replaceState(null, '', url.pathname + url.search)

    return () => clearTimeout(recarregar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastType(type)
    setToastMessage(message)
    setToastOpen(true)
  }, [])

  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast])

  function changeTab(next: ProfileTab) {
    setTab(next)
    const params = new URLSearchParams()
    if (next !== 'visao-geral') params.set('tab', next)
    if (voltar) params.set('voltar', voltar)
    const qs = params.toString()
    window.history.replaceState(null, '', qs ? `/profile?${qs}` : '/profile')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** O retrato do cabeçalho leva à galeria, em Configurações. */
  function irParaFoto() {
    if (tab !== 'config') changeTab('config')
    setTimeout(() => {
      const el = document.getElementById('foto')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const botao = el?.querySelector('button')
      if (botao && botao.getAttribute('aria-expanded') === 'false') botao.click()
    }, tab === 'config' ? 0 : 350)
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
        setContaCarregada(true)
        setUserEmail(data.user?.email || '')
        setUserId(data.user?._id || data.user?.id || '')
        setAvatar(data.user?.avatar || null)
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
        if (data.resumo) setResumo(data.resumo)
      }
    } catch (error) {
      console.error('Erro ao carregar estatisticas:', error)
    }
  }

  async function loadSubscriptionStatus() {
    try {
      const res = await fetch('/api/user/subscription-status', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setHasRecurringSubscription(!!data.hasRecurringSubscription)
        setRecurring(data.recurring || null)
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
      // Sem isto o cartão continuaria mostrando "Ativa · renova sozinha": o
      // status no banco segue 'authorized' de propósito, e quem marca o
      // cancelamento é `cancelAtPeriodEnd`, que só chega numa nova leitura.
      loadSubscriptionStatus()
    } catch (error: any) {
      showError(error.message)
    } finally {
      setCancelling(false)
    }
  }

  /*
   * O convite para o Plus+: Quest+ vê o upgrade com desconto (/upgrade), quem
   * é gratuito ou trial vê os planos. Plus+, admin e cargos pagos criados no
   * painel não veem nada — oferecer o que a pessoa já paga é ruído.
   */
  const cargo = normalizeAccountType(accountType)
  const ehQuest = contaCarregada && userRole !== 'admin' && isQuestAccount(accountType)
  const convidarParaOPlus =
    contaCarregada && userRole !== 'admin' && (ehQuest || cargo === 'gratuito' || cargo === 'trial')
  const ofertaDeUpgrade = useOfertaDeUpgrade({ ativo: ehQuest })
  const upgradeNoAr = ehQuest && !!ofertaDeUpgrade?.elegivel
  // O percentual do botão é o total do plano anunciado: para o bolsista,
  // PROUNI/FIES + extra; para os outros, o desconto de upgrade.
  const planoDaOferta = upgradeNoAr
    ? ofertaDeUpgrade?.planos?.find((p) => p.tipo === ofertaDeUpgrade.planoPadrao) || ofertaDeUpgrade?.planos?.[0]
    : undefined
  const pctDoBotao = planoDaOferta
    ? Math.round(100 - (precoAnunciado(planoDaOferta).preco / planoDaOferta.preco) * 100)
    : ofertaDeUpgrade?.descontoPercentual

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

  return (
    <AppShell vidro headerTitle="Meu perfil" headerSubtitle={userName || 'Conta'}>
      <BanChecker />
      <FundoIos className={escopoMonitorias}>
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 sm:pt-8">
          {voltar && (
            <div
              className={cn(
                'ios-vidro sticky top-[4.5rem] z-20 mb-4 flex items-center justify-between gap-3 rounded-[18px] p-2.5 pl-4',
                salvouAlgo && '!bg-[var(--ios-tinta-suave)]',
              )}
            >
              <p className="min-w-0 text-sm">
                {salvouAlgo ? 'Salvo. Pode voltar e continuar de onde parou.' : 'Você veio das Monitorias. Complete aqui e volte.'}
              </p>
              <a href={voltar} className={cn('ios-botao-p shrink-0', salvouAlgo ? 'ios-botao' : 'ios-botao-cinza')}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </a>
            </div>
          )}

          {/* ====== Cabeçalho da conta ======
              Sem cartão em volta: no iOS a identidade é o título da tela. O
              retrato abre a galeria em Ajustes; abaixo, o ritmo de estudo —
              a primeira coisa que alguém quer ver quando abre o próprio perfil. */}
          <header className="perfil-cabeca">
            <button
              type="button"
              onClick={irParaFoto}
              className="group relative shrink-0 rounded-[32%]"
              aria-label={avatar ? 'Trocar foto do perfil' : 'Escolher foto do perfil'}
            >
              <Retrato nome={userName || '?'} url={avatarPorId(avatar)?.url || null} tamanho={84} />
              <span className="perfil-trocar-foto">{avatar ? 'Trocar' : 'Foto'}</span>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="ios-titulo-grande truncate">
                {userName || <span className="ios-esqueleto inline-block h-9 w-48 rounded-lg align-middle" />}
              </h1>
              {userEmail && <p className="mt-0.5 truncate text-[15px] ios-rotulo-2">{userEmail}</p>}
              {/*
                O selo vem do registro de cargos (`/admin/cargos`). A versão
                anterior era um `switch` com um ramo por cargo, e quem
                assinasse um cargo que ele não conhecesse via "Gratuito"
                logo depois de pagar.
              */}
              <SeloDeCargo
                className="mt-2"
                accountType={accountType}
                ehAdmin={userRole === 'admin'}
                sufixo={accountType === 'trial' ? getTrialTimeRemaining() : undefined}
              />
            </div>
            <div className="perfil-acoes">
              {/*
                O botão leva à vitrine de planos: quem clica em "Assinar" já
                decidiu e precisa ver preço e o botão de pagar. Aparece para
                quem ainda não tem a plataforma inteira (gratuito, trial e Quest).
              */}
              {contaCarregada && userRole !== 'admin' && !isPlusAccount(accountType) && (
                <Link
                  href={upgradeNoAr ? '/upgrade' : ROTA_ASSINATURA}
                  className="buy-cta buy-cta-halo inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-[15px] font-extrabold text-secondary-foreground"
                >
                  {upgradeNoAr ? <Sparkles className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
                  {upgradeNoAr
                    ? `Upgrade −${pctDoBotao}%`
                    : isQuestAccount(accountType)
                      ? `Migrar para ${PLUS_LABEL}`
                      : `Assinar ${PLUS_LABEL}`}
                </Link>
              )}
              {userRole !== 'admin' && (
                <button type="button" onClick={() => setActivateDialogOpen(true)} className="ios-botao-cinza">
                  <KeyRound className="h-4 w-4" />
                  Ativar key
                </button>
              )}
            </div>
          </header>

          <RitmoDoPerfil resumo={resumo} onAbrirDesempenho={() => changeTab('desempenho')} />

          {purchaseSuccess && (
            <AvisoDeCompraAprovada
              tipo={purchaseSuccess}
              onFechar={() => setPurchaseSuccess(null)}
            />
          )}

          {/* ====== Navegação entre seções ======
              Controle segmentado do sistema, cinco partes iguais, sem rolagem
              lateral: "Ajustes" fica sempre à vista no celular. Gruda sob o
              cabeçalho para trocar de seção sem voltar ao topo. */}
          <nav aria-label="Seções do perfil" className="perfil-navegacao">
            <div
              className="ios-segmentado"
              role="tablist"
              style={{ ['--segmentos' as string]: TABS.length, ['--indice' as string]: TABS.findIndex(t => t.id === tab) }}
            >
              {TABS.map(({ id, label, short }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => changeTab(id)}
                  className="ios-segmento !px-1 !text-[13px] sm:!text-[14px]"
                >
                  <span className="hidden truncate sm:inline">{label}</span>
                  <span className="truncate sm:hidden">{short}</span>
                </button>
              ))}
            </div>
          </nav>

          {tab === 'visao-geral' && convidarParaOPlus && (
            <CartaoDeUpgrade
              oferta={ehQuest ? ofertaDeUpgrade : null}
              quest={ehQuest}
              sufixoDoTeste={
                cargo === 'trial' && trialExpiresAt && trialExpiresAt.getTime() > Date.now()
                  ? getTrialTimeRemaining()
                  : undefined
              }
              className="mb-6"
            />
          )}

          {tab === 'visao-geral' && (
            <OverviewTab
              resumo={resumo}
              accountType={accountType}
              isAdmin={userRole === 'admin'}
              userTotals={userTotals}
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              onGoToPerformance={() => changeTab('desempenho')}
              recurring={userRole === 'admin' ? null : recurring}
              onCancelSubscription={() => setCancelDialogOpen(true)}
              cancellingSubscription={cancelling}
            />
          )}

          {tab === 'foco' && (
            <div className="ck-mundo ck-escopo">
              <ModoFoco />
            </div>
          )}

          {tab === 'desempenho' && (
            <PerformanceTab
              submissions={submissions}
              submissionsLoading={submissionsLoading}
              userName={userName}
              accountType={accountType}
              isAdmin={userRole === 'admin'}
              onError={showError}
            />
          )}

          {tab === 'pedidos' && (
            <div className="space-y-9">
              <section>
                <h2 className="ios-titulo-secao mb-3">Pedidos da loja</h2>
                <OrdersPanel />
              </section>
              <section>
                <h2 className="ios-titulo-secao mb-3">Compras digitais</h2>
                <PurchaseHistory userId={userId} userName={userName} userEmail={userEmail} onError={showError} />
              </section>
            </div>
          )}

          {tab === 'atendimento' && <AtendimentoTab />}

          {tab === 'config' && (
            <SettingsTab
              userEmail={userEmail}
              campo={campo}
              onAvatarChange={setAvatar}
              onSalvo={() => setSalvouAlgo(true)}
              userRole={userRole}
              hasRecurringSubscription={hasRecurringSubscription}
              cancelamentoAgendado={!!recurring?.cancelAtPeriodEnd}
              onVerAssinatura={() => changeTab('visao-geral')}
              onNameChange={setUserName}
              onToast={showToast}
              onReloadUser={loadUserData}
              onActivateKey={() => setActivateDialogOpen(true)}
              onCancelSubscription={() => setCancelDialogOpen(true)}
            />
          )}

          {/* ====== DIÁLOGOS ====== */}
          <ToastAlert open={toastOpen} onOpenChange={setToastOpen} message={toastMessage} type={toastType} />


          <Dialog open={activateDialogOpen} onOpenChange={(open) => !activating && setActivateDialogOpen(open)}>
            <DialogContent className={cn('sm:max-w-md', escopoMonitorias)}>
              <DialogHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <KeyRound className="h-6 w-6" />
                </div>
                <DialogTitle className="font-heading text-xl">Ativar serial key</DialogTitle>
                <DialogDescription>Digite a key que você recebeu para liberar o produto ou plano na sua conta.</DialogDescription>
              </DialogHeader>
              <form
                className="space-y-4 pt-1"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (serialKey.trim() && !activating) handleActivateKey()
                }}
              >
                <label htmlFor="serial-key" className="sr-only">Serial key</label>
                <input
                  id="serial-key"
                  type="text"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                  value={serialKey}
                  onChange={(e) => setSerialKey(e.target.value.toUpperCase())}
                  disabled={activating}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-sm tracking-[0.12em] outline-none transition placeholder:tracking-normal placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                />
                <DialogFooter className="flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="ghost" className="w-full rounded-xl sm:w-auto" onClick={() => setActivateDialogOpen(false)} disabled={activating}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="w-full gap-1.5 rounded-xl sm:w-auto" disabled={activating || !serialKey.trim()}>
                    {activating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <KeyRound className="h-4 w-4" />}
                    {activating ? 'Ativando' : 'Ativar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

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
                  {recurring?.currentPeriodEndsAt
                    ? ` até ${new Date(recurring.currentPeriodEndsAt).toLocaleDateString('pt-BR')}`
                    : ' até o fim do período já pago'}
                  . Após isso, sua conta voltará ao plano Gratuito automaticamente.
                </p>
              </div>
              {/*
                A ordem importa. Antes, "Fale comigo antes" com telefone e o
                botão "Abrir Ticket" vinham ANTES de qualquer ação — duas telas
                de fricção na frente da coisa que a pessoa veio fazer, e em
                contradição direta com o FAQ de /buy, que promete cancelamento
                "sem multa e sem ligar para ninguém". A oferta de ajuda continua
                (ver o rodapé abaixo), mas depois da decisão, não como pedágio.
              */}
              <DialogFooter className="flex-col gap-2">
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)} className="w-full">
                  Manter assinatura
                </Button>
                <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelling} className="w-full">
                  {cancelling ? 'Cancelando...' : 'Sim, cancelar'}
                </Button>
              </DialogFooter>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Prefere resolver conversando?</span>
                <a href="tel:+5524992230908" className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:underline">
                  <Phone className="h-3.5 w-3.5 text-blue-600" />
                  (24) 99223-0908
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setCancelDialogOpen(false)
                    changeTab('atendimento')
                  }}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  Abrir ticket
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FundoIos>
    </AppShell>
  )
}

/**
 * O aviso que a pessoa deveria ter visto ao voltar do pagamento.
 *
 * O checkout já mandava para cá com `?purchase=success` / `?subscription=success`,
 * mas quem sabia ler esses parâmetros era /buy — página que ninguém visita
 * depois de pagar. Na prática o cliente pagava e caía numa Visão geral idêntica
 * à de sempre: sem confirmação, sem recibo, sem boas-vindas.
 *
 * O texto evita prometer liberação instantânea porque ela depende do webhook:
 * diz o que é certo (o pagamento foi aprovado) e o que fazer se o acesso
 * demorar alguns instantes para aparecer.
 */
function AvisoDeCompraAprovada({
  tipo,
  onFechar,
}: {
  tipo: 'plan' | 'subscription'
  onFechar: () => void
}) {
  return (
    <div
      role="status"
      className="ios-cartao mb-6 flex items-start gap-3 rounded-[22px] p-4 sm:p-5"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 ios-tinta" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-semibold tracking-tight">
          {tipo === 'subscription' ? 'Assinatura confirmada!' : 'Pagamento aprovado!'}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {tipo === 'subscription'
            ? 'Sua assinatura está ativa e aparece logo abaixo, com o valor e a data da próxima cobrança. Você pode cancelar por ali quando quiser.'
            : 'Seu acesso está sendo liberado. Se o selo da conta ainda mostrar o plano antigo, atualize a página em alguns instantes — a confirmação do Mercado Pago leva alguns segundos.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onFechar}
        aria-label="Fechar aviso"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
