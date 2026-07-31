import type { User } from '@/lib/types'

export interface MissingProfileField {
  key: string
  label: string
}

type ProfileFieldsInput = Pick<
  User,
  | 'cpf'
  | 'dateOfBirth'
  | 'phone'
  | 'state'
  | 'profession'
  | 'specialty'
  | 'crm'
  | 'residencySpecialty'
  | 'residencyHospital'
  | 'residencyYear'
  | 'afyaUnit'
  | 'periodoBase'
>

/**
 * Calcula quais dados de perfil "importantes" ainda estão faltando, de
 * acordo com a profissão atual do usuário (médico, acadêmico ou residente).
 * Função pura (sem I/O) — usada pelo lembrete por e-mail (cron), pelo banner
 * em /profile e pelo modal de completar perfil, no cliente e no servidor.
 */
export function getMissingProfileFields(
  user: Partial<ProfileFieldsInput> | null | undefined
): MissingProfileField[] {
  if (!user) return []
  const missing: MissingProfileField[] = []

  if (!user.phone) missing.push({ key: 'phone', label: 'Telefone com DDD' })
  if (!user.state) missing.push({ key: 'state', label: 'Estado' })

  if (!user.profession) {
    missing.push({ key: 'profession', label: 'Se você é médico, acadêmico ou residente' })
    // Sem profissão definida não dá pra saber quais campos específicos checar.
    return missing
  }

  if (user.profession === 'medico') {
    if (!user.specialty) missing.push({ key: 'specialty', label: 'Sua especialidade médica' })
    if (!user.crm) missing.push({ key: 'crm', label: 'Seu CRM' })
  }

  if (user.profession === 'residente') {
    if (!user.residencySpecialty) missing.push({ key: 'residencySpecialty', label: 'Área da sua residência' })
    if (!user.residencyHospital) missing.push({ key: 'residencyHospital', label: 'Hospital da sua residência' })
    if (!user.residencyYear) missing.push({ key: 'residencyYear', label: 'Ano de residência (R1, R2...)' })
    if (!user.crm) missing.push({ key: 'crm', label: 'Seu CRM' })
  }

  if (user.profession === 'academico') {
    if (!user.afyaUnit) missing.push({ key: 'afyaUnit', label: 'Sua faculdade/instituição' })
    if (!user.periodoBase) missing.push({ key: 'periodo', label: 'Seu período' })
  }

  if (!user.cpf) missing.push({ key: 'cpf', label: 'CPF' })
  if (!user.dateOfBirth) missing.push({ key: 'dateOfBirth', label: 'Data de nascimento' })

  return missing
}

/** `true` quando ainda falta algum dado — usado para decidir se o modal abre. */
export function isProfileIncomplete(
  user: Partial<ProfileFieldsInput> | null | undefined
): boolean {
  return getMissingProfileFields(user).length > 0
}
