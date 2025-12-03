'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { AFYA_UNITS } from '@/lib/afya-units'

interface CompleteProfileModalProps {
  open: boolean
  onComplete: (data: {
    cpf: string
    dateOfBirth: string
    isAfyaMedicineStudent: boolean
    afyaUnit?: string
  }) => Promise<void>
  isLoading: boolean
}

export function CompleteProfileModal({
  open,
  onComplete,
  isLoading,
}: CompleteProfileModalProps) {
  const [cpf, setCpf] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [isAfyaMedicineStudent, setIsAfyaMedicineStudent] = useState(false)
  const [afyaUnit, setAfyaUnit] = useState('')
  const [error, setError] = useState('')

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`
  }

  const validateCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '')
    if (cleaned.length !== 11) return false

    let sum = 0
    let remainder

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false

    sum = 0
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i)
    }

    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      setError('Selecione uma unidade Afya')
      return
    }

    try {
      await onComplete({
        cpf: cpf.replace(/\D/g, ''),
        dateOfBirth,
        isAfyaMedicineStudent,
        afyaUnit: afyaUnit || undefined,
      })
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader>
          <CardTitle>Complete seu Perfil</CardTitle>
          <CardDescription>
            Precisamos de algumas informações para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="XXX.XXX.XXX-XX"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                disabled={isLoading}
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAfyaMedicineStudent}
                  onChange={(e) => {
                    setIsAfyaMedicineStudent(e.target.checked)
                    if (!e.target.checked) setAfyaUnit('')
                  }}
                  disabled={isLoading}
                  className="w-4 h-4"
                />
                Sou estudante de Medicina da Afya
              </Label>
            </div>

            {isAfyaMedicineStudent && (
              <div className="space-y-2">
                <Label htmlFor="afyaUnit">Unidade Afya</Label>
                <select
                  id="afyaUnit"
                  value={afyaUnit}
                  onChange={(e) => setAfyaUnit(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                >
                  <option value="">Selecione uma unidade...</option>
                  {AFYA_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Continuar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
