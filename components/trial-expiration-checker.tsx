'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Mail, Phone, Ticket } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function TrialExpirationChecker() {
  const router = useRouter()
  const [showExpiredDialog, setShowExpiredDialog] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    async function checkTrialStatus() {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          // Se não houver usuário autenticado, parar os checks
          setIsChecking(false)
          if (intervalId) {
            clearInterval(intervalId)
            intervalId = null
          }
          return
        }

        const data = await res.json()
        const user = data.user

        // Verificar se é Trial e se expirou
        if (user?.accountType === 'trial' && user?.trialExpiresAt) {
          const now = new Date()
          const expiresAt = new Date(user.trialExpiresAt)

          if (now > expiresAt) {
            // Expirar automaticamente o usuário
            await expireUser()
            setShowExpiredDialog(true)
            // Parar os checks após expiração
            if (intervalId) {
              clearInterval(intervalId)
              intervalId = null
            }
          }
        }

        setIsChecking(false)
      } catch (error) {
        console.error('Erro ao verificar status do trial:', error)
        setIsChecking(false)
        // Parar os checks em caso de erro
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      }
    }

    async function startChecking() {
      // Verificar autenticação antes de iniciar
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          // Se não houver usuário, não iniciar os checks
          setIsChecking(false)
          return
        }
      } catch {
        setIsChecking(false)
        return
      }

      // Verificar imediatamente
      await checkTrialStatus()

      // Verificar a cada 1 minuto apenas se autenticado
      intervalId = setInterval(checkTrialStatus, 60000)
    }

    startChecking()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  }, [])

  async function expireUser() {
    try {
      await fetch('/api/user/cancel-subscription', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Erro ao expirar usuário:', error)
    }
  }

  function handleCreateTicket() {
    setShowExpiredDialog(false)
    router.push('/tickets')
  }

  if (isChecking) {
    return null
  }

  return (
    <Dialog open={showExpiredDialog} onOpenChange={setShowExpiredDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">Trial Expirado</DialogTitle>
          <DialogDescription className="text-center text-base">
            Seu período de trial chegou ao fim. Para continuar usando todos os recursos da plataforma, entre em contato com a administração.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Telefone/WhatsApp</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">(21) 99777-0936</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">throdrigf@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-4">
            Se você acredita que isso é um erro, abra um ticket com a administração.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowExpiredDialog(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            onClick={handleCreateTicket}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Abrir Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
