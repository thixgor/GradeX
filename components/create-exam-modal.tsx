'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { FileText, Users, Sparkles } from 'lucide-react'

interface CreateExamModalProps {
  open: boolean
  onClose: () => void
  isAdmin: boolean
  tierLimitExceeded?: boolean
}

export function CreateExamModal({
  open,
  onClose,
  isAdmin,
  tierLimitExceeded,
}: CreateExamModalProps) {
  const router = useRouter()

  const handleCreatePersonal = () => {
    if (tierLimitExceeded) {
      alert(`Você atingiu seu limite de criação de provas.
Faça upgrade para Premium para 10 provas por dia com até 20 questões por prova.

Contato: (21) 99777-0936`)
      return
    }
    router.push('/exams/create-personal')
    onClose()
  }

  const handleCreateGeneral = () => {
    router.push('/admin/exams/create')
    onClose()
  }

  // If not admin, don't show modal - just redirect
  if (!isAdmin) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Criar Nova Prova</DialogTitle>
          <DialogDescription className="text-center">
            Escolha o tipo de prova que deseja criar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Prova Geral */}
          <button
            onClick={handleCreateGeneral}
            className="group relative flex items-start gap-4 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-200"
          >
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">
                Prova Geral
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma prova visível para todos os usuários. Ideal para simulados e avaliações em grupo.
              </p>
            </div>
          </button>

          {/* Prova Pessoal */}
          <button
            onClick={handleCreatePersonal}
            disabled={tierLimitExceeded}
            className="group relative flex items-start gap-4 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-lg text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200">
                Prova Pessoal
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma prova personalizada com questões geradas por IA. Visível apenas para você.
              </p>
              {tierLimitExceeded && (
                <p className="text-xs text-red-500 mt-2">
                  Limite diário atingido. Faça upgrade para continuar.
                </p>
              )}
            </div>
          </button>
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
