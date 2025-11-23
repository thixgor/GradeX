'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BanReason, BanReasonLabels } from '@/lib/types'
import { Ban } from 'lucide-react'

interface BanCheckerProps {
  checkInterval?: number // em milissegundos, padrão 10 segundos
}

export function BanChecker({ checkInterval = 10000 }: BanCheckerProps) {
  const router = useRouter()
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const [banInfo, setBanInfo] = useState<{
    reason?: BanReason
    details?: string
    bannedAt?: Date
  }>({})

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    async function checkBanStatus() {
      try {
        const res = await fetch('/api/auth/check-ban')
        const data = await res.json()

        if (data.banned) {
          // Usuário foi banido!
          setBanInfo({
            reason: data.banReason,
            details: data.banDetails,
            bannedAt: data.bannedAt
          })
          setShowBannedDialog(true)

          // Fazer logout
          await fetch('/api/auth/logout', { method: 'POST' })
        }
      } catch (error) {
        console.error('Error checking ban status:', error)
      }
    }

    // Verificar imediatamente ao montar
    checkBanStatus()

    // Depois verificar a cada intervalo
    intervalId = setInterval(checkBanStatus, checkInterval)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [checkInterval])

  function handleClose() {
    setShowBannedDialog(false)
    // Redirecionar para login
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <Dialog open={showBannedDialog} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
            <Ban className="h-8 w-8 text-red-600 dark:text-red-300" />
          </div>
          <DialogTitle className="text-center text-xl text-red-600 dark:text-red-400">
            Conta Banida
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
                Você será desconectado automaticamente. Se você acredita que isso é um erro, entre em contato com o administrador.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-4">
          <Button
            variant="destructive"
            onClick={handleClose}
            className="w-full"
          >
            Sair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
