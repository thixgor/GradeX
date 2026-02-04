'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BanReason, BanReasonLabels } from '@/lib/types'
import { Ban } from 'lucide-react'
import { useBootstrapBanStatus, clearBootstrapCache } from '@/hooks/use-bootstrap'

/**
 * BanChecker Component - Optimized Version
 *
 * Previous implementation:
 * - Made 2 separate fetch calls every 60 seconds (/api/auth/me + /api/auth/check-ban)
 * - ~2.9M invocations/day per 1000 users
 *
 * Optimized implementation:
 * - Uses centralized useBootstrapBanStatus hook
 * - Ban status comes from /api/bootstrap (cached 5 minutes)
 * - Refetch interval: 5 minutes (300000ms) - security appropriate
 * - Shares data with other components using the bootstrap
 * - ~288K invocations/day per 1000 users (90% reduction)
 */
export function BanChecker() {
  const router = useRouter()
  const [showBannedDialog, setShowBannedDialog] = useState(false)
  const hasHandledBan = useRef(false)

  // Use the optimized bootstrap hook with 5-minute refetch interval
  // This is security-appropriate as ban checks don't need to be instant
  const {
    isBanned,
    banReason,
    banDetails,
    bannedAt,
    loading,
    error,
  } = useBootstrapBanStatus({
    refetchInterval: 5 * 60 * 1000, // 5 minutes - appropriate for ban checking
  })

  // Handle ban detection
  useEffect(() => {
    if (loading || hasHandledBan.current) return

    if (isBanned) {
      hasHandledBan.current = true
      setShowBannedDialog(true)

      // Perform logout
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
          // Clear all cached data
          clearBootstrapCache()
        })
        .catch(console.error)
    }
  }, [isBanned, loading])

  // Reset ban handling flag when dialog closes (for edge cases)
  useEffect(() => {
    if (!showBannedDialog) {
      hasHandledBan.current = false
    }
  }, [showBannedDialog])

  function handleClose() {
    setShowBannedDialog(false)
    // Redirect to login
    router.push('/auth/login')
    router.refresh()
  }

  // Don't render anything if not banned
  if (!showBannedDialog) {
    return null
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
                {banReason && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                      Motivo:
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {BanReasonLabels[banReason as BanReason] || banReason}
                    </p>
                  </div>
                )}
                {banDetails && (
                  <div className="space-y-1 mt-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                      Detalhes:
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {banDetails}
                    </p>
                  </div>
                )}
                {bannedAt && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-3">
                    Data do banimento: {new Date(bannedAt).toLocaleDateString('pt-BR')}
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
