'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, ArrowLeft, BadgeCheck, Building2, Check, GraduationCap,
  Loader2, MapPin, ShieldCheck, Stethoscope, UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { BRAZIL_STATES } from '@/lib/brazil-states'
import { formatBrazilPhone, isValidBrazilPhone } from '@/lib/phone'
import { formatCpf, isValidCpf, onlyCpfDigits } from '@/lib/cpf'
import { onlyCrmDigits, isValidCrmNumber } from '@/lib/crm'
import { PERIODO_OPTIONS, formatPeriodoLabel } from '@/lib/user-periodo'
import { MEDICAL_SPECIALTIES, RESIDENCY_AREAS } from '@/lib/medical-specialties'
import { RESIDENCY_YEARS } from '@/lib/residency-years'
import { getMedicalSchoolsByState, OTHER_SCHOOL_OPTION } from '@/lib/medical-schools-brazil'
import { getResidencyHospitalsByState, OTHER_HOSPITAL_OPTION } from '@/lib/residency-hospitals-brazil'

type Profession = 'medico' | 'academico' | 'residente'

export interface CompleteProfileValues {
  profession?: Profession | ''
  state?: string
  phone?: string
  afyaUnit?: string
  periodo?: string
  specialty?: string
  crm?: string
  crmUf?: string
  residencySpecialty?: string
  residencyHospital?: string
  residencyYear?: string
  fullName?: string
  cpf?: string
}

interface SaveResult {
  ok: boolean
  /** Campo que falhou, para destacar o input certo. */
  field?: string
  error?: string
  officialName?: string
  /** O nome da conta não bate com o CPF: pedir o nome completo. */
  needsFullName?: boolean
}

interface CompleteProfileModalProps {
  open: boolean
  /** Dados já salvos, para o modal abrir preenchido. */
  initialValues?: CompleteProfileValues
  /** Chaves que ainda faltam (vêm de `getMissingProfileFields`). */
  missingFields: string[]
  /** Grava um passo. `finish` marca o perfil como concluído. */
  onSave: (values: CompleteProfileValues, finish: boolean) => Promise<SaveResult>
  /** "Agora não" — adia o modal. Ausente = modal obrigatório. */
  onSnooze?: () => void
  /** Chamado depois da tela de sucesso. */
  onDone: () => void
}

const inputBase =
  'flex h-11 w-full rounded-lg border border-input bg-background text-foreground px-3 py-2 text-base sm:text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:[color-scheme:dark]'

const PROFESSION_CARDS: { value: Profession; label: string; hint: string; Icon: typeof GraduationCap }[] = [
  { value: 'academico', label: 'Estudante', hint: 'Curso a graduação', Icon: GraduationCap },
  { value: 'residente', label: 'Residente', hint: 'Estou na residência', Icon: Stethoscope },
  { value: 'medico', label: 'Médico(a)', hint: 'Já sou formado', Icon: BadgeCheck },
]

/** Rótulo do passo, mostrado no cabeçalho junto do "Passo X de Y". */
type StepId = 'profession' | 'location' | 'context' | 'identity' | 'done'

/** Campos específicos da profissão — se algum falta, o passo "context" entra. */
const CONTEXT_FIELDS = [
  'specialty', 'crm', 'residencySpecialty', 'residencyHospital', 'residencyYear',
  'afyaUnit', 'periodo',
]

/**
 * Monta a trilha de passos a partir do que realmente falta. Quem já respondeu
 * quase tudo e só deve o CPF vê um único passo — reperguntar o que a pessoa já
 * respondeu é a forma mais rápida de fazer ela fechar o modal.
 */
function buildSteps(missingFields: string[]): StepId[] {
  const missing = new Set(missingFields)
  const steps: StepId[] = []

  if (missing.has('profession')) steps.push('profession')
  if (missing.has('phone') || missing.has('state')) steps.push('location')
  // Sem profissão definida ainda não dá pra saber quais campos específicos
  // faltam, então o passo entra por precaução e é preenchido no caminho.
  if (missing.has('profession') || CONTEXT_FIELDS.some((field) => missing.has(field))) {
    steps.push('context')
  }
  if (missing.has('cpf')) steps.push('identity')

  return steps.length > 0 ? steps : ['identity']
}

export function CompleteProfileModal({
  open,
  initialValues,
  missingFields,
  onSave,
  onSnooze,
  onDone,
}: CompleteProfileModalProps) {
  const [values, setValues] = useState<CompleteProfileValues>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState('')
  const [officialName, setOfficialName] = useState('')
  // Só entra em cena quando a Receita diz que o nome da conta não é o do
  // titular do CPF — aí o campo de nome completo aparece.
  const [needsFullName, setNeedsFullName] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues({ ...initialValues })
    setStepIndex(0)
    setError('')
    setErrorField('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Trava o scroll do fundo enquanto o modal está aberto — sem isso, no mobile
  // o dedo arrasta a página atrás em vez do conteúdo do modal.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const profession = values.profession || ''

  // A trilha é fechada quando o modal abre e não muda no meio do caminho — a
  // barra de progresso andando para trás porque o usuário trocou de profissão
  // é pior do que um passo a mais.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const steps = useMemo(() => buildSteps(missingFields), [open])
  const currentStep = steps[stepIndex] ?? 'identity'
  const totalSteps = steps.length
  const isDone = stepIndex >= totalSteps

  const institutionOptions = useMemo(
    () => getMedicalSchoolsByState(values.state),
    [values.state]
  )
  const hospitalOptions = useMemo(
    () => getResidencyHospitalsByState(values.state),
    [values.state]
  )

  function update(patch: CompleteProfileValues) {
    setValues((prev) => ({ ...prev, ...patch }))
    setError('')
    setErrorField('')
  }

  /** Valida o passo atual no cliente. Retorna a mensagem, ou '' se estiver ok. */
  function validateStep(): { message: string; field: string } | null {
    if (currentStep === 'profession' && !profession) {
      return { message: 'Escolha uma das opções para continuar.', field: 'profession' }
    }

    if (currentStep === 'location') {
      if (!values.state) return { message: 'Selecione seu estado.', field: 'state' }
      if (!isValidBrazilPhone(values.phone || '')) {
        return { message: 'Digite seu telefone com DDD.', field: 'phone' }
      }
    }

    if (currentStep === 'context') {
      if (profession === 'academico') {
        if (!values.afyaUnit) return { message: 'Selecione sua faculdade.', field: 'afyaUnit' }
        if (!values.periodo) return { message: 'Selecione seu período.', field: 'periodo' }
      }
      if (profession === 'medico') {
        if (!values.specialty) return { message: 'Selecione sua especialidade.', field: 'specialty' }
        if (!isValidCrmNumber(values.crm || '')) {
          return { message: 'Digite seu CRM (4 a 7 dígitos).', field: 'crm' }
        }
      }
      if (profession === 'residente') {
        if (!values.residencySpecialty) {
          return { message: 'Selecione a área da sua residência.', field: 'residencySpecialty' }
        }
        if (!values.residencyYear) {
          return { message: 'Selecione o ano da residência.', field: 'residencyYear' }
        }
        if (!values.residencyHospital) {
          return { message: 'Selecione o hospital da residência.', field: 'residencyHospital' }
        }
        if (!isValidCrmNumber(values.crm || '')) {
          return { message: 'Digite seu CRM (4 a 7 dígitos).', field: 'crm' }
        }
      }
    }

    if (currentStep === 'identity') {
      if (!isValidCpf(values.cpf || '')) {
        return { message: 'CPF inválido. Confira os números.', field: 'cpf' }
      }
      // O nome completo só é exigido depois que o servidor avisa que o nome da
      // conta não bate com o titular do CPF (ver `needsFullName`).
      if (needsFullName) {
        const nameWords = (values.fullName || '').trim().split(/\s+/).filter(Boolean)
        if (nameWords.length < 2) {
          return { message: 'Digite seu nome completo, como está no CPF.', field: 'fullName' }
        }
      }
    }

    return null
  }

  /** Só o que este passo coleta — o servidor grava incrementalmente. */
  function stepPayload(): CompleteProfileValues {
    if (currentStep === 'profession') return { profession }
    if (currentStep === 'location') return { state: values.state, phone: values.phone }
    if (currentStep === 'context') {
      if (profession === 'academico') return { afyaUnit: values.afyaUnit, periodo: values.periodo }
      if (profession === 'medico') {
        return { specialty: values.specialty, crm: values.crm, crmUf: values.crmUf || values.state }
      }
      return {
        residencySpecialty: values.residencySpecialty,
        residencyYear: values.residencyYear,
        residencyHospital: values.residencyHospital,
        crm: values.crm,
        crmUf: values.crmUf || values.state,
      }
    }
    return {
      cpf: onlyCpfDigits(values.cpf || ''),
      ...(needsFullName ? { fullName: values.fullName } : {}),
    }
  }

  async function handleNext() {
    const invalid = validateStep()
    if (invalid) {
      setError(invalid.message)
      setErrorField(invalid.field)
      return
    }

    setSaving(true)
    setError('')
    setErrorField('')
    const lastStep = stepIndex === totalSteps - 1
    const result = await onSave(stepPayload(), lastStep)
    setSaving(false)

    if (!result.ok) {
      setError(result.error || 'Não conseguimos salvar. Tente de novo.')
      setErrorField(result.field || '')
      if (result.needsFullName) setNeedsFullName(true)
      return
    }

    if (result.officialName) setOfficialName(result.officialName)
    setStepIndex((index) => index + 1)
  }

  function handleBack() {
    setError('')
    setErrorField('')
    setStepIndex((index) => Math.max(0, index - 1))
  }

  if (!open) return null

  const fieldClass = (field: string) =>
    `${inputBase} ${errorField === field ? 'border-destructive focus-visible:ring-destructive' : ''}`

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="complete-profile-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
      >
        {isDone ? (
          <SuccessPanel officialName={officialName} onDone={onDone} />
        ) : (
          <>
            <header className="border-b border-border bg-muted/40 px-5 py-4 sm:px-6">
              <div className="mb-3 flex items-center gap-1.5">
                {steps.map((step, index) => (
                  <span
                    key={step}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index <= stepIndex ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Passo {stepIndex + 1} de {totalSteps}
              </p>
              <h2
                id="complete-profile-title"
                className="mt-0.5 text-lg font-semibold text-foreground sm:text-xl"
              >
                {STEP_TITLES[currentStep].title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {STEP_TITLES[currentStep].subtitle}
              </p>
            </header>

            <form
              className="flex-1 overflow-y-auto px-5 py-5 sm:px-6"
              onSubmit={(event) => {
                event.preventDefault()
                if (!saving) handleNext()
              }}
            >
              {currentStep === 'profession' && (
                <div className="grid gap-3">
                  {PROFESSION_CARDS.map(({ value, label, hint, Icon }) => {
                    const selected = profession === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update({ profession: value })}
                        className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40 hover:bg-muted/50'
                        }`}
                      >
                        <span
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${
                            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-semibold text-foreground">{label}</span>
                          <span className="block text-sm text-muted-foreground">{hint}</span>
                        </span>
                        {selected && <Check className="h-5 w-5 flex-shrink-0 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              )}

              {currentStep === 'location' && (
                <div className="space-y-4">
                  <Field label="Seu estado" icon={<MapPin className="h-4 w-4" />} htmlFor="state">
                    <select
                      id="state"
                      className={fieldClass('state')}
                      value={values.state || ''}
                      onChange={(event) => update({
                        state: event.target.value,
                        // A instituição e o hospital dependem do estado.
                        afyaUnit: '',
                        residencyHospital: '',
                      })}
                      disabled={saving}
                    >
                      <option value="">Selecione...</option>
                      {BRAZIL_STATES.map((state) => (
                        <option key={state.uf} value={state.uf}>
                          {state.name} ({state.uf})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field
                    label="Seu WhatsApp"
                    htmlFor="phone"
                    hint="É por aqui que avisamos sobre material novo e sua turma."
                  >
                    <input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      placeholder="(11) 91234-5678"
                      className={fieldClass('phone')}
                      value={values.phone || ''}
                      onChange={(event) => update({ phone: formatBrazilPhone(event.target.value) })}
                      disabled={saving}
                    />
                  </Field>
                </div>
              )}

              {currentStep === 'context' && profession === 'academico' && (
                <div className="space-y-4">
                  <Field label="Sua faculdade" icon={<Building2 className="h-4 w-4" />} htmlFor="afyaUnit">
                    <SearchableSelect
                      id="afyaUnit"
                      value={values.afyaUnit || ''}
                      onChange={(value) => update({ afyaUnit: value })}
                      options={institutionOptions}
                      placeholder="Buscar sua faculdade..."
                      searchPlaceholder="Digite o nome ou a sigla"
                      customOption={OTHER_SCHOOL_OPTION}
                      customPlaceholder="Digite o nome da sua faculdade"
                      className={fieldClass('afyaUnit')}
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Seu período" htmlFor="periodo">
                    <select
                      id="periodo"
                      className={fieldClass('periodo')}
                      value={values.periodo || ''}
                      onChange={(event) => update({ periodo: event.target.value })}
                      disabled={saving}
                    >
                      <option value="">Selecione...</option>
                      {PERIODO_OPTIONS.map((periodo) => (
                        <option key={periodo} value={periodo}>
                          {formatPeriodoLabel(periodo)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}

              {currentStep === 'context' && profession === 'medico' && (
                <div className="space-y-4">
                  <Field label="Sua especialidade" htmlFor="specialty">
                    <SearchableSelect
                      id="specialty"
                      value={values.specialty || ''}
                      onChange={(value) => update({ specialty: value })}
                      options={MEDICAL_SPECIALTIES}
                      placeholder="Buscar especialidade..."
                      searchPlaceholder="Digite a especialidade"
                      className={fieldClass('specialty')}
                      disabled={saving}
                    />
                  </Field>
                  <CrmFields
                    values={values}
                    update={update}
                    saving={saving}
                    fieldClass={fieldClass}
                  />
                </div>
              )}

              {currentStep === 'context' && profession === 'residente' && (
                <div className="space-y-4">
                  <Field label="Área da residência" htmlFor="residencySpecialty">
                    <SearchableSelect
                      id="residencySpecialty"
                      value={values.residencySpecialty || ''}
                      onChange={(value) => update({ residencySpecialty: value })}
                      options={RESIDENCY_AREAS}
                      placeholder="Buscar área..."
                      searchPlaceholder="Digite a área"
                      className={fieldClass('residencySpecialty')}
                      disabled={saving}
                    />
                  </Field>

                  <Field label="Ano da residência" htmlFor="residencyYear">
                    <div className="grid grid-cols-6 gap-2">
                      {RESIDENCY_YEARS.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => update({ residencyYear: year })}
                          disabled={saving}
                          className={`h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                            values.residencyYear === year
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border text-foreground hover:border-primary/40'
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Hospital da residência" htmlFor="residencyHospital">
                    <SearchableSelect
                      id="residencyHospital"
                      value={values.residencyHospital || ''}
                      onChange={(value) => update({ residencyHospital: value })}
                      options={hospitalOptions}
                      placeholder="Buscar hospital..."
                      searchPlaceholder="Digite o nome do hospital"
                      customOption={OTHER_HOSPITAL_OPTION}
                      customPlaceholder="Digite o nome do hospital"
                      className={fieldClass('residencyHospital')}
                      disabled={saving}
                    />
                  </Field>

                  <CrmFields
                    values={values}
                    update={update}
                    saving={saving}
                    fieldClass={fieldClass}
                  />
                </div>
              )}

              {currentStep === 'identity' && (
                <div className="space-y-4">
                  <Field label="Seu CPF" icon={<UserRound className="h-4 w-4" />} htmlFor="cpf">
                    <input
                      id="cpf"
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      placeholder="000.000.000-00"
                      className={fieldClass('cpf')}
                      value={values.cpf || ''}
                      onChange={(event) => update({ cpf: formatCpf(event.target.value) })}
                      disabled={saving}
                    />
                  </Field>

                  {needsFullName && (
                    <Field
                      label="Nome completo"
                      htmlFor="fullName"
                      hint="Escreva igual ao que está no seu CPF."
                    >
                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        autoFocus
                        placeholder="Maria Aparecida de Souza"
                        className={fieldClass('fullName')}
                        value={values.fullName || ''}
                        onChange={(event) => update({ fullName: event.target.value })}
                        disabled={saving}
                      />
                    </Field>
                  )}

                  {/* Escondido quando o nome é pedido: aí o espaço é do erro,
                      que precisa ficar colado no campo que falhou. */}
                  {!needsFullName && (
                    <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      Conferimos na Receita Federal só para confirmar que é você. Seu CPF
                      fica com a gente e não aparece para outros usuários.
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Submit escondido: dá Enter no teclado do celular. */}
              <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
            </form>

            <footer className="flex items-center gap-3 border-t border-border px-5 py-4 sm:px-6">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  disabled={saving}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                className="h-11 flex-1 text-base"
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : stepIndex === totalSteps - 1 ? (
                  'Concluir'
                ) : (
                  'Continuar'
                )}
              </Button>
            </footer>

            {onSnooze && (
              <button
                type="button"
                onClick={onSnooze}
                disabled={saving}
                className="border-t border-border py-3 text-center text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Agora não
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const STEP_TITLES: Record<StepId, { title: string; subtitle: string }> = {
  profession: {
    title: 'Você é estudante, residente ou médico?',
    subtitle: 'Assim mostramos o conteúdo certo pra você.',
  },
  location: {
    title: 'Onde a gente te encontra?',
    subtitle: 'Leva 10 segundos.',
  },
  context: {
    title: 'Conta mais sobre você',
    subtitle: 'Últimos detalhes do seu perfil acadêmico.',
  },
  identity: {
    title: 'Falta só o seu CPF',
    subtitle: 'É exigência do cadastro da plataforma. Um campo e acabou.',
  },
  done: { title: 'Pronto!', subtitle: '' },
}

/** Rótulo + campo + dica, com espaçamento consistente em todos os passos. */
function Field({
  label,
  htmlFor,
  hint,
  icon,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** CRM + UF — o mesmo par serve para médico e residente. */
function CrmFields({
  values,
  update,
  saving,
  fieldClass,
}: {
  values: CompleteProfileValues
  update: (patch: CompleteProfileValues) => void
  saving: boolean
  fieldClass: (field: string) => string
}) {
  return (
    <div className="grid grid-cols-[1fr_7rem] gap-3">
      <Field label="Seu CRM" htmlFor="crm">
        <input
          id="crm"
          type="text"
          inputMode="numeric"
          placeholder="123456"
          className={fieldClass('crm')}
          value={values.crm || ''}
          onChange={(event) => update({ crm: onlyCrmDigits(event.target.value) })}
          disabled={saving}
        />
      </Field>
      <Field label="UF" htmlFor="crmUf">
        <select
          id="crmUf"
          className={fieldClass('crmUf')}
          value={values.crmUf || values.state || ''}
          onChange={(event) => update({ crmUf: event.target.value })}
          disabled={saving}
        >
          {BRAZIL_STATES.map((state) => (
            <option key={state.uf} value={state.uf}>
              {state.uf}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

function SuccessPanel({ officialName, onDone }: { officialName: string; onDone: () => void }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
        <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Perfil completo!</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {officialName
          ? `Confirmamos seus dados na Receita Federal, ${firstName(officialName)}.`
          : 'Obrigado — agora é só continuar estudando.'}
      </p>
      <Button className="mt-6 h-11 w-full text-base" onClick={onDone}>
        Continuar
      </Button>
    </div>
  )
}

function firstName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || ''
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}
