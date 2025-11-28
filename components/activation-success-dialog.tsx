'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown, Timer, Check, Sparkles } from 'lucide-react'

interface ActivationSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  keyType: 'premium' | 'trial' | 'custom'
  trialExpiresAt?: Date
  customDuration?: {
    days?: number
    hours?: number
    minutes?: number
  }
}

export function ActivationSuccessDialog({
  open,
  onOpenChange,
  keyType,
  trialExpiresAt,
  customDuration,
}: ActivationSuccessDialogProps) {
  function getDurationText() {
    if (keyType === 'premium') {
      return 'Vitalício'
    }
    if (keyType === 'trial') {
      return '7 dias'
    }
    if (keyType === 'custom' && customDuration) {
      const parts = []
      if (customDuration.days) parts.push(`${customDuration.days} ${customDuration.days === 1 ? 'dia' : 'dias'}`)
      if (customDuration.hours) parts.push(`${customDuration.hours} ${customDuration.hours === 1 ? 'hora' : 'horas'}`)
      if (customDuration.minutes) parts.push(`${customDuration.minutes} ${customDuration.minutes === 1 ? 'minuto' : 'minutos'}`)
      return parts.join(', ')
    }
    return ''
  }

  function getIcon() {
    if (keyType === 'premium') {
      return <Crown className="h-16 w-16 text-yellow-500" />
    }
    return <Timer className="h-16 w-16 text-blue-500" />
  }

  function getTitle() {
    if (keyType === 'premium') {
      return 'Premium Ativado!'
    }
    if (keyType === 'custom') {
      return 'Plano Personalizado Ativado!'
    }
    return 'Trial Ativado!'
  }

  function getGradient() {
    if (keyType === 'premium') {
      return 'from-yellow-400 to-orange-500'
    }
    if (keyType === 'custom') {
      return 'from-purple-400 to-pink-500'
    }
    return 'from-blue-400 to-cyan-500'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center mb-4`}>
            {getIcon()}
          </div>
          <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Parabéns! Sua assinatura foi ativada com sucesso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={`p-6 bg-gradient-to-br ${getGradient()} bg-opacity-10 rounded-lg border-2 border-current`}>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Plano Ativado</p>
              <p className="text-3xl font-bold">
                {keyType === 'premium' ? 'Premium' : keyType === 'custom' ? 'Personalizado' : 'Trial'}
              </p>
              <div className="flex items-center justify-center gap-2 text-lg font-semibold mt-3">
                <Clock className="h-5 w-5" />
                {getDurationText()}
              </div>
              {trialExpiresAt && keyType !== 'premium' && (
                <div className="mt-4 pt-4 border-t border-current/20">
                  <p className="text-xs text-muted-foreground">Expira em:</p>
                  <p className="text-sm font-semibold mt-1">
                    {new Date(trialExpiresAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800 dark:text-green-200">
                Acesso liberado!
              </p>
              <p className="text-green-700 dark:text-green-300 mt-1">
                Você agora tem acesso a todos os recursos {keyType === 'premium' ? 'premium' : 'do plano'} da plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className={`bg-gradient-to-r ${getGradient()} hover:opacity-90`}
          >
            Começar a usar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
