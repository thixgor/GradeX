'use client'

import { AlertTriangle, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LimitWarningProps {
  current: number
  max: number | string
  itemName: string
}

export function LimitWarning({ current, max, itemName }: LimitWarningProps) {
  const router = useRouter()
  const maxNumber = typeof max === 'number' ? max : Infinity

  if (maxNumber === Infinity) {
    return null
  }

  const isNearLimit = current >= maxNumber - 1 && current < maxNumber
  const isAtLimit = current >= maxNumber

  return (
    <div className="mb-6">
      <Card className={`border-yellow-200 dark:border-yellow-800 bg-gradient-to-r ${
        isAtLimit ? 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30' :
        'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30'
      }`}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`} />
              <div>
                <p className={`font-semibold ${isAtLimit ? 'text-red-900 dark:text-red-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                  {itemName} criados: <span className={isAtLimit ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>{current}</span> / <span className="text-muted-foreground">{max}</span>
                </p>
                <p className={`text-sm ${isAtLimit ? 'text-red-800/80 dark:text-red-200/80' : 'text-yellow-800/80 dark:text-yellow-200/80'}`}>
                  {isAtLimit ? '🚫 Limite atingido! Faça upgrade para continuar criando.' :
                   isNearLimit ? '⚠️ Você está próximo do limite total!' :
                   `Continue criando ${itemName.toLowerCase()} para organizar seus estudos`
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/buy')}
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
