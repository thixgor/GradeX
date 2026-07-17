'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { BRAZIL_STATES } from '@/lib/brazil-states'
import { MEDICAL_SPECIALTIES } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState } from '@/lib/residency-hospitals-brazil'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { SearchableSelect } from '@/components/ui/searchable-select'

type Profession = 'medico' | 'academico' | 'residente'

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
    dateOfBirth: string
    profession: Profession
    state: string
    phone: string
    specialty?: string
    residencySpecialty?: string
    residencyHospital?: string
    residencyYear?: string
    isAfyaMedicineStudent: boolean
    afyaUnit?: string
    periodo?: string
  }) => void
  onCancel?: () => void
  isLoading?: boolean
}

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]'

export function GoogleProfileSetupDialog({
  open,
  googleData,
  onComplete,
  onCancel,
  isLoading = false,
}: GoogleProfileSetupDialogProps) {
  const [profileName, setProfileName] = useState(googleData.name || '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profession, setProfession] = useState<Profession | ''>('')
  const [state, setState] = useState('')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [residencySpecialty, setResidencySpecialty] = useState('')
  const [residencyHospital, setResidencyHospital] = useState('')
  const [residencyYear, setResidencyYear] = useState('')
  const [afyaUnit, setAfyaUnit] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!profileName.trim()) {
      setError('Nome do perfil é obrigatório')
      return
    }

    if (!dateOfBirth) {
      setError('Data de nascimento é obrigatória')
      return
    }

    if (!profession) {
      setError('Selecione se você é médico, acadêmico ou residente')
      return
    }

    if (!state) {
      setError('Selecione seu estado')
      return
    }

    if (!isValidBrazilPhone(phone)) {
      setError('Informe um telefone válido com DDD')
      return
    }

    if (profession === 'medico' && !specialty) {
      setError('Selecione sua especialidade')
      return
    }

    if (profession === 'residente' && (!residencySpecialty || !residencyHospital || !residencyYear)) {
      setError('Preencha os dados da sua residência')
      return
    }

    if (profession === 'academico' && !afyaUnit) {
      setError('Selecione sua unidade')
      return
    }

    onComplete({
      profileName: profileName.trim(),
      dateOfBirth,
      profession,
      state,
      phone,
      specialty: profession === 'medico' ? specialty : undefined,
      residencySpecialty: profession === 'residente' ? residencySpecialty : undefined,
      residencyHospital: profession === 'residente' ? residencyHospital : undefined,
      residencyYear: profession === 'residente' ? residencyYear : undefined,
      isAfyaMedicineStudent: profession === 'academico',
      afyaUnit: profession === 'academico' ? afyaUnit : undefined,
      periodo: periodo || undefined,
    })
  }

  const handleProfessionChange = (value: Profession) => {
    setProfession(value)
    if (value !== 'academico') setAfyaUnit('')
    if (value !== 'medico') setSpecialty('')
    if (value !== 'residente') {
      setResidencySpecialty('')
      setResidencyHospital('')
      setResidencyYear('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => { }}>
      <DialogContent className="max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
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

              {/* Pergunta sobre profissão */}
              <div className="space-y-3 p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200/70 dark:border-amber-800/60 sm:col-span-2">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Você é médico, acadêmico ou residente? *
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { value: 'medico', label: 'Médico' },
                      { value: 'academico', label: 'Acadêmico' },
                      { value: 'residente', label: 'Residente' },
                    ] as const
                  ).map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={profession === opt.value ? 'default' : 'outline'}
                      className="h-9"
                      onClick={() => handleProfessionChange(opt.value)}
                      disabled={isLoading}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <select
                  id="state"
                  className={selectCls}
                  value={state}
                  onChange={(e) => {
                    setState(e.target.value)
                    setAfyaUnit('')
                    setResidencyHospital('')
                  }}
                  disabled={isLoading}
                >
                  <option value="">Selecione seu estado...</option>
                  {BRAZIL_STATES.map((s) => (
                    <option key={s.uf} value={s.uf}>{s.name} ({s.uf})</option>
                  ))}
                </select>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (com DDD) *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 91234-5678"
                  value={phone}
                  onChange={(e) => setPhone(formatBrazilPhone(e.target.value))}
                  disabled={isLoading}
                />
              </div>

              {/* Campo de Período (só para acadêmico) */}
              {profession === 'academico' && (
                <div className="space-y-2">
                  <Label htmlFor="periodo">Período (opcional)</Label>
                  <select
                    id="periodo"
                    className={selectCls}
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Selecione seu período...</option>
                    {PERIODO_OPTIONS.map((p) => (
                      <option key={p} value={p}>{formatPeriodoLabel(p)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Especialidade (médico) */}
              {profession === 'medico' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="specialty">Qual sua especialidade? *</Label>
                  <SearchableSelect
                    id="specialty"
                    value={specialty}
                    onChange={setSpecialty}
                    options={MEDICAL_SPECIALTIES}
                    placeholder="Selecione sua especialidade..."
                    searchPlaceholder="Buscar especialidade..."
                    className={selectCls}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Residência */}
              {profession === 'residente' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="residencySpecialty">Qual sua residência? *</Label>
                    <SearchableSelect
                      id="residencySpecialty"
                      value={residencySpecialty}
                      onChange={setResidencySpecialty}
                      options={MEDICAL_SPECIALTIES}
                      placeholder="Selecione a área..."
                      searchPlaceholder="Buscar área da residência..."
                      className={selectCls}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="residencyYear">Qual ano de residência? *</Label>
                    <select
                      id="residencyYear"
                      className={selectCls}
                      value={residencyYear}
                      onChange={(e) => setResidencyYear(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="">Selecione...</option>
                      {RESIDENCY_YEARS.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="residencyHospital">
                      Hospital da residência {state ? '*' : '(selecione o estado primeiro)'}
                    </Label>
                    <SearchableSelect
                      id="residencyHospital"
                      value={residencyHospital}
                      onChange={setResidencyHospital}
                      options={getResidencyHospitalsByState(state)}
                      placeholder="Selecione o hospital..."
                      searchPlaceholder="Buscar hospital..."
                      className={selectCls}
                      disabled={isLoading || !state}
                    />
                  </div>
                </>
              )}

              {/* Seleção de Unidade (acadêmico) */}
              {profession === 'academico' && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="afyaUnit">
                    Sua Unidade {state ? '*' : '(selecione o estado primeiro)'}
                  </Label>
                  <SearchableSelect
                    id="afyaUnit"
                    value={afyaUnit}
                    onChange={setAfyaUnit}
                    options={getMedicalSchoolsByState(state)}
                    placeholder="Selecione sua instituição..."
                    searchPlaceholder="Buscar sua instituição..."
                    className={selectCls}
                    disabled={isLoading || !state}
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded mt-4">
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
                disabled={isLoading || !profileName.trim() || !dateOfBirth}
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
