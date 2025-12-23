'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { AFYA_UNITS } from '@/lib/afya-units'

interface GoogleProfileSetupDialogProps {
  open: boolean
  googleData: {
    email: string
    name?: string
    picture?: string
    googleId: string
  }
  onComplete: (data: {
    profileName: string
    cpf: string
    dateOfBirth: string
    isAfyaMedicineStudent: boolean
    afyaUnit?: string
  }) => void
  onCancel?: () => void
  isLoading?: boolean
}

export function GoogleProfileSetupDialog({
  open,
  googleData,
  onComplete,
  onCancel,
  isLoading = false,
}: GoogleProfileSetupDialogProps) {
  const [profileName, setProfileName] = useState(googleData.name || '')
  const [cpf, setCpf] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isAfyaMedicineStudent, setIsAfyaMedicineStudent] = useState(false)
  const [afyaUnit, setAfyaUnit] = useState('')
  const [error, setError] = useState('')

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return cleaned.slice(0, 11)
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value))
  }

  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return false
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleaned)) return false
    
    // Calcula primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned[i]) * (10 - i)
    }
    let digit1 = 11 - (sum % 11)
    digit1 = digit1 > 9 ? 0 : digit1
    
    // Calcula segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned[i]) * (11 - i)
    }
    let digit2 = 11 - (sum % 11)
    digit2 = digit2 > 9 ? 0 : digit2
    
    return digit1 === parseInt(cleaned[9]) && digit2 === parseInt(cleaned[10])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!profileName.trim()) {
      setError('Nome do perfil é obrigatório')
      return
    }

    if (!cpf.trim()) {
      setError('CPF é obrigatório')
      return
    }

    if (!validateCPF(cpf)) {
      setError('CPF inválido')
      return
    }

    if (!dateOfBirth) {
      setError('Data de nascimento é obrigatória')
      return
    }

    if (isAfyaMedicineStudent && !afyaUnit) {
      setError('Selecione sua unidade Afya')
      return
    }

    onComplete({
      profileName: profileName.trim(),
      cpf: cpf.replace(/\D/g, ''),
      dateOfBirth,
      isAfyaMedicineStudent,
      afyaUnit: isAfyaMedicineStudent ? afyaUnit : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <div className="relative">
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-br from-[#468152]/8 via-background to-[#E2A43E]/10">
            <div className="flex items-start justify-between gap-4">
              <DialogHeader className="p-0 pb-0">
                <DialogTitle>Complete seu Perfil</DialogTitle>
                <DialogDescription>
                  Preencha os dados obrigatórios para continuar
                </DialogDescription>
              </DialogHeader>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Informações do Google */}
          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200/70 dark:border-blue-800/60">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Campo de nome do perfil */}
            <div className="space-y-2">
              <Label htmlFor="profileName">Nome do Perfil *</Label>
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

            {/* Campo de CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                disabled={isLoading}
                maxLength={14}
              />
              <p className="text-xs text-muted-foreground">
                Será usado para validar sua identidade
              </p>
            </div>

            {/* Campo de Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Pergunta sobre Afya */}
            <div className="space-y-3 p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200/70 dark:border-amber-800/60">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Você é estudante de Medicina da Afya?
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isAfyaMedicineStudent ? 'default' : 'outline'}
                  className="flex-1 h-9"
                  onClick={() => setIsAfyaMedicineStudent(true)}
                  disabled={isLoading}
                >
                  Sim
                </Button>
                <Button
                  type="button"
                  variant={!isAfyaMedicineStudent ? 'default' : 'outline'}
                  className="flex-1 h-9"
                  onClick={() => {
                    setIsAfyaMedicineStudent(false)
                    setAfyaUnit('')
                  }}
                  disabled={isLoading}
                >
                  Não
                </Button>
              </div>
            </div>

            {/* Seleção de Unidade Afya */}
            {isAfyaMedicineStudent && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="afyaUnit">Sua Unidade Afya *</Label>
                <select
                  id="afyaUnit"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={afyaUnit}
                  onChange={(e) => setAfyaUnit(e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Selecione sua unidade...</option>
                  {AFYA_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-5">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || !profileName.trim() || !cpf.trim() || !dateOfBirth}
            >
              {isLoading ? 'Criando perfil...' : 'Continuar'}
            </Button>
          </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
