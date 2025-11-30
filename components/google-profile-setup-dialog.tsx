'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'

interface GoogleProfileSetupDialogProps {
  open: boolean
  googleData: {
    email: string
    name?: string
    picture?: string
    googleId: string
  }
  onComplete: (profileName: string) => void
  isLoading?: boolean
}

export function GoogleProfileSetupDialog({
  open,
  googleData,
  onComplete,
  isLoading = false,
}: GoogleProfileSetupDialogProps) {
  const [profileName, setProfileName] = useState(googleData.name || '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!profileName.trim()) {
      setError('Nome do perfil é obrigatório')
      return
    }

    onComplete(profileName.trim())
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete seu Perfil</DialogTitle>
          <DialogDescription>
            Defina o nome do seu perfil para continuar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Google */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              {googleData.picture && (
                <img
                  src={googleData.picture}
                  alt={googleData.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {googleData.name || 'Google Account'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                  {googleData.email}
                </p>
              </div>
            </div>
          </div>

          {/* Campo de nome do perfil */}
          <div className="space-y-2">
            <Label htmlFor="profileName">Nome do Perfil</Label>
            <Input
              id="profileName"
              type="text"
              placeholder="Como você quer ser chamado?"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Este é o nome que aparecerá em suas provas e atividades
            </p>
          </div>

          {error && (
            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !profileName.trim()}
          >
            {isLoading ? 'Criando perfil...' : 'Continuar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
