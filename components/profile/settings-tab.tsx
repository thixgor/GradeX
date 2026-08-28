'use client'

/**
 * Aba "Configurações" — tudo que o usuário *muda*: os dados dele, como o app se
 * comporta no aparelho e as ações da conta. Antes isso estava espalhado no fim
 * de uma página de 1.700 linhas, embaixo do histórico de provas.
 */

import { useRouter } from 'next/navigation'
import { ArrowRight, BookOpen, KeyRound, MessageCircle, Music, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LiteModeSettingsCard } from '@/components/lite-mode-settings-card'
import { PersonalDataCard } from '@/components/profile/personal-data-card'
import { useUIPreferences } from '@/hooks/use-ui-preferences'
import { cn } from '@/lib/utils'

export function SettingsTab({
  userEmail,
  userRole,
  hasRecurringSubscription,
  cancelamentoAgendado,
  onNameChange,
  onToast,
  onReloadUser,
  onActivateKey,
  onCancelSubscription,
  onVerAssinatura,
}: {
  userEmail: string
  userRole: 'admin' | 'user'
  hasRecurringSubscription: boolean
  /** Já cancelada — o acesso corre até o fim do período pago. */
  cancelamentoAgendado: boolean
  onNameChange: (name: string) => void
  onToast: (message: string, type?: 'success' | 'error') => void
  onReloadUser: () => void
  onActivateKey: () => void
  onCancelSubscription: () => void
  /** Leva para o cartão "Sua assinatura", na Visão geral. */
  onVerAssinatura: () => void
}) {
  const router = useRouter()
  const { showMusic, showSupport, toggle } = useUIPreferences()

  return (
    <div className="space-y-8">
      <section>
        <PersonalDataCard
          userEmail={userEmail}
          onNameChange={onNameChange}
          onToast={onToast}
          onEmailChanged={onReloadUser}
        />
      </section>

      <section>
        <h2 className="editorial-mark mb-3">Desempenho do app</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Se o aparelho engasga com animações e efeitos, o Modo Lite deixa tudo mais leve.
        </p>
        <LiteModeSettingsCard />
      </section>

      <section>
        <h2 className="editorial-mark mb-3">Botões flutuantes</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Desative os botões flutuantes que você não usa para deixar a tela mais limpa.
        </p>
        <div className="divide-y divide-border rounded-lg border border-border bg-card shadow-sm">
          <PreferenceToggle
            icon={<Music className="h-4 w-4 text-primary" />}
            label="Player de música"
            description="Player de música ambiente para estudo"
            checked={showMusic}
            onToggle={() => toggle('showMusic')}
          />
          <PreferenceToggle
            icon={<MessageCircle className="h-4 w-4 text-secondary" />}
            label="Botão de suporte"
            description="Abre o chat de suporte / tickets"
            checked={showSupport}
            onToggle={() => toggle('showSupport')}
          />
        </div>
      </section>

      <section>
        <h2 className="editorial-mark mb-3">Conta</h2>
        <div className="flex flex-wrap gap-2">
          {userRole !== 'admin' && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onActivateKey}>
              <KeyRound className="mr-1.5 h-3.5 w-3.5" />
              Ativar serial key
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/banco-questoes')}>
            <BookOpen className="mr-1.5 h-3.5 w-3.5" />
            Banco de questões
          </Button>
          {/*
            O cancelamento continua aqui — é onde parte das pessoas procura —
            mas o endereço oficial passou a ser o cartão "Sua assinatura", na
            Visão geral, que é o único lugar que mostra valor, ciclo e próxima
            cobrança. E quando o cancelamento já foi feito o botão SOME: antes
            ele reaparecia idêntico depois de cancelar (o status no banco segue
            'authorized' de propósito, para o acesso durar até o fim do período
            pago), e a leitura natural era que o cancelamento não tinha pegado.
          */}
          {userRole !== 'admin' && hasRecurringSubscription && !cancelamentoAgendado && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-red-200 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
              onClick={onCancelSubscription}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Cancelar assinatura
            </Button>
          )}
        </div>

        {userRole !== 'admin' && hasRecurringSubscription && (
          <button
            type="button"
            onClick={onVerAssinatura}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            {cancelamentoAgendado
              ? 'Cancelamento agendado — ver até quando seu acesso vale'
              : 'Ver valor, ciclo e próxima cobrança da sua assinatura'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </section>
    </div>
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
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-green-600' : 'bg-muted-foreground/30',
        )}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )
}
