'use client'

/**
 * "Meus dados" — leitura e edição do perfil, mais a troca de e-mail.
 *
 * Vive fora da página porque o formulário é grande e tem regras próprias
 * (campos que só aparecem por profissão, CPF em somente leitura, CRM+UF).
 * A página só precisa saber do nome, para atualizar o cabeçalho.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { BRAZIL_STATES, formatStateLabel } from '@/lib/brazil-states'
import { MEDICAL_SPECIALTIES, RESIDENCY_AREAS } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState, OTHER_SCHOOL_OPTION } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState, OTHER_HOSPITAL_OPTION } from '@/lib/residency-hospitals-brazil'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { getMissingProfileFields } from '@/lib/profile-completeness'
import { formatCrmLabel, onlyCrmDigits } from '@/lib/crm'
import { cn } from '@/lib/utils'

const PROFESSION_LABELS: Record<string, string> = {
  medico: 'Médico',
  academico: 'Acadêmico',
  residente: 'Residente',
}

export type ProfileFormState = {
  name: string
  phone: string
  state: string
  profession: '' | 'medico' | 'academico' | 'residente'
  specialty: string
  crm: string
  crmUf: string
  residencySpecialty: string
  residencyHospital: string
  residencyYear: string
  afyaUnit: string
  periodo: string
  /** Só leitura: o CPF é definido no modal de completar perfil, com conferência
   *  na Receita Federal, e não pode ser reescrito aqui à mão. */
  cpf: string
  cpfVerified: boolean
}

const EMPTY_PROFILE_FORM: ProfileFormState = {
  name: '',
  phone: '',
  state: '',
  profession: '',
  specialty: '',
  crm: '',
  crmUf: '',
  residencySpecialty: '',
  residencyHospital: '',
  residencyYear: '',
  afyaUnit: '',
  periodo: '',
  cpf: '',
  cpfVerified: false,
}

function Field({
  icon: Icon,
  label,
  value,
  className,
  children,
}: {
  icon: React.ElementType
  label: string
  value?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children ?? (
          <p className="font-medium">
            {value || <span className="font-normal italic text-muted-foreground">Não informado</span>}
          </p>
        )}
      </div>
    </div>
  )
}

export function PersonalDataCard({
  userEmail,
  onNameChange,
  onToast,
  onEmailChanged,
}: {
  userEmail: string
  onNameChange: (name: string) => void
  onToast: (message: string, type?: 'success' | 'error') => void
  onEmailChanged: () => void
}) {
  const [form, setForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM)
  const [loading, setLoading] = useState(true)
  const [emailVerified, setEmailVerified] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [newEmailInput, setNewEmailInput] = useState('')
  const [emailPasswordInput, setEmailPasswordInput] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  useEffect(() => {
    loadProfileData()
  }, [])

  async function loadProfileData() {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        const p = data.profile || {}
        setForm({
          name: p.name || '',
          phone: p.phone || '',
          state: p.state || '',
          profession: p.profession || '',
          specialty: p.specialty || '',
          crm: p.crm || '',
          crmUf: p.crmUf || '',
          residencySpecialty: p.residencySpecialty || '',
          residencyHospital: p.residencyHospital || '',
          residencyYear: p.residencyYear || '',
          afyaUnit: p.afyaUnit || '',
          periodo: p.periodo || '',
          cpf: p.cpf || '',
          cpfVerified: !!p.cpfVerified,
        })
        setEmailVerified(!!p.emailVerified)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (form.phone && !isValidBrazilPhone(form.phone)) {
      onToast('Informe um telefone válido com DDD', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          state: form.state,
          profession: form.profession,
          specialty: form.specialty,
          crm: form.crm,
          crmUf: form.crmUf || form.state,
          residencySpecialty: form.residencySpecialty,
          residencyHospital: form.residencyHospital,
          residencyYear: form.residencyYear,
          afyaUnit: form.afyaUnit,
          periodo: form.periodo,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar dados')
      onToast('Dados atualizados com sucesso!')
      setEditing(false)
      if (form.name) onNameChange(form.name)
      loadProfileData()
    } catch (error: any) {
      onToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeEmail() {
    if (!newEmailInput.trim() || !emailPasswordInput) {
      onToast('Preencha o novo e-mail e sua senha atual', 'error')
      return
    }
    setChangingEmail(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmailInput.trim(), currentPassword: emailPasswordInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao alterar e-mail')
      onToast('E-mail alterado! Confira sua caixa de entrada para confirmar o novo endereço.')
      setChangeEmailOpen(false)
      setNewEmailInput('')
      setEmailPasswordInput('')
      onEmailChanged()
      loadProfileData()
    } catch (error: any) {
      onToast(error.message, 'error')
    } finally {
      setChangingEmail(false)
    }
  }

  const missingFields = useMemo(
    () =>
      getMissingProfileFields({
        phone: form.phone || undefined,
        state: form.state || undefined,
        profession: (form.profession || undefined) as 'medico' | 'academico' | 'residente' | undefined,
        specialty: form.specialty || undefined,
        crm: form.crm || undefined,
        residencySpecialty: form.residencySpecialty || undefined,
        residencyHospital: form.residencyHospital || undefined,
        residencyYear: form.residencyYear || undefined,
        afyaUnit: form.afyaUnit || undefined,
        periodoBase: form.periodo ? Number(form.periodo) : undefined,
        // `cpf` aqui é a máscara vinda do servidor — só serve para saber se existe.
        cpf: form.cpf || undefined,
      }),
    [form],
  )

  const controlClass =
    'flex h-10 w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]'

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="editorial-mark mb-0">Meus dados</h2>
        {!loading && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-opacity hover:opacity-80"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
        )}
      </div>

      {!loading && missingFields.length > 0 && !editing && (
        <div className="mb-4 rounded-lg border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/40">
          <p className="mb-1.5 text-sm font-medium text-amber-900 dark:text-amber-100">
            Falta pouco pra completar seu perfil ✍️
          </p>
          <p className="mb-2 text-xs text-amber-800/90 dark:text-amber-200/80">
            Isso ajuda a gente a te dar uma experiência mais na sua cara: {missingFields.map((f) => f.label).join(', ')}.
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-semibold text-amber-900 underline underline-offset-2 dark:text-amber-100"
          >
            Completar agora
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : !editing ? (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Field icon={Mail} label="E-mail">
              <p className="truncate font-medium">{userEmail}</p>
              {!emailVerified && <span className="text-[11px] text-amber-600 dark:text-amber-400">Não verificado</span>}
              <button
                type="button"
                onClick={() => setChangeEmailOpen(true)}
                className="mt-0.5 block text-[11px] font-semibold text-primary hover:opacity-80"
              >
                Alterar e-mail
              </button>
            </Field>
            <Field icon={Phone} label="Telefone" value={form.phone} />
            <Field icon={MapPin} label="Estado" value={form.state ? formatStateLabel(form.state) : ''} />
            <Field
              icon={Stethoscope}
              label="Profissão"
              value={form.profession ? PROFESSION_LABELS[form.profession] : ''}
            />
            <Field icon={ShieldCheck} label="CPF">
              <p className="flex items-center gap-1.5 font-medium">
                {form.cpf || <span className="font-normal italic text-muted-foreground">Não informado</span>}
                {form.cpfVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3 w-3" />
                    Verificado
                  </span>
                )}
              </p>
            </Field>

            {form.profession === 'medico' && (
              <>
                <Field icon={GraduationCap} label="Especialidade" value={form.specialty} />
                <Field icon={Stethoscope} label="CRM" value={formatCrmLabel(form.crm, form.crmUf)} />
              </>
            )}

            {form.profession === 'residente' && (
              <>
                <Field icon={GraduationCap} label="Área da residência" value={form.residencySpecialty} />
                <Field icon={GraduationCap} label="Ano" value={form.residencyYear} />
                <Field
                  icon={GraduationCap}
                  label="Hospital da residência"
                  value={form.residencyHospital}
                  className="sm:col-span-2"
                />
                <Field icon={Stethoscope} label="CRM" value={formatCrmLabel(form.crm, form.crmUf)} />
              </>
            )}

            {form.profession === 'academico' && (
              <>
                <Field icon={GraduationCap} label="Instituição" value={form.afyaUnit} className="sm:col-span-2" />
                <Field
                  icon={GraduationCap}
                  label="Período"
                  value={form.periodo ? formatPeriodoLabel(Number(form.periodo)) : ''}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="profileName" className="text-xs font-medium text-muted-foreground">
                  Nome
                </Label>
                <Input id="profileName" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profilePhone" className="text-xs font-medium text-muted-foreground">
                  Telefone (com DDD)
                </Label>
                <Input
                  id="profilePhone"
                  type="tel"
                  inputMode="numeric"
                  placeholder="(11) 91234-5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatBrazilPhone(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profileState" className="text-xs font-medium text-muted-foreground">
                Estado
              </Label>
              <select
                id="profileState"
                className={controlClass}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value, afyaUnit: '', residencyHospital: '' })}
              >
                <option value="">Selecione seu estado...</option>
                {BRAZIL_STATES.map((s) => (
                  <option key={s.uf} value={s.uf}>
                    {s.name} ({s.uf})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Você é médico, acadêmico ou residente?</Label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { value: 'medico', label: 'Médico' },
                    { value: 'academico', label: 'Acadêmico' },
                    { value: 'residente', label: 'Residente' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        profession: opt.value,
                        specialty: opt.value === 'medico' ? form.specialty : '',
                        residencySpecialty: opt.value === 'residente' ? form.residencySpecialty : '',
                        residencyHospital: opt.value === 'residente' ? form.residencyHospital : '',
                        residencyYear: opt.value === 'residente' ? form.residencyYear : '',
                        afyaUnit: opt.value === 'academico' ? form.afyaUnit : '',
                      })
                    }
                    className={cn(
                      'h-9 rounded-md border text-sm font-semibold transition-all',
                      form.profession === opt.value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {form.profession === 'medico' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Sua especialidade</Label>
                  <SearchableSelect
                    value={form.specialty}
                    onChange={(v) => setForm({ ...form, specialty: v })}
                    options={MEDICAL_SPECIALTIES}
                    placeholder="Selecione sua especialidade..."
                    searchPlaceholder="Buscar especialidade..."
                    className={controlClass}
                  />
                </div>
                <CrmInputs form={form} setForm={setForm} controlClass={controlClass} />
              </>
            )}

            {form.profession === 'residente' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Sua residência</Label>
                  <SearchableSelect
                    value={form.residencySpecialty}
                    onChange={(v) => setForm({ ...form, residencySpecialty: v })}
                    options={RESIDENCY_AREAS}
                    placeholder="Selecione a área..."
                    searchPlaceholder="Buscar área da residência..."
                    className={controlClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Hospital da residência {form.state ? '' : '(selecione o estado primeiro)'}
                  </Label>
                  <SearchableSelect
                    value={form.residencyHospital}
                    onChange={(v) => setForm({ ...form, residencyHospital: v })}
                    options={getResidencyHospitalsByState(form.state)}
                    placeholder="Selecione o hospital..."
                    searchPlaceholder="Buscar hospital..."
                    customOption={OTHER_HOSPITAL_OPTION}
                    customPlaceholder="Digite o nome do hospital"
                    className={controlClass}
                    disabled={!form.state}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Ano de residência</Label>
                  <select
                    className={controlClass}
                    value={form.residencyYear}
                    onChange={(e) => setForm({ ...form, residencyYear: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {RESIDENCY_YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <CrmInputs form={form} setForm={setForm} controlClass={controlClass} />
              </>
            )}

            {form.profession === 'academico' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Sua unidade {form.state ? '' : '(selecione o estado primeiro)'}
                  </Label>
                  <SearchableSelect
                    value={form.afyaUnit}
                    onChange={(v) => setForm({ ...form, afyaUnit: v })}
                    options={getMedicalSchoolsByState(form.state)}
                    placeholder="Selecione sua instituição..."
                    searchPlaceholder="Buscar sua instituição..."
                    customOption={OTHER_SCHOOL_OPTION}
                    customPlaceholder="Digite o nome da sua instituição"
                    className={controlClass}
                    disabled={!form.state}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Período (opcional)</Label>
                  <select
                    className={controlClass}
                    value={form.periodo}
                    onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  >
                    <option value="">Selecione seu período...</option>
                    {PERIODO_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {formatPeriodoLabel(p)}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false)
                  loadProfileData()
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={changeEmailOpen}
        onOpenChange={(open) => {
          if (!changingEmail) {
            setChangeEmailOpen(open)
            if (!open) {
              setNewEmailInput('')
              setEmailPasswordInput('')
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar e-mail</DialogTitle>
            <DialogDescription>
              Por segurança, confirme sua senha atual. Você receberá um link de confirmação no novo e-mail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newEmail" className="text-xs font-medium text-muted-foreground">
                Novo e-mail
              </Label>
              <Input
                id="newEmail"
                type="email"
                placeholder="novo@email.com"
                value={newEmailInput}
                onChange={(e) => setNewEmailInput(e.target.value)}
                disabled={changingEmail}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentPasswordForEmail" className="text-xs font-medium text-muted-foreground">
                Senha atual
              </Label>
              <Input
                id="currentPasswordForEmail"
                type="password"
                placeholder="••••••••"
                value={emailPasswordInput}
                onChange={(e) => setEmailPasswordInput(e.target.value)}
                disabled={changingEmail}
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setChangeEmailOpen(false)}
              disabled={changingEmail}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button onClick={handleChangeEmail} disabled={changingEmail} className="w-full sm:w-auto">
              {changingEmail ? 'Alterando...' : 'Alterar e-mail'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * CRM + UF. O mesmo par serve para médico e residente, e a UF cai no estado do
 * usuário por padrão — só quem migrou de estado precisa trocar.
 */
function CrmInputs({
  form,
  setForm,
  controlClass,
}: {
  form: ProfileFormState
  setForm: (form: ProfileFormState) => void
  controlClass: string
}) {
  return (
    <div className="grid grid-cols-[1fr_6rem] gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="profileCrm" className="text-xs font-medium text-muted-foreground">
          CRM
        </Label>
        <Input
          id="profileCrm"
          inputMode="numeric"
          placeholder="123456"
          value={form.crm}
          onChange={(e) => setForm({ ...form, crm: onlyCrmDigits(e.target.value) })}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="profileCrmUf" className="text-xs font-medium text-muted-foreground">
          UF
        </Label>
        <select
          id="profileCrmUf"
          className={controlClass}
          value={form.crmUf || form.state}
          onChange={(e) => setForm({ ...form, crmUf: e.target.value })}
        >
          <option value="">--</option>
          {BRAZIL_STATES.map((s) => (
            <option key={s.uf} value={s.uf}>
              {s.uf}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
