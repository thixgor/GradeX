'use client'

import { Crown, Lock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { AccountType } from '@/lib/types'
import { getTierLimits } from '@/lib/tier-limits'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { isPlusAccount } from '@/lib/account-tier'

interface LimitItem {
  label: string
  current: number | string
  max: number | string
  isLimited: boolean
  isNearLimit?: boolean
  isAtLimit?: boolean
}

interface PlanLimitsCardProps {
  accountType?: AccountType
  isAdmin?: boolean
  cronogramasCreated?: number
  flashcardsCreated?: number
  personalExamsCreated?: number
  showUpgradeButton?: boolean
  compact?: boolean
  className?: string
}

export function PlanLimitsCard({
  accountType = 'gratuito',
  isAdmin = false,
  cronogramasCreated = 0,
  flashcardsCreated = 0,
  personalExamsCreated = 0,
  showUpgradeButton = true,
  compact = false,
  className = '',
}: PlanLimitsCardProps) {
  const router = useRouter()
  const limits = isAdmin ? getTierLimits(undefined, true) : getTierLimits(accountType)
  
  const limitsList: LimitItem[] = [
    {
      label: 'Cronogramas',
      current: cronogramasCreated,
      max: limits.cronogramasTotal,
      isLimited: accountType === 'gratuito',
      isNearLimit: limits.cronogramasTotal !== Infinity && cronogramasCreated >= limits.cronogramasTotal - 1,
      isAtLimit: limits.cronogramasTotal !== Infinity && cronogramasCreated >= limits.cronogramasTotal,
    },
    {
      label: 'Flashcards',
      current: flashcardsCreated,
      max: limits.flashcardsTotal,
      isLimited: accountType === 'gratuito',
      isNearLimit: limits.flashcardsTotal !== Infinity && flashcardsCreated >= limits.flashcardsTotal - 1,
      isAtLimit: limits.flashcardsTotal !== Infinity && flashcardsCreated >= limits.flashcardsTotal,
    },
    {
      label: 'Provas Pessoais',
      current: personalExamsCreated,
      max: limits.personalExamsTotal,
      isLimited: accountType === 'gratuito',
      isNearLimit: limits.personalExamsTotal !== Infinity && personalExamsCreated >= limits.personalExamsTotal - 1,
      isAtLimit: limits.personalExamsTotal !== Infinity && personalExamsCreated >= limits.personalExamsTotal,
    },
  ]

  if (compact) {
    return (
      <div className={cn('rounded-xl border bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={cn('h-4 w-4', isPlusAccount(accountType, isAdmin) ? 'text-yellow-500' : 'text-gray-400')} />
            <span className="font-semibold text-sm capitalize">{isAdmin ? 'Admin' : accountType}</span>
          </div>
          {accountType === 'gratuito' && !isAdmin && (
            <span className="text-xs text-muted-foreground">
              {cronogramasCreated}/{limits.cronogramasTotal} • {flashcardsCreated}/{limits.flashcardsTotal}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      <div className={cn(
        'p-4 border-b',
        isAdmin ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
        isPlusAccount(accountType) ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' :
        accountType === 'trial' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' :
        'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Crown className="h-5 w-5" />
            ) : (
              <Crown className={cn('h-5 w-5', accountType === 'gratuito' && 'opacity-50')} />
            )}
            <span className="font-bold capitalize">
              {isAdmin ? 'Admin' : accountType === 'gratuito' ? 'Plano Gratuito' : accountType === 'trial' ? 'Plano Trial' : 'Plano Plus+'}
            </span>
          </div>
          {accountType === 'gratuito' && !isAdmin && showUpgradeButton && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => router.push('/buy')}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {limitsList.map((item, index) => {
          const percentage = typeof item.max === 'number' && item.max > 0
            ? Math.round((Number(item.current) / item.max) * 100)
            : 0

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.isAtLimit && item.isLimited && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  {item.isNearLimit && !item.isAtLimit && item.isLimited && (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
                <span className={cn(
                  'font-semibold',
                  item.isAtLimit && item.isLimited ? 'text-red-500' :
                  item.isNearLimit && item.isLimited ? 'text-yellow-600' :
                  'text-foreground'
                )}>
                  {item.current} / {typeof item.max === 'number' ? item.max : '∞'}
                </span>
              </div>

              {typeof item.max === 'number' && item.max !== Infinity && (
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      percentage >= 100 ? 'bg-red-500' :
                      percentage >= 80 ? 'bg-yellow-500' :
                      percentage >= 50 ? 'bg-blue-500' :
                      'bg-green-500'
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              )}

              {item.isAtLimit && item.isLimited && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                  <XCircle className="h-3 w-3 flex-shrink-0" />
                  <span>Limite atingido! Faça upgrade para continuar criando.</span>
                </div>
              )}

              {item.isNearLimit && !item.isAtLimit && item.isLimited && (
                <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  <span>Atenção: Você está próximo do limite ({item.max} total).</span>
                </div>
              )}
            </div>
          )
        })}

        {accountType === 'gratuito' && !isAdmin && showUpgradeButton && (
          <div className="pt-3 border-t">
            <Button
              onClick={() => router.push('/buy')}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Fazer Assinar Plus+
            </Button>
          </div>
        )}

        {isPlusAccount(accountType) && !isAdmin && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">Acesso ilimitado a todos os recursos!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
